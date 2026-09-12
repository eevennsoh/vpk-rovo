const assert = require("node:assert/strict");
const test = require("node:test");

async function loadLayoutConstants() {
	return import("./layout-constants.ts");
}

test("resolveInsightsPanelMaxWidth keeps the work item column above its minimum", async () => {
	const {
		INSIGHTS_PANEL_MIN_WIDTH_PX,
		WORK_ITEM_SPLIT_MIN_WIDTH_PX,
		resolveInsightsPanelMaxWidth,
	} = await loadLayoutConstants();

	assert.equal(resolveInsightsPanelMaxWidth(900), 900 - WORK_ITEM_SPLIT_MIN_WIDTH_PX);
	assert.equal(resolveInsightsPanelMaxWidth(INSIGHTS_PANEL_MIN_WIDTH_PX), INSIGHTS_PANEL_MIN_WIDTH_PX);
	assert.equal(
		resolveInsightsPanelMaxWidth(INSIGHTS_PANEL_MIN_WIDTH_PX + WORK_ITEM_SPLIT_MIN_WIDTH_PX),
		INSIGHTS_PANEL_MIN_WIDTH_PX,
	);
});
