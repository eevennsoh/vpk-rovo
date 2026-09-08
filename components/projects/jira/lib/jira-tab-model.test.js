const assert = require("node:assert/strict");
const test = require("node:test");

const {
	ALL_JIRA_WORK_ITEM_VIEWS,
	getJiraWorkItemsTabLabel,
	resolveJiraTab,
	selectJiraTabs,
} = require("./jira-tab-model.ts");

/** Team EU without Simple views: Board and List are sibling destinations. */
const TEAM_EU_TABS = [
	{ label: "Summary", hasContent: false },
	{ label: "Board", hasContent: true, view: "board" },
	{ label: "List", hasContent: true, view: "list" },
	{ label: "Calendar", hasContent: false },
];

/** Collapsed catalog (Simple views): one Work items destination, header owns the view. */
const LATER_TABS = [
	{ label: "Summary", hasContent: false },
	{ label: "Work items", hasContent: true },
	{ label: "Calendar", hasContent: false },
];

test("a tab shared by both catalogs resolves to itself", () => {
	assert.equal(resolveJiraTab(TEAM_EU_TABS, "Calendar", "board").label, "Calendar");
	assert.equal(resolveJiraTab(LATER_TABS, "Calendar", "list").label, "Calendar");
	assert.equal(resolveJiraTab(TEAM_EU_TABS, "List", "list").label, "List");
});

test("flipping Simple views carries the board/list choice in both directions", () => {
	// Team EU's List has no counterpart label, so it lands on the single Work
	// items destination and the caller keeps rendering the list.
	assert.equal(resolveJiraTab(LATER_TABS, "List", "list").label, "Work items");
	// Coming back, the view is what identifies the tab again.
	assert.equal(resolveJiraTab(TEAM_EU_TABS, "Work items", "list").label, "List");
	assert.equal(resolveJiraTab(TEAM_EU_TABS, "Work items", "board").label, "Board");
});

test("a header view switch while Simple views is on survives expanding the tabs", () => {
	// List with Simple views off, then collapse: the stale List label still
	// lands on Work items. Switching the header to Board updates the view
	// without rewriting the label.
	assert.equal(resolveJiraTab(LATER_TABS, "List", "board").label, "Work items");
	// Expanding again must follow the header view, not the leftover List label.
	assert.equal(resolveJiraTab(TEAM_EU_TABS, "List", "board").label, "Board");
});

test("an unknown tab falls back to the work items destination", () => {
	assert.equal(resolveJiraTab(TEAM_EU_TABS, "Retired tab", "board").label, "Board");
	assert.equal(resolveJiraTab(LATER_TABS, "Retired tab", "board").label, "Work items");
	assert.equal(resolveJiraTab([], "Board", "board"), undefined);
});

test("only tabs with a view carry the board/list switch", () => {
	assert.deepEqual(
		TEAM_EU_TABS.filter((tab) => tab.view !== undefined).map((tab) => tab.view),
		["board", "list"],
	);
	assert.deepEqual(LATER_TABS.filter((tab) => tab.view !== undefined), []);
	assert.deepEqual(ALL_JIRA_WORK_ITEM_VIEWS, ["board", "list"]);
});

test("a board-only route never gets a List tab it cannot fill", () => {
	assert.deepEqual(
		selectJiraTabs(TEAM_EU_TABS, ["board"]).map((tab) => tab.label),
		["Summary", "Board", "Calendar"],
	);
	// The collapsed catalog has nothing to filter — its Work items tab has no
	// view, so it survives whichever surfaces the route supports.
	assert.deepEqual(
		selectJiraTabs(LATER_TABS, ["board"]).map((tab) => tab.label),
		["Summary", "Work items", "Calendar"],
	);
	assert.deepEqual(
		selectJiraTabs(TEAM_EU_TABS, ALL_JIRA_WORK_ITEM_VIEWS).map((tab) => tab.label),
		["Summary", "Board", "List", "Calendar"],
	);
});

test("routes open on the work items destination, not the first tab", () => {
	assert.equal(getJiraWorkItemsTabLabel(TEAM_EU_TABS), "Board");
	assert.equal(getJiraWorkItemsTabLabel(LATER_TABS), "Work items");
	assert.equal(getJiraWorkItemsTabLabel(selectJiraTabs(TEAM_EU_TABS, ["board"])), "Board");
	// No content tab at all: fall back to the first tab rather than nothing.
	assert.equal(getJiraWorkItemsTabLabel([{ label: "Summary", hasContent: false }]), "Summary");
	assert.equal(getJiraWorkItemsTabLabel([]), "");
});
