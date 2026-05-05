"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { search } = require("./personal-graph-qmd");

const TEST_VAULT_CONFIG_PATH = path.join(os.tmpdir(), `personal-graph-qmd-test-${process.pid}.json`);
fs.rmSync(TEST_VAULT_CONFIG_PATH, { force: true });
process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = TEST_VAULT_CONFIG_PATH;
delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

function withVault(t) {
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-qmd-"));
	fs.mkdirSync(path.join(vaultRoot, "wiki", "concepts"), { recursive: true });
	fs.writeFileSync(path.join(vaultRoot, "wiki", "concepts", "Graph.md"), "---\ntitle: Graph\n---\n\nGraph search body.", "utf8");
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = vaultRoot;
	t.after(() => {
		if (originalSelectedVault === undefined) delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;
		else process.env.PERSONAL_GRAPH_SELECTED_VAULT = originalSelectedVault;
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});
}

test("search parses qmd JSON output", async () => {
	const execFileImpl = (_bin, _args, _opts, callback) => callback(null, JSON.stringify({
		results: [{ filepath: "/vault/wiki/concepts/Graph.md", score: 0.8, title: "Graph", bestChunk: "chunk" }],
	}), "");
	const results = await search("graph", { execFileImpl });
	assert.deepEqual(results[0], {
		excerpt: "chunk",
		path: "wiki/concepts/Graph.md",
		score: 0.8,
		slug: "concepts/Graph",
		title: "Graph",
	});
});

test("search falls back to grep when qmd binary is missing", async (t) => {
	withVault(t);
	const execFileImpl = (_bin, _args, _opts, callback) => {
		const error = new Error("missing");
		error.code = "ENOENT";
		callback(error, "", "");
	};
	const results = await search("Graph", { execFileImpl });
	assert.equal(results[0].slug, "concepts/Graph");
});

test("search falls back to grep when qmd runtime is unavailable", async (t) => {
	withVault(t);
	const execFileImpl = (_bin, _args, _opts, callback) => {
		const error = new Error("sqlite-vec extension is unavailable");
		error.code = "SQLITE_CANTOPEN";
		callback(error, "", "unable to open database file");
	};
	const results = await search("Graph", { execFileImpl });
	assert.equal(results[0].slug, "concepts/Graph");
});
