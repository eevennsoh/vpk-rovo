const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	inFlowCollapsedMenuPinLabel,
	reduceInFlowSessionColumnAxes,
	resolveInFlowSessionColumnRest,
} = require("./in-flow-agent-session-column-interaction.ts");

test("a collapsed host mounts a persistent compact rail, so the menu says Unpin", () => {
	const rest = resolveInFlowSessionColumnRest(true);
	assert.deepEqual(rest, { expanded: false, pinned: true });
	assert.equal(inFlowCollapsedMenuPinLabel(rest.pinned), "Unpin");
});

test("an expanded host mounts a persistent full column", () => {
	assert.deepEqual(resolveInFlowSessionColumnRest(false), { expanded: true, pinned: true });
});

test("unpin clears persistence; pin from an unpinned compact rail restores it", () => {
	const persistent = resolveInFlowSessionColumnRest(true);
	const unpinned = reduceInFlowSessionColumnAxes(persistent, { type: "pin", pinned: false });
	assert.deepEqual(unpinned, { expanded: false, pinned: false });
	assert.equal(inFlowCollapsedMenuPinLabel(unpinned.pinned), "Pin");

	const pinnedAgain = reduceInFlowSessionColumnAxes(unpinned, { type: "pin", pinned: true });
	assert.deepEqual(pinnedAgain, { expanded: false, pinned: true });
	assert.equal(inFlowCollapsedMenuPinLabel(pinnedAgain.pinned), "Unpin");
});

test("gutter Expand expands and pins; the menu then says Unpin", () => {
	const gutter = { expanded: false, pinned: false };
	const expanded = reduceInFlowSessionColumnAxes(gutter, { type: "expand" });
	assert.deepEqual(expanded, { expanded: true, pinned: true });
	assert.equal(inFlowCollapsedMenuPinLabel(expanded.pinned), "Unpin");

	const unpinned = reduceInFlowSessionColumnAxes(expanded, { type: "pin", pinned: false });
	assert.deepEqual(unpinned, { expanded: true, pinned: false });
	assert.equal(inFlowCollapsedMenuPinLabel(unpinned.pinned), "Pin");
});

test("collapse does not unpin a persistent compact rail", () => {
	const collapsed = reduceInFlowSessionColumnAxes(
		{ expanded: true, pinned: true },
		{ type: "collapse" },
	);
	assert.deepEqual(collapsed, { expanded: false, pinned: true });
	assert.equal(inFlowCollapsedMenuPinLabel(collapsed.pinned), "Unpin");
});
