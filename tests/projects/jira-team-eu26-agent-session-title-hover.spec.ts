import { expect, test } from "@playwright/test";

const JIRA_TEAM_EU26_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-team-eu26";

test("long session titles stay one line while revealing actions", async ({ page }) => {
	await page.goto(JIRA_TEAM_EU26_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({
		timeout: 15_000,
	});
	const row = page.getByTestId("agent-session-row-lw-rehearsal-pager-session");
	if (!await row.isVisible()) {
		await page
			.getByRole("button", { name: "Unlink sessions column options" })
			.evaluate((element) => (element as HTMLButtonElement).click());
		await page
			.getByRole("menuitem", { name: "Expand" })
			.evaluate((element) => (element as HTMLElement).click());
	}
	await expect(row).toBeVisible();
	await row.scrollIntoViewIfNeeded();
	const article = row.locator("article");
	const title = row.locator("[data-agent-list-title]");
	const actions = row.locator("[data-agent-list-card-actions]");
	const restingRowBox = await row.boundingBox();
	const restingTitleBox = await title.boundingBox();
	expect(restingRowBox).not.toBeNull();
	expect(restingTitleBox).not.toBeNull();
	if (!restingRowBox || !restingTitleBox) return;

	expect(restingTitleBox.height).toBe(20);
	await expect(title).toHaveCSS("white-space", "nowrap");
	await expect(title).toHaveCSS("text-overflow", "ellipsis");
	await expect(actions).toHaveCSS("position", "absolute");
	await expect(actions).toHaveCSS("opacity", "0");
	await page.mouse.move(
		restingTitleBox.x + restingTitleBox.width / 2,
		restingTitleBox.y + restingTitleBox.height / 2,
	);
	await expect(title).toBeVisible();
	await expect(title).toHaveCSS("opacity", "1");
	await expect(title).toHaveCSS("white-space", "nowrap");
	await expect(title).toHaveCSS("text-overflow", "ellipsis");
	await expect(actions).toHaveCSS("opacity", "1");
	expect((await title.boundingBox())?.width).toBeLessThan(restingTitleBox.width);
	await expect(
		row.getByRole("button", { name: /^More actions for How to hold the pager/u }),
	).toBeVisible();
	expect(await article.evaluate((element) => element.matches(":hover"))).toBe(true);
	expect((await row.boundingBox())?.height).toBe(restingRowBox.height);
	await page.waitForTimeout(200);
	expect(await article.evaluate((element) => element.matches(":hover"))).toBe(true);
});
