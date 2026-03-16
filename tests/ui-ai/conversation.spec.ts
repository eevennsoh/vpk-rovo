import { expect, test } from "@playwright/test";

const CONVERSATION_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/components/ui-ai/conversation`;

test("conversation docs preview exposes markdown download", async ({ page }) => {
	await page.goto(CONVERSATION_URL, { waitUntil: "networkidle" });

	const downloadButton = page.getByRole("button", {
		name: /download conversation/i,
	});

	await expect(downloadButton).toBeVisible();

	const downloadPromise = page.waitForEvent("download");
	await downloadButton.click();
	const download = await downloadPromise;

	expect(download.suggestedFilename()).toBe("conversation.md");
});
