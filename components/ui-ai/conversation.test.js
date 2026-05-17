const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CONVERSATION_SOURCE = fs.readFileSync(
	path.join(__dirname, "conversation.tsx"),
	"utf8",
);

test("Conversation resize follow yields while the user is actively scrolling", () => {
	assert.doesNotMatch(
		CONVERSATION_SOURCE,
		/initial === false \|\| hasInitializedScrollRef\.current/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/hasInitializedScrollRef\.current = true\s+if \(initial === false\)/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/const hasActiveUserScrollIntent = useCallback\(\(\) => \{[\s\S]*lastUserScrollIntentAtRef\.current <= USER_SCROLL_INTENT_TIMEOUT_MS/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/const didUserInitiateScroll = hasActiveUserScrollIntent\(\)/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/if \(didUserInitiateScroll && nextIsAtBottom\) \{\s+isFollowPausedRef\.current = false\s+return\s+\}/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/const shouldYieldToUserScroll =\s*hasInitializedScrollRef\.current && hasActiveUserScrollIntent\(\)/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/const shouldFollowContent =\s*!shouldYieldToUserScroll &&/,
	);
});

test("Conversation scroll indicator resolves against the actual bottom", () => {
	assert.doesNotMatch(CONVERSATION_SOURCE, /getExpectedFollowTop/);
	assert.match(
		CONVERSATION_SOURCE,
		/const actualBottomTop = getDefaultTargetTop\(scrollElement\)/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/const distanceFromActualBottom = Math\.abs\(scrollElement\.scrollTop - actualBottomTop\)/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/const nextIsAtBottom = distanceFromActualBottom <= DEFAULT_SCROLL_THRESHOLD_PX/,
	);
});

test("Conversation only uses a custom target while target follow mode is active", () => {
	assert.match(
		CONVERSATION_SOURCE,
		/if \(resolvedFollowMode === "target" && targetScrollTop\) \{\s+return targetScrollTop\(defaultTargetTop, \{ scrollElement \}\)\s+\}/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/return defaultTargetTop/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/const targetTop = targetMode === "bottom"\s+\? getDefaultTargetTop\(scrollElement\)\s+\: getScrollTargetTop\(scrollElement\)/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/void scrollToBottom\(\{ ignoreEscapes: true, target: "bottom" \}\)/,
	);
});

test("Conversation resize follow targets the actual bottom while content streams", () => {
	assert.doesNotMatch(CONVERSATION_SOURCE, /shouldFollowActualBottomRef/);
	assert.match(CONVERSATION_SOURCE, /resize = "instant"/);
	assert.match(
		CONVERSATION_SOURCE,
		/lastKnownScrollHeightRef\.current = nextScrollHeight\s+if \(resize === false \|\| !shouldFollowContent\) \{\s+updateIsAtBottom\(\)\s+return\s+\}/,
	);
	assert.match(
		CONVERSATION_SOURCE,
		/void scrollToBottom\(\{\s+animation: resize,\s+target: "bottom",\s+\}\)/,
	);
});
