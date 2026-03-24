const CLARIFICATION_GATE_RESULT_KEYS = new Set([
	"needsClarification",
	"confidence",
	"reason",
]);

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

function safeJsonParse(text) {
	if (!isNonEmptyString(text)) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

function parseClassifierOutput(text) {
	if (!isNonEmptyString(text)) {
		return {
			needsClarification: true,
			confidence: null,
			reason: "empty",
			rawOutput: text,
		};
	}

	const trimmed = text.trim();
	const parsed = safeJsonParse(trimmed);
	if (!parsed || typeof parsed !== "object") {
		// Non-JSON fallback: interpret common keywords
		const normalized = trimmed.toLowerCase();
		if (/\b(no|false|sufficient|enough context|good to proceed)\b/.test(normalized)) {
			return {
				needsClarification: false,
				confidence: null,
				reason: "keyword",
				rawOutput: text,
			};
		}
		if (/\b(yes|true|clarify|need more|missing|not enough)\b/.test(normalized)) {
			return {
				needsClarification: true,
				confidence: null,
				reason: "keyword",
				rawOutput: text,
			};
		}

		return {
			needsClarification: true,
			confidence: null,
			reason: "unparsed",
			rawOutput: text,
		};
	}

	const keys = Object.keys(parsed);
	const filtered = {};
	for (const key of keys) {
		if (CLARIFICATION_GATE_RESULT_KEYS.has(key)) {
			filtered[key] = parsed[key];
		}
	}

	const needsClarification =
		filtered.needsClarification === true
			? true
			: filtered.needsClarification === false
				? false
				: true;
	const confidence =
		typeof filtered.confidence === "number" && Number.isFinite(filtered.confidence)
			? filtered.confidence
			: null;
	const reason = isNonEmptyString(filtered.reason) ? filtered.reason.trim() : null;

	return {
		needsClarification,
		confidence,
		reason,
		rawOutput: text,
	};
}

function buildClassifierPrompt({
	latestUserMessage,
	conversationHistory,
	smartIntentHint,
	layoutContext,
}) {
	const normalizedMessage = isNonEmptyString(latestUserMessage)
		? latestUserMessage.trim()
		: "";
	const normalizedHistory = Array.isArray(conversationHistory)
		? conversationHistory
				.slice(-8)
				.map((message) => {
					if (!message || !isNonEmptyString(message.content)) {
						return null;
					}
					return `${message.type === "assistant" ? "Assistant" : "User"}: ${normalizeWhitespace(message.content)}`;
				})
				.filter(Boolean)
				.join("\n")
		: "";

	const intentLine = isNonEmptyString(smartIntentHint)
		? `Smart intent hint: ${smartIntentHint}`
		: "Smart intent hint: unknown";
	const layoutLine = layoutContext && typeof layoutContext === "object"
		? `Layout context: ${JSON.stringify(layoutContext)}`
		: "Layout context: none";

	return `You decide if the assistant should ask a short clarification question card before generating a creative output (chart, dashboard, UI component, image, or audio).
Return ONLY strict JSON and no markdown.

Schema:
{"needsClarification": true|false, "confidence": 0-1, "reason": "string"}

Guidelines:
- This gate ONLY applies to generative/creative requests (charts, images, audio, UI widgets). It has already been determined that the user wants a generative output.
- needsClarification=true when the generative request is ambiguous or missing key parameters needed to produce useful output.
- For charts/dashboards: clarify when metric, grouping/timeframe, or data context is missing.
- For images: clarify when subject, style, or dimensions are unclear.
- For audio/sound: clarify when type, mood, or duration is unspecified.
- needsClarification=false when there is enough detail to generate something useful, even if not perfectly specified.
- Do NOT ask for clarification if the conversation already contains the needed specifics.
- Prefer generating over asking — only ask when the output would be meaningfully better with clarification.

${intentLine}
${layoutLine}

Conversation history (most recent last):
${normalizedHistory || "(none)"}

Latest user request:
${normalizedMessage}`;
}

const VISUALIZATION_KEYWORDS =
	/\b(chart|charts|graph|graphs|dashboard|dashboards|visualization|visualize|visualisation|visualise|plot|diagram|heatmap|histogram|treemap)\b/i;

const SPECIFICITY_SIGNALS =
	/\b(by\s+\w+|monthly|weekly|daily|quarterly|yearly|per\s+\w+|revenue|sales|cost|profit|users|sessions|conversion|retention|churn|latency|uptime|error rate|from\s+\d{4}|for\s+\d{4}|q[1-4]\s+\d{4}|\d{4}-\d{2}|last\s+\d+\s+(?:days?|weeks?|months?|years?)|top\s+\d+|grouped\s+by|split\s+by|compared?\s+to|versus|vs\.?)\b/i;

function isVagueVisualizationRequest(text) {
	if (!isNonEmptyString(text)) {
		return false;
	}

	const normalized = normalizeWhitespace(text);
	if (!VISUALIZATION_KEYWORDS.test(normalized)) {
		return false;
	}

	return !SPECIFICITY_SIGNALS.test(normalized);
}

function shouldGateSmartClarification({
	latestUserMessage,
	latestUserMessageSource,
	smartGenerationActive,
	smartIntentResult,
	classifierResult,
	resolvedPlanModeActive = false,
	planSessionActive = false,
}) {
	if (!smartGenerationActive) {
		return false;
	}

	if (resolvedPlanModeActive || planSessionActive) {
		return false;
	}

	if (latestUserMessageSource === "clarification-submit") {
		return false;
	}

	// Only gate when the smart intent is a generative output (genui, image, audio).
	// Normal text/conversational intents should never be gated with a question card.
	if (!smartIntentResult || smartIntentResult.intent === "normal") {
		return false;
	}

	const normalizedMessage = isNonEmptyString(latestUserMessage)
		? normalizeWhitespace(latestUserMessage)
		: "";
	if (!normalizedMessage) {
		return false;
	}

	// Heuristic fast-path: vague visualization requests always need clarification,
	// regardless of what the LLM classifier says.
	if (
		(smartIntentResult.intent === "genui" || smartIntentResult.intent === "both") &&
		isVagueVisualizationRequest(normalizedMessage)
	) {
		return true;
	}

	if (!classifierResult || typeof classifierResult.needsClarification !== "boolean") {
		return false;
	}

	return classifierResult.needsClarification;
}

module.exports = {
	buildClassifierPrompt,
	isVagueVisualizationRequest,
	parseClassifierOutput,
	shouldGateSmartClarification,
};
