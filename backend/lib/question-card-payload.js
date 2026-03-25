const { getNonEmptyString, getPositiveInteger } = require("./shared-utils");

const DEFAULT_WIDGET_TYPE = "question-card";
const DEFAULT_MAX_ROUNDS = Number.MAX_SAFE_INTEGER;
const DEFAULT_MAX_PRESET_OPTIONS = 4;
const DEFAULT_CUSTOM_OPTION_PLACEHOLDER = "Tell Rovo what to do...";

const QUESTION_CARD_KINDS = new Set([
	"single-select",
	"multi-select",
	"text",
]);
const REQUEST_USER_INPUT_OPTION_KEYS = [
	"options",
	"choices",
	"answer_options",
	"answerOptions",
	"answer_choices",
	"answerChoices",
	"suggested_answers",
	"suggestedAnswers",
];

function normalizeQuestionKind(value) {
	if (typeof value !== "string") {
		return "single-select";
	}

	const normalizedValue = value.trim().toLowerCase();
	return QUESTION_CARD_KINDS.has(normalizedValue)
		? normalizedValue
		: "single-select";
}

function normalizeQuestionOptions(value, maxPresetOptions = DEFAULT_MAX_PRESET_OPTIONS) {
	if (!Array.isArray(value)) {
		return [];
	}

	const seenOptionIds = new Set();
	const seenOptionLabels = new Set();
	return value
		.map((option, index) => {
			if (!option || typeof option !== "object") {
				return null;
			}

			const label =
				getNonEmptyString(option.label) ||
				getNonEmptyString(option.title) ||
				getNonEmptyString(option.text);
			if (!label) {
				return null;
			}

			const optionId = getNonEmptyString(option.id) || `option-${index + 1}`;
			const normalizedLabel = label.toLowerCase();
			if (seenOptionIds.has(optionId) || seenOptionLabels.has(normalizedLabel)) {
				return null;
			}

			seenOptionIds.add(optionId);
			seenOptionLabels.add(normalizedLabel);
			return {
				id: optionId,
				label,
				description: getNonEmptyString(option.description) || undefined,
				recommended: Boolean(option.recommended),
			};
		})
		.filter(Boolean)
		.slice(0, maxPresetOptions);
}

function createFallbackQuestionOptions() {
	return [];
}

function createQuestionCardSessionId() {
	return `clarification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getUniqueQuestionId(baseId, seenQuestionIds) {
	let uniqueQuestionId = baseId;
	let duplicateIndex = 2;
	while (seenQuestionIds.has(uniqueQuestionId)) {
		uniqueQuestionId = `${baseId}-${duplicateIndex}`;
		duplicateIndex += 1;
	}

	seenQuestionIds.add(uniqueQuestionId);
	return uniqueQuestionId;
}

function sanitizeQuestionCardPayload(payload, defaults = {}) {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const widgetType =
		getNonEmptyString(defaults.widgetType) || DEFAULT_WIDGET_TYPE;
	const maxRounds =
		getPositiveInteger(defaults.maxRounds) || DEFAULT_MAX_ROUNDS;
	const maxPresetOptions =
		getPositiveInteger(defaults.maxPresetOptions) ||
		DEFAULT_MAX_PRESET_OPTIONS;
	const customOptionPlaceholder =
		getNonEmptyString(defaults.customOptionPlaceholder) ||
		DEFAULT_CUSTOM_OPTION_PLACEHOLDER;
	const createSessionId =
		typeof defaults.createSessionId === "function"
			? defaults.createSessionId
			: createQuestionCardSessionId;

	const record = payload.payload && typeof payload.payload === "object"
		? payload.payload
		: payload;
	const recordType = getNonEmptyString(record.type);
	if (recordType && recordType !== widgetType) {
		return null;
	}

	const questionsValue = Array.isArray(record.questions)
		? record.questions
		: Array.isArray(record.items)
			? record.items
			: null;
	if (!questionsValue || questionsValue.length === 0) {
		return null;
	}

	const maxLabelLength =
		getPositiveInteger(defaults.maxLabelLength) || 120;
	const seenQuestionIds = new Set();
	const seenLabels = new Set();
	const questions = questionsValue
		.map((question, index) => {
			if (!question || typeof question !== "object") {
				return null;
			}

			const label =
				getNonEmptyString(question.label) ||
				getNonEmptyString(question.title) ||
				getNonEmptyString(question.question) ||
				getNonEmptyString(question.text);
			if (!label) {
				return null;
			}

			const truncatedLabel = label.length > maxLabelLength
				? label.slice(0, maxLabelLength - 1) + "\u2026"
				: label;
			const normalizedLabel = truncatedLabel.toLowerCase();
			if (seenLabels.has(normalizedLabel)) {
				return null;
			}
			seenLabels.add(normalizedLabel);

			const parsedOptions = normalizeQuestionOptions(
				question.options,
				maxPresetOptions
			);
			const options =
				parsedOptions.length > 0
					? parsedOptions
					: createFallbackQuestionOptions();
			const baseQuestionId =
				getNonEmptyString(question.id) || `q-${index + 1}`;
			const questionId = getUniqueQuestionId(
				baseQuestionId,
				seenQuestionIds
			);

			return {
				id: questionId,
				label: truncatedLabel,
				description: getNonEmptyString(question.description) || undefined,
				required: question.required !== false,
				kind: normalizeQuestionKind(question.kind),
				options,
				placeholder:
					getNonEmptyString(question.placeholder) ||
					customOptionPlaceholder,
			};
		})
		.filter(Boolean);

	if (questions.length === 0) {
		return null;
	}

	return {
		type: widgetType,
		sessionId:
			getNonEmptyString(record.sessionId) ||
			defaults.sessionId ||
			createSessionId(),
		round:
			getPositiveInteger(record.round) ||
			defaults.round ||
			1,
		maxRounds:
			getPositiveInteger(record.maxRounds) ||
			defaults.maxRounds ||
			maxRounds,
		title:
			getNonEmptyString(record.title) ||
			defaults.title ||
			"Help me clarify what you need",
		description:
			getNonEmptyString(record.description) ||
			defaults.description ||
			undefined,
		directive:
			getNonEmptyString(record.directive) ||
			defaults.directive ||
			undefined,
		requiredCount: questions.filter((question) => question.required).length,
		questions,
	};
}

function parseJsonFromText(rawText) {
	if (typeof rawText !== "string") {
		return null;
	}

	try {
		return JSON.parse(rawText);
	} catch {
		const objectMatch = rawText.match(/\{[\s\S]*\}/);
		if (!objectMatch) {
			return null;
		}

		try {
			return JSON.parse(objectMatch[0]);
		} catch {
			return null;
		}
	}
}

function parseObjectFromUnknown(value) {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		return value;
	}

	if (typeof value !== "string") {
		return null;
	}

	const parsedValue = parseJsonFromText(value);
	if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
		return null;
	}

	return parsedValue;
}

function findRequestUserInputQuestionContainer(value) {
	if (Array.isArray(value) && value.length > 0) {
		return {
			container: {},
			questions: value,
		};
	}

	const rootRecord = parseObjectFromUnknown(value);
	if (!rootRecord) {
		return null;
	}

	const queue = [rootRecord];
	const seenRecords = new Set();
	const nestedKeys = [
		"input",
		"arguments",
		"params",
		"payload",
		"output",
		"result",
		"content",
		"data",
		"value",
		"request",
		"toolInput",
		"tool_input",
	];

	while (queue.length > 0) {
		const candidate = queue.shift();
		if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
			continue;
		}

		if (seenRecords.has(candidate)) {
			continue;
		}
		seenRecords.add(candidate);

		const questionItems = Array.isArray(candidate.questions)
			? candidate.questions
			: Array.isArray(candidate.items)
				? candidate.items
				: null;
		if (questionItems && questionItems.length > 0) {
			return {
				container: candidate,
				questions: questionItems,
			};
		}

		for (const key of nestedKeys) {
			const nestedRecord = parseObjectFromUnknown(candidate[key]);
			if (nestedRecord) {
				queue.push(nestedRecord);
			}
		}
	}

	return null;
}

/**
 * Returns true if the option label is a self-referential meta-option
 * that points the user to the free-text input rather than providing
 * a concrete pre-composed answer (e.g. "I'll describe it now").
 *
 * Does NOT match options with a concrete noun object like
 * "I'll type the attendees" or "I'll type the channel".
 */
function isSelfReferentialFreeTextOption(label) {
	if (typeof label !== "string") return false;
	const s = label.trim().toLowerCase();
	if (s.length === 0) return false;
	// Direct mention of the free-text / input field
	if (/\bfree[- ]?text\b/.test(s)) return true;
	if (/\b(?:text|input)\s*(?:box|field|area)\b/.test(s)) return true;
	// "I'll describe it…" / "I'll type it…" without a concrete noun object
	if (/\b(?:i[''\u2019]ll|i will|let me)\s+(?:describe|type|write|provide|enter|explain|specify)\s+(?:it|that|this)\b/.test(s)) return true;
	// "Describe it myself" / "Type it out" (imperative form)
	if (/^(?:describe|type|write)\s+(?:it|that|this)\b/.test(s)) return true;
	return false;
}

function normalizeRequestUserInputOptions(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((option, index) => {
			if (typeof option === "string") {
				const label = getNonEmptyString(option);
				return label ? { id: `option-${index + 1}`, label } : null;
			}

			if (!option || typeof option !== "object") {
				return null;
			}

			const label =
				getNonEmptyString(option.label) ||
				getNonEmptyString(option.title) ||
				getNonEmptyString(option.text) ||
				getNonEmptyString(option.value) ||
				getNonEmptyString(option.name);
			if (!label) {
				return null;
			}

			const isRecommendedByLabel = /\(recommended\)$/i.test(label);
			const normalizedLabel = label.replace(/\s*\(recommended\)$/i, "").trim();
			return {
				id: getNonEmptyString(option.id) || `option-${index + 1}`,
				label: normalizedLabel,
				description: getNonEmptyString(option.description) || undefined,
				recommended: Boolean(option.recommended) || isRecommendedByLabel,
			};
		})
		.filter(Boolean)
		.filter((option) => !isSelfReferentialFreeTextOption(option.label));
}

function getQuestionOptionSource(question) {
	if (!question || typeof question !== "object") {
		return [];
	}

	for (const key of REQUEST_USER_INPUT_OPTION_KEYS) {
		if (Array.isArray(question[key])) {
			return question[key];
		}
	}

	return [];
}

function normalizeRequestUserInputQuestions(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((question, index) => {
			if (typeof question === "string") {
				const label = getNonEmptyString(question);
				if (!label) {
					return null;
				}

				return {
					id: `q-${index + 1}`,
					label,
					required: true,
					kind: "single-select",
					options: [],
				};
			}

			if (!question || typeof question !== "object") {
				return null;
			}

			const label =
				getNonEmptyString(question.question) ||
				getNonEmptyString(question.label) ||
				getNonEmptyString(question.title) ||
				getNonEmptyString(question.text);
			if (!label) {
				return null;
			}

			return {
				id: getNonEmptyString(question.id) || `q-${index + 1}`,
				label,
				description: getNonEmptyString(question.description) || undefined,
				required: question.required !== false,
				kind: normalizeQuestionKind(question.kind),
				options: normalizeRequestUserInputOptions(
					getQuestionOptionSource(question)
				),
			};
		})
		.filter(Boolean);
}

function buildQuestionCardPayloadFromRequestUserInput(input, defaults = {}) {
	const resolvedRequest = findRequestUserInputQuestionContainer(input);
	if (!resolvedRequest) {
		return null;
	}

	const normalizedQuestions = normalizeRequestUserInputQuestions(
		resolvedRequest.questions
	);
	if (normalizedQuestions.length === 0) {
		return null;
	}

	return sanitizeQuestionCardPayload(
		{
			type: defaults.widgetType || DEFAULT_WIDGET_TYPE,
			title:
				getNonEmptyString(resolvedRequest.container.title) ||
				getNonEmptyString(resolvedRequest.container.prompt) ||
				defaults.title,
			description:
				getNonEmptyString(resolvedRequest.container.description) ||
				defaults.description,
			questions: normalizedQuestions,
		},
		defaults
	);
}

module.exports = {
	DEFAULT_WIDGET_TYPE,
	DEFAULT_MAX_ROUNDS,
	DEFAULT_MAX_PRESET_OPTIONS,
	DEFAULT_CUSTOM_OPTION_PLACEHOLDER,
	QUESTION_CARD_KINDS,
	normalizeQuestionKind,
	sanitizeQuestionCardPayload,
	buildQuestionCardPayloadFromRequestUserInput,
	normalizeRequestUserInputQuestions,
	normalizeRequestUserInputOptions,
	isSelfReferentialFreeTextOption,
	findRequestUserInputQuestionContainer,
};
