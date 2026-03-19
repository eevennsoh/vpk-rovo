const { buildWorkSummaryStructuredSpec } = require("./genui-work-summary-tool-handler");
const { buildFigmaStructuredSpec } = require("./genui-figma-tool-handler");
const { buildGoogleStructuredSpec } = require("./genui-google-tool-handler");

/**
 * Try each bespoke genui handler in priority order.
 * Returns the first non-null result, or null to fall through to the LLM path.
 *
 * Priority order:
 *   1. WorkSummary — most specific (Jira/Confluence + time-window intent)
 *   2. Figma — design context with code previews
 *   3. Google — Calendar timeline / Drive files
 *
 * @param {object} params
 * @param {Array}  params.observations   — toolObservationEntries array
 * @param {string} params.prompt         — user message text
 * @param {string} [params.title]        — optional title hint
 * @param {string} [params.description]  — optional description hint
 * @returns {{ spec, summary, source, observationUsed, observationCount, resultCount, errorCount } | null}
 */
function dispatchBespokeGenuiHandler({
	observations,
	prompt,
	title,
	description,
} = {}) {
	const entries = Array.isArray(observations) ? observations : [];
	if (entries.length === 0) {
		return null;
	}

	const context = { observations: entries, prompt, title, description };

	// 1. WorkSummary — Jira/Confluence + time-window intent
	const workSummaryResult = buildWorkSummaryStructuredSpec(context);
	if (workSummaryResult) {
		return workSummaryResult;
	}

	// 2. Figma — design context with code previews
	const figmaResult = buildFigmaStructuredSpec(context);
	if (figmaResult) {
		return figmaResult;
	}

	// 3. Google — Calendar/Drive
	const googleResult = buildGoogleStructuredSpec(context);
	if (googleResult) {
		return googleResult;
	}

	return null;
}

module.exports = {
	dispatchBespokeGenuiHandler,
};
