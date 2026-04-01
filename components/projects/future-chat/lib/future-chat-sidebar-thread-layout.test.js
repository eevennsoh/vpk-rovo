const test = require("node:test");
const assert = require("node:assert/strict");

const {
	FUTURE_CHAT_SIDEBAR_THREAD_ACTION_PADDING_CLASS,
	FUTURE_CHAT_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS,
	getFutureChatSidebarThreadContentPaddingClass,
} = require("./future-chat-sidebar-thread-layout.ts");

test("reserves end padding while the run indicator is visible", () => {
	assert.equal(
		getFutureChatSidebarThreadContentPaddingClass({ showRunIndicator: true }),
		FUTURE_CHAT_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS,
	);
});

test("uses stateful padding classes when only the overflow action can appear", () => {
	assert.equal(
		getFutureChatSidebarThreadContentPaddingClass({ showRunIndicator: false }),
		FUTURE_CHAT_SIDEBAR_THREAD_ACTION_PADDING_CLASS,
	);
});
