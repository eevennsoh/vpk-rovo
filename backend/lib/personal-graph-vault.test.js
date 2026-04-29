"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	listRaw,
	listWiki,
	parseFrontmatter,
	readPage,
} = require("./personal-graph-vault");

function createFixtureVault() {
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-vault-"));
	fs.mkdirSync(path.join(vaultRoot, "raw", "assets", "nested"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki", "concepts"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki", "entities"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki", "sources"), { recursive: true });

	fs.writeFileSync(
		path.join(vaultRoot, "raw", "capture.md"),
		[
			"---",
			'title: "Captured source"',
			"url: https://example.com/source",
			"---",
			"",
			"Raw source body.",
		].join("\n"),
		"utf8",
	);
	fs.writeFileSync(path.join(vaultRoot, "raw", "notes.txt"), "Plain source text.", "utf8");
	fs.writeFileSync(path.join(vaultRoot, "raw", "assets", "ignored.md"), "asset", "utf8");
	fs.writeFileSync(path.join(vaultRoot, "raw", "assets", "nested", "ignored.txt"), "asset", "utf8");

	fs.writeFileSync(
		path.join(vaultRoot, "wiki", "sources", "Capture.md"),
		[
			"---",
			'title: "Captured source"',
			"type: source",
			"tags: [capture, graph]",
			"sources:",
			"  - raw/capture.md",
			"---",
			"",
			"# Captured source",
			"",
			"Links to [[concepts/Graph]].",
		].join("\n"),
		"utf8",
	);
	fs.writeFileSync(
		path.join(vaultRoot, "wiki", "concepts", "Graph.markdown"),
		[
			"---",
			"title: Graph",
			"type: concept",
			"---",
			"",
			"# Graph",
		].join("\n"),
		"utf8",
	);
	fs.writeFileSync(
		path.join(vaultRoot, "wiki", "entities", "Ada.md"),
		[
			"---",
			"title: Ada",
			"type: entity",
			"---",
			"",
			"# Ada",
		].join("\n"),
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

function toPosixPath(value) {
	return value.split(path.sep).join("/");
}

test("listRaw skips the raw/assets subtree before traversal", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const originalReaddirSync = fs.readdirSync;
	const vaultRoot = createFixtureVault();

	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;
	fs.readdirSync = function patchedReaddirSync(targetPath, options) {
		const relativePath = toPosixPath(path.relative(vaultRoot, targetPath));
		if (relativePath === "raw/assets" || relativePath.startsWith("raw/assets/")) {
			throw new Error(`raw/assets should not be traversed: ${relativePath}`);
		}

		return originalReaddirSync.call(this, targetPath, options);
	};

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.readdirSync = originalReaddirSync;
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	assert.deepEqual(
		listRaw().map((entry) => entry.relativePath),
		["raw/capture.md", "raw/notes.txt"],
	);
});

test("listRaw and listWiki return stable vault file shapes", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const vaultRoot = createFixtureVault();
	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	assert.deepEqual(
		listRaw().map((entry) => ({
			name: entry.name,
			relativePath: entry.relativePath,
			slug: entry.slug,
		})),
		[
			{ name: "capture.md", relativePath: "raw/capture.md", slug: "capture" },
			{ name: "notes.txt", relativePath: "raw/notes.txt", slug: "notes" },
		],
	);

	assert.deepEqual(
		listWiki().map((entry) => ({
			name: entry.name,
			relativePath: entry.relativePath,
			slug: entry.slug,
		})),
		[
			{ name: "Graph.markdown", relativePath: "wiki/concepts/Graph.markdown", slug: "concepts/Graph" },
			{ name: "Ada.md", relativePath: "wiki/entities/Ada.md", slug: "entities/Ada" },
			{ name: "Capture.md", relativePath: "wiki/sources/Capture.md", slug: "sources/Capture" },
		],
	);
});

test("readPage keeps original content while parsing frontmatter", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const vaultRoot = createFixtureVault();
	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	const page = readPage("sources/Capture");

	assert.equal(page.slug, "sources/Capture");
	assert.equal(page.relativePath, "wiki/sources/Capture.md");
	assert.equal(page.frontmatter.title, "Captured source");
	assert.equal(page.frontmatter.type, "source");
	assert.deepEqual(page.frontmatter.tags, ["capture", "graph"]);
	assert.deepEqual(page.frontmatter.sources, ["raw/capture.md"]);
	assert.match(page.body, /Links to \[\[concepts\/Graph\]\]/u);
	assert.match(page.content, /^---\n/u);
});

test("missing vault throws VAULT_NOT_FOUND", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-missing-vault-"));
	process.env.PERSONAL_GRAPH_VAULT = path.join(tempRoot, "missing");

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.rmSync(tempRoot, { force: true, recursive: true });
	});

	assert.throws(
		() => listWiki(),
		(error) => error?.code === "VAULT_NOT_FOUND" && /does not exist/u.test(error.message),
	);
});

test("malformed frontmatter falls back without throwing", () => {
	const missingTerminator = "---\ntitle: Missing terminator\n# Body starts here";
	assert.deepEqual(parseFrontmatter(missingTerminator), {
		body: missingTerminator,
		frontmatter: {},
	});

	assert.deepEqual(
		parseFrontmatter("---\ntitle: Works\nthis line is malformed\n: blank key ignored\n---\nBody"),
		{
			body: "Body",
			frontmatter: {
				title: "Works",
			},
		},
	);
});
