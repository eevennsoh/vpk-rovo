/**
 * Skills Hub — ClawHub source adapter.
 *
 * Provides:
 * - createClawHubSource(): SourceAdapter for ClawHub (clawhub.ai) HTTP API
 *
 * All skills are treated as community trust — ClawHavoc incident showed
 * their vetting is insufficient (341 malicious skills found Feb 2026).
 *
 * Ported from NousResearch/hermes-agent tools/skills_hub.py (ClawHubSource).
 */

const crypto = require("node:crypto");
const { readIndexCache, writeIndexCache } = require("./hermes-skills-hub");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = "https://clawhub.ai/api/v1";
const FETCH_TIMEOUT = 20_000;
const LISTING_TIMEOUT = 15_000;
const CATALOG_TIMEOUT = 30_000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize tags from various API response shapes.
 * @param {unknown} tags
 * @returns {string[]}
 */
function _normalizeTags(tags) {
	if (Array.isArray(tags)) {
		return tags.map(String);
	}
	if (tags && typeof tags === "object" && !Array.isArray(tags)) {
		return Object.keys(tags).filter((k) => k !== "latest").map(String);
	}
	return [];
}

/**
 * Coerce a skill API response that may have a nested `skill` key.
 * @param {unknown} data
 * @returns {Record<string, unknown> | null}
 */
function _coerceSkillPayload(data) {
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		return null;
	}
	const nested = /** @type {Record<string, unknown>} */ (data).skill;
	if (nested && typeof nested === "object" && !Array.isArray(nested)) {
		const merged = { .../** @type {Record<string, unknown>} */ (nested) };
		const latestVersion = /** @type {Record<string, unknown>} */ (data).latestVersion;
		if (latestVersion !== undefined && !("latestVersion" in merged)) {
			merged.latestVersion = latestVersion;
		}
		return merged;
	}
	return /** @type {Record<string, unknown>} */ (data);
}

/**
 * Split query into normalized lowercase alphanumeric terms.
 * @param {string} query
 * @returns {string[]}
 */
function _queryTerms(query) {
	return query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/**
 * Score a SkillMeta against a search query.
 * @param {string} query
 * @param {import("./hermes-skills-hub").SkillMeta} meta
 * @returns {number}
 */
function _searchScore(query, meta) {
	const queryNorm = query.trim().toLowerCase();
	if (!queryNorm) {
		return 1;
	}

	const identifier = (meta.identifier || "").toLowerCase();
	const name = (meta.name || "").toLowerCase();
	const description = (meta.description || "").toLowerCase();
	const normalizedIdentifier = _queryTerms(identifier).join(" ");
	const normalizedName = _queryTerms(name).join(" ");
	const queryTermsList = _queryTerms(queryNorm);
	const identifierTerms = _queryTerms(identifier);
	const nameTerms = _queryTerms(name);
	let score = 0;

	if (queryNorm === identifier) score += 140;
	if (queryNorm === name) score += 130;
	if (normalizedIdentifier === queryNorm) score += 125;
	if (normalizedName === queryNorm) score += 120;
	if (normalizedIdentifier.startsWith(queryNorm)) score += 95;
	if (normalizedName.startsWith(queryNorm)) score += 90;

	if (
		queryTermsList.length > 0 &&
		identifierTerms.length >= queryTermsList.length &&
		identifierTerms.slice(0, queryTermsList.length).every((t, i) => t === queryTermsList[i])
	) {
		score += 70;
	}
	if (
		queryTermsList.length > 0 &&
		nameTerms.length >= queryTermsList.length &&
		nameTerms.slice(0, queryTermsList.length).every((t, i) => t === queryTermsList[i])
	) {
		score += 65;
	}

	if (queryNorm.length > 0 && identifier.includes(queryNorm)) score += 40;
	if (queryNorm.length > 0 && name.includes(queryNorm)) score += 35;
	if (queryNorm.length > 0 && description.includes(queryNorm)) score += 10;

	for (const term of queryTermsList) {
		if (identifierTerms.includes(term)) score += 15;
		if (nameTerms.includes(term)) score += 12;
		if (description.includes(term)) score += 3;
	}

	return score;
}

/**
 * Deduplicate results by identifier/name (case-insensitive, keep first seen).
 * @param {import("./hermes-skills-hub").SkillMeta[]} results
 * @returns {import("./hermes-skills-hub").SkillMeta[]}
 */
function _dedupeResults(results) {
	/** @type {Set<string>} */
	const seen = new Set();
	/** @type {import("./hermes-skills-hub").SkillMeta[]} */
	const deduped = [];
	for (const result of results) {
		const key = (result.identifier || result.name).toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		deduped.push(result);
	}
	return deduped;
}

/**
 * GET JSON from a URL, returning null on any error.
 * @param {string} url
 * @param {number} [timeout]
 * @returns {Promise<unknown>}
 */
async function _getJson(url, timeout = FETCH_TIMEOUT) {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(timeout) });
		if (!resp.ok) return null;
		return await resp.json();
	} catch {
		return null;
	}
}

/**
 * GET raw text from a URL, returning null on any error.
 * @param {string} url
 * @param {number} [timeout]
 * @returns {Promise<string | null>}
 */
async function _fetchText(url, timeout = FETCH_TIMEOUT) {
	try {
		const resp = await fetch(url, { signal: AbortSignal.timeout(timeout) });
		if (!resp.ok) return null;
		return await resp.text();
	} catch {
		return null;
	}
}

// ---------------------------------------------------------------------------
// createClawHubSource
// ---------------------------------------------------------------------------

/**
 * @returns {import("./hermes-skills-hub").SourceAdapter}
 */
function createClawHubSource() {
	/**
	 * Resolve the latest version string from skill data.
	 * @param {string} slug
	 * @param {Record<string, unknown>} skillData
	 * @returns {Promise<string | null>}
	 */
	async function _resolveLatestVersion(slug, skillData) {
		const latest = skillData.latestVersion;
		if (latest && typeof latest === "object" && !Array.isArray(latest)) {
			const version = /** @type {Record<string, unknown>} */ (latest).version;
			if (typeof version === "string" && version) return version;
		}

		const tags = skillData.tags;
		if (tags && typeof tags === "object" && !Array.isArray(tags)) {
			const latestTag = /** @type {Record<string, unknown>} */ (tags).latest;
			if (typeof latestTag === "string" && latestTag) return latestTag;
		}

		const versionsData = await _getJson(`${BASE_URL}/skills/${slug}/versions`);
		if (Array.isArray(versionsData) && versionsData.length > 0) {
			const first = versionsData[0];
			if (first && typeof first === "object") {
				const version = first.version;
				if (typeof version === "string" && version) return version;
			}
		}
		return null;
	}

	/**
	 * Extract files from version data (handles both dict and array formats).
	 * @param {Record<string, unknown>} versionData
	 * @returns {Record<string, string>}
	 */
	async function _extractFiles(versionData) {
		/** @type {Record<string, string>} */
		const files = {};
		const fileList = versionData.files;

		// Dict format: { "SKILL.md": "content..." }
		if (fileList && typeof fileList === "object" && !Array.isArray(fileList)) {
			for (const [k, v] of Object.entries(fileList)) {
				if (typeof v === "string") files[k] = v;
			}
			return files;
		}

		// Array format: [{ path, content?, rawUrl? }, ...]
		if (!Array.isArray(fileList)) return files;

		for (const fileMeta of fileList) {
			if (!fileMeta || typeof fileMeta !== "object") continue;

			const fname = fileMeta.path || fileMeta.name;
			if (!fname || typeof fname !== "string") continue;

			const inlineContent = fileMeta.content;
			if (typeof inlineContent === "string") {
				files[fname] = inlineContent;
				continue;
			}

			const rawUrl = fileMeta.rawUrl || fileMeta.downloadUrl || fileMeta.url;
			if (typeof rawUrl === "string" && rawUrl.startsWith("http")) {
				const content = await _fetchText(rawUrl);
				if (content !== null) {
					files[fname] = content;
				}
			}
		}

		return files;
	}

	/**
	 * Try exact slug-based lookup, generating candidates from query terms.
	 * @param {string} query
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta | null>}
	 */
	async function _exactSlugMeta(query) {
		const slug = query.trim().split("/").pop() || "";
		const terms = _queryTerms(query);
		/** @type {string[]} */
		const candidates = [];

		if (slug && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug)) {
			candidates.push(slug);
		}

		if (terms.length > 0) {
			const baseSlug = terms.join("-");
			if (terms.length >= 2) {
				candidates.push(
					`${baseSlug}-agent`,
					`${baseSlug}-skill`,
					`${baseSlug}-tool`,
					`${baseSlug}-assistant`,
					`${baseSlug}-playbook`,
					baseSlug,
				);
			} else {
				candidates.push(baseSlug);
			}
		}

		/** @type {Set<string>} */
		const seen = new Set();
		for (const candidate of candidates) {
			if (seen.has(candidate)) continue;
			seen.add(candidate);
			const meta = await inspect(candidate);
			if (meta) return meta;
		}

		return null;
	}

	/**
	 * Score, sort, deduplicate, and optionally boost exact slug results.
	 * @param {string} query
	 * @param {import("./hermes-skills-hub").SkillMeta[]} results
	 * @param {number} limit
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function _finalizeSearchResults(query, results, limit) {
		const queryNorm = query.trim();
		if (!queryNorm) {
			return _dedupeResults(results).slice(0, limit);
		}

		let filtered = results.filter((meta) => _searchScore(queryNorm, meta) > 0);
		filtered.sort((a, b) => {
			const scoreDiff = _searchScore(queryNorm, b) - _searchScore(queryNorm, a);
			if (scoreDiff !== 0) return scoreDiff;
			const nameDiff = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
			if (nameDiff !== 0) return nameDiff;
			return a.identifier.toLowerCase().localeCompare(b.identifier.toLowerCase());
		});
		filtered = _dedupeResults(filtered);

		const exact = await _exactSlugMeta(queryNorm);
		if (exact) {
			filtered = filtered.filter((meta) => _searchScore(queryNorm, meta) >= 20);
			filtered = _dedupeResults([exact, ...filtered]);
		}

		if (filtered.length > 0) {
			return filtered.slice(0, limit);
		}

		if (/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(queryNorm)) {
			return [];
		}

		return _dedupeResults(results).slice(0, limit);
	}

	/**
	 * Load and search the full catalog index (paginated from API, cached).
	 * @param {string} query
	 * @param {number} limit
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function _searchCatalog(query, limit = 10) {
		const cacheKey = `clawhub_search_catalog_v1_${crypto.createHash("md5").update(`${query}|${limit}`).digest("hex")}`;
		const cached = await readIndexCache(cacheKey);
		if (cached !== null) {
			return /** @type {import("./hermes-skills-hub").SkillMeta[]} */ (
				/** @type {unknown[]} */ (cached)
			).slice(0, limit);
		}

		const catalog = await _loadCatalogIndex();
		if (catalog.length === 0) return [];

		const results = await _finalizeSearchResults(query, catalog, limit);
		await writeIndexCache(cacheKey, results);
		return results;
	}

	/**
	 * Load the full catalog index from the paginated listing API.
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function _loadCatalogIndex() {
		const cacheKey = "clawhub_catalog_v1";
		const cached = await readIndexCache(cacheKey);
		if (cached !== null) {
			return /** @type {import("./hermes-skills-hub").SkillMeta[]} */ (cached);
		}

		/** @type {string | null} */
		let cursor = null;
		/** @type {import("./hermes-skills-hub").SkillMeta[]} */
		const results = [];
		/** @type {Set<string>} */
		const seen = new Set();
		const maxPages = 50;

		for (let page = 0; page < maxPages; page++) {
			const params = new URLSearchParams({ limit: "200" });
			if (cursor) params.set("cursor", cursor);

			let data;
			try {
				const resp = await fetch(`${BASE_URL}/skills?${params}`, {
					signal: AbortSignal.timeout(CATALOG_TIMEOUT),
				});
				if (!resp.ok) break;
				data = await resp.json();
			} catch {
				break;
			}

			const items = (data && typeof data === "object" && !Array.isArray(data))
				? data.items || []
				: [];
			if (!Array.isArray(items) || items.length === 0) break;

			for (const item of items) {
				const slug = item.slug;
				if (typeof slug !== "string" || !slug || seen.has(slug)) continue;
				seen.add(slug);
				const displayName = item.displayName || item.name || slug;
				const summary = item.summary || item.description || "";
				const tags = _normalizeTags(item.tags || []);
				results.push({
					name: displayName,
					description: summary,
					source: "clawhub",
					identifier: slug,
					trustLevel: "community",
					tags,
					extra: {},
				});
			}

			cursor = (data && typeof data === "object" && !Array.isArray(data))
				? data.nextCursor || null
				: null;
			if (typeof cursor !== "string" || !cursor) break;
		}

		await writeIndexCache(cacheKey, results);
		return results;
	}

	// -----------------------------------------------------------------------
	// SourceAdapter interface
	// -----------------------------------------------------------------------

	/**
	 * Search for skills on ClawHub.
	 * @param {string} query
	 * @param {number} [limit=10]
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function search(query, limit = 10) {
		query = query.trim();

		if (query) {
			const terms = _queryTerms(query);
			if (terms.length >= 2) {
				const direct = await _exactSlugMeta(query);
				if (direct) return [direct];
			}

			const catalogResults = await _searchCatalog(query, limit);
			if (catalogResults.length > 0) return catalogResults;
		}

		// Empty query or catalog fallback: use the lightweight listing API
		const md5Hash = crypto.createHash("md5").update(query).digest("hex");
		const cacheKey = `clawhub_search_listing_v1_${md5Hash}_${limit}`;
		const cached = await readIndexCache(cacheKey);
		if (cached !== null) {
			return _finalizeSearchResults(
				query,
				/** @type {import("./hermes-skills-hub").SkillMeta[]} */ (cached),
				limit,
			);
		}

		let data;
		try {
			const params = new URLSearchParams({ search: query, limit: String(limit) });
			const resp = await fetch(`${BASE_URL}/skills?${params}`, {
				signal: AbortSignal.timeout(LISTING_TIMEOUT),
			});
			if (!resp.ok) return [];
			data = await resp.json();
		} catch {
			return [];
		}

		const skillsData = (data && typeof data === "object" && !Array.isArray(data))
			? (data.items || data)
			: data;
		if (!Array.isArray(skillsData)) return [];

		/** @type {import("./hermes-skills-hub").SkillMeta[]} */
		const results = [];
		for (const item of skillsData.slice(0, limit)) {
			const slug = item.slug;
			if (!slug) continue;
			const displayName = item.displayName || item.name || slug;
			const summary = item.summary || item.description || "";
			const tags = _normalizeTags(item.tags || []);
			results.push({
				name: displayName,
				description: summary,
				source: "clawhub",
				identifier: slug,
				trustLevel: "community",
				tags,
				extra: {},
			});
		}

		const finalResults = await _finalizeSearchResults(query, results, limit);
		await writeIndexCache(cacheKey, finalResults);
		return finalResults;
	}

	/**
	 * Fetch a skill bundle by identifier (slug).
	 * @param {string} identifier
	 * @returns {Promise<import("./hermes-skills-hub").SkillBundle | null>}
	 */
	async function fetch(identifier) {
		const slug = identifier.split("/").pop() || "";

		const skillData = await _getJson(`${BASE_URL}/skills/${slug}`);
		if (!skillData || typeof skillData !== "object" || Array.isArray(skillData)) {
			return null;
		}

		const latestVersion = await _resolveLatestVersion(
			slug,
			/** @type {Record<string, unknown>} */ (skillData),
		);
		if (!latestVersion) return null;

		// Try the version metadata endpoint for inline/raw content
		let files = {};
		const versionData = await _getJson(`${BASE_URL}/skills/${slug}/versions/${latestVersion}`);
		if (versionData && typeof versionData === "object" && !Array.isArray(versionData)) {
			files = await _extractFiles(/** @type {Record<string, unknown>} */ (versionData));
			if (!files["SKILL.md"]) {
				const nested = /** @type {Record<string, unknown>} */ (versionData).version;
				if (nested && typeof nested === "object" && !Array.isArray(nested)) {
					const nestedFiles = await _extractFiles(/** @type {Record<string, unknown>} */ (nested));
					if (Object.keys(nestedFiles).length > 0) files = nestedFiles;
				}
			}
		}

		if (!files["SKILL.md"]) return null;

		return {
			name: slug,
			files,
			source: "clawhub",
			identifier: slug,
			trustLevel: "community",
			metadata: {},
		};
	}

	/**
	 * Inspect a skill by identifier (slug) to get metadata.
	 * @param {string} identifier
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta | null>}
	 */
	async function inspect(identifier) {
		const slug = identifier.split("/").pop() || "";
		const rawData = await _getJson(`${BASE_URL}/skills/${slug}`);
		const data = _coerceSkillPayload(rawData);
		if (!data) return null;

		const tags = _normalizeTags(data.tags || []);

		return {
			name: String(data.displayName || data.name || data.slug || slug),
			description: String(data.summary || data.description || ""),
			source: "clawhub",
			identifier: String(data.slug || slug),
			trustLevel: "community",
			tags,
			extra: {},
		};
	}

	return {
		sourceId: () => "clawhub",
		search,
		fetch,
		inspect,
		trustLevelFor: () => "community",
	};
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { createClawHubSource };
