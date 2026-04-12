/**
 * Skills Hub — LobeHub source adapter.
 *
 * Provides:
 * - createLobeHubSource(): SourceAdapter for LobeHub agent marketplace (14,500+ agents)
 *
 * LobeHub agents are system prompt templates — we convert them to SKILL.md on fetch.
 * Data lives in GitHub: lobehub/lobe-chat-agents.
 *
 * Ported from NousResearch/hermes-agent tools/skills_hub.py (LobeHubSource).
 */

const { readIndexCache, writeIndexCache } = require("./hermes-skills-hub");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INDEX_URL = "https://chat-agents.lobehub.com/index.json";
const INDEX_TIMEOUT = 30_000;
const AGENT_TIMEOUT = 15_000;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Convert a LobeHub agent JSON into SKILL.md format.
 * @param {Record<string, unknown>} agentData
 * @returns {string}
 */
function _convertToSkillMd(agentData) {
	const meta = /** @type {Record<string, unknown>} */ (agentData.meta || agentData);
	const identifier = String(agentData.identifier || "lobehub-agent");
	const title = String(meta.title || identifier);
	const description = String(meta.description || "");
	const rawTags = meta.tags;
	const tags = Array.isArray(rawTags) ? rawTags.map(String) : [];

	const config = /** @type {Record<string, unknown>} */ (agentData.config || {});
	const systemRole = String(config.systemRole || "");

	const fmLines = [
		"---",
		`name: ${identifier}`,
		`description: ${description.slice(0, 500)}`,
		"metadata:",
		"  hermes:",
		`    tags: [${tags.join(", ")}]`,
		"  lobehub:",
		"    source: lobehub",
		"---",
	];

	const bodyLines = [
		`# ${title}`,
		"",
		description,
		"",
		"## Instructions",
		"",
		systemRole || "(No system role defined)",
	];

	return fmLines.join("\n") + "\n\n" + bodyLines.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// createLobeHubSource
// ---------------------------------------------------------------------------

/**
 * @returns {import("./hermes-skills-hub").SourceAdapter}
 */
function createLobeHubSource() {
	/**
	 * Fetch the full agent index (cached for 1 hour via file-based cache).
	 * @returns {Promise<unknown>}
	 */
	async function _fetchIndex() {
		const cacheKey = "lobehub_index";
		const cached = await readIndexCache(cacheKey);
		if (cached !== null) return cached;

		try {
			const resp = await fetch(INDEX_URL, {
				signal: AbortSignal.timeout(INDEX_TIMEOUT),
			});
			if (!resp.ok) return null;
			const data = await resp.json();
			await writeIndexCache(cacheKey, data);
			return data;
		} catch {
			return null;
		}
	}

	/**
	 * Fetch a single agent's JSON file.
	 * @param {string} agentId
	 * @returns {Promise<Record<string, unknown> | null>}
	 */
	async function _fetchAgent(agentId) {
		const url = `https://chat-agents.lobehub.com/${agentId}.json`;
		try {
			const resp = await fetch(url, {
				signal: AbortSignal.timeout(AGENT_TIMEOUT),
			});
			if (!resp.ok) return null;
			return await resp.json();
		} catch {
			return null;
		}
	}

	/**
	 * Extract the agents array from the index (handles both object and array shapes).
	 * @param {unknown} index
	 * @returns {unknown[]}
	 */
	function _getAgents(index) {
		if (!index) return [];
		if (Array.isArray(index)) return index;
		if (typeof index === "object") {
			const agents = /** @type {Record<string, unknown>} */ (index).agents;
			if (Array.isArray(agents)) return agents;
			// If no `agents` key, treat the whole object as the container
			return Array.isArray(index) ? index : [];
		}
		return [];
	}

	// -----------------------------------------------------------------------
	// SourceAdapter interface
	// -----------------------------------------------------------------------

	/**
	 * Search for agents in the LobeHub index.
	 * @param {string} query
	 * @param {number} [limit=10]
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta[]>}
	 */
	async function search(query, limit = 10) {
		const index = await _fetchIndex();
		if (!index) return [];

		const agents = _getAgents(index);
		if (agents.length === 0) return [];

		const queryLower = query.toLowerCase();
		/** @type {import("./hermes-skills-hub").SkillMeta[]} */
		const results = [];

		for (const agent of agents) {
			if (!agent || typeof agent !== "object") continue;

			const agentObj = /** @type {Record<string, unknown>} */ (agent);
			const meta = /** @type {Record<string, unknown>} */ (agentObj.meta || agentObj);
			const title = String(meta.title || agentObj.identifier || "");
			const desc = String(meta.description || "");
			const rawTags = meta.tags;
			const tags = Array.isArray(rawTags) ? rawTags.map(String) : [];

			const searchable = `${title} ${desc} ${tags.join(" ")}`.toLowerCase();
			if (queryLower && !searchable.includes(queryLower)) continue;

			const agentIdentifier = String(
				agentObj.identifier || title.toLowerCase().replace(/\s+/g, "-"),
			);

			results.push({
				name: agentIdentifier,
				description: desc.slice(0, 200),
				source: "lobehub",
				identifier: `lobehub/${agentIdentifier}`,
				trustLevel: "community",
				tags,
				extra: {},
			});

			if (results.length >= limit) break;
		}

		return results;
	}

	/**
	 * Fetch a skill bundle for a LobeHub agent.
	 * @param {string} identifier
	 * @returns {Promise<import("./hermes-skills-hub").SkillBundle | null>}
	 */
	async function fetch(identifier) {
		const agentId = identifier.startsWith("lobehub/")
			? identifier.split("/").slice(1).join("/")
			: identifier;

		const agentData = await _fetchAgent(agentId);
		if (!agentData) return null;

		const skillMd = _convertToSkillMd(agentData);

		return {
			name: agentId,
			files: { "SKILL.md": skillMd },
			source: "lobehub",
			identifier: `lobehub/${agentId}`,
			trustLevel: "community",
			metadata: {},
		};
	}

	/**
	 * Inspect a LobeHub agent to get metadata without fetching the full bundle.
	 * @param {string} identifier
	 * @returns {Promise<import("./hermes-skills-hub").SkillMeta | null>}
	 */
	async function inspect(identifier) {
		const agentId = identifier.startsWith("lobehub/")
			? identifier.split("/").slice(1).join("/")
			: identifier;

		const index = await _fetchIndex();
		if (!index) return null;

		const agents = _getAgents(index);
		if (agents.length === 0) return null;

		for (const agent of agents) {
			if (!agent || typeof agent !== "object") continue;
			const agentObj = /** @type {Record<string, unknown>} */ (agent);
			if (agentObj.identifier !== agentId) continue;

			const meta = /** @type {Record<string, unknown>} */ (agentObj.meta || agentObj);
			const rawTags = meta.tags;
			const tags = Array.isArray(rawTags) ? rawTags.map(String) : [];

			return {
				name: agentId,
				description: String(meta.description || ""),
				source: "lobehub",
				identifier: `lobehub/${agentId}`,
				trustLevel: "community",
				tags,
				extra: {},
			};
		}

		return null;
	}

	return {
		sourceId: () => "lobehub",
		search,
		fetch,
		inspect,
		trustLevelFor: () => "community",
	};
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = { createLobeHubSource };
