const SMART_AUDIO_REQUEST_PATTERN =
	/\b(audio|voice|speech|tts|text[-\s]?to[-\s]?speech|narrate|read aloud)\b/i;
const EXPLICIT_LITERAL_CUE_PATTERN =
	/\b(?:exact|exactly|verbatim|literally|word[-\s]?for[-\s]?word|as[-\s]?written|this\s+exact)\b/i;
const DIRECT_SCRIPT_VERB_PATTERN = /\b(?:say|read|speak|narrate)\b/i;
const CONTEXTUAL_MEDIA_COMMAND_PATTERN =
	/\b(?:make|create|generate|produce|synthesize|render)\b[\s\S]{0,64}\b(?:audio|voice|speech|tts|voiceover|voice\s*clip|audio\s*clip)\b/i;
const CONTEXT_ARTIFACT_PATTERN =
	/\b(?:poem|story|article|summary|response|message|text|chat|conversation|lyrics|script)\b/i;
const {
	clipToMaxChars,
	normalizeSpeechPayload,
	resolveSpeechPayloadFromAudioRequest,
} = require("./audio-input-extractor");
const {
	buildAudioContextClarificationPayload,
	isContextReferentialAudioRequest,
	resolveReferencedAudioText,
} = require("./audio-context-resolution");

const { getNonEmptyString } = require("./shared-utils");

function countWords(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return 0;
	}

	return normalizedValue.split(/\s+/u).filter(Boolean).length;
}

function hasExplicitLiteralSpeechCue(prompt) {
	const text = getNonEmptyString(prompt);
	if (!text) {
		return false;
	}

	if (EXPLICIT_LITERAL_CUE_PATTERN.test(text)) {
		return true;
	}

	const hasDirectSpeechVerb = DIRECT_SCRIPT_VERB_PATTERN.test(text);
	if (!hasDirectSpeechVerb) {
		return false;
	}

	const hasArtifactReference = CONTEXT_ARTIFACT_PATTERN.test(text);
	const hasMediaGenerationCommand =
		CONTEXTUAL_MEDIA_COMMAND_PATTERN.test(text);
	return !hasArtifactReference && !hasMediaGenerationCommand;
}

function isLikelyStandaloneScript(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return false;
	}

	if (text.includes("\n")) {
		return true;
	}

	const wordCount = countWords(text);
	if (text.length >= 140 || wordCount >= 22) {
		return true;
	}

	const punctuationCount = (text.match(/[.!?]/gu) || []).length;
	return wordCount >= 10 && punctuationCount > 0;
}

function isLikelyTitleLikePayload(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return false;
	}

	if (text.includes("\n") || text.length > 90) {
		return false;
	}

	const wordCount = countWords(text);
	if (wordCount === 0 || wordCount > 10) {
		return false;
	}

	if (/[.!?]$/u.test(text) && wordCount > 4) {
		return false;
	}

	return true;
}

function shouldAttemptImplicitContextResolution({
	latestUserMessage,
	directUserInput,
	directUserInputMode,
}) {
	if (
		directUserInputMode !== "quoted" &&
		directUserInputMode !== "command-pattern" &&
		directUserInputMode !== "fallback-original"
	) {
		return false;
	}

	const prompt = getNonEmptyString(latestUserMessage);
	if (!prompt) {
		return false;
	}

	if (hasExplicitLiteralSpeechCue(prompt)) {
		return false;
	}

	if (!isLikelyTitleLikePayload(directUserInput)) {
		return false;
	}

	if (isLikelyStandaloneScript(directUserInput)) {
		return false;
	}

	return true;
}

function isAudioRequestPrompt(prompt) {
	const text = getNonEmptyString(prompt);
	if (!text) {
		return false;
	}

	return SMART_AUDIO_REQUEST_PATTERN.test(text);
}

const LEADING_FILLER_PATTERN =
	/^(?:(?:I'd be happy to|I would be happy to|I'd love to|Sure[,!]?\s*|Of course[,!]?\s*|Absolutely[,!]?\s*|Certainly[,!]?\s*|Great[,!]?\s*|Here(?:'s| is| are)\s)[\s\S]{0,80}?(?:[:!]\s*(?:---\s*)?|[.]\s+))/i;
const TRAILING_FILLER_PATTERN =
	/(?:\s*---\s*)?(?:(?:Would you like me to|Let me know if|Feel free to|I (?:can|could) also|Hope (?:you enjoy|this helps|that helps))[\s\S]{0,120}[.!?]?\s*)$/i;
const MARKDOWN_SEPARATOR_BOUNDARY_PATTERN = /(?:^\s*---\s*|\s*---\s*$)/g;

function stripConversationalFiller(value) {
	const text = getNonEmptyString(value);
	if (!text) {
		return value;
	}

	let stripped = text;
	// Apply leading filler removal iteratively (handles chained fillers like
	// "I'd be happy to help! Here's one for you: ...")
	let prev;
	do {
		prev = stripped;
		stripped = stripped.replace(LEADING_FILLER_PATTERN, "").trim();
	} while (stripped !== prev && stripped.length > 0);

	stripped = stripped
		.replace(TRAILING_FILLER_PATTERN, "")
		.replace(MARKDOWN_SEPARATOR_BOUNDARY_PATTERN, "")
		.trim();

	return stripped.length > 0 ? stripped : text;
}

function toSpeechInputText(value, { maxChars = 4000 } = {}) {
	const text = normalizeSpeechPayload(value);
	if (!text) {
		return null;
	}

	const stripped = stripConversationalFiller(text);
	return clipToMaxChars(stripped, maxChars);
}

function resolveSmartAudioVoiceInput({
	intent,
	latestUserMessage,
	latestVisibleUserMessage,
	messages,
	generatedNarrative,
	explicitScript,
	maxChars = 4000,
	contextWindowSize = 16,
	contextConfidenceThreshold = 0.72,
	contextAmbiguityThreshold = 0.08,
} = {}) {
	const normalizedIntent = getNonEmptyString(intent)?.toLowerCase() || "audio";
	const contextReferenceSeedMessage =
		getNonEmptyString(latestVisibleUserMessage) || latestUserMessage;
	const {
		payload: directUserInput,
		mode: directUserInputMode,
	} = resolveSpeechPayloadFromAudioRequest(contextReferenceSeedMessage, {
		maxChars,
	});
	const explicitScriptInput = toSpeechInputText(explicitScript, { maxChars });
	const generatedNarrativeInput = toSpeechInputText(generatedNarrative, { maxChars });
	const directUserSource =
		directUserInputMode && directUserInputMode !== "fallback-original"
			? "extracted-user-payload"
			: "direct-user";

	if (explicitScriptInput) {
		return {
			voiceInput: explicitScriptInput,
			source: "explicit-script",
			resolutionType: "explicit-script",
			needsClarification: false,
			clarificationPayload: null,
			confidence: 1,
			candidateCount: 1,
		};
	}

	if (normalizedIntent === "audio" || normalizedIntent === "both") {
		const requestLooksReferential =
			isContextReferentialAudioRequest(contextReferenceSeedMessage) ||
			(directUserInputMode !== "quoted" &&
				isContextReferentialAudioRequest(directUserInput));
		const requestLooksImplicitlyReferential =
			!requestLooksReferential &&
			shouldAttemptImplicitContextResolution({
				latestUserMessage: contextReferenceSeedMessage,
				directUserInput,
				directUserInputMode,
			});
		const shouldAttemptContextResolution =
			typeof contextReferenceSeedMessage === "string" &&
			(requestLooksReferential || requestLooksImplicitlyReferential);
		if (shouldAttemptContextResolution) {
			const contextResolution = resolveReferencedAudioText({
				latestUserMessage: contextReferenceSeedMessage,
				messages,
				maxChars,
				windowSize: contextWindowSize,
				confidenceThreshold: contextConfidenceThreshold,
				ambiguityThreshold: contextAmbiguityThreshold,
				allowImplicitReference: requestLooksImplicitlyReferential,
			});

			if (contextResolution.status === "resolved" && contextResolution.voiceInput) {
				return {
					voiceInput: contextResolution.voiceInput,
					source: "context-reference",
					resolutionType: "context-reference",
					needsClarification: false,
					clarificationPayload: null,
					confidence: contextResolution.confidence,
					candidateCount: contextResolution.candidateCount,
				};
			}

			if (
				contextResolution.referential &&
				(contextResolution.status === "ambiguous" ||
					(requestLooksReferential &&
						contextResolution.status === "not-found"))
			) {
				return {
					voiceInput: null,
					source: null,
					resolutionType: "context-reference",
					needsClarification: true,
					clarificationPayload: buildAudioContextClarificationPayload({
						latestUserMessage: contextReferenceSeedMessage,
						candidates: contextResolution.candidates,
					}),
					confidence: contextResolution.confidence || 0,
					candidateCount: contextResolution.candidateCount || 0,
				};
			}
		}

		if (directUserInput) {
			return {
				voiceInput: directUserInput,
				source: directUserSource,
				resolutionType: "direct-user",
				extractionMode: directUserInputMode,
				needsClarification: false,
				clarificationPayload: null,
				confidence: 1,
				candidateCount: 1,
			};
		}
		if (generatedNarrativeInput) {
			return {
				voiceInput: generatedNarrativeInput,
				source: "generated-narrative",
				resolutionType: "generated-narrative",
				needsClarification: false,
				clarificationPayload: null,
				confidence: 1,
				candidateCount: 1,
			};
		}
		return {
			voiceInput: null,
			source: null,
			resolutionType: null,
			needsClarification: false,
			clarificationPayload: null,
			confidence: 0,
			candidateCount: 0,
		};
	}

	if (generatedNarrativeInput) {
		return {
			voiceInput: generatedNarrativeInput,
			source: "generated-narrative",
			resolutionType: "generated-narrative",
			needsClarification: false,
			clarificationPayload: null,
			confidence: 1,
			candidateCount: 1,
		};
	}

	if (directUserInput) {
		return {
			voiceInput: directUserInput,
			source: directUserSource,
			resolutionType: "direct-user",
			extractionMode: directUserInputMode,
			needsClarification: false,
			clarificationPayload: null,
			confidence: 1,
			candidateCount: 1,
		};
	}

	return {
		voiceInput: null,
		source: null,
		resolutionType: null,
		needsClarification: false,
		clarificationPayload: null,
		confidence: 0,
		candidateCount: 0,
	};
}

// ─── Voice intent classification (realtime live voice mode) ───────────────────

const VOICE_INTENT = {
	CHAT: "CHAT",
	NEW_TASK: "NEW_TASK",
	STEER: "STEER",
};

const VOICE_INTENT_CLASSIFIER_SYSTEM = `You classify user voice utterances into exactly one intent.

Respond with a JSON object: { "intent": "<INTENT>" }

Intents:
- CHAT — casual conversation, greetings, questions about general knowledge, small talk, or anything that does NOT request the AI to build, create, generate, modify, update, fix, or change a software artifact or work product.
- NEW_TASK — the user is requesting the AI to build, create, generate, design, plan, write, make, or produce something actionable (a component, dashboard, page, feature, artifact, code, document, etc.).
- STEER — the user wants to amend, modify, redirect, or change something that is CURRENTLY being generated. This ONLY applies when generation is in progress. If nothing is being generated, classify as NEW_TASK instead.

Rules:
- If the user says something like "make it darker", "add a chart", "change the color" while generation is in progress, that is STEER.
- If the user says "build me a dashboard", "create a login page", "make a kanban board", that is NEW_TASK.
- If the user says "hello", "what time is it?", "tell me a joke", "thanks", that is CHAT.
- When in doubt between CHAT and NEW_TASK, prefer NEW_TASK for anything that sounds like a work request.
- When in doubt between NEW_TASK and STEER, prefer STEER only if generation is currently in progress AND the utterance clearly references or modifies the current work.`;

function buildVoiceIntentClassifierPrompt({
	transcript,
	isGenerating,
	currentGenerationContext,
	recentThreadSummary,
}) {
	const parts = [];

	parts.push(`User utterance: "${transcript}"`);
	parts.push(`Generation in progress: ${isGenerating ? "YES" : "NO"}`);

	if (isGenerating && currentGenerationContext) {
		parts.push(`Currently generating: ${currentGenerationContext}`);
	}

	if (recentThreadSummary) {
		parts.push(`Recent thread context: ${recentThreadSummary}`);
	}

	parts.push("");
	parts.push("Classify the intent. Respond with JSON only: { \"intent\": \"CHAT\" | \"NEW_TASK\" | \"STEER\" }");

	return parts.join("\n");
}

function parseVoiceIntentResult(text) {
	const trimmed = (text || "").trim();

	// Try to parse JSON directly
	try {
		const parsed = JSON.parse(trimmed);
		if (parsed && typeof parsed.intent === "string") {
			const intent = parsed.intent.toUpperCase();
			if (intent in VOICE_INTENT) {
				return { intent };
			}
		}
	} catch {
		// Fall through to regex extraction
	}

	// Extract from markdown code blocks or partial JSON
	const jsonMatch = trimmed.match(/\{[^}]*"intent"\s*:\s*"([^"]+)"[^}]*\}/);
	if (jsonMatch && jsonMatch[1]) {
		const intent = jsonMatch[1].toUpperCase();
		if (intent in VOICE_INTENT) {
			return { intent };
		}
	}

	// Last resort: look for bare intent keywords
	const upperText = trimmed.toUpperCase();
	if (upperText.includes("STEER")) {
		return { intent: VOICE_INTENT.STEER };
	}
	if (upperText.includes("NEW_TASK")) {
		return { intent: VOICE_INTENT.NEW_TASK };
	}

	// Default to CHAT for safety (no action taken)
	return { intent: VOICE_INTENT.CHAT };
}

/**
 * Classify a voice utterance into CHAT, NEW_TASK, or STEER.
 *
 * @param {object} params
 * @param {string} params.transcript — the user's speech transcript
 * @param {boolean} params.isGenerating — whether Rovo is currently generating
 * @param {string} [params.currentGenerationContext] — what's being generated
 * @param {string} [params.recentThreadSummary] — recent thread messages
 * @param {Function} params.generateText — LLM text generation function
 * @param {AbortSignal} [params.signal] — abort signal
 * @returns {Promise<{ intent: "CHAT" | "NEW_TASK" | "STEER" }>}
 */
async function classifyVoiceIntent({
	transcript,
	isGenerating = false,
	currentGenerationContext,
	recentThreadSummary,
	generateText,
	signal,
}) {
	if (!transcript || typeof transcript !== "string" || !transcript.trim()) {
		return { intent: VOICE_INTENT.CHAT };
	}

	const prompt = buildVoiceIntentClassifierPrompt({
		transcript,
		isGenerating,
		currentGenerationContext,
		recentThreadSummary,
	});

	try {
		const text = await generateText({
			system: VOICE_INTENT_CLASSIFIER_SYSTEM,
			prompt,
			maxOutputTokens: 50,
			temperature: 0.1,
			signal,
		});

		return parseVoiceIntentResult(text);
	} catch (err) {
		console.warn("[classifyVoiceIntent] Classification failed, defaulting to CHAT:", err?.message);
		return { intent: VOICE_INTENT.CHAT };
	}
}

module.exports = {
	isAudioRequestPrompt,
	resolveSmartAudioVoiceInput,
	stripConversationalFiller,
	toSpeechInputText,
	classifyVoiceIntent,
	parseVoiceIntentResult,
	VOICE_INTENT,
};
