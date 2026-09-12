const assert = require("node:assert/strict");
const test = require("node:test");

async function loadCount() {
	return import("./new-insights-count.ts");
}

const EMPTY = { attachments: [], nextSteps: [], tldr: [] };
const FILLED = {
	attachments: [{ name: "brief" }],
	nextSteps: [],
	tldr: ["Shoppers can check out as a guest."],
};

test("resolveNewInsightsCount returns 0 on empty context and seeds filled demos", async () => {
	const { DEFAULT_NEW_INSIGHTS_COUNT, resolveNewInsightsCount } = await loadCount();

	assert.equal(resolveNewInsightsCount(EMPTY), 0);
	assert.equal(resolveNewInsightsCount(FILLED), DEFAULT_NEW_INSIGHTS_COUNT);
	assert.equal(DEFAULT_NEW_INSIGHTS_COUNT, 2);
});

test("resolveNewInsightsCount lets an explicit override hide or replace the seed", async () => {
	const { resolveNewInsightsCount } = await loadCount();

	assert.equal(resolveNewInsightsCount(FILLED, 0), 0);
	assert.equal(resolveNewInsightsCount(EMPTY, 3), 3);
	assert.equal(resolveNewInsightsCount(FILLED, -1), 0);
});
