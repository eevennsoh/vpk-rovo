import { expect, test } from "@playwright/test";

const JIRA_TEAM_EU26_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-team-eu26";

test("long session titles keep their hover hit area while revealing actions", async ({ page }) => {
	await page.goto(JIRA_TEAM_EU26_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({
		timeout: 15_000,
	});
	const row = page.getByTestId("agent-session-row-lw-rehearsal-pager-session");
	if (!await row.isVisible()) {
		await page
			.getByRole("button", { name: "Unattached sessions column options" })
			.evaluate((element) => (element as HTMLButtonElement).click());
		await page
			.getByRole("menuitem", { name: "Expand" })
			.evaluate((element) => (element as HTMLElement).click());
	}
	await expect(row).toBeVisible();
	await row.scrollIntoViewIfNeeded();
	const article = row.locator("article");
	const layoutTitle = row.locator("[data-agent-list-title-layout]");
	const hoverTitle = row.locator("[data-agent-list-title-hover]");
	const restingRowBox = await row.boundingBox();
	const restingTitleBox = await layoutTitle.boundingBox();
	expect(restingRowBox).not.toBeNull();
	expect(restingTitleBox).not.toBeNull();
	if (!restingRowBox || !restingTitleBox) return;

	expect(restingTitleBox.height).toBeGreaterThan(20);
	await expect(layoutTitle).toHaveCSS("white-space", "normal");
	await expect(hoverTitle).toHaveCSS("opacity", "0");
	await page.mouse.move(
		restingTitleBox.x + restingTitleBox.width / 2,
		restingTitleBox.y + restingTitleBox.height - 2,
	);
	await expect(hoverTitle).toHaveCSS("opacity", "1");
	await expect(hoverTitle).toHaveCSS("text-overflow", "ellipsis");
	await expect(
		row.getByRole("button", { name: /^More actions for How to hold the pager/u }),
	).toBeVisible();
	expect(await article.evaluate((element) => element.matches(":hover"))).toBe(true);
	expect((await row.boundingBox())?.height).toBe(restingRowBox.height);
	await page.waitForTimeout(200);
	expect(await article.evaluate((element) => element.matches(":hover"))).toBe(true);
});
