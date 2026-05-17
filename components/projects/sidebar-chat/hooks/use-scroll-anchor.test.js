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
		/conversationContextRef\.current\?\.scrollToBottom\(\{\s+animation: "instant",\s+ignoreEscapes: true,\s+target: "bottom",/,
	);
	assert.match(
		USE_SCROLL_ANCHOR_SOURCE,
		/animation: "instant",\s+ignoreEscapes: true,\s+target: "bottom",/,
	);
});
