"use strict";

const fs = require("node:fs/promises");
const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");

const {
	ensureFreshWikiQmdIndex,
	getQmdSyncSummary,
	QmdNotReadyError,
	getQmdAllowedRovodevMcpServerSignature,
	getQmdRovodevMcpServerConfig,
	searchWikiWithQmd,
	syncWikiQmdIndex,
	writeQmdSyncState,
} = require("./qmd");

test("syncWikiQmdIndex configures canonical wiki collections and embeds when needed", async () => {
	const wikiDir = "/tmp/wiki";
	const dbPath = path.join(os.tmpdir(), "qmd-sync-test.sqlite");
	const calls = {
		embed: 0,
		update: [],
	};
	let optionsSeen = null;

	const createStoreImpl = async (options) => {
		optionsSeen = options;
		return {
			close: async () => {},
			embed: async () => {
				calls.embed += 1;
				return { embedded: 3 };
			},
			getStatus: async () => ({
				collections: [{ name: "wiki-concepts" }],
				needsEmbedding: 0,
				totalDocuments: 3,
			}),
			update: async (updateOptions) => {
				calls.update.push(updateOptions);
				return {
					collections: 1,
					indexed: 3,
					needsEmbedding: 3,
					removed: 0,
					unchanged: 0,
					updated: 3,
				};
			},
		};
	};

	const result = await syncWikiQmdIndex({
		collectionNames: ["wiki-concepts"],
		createStoreImpl,
		dbPath,
		logger: { log() {} },
		wikiDir,
	});

	assert.equal(optionsSeen.dbPath, dbPath);
	assert.equal(
		optionsSeen.config.collections["wiki-concepts"].path,
		path.join(wikiDir, "concepts"),
	);
	assert.equal(
		optionsSeen.config.collections["wiki-concepts"].context["/"],
		"Canonical Atlassian concept pages for platform, strategy, AI, migration, and ecosystem topics.",
	);
	assert.deepEqual(calls.update, [{ collections: ["wiki-concepts"] }]);
	assert.equal(calls.embed, 1);
	assert.deepEqual(result.collections, ["wiki-concepts"]);
});

test("searchWikiWithQmd uses the existing qmd db and normalizes search results", async () => {
	const wikiDir = "/tmp/wiki";
	let optionsSeen = null;

	const results = await searchWikiWithQmd("rovo", {
		createStoreImpl: async (options) => {
			optionsSeen = options;
			return {
				close: async () => {},
				getStatus: async () => ({
					collections: [{ name: "wiki-entities" }],
					totalDocuments: 1,
				}),
				search: async () => [{
					bestChunk: "Rovo helps teams search and act on Atlassian knowledge.",
					body: "Longer body",
					file: path.join(wikiDir, "entities", "rovo.md"),
					score: 0.91,
					title: "Rovo",
				}],
			};
		},
		dbPath: path.join(os.tmpdir(), "qmd-search-test.sqlite"),
		limit: 7,
		wikiDir,
	});

	assert.deepEqual(optionsSeen, {
		dbPath: path.join(os.tmpdir(), "qmd-search-test.sqlite"),
	});
	assert.deepEqual(results, [{
		backend: "qmd",
		collection: "wiki-entities",
		path: path.join(wikiDir, "entities", "rovo.md"),
		score: 0.91,
		snippet: "Rovo helps teams search and act on Atlassian knowledge.",
		title: "Rovo",
	}]);
});

test("searchWikiWithQmd preserves qmd virtual paths and collection names from live-style results", async () => {
	const results = await searchWikiWithQmd("atlassian", {
		createStoreImpl: async () => ({
			close: async () => {},
			getStatus: async () => ({
				collections: [{ name: "wiki-entities" }],
				totalDocuments: 1,
			}),
			search: async () => [{
				bestChunk: "Atlassian overview",
				collectionName: "wiki-entities",
				filepath: "qmd://wiki-entities/atlassian.md",
				score: 0.5,
				title: "Atlassian",
			}],
		}),
		dbPath: path.join(os.tmpdir(), "qmd-virtual-path-test.sqlite"),
	});

	assert.deepEqual(results, [{
		backend: "qmd",
		collection: "wiki-entities",
		path: "qmd://wiki-entities/atlassian.md",
		score: 0.5,
		snippet: "Atlassian overview",
		title: "Atlassian",
	}]);
});

test("searchWikiWithQmd throws when the qmd index has not been prepared", async () => {
	await assert.rejects(
		searchWikiWithQmd("rovo", {
			createStoreImpl: async () => ({
				close: async () => {},
				getStatus: async () => ({
					collections: [],
					totalDocuments: 0,
				}),
			}),
			dbPath: path.join(os.tmpdir(), "qmd-empty-test.sqlite"),
		}),
		(error) => error instanceof QmdNotReadyError,
	);
});

test("getQmdRovodevMcpServerConfig returns a workspace-local stdio server", () => {
	const repoRoot = "/tmp/workspace";
	assert.equal(getQmdAllowedRovodevMcpServerSignature(), "stdio:pnpm:exec qmd mcp");
	assert.deepEqual(getQmdRovodevMcpServerConfig({ repoRoot }), {
		qmd: {
			args: ["exec", "qmd", "mcp"],
			command: "pnpm",
			env: {
				INDEX_PATH: path.join(repoRoot, ".cache", "qmd", "wiki.sqlite"),
			},
			type: "stdio",
		},
	});
});

test("ensureFreshWikiQmdIndex skips sync when the qmd state matches canonical wiki mtimes", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "qmd-fresh-"));
	const wikiDir = path.join(tmpDir, "wiki");
	const dbPath = path.join(tmpDir, "index.sqlite");
	const entityDir = path.join(wikiDir, "entities");
	await fs.mkdir(entityDir, { recursive: true });
	const pagePath = path.join(entityDir, "atlassian.md");
	await fs.writeFile(pagePath, "# Atlassian\n", "utf8");
	await fs.writeFile(dbPath, "", "utf8");
	const stats = await fs.stat(pagePath);
	await writeQmdSyncState({
		collections: ["wiki-entities"],
		dbPath,
		lastSyncedAt: stats.mtime.toISOString(),
		latestCanonicalUpdateAt: stats.mtime.toISOString(),
		needsEmbedding: 0,
		totalDocuments: 1,
		wikiDir,
	}, { dbPath });

	const result = await ensureFreshWikiQmdIndex({
		createStoreImpl: async () => ({
			close: async () => {},
			getStatus: async () => ({
				collections: [{ name: "wiki-entities" }],
				needsEmbedding: 0,
				totalDocuments: 1,
			}),
		}),
		dbPath,
		logger: { log() {} },
		wikiDir,
	});

	assert.equal(result.didSync, false);
	assert.equal(result.reason, "fresh");
	assert.equal(result.summary.stale, false);
});

test("ensureFreshWikiQmdIndex syncs when canonical wiki pages change outside ingest", async () => {
	const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "qmd-stale-"));
	const wikiDir = path.join(tmpDir, "wiki");
	const dbPath = path.join(tmpDir, "index.sqlite");
	const entityDir = path.join(wikiDir, "entities");
	await fs.mkdir(entityDir, { recursive: true });
	const pagePath = path.join(entityDir, "atlassian.md");
	await fs.writeFile(pagePath, "# Atlassian\n", "utf8");
	await fs.writeFile(dbPath, "", "utf8");
	await writeQmdSyncState({
		collections: ["wiki-entities"],
		dbPath,
		lastSyncedAt: "2026-01-01T00:00:00.000Z",
		latestCanonicalUpdateAt: "2026-01-01T00:00:00.000Z",
		needsEmbedding: 0,
		totalDocuments: 0,
		wikiDir,
	}, { dbPath });

	let updateCalls = 0;
	const result = await ensureFreshWikiQmdIndex({
		createStoreImpl: async () => ({
			close: async () => {},
			embed: async () => ({ embedded: 0 }),
			getStatus: async () => ({
				collections: [{ name: "wiki-entities" }],
				needsEmbedding: 0,
				totalDocuments: 1,
			}),
			update: async () => {
				updateCalls += 1;
				return {
					collections: 1,
					indexed: 1,
					needsEmbedding: 0,
					removed: 0,
					unchanged: 0,
					updated: 1,
				};
			},
		}),
		dbPath,
		logger: { log() {} },
		wikiDir,
	});

	assert.equal(result.didSync, true);
	assert.equal(result.reason, "stale");
	assert.equal(updateCalls, 1);
	const summary = await getQmdSyncSummary({
		createStoreImpl: async () => ({
			close: async () => {},
			getStatus: async () => ({
				collections: [{ name: "wiki-entities" }],
				needsEmbedding: 0,
				totalDocuments: 1,
			}),
		}),
		dbPath,
		wikiDir,
	});
	assert.equal(summary.stale, false);
	assert.equal(summary.totalDocuments, 1);
});
