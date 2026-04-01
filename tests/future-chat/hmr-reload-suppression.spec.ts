import { expect, test, type ConsoleMessage, type Page, type Response } from "@playwright/test";

const FUTURE_CHAT_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
}/future-chat`;

const COMPOSER_PLACEHOLDER = "Ask, @mention, or / for skills";

async function gotoFreshFutureChat(page: Page) {
	await page.goto(FUTURE_CHAT_URL, { waitUntil: "networkidle" });

	const newChatButton = page.getByRole("button", { name: /new chat/i });
	if (await newChatButton.isVisible().catch(() => false)) {
		await newChatButton.click();
	}

	await expect(page.getByPlaceholder(COMPOSER_PLACEHOLDER)).toBeVisible();
}

async function submitPrompt(page: Page, prompt: string) {
	const responsePromise = page.waitForResponse((response: Response) => {
		return response.url().includes("/api/future-chat/chat")
			&& response.request().method() === "POST";
	});

	await page.getByPlaceholder(COMPOSER_PLACEHOLDER).fill(prompt);
	await page.getByRole("button", { name: /^submit$/i }).click();

	const response = await responsePromise;
	await response.text();
	await expect(page.getByTestId("message-assistant").last()).toBeVisible();
}

test("streaming a chat response does not throw a location.reload runtime error", async ({
	page,
}) => {
	const pageErrors: string[] = [];
	const consoleErrors: string[] = [];

	page.on("pageerror", (error) => {
		pageErrors.push(error.message);
	});

	page.on("console", (message: ConsoleMessage) => {
		if (message.type() === "error") {
			consoleErrors.push(message.text());
		}
	});

	await gotoFreshFutureChat(page);
	await submitPrompt(page, "hello");

	const combinedErrors = [...pageErrors, ...consoleErrors].join("\n");

	expect(combinedErrors).not.toContain(
		"Cannot assign to read only property 'reload'",
	);
	expect(combinedErrors).not.toContain("use-hmr-reload-suppression");
});
