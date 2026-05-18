const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROVO_GENERATION_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-generation.tsx"), "utf8");

test("RovoGeneration rainbow stops are sourced from theme variables", () => {
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-orange": "var\(--color-orange-300\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-lime": "var\(--color-lime-400\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-blue": "var\(--color-blue-600\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /--rovo-generation-stop-purple": "var\(--color-purple-500\)"/u);
	assert.match(ROVO_GENERATION_SOURCE, /var\(--rovo-generation-stop-orange\) 0deg 73deg/u);
	assert.doesNotMatch(ROVO_GENERATION_SOURCE, /#fca700|#6a9a23|#1868db|#af59e0|#AF59E1/u);
});
