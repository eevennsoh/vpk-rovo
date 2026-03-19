const assert = require("node:assert/strict");
const test = require("node:test");

const { getChartColorConfigEntries } = require("./chart-config.ts");

test("getChartColorConfigEntries ignores nullish configs", () => {
	assert.deepEqual(getChartColorConfigEntries(null), []);
	assert.deepEqual(getChartColorConfigEntries(undefined), []);
});

test("getChartColorConfigEntries keeps only color-capable entries", () => {
	const result = getChartColorConfigEntries({
		broken: null,
		line: {
			label: "Line",
			color: "#1868db",
		},
		bar: {
			theme: {
				light: "#0055cc",
				dark: "#85b8ff",
			},
		},
		empty: {
			label: "Empty",
		},
	});

	assert.equal(result.length, 2);
	assert.equal(result[0][0], "line");
	assert.equal(result[0][1].color, "#1868db");
	assert.deepEqual(result[1][1].theme, {
		light: "#0055cc",
		dark: "#85b8ff",
	});
});
