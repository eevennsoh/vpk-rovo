import { expect, test } from "@playwright/test";

const JSX_PREVIEW_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/components/ui-ai/jsx-preview`;

const RENDER_PHASE_WARNING =
	"Cannot update a component (`JSXPreview`) while rendering a different component (`JsxParser`)";

test("jsx preview error demo avoids render-phase state updates", async ({
	page,
}) => {
	const consoleErrors: string[] = [];

	page.on("console", (message) => {
		if (message.type() === "error") {
			consoleErrors.push(message.text());
		}
	});

	page.on("pageerror", (error) => {
		consoleErrors.push(error.message);
	});

	await page.goto(JSX_PREVIEW_URL, { waitUntil: "networkidle" });

	const errorDemo = page.locator("div.w-full.rounded-md.border", {
		has: page.getByText(/Preview .* Error state/),
	});

	await expect(errorDemo).toBeVisible();
	await expect(errorDemo.locator(".text-destructive").first()).toBeVisible();
	expect(
		consoleErrors.filter((message) => message.includes(RENDER_PHASE_WARNING)),
	).toEqual([]);
});
