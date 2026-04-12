/**
 * Skills Hub — skills.sh source adapter.
 *
 * Discovers skills via skills.sh and fetches content from the underlying GitHub repo.
 *
 * Ported from NousResearch/hermes-agent tools/skills_hub.py (SkillsShSource, lines 893-1359).
 */

const crypto = require("node:crypto");
const { readIndexCache, writeIndexCache } = require("./hermes-skills-hub");
const { createGitHubSource } = require("./hermes-skills-hub-github");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = "https://skills.sh";
const SEARCH_URL = `${BASE_URL}/api/search`;
const FETCH_TIMEOUT = 20_000;

// ---------------------------------------------------------------------------
// Regex patterns (ported from Python)
// ---------------------------------------------------------------------------

const SKILL_LINK_RE = /href=["']\/(?<id>(?!agents\/|_next\/|api\/)[^"'\/]+\/[^"'\/]+\/[^"'\/]+)['"]/g;
const INSTALL_CMD_RE = /npx\s+skills\s+add\s+(?<repo>https?:\/\/github\.com\/[^\s<]+|[^\s<]+)(?:\s+--skill\s+(?<skill>[^\s<]+))?/i;
const PAGE_H1_RE = /<h1[^>]*>(?<title>.*?)<\/h1>/is;
const PROSE_H1_RE = /<div[^>]*class=["'][^"']*prose[^"']*["'][^>]*>.*?<h1[^>]*>(?<title>.*?)<\/h1>/is;
const PROSE_P_RE = /<div[^>]*class=["'][^"']*prose[^"']*["'][^>]*>.*?<p[^>]*>(?<body>.*?)<\/p>/is;
const WEEKLY_INSTALLS_RE = /Weekly Installs.*?children\\":\\"(?<count>[0-9.,Kk]+)\\"/s;

// ---------------------------------------------------------------------------
// HTML helpers
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags from a string.
 * @param {string} value
 * @returns {string}
 */
function _stripHtml(value) {
	return value.replace(/<[^>]+>/g, "");
}

/**
 * Extract the first named group value from a regex match, stripped of HTML.
 * @param {RegExp} pattern
 * @param {string} text
 * @returns {string | null}
 */
function _extractFirstMatch(pattern, text) {
	const match = pattern.exec(text);
	if (!match) return null;
	// Find first non-undefined group
	const groups = match.groups || {};
	const value = Object.values(groups).find((v) => v != null);
	if (value == null) return null;
	const stripped = _stripHtml(value).trim();
	return stripped || null;
}

// ---------------------------------------------------------------------------
// Identifier helpers
// ---------------------------------------------------------------------------

/**
 * Normalize an identifier by stripping known prefixes.
 * @param {string} identifier
 * @returns {string}
 */
function _normalizeIdentifier(identifier) {
	const prefixes = ["skills-sh/", "skills.sh/", "skils-sh/", "skils.sh/"];
	for (const prefix of prefixes) {
		if (identifier.startsWith(prefix)) {
			return identifier.slice(prefix.length);
		}
	}
	return identifier;
}

/**
 * Wrap an identifier with the skills-sh prefix.
 * @param {string} identifier
 * @returns {string}
 */
function _wrapIdentifier(identifier) {
	return `skills-sh/${identifier}`;
}

/**
 * Generate candidate GitHub identifiers for a skills.sh identifier.
 * @param {string} identifier
 * @returns {string[]}
 */
function _candidateIdentifiers(identifier) {
	const parts = identifier.split("/", 3);
	if (parts.length < 3) return [identifier];

	const repo = `${parts[0]}/${parts[1]}`;
	const skillPath = parts[2].replace(/^\/+/, "");
	const candidates = [
		`${repo}/${skillPath}`,
		`${repo}/skills/${skillPath}`,
		`${repo}/.agents/skills/${skillPath}`,
		`${repo}/.claude/skills/${skillPath}`,
	];

	const seen = new Set();
	const deduped = [];
	for (const candidate of candidates) {
		if (!seen.has(candidate)) {
			seen.add(candidate);
			deduped.push(candidate);
		}
	}
	return deduped;
}

// ---------------------------------------------------------------------------
// Token matching (for _discoverIdentifier fuzzy resolution)
// ---------------------------------------------------------------------------

/**
 * Generate variants of a token for fuzzy matching.
 * @param {string | null | undefined} value
 * @returns {Set<string>}
 */
function _tokenVariants(value) {
	if (!value) return new Set();

	const plain = _stripHtml(String(value)).trim().replace(/^\/+|\/+$/g, "").toLowerCase();
	if (!plain) return new Set();

	const base = plain.split("/").pop() || "";
	const sanitized = plain.replace(/[^a-z0-9/_-]+/g, "-").replace(/^-+|-+$/g, "");
	const sanitizedBase = sanitized ? sanitized.split("/").pop() || "" : "";
	const slashTail = plain.split("/").pop() || "";
	let slashTailClean = slashTail.replace(/^@/, "");
	slashTailClean = slashTailClean.split("/").pop() || "";

	const variants = new Set([
		plain,
		plain.replace(/_/g, "-"),
		plain.replace(/\//g, "-"),
		base,
		base.replace(/_/g, "-"),
		base.replace(/\//g, "-"),
		sanitized,
		sanitized ? sanitized.replace(/\//g, "-") : "",
		sanitizedBase,
		slashTailClean,
		slashTailClean.replace(/_/g, "-"),
	]);

	variants.delete("");
	return variants;
}

/**
 * Check if a SkillMeta matches any of the given skill tokens.
 * @param {import("./hermes-skills-hub").SkillMeta} meta
 * @param {string[]} skillTokens
 * @returns {boolean}
 */
function _matchesSkillTokens(meta, skillTokens) {
	const candidates = new Set();
	for (const v of _tokenVariants(meta.name)) candidates.add(v);
	for (const v of _tokenVariants(meta.path)) candidates.add(v);
	if (meta.identifier) {
		const idParts = meta.identifier.split("/", 3);
		if (idParts.length >= 3) {
			for (const v of _tokenVariants(idParts[2])) candidates.add(v);
		}
	}

	for (const token of skillTokens) {
		const variants = _tokenVariants(token);
		for (const v of variants) {
			if (candidates.has(v)) return true;
		}
	}
	return false;
}

// ---------------------------------------------------------------------------
// Repo slug extraction
// ---------------------------------------------------------------------------

/**
 * Extract "owner/repo" slug from a repo value (URL or slug).
 * @param {string} repoValue
 * @returns {string | null}
 */
function _extractRepoSlug(repoValue) {
	let cleaned = repoValue.trim();
	if (cleaned.startsWith("https://github.com/")) {
		cleaned = cleaned.slice("https://github.com/".length);
	}
	cleaned = cleaned.replace(/^\/+|\/+$/g, "");
	const parts = cleaned.split("/");
	if (parts.length >= 2) {
		return `${parts[0]}/${parts[1]}`;
	}
	return null;
}

// ---------------------------------------------------------------------------
// createSkillsShSource
// ---------------------------------------------------------------------------

/**
 * Skills.sh source adapter for the Skills Hub.
 *
 * @param {{ getHeaders: () => Record<string, string> }} auth
 * @returns {import("./hermes-skills-hub").SourceAdapter}
 */
function createSkillsShSource(auth) {
	const github = createGitHubSource(auth);

	// -- Detail page helpers -----------------------------------------------

	/**
	 * Extract weekly install count from detail page HTML.
	 * @param {string} html
	 * @returns {string | null}
	 */
	function _extractWeeklyInstalls(html) {
		const match = WEEKLY_INSTALLS_RE.exec(html);
		if (!match || !match.groups) return null;
		return match.groups.count || null;
	}

	/**
	 * Extract security audit statuses from detail page HTML.
	 * @param {string} html
	 * @returns {Record<string, string>}
	 */
	function _extractSecurityAudits(html) {
		/** @type {Record<string, string>} */
		const audits = {};
		for (const audit of ["agent-trust-hub", "socket", "snyk"]) {
			const idx = html.indexOf(`/security/${audit}`);
			if (idx === -1) continue;
			const window = html.slice(idx, idx + 500);
			const match = window.match(/(Pass|Warn|Fail)/i);
			if (match) {
				audits[audit] = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
			}
		}
		return audits;
	}

	/**
	 * Parse a skills.sh detail page into structured metadata.
	 * @param {string} identifier
	 * @param {string} html
	 * @returns {Record<string, unknown> | null}
	 */
	function _parseDetailPage(identifier, html) {
		const parts = identifier.split("/", 3);
		if (parts.length < 3) return null;

		const defaultRepo = `${parts[0]}/${parts[1]}`;
		const skillToken = parts[2];
		let repo = defaultRepo;
		let installSkill = skillToken;

		let installCommand = null;
		const installMatch = INSTALL_CMD_RE.exec(html);
		if (installMatch) {
			installCommand = installMatch[0].trim();
			const repoValue = (installMatch.groups?.repo || "").trim();
			installSkill = (installMatch.groups?.skill || installSkill).trim();
			repo = _extractRepoSlug(repoValue) || repo;
		}

		const pageTitle = _extractFirstMatch(PAGE_H1_RE, html);
		const bodyTitle = _extractFirstMatch(PROSE_H1_RE, html);
		const bodySummary = _extractFirstMatch(PROSE_P_RE, html);
		const weeklyInstalls = _extractWeeklyInstalls(html);
		const securityAudits = _extractSecurityAudits(html, identifier);

		return {
			repo,
			install_skill: installSkill,
			page_title: pageTitle,
			body_title: bodyTitle,
			body_summary: bodySummary,
			weekly_installs: weeklyInstalls,
			install_command: installCommand,
			repo_url: `https://github.com/${repo}`,
			detail_url: `${BASE_URL}/${identifier}`,
			security_audits: securityAudits,
		};
	}

	/**
	 * Fetch and parse a skills.sh detail page with caching.
	 * @param {string} identifier
	 * @returns {Promise<Record<string, unknown> | null>}
	 */
	async function _fetchDetailPage(identifier) {
		const cacheKey = `skills_sh_detail_${crypto.createHash("md5").update(identifier).digest("hex")}`;
		const cached = await readIndexCache(cacheKey);
		if (cached !== null && typeof cached === "object" && !Array.isArray(cached)) {
			return /** @type {Record<string, unknown>} */ (cached);
		}

		try {
			const resp = await fetch(`${BASE_URL}/${identifier}`, {
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (!resp.ok) return null;
			const html = await resp.text();
			const detail = _parseDetailPage(identifier, html);
			if (detail) {
				await writeIndexCache(cacheKey, detail);
			}
			return detail;
		} catch {
			return null;
		}
	}

	/**
	 * Build metadata dict from canonical identifier and detail page data.
	 * @param {string} canonical
	 * @param {Record<string, unknown> | null} detail
	 * @returns {Record<string, unknown>}
	 */
	function _detailToMetadata(canonical, detail) {
		const parts = canonical.split("/", 3);
		const repo = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : "";
		/** @type {Record<string, unknown>} */
		const metadata = {
			detail_url: `${BASE_URL}/${canonical}`,
		};
		if (repo) {
			metadata.repo_url = `https://github.com/${repo}`;
		}
		if (detail && typeof detail === "object") {
			for (const key of ["weekly_installs", "install_command", "repo_url", "detail_url", "security_audits"]) {
				const value = detail[key];
				if (value) {
					metadata[key] = value;
				}
			}
		}
		return metadata;
	}

	// -- Skill discovery helpers -------------------------------------------

	/**
	 * Find a skill in a repo by searching the Git tree for SKILL.md files.
	 * Equivalent to GitHubSource._find_skill_in_repo_tree in Python.
	 * @param {string} repo
	 * @param {string} skillName
	 * @returns {Promise<string | null>}
	 */
	async function _findSkillInRepoTree(repo, skillName) {
		const headers = auth.getHeaders();

		// Get default branch
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

		// Get recursive tree (single API call)
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
		} catch {
			return null;
		}

		// Look for SKILL.md files inside directories named <skillName>
		const skillMdSuffix = `/${skillName}/SKILL.md`;
		const exactMatch = `${skillName}/SKILL.md`;
		for (const entry of treeData.tree || []) {
			if (entry.type !== "blob") continue;
			const entryPath = entry.path || "";
			if (entryPath.endsWith(skillMdSuffix) || entryPath === exactMatch) {
				const skillDir = entryPath.slice(0, -"/SKILL.md".length);
				return `${repo}/${skillDir}`;
			}
		}

		return null;
	}

	/**
	 * List skills in a specific repo path via the GitHub Contents API.
	 * Used as a lightweight alternative to GitHubSource._listSkillsInRepo.
	 * @param {string} repo
	 * @param {string} basePath
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function _listSkillsInPath(repo, basePath) {
		const cleanPath = basePath.replace(/\/+$/, "");
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

			const identifier = cleanPath
				? `${repo}/${cleanPath}/${dirName}`
				: `${repo}/${dirName}`;

			const meta = await github.inspect(identifier);
			if (meta) {
				skills.push(meta);
			}
		}
		return skills;
	}

	/**
	 * Discover the correct GitHub identifier for a skills.sh identifier
	 * by trying standard paths, tree lookup, and root directory scanning.
	 * @param {string} identifier
	 * @param {Record<string, unknown> | null} [detail]
	 * @returns {Promise<string | null>}
	 */
	async function _discoverIdentifier(identifier, detail = null) {
		const parts = identifier.split("/", 3);
		if (parts.length < 3) return null;

		const defaultRepo = `${parts[0]}/${parts[1]}`;
		const repo = (detail && typeof detail === "object" && typeof detail.repo === "string")
			? detail.repo
			: defaultRepo;
		const skillToken = parts[2].split("/").pop() || "";
		const tokens = [skillToken];
		if (detail && typeof detail === "object") {
			for (const key of ["install_skill", "page_title", "body_title"]) {
				const val = detail[key];
				if (typeof val === "string" && val) {
					tokens.push(val);
				}
			}
		}

		// Standard skill paths
		const basePaths = ["skills/", ".agents/skills/", ".claude/skills/"];
		for (const basePath of basePaths) {
			try {
				const skills = await _listSkillsInPath(repo, basePath);
				for (const meta of skills) {
					if (_matchesSkillTokens(meta, tokens)) {
						return meta.identifier;
					}
				}
			} catch {
				continue;
			}
		}

		// Prefer a single recursive tree lookup before brute-forcing every
		// top-level directory.
		const treeResult = await _findSkillInRepoTree(repo, skillToken);
		if (treeResult) return treeResult;

		// Fallback: scan repo root for directories that might contain skills
		try {
			const rootUrl = `https://api.github.com/repos/${repo}/contents/`;
			const resp = await fetch(rootUrl, {
				headers: auth.getHeaders(),
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (resp.ok) {
				const entries = await resp.json();
				if (Array.isArray(entries)) {
					for (const entry of entries) {
						if (entry.type !== "dir") continue;
						const dirName = entry.name;
						if (dirName.startsWith(".") || dirName.startsWith("_")) continue;
						if (["skills", ".agents", ".claude"].includes(dirName)) continue; // already tried

						// Try direct: repo/dir/skill_token
						const directId = `${repo}/${dirName}/${skillToken}`;
						const meta = await github.inspect(directId);
						if (meta) return meta.identifier;

						// Try listing skills in this directory
						try {
							const skills = await _listSkillsInPath(repo, dirName + "/");
							for (const m of skills) {
								if (_matchesSkillTokens(m, tokens)) {
									return m.identifier;
								}
							}
						} catch {
							continue;
						}
					}
				}
			}
		} catch {
			// Exhausted all options
		}

		return null;
	}

	// -- Search helpers ----------------------------------------------------

	/**
	 * Convert a search API item to SkillMeta.
	 * @param {Record<string, unknown>} item
	 * @returns {import("./hermes-skills-hub").SkillMeta | null}
	 */
	function _metaFromSearchItem(item) {
		if (!item || typeof item !== "object") return null;

		let canonical = /** @type {string | undefined} */ (item.id);
		let repo = /** @type {string | undefined} */ (item.source);
		let skillPath = /** @type {string | undefined} */ (item.skillId);

		if (typeof canonical !== "string" || (canonical.match(/\//g) || []).length < 2) {
			if (typeof repo !== "string" || typeof skillPath !== "string") return null;
			canonical = `${repo}/${skillPath}`;
		}

		const parts = canonical.split("/", 3);
		if (parts.length < 3) return null;

		repo = `${parts[0]}/${parts[1]}`;
		skillPath = parts[2];

		const installs = item.installs;
		const installsLabel = typeof installs === "number" ? ` \u00b7 ${installs.toLocaleString()} installs` : "";

		return {
			name: String(item.name || skillPath.split("/").pop() || ""),
			description: `Indexed by skills.sh from ${repo}${installsLabel}`,
			source: "skills.sh",
			identifier: _wrapIdentifier(canonical),
			trustLevel: github.trustLevelFor(canonical),
			repo,
			path: skillPath,
			tags: [],
			extra: {
				installs: installs ?? null,
				detail_url: `${BASE_URL}/${canonical}`,
				repo_url: `https://github.com/${repo}`,
			},
		};
	}

	/**
	 * Scrape the skills.sh homepage for featured skill links.
	 * @param {number} limit
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function _featuredSkills(limit) {
		const cacheKey = "skills_sh_featured";
		const cached = await readIndexCache(cacheKey);
		if (cached !== null && Array.isArray(cached)) {
			return /** @type {import("./hermes-skills-hub").SkillMeta[]} */ (cached).slice(0, limit);
		}

		let html;
		try {
			const resp = await fetch(BASE_URL, {
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (!resp.ok) return [];
			html = await resp.text();
		} catch {
			return [];
		}

		/** @type {Set<string>} */
		const seen = new Set();
		/** @type {import("./hermes-skills-hub").SkillMeta[]} */
		const results = [];

		// Reset regex lastIndex since it has the global flag
		SKILL_LINK_RE.lastIndex = 0;
		let match;
		while ((match = SKILL_LINK_RE.exec(html)) !== null) {
			const canonical = match.groups?.id;
			if (!canonical || seen.has(canonical)) continue;
			seen.add(canonical);

			const parts = canonical.split("/", 3);
			if (parts.length < 3) continue;

			const repo = `${parts[0]}/${parts[1]}`;
			const skillPath = parts[2];

			results.push({
				name: skillPath.split("/").pop() || skillPath,
				description: `Featured on skills.sh from ${repo}`,
				source: "skills.sh",
				identifier: _wrapIdentifier(canonical),
				trustLevel: github.trustLevelFor(canonical),
				repo,
				path: skillPath,
				tags: [],
				extra: {},
			});

			if (results.length >= limit) break;
		}

		await writeIndexCache(cacheKey, results);
		return results;
	}

	// -- Inspect helpers ---------------------------------------------------

	/**
	 * Resolve the GitHub-level SkillMeta for a skills.sh identifier.
	 * @param {string} identifier
	 * @param {Record<string, unknown> | null} [detail]
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta | null>}
	 */
	async function _resolveGithubMeta(identifier, detail = null) {
		for (const candidate of _candidateIdentifiers(identifier)) {
			const meta = await github.inspect(candidate);
			if (meta) return meta;
		}

		const resolved = await _discoverIdentifier(identifier, detail);
		if (resolved) {
			return github.inspect(resolved);
		}
		return null;
	}

	/**
	 * Enrich a GitHub SkillMeta with skills.sh metadata.
	 * @param {import("./hermes-skills-hub").SkillMeta} meta
	 * @param {string} canonical
	 * @param {Record<string, unknown> | null} detail
	 * @returns {import("./hermes-skills-hub").SkillMeta}
	 */
	function _finalizeInspectMeta(meta, canonical, detail) {
		meta.source = "skills.sh";
		meta.identifier = _wrapIdentifier(canonical);
		meta.trustLevel = github.trustLevelFor(_normalizeIdentifier(canonical));
		const mergedExtra = { ...meta.extra, ..._detailToMetadata(canonical, detail) };
		meta.extra = mergedExtra;

		if (detail && typeof detail === "object") {
			const bodySummary = detail.body_summary;
			const weeklyInstalls = detail.weekly_installs;
			if (typeof bodySummary === "string" && bodySummary) {
				meta.description = bodySummary;
			} else if (meta.description && typeof weeklyInstalls === "string" && weeklyInstalls) {
				meta.description = `${meta.description} \u00b7 ${weeklyInstalls} weekly installs on skills.sh`;
			}
		}
		return meta;
	}

	// -- Public interface ---------------------------------------------------

	function sourceId() {
		return "skills-sh";
	}

	/**
	 * @param {string} identifier
	 * @returns {"builtin" | "trusted" | "community"}
	 */
	function trustLevelFor(identifier) {
		return github.trustLevelFor(_normalizeIdentifier(identifier));
	}

	/**
	 * Search skills.sh for skills matching the query.
	 * @param {string} query
	 * @param {number} [limit=10]
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function search(query, limit = 10) {
		if (!query.trim()) {
			return _featuredSkills(limit);
		}

		const cacheKey = `skills_sh_search_${crypto.createHash("md5").update(`${query}|${limit}`).digest("hex")}`;
		const cached = await readIndexCache(cacheKey);
		if (cached !== null && Array.isArray(cached)) {
			return /** @type {import("./hermes-skills-hub").SkillMeta[]} */ (cached).slice(0, limit);
		}

		let data;
		try {
			const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${limit}`;
			const resp = await fetch(url, {
				signal: AbortSignal.timeout(FETCH_TIMEOUT),
			});
			if (!resp.ok) return [];
			data = await resp.json();
		} catch {
			return [];
		}

		const items = (typeof data === "object" && data !== null && !Array.isArray(data))
			? (data.skills || [])
			: [];
		if (!Array.isArray(items)) return [];

		/** @type {import("./hermes-skills-hub").SkillMeta[]} */
		const results = [];
		for (const item of items.slice(0, limit)) {
			const meta = _metaFromSearchItem(item);
			if (meta) results.push(meta);
		}

		await writeIndexCache(cacheKey, results);
		return results;
	}

	/**
	 * Fetch a skill bundle via skills.sh, delegating to the GitHub source.
	 * @param {string} identifier
	 * @returns {Promise<import("./hermes-skills-hub").SkillBundle | null>}
	 */
	async function fetchSkill(identifier) {
		const canonical = _normalizeIdentifier(identifier);
		const detail = await _fetchDetailPage(canonical);

		// Try candidate identifiers against GitHub source
		for (const candidate of _candidateIdentifiers(canonical)) {
			const bundle = await github.fetch(candidate);
			if (bundle) {
				bundle.source = "skills.sh";
				bundle.identifier = _wrapIdentifier(canonical);
				bundle.metadata = { ...bundle.metadata, ..._detailToMetadata(canonical, detail) };
				return bundle;
			}
		}

		// Fall back to discovery-based resolution
		const resolved = await _discoverIdentifier(canonical, detail);
		if (resolved) {
			const bundle = await github.fetch(resolved);
			if (bundle) {
				bundle.source = "skills.sh";
				bundle.identifier = _wrapIdentifier(canonical);
				bundle.metadata = { ...bundle.metadata, ..._detailToMetadata(canonical, detail) };
				return bundle;
			}
		}

		return null;
	}

	/**
	 * Inspect a skill by identifier, enriching with skills.sh detail page metadata.
	 * @param {string} identifier
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta | null>}
	 */
	async function inspect(identifier) {
		const canonical = _normalizeIdentifier(identifier);
		const detail = await _fetchDetailPage(canonical);
		const meta = await _resolveGithubMeta(canonical, detail);
		if (meta) {
			return _finalizeInspectMeta(meta, canonical, detail);
		}
		return null;
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
	createSkillsShSource,
};
