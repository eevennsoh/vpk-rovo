/**
 * Skills Hub — GitHub source adapter.
 *
 * Provides:
 * - createGitHubAuth(): token resolution (env → gh CLI → anonymous)
 * - createGitHubSource(auth, extraTaps): SourceAdapter for GitHub repos
 *
 * Ported from NousResearch/hermes-agent tools/skills_hub.py (GitHubAuth + GitHubSource).
 */

const { execSync } = require("node:child_process");
const { readIndexCache, writeIndexCache, parseFrontmatterQuick } = require("./hermes-skills-hub");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRUSTED_REPOS = new Set([
	"NousResearch/hermes-agent",
	"openai/skills",
	"anthropics/skills",
]);

const DEFAULT_TAPS = [
	{ repo: "openai/skills", path: "skills/" },
	{ repo: "anthropics/skills", path: "skills/" },
	{ repo: "VoltAgent/awesome-agent-skills", path: "skills/" },
	{ repo: "garrytan/gstack", path: "" },
];

const FETCH_TIMEOUT = 15_000;

// ---------------------------------------------------------------------------
// createGitHubAuth
// ---------------------------------------------------------------------------

/**
 * GitHub API authentication.
 * Tries methods in priority order:
 *   1. GITHUB_TOKEN / GH_TOKEN env var
 *   2. `gh auth token` subprocess
 *   3. Anonymous (60 req/hr, public repos only)
 *
 * @returns {{ getHeaders: () => Record<string, string>, isAuthenticated: () => boolean, authMethod: () => string }}
 */
function createGitHubAuth() {
	/** @type {string | null} */
	let cachedToken = null;
	/** @type {string | null} */
	let cachedMethod = null;

	function resolveToken() {
		if (cachedToken) {
			return cachedToken;
		}

		// 1. Environment variable
		const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
		if (envToken) {
			cachedToken = envToken;
			cachedMethod = "pat";
			return cachedToken;
		}

		// 2. gh CLI
		try {
			const token = execSync("gh auth token", { timeout: 5000 })
				.toString()
				.trim();
			if (token) {
				cachedToken = token;
				cachedMethod = "gh-cli";
				return cachedToken;
			}
		} catch {
			// gh CLI not available or failed
		}

		// 3. Anonymous
		cachedMethod = "anonymous";
		return null;
	}

	function getHeaders() {
		const token = resolveToken();
		/** @type {Record<string, string>} */
		const headers = { Accept: "application/vnd.github.v3+json" };
		if (token) {
			headers.Authorization = `token ${token}`;
		}
		return headers;
	}

	function isAuthenticated() {
		return resolveToken() !== null;
	}

	function authMethod() {
		resolveToken();
		return cachedMethod || "anonymous";
	}

	return { getHeaders, isAuthenticated, authMethod };
}

// ---------------------------------------------------------------------------
// createGitHubSource
// ---------------------------------------------------------------------------

/**
 * GitHub source adapter for the Skills Hub.
 *
 * @param {{ getHeaders: () => Record<string, string> }} auth
 * @param {Array<{ repo: string, path: string }>} [extraTaps]
 * @returns {import("./hermes-skills-hub").SourceAdapter}
 */
function createGitHubSource(auth, extraTaps) {
	const taps = [...DEFAULT_TAPS];
	if (extraTaps && extraTaps.length) {
		taps.push(...extraTaps);
	}

	// -- Internal helpers --------------------------------------------------

	/**
	 * Fetch a single file's raw content from GitHub.
	 * @param {string} repo
	 * @param {string} filePath
	 * @returns {Promise<string | null>}
	 */
	async function _fetchFileContent(repo, filePath) {
		const url = `https://api.github.com/repos/${repo}/contents/${filePath}`;
		try {
			const resp = await fetch(url, {
				headers: {
					...auth.getHeaders(),
					Accept: "application/vnd.github.v3.raw",
				},
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (resp.ok) {
				return await resp.text();
			}
		} catch {
			// Network / timeout error
		}
		return null;
	}

	/**
	 * Download an entire directory using the Git Trees API (single request for the tree).
	 * @param {string} repo
	 * @param {string} skillPath
	 * @returns {Promise<Record<string, string> | null>}
	 */
	async function _downloadDirectoryViaTree(repo, skillPath) {
		const normalizedPath = skillPath.replace(/\/+$/, "");
		const headers = auth.getHeaders();

		// Resolve the default branch
		let defaultBranch;
		try {
			const repoResp = await fetch(`https://api.github.com/repos/${repo}`, {
				headers,
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (!repoResp.ok) return null;
			const repoData = await repoResp.json();
			defaultBranch = repoData.default_branch || "main";
		} catch {
			return null;
		}

		// Fetch the full recursive tree
		let treeData;
		try {
			const treeResp = await fetch(
				`https://api.github.com/repos/${repo}/git/trees/${defaultBranch}?recursive=1`,
				{
					headers,
					signal: AbortSignal.timeout(30_000),
				},
			);
			if (!treeResp.ok) return null;
			treeData = await treeResp.json();
			if (treeData.truncated) {
				return null; // Fall back to Contents API
			}
		} catch {
			return null;
		}

		// Filter blobs under the target path
		const prefix = `${normalizedPath}/`;
		/** @type {Record<string, string>} */
		const files = {};

		for (const item of treeData.tree || []) {
			if (item.type !== "blob") continue;
			const itemPath = item.path || "";
			if (!itemPath.startsWith(prefix)) continue;

			const relPath = itemPath.slice(prefix.length);
			const content = await _fetchFileContent(repo, itemPath);
			if (content !== null) {
				files[relPath] = content;
			}
		}

		return Object.keys(files).length > 0 ? files : null;
	}

	/**
	 * Recursively download all files via the Contents API (fallback).
	 * @param {string} repo
	 * @param {string} dirPath
	 * @returns {Promise<Record<string, string>>}
	 */
	async function _downloadDirectoryRecursive(repo, dirPath) {
		const url = `https://api.github.com/repos/${repo}/contents/${dirPath.replace(/\/+$/, "")}`;
		let entries;
		try {
			const resp = await fetch(url, {
				headers: auth.getHeaders(),
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (!resp.ok) return {};
			entries = await resp.json();
		} catch {
			return {};
		}

		if (!Array.isArray(entries)) return {};

		/** @type {Record<string, string>} */
		const files = {};

		for (const entry of entries) {
			const name = entry.name || "";
			const entryType = entry.type || "";

			if (entryType === "file") {
				const content = await _fetchFileContent(repo, entry.path || "");
				if (content !== null) {
					files[name] = content;
				}
			} else if (entryType === "dir") {
				const subFiles = await _downloadDirectoryRecursive(repo, entry.path || "");
				for (const [subName, subContent] of Object.entries(subFiles)) {
					files[`${name}/${subName}`] = subContent;
				}
			}
		}

		return files;
	}

	/**
	 * Download all files in a skill directory.
	 * Tries Trees API first, falls back to Contents API.
	 * @param {string} repo
	 * @param {string} skillPath
	 * @returns {Promise<Record<string, string>>}
	 */
	async function _downloadDirectory(repo, skillPath) {
		const files = await _downloadDirectoryViaTree(repo, skillPath);
		if (files !== null) {
			return files;
		}
		return _downloadDirectoryRecursive(repo, skillPath);
	}

	/**
	 * List skill directories in a GitHub repo path, using cached index.
	 * @param {string} repo
	 * @param {string} repoPath
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function _listSkillsInRepo(repo, repoPath) {
		const cacheKey = `${repo}_${repoPath}`.replace(/[/ ]/g, "_");
		const cached = await readIndexCache(cacheKey);
		if (cached !== null && Array.isArray(cached)) {
			return /** @type {import("./hermes-skills-hub").SkillMeta[]} */ (cached);
		}

		const cleanPath = repoPath.replace(/\/+$/, "");
		const url = `https://api.github.com/repos/${repo}/contents/${cleanPath}`;
		let entries;
		try {
			const resp = await fetch(url, {
				headers: auth.getHeaders(),
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (!resp.ok) return [];
			entries = await resp.json();
		} catch {
			return [];
		}

		if (!Array.isArray(entries)) return [];

		/** @type {import("./hermes-skills-hub").SkillMeta[]} */
		const skills = [];

		for (const entry of entries) {
			if (entry.type !== "dir") continue;

			const dirName = entry.name;
			if (dirName.startsWith(".") || dirName.startsWith("_")) continue;

			const prefix = cleanPath;
			const identifier = prefix
				? `${repo}/${prefix}/${dirName}`
				: `${repo}/${dirName}`;

			const meta = await inspect(identifier);
			if (meta) {
				skills.push(meta);
			}
		}

		// Cache the results
		await writeIndexCache(cacheKey, skills);
		return skills;
	}

	// -- Public interface ---------------------------------------------------

	function sourceId() {
		return "github";
	}

	/**
	 * @param {string} identifier - e.g. "owner/repo/path/to/skill"
	 * @returns {"builtin" | "trusted" | "community"}
	 */
	function trustLevelFor(identifier) {
		const parts = identifier.split("/", 3);
		if (parts.length >= 2) {
			const repo = `${parts[0]}/${parts[1]}`;
			if (TRUSTED_REPOS.has(repo)) {
				return "trusted";
			}
		}
		return "community";
	}

	/**
	 * Search all taps for skills matching the query.
	 * @param {string} query
	 * @param {number} [limit=10]
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function search(query, limit = 10) {
		/** @type {import("./hermes-skills-hub").SkillMeta[]} */
		const results = [];
		const queryLower = query.toLowerCase();

		for (const tap of taps) {
			try {
				const skills = await _listSkillsInRepo(tap.repo, tap.path || "");
				for (const skill of skills) {
					const searchable = `${skill.name} ${skill.description} ${(skill.tags || []).join(" ")}`.toLowerCase();
					if (queryLower === "" || searchable.includes(queryLower)) {
						results.push(skill);
					}
				}
			} catch {
				continue;
			}
		}

		// Deduplicate by name, preferring higher trust
		const trustRank = { builtin: 2, trusted: 1, community: 0 };
		/** @type {Map<string, import("./hermes-skills-hub").SkillMeta>} */
		const seen = new Map();
		for (const r of results) {
			const existing = seen.get(r.name);
			if (!existing) {
				seen.set(r.name, r);
			} else if ((trustRank[r.trustLevel] ?? 0) > (trustRank[existing.trustLevel] ?? 0)) {
				seen.set(r.name, r);
			}
		}

		return [...seen.values()].slice(0, limit);
	}

	/**
	 * Download a skill from GitHub.
	 * @param {string} identifier - format: "owner/repo/path/to/skill-dir"
	 * @returns {Promise<import("./hermes-skills-hub").SkillBundle | null>}
	 */
	async function fetchSkill(identifier) {
		const parts = identifier.split("/", 3);
		if (parts.length < 3) return null;

		const repo = `${parts[0]}/${parts[1]}`;
		const skillPath = parts[2];

		const files = await _downloadDirectory(repo, skillPath);
		if (!files || !files["SKILL.md"]) return null;

		const skillName = skillPath.replace(/\/+$/, "").split("/").pop() || skillPath;
		const trustLevel = trustLevelFor(identifier);

		return {
			name: skillName,
			files,
			source: "github",
			identifier,
			trustLevel,
			metadata: {},
		};
	}

	/**
	 * Fetch just the SKILL.md metadata for preview.
	 * @param {string} identifier
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta | null>}
	 */
	async function inspect(identifier) {
		const parts = identifier.split("/", 3);
		if (parts.length < 3) return null;

		const repo = `${parts[0]}/${parts[1]}`;
		const skillPath = parts[2].replace(/\/+$/, "");
		const skillMdPath = `${skillPath}/SKILL.md`;

		const content = await _fetchFileContent(repo, skillMdPath);
		if (!content) return null;

		const fm = parseFrontmatterQuick(content);
		const skillName = fm.name || skillPath.split("/").pop() || skillPath;
		const description = fm.description ? String(fm.description) : "";

		// Extract tags: prefer metadata.hermes.tags, fall back to top-level tags
		let tags = [];
		if (fm.metadata && typeof fm.metadata === "object") {
			const hermesMeta = /** @type {Record<string, unknown>} */ (fm.metadata).hermes;
			if (hermesMeta && typeof hermesMeta === "object") {
				const hermesTags = /** @type {Record<string, unknown>} */ (hermesMeta).tags;
				if (Array.isArray(hermesTags)) {
					tags = hermesTags;
				}
			}
		}
		if (tags.length === 0 && Array.isArray(fm.tags)) {
			tags = fm.tags;
		}

		return {
			name: String(skillName),
			description,
			source: "github",
			identifier,
			trustLevel: trustLevelFor(identifier),
			repo,
			path: skillPath,
			tags: tags.map(String),
			extra: {},
		};
	}

	return {
		sourceId,
		search,
		fetch: fetchSkill,
		inspect,
		trustLevelFor,
	};
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
	createGitHubAuth,
	createGitHubSource,
	TRUSTED_REPOS,
};
