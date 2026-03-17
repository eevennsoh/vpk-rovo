const assert = require("node:assert/strict");
const test = require("node:test");

const {
	FUTURE_CHAT_ANCHOR_TOP_INSET_PX,
	resolveFutureChatScrollAnchorLayout,
} = require("./future-chat-scroll-anchor.ts");

test("falls back to the default target when no anchor is present", () => {
	assert.deepEqual(
		resolveFutureChatScrollAnchorLayout({
			anchorOffsetTop: null,
			clientHeight: 640,
			currentSpacerHeight: 48,
			defaultTargetTop: 320,
			scrollHeight: 960,
			scrollTop: 120,
		}),
		{
			spacerHeight: 0,
			targetScrollTop: 320,
		},
	);
});

test("keeps the anchored message 24px below the top when native scroll range is sufficient", () => {
	assert.deepEqual(
		resolveFutureChatScrollAnchorLayout({
			anchorOffsetTop: 212,
			clientHeight: 500,
			currentSpacerHeight: 0,
			defaultTargetTop: 700,
			scrollHeight: 1600,
			scrollTop: 400,
		}),
		{
			spacerHeight: 0,
			targetScrollTop: 588,
		},
	);
});

test("adds spacer height when the list cannot natively reach the anchored position", () => {
	assert.deepEqual(
		resolveFutureChatScrollAnchorLayout({
			anchorOffsetTop: 260,
			clientHeight: 500,
			currentSpacerHeight: 0,
			defaultTargetTop: 300,
			scrollHeight: 920,
			scrollTop: 300,
		}),
		{
			spacerHeight: 116,
			targetScrollTop: 536,
		},
	);
});

test("replaces any existing spacer with the newly required amount", () => {
	assert.deepEqual(
		resolveFutureChatScrollAnchorLayout({
			anchorOffsetTop: 180,
			clientHeight: 600,
			currentSpacerHeight: 140,
			defaultTargetTop: 260,
			scrollHeight: 1140,
			scrollTop: 320,
		}),
		{
			spacerHeight: 76,
			targetScrollTop: 476,
		},
	);
});

test("exports the fixed top inset used by future chat anchoring", () => {
	assert.equal(FUTURE_CHAT_ANCHOR_TOP_INSET_PX, 24);
});
