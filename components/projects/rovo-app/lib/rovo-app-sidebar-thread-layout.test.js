const test = require("node:test");
const assert = require("node:assert/strict");

const {
	ROVO_APP_SIDEBAR_THREAD_ACTION_PADDING_CLASS,
	ROVO_APP_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS,
	getRovoAppSidebarThreadContentPaddingClass,
} = require("./rovo-app-sidebar-thread-layout.ts");

test("reserves end padding while the run indicator is visible", () => {
	assert.equal(
		getRovoAppSidebarThreadContentPaddingClass({ showRunIndicator: true }),
		ROVO_APP_SIDEBAR_THREAD_RUN_INDICATOR_PADDING_CLASS,
	);
});

test("uses stateful padding classes when only the overflow action can appear", () => {
	assert.equal(
		getRovoAppSidebarThreadContentPaddingClass({ showRunIndicator: false }),
		ROVO_APP_SIDEBAR_THREAD_ACTION_PADDING_CLASS,
	);
});
