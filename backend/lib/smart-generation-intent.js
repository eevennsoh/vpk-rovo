const { getNonEmptyString } = require("./shared-utils");

const SMART_GENERATION_INTENTS = new Set(["normal", "genui", "audio", "image", "both"]);

const CLASSIFIER_SYSTEM_PROMPT = `You are an intent router for a chat assistant. Your only job is to detect media generation requests and assess complexity.

Classify the latest user request into exactly one intent:
- normal: regular conversation, Q&A, discussion, or any request that is NOT media generation
- audio: request to generate voice/audio narration, read aloud, spoken version, TTS, sound effect, or sound output
- image: request to generate/create/draw an image, illustration, photo, icon, logo, or visual asset

Also classify the complexity:
- simple: straightforward, single-step, low-risk request
- complex: large task, multi-file changes, risky operation, ambiguous requirements, or user explicitly asks to plan/design before coding

Rules:
- Choose audio when the user explicitly asks for sound, audio, voice narration, or TTS output.
- Choose image when the user explicitly asks to generate, create, or draw a visual asset (image, illustration, photo, icon, logo).
- Choose normal for everything else, including: UI generation, dashboards, data queries, tool-backed tasks, greetings, conversation, Q&A, and structured summaries.
- When in doubt, choose normal.
- Choose complex when the task is large, risky, spans many files, has ambiguity, or the user asks to plan first.
- When in doubt about complexity, choose simple.
- Ignore previous assistant capabilities; classify only user intent.

Return strict JSON only:
{"intent":"normal|audio|image","complexity":"simple|complex","confidence":0.0,"reason":"short reason"}`;

/**
 * Regex patterns for lightweight pre-classification of obvious media intents.
 * These run BEFORE the LLM classifier to avoid unnecessary round-trips for
 * clear-cut cases like "generate an image of..." or "create a sound of...".
 */
const IMAGE_PRE_PATTERNS = [
	/\b(?:generate|create|make|draw|design|produce|render)\b.*\b(?:image|picture|photo|illustration|icon|logo|artwork|portrait|poster|banner|thumbnail)\b/i,
	/\b(?:image|picture|photo|illustration|icon|logo|artwork|portrait|poster|banner|thumbnail)\b.*\b(?:of|for|showing|depicting|with)\b/i,
	/\b(?:generate|create|make|draw|design|produce|render)\b\s+(?:a|an|the|some|me)\s+\b\w+\s*(?:image|picture|photo|illustration|icon|logo)\b/i,
];

const AUDIO_PRE_PATTERNS = [
	/\b(?:generate|create|make|produce|render|synthesize)\b.*\b(?:sound|audio|voice|narration|speech|tts|sound\s*effect|sfx|music|tone|jingle)\b/i,
	/\b(?:sound|audio|voice|narration|speech|tts|sound\s*effect|sfx)\b.*\b(?:of|for|that|like)\b/i,
	/\b(?:read|speak|narrate|say)\b.*\b(?:aloud|out\s*loud|this|that|it)\b/i,
	/\b(?:text[\s-]*to[\s-]*speech|tts)\b/i,
];

/**
 * Negative patterns that indicate the user is NOT requesting media generation
 * even if media keywords appear (e.g., "find me an image", "what image format").
 */
const MEDIA_NEGATIVE_PATTERNS = [
	/\b(?:find|search|look\s*up|show\s*me|get|fetch|retrieve|download|upload|link|url|format|size|resolution|edit|crop|resize|compress)\b/i,
	/\b(?:what|how|why|where|when|which|explain|describe|tell\s*me\s*about)\b.*\b(?:image|picture|photo|sound|audio)\b/i,
];

/**
 * Lightweight regex/keyword pre-classification for obvious media intents.
 * Runs synchronously before the LLM classifier to skip the round-trip
 * for clear-cut media requests.
 *
 * @param {string} message - The user's latest message text.
 * @returns {{ intent: "audio" | "image" | null, confidence: number, reason: string }}
 *   Returns intent=null when pre-classification is inconclusive (fall through to LLM).
 */
function preClassifyMediaIntent(message) {
	const text = getNonEmptyString(message);
	if (!text) {
		return { intent: null, confidence: 0, reason: "empty-input" };
	}

	// Check negative patterns first — if the message looks like a query about
	// media rather than a generation request, skip pre-classification.
	for (const pattern of MEDIA_NEGATIVE_PATTERNS) {
		if (pattern.test(text)) {
			return { intent: null, confidence: 0, reason: "negative-pattern-match" };
		}
	}

	// Check image patterns.
	for (const pattern of IMAGE_PRE_PATTERNS) {
		if (pattern.test(text)) {
			return { intent: "image", confidence: 0.95, reason: "keyword-match-image" };
		}
	}

	// Check audio patterns.
	for (const pattern of AUDIO_PRE_PATTERNS) {
		if (pattern.test(text)) {
			return { intent: "audio", confidence: 0.95, reason: "keyword-match-audio" };
		}
	}

	return { intent: null, confidence: 0, reason: "no-keyword-match" };
}

function normalizeIntent(value) {
	const normalized = getNonEmptyString(value)?.toLowerCase();
	if (!normalized) {
		return "normal";
	}

	if (SMART_GENERATION_INTENTS.has(normalized)) {
		return normalized;
	}

	if (normalized.includes("both")) {
		return "both";
	}
	if (
		normalized.includes("genui") ||
		normalized.includes("ui") ||
		normalized.includes("dashboard") ||
		normalized.includes("widget") ||
		normalized.includes("chart")
	) {
		return "genui";
	}
	if (
		normalized.includes("image") ||
		normalized.includes("photo") ||
		normalized.includes("picture") ||
		normalized.includes("illustration") ||
		normalized.includes("logo")
	) {
		return "image";
	}
	if (
		normalized.includes("audio") ||
		normalized.includes("voice") ||
		normalized.includes("speech") ||
		normalized.includes("sound")
	) {
		return "audio";
	}
	return "normal";
}

function clampConfidence(value) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return null;
	}

	if (value < 0) {
		return 0;
	}
	if (value > 1) {
		return 1;
	}
	return value;
}

function parseJsonFromText(rawText) {
	const text = getNonEmptyString(rawText);
	if (!text) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		// Continue with fallback extraction.
	}

	const jsonMatch = text.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		return null;
	}

	try {
		return JSON.parse(jsonMatch[0]);
	} catch {
		return null;
	}
}

function normalizeComplexity(value) {
	const normalized = getNonEmptyString(value)?.toLowerCase();
	if (normalized === "complex") {
		return "complex";
	}
	return "simple";
}

function parseClassification(rawText) {
	const parsed = parseJsonFromText(rawText);
	if (parsed && typeof parsed === "object") {
		return {
			intent: normalizeIntent(parsed.intent),
			complexity: normalizeComplexity(parsed.complexity),
			confidence: clampConfidence(parsed.confidence),
			reason: getNonEmptyString(parsed.reason),
		};
	}

	return {
		intent: normalizeIntent(rawText),
		complexity: "simple",
		confidence: null,
		reason: null,
	};
}

function buildClassifierPrompt({ latestUserMessage, conversationHistory }) {
	const lastMessage = getNonEmptyString(latestUserMessage) || "";
	const historyLines = Array.isArray(conversationHistory)
		? conversationHistory
				.slice(-6)
				.map((message) => {
					const role = message?.type === "assistant" ? "Assistant" : "User";
					const content = getNonEmptyString(message?.content);
					if (!content) {
						return null;
					}
					return `${role}: ${content}`;
				})
				.filter(Boolean)
		: [];

	return [
		"Conversation context:",
		historyLines.length > 0 ? historyLines.join("\n") : "(none)",
		"",
		`Latest user request: ${lastMessage}`,
		"",
		"Return JSON only.",
	].join("\n");
}

function createClassifierTimeoutError() {
	const timeoutError = new Error("smart-generation-classifier-timeout");
	timeoutError.code = "SMART_GENERATION_CLASSIFIER_TIMEOUT";
	return timeoutError;
}

function withTimeout(operation, timeoutMs) {
	const effectiveTimeoutMs =
		typeof timeoutMs === "number" && Number.isFinite(timeoutMs) && timeoutMs > 0
			? timeoutMs
			: 800;

	return new Promise((resolve, reject) => {
		const abortController = new AbortController();
		let settled = false;

		const settle = (callback, value) => {
			if (settled) {
				return;
			}
			settled = true;
			clearTimeout(timer);
			callback(value);
		};

		const timer = setTimeout(() => {
			abortController.abort();
			settle(reject, createClassifierTimeoutError());
		}, effectiveTimeoutMs);

		Promise.resolve()
			.then(() => operation({ signal: abortController.signal }))
			.then((value) => {
				settle(resolve, value);
			})
			.catch((error) => {
				settle(reject, error);
			});
	});
}

async function classifySmartGenerationIntent({
	latestUserMessage,
	conversationHistory,
	classify,
	timeoutMs = 800,
} = {}) {
	const prompt = getNonEmptyString(latestUserMessage);
	if (!prompt || typeof classify !== "function") {
		return {
			intent: "normal",
			complexity: "simple",
			confidence: null,
			reason: "missing-input",
			rawOutput: null,
			error: null,
			timedOut: false,
		};
	}

	// Try lightweight pre-classification first to skip LLM round-trip.
	const preResult = preClassifyMediaIntent(prompt);
	if (preResult.intent) {
		return {
			intent: preResult.intent,
			complexity: "simple",
			confidence: preResult.confidence,
			reason: preResult.reason,
			rawOutput: null,
			error: null,
			timedOut: false,
		};
	}

	try {
		const rawOutput = await withTimeout(
			({ signal }) =>
				classify({
					system: CLASSIFIER_SYSTEM_PROMPT,
					prompt: buildClassifierPrompt({ latestUserMessage: prompt, conversationHistory }),
					signal,
				}),
			timeoutMs,
		);
		const parsed = parseClassification(rawOutput);
		return {
			intent: parsed.intent,
			complexity: parsed.complexity,
			confidence: parsed.confidence,
			reason: parsed.reason,
			rawOutput: getNonEmptyString(rawOutput),
			error: null,
			timedOut: false,
		};
	} catch (error) {
		const timedOut = error?.code === "SMART_GENERATION_CLASSIFIER_TIMEOUT";
		return {
			intent: "normal",
			complexity: "simple",
			confidence: null,
			reason: timedOut ? "timeout" : "classifier-error",
			rawOutput: null,
			error: error instanceof Error ? error.message : String(error),
			timedOut,
		};
	}
}

module.exports = {
	CLASSIFIER_SYSTEM_PROMPT,
	SMART_GENERATION_INTENTS,
	normalizeIntent,
	normalizeComplexity,
	parseClassification,
	buildClassifierPrompt,
	classifySmartGenerationIntent,
	preClassifyMediaIntent,
};
