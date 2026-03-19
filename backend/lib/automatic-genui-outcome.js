function resolveAutomaticGenuiOutcome({
	genuiResult,
	successSource,
	successSummary,
	failureMessage = "I couldn't produce a renderable interactive summary from tool output.",
} = {}) {
	const hasRenderableSpec = Boolean(genuiResult?.spec);
	const isLowConfidenceSpec =
		hasRenderableSpec && genuiResult?.quality === "low_confidence";

	if (hasRenderableSpec && !isLowConfidenceSpec) {
		return {
			kind: "widget",
			spec: genuiResult.spec,
			summary: successSummary || "Generated interactive view",
			source: successSource,
		};
	}

	return {
		kind: "failure",
		code: isLowConfidenceSpec ? "low_confidence_spec" : "missing_renderable_spec",
		message: failureMessage,
	};
}

module.exports = {
	resolveAutomaticGenuiOutcome,
};
