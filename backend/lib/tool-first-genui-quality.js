const { isObjectRecord } = require("./shared-utils");
const VISUALIZATION_PROMPT_PATTERN =
	/\b(chart|charts|graph|graphs|plot|plots|dashboard|dashboards|visuali[sz]ation|visuali[sz]e|visualisation|visualise|heatmap|histogram|treemap|candlestick|stock price)\b/i;
const VISUALIZATION_COMPONENT_TYPES = new Set([
	"AreaChart",
	"BarChart",
	"LineChart",
	"PieChart",
	"RadarChart",
	"ScatterChart",
	"Table",
	"Metric",
	"WorkSummary",
]);

function getNonNegativeInteger(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return 0;
	}

	return Math.max(0, Math.floor(value));
}

function getElements(spec) {
	if (!isObjectRecord(spec) || !isObjectRecord(spec.elements)) {
		return {};
	}

	return spec.elements;
}

function hasRecoveredPlaceholderSection(spec) {
	const elements = Object.values(getElements(spec));
	for (const element of elements) {
		if (!isObjectRecord(element)) {
			continue;
		}

		if (element.type !== "Card") {
			continue;
		}

		const props = isObjectRecord(element.props) ? element.props : null;
		if (!props) {
			continue;
		}

		const title = typeof props.title === "string" ? props.title.trim() : "";
		const description =
			typeof props.description === "string" ? props.description.trim() : "";
		if (
			title.toLowerCase() === "generated section" &&
			/recovered from incomplete model output/i.test(description)
		) {
			return true;
		}
	}

	return false;
}

function getLatestUserPrompt(prompt) {
	if (typeof prompt !== "string") {
		return "";
	}

	const userBlocks = [...prompt.matchAll(/\[User\]\n([\s\S]*?)(?=\n\n\[(?:User|Assistant)\]\n|$)/g)];
	if (userBlocks.length === 0) {
		return prompt;
	}

	const latestBlock = userBlocks[userBlocks.length - 1]?.[1];
	return typeof latestBlock === "string" ? latestBlock.trim() : "";
}

function hasVisualizationComponent(spec) {
	for (const element of Object.values(getElements(spec))) {
		if (!isObjectRecord(element) || typeof element.type !== "string") {
			continue;
		}

		if (VISUALIZATION_COMPONENT_TYPES.has(element.type)) {
			return true;
		}
	}

	return false;
}

function assessToolFirstGenuiQuality({ analysis, spec, prompt } = {}) {
	const missingChildKeys = Array.isArray(analysis?.missingChildKeys)
		? analysis.missingChildKeys
		: [];
	const synthesizedChildCount = getNonNegativeInteger(
		analysis?.synthesizedChildCount
	);
	const usedSynthesizedSpec = Boolean(
		spec && analysis?.synthesizedSpec && spec === analysis.synthesizedSpec
	);
	const hasPlaceholderSection = hasRecoveredPlaceholderSection(spec);

	const reasons = [];
	if (!spec) {
		reasons.push("missing_spec");
	}
	if (synthesizedChildCount > 0) {
		reasons.push("synthesized_missing_children");
	}
	if (missingChildKeys.length > 0) {
		reasons.push("missing_child_references");
	}
	if (usedSynthesizedSpec) {
		reasons.push("selected_synthesized_spec");
	}
	if (hasPlaceholderSection) {
		reasons.push("recovered_placeholder_sections");
	}
	const latestUserPrompt = getLatestUserPrompt(prompt);
	if (
		spec &&
		VISUALIZATION_PROMPT_PATTERN.test(latestUserPrompt) &&
		!hasVisualizationComponent(spec)
	) {
		reasons.push("missing_expected_visualization_component");
	}

	return {
		quality: reasons.length > 0 ? "low_confidence" : "acceptable",
		reasons,
		synthesizedChildCount,
		missingChildKeyCount: missingChildKeys.length,
		usedSynthesizedSpec,
		hasRecoveredPlaceholderSection: hasPlaceholderSection,
	};
}

module.exports = {
	hasRecoveredPlaceholderSection,
	assessToolFirstGenuiQuality,
	hasVisualizationComponent,
};
