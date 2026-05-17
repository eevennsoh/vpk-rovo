const test = require("node:test");
const assert = require("node:assert/strict");

const {
	DEFAULT_SHIMMER_HIGHLIGHT_COLOR,
	parseColor,
	resolveWaveHighlightColor,
} = require("./shimmer-colors.ts");

test("parseColor returns null for non-string values", () => {
	assert.equal(parseColor(undefined), null);
	assert.equal(parseColor(null), null);
});

test("resolveWaveHighlightColor ignores undefined gradient entries", () => {
	assert.equal(
		resolveWaveHighlightColor(["#1868db", undefined], 1, 3),
		"#1868db"
	);
});

test("resolveWaveHighlightColor falls back when no usable colors are provided", () => {
	assert.equal(
		resolveWaveHighlightColor([undefined, null, ""], 0, 1),
		DEFAULT_SHIMMER_HIGHLIGHT_COLOR
	);
});
