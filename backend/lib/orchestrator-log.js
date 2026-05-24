/**
 * Orchestrator Log — cross-panel activity tracker for multiport chat sessions.
 *
 * Maintains an in-memory log of chat turns across all sticky-port panels,
 * and persists each entry to a JSONL file in `backend/data/` for review.
 *
 * Usage:
 *   const { createOrchestratorLog } = require("./orchestrator-log");
 *   const log = createOrchestratorLog({ baseDir: path.join(__dirname, "data") });
 *
 *   // After a chat turn completes
 *   log.append({ portIndex: 0, userMessage: "...", assistantResponse: "..." });
 *
 *   // Query the log
 *   const entries = log.getEntries();          // all entries
 *   const entries = log.getEntries({ portIndex: 0 }); // filter by panel
 *
 *   // Clear in-memory log (file is preserved)
 *   log.clear();
 */

const fs = require("node:fs");
const path = require("node:path");

const PANEL_LABELS = ["A", "B", "C", "D", "E", "F"];
const DEFAULT_SUMMARY_MAX_CHARS = 300;
const LOG_FILENAME = "orchestrator-log.jsonl";

/**
 * Truncate text to a maximum character count with an ellipsis.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string}
 */
function truncate(text, maxChars) {
	if (typeof text !== "string") {
		return "";
	}
	if (text.length <= maxChars) {
		return text;
	}
	return `${text.slice(0, maxChars - 1)}…`;
}

/**
 * Extract a short summary from an assistant response.
 * Strips markdown code fences and collapses whitespace.
 * @param {string} text
 * @param {number} [maxChars]
 * @returns {string}
 */
function summarizeResponse(text, maxChars = DEFAULT_SUMMARY_MAX_CHARS) {
	if (typeof text !== "string" || text.trim().length === 0) {
		return "";
	}

	const cleaned = text
		.replace(/```[\s\S]*?```/g, "[code block]")
		.replace(/\n{2,}/g, " | ")
		.replace(/\n/g, " ")
		.replace(/\s{2,}/g, " ")
		.trim();

	return truncate(cleaned, maxChars);
}

/**
 * Create an orchestrator log instance.
 *
 * @param {object} params
 * @param {string} params.baseDir - Directory to store the JSONL file
 * @param {object} [params.logger] - Logger (defaults to console)
 * @returns {{ append: Function, getEntries: Function, clear: Function, getStats: Function }}
 */
function createOrchestratorLog({ baseDir, logger = console }) {
	/** @type {Array<object>} */
	const entries = [];
	let turnCounter = 0;

	const logFilePath = path.join(baseDir, LOG_FILENAME);

	// Ensure the data directory exists
	if (!fs.existsSync(baseDir)) {
		fs.mkdirSync(baseDir, { recursive: true });
	}

	/**
	 * Append a chat turn to the orchestrator log.
	 *
	 * @param {object} params
	 * @param {number} params.portIndex - The sticky port index (0-based)
	 * @param {number} [params.rovoPort] - The resolved numeric Rovo port
	 * @param {string} params.userMessage - The user's message
	 * @param {string} params.assistantResponse - The full assistant response text
	 * @param {number} [params.summaryMaxChars] - Max chars for the response summary
	 */
	function append({
		portIndex,
		rovoPort,
		userMessage,
		assistantResponse,
		summaryMaxChars,
	}) {
		if (typeof portIndex !== "number" || portIndex < 0) {
			return;
		}

		const userText =
			typeof userMessage === "string" ? userMessage.trim() : "";
		if (!userText) {
			return;
		}

		turnCounter += 1;
		const panelLabel =
			portIndex < PANEL_LABELS.length
				? PANEL_LABELS[portIndex]
				: String(portIndex);
		const assistantSummary = summarizeResponse(
			assistantResponse,
			summaryMaxChars
		);

		const entry = {
			id: turnCounter,
			timestamp: new Date().toISOString(),
			portIndex,
			...(typeof rovoPort === "number" && rovoPort > 0
				? { rovoPort }
				: {}),
			panel: panelLabel,
			userMessage: truncate(userText, 500),
			assistantSummary,
			charCount:
				typeof assistantResponse === "string"
					? assistantResponse.length
					: 0,
		};

		entries.push(entry);

		// Persist to disk (fire-and-forget)
		try {
			fs.appendFileSync(logFilePath, JSON.stringify(entry) + "\n", "utf8");
		} catch (err) {
			logger.warn(
				`[ORCHESTRATOR] Failed to persist log entry: ${err.message}`
			);
		}

		logger.info(
			`[ORCHESTRATOR] Panel ${panelLabel} (port index ${portIndex}${
				typeof rovoPort === "number" && rovoPort > 0
					? `, port ${rovoPort}`
					: ""
			}) turn #${turnCounter}: "${truncate(userText, 80)}"`
		);
	}

	/**
	 * Get all log entries, optionally filtered.
	 *
	 * @param {object} [filter]
	 * @param {number} [filter.portIndex] - Filter by specific port index
	 * @param {number} [filter.limit] - Return only the last N entries
	 * @returns {object[]}
	 */
	function getEntries(filter) {
		let result = entries;

		if (filter && typeof filter.portIndex === "number") {
			result = result.filter((e) => e.portIndex === filter.portIndex);
		}

		if (filter && typeof filter.limit === "number" && filter.limit > 0) {
			result = result.slice(-filter.limit);
		}

		return result;
	}

	/**
	 * Get summary stats about the log.
	 * @returns {{ totalTurns: number, panelCounts: Record<string, number>, startedAt: string | null, lastActivity: string | null }}
	 */
	function getStats() {
		const panelCounts = {};
		for (const entry of entries) {
			panelCounts[entry.panel] = (panelCounts[entry.panel] || 0) + 1;
		}

		return {
			totalTurns: entries.length,
			panelCounts,
			startedAt: entries.length > 0 ? entries[0].timestamp : null,
			lastActivity:
				entries.length > 0 ? entries[entries.length - 1].timestamp : null,
		};
	}

	/**
	 * Build a plain-text timeline suitable for feeding to an LLM.
	 * @param {object} [filter]
	 * @param {number} [filter.portIndex]
	 * @param {number} [filter.limit]
	 * @returns {string}
	 */
	function toTimeline(filter) {
		const selected = getEntries(filter);
		if (selected.length === 0) {
			return "No activity recorded yet.";
		}

		return selected
			.map(
				(e) =>
					`[${e.timestamp}] Panel ${e.panel}: User asked "${e.userMessage}" → Assistant: ${e.assistantSummary || "(no summary)"}`
			)
			.join("\n");
	}

	/**
	 * Clear the in-memory log. The JSONL file on disk is preserved.
	 */
	function clear() {
		entries.length = 0;
		turnCounter = 0;
		logger.info("[ORCHESTRATOR] In-memory log cleared.");
	}

	return { append, getEntries, getStats, toTimeline, clear };
}

module.exports = { createOrchestratorLog };
