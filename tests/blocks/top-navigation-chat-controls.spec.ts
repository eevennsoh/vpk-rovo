import { expect, test } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

for (const route of ["/jira-team-eu26", "/confluence"]) {
	test(`shared chat controls preserve navigation and draft behavior on ${route}`, async ({ page }) => {
		test.setTimeout(60_000);
		await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
		const toggle = page.getByRole("button", { name: "Ask Rovo", exact: true });
		await expect(toggle).toBeVisible({ timeout: 30_000 });
		await expect(toggle).toHaveAttribute("aria-pressed", "false");
		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		const composer = page.getByRole("textbox", { name: "Chat message input", exact: true });
		await expect(composer).toBeVisible();
		await composer.fill("Shared navigation draft");
		await toggle.click();
		await expect(toggle).toHaveAttribute("aria-pressed", "false");
		await expect(composer).not.toBeVisible();
		await toggle.click();
		await expect(composer).toContainText("Shared navigation draft");
	});
}


test("shared surface controls open and close the original Golden Journeys floating chat", async ({ page }) => {
	test.setTimeout(60_000);
	await page.goto(`${origin}/jira-golden-journeys-v0`, { waitUntil: "domcontentloaded" });
	await page.getByRole("button", { name: "Select Kanban", exact: true }).click();
	await page.getByRole("button", { name: "Open Rovo chat", exact: true }).click();
	const chat = page.locator('[data-rovo-chat-placement="floating"]');
	await expect(chat).toBeVisible();
	await expect(chat.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
	await chat.getByRole("button", { name: "Close", exact: true }).click();
	await expect(chat).not.toBeVisible();
	await expect(page.getByRole("button", { name: "Open Rovo chat", exact: true })).toBeVisible();
});
