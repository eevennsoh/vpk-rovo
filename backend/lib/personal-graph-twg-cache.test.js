"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { clearCache, readCache, writeCache } = require("./personal-graph-twg-cache");

function createTempCachePath() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "twg-cache-"));
	return path.join(dir, "twg-cache.json");
}

test("readCache returns null when file missing", () => {
	const cachePath = createTempCachePath();
	assert.equal(readCache({ cachePath }), null);
});

test("writeCache + readCache round-trip preserves the explorer payload", () => {
	const cachePath = createTempCachePath();
	const explorer = {
		edges: [{ id: "e1", kind: "worked-on", source: "u", target: "p" }],
		generatedAt: "2026-05-07T00:00:00.000Z",
		nodes: [{ id: "u", title: "Me" }],
		stats: { nodeCount: 1, edgeCount: 1 },
	};
	writeCache(explorer, { cachePath });
	const round = readCache({ cachePath });
	assert.deepEqual(round, explorer);
});

test("writeCache uses an atomic .tmp rename (no .tmp leftover, target replaces)", () => {
	const cachePath = createTempCachePath();
	writeCache({ generatedAt: "v1", nodes: [], edges: [], stats: {} }, { cachePath });
	writeCache({ generatedAt: "v2", nodes: [], edges: [], stats: {} }, { cachePath });
	assert.equal(fs.existsSync(`${cachePath}.tmp`), false);
	const round = readCache({ cachePath });
	assert.equal(round.generatedAt, "v2");
});

test("readCache cleans corrupted files and returns null", () => {
	const cachePath = createTempCachePath();
	fs.mkdirSync(path.dirname(cachePath), { recursive: true });
	fs.writeFileSync(cachePath, "{not valid json", "utf8");
	assert.equal(readCache({ cachePath }), null);
	assert.equal(fs.existsSync(cachePath), false);
});

test("clearCache removes the file and is idempotent", () => {
	const cachePath = createTempCachePath();
	writeCache({ generatedAt: "v1", nodes: [], edges: [], stats: {} }, { cachePath });
	assert.equal(fs.existsSync(cachePath), true);
	clearCache({ cachePath });
	assert.equal(fs.existsSync(cachePath), false);
	clearCache({ cachePath });
	assert.equal(fs.existsSync(cachePath), false);
});
