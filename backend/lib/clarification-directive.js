const VISUALIZATION_REQUEST_PATTERN =
	/\b(chart|charts|graph|graphs|plot|plots|dashboard|dashboards|visuali[sz]ation|visuali[sz]e|visualisation|visualise|heatmap|histogram|treemap|candlestick)\b/i;
const PLAN_REQUEST_PATTERN =
	/\b(plan|planning|task list|tasklist|steps|roadmap|milestones?|implementation plan|implementation tasks?|checklist|create-plan)\b/i;

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function buildClarificationDirective({
	latestUserMessage,
	intentHint,
} = {}) {
	const normalizedPrompt = getNonEmptyString(latestUserMessage) || "";

	if (
		intentHint === "visualization" ||
		VISUALIZATION_REQUEST_PATTERN.test(normalizedPrompt)
	) {
		return [
			"Use these details to generate the requested visualization now.",
			"Return a json-render UI widget that matches the requested chart or data view.",
			"Do not ask follow-up questions unless a hard blocker prevents completion.",
		].join("\n");
	}

	if (PLAN_REQUEST_PATTERN.test(normalizedPrompt)) {
		return [
			"Use these details to generate the final plan now.",
			"Return a plan widget with concrete tasks.",
			"Do not ask follow-up questions unless a hard blocker prevents completion.",
		].join("\n");
	}

	return [
		"Use these details to continue the user's original request now.",
		"Return the final answer in the format that best matches the request.",
		"Do not ask follow-up questions unless a hard blocker prevents completion.",
	].join("\n");
}

module.exports = {
	buildClarificationDirective,
};
