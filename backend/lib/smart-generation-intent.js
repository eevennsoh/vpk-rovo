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
};
