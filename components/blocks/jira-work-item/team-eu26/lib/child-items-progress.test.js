const assert = require("node:assert/strict");
const test = require("node:test");

async function loadChildItemsProgress() {
	return import("./child-items-progress.ts");
}

async function loadFixture() {
	return import("../data/high-confidence-work-item.ts");
}

test("toChildItemStatus maps Team EU26 labels onto the Jira child-item statuses", async () => {
	const { toChildItemStatus } = await loadChildItemsProgress();

	assert.equal(toChildItemStatus("In progress"), "inprogress");
	assert.equal(toChildItemStatus("To do"), "todo");
});

test("toChildItemPriority maps Team EU26 labels onto Jira child-item priorities", async () => {
	const { toChildItemPriority } = await loadChildItemsProgress();

	assert.equal(toChildItemPriority("High"), "high");
	assert.equal(toChildItemPriority("Medium"), "medium");
	assert.equal(toChildItemPriority("Low"), "low");
});

test("toWorkItemChildItems uses live statuses so the shared progress bar can count segments", async () => {
	const { toWorkItemChildItems } = await loadChildItemsProgress();
	const { TEAM_EU26_SUBITEMS } = await loadFixture();
	const fromFixture = toWorkItemChildItems(TEAM_EU26_SUBITEMS, {});
	const liveStatuses = { "VITA-4": "To do", "VITA-5": "In progress" };

	assert.deepEqual(
		fromFixture.map((item) => item.status),
		["inprogress", "todo", "todo"],
	);
	assert.deepEqual(fromFixture[0], {
		assignee: "Sia Vale",
		key: "VITA-4",
		priority: "medium",
		status: "inprogress",
		summary: "Write copy for welcome screen",
	});
	assert.deepEqual(
		toWorkItemChildItems(TEAM_EU26_SUBITEMS, liveStatuses).map((item) => item.status),
		["todo", "inprogress", "todo"],
	);
});
