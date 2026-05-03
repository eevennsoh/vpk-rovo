"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	appendLog,
	clearVaultConfig,
	getVaultSettings,
	getVaultRoot,
	listRaw,
	listWiki,
	parseFrontmatter,
	readPage,
	selectVaultRoot,
	unprocessedRawSources,
	writeVaultConfig,
	writePage,
	writeRaw,
} = require("./personal-graph-vault");

const TEST_VAULT_CONFIG_PATH = path.join(os.tmpdir(), `personal-graph-vault-test-${process.pid}.json`);
fs.rmSync(TEST_VAULT_CONFIG_PATH, { force: true });
process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = TEST_VAULT_CONFIG_PATH;
delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

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

function restoreEnvValue(key, originalValue) {
	if (originalValue === undefined) {
		delete process.env[key];
		return;
	}

	process.env[key] = originalValue;
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

test("local folder picker config takes priority over env fallback", (t) => {
	const originalConfigPath = process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH;
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const configPath = path.join(os.tmpdir(), `personal-graph-config-priority-${process.pid}.json`);
	const envRoot = createFixtureVault();
	const selectedRoot = createFixtureVault();

	process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = configPath;
	process.env.PERSONAL_GRAPH_VAULT = envRoot;
	delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

	t.after(() => {
		restoreEnvValue("PERSONAL_GRAPH_VAULT_CONFIG_PATH", originalConfigPath);
		restoreEnvValue("PERSONAL_GRAPH_SELECTED_VAULT", originalSelectedVault);
		restoreVaultEnv(originalVault);
		fs.rmSync(configPath, { force: true });
		fs.rmSync(envRoot, { force: true, recursive: true });
		fs.rmSync(selectedRoot, { force: true, recursive: true });
	});

	writeVaultConfig(selectedRoot);
	delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

	const settings = getVaultSettings();
	assert.equal(settings.root, selectedRoot);
	assert.equal(settings.source, "folder-picker");
	assert.equal(getVaultRoot(), selectedRoot);
});

test("clearVaultConfig removes the folder picker config and selected env override", (t) => {
	const originalConfigPath = process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH;
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const configPath = path.join(os.tmpdir(), `personal-graph-clear-${process.pid}.json`);
	const envRoot = createFixtureVault();
	const selectedRoot = createFixtureVault();

	process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = configPath;
	process.env.PERSONAL_GRAPH_VAULT = envRoot;
	delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

	t.after(() => {
		restoreEnvValue("PERSONAL_GRAPH_VAULT_CONFIG_PATH", originalConfigPath);
		restoreEnvValue("PERSONAL_GRAPH_SELECTED_VAULT", originalSelectedVault);
		restoreVaultEnv(originalVault);
		fs.rmSync(configPath, { force: true });
		fs.rmSync(envRoot, { force: true, recursive: true });
		fs.rmSync(selectedRoot, { force: true, recursive: true });
	});

	writeVaultConfig(selectedRoot);

	const settings = clearVaultConfig();
	assert.equal(fs.existsSync(configPath), false);
	assert.equal(process.env.PERSONAL_GRAPH_SELECTED_VAULT, undefined);
	assert.equal(settings.root, envRoot);
	assert.equal(settings.source, "env");
});

test("selectVaultRoot persists a macOS folder selection", async (t) => {
	const originalConfigPath = process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH;
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const configPath = path.join(os.tmpdir(), `personal-graph-select-${process.pid}.json`);
	const selectedRoot = createFixtureVault();
	process.env.PERSONAL_GRAPH_VAULT_CONFIG_PATH = configPath;
	delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;

	t.after(() => {
		restoreEnvValue("PERSONAL_GRAPH_VAULT_CONFIG_PATH", originalConfigPath);
		restoreEnvValue("PERSONAL_GRAPH_SELECTED_VAULT", originalSelectedVault);
		fs.rmSync(configPath, { force: true });
		fs.rmSync(selectedRoot, { force: true, recursive: true });
	});

	const execFileImpl = (command, args, options, callback) => {
		assert.equal(command, "osascript");
		assert.deepEqual(args.slice(0, 1), ["-e"]);
		assert.equal(options.timeout, 120000);
		callback(null, `${selectedRoot}\n`, "");
	};

	const settings = await selectVaultRoot({ execFileImpl, platform: "darwin" });
	assert.equal(settings.root, selectedRoot);
	assert.equal(JSON.parse(fs.readFileSync(configPath, "utf8")).vaultRoot, selectedRoot);
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

test("writePage and writeRaw round-trip inside vault roots", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const vaultRoot = createFixtureVault();
	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	const content = "---\ntitle: Saved\ntype: concept\n---\n\n# Saved\n";
	const page = writePage("concepts/Saved", content);
	assert.equal(page.slug, "concepts/Saved");
	assert.equal(readPage("concepts/Saved").content, content);

	const raw = writeRaw("dropped", "Dropped source.");
	assert.equal(raw.relativePath, "raw/dropped.md");
	assert.equal(fs.readFileSync(path.join(vaultRoot, "raw", "dropped.md"), "utf8"), "Dropped source.");
});

test("writePage rejects markdown without frontmatter", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const vaultRoot = createFixtureVault();
	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	assert.throws(
		() => writePage("concepts/Nope", "# Missing frontmatter"),
		(error) => error?.code === "INVALID_FRONTMATTER",
	);
});

test("appendLog serializes entries and unprocessedRawSources reads ingest state", async (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const vaultRoot = createFixtureVault();
	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;

	t.after(() => {
		restoreVaultEnv(originalVault);
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	await Promise.all([
		appendLog({ type: "ingest", source: "raw/capture.md", pagesWritten: ["wiki/sources/Capture.md"] }),
		appendLog({ type: "ingest", source: "raw/another.md", pagesWritten: [] }),
	]);

	const logText = fs.readFileSync(path.join(vaultRoot, "wiki", "log.md"), "utf8");
	const lines = logText.trim().split("\n");
	assert.equal(lines.length, 2);
	for (const line of lines) {
		assert.equal(JSON.parse(line).type, "ingest");
	}

	assert.deepEqual(unprocessedRawSources(), {
		count: 1,
		paths: ["raw/notes.txt"],
	});
});
