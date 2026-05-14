const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldShowRovoAppSidebarRunIndicator,
} = require("./rovo-app-sidebar-run-indicator.ts");

test("does not show the sidebar run indicator when the thread is idle", () => {
	assert.equal(shouldShowRovoAppSidebarRunIndicator(null), false);
	assert.equal(shouldShowRovoAppSidebarRunIndicator(undefined), false);
});

test("shows the sidebar run indicator for queued and active runs", () => {
	assert.equal(shouldShowRovoAppSidebarRunIndicator("queued"), true);
	assert.equal(shouldShowRovoAppSidebarRunIndicator("streaming"), true);
	assert.equal(shouldShowRovoAppSidebarRunIndicator("background"), true);
});
