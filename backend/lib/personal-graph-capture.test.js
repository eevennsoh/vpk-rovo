"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { captureUrl } = require("./personal-graph-capture");

const TEST_VAULT_CONFIG_PATH = path.join(os.tmpdir(), `personal-graph-capture-test-${process.pid}.json`);
fs.rmSync(TEST_VAULT_CONFIG_PATH, { force: true });
process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = TEST_VAULT_CONFIG_PATH;
delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

function withVault(t) {
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-capture-"));
	fs.mkdirSync(path.join(vaultRoot, "raw", "assets"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki"), { recursive: true });
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = vaultRoot;
	t.after(() => {
		if (originalSelectedVault === undefined) delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;
		else process.env.PERSONAL_GRAPH_SELECTED_VAULT = originalSelectedVault;
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});
	return vaultRoot;
}

test("captureUrl writes a raw markdown source and closes the browser", async (t) => {
	const vaultRoot = withVault(t);
	const calls = [];
	class FakeBrowser {
		open(url) { calls.push(["open", url]); return Promise.resolve(""); }
		getTitle() { calls.push(["title"]); return Promise.resolve("Example Page"); }
		snapshot() { calls.push(["snapshot"]); return Promise.resolve("Snapshot text"); }
		screenshot(filePath) { calls.push(["screenshot", filePath]); fs.writeFileSync(filePath, "png"); return Promise.resolve(""); }
		close() { calls.push(["close"]); return Promise.resolve(""); }
	}

	const result = await captureUrl("https://example.com", {
		BrowserClass: FakeBrowser,
		date: new Date("2026-04-30T00:00:00.000Z"),
	});

	assert.equal(result.slug, "2026-04-30-example-page");
	assert.equal(result.rawPath, "raw/2026-04-30-example-page.md");
	assert.match(fs.readFileSync(path.join(vaultRoot, result.rawPath), "utf8"), /Snapshot text/u);
	assert.deepEqual(calls.at(-1), ["close"]);
});

test("captureUrl closes the browser when capture fails", async (t) => {
	withVault(t);
	const calls = [];
	class FakeBrowser {
		open() { calls.push("open"); return Promise.resolve(""); }
		getTitle() { throw new Error("boom"); }
		close() { calls.push("close"); return Promise.resolve(""); }
	}
	await assert.rejects(() => captureUrl("https://example.com", { BrowserClass: FakeBrowser }));
	assert.deepEqual(calls, ["open", "close"]);
});
