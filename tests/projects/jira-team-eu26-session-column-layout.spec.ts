import { expect, test, type Page } from "@playwright/test";

const JIRA_TEAM_EU26_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/jira-team-eu26";
const JIRA_TEAM_EU26_EMBEDDED_URL = (
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
) + "/preview/projects/jira-team-eu26?embedded=1";

async function openBoard(page: Page): Promise<void> {
	await page.goto(JIRA_TEAM_EU26_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({
		timeout: 15_000,
	});
	const expandUntracked = page.getByRole("button", { name: "Unattached sessions column options" });
	if (await expandUntracked.isVisible()) {
		await revealCollapsedAgentSessionColumn(page);
		await expandUntracked.click();
		await page.getByRole("menuitem", { name: "Pin" }).click();
		await page.getByRole("button", { name: "Unattached sessions column options" }).click();
		await page.getByRole("menuitem", { name: "Expand" }).click();
	}
	await expect(
		page.locator("[data-agent-session-column]").getByTestId("agent-session-row-lw-scope-thread"),
	).toBeVisible();
}

async function openCollapsedBoard(page: Page): Promise<void> {
	await page.goto(JIRA_TEAM_EU26_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({
		timeout: 15_000,
	});
	await expect(page.getByRole("button", { name: "Unattached sessions column options" })).toBeVisible();
}

async function revealCollapsedAgentSessionColumn(page: Page): Promise<void> {
	const hitArea = page.locator("[data-agent-session-column-hit-area]");
	const hitAreaBox = await hitArea.boundingBox();
	expect(hitAreaBox).not.toBeNull();
	if (!hitAreaBox) return;

	await page.mouse.move(
		hitAreaBox.x + hitAreaBox.width / 2,
		hitAreaBox.y + hitAreaBox.height / 2,
	);
	await expect(hitArea).toHaveCount(0);
}

test("hovering the leading gutter stays open without bouncing under a stationary pointer", async ({ page }) => {
	await page.goto(JIRA_TEAM_EU26_EMBEDDED_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible();
	const gutter = await page.locator("[data-agent-session-column-hit-area]").boundingBox();
	if (!gutter) throw new Error("Expected the leading gutter");
	const origin = await page.evaluate(() => ({
		left: document.querySelector('[data-jira-kanban-column="To do"]')!.getBoundingClientRect().left,
		rail: document.querySelector("[data-agent-session-column]")!.getBoundingClientRect().left,
	}));
	await page.mouse.move(gutter.x + 2, gutter.y + 30);
	const samples = await page.evaluate(async () => {
		const values: { open: boolean; left: number; rail: number }[] = [];
		const started = performance.now();
		while (performance.now() - started < 650) {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
			values.push({
				open: !document.querySelector("[data-agent-session-column-hit-area]"),
				left: document.querySelector('[data-jira-kanban-column="To do"]')!.getBoundingClientRect().left,
				rail: document.querySelector("[data-agent-session-column]")!.getBoundingClientRect().left,
			});
		}
		return values;
	});
	expect(samples.slice(2).every((sample) => sample.open)).toBe(true);
	for (let index = 1; index < samples.length; index++) {
		expect(samples[index].left).toBeGreaterThanOrEqual(samples[index - 1].left - 0.5);
	}
	const settled = samples[samples.length - 1];
	for (const sample of samples) {
		const boardProgress = (sample.left - origin.left) / (settled.left - origin.left);
		const railProgress = (sample.rail - origin.rail) / (settled.rail - origin.rail);
		expect(Math.abs(boardProgress - railProgress)).toBeLessThan(0.15);
	}
	await page.getByRole("heading", { name: "Jira Design" }).hover();
	await expect(page.locator("[data-agent-session-column-hit-area]")).toHaveCount(1);
	const exitSamples = await page.evaluate(async () => {
		const values: { left: number; rail: number }[] = [];
		const started = performance.now();
		while (performance.now() - started < 300) {
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
			values.push({
				left: document.querySelector('[data-jira-kanban-column="To do"]')!.getBoundingClientRect().left,
				rail: document.querySelector("[data-agent-session-column]")!.getBoundingClientRect().left,
			});
		}
		return values;
	});
	for (let index = 0; index < exitSamples.length; index++) {
		const sample = exitSamples[index];
		const boardProgress = (sample.left - origin.left) / (settled.left - origin.left);
		const railProgress = (sample.rail - origin.rail) / (settled.rail - origin.rail);
		expect(Math.abs(boardProgress - railProgress)).toBeLessThan(0.15);
		if (index > 0) expect(sample.left).toBeLessThanOrEqual(exitSamples[index - 1].left + 0.5);
	}
	for (let repeat = 0; repeat < 3; repeat++) {
		await page.mouse.move(gutter.x + 2, gutter.y + 30);
		await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
		await page.mouse.move(gutter.x + 180, gutter.y - 30);
	}
	await page.mouse.move(gutter.x + 2, gutter.y + 30);
	await expect(page.locator("[data-agent-session-column-hit-area]")).toHaveCount(0);
	await expect.poll(async () => (await page.locator('[data-jira-kanban-column="To do"]').boundingBox())?.x).toBeCloseTo(settled.left, 0);
});

test("session column slots between statuses and supports cancellation and keyboard movement", async ({ page }) => {
	await openBoard(page);
	const placement = page.locator("[data-session-column-placement]");
	const column = page.locator("[data-agent-session-column]");
	const originalColumn = await column.elementHandle();
	const handle = page.getByRole("button", { name: "Move Unattached sessions column" });
	const todo = page.locator('[data-jira-kanban-column="To do"]');
	const progress = page.locator('[data-jira-kanban-column="In progress"]');
	const start = await handle.boundingBox();
	const target = await todo.boundingBox();
	expect(start).not.toBeNull();
	expect(target).not.toBeNull();
	if (!start || !target) return;
	await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
	await page.mouse.down();
	await page.mouse.move(target.x + target.width - 8, start.y + start.height / 2, { steps: 12 });
	await expect(page.locator('[data-session-column-drop-marker="1"] > span')).toBeVisible();
	await page.mouse.up();
	await expect(placement).toHaveAttribute("data-session-column-placement", "1");
	expect(await originalColumn?.evaluate((element) => element.isConnected)).toBe(true);
	await expect.poll(async () => {
		const [sessions, before, after] = await Promise.all([column.boundingBox(), todo.boundingBox(), progress.boundingBox()]);
		return Boolean(sessions && before && after && sessions.x >= before.x + before.width && sessions.x + sessions.width <= after.x);
	}).toBe(true);
	await handle.focus();
	await page.keyboard.press("ArrowRight");
	await expect(placement).toHaveAttribute("data-session-column-placement", "2");
	const beforeScroll = await column.boundingBox();
	await page.locator("[data-jira-kanban-scrollport]").evaluate((element) => { element.scrollLeft = 100; });
	await expect.poll(async () => (await column.boundingBox())?.x ?? 0).toBeCloseTo((beforeScroll?.x ?? 0) - 100, 0);
	await page.getByRole("tab", { name: "List", exact: true }).click();
	await expect(page.locator("[data-session-column-slot]")).toHaveCount(0);
	await page.getByRole("tab", { name: "Board", exact: true }).click();
	await expect(placement).toHaveAttribute("data-session-column-placement", "2");
	await handle.focus();
	await page.keyboard.press("Home");
	await expect(placement).toHaveAttribute("data-session-column-placement", "0");
	const restored = await handle.boundingBox();
	if (!restored) return;
	await page.mouse.move(restored.x + restored.width / 2, restored.y + restored.height / 2);
	await page.mouse.down();
	await page.mouse.move(target.x + target.width - 8, restored.y + restored.height / 2, { steps: 10 });
	await page.keyboard.press("Escape");
	await page.mouse.up();
	await expect(placement).toHaveAttribute("data-session-column-placement", "0");
	await expect(page.locator("[data-session-column-drop-marker]")).toHaveCount(0);
});

test("compact session header drags without expanding and keeps its wider target", async ({ page }) => {
	await openCollapsedBoard(page);
	await revealCollapsedAgentSessionColumn(page);
	const expand = page.getByRole("button", { name: "Unattached sessions column options" });
	const start = await expand.boundingBox();
	const todo = await page.locator('[data-jira-kanban-column="To do"]').boundingBox();
	if (!start || !todo) throw new Error("Expected visible column headers");
	await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
	await page.mouse.down();
	await page.mouse.move(start.x + start.width / 2 + 8, start.y + start.height / 2);
	const markers = page.locator("[data-session-column-drop-marker]");
	await expect(markers).toHaveCount(5);
	const neutralMarkers = markers.locator(":scope:not([data-session-column-drop-target])");
	expect(await neutralMarkers.count()).toBeGreaterThanOrEqual(4);
	for (const line of await neutralMarkers.locator(":scope > span").all()) {
		await expect(line).toHaveClass(/bg-neutral-100/u);
		await expect(line).toHaveCSS("width", "4px");
		await expect(line).toHaveCSS("height", "64px");
	}
	const firstCardTop = (await page.locator('[data-jira-kanban-column="To do"] article').first().boundingBox())?.y;
	const firstHandleTop = (await neutralMarkers.first().locator(":scope > span").boundingBox())?.y;
	expect(firstHandleTop).toBeCloseTo(firstCardTop ?? 0, 0);
	await page.mouse.move(todo.x + todo.width - 8, start.y + start.height / 2, { steps: 12 });
	await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0);
	await expect(page.locator("[data-agent-session-notch]").first()).not.toBeVisible();
	const draggingButton = page.getByRole("button", { name: "Unattached sessions column options" });
	await expect(draggingButton).toHaveAttribute("data-variant", "outline");
	await expect(draggingButton).toHaveCSS("opacity", "1");
	await expect(draggingButton).toHaveCSS("border-top-style", "solid");
	await expect(draggingButton.locator("svg")).toBeVisible();
	expect(await draggingButton.evaluate((button) => getComputedStyle(button).backgroundColor)).toMatch(/^rgb\(/u);
	await page.mouse.up();
	await expect(page.locator("[data-session-column-placement]")).toHaveAttribute("data-session-column-placement", "1");
	const more = page.getByRole("button", { name: "Unattached sessions column options" });
	await expect(more).toBeVisible();
	await expect(more).toHaveAttribute("data-variant", "ghost");
	await expect(page.locator("[data-agent-session-notch]").first()).toBeVisible();
	await expect(markers).toHaveCount(0);
	await expect(page.locator("[data-agent-session-column]")).toHaveCSS("width", "32px");
	const box = await more.boundingBox();
	if (!box) throw new Error("Expected the moved expand-more target");
	expect(box.width).toBe(56);
	for (const x of [box.x + 2, box.x + box.width - 2]) {
		expect(await more.evaluate((button, point) => button.contains(document.elementFromPoint(point.x, point.y)), { x, y: box.y + box.height / 2 })).toBe(true);
	}
	await more.focus();
	await page.keyboard.press("Alt+Home");
	await expect(page.locator("[data-session-column-placement]")).toHaveAttribute("data-session-column-placement", "0");
});

test("keyboard movement reveals the last slot on a narrow board with reduced motion", async ({ page }) => {
	await page.setViewportSize({ width: 900, height: 760 });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await openBoard(page);
	const handle = page.getByRole("button", { name: "Move Unattached sessions column" });
	await handle.focus();
	await page.keyboard.press("End");
	await expect(page.locator("[data-session-column-placement]")).toHaveAttribute("data-session-column-placement", "4");
	await expect(handle).toBeInViewport();
	await expect.poll(async () => {
		const [sessions, done] = await Promise.all([
			page.locator("[data-agent-session-column]").boundingBox(),
			page.locator('[data-jira-kanban-column="Done"]').boundingBox(),
		]);
		return Boolean(sessions && done && sessions.x >= done.x + done.width);
	}).toBe(true);
	await page.keyboard.press("Home");
	await expect(page.locator("[data-session-column-placement]")).toHaveAttribute("data-session-column-placement", "0");
	await expect(handle).toBeInViewport();
});

test("nearby column gaps grow blue and return to subtle lines as the drag moves away", async ({ page }) => {
	await openCollapsedBoard(page);
	await revealCollapsedAgentSessionColumn(page);
	const expand = page.getByRole("button", { name: "Unattached sessions column options" });
	await expand.hover();
	const start = await expand.boundingBox();
	if (!start) throw new Error("Expected the compact header");
	const y = start.y + start.height / 2;
	await page.mouse.move(start.x + start.width / 2, y);
	await page.mouse.down();
	await page.mouse.move(start.x + start.width / 2 + 10, y);
	const gap = page.locator('[data-session-column-drop-marker="1"]');
	const line = gap.locator(":scope > span");
	await expect(line).toBeVisible();
	const neutralColor = await line.evaluate((element) => getComputedStyle(element).backgroundColor);
	const gapBox = await gap.boundingBox();
	if (!gapBox) throw new Error("Expected the first insertion gap");
	await page.mouse.move(gapBox.x - 96, y, { steps: 10 });
	await expect(gap).toHaveAttribute("data-session-column-drop-target", "true");
	await expect.poll(async () => (await line.boundingBox())?.width ?? 0).toBe(2);
	await expect.poll(async () => (await line.boundingBox())?.height ?? 0).toBeCloseTo(gapBox.height, 0);
	await expect(line).not.toHaveCSS("background-color", neutralColor);
	await expect(line).toHaveCSS("transition-property", "top, height, width, background-color, border-radius");
	const todo = await page.locator('[data-jira-kanban-column="To do"]').boundingBox();
	if (!todo) throw new Error("Expected To do");
	await page.mouse.move(todo.x + todo.width / 2, y, { steps: 10 });
	await expect(page.locator("[data-session-column-drop-target]")).toHaveCount(0);
	await expect.poll(async () => (await line.boundingBox())?.width ?? 0).toBe(4);
	await expect.poll(async () => (await line.boundingBox())?.height ?? 0).toBe(64);
	await expect(line).toHaveCSS("background-color", neutralColor);
	await page.keyboard.press("Escape");
	await page.mouse.up();
});

test("the collapsed options menu offers Pin and Expand", async ({ page }) => {
	await page.goto(JIRA_TEAM_EU26_EMBEDDED_URL, { waitUntil: "domcontentloaded" });
	await expect(page.getByRole("heading", { name: "Jira Design" })).toBeVisible({ timeout: 15_000 });
	await revealCollapsedAgentSessionColumn(page);
	const options = page.getByRole("button", { name: "Unattached sessions column options" });
	await options.click();
	await expect(page.getByRole("menuitem", { name: "Pin" })).toBeVisible();
	await expect(page.getByRole("menuitem", { name: "Expand" })).toBeVisible();
	await page.keyboard.press("Escape");
	await page.getByRole("heading", { name: "Jira Design" }).hover();
	await expect(page.getByRole("menuitem", { name: "Expand" })).toHaveCount(0);
});
