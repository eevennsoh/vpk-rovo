"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_WIKI_DIR = "/Users/esoh/wiki";
const DEFAULT_QMD_DB_FILENAME = "wiki.sqlite";
const DEFAULT_QMD_SYNC_STATE_FILENAME = "wiki-sync-state.json";
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const QMD_COLLECTION_DEFINITIONS = Object.freeze([
	{
		context: "Canonical user profile memory pages for preferences, identity, and durable personal context.",
		dir: "profiles",
		name: "wiki-profiles",
		type: "profile",
	},
	{
		context: "Canonical runtime memory pages for project conventions, durable workflow notes, and operational memory.",
		dir: "operations",
		name: "wiki-operations",
		type: "operations",
	},
	{
		context: "Canonical source pages that summarize raw captures and memory proposals before they are linked across the wiki.",
		dir: "sources",
		name: "wiki-sources",
		type: "source",
	},
	{
		context: "Canonical Atlassian entity pages for products, people, teams, and companies.",
		dir: "entities",
		name: "wiki-entities",
		type: "entity",
	},
	{
		context: "Canonical Atlassian concept pages for platform, strategy, AI, migration, and ecosystem topics.",
		dir: "concepts",
		name: "wiki-concepts",
		type: "concept",
	},
	{
		context: "Canonical side-by-side comparisons for Atlassian products, competitors, and technical choices.",
		dir: "comparisons",
		name: "wiki-comparisons",
		type: "comparison",
	},
	{
		context: "Canonical filed query pages that capture reusable research answers and synthesized findings.",
		dir: "queries",
		name: "wiki-queries",
		type: "query",
	},
	{
		context: "Canonical synthesized pages that compile durable linked knowledge across the wiki.",
		dir: "synthesis",
		name: "wiki-synthesis",
		type: "synthesis",
	},
]);

const QMD_COLLECTION_NAMES = Object.freeze(
	QMD_COLLECTION_DEFINITIONS.map((definition) => definition.name),
);

const QMD_GLOBAL_CONTEXT = [
	"Atlassian knowledge wiki and wiki-backed Hermes memory.",
	"Canonical pages are the source of truth for durable research, profile memory, runtime memory, and memory synthesis.",
	"Prefer product names, internal platforms, ecosystem terms, pricing, migration, AI, company strategy language, and concise durable memory statements.",
].join(" ");

class QmdNotReadyError extends Error {
	constructor(message = "QMD index is not ready.") {
		super(message);
		this.code = "QMD_NOT_READY";
	}
}

function getWorkspaceQmdCacheDir({ repoRoot = REPO_ROOT } = {}) {
	return path.join(repoRoot, ".cache", "qmd");
}

function getWorkspaceQmdDbPath({ repoRoot = REPO_ROOT } = {}) {
	return path.join(getWorkspaceQmdCacheDir({ repoRoot }), DEFAULT_QMD_DB_FILENAME);
}

function getQmdSyncStatePath({ dbPath = getWorkspaceQmdDbPath() } = {}) {
	return path.join(path.dirname(dbPath), DEFAULT_QMD_SYNC_STATE_FILENAME);
}

function getQmdAllowedRovodevMcpServerSignature() {
	return "stdio:pnpm:exec qmd mcp";
}

function getQmdRovodevMcpServerConfig({ repoRoot = REPO_ROOT } = {}) {
	return {
		qmd: {
			args: ["exec", "qmd", "mcp"],
			command: "pnpm",
			env: {
				INDEX_PATH: getWorkspaceQmdDbPath({ repoRoot }),
			},
			type: "stdio",
		},
	};
}

function getQmdCollectionDefinitions({ wikiDir = DEFAULT_WIKI_DIR } = {}) {
	return QMD_COLLECTION_DEFINITIONS.map((definition) => ({
		...definition,
		path: path.join(wikiDir, definition.dir),
	}));
}

function buildQmdConfig({ wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const collections = Object.fromEntries(
		getQmdCollectionDefinitions({ wikiDir }).map((definition) => [
			definition.name,
			{
				context: {
					"/": definition.context,
				},
				includeByDefault: true,
				path: definition.path,
				pattern: "**/*.md",
			},
		]),
	);

	return {
		collections,
		global_context: QMD_GLOBAL_CONTEXT,
	};
}

async function ensureQmdWorkspacePaths({ dbPath = getWorkspaceQmdDbPath() } = {}) {
	await fs.mkdir(path.dirname(dbPath), { recursive: true });
	return dbPath;
}

async function readJsonFile(filePath) {
	try {
		const content = await fs.readFile(filePath, "utf8");
		return JSON.parse(content);
	} catch (error) {
		if (error?.code === "ENOENT") {
			return null;
		}

		throw error;
	}
}

async function writeJsonFile(filePath, value) {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, `${JSON.stringify(value, null, "\t")}\n`, "utf8");
}

async function fileExists(filePath) {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function walkMarkdownFiles(dirPath) {
	let entries;
	try {
		entries = await fs.readdir(dirPath, { withFileTypes: true });
	} catch (error) {
		if (error?.code === "ENOENT") {
			return [];
		}

		throw error;
	}

	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkMarkdownFiles(fullPath)));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

async function getLatestCanonicalWikiUpdateAt({ wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const collectionRoots = getQmdCollectionDefinitions({ wikiDir }).map((definition) => definition.path);
	let latestTimestamp = null;

	for (const collectionRoot of collectionRoots) {
		const files = await walkMarkdownFiles(collectionRoot);
		for (const filePath of files) {
			const stats = await fs.stat(filePath);
			const timestamp = stats.mtime.toISOString();
			if (!latestTimestamp || timestamp > latestTimestamp) {
				latestTimestamp = timestamp;
			}
		}
	}

	return latestTimestamp;
}

async function readQmdSyncState({ dbPath = getWorkspaceQmdDbPath() } = {}) {
	return readJsonFile(getQmdSyncStatePath({ dbPath }));
}

async function writeQmdSyncState(state, { dbPath = getWorkspaceQmdDbPath() } = {}) {
	await writeJsonFile(getQmdSyncStatePath({ dbPath }), state);
}

async function loadQmdSdk({ importImpl = (specifier) => import(specifier) } = {}) {
	return importImpl("@tobilu/qmd");
}

async function createQmdStore({
	config,
	createStoreImpl,
	dbPath = getWorkspaceQmdDbPath(),
	importImpl,
} = {}) {
	const resolvedDbPath = await ensureQmdWorkspacePaths({ dbPath });
	const qmd = createStoreImpl
		? { createStore: createStoreImpl }
		: await loadQmdSdk({ importImpl });
	const options = config ? { config, dbPath: resolvedDbPath } : { dbPath: resolvedDbPath };
	const store = await qmd.createStore(options);
	return {
		dbPath: resolvedDbPath,
		store,
	};
}

function resolveQmdCollectionNameForCanonicalType(type) {
	return (
		QMD_COLLECTION_DEFINITIONS.find((definition) => definition.type === type)?.name
		?? null
	);
}

function resolveQmdCollectionNameForFilePath(filePath, { wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const normalizedPath = path.resolve(filePath);
	for (const definition of getQmdCollectionDefinitions({ wikiDir })) {
		const collectionRoot = path.resolve(definition.path);
		if (
			normalizedPath === collectionRoot
			|| normalizedPath.startsWith(`${collectionRoot}${path.sep}`)
		) {
			return definition.name;
		}
	}

	return null;
}

function normalizeSnippet(value) {
	if (typeof value !== "string") {
		return "";
	}

	const normalized = value.replace(/\s+/gu, " ").trim();
	return normalized.length > 280 ? `${normalized.slice(0, 277).trimEnd()}...` : normalized;
}

function getQmdResultPath(result) {
	if (typeof result?.filepath === "string" && result.filepath.trim()) {
		return result.filepath.trim();
	}

	if (typeof result?.file === "string" && result.file.trim()) {
		return result.file.trim();
	}

	return null;
}

function getQmdCollectionNameFromVirtualPath(filePath) {
	if (typeof filePath !== "string" || !filePath.startsWith("qmd://")) {
		return null;
	}

	const trimmed = filePath.slice("qmd://".length).replace(/^\/+/u, "");
	const [collectionName] = trimmed.split("/", 1);
	return collectionName || null;
}

function normalizeQmdSearchResults(results, { wikiDir = DEFAULT_WIKI_DIR } = {}) {
	if (!Array.isArray(results)) {
		return [];
	}

	return results.map((result) => {
		const filePath = getQmdResultPath(result);
		return {
			backend: "qmd",
			collection:
				(typeof result?.collectionName === "string" && result.collectionName.trim())
					? result.collectionName.trim()
					: getQmdCollectionNameFromVirtualPath(filePath)
						?? (filePath ? resolveQmdCollectionNameForFilePath(filePath, { wikiDir }) : null),
			path: filePath,
			score: typeof result.score === "number" ? result.score : 0,
			snippet: normalizeSnippet(result.bestChunk || result.body),
			title: typeof result.title === "string" && result.title.trim()
				? result.title.trim()
				: filePath
					? path.basename(filePath, path.extname(filePath))
					: "Untitled",
		};
	});
}

function normalizeNaiveWikiSearchResults(results, { wikiDir = DEFAULT_WIKI_DIR } = {}) {
	if (!Array.isArray(results)) {
		return [];
	}

	return results.map((result) => ({
		backend: "naive",
		collection: resolveQmdCollectionNameForFilePath(result.path, { wikiDir }),
		path: result.path,
		score: typeof result.score === "number" ? result.score : 0,
		snippet: normalizeSnippet(result.snippet),
		title: result.title,
	}));
}

async function syncWikiQmdIndex({
	collectionNames,
	createStoreImpl,
	dbPath = getWorkspaceQmdDbPath(),
	importImpl,
	logger = console,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const requestedCollections = Array.isArray(collectionNames) && collectionNames.length > 0
		? Array.from(
			new Set(
				collectionNames.filter((name) => QMD_COLLECTION_NAMES.includes(name)),
			),
		)
		: [...QMD_COLLECTION_NAMES];
	const config = buildQmdConfig({ wikiDir });
	const { store, dbPath: resolvedDbPath } = await createQmdStore({
		config,
		createStoreImpl,
		dbPath,
		importImpl,
	});

	try {
		const updateResult = await store.update({ collections: requestedCollections });
		let embedResult = null;
		if (updateResult.needsEmbedding > 0) {
			logger.log?.(
				`[qmd] Embedding ${updateResult.needsEmbedding} queued wiki documents...`,
			);
			embedResult = await store.embed({});
		}

		const status = await store.getStatus();
		const syncedAt = new Date().toISOString();
		const latestCanonicalUpdateAt = await getLatestCanonicalWikiUpdateAt({ wikiDir });
		await writeQmdSyncState({
			collections: requestedCollections,
			dbPath: resolvedDbPath,
			lastSyncedAt: syncedAt,
			latestCanonicalUpdateAt,
			needsEmbedding: typeof status?.needsEmbedding === "number" ? status.needsEmbedding : 0,
			totalDocuments: typeof status?.totalDocuments === "number" ? status.totalDocuments : 0,
			wikiDir,
		}, { dbPath: resolvedDbPath });

		return {
			collections: requestedCollections,
			dbPath: resolvedDbPath,
			embedResult,
			lastSyncedAt: syncedAt,
			latestCanonicalUpdateAt,
			status,
			updateResult,
		};
	} finally {
		await store.close();
	}
}

async function getQmdSyncSummary({
	createStoreImpl,
	dbPath = getWorkspaceQmdDbPath(),
	importImpl,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const resolvedDbPath = await ensureQmdWorkspacePaths({ dbPath });
	const [dbExists, latestCanonicalUpdateAt, syncState] = await Promise.all([
		fileExists(resolvedDbPath),
		getLatestCanonicalWikiUpdateAt({ wikiDir }),
		readQmdSyncState({ dbPath: resolvedDbPath }),
	]);

	let status = null;
	let errorMessage = null;

	if (dbExists) {
		try {
			const { store } = await createQmdStore({
				createStoreImpl,
				dbPath: resolvedDbPath,
				importImpl,
			});
			try {
				status = await store.getStatus();
			} finally {
				await store.close();
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : String(error);
		}
	}

	const lastSyncedAt = typeof syncState?.lastSyncedAt === "string"
		? syncState.lastSyncedAt
		: null;
	const stale = !dbExists
		|| latestCanonicalUpdateAt !== (typeof syncState?.latestCanonicalUpdateAt === "string"
			? syncState.latestCanonicalUpdateAt
			: null);

	return {
		collections: Array.isArray(status?.collections)
			? status.collections.map((collection) => collection.name)
			: Array.isArray(syncState?.collections)
				? syncState.collections
				: [],
		dbExists,
		dbPath: resolvedDbPath,
		errorMessage,
		lastSyncedAt,
		latestCanonicalUpdateAt,
		needsEmbedding:
			typeof status?.needsEmbedding === "number"
				? status.needsEmbedding
				: typeof syncState?.needsEmbedding === "number"
					? syncState.needsEmbedding
					: 0,
		stale,
		totalDocuments:
			typeof status?.totalDocuments === "number"
				? status.totalDocuments
				: typeof syncState?.totalDocuments === "number"
					? syncState.totalDocuments
					: 0,
	};
}

async function ensureFreshWikiQmdIndex({
	collectionNames,
	createStoreImpl,
	dbPath = getWorkspaceQmdDbPath(),
	force = false,
	importImpl,
	logger = console,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const summary = await getQmdSyncSummary({
		createStoreImpl,
		dbPath,
		importImpl,
		wikiDir,
	});

	if (!force && !summary.stale) {
		return {
			didSync: false,
			reason: "fresh",
			summary,
		};
	}

	const syncResult = await syncWikiQmdIndex({
		collectionNames,
		createStoreImpl,
		dbPath,
		importImpl,
		logger,
		wikiDir,
	});
	const nextSummary = await getQmdSyncSummary({
		createStoreImpl,
		dbPath,
		importImpl,
		wikiDir,
	});

	return {
		didSync: true,
		reason: force ? "forced" : (summary.dbExists ? "stale" : "missing-index"),
		summary: nextSummary,
		syncResult,
	};
}

async function searchWikiWithQmd(
	query,
	{
		createStoreImpl,
		dbPath = getWorkspaceQmdDbPath(),
		importImpl,
		limit = 10,
		wikiDir = DEFAULT_WIKI_DIR,
	} = {},
) {
	if (typeof query !== "string" || !query.trim()) {
		return [];
	}

	const { store } = await createQmdStore({
		createStoreImpl,
		dbPath,
		importImpl,
	});

	try {
		const status = await store.getStatus();
		const availableCollections = new Set(
			Array.isArray(status?.collections)
				? status.collections.map((collection) => collection.name)
				: [],
		);
		const indexedCollections = QMD_COLLECTION_NAMES.filter((name) => availableCollections.has(name));
		if (indexedCollections.length === 0 || (status?.totalDocuments ?? 0) === 0) {
			throw new QmdNotReadyError();
		}

		const results = await store.search({
			collections: indexedCollections,
			limit,
			query: query.trim(),
		});
		return normalizeQmdSearchResults(results, { wikiDir });
	} finally {
		await store.close();
	}
}

module.exports = {
	DEFAULT_WIKI_DIR,
	QMD_COLLECTION_NAMES,
	QmdNotReadyError,
	buildQmdConfig,
	ensureFreshWikiQmdIndex,
	getQmdAllowedRovodevMcpServerSignature,
	getQmdCollectionDefinitions,
	getQmdRovodevMcpServerConfig,
	getQmdSyncStatePath,
	getQmdSyncSummary,
	getWorkspaceQmdCacheDir,
	getWorkspaceQmdDbPath,
	normalizeNaiveWikiSearchResults,
	normalizeQmdSearchResults,
	readQmdSyncState,
	resolveQmdCollectionNameForCanonicalType,
	resolveQmdCollectionNameForFilePath,
	searchWikiWithQmd,
	syncWikiQmdIndex,
	writeQmdSyncState,
};
