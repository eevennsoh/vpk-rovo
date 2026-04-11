const { getNonEmptyString } = require("./shared-utils");
const { isConversationalMessage, isTaskLikeMessage } = require("./planning-question-gate");
const { isExplicitNewRovoAppArtifactRequest } = require("./rovo-app-artifact-updates");

// ---------------------------------------------------------------------------
// Regex patterns — ported from existing classifiers
// ---------------------------------------------------------------------------

/**
 * Verb + noun patterns for artifact creation requests.
 * Derived from rovo-app-artifact-intent.js DOCUMENT_VERB_PATTERN / DOCUMENT_NOUN_PATTERN.
 */
const ARTIFACT_CREATE_VERB_PATTERN =
	/\b(write|draft|create|build|generate|make|compose|outline|design|implement|refactor|turn|convert)\b/i;
const ARTIFACT_CREATE_NOUN_PATTERN =
	/\b(document|doc|plan|brief|proposal|spec|summary|memo|outline|report|email|copy|article|blog|code|component|app|page|ui|table|spreadsheet|sheet|artifact|website|site|landing\s*page|form|template|script|function|class|module|api|endpoint)\b/i;

/**
 * GenUI patterns — ported from prompt-intent.js SMART_UI_REQUEST_PATTERN.
 */
const GENUI_NOUN_PATTERN =
	/\b(dashboard|chart|charts|graph|graphs|plot|plots|visuali[sz]e|visualization|infographic|kanban|board|timeline|roadmap|widget|json\s*spec|json-render|data\s*view|breakdown|overview|analytics|metrics|kpi|stats|statistics|diagram|flowchart|excalidraw|sequence\s+diagram)\b/i;
const GENUI_VERB_PATTERN =
	/\b(show|display|visuali[sz]e|render|chart|graph|plot|present|summarize|breakdown)\b/i;

/**
 * Data-oriented nouns that, combined with a genui verb, strongly indicate genui.
 */
const DATA_NOUN_PATTERN =
	/\b(revenue|sales|data|performance|growth|trend|trends|traffic|conversion|profit|expense|budget|forecast|q[1-4]|quarter|quarterly|annual|monthly|weekly|daily|ytd|year[\s-]to[\s-]date|breakdown|distribution|comparison|analysis)\b/i;
const DIAGRAM_REQUEST_PATTERN =
	/\b(?:create|build|generate|make|draw|design|render|show)\b[\s\S]{0,80}\b(?:diagram|flowchart|excalidraw|sequence\s+diagram|architecture\s+diagram|system\s+diagram)\b|\b(?:diagram|flowchart|excalidraw|sequence\s+diagram|architecture\s+diagram|system\s+diagram)\b[\s\S]{0,80}\b(?:create|build|generate|make|draw|design|render|show)\b/i;

// ---------------------------------------------------------------------------
// Presentation mapping
// ---------------------------------------------------------------------------

const INTENT_TO_PRESENTATION = {
	chat: "text",
	artifact_create: "artifact_preview",
	artifact_update: "artifact_preview",
	genui: "genui_card",
};

function presentationForIntent(intent) {
	return INTENT_TO_PRESENTATION[intent] || "text";
}

// ---------------------------------------------------------------------------
// Layer 1 — Deterministic fast path (< 10ms)
// ---------------------------------------------------------------------------

/**
 * Attempts to classify a routing decision without calling the LLM.
 * Returns a full RoutingDecision when confident, or `null` when the
 * prompt is ambiguous and should be escalated to Layer 2.
 *
 * @param {RoutingContext} context
 * @returns {RoutingDecision | null}
 */
function resolveRoutingDecisionFastPath(context) {
	const prompt = getNonEmptyString(context?.prompt) || "";
	const origin = context?.origin === "voice" ? "voice" : "text";
	const activeArtifact = context?.activeArtifact;

	// Empty / whitespace-only → chat
	if (!prompt.trim()) {
		return {
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "empty_prompt",
			origin,
		};
	}

	if (activeArtifact?.id) {
		return {
			intent: "artifact_update",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "active_artifact",
			origin,
		};
	}

	// Ambiguous — fall through to Layer 2
	return null;
}

// ---------------------------------------------------------------------------
// Layer 2 — LLM classifier (< 1500ms budget)
// ---------------------------------------------------------------------------

const CLASSIFIER_SYSTEM_PROMPT = `You are a routing classifier for a chat application with multiple surfaces.
Classify the user's latest message into exactly one intent:

- chat: normal conversation, Q&A, greetings, explanations, opinions, or anything that should stay in the chat transcript
- artifact_create: user wants to create a new code artifact, document, or durable content (app, page, component, doc, spec, memo, etc.)
- genui: user wants a dynamic data visualization, dashboard, chart, graph, infographic, diagram, flowchart, or interactive UI widget

Rules:
- Choose artifact_create only when the user explicitly asks to build/create/generate a durable artifact.
- Choose genui when the user asks for data visualization, dashboards, charts, analytics, or interactive widgets.
- Choose chat for everything else — when in doubt, choose chat.
- Ignore assistant capabilities; classify only user intent.

Return strict JSON only:
{"intent":"chat|artifact_create|genui","confidence":0.0,"reason":"short reason"}`;

function buildClassifierPrompt({ prompt, recentHistory }) {
	const historyLines = Array.isArray(recentHistory)
		? recentHistory
				.slice(-6)
				.map((msg) => {
					const role = msg?.role === "assistant" ? "Assistant" : "User";
					const content = getNonEmptyString(msg?.content);
					return content ? `${role}: ${content}` : null;
				})
				.filter(Boolean)
		: [];

	return [
		"Conversation context:",
		historyLines.length > 0 ? historyLines.join("\n") : "(none)",
		"",
		`Latest user request: ${prompt}`,
		"",
		"Return JSON only.",
	].join("\n");
}

const VALID_INTENTS = new Set(["chat", "artifact_create", "genui"]);

function parseClassifierResponse(rawText) {
	const text = getNonEmptyString(rawText);
	if (!text) {
		return null;
	}

	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		const jsonMatch = text.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			return null;
		}
		try {
			parsed = JSON.parse(jsonMatch[0]);
		} catch {
			return null;
		}
	}

	if (!parsed || typeof parsed !== "object") {
		return null;
	}

	const rawIntent = getNonEmptyString(parsed.intent)?.toLowerCase();
	const intent = VALID_INTENTS.has(rawIntent) ? rawIntent : null;
	if (!intent) {
		return null;
	}

	const confidence =
		typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
			? Math.max(0, Math.min(1, parsed.confidence))
			: null;
	const reason = getNonEmptyString(parsed.reason);

	return { intent, confidence, reason };
}

function createTimeoutError() {
	const err = new Error("routing-classifier-timeout");
	err.code = "ROUTING_CLASSIFIER_TIMEOUT";
	return err;
}

function withTimeout(operation, timeoutMs) {
	const effective =
		typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0
			? timeoutMs
			: 1500;

	return new Promise((resolve, reject) => {
		const abortController = new AbortController();
		let settled = false;

		const settle = (cb, value) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			cb(value);
		};

		const timer = setTimeout(() => {
			abortController.abort();
			settle(reject, createTimeoutError());
		}, effective);

		Promise.resolve()
			.then(() => operation({ signal: abortController.signal }))
			.then((value) => settle(resolve, value))
			.catch((error) => settle(reject, error));
	});
}

/**
 * Main entry point — two-layer routing classifier.
 *
 * Layer 1 (fast path) runs deterministic regex checks synchronously.
 * Layer 2 (LLM) is invoked only when the fast path returns null.
 *
 * @param {RoutingContext} context
 * @param {Object} [options]
 * @param {Function} [options.classify] — async function({ system, prompt, signal }) => string
 * @param {number}   [options.timeoutMs=1500] — LLM call timeout in ms
 * @returns {Promise<RoutingDecision>}
 */
async function resolveRoutingDecision(context, { classify, timeoutMs = 1500 } = {}) {
	const origin = context?.origin === "voice" ? "voice" : "text";
	const confidenceThreshold = origin === "voice" ? 0.8 : 0.7;

	// Layer 1 — deterministic fast path
	const fastResult = resolveRoutingDecisionFastPath(context);
	if (fastResult) {
		return fastResult;
	}

	// Layer 2 — LLM classifier
	if (typeof classify !== "function") {
		// No LLM available — safe fallback to chat
		return {
			intent: "chat",
			presentation: "text",
			confidence: 0,
			reason: "no_classifier",
			origin,
		};
	}

	const prompt = getNonEmptyString(context?.prompt) || "";

	try {
		const rawOutput = await withTimeout(
			({ signal }) =>
				classify({
					system: CLASSIFIER_SYSTEM_PROMPT,
					prompt: buildClassifierPrompt({
						prompt,
						recentHistory: context?.recentHistory,
					}),
					signal,
				}),
			timeoutMs,
		);

		const parsed = parseClassifierResponse(rawOutput);
		if (!parsed) {
			return {
				intent: "chat",
				presentation: "text",
				confidence: 0,
				reason: "unparseable_response",
				origin,
			};
		}

		// Apply confidence threshold — below threshold defaults to chat
		const confidence = parsed.confidence ?? 0;
		if (confidence < confidenceThreshold && parsed.intent !== "chat") {
			return {
				intent: "chat",
				presentation: "text",
				confidence,
				reason: `below_threshold:${parsed.reason || "low_confidence"}`,
				origin,
			};
		}

		return {
			intent: parsed.intent,
			presentation: presentationForIntent(parsed.intent),
			confidence,
			reason: parsed.reason || "llm_classification",
			origin,
		};
	} catch {
		// D3 / D19: never throw — fallback to chat on any error
		return {
			intent: "chat",
			presentation: "text",
			confidence: 0,
			reason: "classifier_error",
			origin,
		};
	}
}

module.exports = {
	resolveRoutingDecision,
	resolveRoutingDecisionFastPath,
	// Exported for testing
	CLASSIFIER_SYSTEM_PROMPT,
	parseClassifierResponse,
	presentationForIntent,
};
