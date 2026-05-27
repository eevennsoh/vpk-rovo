import { expect, test, type Page } from "@playwright/test";

const STUDIO_URL = `${
	process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000"
}/studio`;

const STORAGE_KEY = "vpk:studio:session-agents:v1";

const SEEDED_AGENT_NAME = "Draft Persistence Probe";
const SEEDED_AGENT_ID = "draft-persistence-probe";
const SEEDED_RESULT_KEY = "draft-persistence-probe::1";

function buildSeedRecord() {
	const agentResult = {
		agentId: SEEDED_AGENT_ID,
		name: SEEDED_AGENT_NAME,
		summary: "Verifies draft agents survive browser refresh.",
		action: "create" as const,
	};

	return {
		profileId: SEEDED_AGENT_ID,
		resultKey: SEEDED_RESULT_KEY,
		sourceResult: agentResult,
		draftResult: agentResult,
		publishReadyResult: agentResult,
		publishedResult: null,
		publishStatus: "testing" as const,
		lastTouchedAt: 1748332800000,
	};
}

async function seedSessionAgent(page: Page) {
	const record = buildSeedRecord();
	await page.addInitScript(
		({ key, value }) => {
			window.localStorage.setItem(key, JSON.stringify([value]));
		},
		{ key: STORAGE_KEY, value: record },
	);
}

async function openAgentsDirectory(page: Page) {
	const sidebarTrigger = page.getByRole("button", { name: /view all agents/i });
	const homeTrigger = page.getByRole("button", { name: /browse all agents/i });

	if (await sidebarTrigger.first().isVisible().catch(() => false)) {
		await sidebarTrigger.first().click();
	} else {
		await homeTrigger.first().click();
	}

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	return dialog;
}

test.describe("Studio draft agent persistence", () => {
	test("seeded draft agent appears in the agents directory", async ({ page }) => {
		await seedSessionAgent(page);

		await page.goto(STUDIO_URL, { waitUntil: "networkidle" });

		const dialog = await openAgentsDirectory(page);
		await expect(dialog.getByText(SEEDED_AGENT_NAME).first()).toBeVisible();
	});

	test("seeded draft agent survives a full page reload", async ({ page }) => {
		await seedSessionAgent(page);

		await page.goto(STUDIO_URL, { waitUntil: "networkidle" });
		await page.reload({ waitUntil: "networkidle" });

		const dialog = await openAgentsDirectory(page);
		await expect(dialog.getByText(SEEDED_AGENT_NAME).first()).toBeVisible();

		const stored = await page.evaluate(
			(key) => window.localStorage.getItem(key),
			STORAGE_KEY,
		);
		expect(stored).not.toBeNull();
		expect(stored).toContain(SEEDED_AGENT_ID);
	});
});
