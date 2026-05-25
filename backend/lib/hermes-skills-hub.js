/**
 * Skills Hub — Core client, hub state management, and unified search for the Hermes Skills Hub.
 *
 * Provides:
 * - SkillMeta / SkillBundle data models (JSDoc typedefs)
 * - Hub directory management (.hub/, index-cache/, lock.json, audit.log, taps.json)
 * - Index cache (file-based, 1-hour TTL)
 * - HubLockFile: provenance tracking for installed hub skills
 * - TapsManager: custom GitHub repo source management
 * - Audit log: append-only install/uninstall event log
 * - parseFrontmatterQuick: regex-based YAML frontmatter parser (no deps)
 * - createSourceRouter / unifiedSearch: multi-source skill discovery
 * - createSkillsHubClient: enhanced hub client with search, browse, inspect, install
 *
 * Ported from NousResearch/hermes-agent tools/skills_hub.py + hermes_cli/skills_hub.py.
 */

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const { getHermesSkillsDir } = require("./hermes-config");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORY = "community";
const INDEX_CACHE_TTL = 3600; // 1 hour in seconds

const TRUST_RANK = /** @type {const} */ ({ builtin: 3, trusted: 2, community: 1 });

// ---------------------------------------------------------------------------
// Data models (JSDoc typedefs)
// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   name: string,
 *   description: string,
 *   source: string,
 *   identifier: string,
 *   trustLevel: "builtin" | "trusted" | "community",
 *   repo?: string | null,
 *   path?: string | null,
 *   tags: string[],
 *   extra: Record<string, unknown>
 * }} SkillMeta
 */

/**
 * @typedef {{
 *   name: string,
 *   files: Record<string, string>,
 *   source: string,
 *   identifier: string,
 *   trustLevel: "builtin" | "trusted" | "community",
 *   metadata: Record<string, unknown>
 * }} SkillBundle
 */

/**
 * @typedef {{ path: string, content: string }} LegacyBundleFile
 * @typedef {{ name: string, category?: string, description?: string, files: LegacyBundleFile[] }} LegacySkillBundle
 * @typedef {{ valid: boolean, error?: string }} ValidationResult
 */

/**
 * @typedef {{
 *   sourceId: () => string,
 *   search: (query: string, limit?: number) => Promise<SkillMeta[]>,
 *   fetch: (identifier: string) => Promise<SkillBundle | null>,
 *   inspect: (identifier: string) => Promise<SkillMeta | null>,
 *   trustLevelFor: (identifier: string) => "builtin" | "trusted" | "community"
 * }} SourceAdapter
 */

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/** @returns {string} */
function getHubDir() {
	const skillsDir = getHermesSkillsDir();
	return path.join(skillsDir, ".hub");
}

/** @returns {string} */
function getLockFilePath() {
	return path.join(getHubDir(), "lock.json");
}

/** @returns {string} */
function getAuditLogPath() {
	return path.join(getHubDir(), "audit.log");
}

/** @returns {string} */
function getTapsFilePath() {
	return path.join(getHubDir(), "taps.json");
}

/** @returns {string} */
function getIndexCacheDir() {
	return path.join(getHubDir(), "index-cache");
}

// ---------------------------------------------------------------------------
// Hub directory management
// ---------------------------------------------------------------------------

async function ensureHubDirs() {
	const hubDir = getHubDir();
	const cacheDir = getIndexCacheDir();
	const lockPath = getLockFilePath();
	const auditPath = getAuditLogPath();
	const tapsPath = getTapsFilePath();

	await fs.mkdir(hubDir, { recursive: true });
	await fs.mkdir(cacheDir, { recursive: true });

	// Create default files if they don't exist
	for (const [filePath, defaultContent] of [
		[lockPath, '{"version": 1, "installed": {}}\n'],
		[auditPath, ""],
		[tapsPath, '{"taps": []}\n'],
	]) {
		try {
			await fs.access(filePath);
		} catch {
			await fs.writeFile(filePath, defaultContent, "utf8");
		}
	}

	// Create .ignore so ripgrep skips cached community content
	const ignorePath = path.join(hubDir, ".ignore");
	try {
		await fs.access(ignorePath);
	} catch {
		await fs.writeFile(ignorePath, "# Exclude hub internals from search tools\n*\n", "utf8");
	}
}

// ---------------------------------------------------------------------------
// Index cache (file-based, 1-hour TTL)
// ---------------------------------------------------------------------------

/**
 * Read cached data if the file exists and is not expired.
 * @param {string} key
 * @returns {Promise<unknown | null>}
 */
async function readIndexCache(key) {
	const cacheFile = path.join(getIndexCacheDir(), `${key}.json`);
	try {
		const stat = await fs.stat(cacheFile);
		const ageSeconds = (Date.now() - stat.mtimeMs) / 1000;
		if (ageSeconds > INDEX_CACHE_TTL) {
			return null;
		}
		const content = await fs.readFile(cacheFile, "utf8");
		return JSON.parse(content);
	} catch {
		return null;
	}
}

/**
 * Write data to cache file.
 * @param {string} key
 * @param {unknown} data
 */
async function writeIndexCache(key, data) {
	const cacheDir = getIndexCacheDir();
	await fs.mkdir(cacheDir, { recursive: true });
	const cacheFile = path.join(cacheDir, `${key}.json`);
	try {
		await fs.writeFile(cacheFile, JSON.stringify(data), "utf8");
	} catch {
		// Cache write failures are non-fatal
	}
}

// ---------------------------------------------------------------------------
// YAML frontmatter parser (regex-based, no deps)
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from SKILL.md content.
 * Handles simple key-value pairs plus nested `metadata.hermes.tags`.
 * @param {string} content
 * @returns {Record<string, unknown>}
 */
function parseFrontmatterQuick(content) {
	if (!content || !content.startsWith("---")) {
		return {};
	}
	const endMatch = content.slice(3).match(/\n---\s*\n/);
	if (!endMatch) {
		return {};
	}
	const yamlText = content.slice(3, endMatch.index + 3);
	/** @type {Record<string, unknown>} */
	const result = {};

	for (const line of yamlText.split("\n")) {
		const match = line.match(/^([a-zA-Z_]\w*):\s*(.+)$/);
		if (match) {
			const value = match[2].trim();
			// Handle inline arrays: [tag1, tag2]
			if (value.startsWith("[") && value.endsWith("]")) {
				result[match[1]] = value
					.slice(1, -1)
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean);
			} else {
				result[match[1]] = value;
			}
		}
	}
	return result;
}

// ---------------------------------------------------------------------------
// HubLockFile — provenance tracking for installed hub skills
// ---------------------------------------------------------------------------

/**
 * @param {string} [lockPath]
 */
function createHubLockFile(lockPath) {
	const filePath = lockPath || getLockFilePath();

	async function load() {
		try {
			const content = await fs.readFile(filePath, "utf8");
			return JSON.parse(content);
		} catch {
			return { version: 1, installed: {} };
		}
	}

	async function save(data) {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
	}

	async function recordInstall({ name, source, identifier, trustLevel, contentHash, installPath, files, metadata }) {
		const data = await load();
		data.installed[name] = {
			source,
			identifier,
			trustLevel,
			contentHash,
			installPath,
			files,
			metadata: metadata || {},
			installedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await save(data);
	}

	async function recordUninstall(name) {
		const data = await load();
		delete data.installed[name];
		await save(data);
	}

	async function getInstalled(name) {
		const data = await load();
		return data.installed[name] || null;
	}

	async function listInstalled() {
		const data = await load();
		return Object.entries(data.installed).map(([name, entry]) => ({
			name,
			.../** @type {object} */ (entry),
		}));
	}

	async function isHubInstalled(name) {
		const data = await load();
		return name in data.installed;
	}

	return { load, save, recordInstall, recordUninstall, getInstalled, listInstalled, isHubInstalled };
}

// ---------------------------------------------------------------------------
// TapsManager — custom GitHub repo sources
// ---------------------------------------------------------------------------

/**
 * @param {string} [tapsPath]
 */
function createTapsManager(tapsPath) {
	const filePath = tapsPath || getTapsFilePath();

	async function load() {
		try {
			const content = await fs.readFile(filePath, "utf8");
			const data = JSON.parse(content);
			return data.taps || [];
		} catch {
			return [];
		}
	}

	async function save(taps) {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, JSON.stringify({ taps }, null, 2) + "\n", "utf8");
	}

	async function add(repo, repoPath = "skills/") {
		const taps = await load();
		if (taps.some((t) => t.repo === repo)) {
			return false;
		}
		taps.push({ repo, path: repoPath });
		await save(taps);
		return true;
	}

	async function remove(repo) {
		const taps = await load();
		const next = taps.filter((t) => t.repo !== repo);
		if (next.length === taps.length) {
			return false;
		}
		await save(next);
		return true;
	}

	async function listTaps() {
		return load();
	}

	return { load, save, add, remove, listTaps };
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

/**
 * @param {string} action
 * @param {string} skillName
 * @param {string} source
 * @param {string} trustLevel
 * @param {string} verdict
 * @param {string} [extra]
 */
async function appendAuditLog(action, skillName, source, trustLevel, verdict, extra = "") {
	return appendAuditLogToPath(getAuditLogPath(), action, skillName, source, trustLevel, verdict, extra);
}

/**
 * @param {string} logPath
 * @param {string} action
 * @param {string} skillName
 * @param {string} source
 * @param {string} trustLevel
 * @param {string} verdict
 * @param {string} [extra]
 */
async function appendAuditLogToPath(logPath, action, skillName, source, trustLevel, verdict, extra = "") {
	await fs.mkdir(path.dirname(logPath), { recursive: true });
	const timestamp = new Date().toISOString().replace(/\.\d+Z$/, "Z");
	const parts = [timestamp, action, skillName, `${source}:${trustLevel}`, verdict];
	if (extra) {
		parts.push(extra);
	}
	try {
		await fs.appendFile(logPath, parts.join(" ") + "\n", "utf8");
	} catch {
		// Audit log write failures are non-fatal
	}
}

// ---------------------------------------------------------------------------
// Content hash
// ---------------------------------------------------------------------------

/**
 * Compute a deterministic hash for a skill bundle's files.
 * @param {Record<string, string>} files
 * @returns {string}
 */
function bundleContentHash(files) {
	const h = crypto.createHash("sha256");
	for (const relPath of Object.keys(files).sort()) {
		h.update(files[relPath]);
	}
	return `sha256:${h.digest("hex").slice(0, 16)}`;
}

const SKILL_SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function validateSkillSlug(value, label) {
	if (typeof value !== "string" || !value.trim()) {
		return { valid: false, error: `${label} is empty` };
	}

	const trimmed = value.trim();
	if (
		trimmed.includes("/") ||
		trimmed.includes("\\") ||
		trimmed === "." ||
		trimmed === ".." ||
		!SKILL_SLUG_PATTERN.test(trimmed)
	) {
		return { valid: false, error: `${label} contains invalid path characters` };
	}

	return { valid: true, value: trimmed };
}

function requireSkillSlug(value, label) {
	const validation = validateSkillSlug(value, label);
	if (!validation.valid) {
		throw new Error(validation.error);
	}

	return validation.value;
}

function resolveContainedPath(rootDir, ...segments) {
	const resolvedRoot = path.resolve(rootDir);
	const targetPath = path.resolve(resolvedRoot, ...segments);
	const relativePath = path.relative(resolvedRoot, targetPath);
	if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
		throw new Error(`Rejected path traversal: ${segments.join("/")}`);
	}

	return targetPath;
}

// ---------------------------------------------------------------------------
// Validate skill bundle (backward-compatible with legacy array format)
// ---------------------------------------------------------------------------

/**
 * @param {LegacySkillBundle | SkillBundle} bundle
 * @returns {ValidationResult}
 */
function validateSkillBundle(bundle) {
	if (!bundle || typeof bundle !== "object") {
		return { valid: false, error: "Bundle is not an object" };
	}

	if (typeof bundle.name !== "string" || !bundle.name.trim()) {
		return { valid: false, error: "Bundle name is empty" };
	}

	const nameValidation = validateSkillSlug(bundle.name, "Bundle name");
	if (!nameValidation.valid) {
		return { valid: false, error: nameValidation.error };
	}

	if (bundle.category !== undefined) {
		const categoryValidation = validateSkillSlug(bundle.category, "Bundle category");
		if (!categoryValidation.valid) {
			return { valid: false, error: categoryValidation.error };
		}
	}

	// Support both legacy array format and new dict format
	const files = Array.isArray(bundle.files)
		? bundle.files
		: Object.entries(bundle.files || {}).map(([p, c]) => ({ path: p, content: c }));

	if (files.length === 0) {
		return { valid: false, error: "Bundle has no files" };
	}

	for (const file of files) {
		if (typeof file.path !== "string" || !file.path.trim()) {
			return { valid: false, error: "File has empty path" };
		}
		const normalized = path.normalize(file.path);
		if (normalized.startsWith("..") || normalized.includes("/../") || normalized.includes("\\..\\")) {
			return { valid: false, error: `Rejected path traversal in file: ${file.path}` };
		}
		if (path.isAbsolute(file.path)) {
			return { valid: false, error: `Rejected absolute path in file: ${file.path}` };
		}
		try {
			resolveContainedPath(".", file.path);
		} catch {
			return { valid: false, error: `Rejected path traversal in file: ${file.path}` };
		}
	}

	const hasSkillMd = files.some(
		(f) => path.basename(f.path).toUpperCase() === "SKILL.MD",
	);
	if (!hasSkillMd) {
		return { valid: false, error: "Bundle must include a SKILL.md file" };
	}

	return { valid: true };
}

// ---------------------------------------------------------------------------
// Source router and unified search
// ---------------------------------------------------------------------------

/**
 * Create all configured source adapters.
 * @returns {SourceAdapter[]}
 */
function createSourceRouter() {
	// Lazy-require adapters to avoid circular deps and speed up boot
	const { createGitHubAuth, createGitHubSource } = require("./hermes-skills-hub-github");
	const { createSkillsShSource } = require("./hermes-skills-hub-skillssh");
	const { createClawHubSource } = require("./hermes-skills-hub-clawhub");
	const { createLobeHubSource } = require("./hermes-skills-hub-lobehub");

	const auth = createGitHubAuth();

	// Synchronously read taps — they're a small JSON file
	let extraTaps = [];
	try {
		const tapsContent = require("node:fs").readFileSync(getTapsFilePath(), "utf8");
		extraTaps = JSON.parse(tapsContent).taps || [];
	} catch {
		// No taps file yet
	}

	return [
		createSkillsShSource(auth),
		createGitHubSource(auth, extraTaps),
		createClawHubSource(),
		createLobeHubSource(),
	];
}

/**
 * Search all sources and merge results, deduplicating by name with trust ranking.
 * @param {string} query
 * @param {SourceAdapter[]} sources
 * @param {{ sourceFilter?: string, limit?: number }} [options]
 * @returns {Promise<SkillMeta[]>}
 */
async function unifiedSearch(query, sources, options = {}) {
	const { sourceFilter = "all", limit = 10 } = options;
	/** @type {SkillMeta[]} */
	const allResults = [];

	const searchPromises = sources
		.filter((src) => sourceFilter === "all" || src.sourceId() === sourceFilter)
		.map(async (src) => {
			try {
				return await src.search(query, limit);
			} catch {
				return [];
			}
		});

	const resultsArrays = await Promise.all(searchPromises);
	for (const results of resultsArrays) {
		allResults.push(...results);
	}

	// Deduplicate by name, preferring higher trust levels
	/** @type {Map<string, SkillMeta>} */
	const seen = new Map();
	for (const r of allResults) {
		const existing = seen.get(r.name);
		if (!existing) {
			seen.set(r.name, r);
		} else {
			const existingRank = TRUST_RANK[existing.trustLevel] ?? 0;
			const newRank = TRUST_RANK[r.trustLevel] ?? 0;
			if (newRank > existingRank) {
				seen.set(r.name, r);
			}
		}
	}

	return [...seen.values()].slice(0, limit);
}

// ---------------------------------------------------------------------------
// createSkillsHubClient — enhanced hub client
// ---------------------------------------------------------------------------

/**
 * @param {{ skillsDir: string }} options
 */
function createSkillsHubClient({ skillsDir }) {
	const hubDir = path.join(skillsDir, ".hub");
	const lockFile = createHubLockFile(path.join(hubDir, "lock.json"));
	const auditLogPath = path.join(hubDir, "audit.log");
	const appendClientAuditLog = (...args) => appendAuditLogToPath(auditLogPath, ...args);

	/**
	 * Install a skill from a validated bundle (legacy array format).
	 * @param {LegacySkillBundle} bundle
	 */
	async function installFromBundle(bundle) {
		const validation = validateSkillBundle(bundle);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const category = typeof bundle.category === "string" && bundle.category.trim()
			? requireSkillSlug(bundle.category, "Bundle category")
			: DEFAULT_CATEGORY;
		const name = requireSkillSlug(bundle.name, "Bundle name");
		const skillDir = resolveContainedPath(skillsDir, category, name);

		// Support both legacy array and dict formats
		const files = Array.isArray(bundle.files)
			? bundle.files
			: Object.entries(bundle.files).map(([p, c]) => ({ path: p, content: c }));

		for (const file of files) {
			const filePath = resolveContainedPath(skillDir, file.path);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, file.content, "utf8");
		}

		// Record in lock file
		const filesDict = {};
		for (const f of files) {
			filesDict[f.path] = f.content;
		}
		await lockFile.recordInstall({
			name,
			source: "hub",
			identifier: `hub/${category}/${name}`,
			trustLevel: "community",
			contentHash: bundleContentHash(filesDict),
			installPath: `${category}/${name}`,
			files: files.map((f) => f.path),
		});

		await appendClientAuditLog("INSTALL", name, "hub", "community", "accepted");

		return { installed: true, path: skillDir, name, category };
	}

	/**
	 * Install a skill by identifier from external sources.
	 * @param {string} identifier
	 * @param {{ category?: string, force?: boolean }} [options]
	 * @returns {Promise<{ installed: boolean, path: string, name: string, category: string }>}
	 */
	async function installFromIdentifier(identifier, options = {}) {
		const { category: requestedCategory, force = false } = options;
		const sources = createSourceRouter();

		// Try each source until one returns a bundle
		/** @type {SkillBundle | null} */
		let bundle = null;
		for (const src of sources) {
			try {
				bundle = await src.fetch(identifier);
				if (bundle) break;
			} catch {
				continue;
			}
		}

		if (!bundle) {
			throw new Error(`Could not fetch '${identifier}' from any source.`);
		}

		const validation = validateSkillBundle(bundle);
		if (!validation.valid) {
			throw new Error(validation.error);
		}

		const name = requireSkillSlug(bundle.name, "Bundle name");

		// Check if already installed
		const existing = await lockFile.getInstalled(name);
		if (existing && !force) {
			throw new Error(`'${name}' is already installed at ${existing.installPath}. Use force to reinstall.`);
		}

		const category = requestedCategory
			? requireSkillSlug(requestedCategory, "Requested category")
			: DEFAULT_CATEGORY;
		const skillDir = resolveContainedPath(skillsDir, category, name);

		// Write files
		for (const [relPath, content] of Object.entries(bundle.files)) {
			const filePath = resolveContainedPath(skillDir, relPath);
			await fs.mkdir(path.dirname(filePath), { recursive: true });
			await fs.writeFile(filePath, content, "utf8");
		}

		// Record provenance
		await lockFile.recordInstall({
			name,
			source: bundle.source,
			identifier: bundle.identifier,
			trustLevel: bundle.trustLevel,
			contentHash: bundleContentHash(bundle.files),
			installPath: `${category}/${name}`,
			files: Object.keys(bundle.files),
			metadata: bundle.metadata,
		});

		await appendClientAuditLog("INSTALL", name, bundle.source, bundle.trustLevel, "accepted", bundle.identifier);

		return { installed: true, path: skillDir, name, category };
	}

	/**
	 * List skills installed via the hub, with lock file enrichment.
	 * @returns {Promise<Array<{ name: string, category: string, path: string, source?: string, trustLevel?: string, identifier?: string }>>}
	 */
	async function listInstalled() {
		const results = [];
		const hubEntries = await lockFile.listInstalled();
		const hubByName = new Map(hubEntries.map((e) => [e.name, e]));

		let categories;
		try {
			categories = await fs.readdir(skillsDir);
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return [];
			}
			throw error;
		}

		for (const category of categories) {
			if (category.startsWith(".")) continue;
			const categoryDir = path.join(skillsDir, category);
			let stat;
			try {
				stat = await fs.stat(categoryDir);
			} catch {
				continue;
			}
			if (!stat.isDirectory()) continue;

			let skills;
			try {
				skills = await fs.readdir(categoryDir);
			} catch {
				continue;
			}

			for (const skillName of skills) {
				const skillDir = path.join(categoryDir, skillName);
				const skillMdPath = path.join(skillDir, "SKILL.md");
				try {
					await fs.access(skillMdPath);
					const hubEntry = hubByName.get(skillName);
					results.push({
						name: skillName,
						category,
						path: skillDir,
						source: hubEntry?.source,
						trustLevel: hubEntry?.trustLevel,
						identifier: hubEntry?.identifier,
					});
				} catch {
					// Not a valid skill directory
				}
			}
		}

		return results;
	}

	/**
	 * Search across all configured sources.
	 * @param {string} query
	 * @param {{ source?: string, limit?: number }} [options]
	 * @returns {Promise<SkillMeta[]>}
	 */
	async function search(query, options = {}) {
		if (!query || !query.trim()) {
			return [];
		}
		const sources = createSourceRouter();
		return unifiedSearch(query.trim(), sources, {
			sourceFilter: options.source || "all",
			limit: options.limit || 10,
		});
	}

	/**
	 * Browse all available skills across sources, paginated.
	 * @param {{ page?: number, pageSize?: number, source?: string }} [options]
	 * @returns {Promise<{ results: SkillMeta[], total: number, page: number, totalPages: number }>}
	 */
	async function browse(options = {}) {
		const { page = 1, pageSize = 20, source = "all" } = options;
		const clampedPageSize = Math.max(1, Math.min(pageSize, 100));
		const sources = createSourceRouter();

		/** @type {SkillMeta[]} */
		const allResults = [];

		const perSourceLimit = { "skills-sh": 100, github: 100, clawhub: 50, lobehub: 50 };

		const searchPromises = sources
			.filter((src) => source === "all" || src.sourceId() === source)
			.map(async (src) => {
				try {
					const limit = perSourceLimit[src.sourceId()] || 50;
					return await src.search("", limit);
				} catch {
					return [];
				}
			});

		const resultsArrays = await Promise.all(searchPromises);
		for (const results of resultsArrays) {
			allResults.push(...results);
		}

		// Deduplicate by name, preferring higher trust
		/** @type {Map<string, SkillMeta>} */
		const seen = new Map();
		for (const r of allResults) {
			const existing = seen.get(r.name);
			if (!existing || (TRUST_RANK[r.trustLevel] ?? 0) > (TRUST_RANK[existing.trustLevel] ?? 0)) {
				seen.set(r.name, r);
			}
		}

		// Sort by trust level (desc), then alphabetically
		const deduped = [...seen.values()].sort((a, b) => {
			const trustDiff = (TRUST_RANK[b.trustLevel] ?? 0) - (TRUST_RANK[a.trustLevel] ?? 0);
			if (trustDiff !== 0) return trustDiff;
			return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
		});

		const total = deduped.length;
		const totalPages = Math.max(1, Math.ceil(total / clampedPageSize));
		const clampedPage = Math.max(1, Math.min(page, totalPages));
		const start = (clampedPage - 1) * clampedPageSize;
		const end = Math.min(start + clampedPageSize, total);

		return {
			results: deduped.slice(start, end),
			total,
			page: clampedPage,
			totalPages,
		};
	}

	/**
	 * Inspect a skill by identifier without installing.
	 * @param {string} identifier
	 * @returns {Promise<{ meta: SkillMeta | null, preview: string | null }>}
	 */
	async function inspect(identifier) {
		const sources = createSourceRouter();

		/** @type {SkillMeta | null} */
		let meta = null;
		/** @type {SkillBundle | null} */
		let bundle = null;

		for (const src of sources) {
			if (!meta) {
				try {
					meta = await src.inspect(identifier);
				} catch {
					// Try next source
				}
			}
			if (!bundle) {
				try {
					bundle = await src.fetch(identifier);
					if (bundle && !meta) {
						meta = await src.inspect(identifier);
					}
				} catch {
					// Try next source
				}
			}
			if (meta && bundle) break;
		}

		let preview = null;
		if (bundle && bundle.files["SKILL.md"]) {
			const content = bundle.files["SKILL.md"];
			const lines = content.split("\n");
			preview = lines.slice(0, 50).join("\n");
			if (lines.length > 50) {
				preview += `\n\n... (${lines.length - 50} more lines)`;
			}
		}

		return { meta, preview };
	}

	/**
	 * Uninstall a hub-installed skill.
	 * @param {string} name
	 * @returns {Promise<{ success: boolean, message: string }>}
	 */
	async function uninstall(name) {
		const entry = await lockFile.getInstalled(name);
		if (!entry) {
			return { success: false, message: `'${name}' is not a hub-installed skill` };
		}

		const installPath = path.join(skillsDir, entry.installPath);
		try {
			await fs.rm(installPath, { recursive: true, force: true });
		} catch {
			// Directory may already be gone
		}

		await lockFile.recordUninstall(name);
		await appendClientAuditLog("UNINSTALL", name, entry.source || "hub", entry.trustLevel || "community", "n/a", "user_request");

		return { success: true, message: `Uninstalled '${name}' from ${entry.installPath}` };
	}

	/**
	 * Check hub-installed skills for upstream updates.
	 * @param {string} [name]
	 * @returns {Promise<Array<{ name: string, identifier: string, source: string, status: string }>>}
	 */
	async function checkUpdates(name) {
		const installed = await lockFile.listInstalled();
		const targets = name ? installed.filter((e) => e.name === name) : installed;

		if (targets.length === 0) {
			return [];
		}

		const sources = createSourceRouter();
		const results = [];

		for (const entry of targets) {
			const identifier = entry.identifier || "";
			let bundle = null;

			for (const src of sources) {
				try {
					bundle = await src.fetch(identifier);
					if (bundle) break;
				} catch {
					continue;
				}
			}

			if (!bundle) {
				results.push({
					name: entry.name,
					identifier,
					source: entry.source || "",
					status: "unavailable",
				});
				continue;
			}

			const currentHash = entry.contentHash || "";
			const latestHash = bundleContentHash(bundle.files);
			results.push({
				name: entry.name,
				identifier,
				source: entry.source || "",
				status: currentHash === latestHash ? "up_to_date" : "update_available",
			});
		}

		return results;
	}

	/**
	 * Manage taps (custom GitHub repo sources).
	 * @param {"list" | "add" | "remove"} action
	 * @param {string} [repo]
	 * @param {string} [repoPath]
	 * @returns {Promise<{ success: boolean, taps?: unknown[], message?: string }>}
	 */
	async function manageTaps(action, repo, repoPath) {
		const taps = createTapsManager();

		if (action === "list") {
			const list = await taps.listTaps();
			return { success: true, taps: list };
		}
		if (action === "add") {
			if (!repo) {
				return { success: false, message: "Repo required" };
			}
			const added = await taps.add(repo, repoPath || "skills/");
			return {
				success: added,
				message: added ? `Added tap: ${repo}` : `Tap already exists: ${repo}`,
			};
		}
		if (action === "remove") {
			if (!repo) {
				return { success: false, message: "Repo required" };
			}
			const removed = await taps.remove(repo);
			return {
				success: removed,
				message: removed ? `Removed tap: ${repo}` : `Tap not found: ${repo}`,
			};
		}
		return { success: false, message: `Unknown action: ${action}` };
	}

	return {
		installFromBundle,
		installFromIdentifier,
		listInstalled,
		search,
		browse,
		inspect,
		uninstall,
		checkUpdates,
		manageTaps,
	};
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
	// Client factory
	createSkillsHubClient,
	// Validation
	validateSkillBundle,
	// Infrastructure (used by source adapters)
	readIndexCache,
	writeIndexCache,
	parseFrontmatterQuick,
	bundleContentHash,
	// Hub state
	ensureHubDirs,
	createHubLockFile,
	createTapsManager,
	appendAuditLog,
	// Search
	createSourceRouter,
	unifiedSearch,
	// Constants
	TRUST_RANK,
};
