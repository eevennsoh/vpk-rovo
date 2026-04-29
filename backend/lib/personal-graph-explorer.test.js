"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { buildExplorer } = require("./personal-graph-explorer");

const TEST_VAULT_CONFIG_PATH = path.join(os.tmpdir(), `personal-graph-explorer-test-${process.pid}.json`);
fs.rmSync(TEST_VAULT_CONFIG_PATH, { force: true });
process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = TEST_VAULT_CONFIG_PATH;
delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

function createFixtureVault() {
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-explorer-"));
	fs.mkdirSync(path.join(vaultRoot, "raw"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki", "concepts"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki", "entities"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki", "sources"), { recursive: true });

	fs.writeFileSync(path.join(vaultRoot, "raw", "capture.md"), "Raw capture.", "utf8");
	fs.writeFileSync(
		path.join(vaultRoot, "wiki", "sources", "Capture.md"),
		[
			"---",
			"title: Capture",
			"type: source",
			"sources:",
			"  - raw/capture.md",
			"---",
			"",
			"# Capture",
			"",
			"Links to [[concepts/Graph]] and [[concepts/Missing]].",
		].join("\n"),
		"utf8",
	);
	fs.writeFileSync(
		path.join(vaultRoot, "wiki", "concepts", "Graph.md"),
		[
			"---",
			"title: Graph",
			"type: concept",
			"---",
			"",
			"# Graph",
			"",
			"Backlink to [[sources/Capture]].",
		].join("\n"),
		"utf8",
	);
	fs.writeFileSync(
		path.join(vaultRoot, "wiki", "entities", "Ada.md"),
		"---\ntitle: Ada\ntype: entity\n---\n\n# Ada\n",
		"utf8",
	);

	return vaultRoot;
}

function restoreVaultEnv(originalVault) {
	if (originalVault === undefined) {
		delete process.env.PERSONAL_GRAPH_VAULT;
		return;
	}
	process.env.PERSONAL_GRAPH_VAULT = originalVault;
}

test("buildExplorer maps wiki pages, raw sources, wikilinks, and dangling nodes", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const vaultRoot = createFixtureVault();
	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	const explorer = buildExplorer();
	const nodes = new Map(explorer.nodes.map((node) => [node.id, node]));
	const edges = new Map(explorer.edges.map((edge) => [edge.id, edge]));

	assert.equal(nodes.get("wiki:sources/Capture")?.kind, "source");
	assert.equal(nodes.get("wiki:concepts/Graph")?.kind, "concept");
	assert.equal(nodes.get("raw:capture")?.kind, "raw");
	assert.equal(nodes.get("wiki:entities/Ada")?.dangling, true);
	assert.equal(nodes.get("wiki:concepts/Missing")?.missing, true);
	assert.equal(nodes.get("wiki:concepts/Missing")?.dangling, true);

	assert.ok(
		edges.has("frontmatter_source:raw:capture<->wiki:sources/Capture"),
		"frontmatter sources should connect wiki pages to raw files",
	);
	assert.ok(
		edges.has("wiki_link:wiki:concepts/Graph<->wiki:sources/Capture"),
		"cross-folder wikilinks should resolve to wiki page nodes",
	);
	assert.equal(
		explorer.edges.filter((edge) => edge.id === "wiki_link:wiki:concepts/Graph<->wiki:sources/Capture").length,
		1,
		"bidirectional wikilinks should be deduped",
	);
});
