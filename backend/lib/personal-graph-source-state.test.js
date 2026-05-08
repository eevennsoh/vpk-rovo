"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { getActiveSource, setActiveSource } = require("./personal-graph-source-state");

function createTempSourcePath() {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "twg-source-"));
	return path.join(dir, "source.json");
}

test("getActiveSource defaults to 'vault' when file missing", () => {
	const sourcePath = createTempSourcePath();
	assert.equal(getActiveSource({ sourcePath }), "vault");
});

test("setActiveSource persists to disk and getActiveSource reads it back", () => {
	const sourcePath = createTempSourcePath();
	setActiveSource("twg", { sourcePath });
	assert.equal(getActiveSource({ sourcePath }), "twg");
	setActiveSource("vault", { sourcePath });
	assert.equal(getActiveSource({ sourcePath }), "vault");
});

test("setActiveSource rejects invalid values", () => {
	const sourcePath = createTempSourcePath();
	assert.throws(() => setActiveSource("notebook", { sourcePath }), /Invalid graph source/u);
});

test("getActiveSource recovers gracefully from corrupted file", () => {
	const sourcePath = createTempSourcePath();
	fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
	fs.writeFileSync(sourcePath, "{not json", "utf8");
	assert.equal(getActiveSource({ sourcePath }), "vault");
});

test("getActiveSource ignores unknown source values in stored JSON", () => {
	const sourcePath = createTempSourcePath();
	fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
	fs.writeFileSync(sourcePath, JSON.stringify({ source: "future-backend" }), "utf8");
	assert.equal(getActiveSource({ sourcePath }), "vault");
});
