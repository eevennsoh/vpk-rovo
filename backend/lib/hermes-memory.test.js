const assert = require("node:assert/strict");
const test = require("node:test");

const {
	parseHermesMemoryEntries,
	serializeHermesMemoryEntries,
} = require("./hermes-memory");

test("parseHermesMemoryEntries splits Hermes memory blocks by section delimiter", () => {
	const entries = parseHermesMemoryEntries("First entry\n§\nSecond entry\n");

	assert.equal(entries.length, 2);
	assert.equal(entries[0].content, "First entry");
	assert.equal(entries[1].content, "Second entry");
});

test("serializeHermesMemoryEntries normalizes entry output", () => {
	assert.equal(
		serializeHermesMemoryEntries([
			{ content: "First entry" },
			{ content: "Second entry" },
		]),
		"First entry\n§\nSecond entry\n",
	);
});
