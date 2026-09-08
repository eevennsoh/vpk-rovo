const assert = require("node:assert/strict");
const test = require("node:test");

const {
	BOARD_AGENT_HOST_DEFAULT_ID,
	BOARD_AGENT_HOST_OPTIONS,
	BOARD_AGENT_SESSION_STATE_IDS,
	BOARD_AGENT_STATE_OPTIONS,
	boardAgentHostFilterLabel,
	BOARD_COLUMN_OPTIONS,
	BOARD_COLUMN_SIZE_DEFAULT_ID,
	BOARD_COLUMN_SIZE_OPTIONS,
	BOARD_FIELD_OPTIONS,
	BOARD_HIDE_DONE_DEFAULT_ID,
	BOARD_HIDE_DONE_OPTIONS,
	BOARD_PR_STATE_OPTIONS,
	isBoardAgentHostId,
	isBoardAgentSessionStateId,
	shownSessionStateIdsForAgentFilter,
} = require("./board-view-options.ts");

test("View menu lists the production done-item windows in order", () => {
	assert.deepEqual(
		BOARD_HIDE_DONE_OPTIONS.map((option) => option.label),
		["Never", "1 day", "7 days", "14 days", "30 days", "60 days"],
	);
	assert.equal(BOARD_HIDE_DONE_DEFAULT_ID, "14-days");
});

test("View menu offers both column sizes", () => {
	assert.deepEqual(
		BOARD_COLUMN_SIZE_OPTIONS.map((option) => option.label),
		["Fixed width", "Flexible width"],
	);
	assert.ok(BOARD_COLUMN_SIZE_OPTIONS.some((option) => option.id === BOARD_COLUMN_SIZE_DEFAULT_ID));
});

test("Columns lists the board's status phases, all visible by default", () => {
	assert.deepEqual(
		BOARD_COLUMN_OPTIONS.map((column) => column.label),
		["To do", "In progress", "In review", "Done"],
	);
	assert.ok(BOARD_COLUMN_OPTIONS.every((column) => column.shown));
});

test("Column visibility and column size stay separate lists", () => {
	// Adjacent rows named "Columns" and "Column size" are easy to conflate; they
	// answer different questions and must not share entries.
	const sizeIds = new Set(BOARD_COLUMN_SIZE_OPTIONS.map((option) => option.id));
	assert.ok(BOARD_COLUMN_OPTIONS.every((column) => !sizeIds.has(column.id)));
});

test("PR state lists the pull-request lifecycle in order", () => {
	assert.deepEqual(
		BOARD_PR_STATE_OPTIONS.map((option) => option.label),
		["Open", "Draft", "Queued", "Merged", "Closed"],
	);
	assert.ok(BOARD_PR_STATE_OPTIONS.every((option) => option.shown));
});

test("Agent lists the session states by session shape, not alphabetically", () => {
	assert.deepEqual(
		BOARD_AGENT_STATE_OPTIONS.map((option) => option.label),
		["Working", "Needs input", "Finished", "Untracked"],
	);
	assert.ok(BOARD_AGENT_STATE_OPTIONS.every((option) => option.shown));
	// The state that wants a human sits between the one the agent holds on its
	// own and the terminal one, so the row needing attention is not buried.
	// Untracked is the absence of a session, so it sits after that lifecycle
	// rather than mixing into it.
	const labels = BOARD_AGENT_STATE_OPTIONS.map((option) => option.label);
	assert.equal(labels.indexOf("Needs input"), 1);
	assert.equal(labels.indexOf("Finished"), 2);
	assert.equal(labels.at(-1), "Untracked");
	const untracked = BOARD_AGENT_STATE_OPTIONS.find((option) => option.id === "untracked");
	assert.equal(untracked?.separatorBefore, true);
	assert.ok(
		BOARD_AGENT_STATE_OPTIONS.filter((option) => option.id !== "untracked").every(
			(option) => !option.separatorBefore,
		),
	);
	assert.deepEqual([...BOARD_AGENT_SESSION_STATE_IDS], ["working", "needs-input", "finished"]);
	assert.ok(isBoardAgentSessionStateId("working"));
	assert.ok(isBoardAgentSessionStateId("needs-input"));
	assert.ok(isBoardAgentSessionStateId("finished"));
	assert.equal(isBoardAgentSessionStateId("untracked"), false);
	assert.deepEqual([...shownSessionStateIdsForAgentFilter("needs-input")], ["needs-input"]);
	assert.equal(shownSessionStateIdsForAgentFilter("untracked").size, 0);
});

test("Agent host scope is All / Cloud / Local and labels the nested trigger", () => {
	assert.deepEqual(
		BOARD_AGENT_HOST_OPTIONS.map((option) => option.id),
		["all", "cloud", "local"],
	);
	assert.deepEqual(
		BOARD_AGENT_HOST_OPTIONS.map((option) => option.label),
		["All", "Cloud", "Local"],
	);
	assert.equal(BOARD_AGENT_HOST_DEFAULT_ID, "all");
	assert.equal(boardAgentHostFilterLabel("all"), "Show all agents");
	assert.equal(boardAgentHostFilterLabel("cloud"), "Show cloud agents");
	assert.equal(boardAgentHostFilterLabel("local"), "Show local agents");
	assert.ok(isBoardAgentHostId("all"));
	assert.ok(isBoardAgentHostId("cloud"));
	assert.ok(isBoardAgentHostId("local"));
	assert.equal(isBoardAgentHostId("untracked"), false);
});

test("every visibility list shares one row shape", () => {
	// Columns, PR state, Agent, and Show fields all feed the same shared
	// submenu, so a list missing `shown` would render an unchecked row.
	for (const list of [
		BOARD_COLUMN_OPTIONS,
		BOARD_PR_STATE_OPTIONS,
		BOARD_AGENT_STATE_OPTIONS,
		BOARD_FIELD_OPTIONS,
	]) {
		assert.ok(list.length > 0);
		for (const option of list) {
			assert.equal(typeof option.id, "string");
			assert.equal(typeof option.label, "string");
			assert.equal(typeof option.shown, "boolean");
		}
	}
});

test("Show fields lists every production card field alphabetically", () => {
	const labels = BOARD_FIELD_OPTIONS.map((field) => field.label);
	assert.equal(labels.length, 22);
	assert.deepEqual(labels, [...labels].sort((a, b) => a.localeCompare(b, "en-US")));
	assert.deepEqual(labels.slice(0, 3), ["Agent sessions", "Assignee", "Card cover"]);
	assert.deepEqual(labels.slice(-2), ["Work item key", "Work type"]);
});

test("Summary is the only field Jira locks on", () => {
	const locked = BOARD_FIELD_OPTIONS.filter((field) => field.locked);
	assert.deepEqual(
		locked.map((field) => field.label),
		["Summary"],
	);
	assert.ok(locked.every((field) => field.shown));
});
