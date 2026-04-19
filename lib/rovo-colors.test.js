const test = require("node:test");
const assert = require("node:assert/strict");

const {
	ROVO_SHADER_COLOR_HEX,
	ROVO_SHADER_TRIAD_HEX,
} = require("./rovo-colors.ts");

test("ROVO shader palette keeps the canonical demo order", () => {
	assert.deepEqual(ROVO_SHADER_COLOR_HEX, [
		"#1868DB",
		"#FCA700",
		"#AF59E1",
		"#6A9A23",
	]);
});

test("ROVO shader triad uses the first three canonical shader colors", () => {
	assert.deepEqual(ROVO_SHADER_TRIAD_HEX, [
		"#1868DB",
		"#FCA700",
		"#AF59E1",
	]);
});
