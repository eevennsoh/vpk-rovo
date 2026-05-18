const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const USE_SCROLL_ANCHOR_SOURCE = fs.readFileSync(
	path.join(__dirname, "use-scroll-anchor.ts"),
	"utf8",
);

test("compact chat scroll anchor uses the Rovo bottom/target follow lifecycle", () => {
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /resolveRovoAppScrollAnchorLayout/);
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /enableLatestTurnAnchor\?: boolean;/);
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /enableLatestTurnAnchor = true/);
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /isGenerationActive: boolean;/);
	assert.match(
		USE_SCROLL_ANCHOR_SOURCE,
		/useState<ConversationFollowMode>\("bottom"\)/,
	);
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /setScrollFollowMode\("target"\)/);
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /setScrollFollowMode\("bottom"\)/);
	assert.match(
		USE_SCROLL_ANCHOR_SOURCE,
		/scrollSpacerRef\.current\.style\.height = "0px"/,
	);
	assert.match(
		USE_SCROLL_ANCHOR_SOURCE,
		/const pendingAnchorScrollAnimationRef = useRef<ScrollToBottomOptions\["animation"\]>\("instant"\)/,
	);
	assert.match(
		USE_SCROLL_ANCHOR_SOURCE,
		/pendingAnchorScrollAnimationRef\.current = hasInitializedScrollRef\.current\s+\? FAST_TURN_SCROLL_ANIMATION\s+\: "instant"/,
	);
	assert.match(
		USE_SCROLL_ANCHOR_SOURCE,
		/conversationContextRef\.current\?\.scrollToBottom\(\{\s+animation: pendingAnchorScrollAnimationRef\.current,\s+ignoreEscapes: true,/,
	);
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /enableLatestTurnAnchor &&\s+isGenerationActive/);
	assert.match(USE_SCROLL_ANCHOR_SOURCE, /\(!isGenerationActive \|\| !enableLatestTurnAnchor\) && scrollFollowMode !== "bottom"/);
	assert.doesNotMatch(
		USE_SCROLL_ANCHOR_SOURCE,
		/target: "bottom"/,
	);
});

test("ChatPanel disables latest-turn spacer anchoring while floating", () => {
	const chatPanelSource = fs.readFileSync(
		path.join(__dirname, "..", "page.tsx"),
		"utf8",
	);

	assert.match(
		chatPanelSource,
		/enableLatestTurnAnchor: chatSurface !== "floating"/u,
	);
});
