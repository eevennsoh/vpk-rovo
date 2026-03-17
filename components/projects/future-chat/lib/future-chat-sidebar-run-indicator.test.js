const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldShowFutureChatSidebarRunIndicator,
} = require("./future-chat-sidebar-run-indicator.ts");

test("does not show the sidebar run indicator when the thread is idle", () => {
	assert.equal(shouldShowFutureChatSidebarRunIndicator(null), false);
	assert.equal(shouldShowFutureChatSidebarRunIndicator(undefined), false);
});

test("shows the sidebar run indicator for queued and active runs", () => {
	assert.equal(shouldShowFutureChatSidebarRunIndicator("queued"), true);
	assert.equal(shouldShowFutureChatSidebarRunIndicator("streaming"), true);
	assert.equal(shouldShowFutureChatSidebarRunIndicator("background"), true);
});
