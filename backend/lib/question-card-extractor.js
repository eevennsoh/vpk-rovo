const { getNonEmptyString, getPositiveInteger } = require("./shared-utils");

const CLARIFICATION_SIGNAL_PATTERN =
	/\b(let me ask|few questions|some questions|clarify|scope (?:this|things)|before i (?:put together|build|draft)|before we (?:build|draft)|could you tell me|can you tell me|i need (?:more|actual) details|need (?:a few|some) (?:details|pieces of information)|need some information|few things|need to know|help me understand|tell me more about|i'll need|i just need)\b/i;
const INTERROGATIVE_PATTERN =
	/\b(what|which|when|where|who|why|how|do|does|can|should)\b/i;
const NUMBERED_QUESTION_PATTERN = /^\d+[\.)]\s*(.*)$/;
const BULLET_PATTERN = /^[-*\u2022]\s+(.+)$/;
const BOLD_HEADER_PATTERN = /^\*\*(.+?)\*\*\s*[:?]?\s*$/;
const HEADER_ONLY_PATTERN =
	/^(for example:?|example:?|for instance:?|could you tell me:?|please tell me:?)$/i;
const DEFAULT_MAX_QUESTIONS = 4;
const MIN_QUESTION_COUNT = 2;
const DEFAULT_MAX_ROUNDS = Number.MAX_SAFE_INTEGER;
const MAX_LABEL_LENGTH = 120;
const URL_ONLY_PATTERN = /^https?:\/\/\S+$/i;

function normalizeQuestionCardText(value) {
	if (typeof value !== "string") {
		return "";
	}

	return value
		.replace(/\*\*([^*\n]+)\*\*/g, "$1")
		.replace(/__([^_\n]+)__/g, "$1")
		.replace(/`([^`\n]+)`/g, "$1")
		.replace(/\[(.+?)\]\([^)]+\)/g, "$1")
		.replace(/\s+/g, " ")
		.trim();
}

function parseQuestionCardQuestionText(rawQuestionText) {
	const normalizedText = normalizeQuestionCardText(rawQuestionText);
	if (!normalizedText) {
		return null;
	}

	// Reject text that is just a URL (e.g. a Figma link)
	if (URL_ONLY_PATTERN.test(normalizedText)) {
		return null;
	}

	const questionMarkIndex = normalizedText.indexOf("?");
	if (questionMarkIndex !== -1) {
		let label = normalizedText.slice(0, questionMarkIndex + 1).trim();
		const description = normalizeQuestionCardText(
			normalizedText
				.slice(questionMarkIndex + 1)
				.replace(/^[\s\u2014\u2013:-]+/, "")
		);
		if (!label) {
			return null;
		}

		// Truncate overly long labels
		if (label.length > MAX_LABEL_LENGTH) {
			label = label.slice(0, MAX_LABEL_LENGTH - 1) + "\u2026";
		}

		return {
			label,
			description: description || undefined,
		};
	}

	if (!INTERROGATIVE_PATTERN.test(normalizedText)) {
		return null;
	}

	// Truncate overly long labels without a question mark
	if (normalizedText.length > MAX_LABEL_LENGTH) {
		return {
			label: normalizedText.slice(0, MAX_LABEL_LENGTH - 1) + "\u2026",
			description: undefined,
		};
	}

	return {
		label: normalizedText,
		description: undefined,
	};
}

function collectQuestionBlocks(rawText) {
	const lines = rawText.split(/\r?\n/);
	const questionBlocks = [];
	let activeQuestionParts = null;
	let sawNumberedQuestionMarker = false;
	let sawBoldHeaderQuestionMarker = false;
	let activeBoldHeaderParts = null;

	const flushActiveParts = () => {
		if (!activeQuestionParts || activeQuestionParts.length === 0) {
			activeQuestionParts = null;
			return;
		}

		questionBlocks.push(activeQuestionParts.join(" "));
		activeQuestionParts = null;
	};

	const flushBoldHeaderParts = () => {
		if (!activeBoldHeaderParts || activeBoldHeaderParts.length === 0) {
			activeBoldHeaderParts = null;
			return;
		}

		const combined = activeBoldHeaderParts.join(" ");
		if (combined.includes("?")) {
			sawBoldHeaderQuestionMarker = true;
			questionBlocks.push(combined);
		}
		activeBoldHeaderParts = null;
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			continue;
		}

		const numberedMatch = line.match(NUMBERED_QUESTION_PATTERN);
		if (numberedMatch) {
			sawNumberedQuestionMarker = true;
			flushActiveParts();
			flushBoldHeaderParts();
			const initialLine = getNonEmptyString(numberedMatch[1]);
			activeQuestionParts = initialLine ? [initialLine] : [];
			continue;
		}

		if (activeQuestionParts) {
			if (BULLET_PATTERN.test(line)) {
				continue;
			}

			if (activeQuestionParts.length === 0 && HEADER_ONLY_PATTERN.test(line)) {
				continue;
			}

			activeQuestionParts.push(line);
			continue;
		}

		const boldMatch = line.match(BOLD_HEADER_PATTERN);
		if (boldMatch) {
			flushBoldHeaderParts();
			activeBoldHeaderParts = [];
			continue;
		}

		if (activeBoldHeaderParts) {
			if (BULLET_PATTERN.test(line)) {
				continue;
			}
			activeBoldHeaderParts.push(line);
			continue;
		}

		const bulletMatch = line.match(BULLET_PATTERN);
		const candidateLine = getNonEmptyString(
			bulletMatch?.[1] ?? line
		);
		if (candidateLine && candidateLine.includes("?")) {
			questionBlocks.push(candidateLine);
		}
	}

	flushActiveParts();
	flushBoldHeaderParts();

	return {
		questionBlocks,
		sawNumberedQuestionMarker,
		sawBoldHeaderQuestionMarker,
	};
}

function extractQuestionCardDefinitionFromAssistantText(rawText, defaults = {}) {
	if (typeof rawText !== "string" || !rawText.trim()) {
		return null;
	}

	const normalizedText = rawText.trim();
	const hasClarificationSignal = CLARIFICATION_SIGNAL_PATTERN.test(normalizedText);
	const { questionBlocks, sawNumberedQuestionMarker, sawBoldHeaderQuestionMarker } = collectQuestionBlocks(
		normalizedText
	);
	const nonEmptyLines = normalizedText.split(/\r?\n/).filter(l => l.trim().length > 0);
	const questionRatio = nonEmptyLines.length > 0
		? questionBlocks.length / nonEmptyLines.length
		: 0;
	const hasEnoughInlineQuestions =
		questionBlocks.length >= MIN_QUESTION_COUNT && questionRatio >= 0.3;

	if (!hasClarificationSignal && !sawNumberedQuestionMarker && !sawBoldHeaderQuestionMarker && !hasEnoughInlineQuestions) {
		return null;
	}

	const seenLabels = new Set();
	const parsedQuestions = questionBlocks
		.map((questionBlock) => parseQuestionCardQuestionText(questionBlock))
		.filter((question) => question && question.label.includes("?"))
		.filter((question) => {
			const normalizedLabel = question.label.toLowerCase();
			if (seenLabels.has(normalizedLabel)) {
				return false;
			}
			seenLabels.add(normalizedLabel);
			return true;
		})
		.slice(0, DEFAULT_MAX_QUESTIONS)
		.map((question, index) => ({
			id: `q-${index + 1}`,
			label: question.label,
			description: question.description,
			required: index < 2,
			kind: "single-select",
		}));

	if (parsedQuestions.length < MIN_QUESTION_COUNT) {
		return null;
	}

	return {
		type: "question-card",
		title: getNonEmptyString(defaults.title) || "Help me clarify what you need",
		description:
			getNonEmptyString(defaults.description) ||
			"Answer these questions so I can build a better plan.",
		questions: parsedQuestions,
	};
}

function resolveFallbackQuestionCardState({
	isPostClarificationTurn,
	clarificationSubmission,
	previousQuestionCard,
	fallbackSessionId,
	maxRounds = DEFAULT_MAX_ROUNDS,
}) {
	const resolvedMaxRounds = getPositiveInteger(maxRounds) || DEFAULT_MAX_ROUNDS;
	const previousRound =
		getPositiveInteger(clarificationSubmission?.round) ||
		getPositiveInteger(previousQuestionCard?.round) ||
		0;
	const round = isPostClarificationTurn
		? previousRound + 1
		: previousRound > 0
			? previousRound
			: 1;
	const sessionId =
		getNonEmptyString(clarificationSubmission?.sessionId) ||
		getNonEmptyString(previousQuestionCard?.sessionId) ||
		getNonEmptyString(fallbackSessionId) ||
		"clarification-fallback";

	return {
		sessionId,
		round,
		maxRounds: resolvedMaxRounds,
		canEmit: round <= resolvedMaxRounds,
	};
}

function looksLikeClarificationResponse(text) {
	if (typeof text !== "string" || !text.trim()) {
		return false;
	}
	const normalizedText = text.trim();
	const lines = normalizedText.split(/\r?\n/).filter(l => l.trim().length > 0);
	if (lines.length === 0) {
		return false;
	}
	const questionLines = lines.filter(l => l.includes("?"));
	if (CLARIFICATION_SIGNAL_PATTERN.test(normalizedText) && questionLines.length >= 1) {
		return true;
	}
	if (questionLines.length >= 2) {
		return questionLines.length / lines.length >= 0.3;
	}
	return false;
}

module.exports = {
	extractQuestionCardDefinitionFromAssistantText,
	resolveFallbackQuestionCardState,
	looksLikeClarificationResponse,
	normalizeQuestionCardText,
	parseQuestionCardQuestionText,
	MAX_LABEL_LENGTH,
};
