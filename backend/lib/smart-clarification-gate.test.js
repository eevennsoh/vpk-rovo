const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildClassifierPrompt,
	isVagueVisualizationRequest,
	parseClassifierOutput,
	shouldGateSmartClarification,
} = require("./smart-clarification-gate");

test("parseClassifierOutput parses JSON", () => {
	const parsed = parseClassifierOutput(
		'{"needsClarification":false,"confidence":0.82,"reason":"enough context"}'
	);
	assert.equal(parsed.needsClarification, false);
	assert.equal(parsed.confidence, 0.82);
	assert.equal(parsed.reason, "enough context");
});

test("parseClassifierOutput handles keyword fallback", () => {
	const parsed = parseClassifierOutput("Sufficient context, proceed");
	assert.equal(parsed.needsClarification, false);
});

test("shouldGateSmartClarification does NOT gate conversational messages", () => {
	// "hey there" has intent=normal → should not be gated
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "hey there",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "normal" },
			classifierResult: { needsClarification: true },
		}),
		false
	);

	// "how r u" has intent=normal → should not be gated
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "how r u",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "normal" },
			classifierResult: { needsClarification: true },
		}),
		false
	);
});

test("shouldGateSmartClarification does NOT gate when no smartIntentResult", () => {
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "chart",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: null,
			classifierResult: { needsClarification: true },
		}),
		false
	);
});

test("shouldGateSmartClarification skips after clarification-submit", () => {
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "give me a chart",
			latestUserMessageSource: "clarification-submit",
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: { needsClarification: true },
		}),
		false
	);
});

test("shouldGateSmartClarification skips when explicit plan mode is active", () => {
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "give me a chart",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: { needsClarification: true },
			resolvedPlanModeActive: true,
		}),
		false
	);
});

test("shouldGateSmartClarification skips when a plan session is active", () => {
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "generate an image",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "image" },
			classifierResult: { needsClarification: true },
			planSessionActive: true,
		}),
		false
	);
});

test("shouldGateSmartClarification gates vague generative requests", () => {
	// Vague chart request with genui intent + classifier says needs clarification
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "Give me a chart of revenue",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: { needsClarification: true },
		}),
		true
	);

	// Image request with classifier saying needs clarification
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "generate an image",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "image" },
			classifierResult: { needsClarification: true },
		}),
		true
	);
});

test("shouldGateSmartClarification does NOT gate detailed generative requests", () => {
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "Plot monthly revenue by region for 2024",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: { needsClarification: false },
		}),
		false
	);
});

test("buildClassifierPrompt includes key sections", () => {
	const prompt = buildClassifierPrompt({
		latestUserMessage: "give me a chart",
		conversationHistory: [
			{ type: "user", content: "hello" },
			{ type: "assistant", content: "hi" },
		],
		smartIntentHint: "genui",
		layoutContext: { surface: "multiports", widthClass: "compact" },
	});
	assert.match(prompt, /Latest user request:/);
	assert.match(prompt, /give me a chart/);
	assert.match(prompt, /Smart intent hint: genui/);
	assert.match(prompt, /Layout context:/);
});

// --- isVagueVisualizationRequest tests ---

test("isVagueVisualizationRequest returns true for bare chart/graph/dashboard requests", () => {
	assert.equal(isVagueVisualizationRequest("generate a chart"), true);
	assert.equal(isVagueVisualizationRequest("make me a graph"), true);
	assert.equal(isVagueVisualizationRequest("create a dashboard"), true);
	assert.equal(isVagueVisualizationRequest("show me a visualization"), true);
	assert.equal(isVagueVisualizationRequest("I want a pie chart"), true);
	assert.equal(isVagueVisualizationRequest("plot something"), true);
	assert.equal(isVagueVisualizationRequest("build a histogram"), true);
	assert.equal(isVagueVisualizationRequest("give me a heatmap"), true);
});

test("isVagueVisualizationRequest returns false for detailed requests with specificity signals", () => {
	assert.equal(isVagueVisualizationRequest("Plot monthly revenue by region for 2024"), false);
	assert.equal(isVagueVisualizationRequest("chart of sales grouped by quarter"), false);
	assert.equal(isVagueVisualizationRequest("graph showing daily active users last 30 days"), false);
	assert.equal(isVagueVisualizationRequest("dashboard with conversion rate per product"), false);
	assert.equal(isVagueVisualizationRequest("chart revenue vs cost for Q1 2024"), false);
	assert.equal(isVagueVisualizationRequest("top 10 customers chart"), false);
});

test("isVagueVisualizationRequest returns false for non-visualization requests", () => {
	assert.equal(isVagueVisualizationRequest("hello"), false);
	assert.equal(isVagueVisualizationRequest("write a function"), false);
	assert.equal(isVagueVisualizationRequest("help me with my code"), false);
	assert.equal(isVagueVisualizationRequest(""), false);
	assert.equal(isVagueVisualizationRequest(null), false);
	assert.equal(isVagueVisualizationRequest(undefined), false);
});

test("shouldGateSmartClarification overrides classifier for vague visualization requests", () => {
	// Classifier says no clarification needed, but heuristic overrides
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "generate a chart",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: { needsClarification: false },
		}),
		true
	);

	// Also works with intent "both"
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "make me a dashboard",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "both" },
			classifierResult: { needsClarification: false },
		}),
		true
	);

	// Works even when classifierResult is null (LLM call skipped)
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "create a graph",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: null,
		}),
		true
	);
});

test("shouldGateSmartClarification does NOT override for detailed visualization requests", () => {
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "Plot monthly revenue by region for 2024",
			latestUserMessageSource: null,
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: { needsClarification: false },
		}),
		false
	);
});

test("shouldGateSmartClarification still respects clarification-submit bypass for visualization", () => {
	assert.equal(
		shouldGateSmartClarification({
			latestUserMessage: "generate a chart",
			latestUserMessageSource: "clarification-submit",
			smartGenerationActive: true,
			smartIntentResult: { intent: "genui" },
			classifierResult: { needsClarification: true },
		}),
		false
	);
});
