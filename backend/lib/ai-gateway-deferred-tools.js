const {
	buildQuestionCardPayloadFromRequestUserInput,
} = require("./question-card-payload");
const { getNonEmptyString, isObjectRecord } = require("./shared-utils");

const DEFERRED_TOOL_FENCE_PATTERN =
	/```([A-Za-z0-9_-]+)?[^\S\r\n]*(?:\r?\n)([\s\S]*?)(?:\r?\n)```/g;
const SUPPORTED_DEFERRED_TOOLS = new Set([
	"ask_user_questions",
	"exit_plan_mode",
]);
const DEFERRED_TOOL_FENCE_LANGUAGES = new Set([
	"deferred-tool",
	"deferred-tools",
	"tool-call",
	"tool",
	"json",
]);
const TOOL_NAME_KEYS = ["tool_name", "toolName", "name"];
const TOOL_INPUT_KEYS = ["input", "arguments", "args", "parameters", "payload"];

function normalizeDeferredToolName(value) {
	const normalizedValue = getNonEmptyString(value)?.toLowerCase();
	if (!normalizedValue) {
		return null;
	}

	const toolName = normalizedValue.split(".").pop();
	return SUPPORTED_DEFERRED_TOOLS.has(toolName) ? toolName : null;
}

function parseJsonObject(value) {
	const text = getNonEmptyString(value);
	if (!text || (text[0] !== "{" && text[0] !== "[")) {
		return null;
	}

	try {
		return JSON.parse(text);
	} catch {
		return null;
	}
}

function getDeferredToolEnvelopeRecord(value) {
	if (Array.isArray(value)) {
		return value.find((entry) => isObjectRecord(entry)) || null;
	}

	if (!isObjectRecord(value)) {
		return null;
	}

	return value;
}

function normalizeDeferredToolEnvelope(value) {
	const record = getDeferredToolEnvelopeRecord(value);
	if (!record) {
		return null;
	}

	let toolName = null;
	for (const key of TOOL_NAME_KEYS) {
		toolName = normalizeDeferredToolName(record[key]);
		if (toolName) {
			break;
		}
	}
	if (!toolName) {
		return null;
	}

	let input = null;
	for (const key of TOOL_INPUT_KEYS) {
		if (record[key] !== undefined) {
			input = record[key];
			break;
		}
	}

	return {
		toolName,
		input: input ?? {},
	};
}

function getFencedDeferredToolCandidates(text) {
	const candidates = [];
	DEFERRED_TOOL_FENCE_PATTERN.lastIndex = 0;

	let match;
	while ((match = DEFERRED_TOOL_FENCE_PATTERN.exec(text)) !== null) {
		const language = getNonEmptyString(match[1])?.toLowerCase() || "";
		if (!DEFERRED_TOOL_FENCE_LANGUAGES.has(language)) {
			continue;
		}

		const parsed = parseJsonObject(match[2]);
		const envelope = parsed ? normalizeDeferredToolEnvelope(parsed) : null;
		if (!envelope) {
			continue;
		}

		candidates.push({
			envelope,
			start: match.index,
			end: match.index + match[0].length,
		});
	}

	return candidates;
}

function stripRanges(text, ranges) {
	if (ranges.length === 0) {
		return text.trim();
	}

	let cleanedText = "";
	let previousEnd = 0;
	for (const range of ranges) {
		cleanedText += text.slice(previousEnd, range.start);
		previousEnd = range.end;
	}
	cleanedText += text.slice(previousEnd);

	return cleanedText.replace(/\n{3,}/g, "\n\n").trim();
}

function extractAIGatewayDeferredToolFromAssistantText(text) {
	if (typeof text !== "string" || text.trim().length === 0) {
		return null;
	}

	const trimmedText = text.trim();
	const wholeJsonEnvelope = normalizeDeferredToolEnvelope(
		parseJsonObject(trimmedText),
	);
	if (wholeJsonEnvelope) {
		return {
			toolCall: wholeJsonEnvelope,
			cleanedText: "",
			duplicateCount: 0,
		};
	}

	const candidates = getFencedDeferredToolCandidates(text);
	if (candidates.length === 0) {
		return null;
	}

	return {
		toolCall: candidates[0].envelope,
		cleanedText: stripRanges(text, candidates),
		duplicateCount: Math.max(0, candidates.length - 1),
	};
}

function normalizeAIGatewayQuestionOption(option, index) {
	if (typeof option === "string") {
		const label = getNonEmptyString(option);
		return label ? { id: `option-${index + 1}`, label } : null;
	}

	if (!isObjectRecord(option)) {
		return null;
	}

	const label =
		getNonEmptyString(option.label) ||
		getNonEmptyString(option.text) ||
		getNonEmptyString(option.value) ||
		getNonEmptyString(option.title);
	if (!label) {
		return null;
	}

	return {
		id: getNonEmptyString(option.id) || `option-${index + 1}`,
		label,
		description: getNonEmptyString(option.description) || undefined,
	};
}

function normalizeAIGatewayQuestion(question, index) {
	if (!isObjectRecord(question)) {
		return null;
	}

	const questionText =
		getNonEmptyString(question.question) ||
		getNonEmptyString(question.label) ||
		getNonEmptyString(question.text);
	if (!questionText) {
		return null;
	}

	const header = getNonEmptyString(question.header);
	const description =
		getNonEmptyString(question.description) ||
		(header && header !== questionText ? header : null);
	const options = Array.isArray(question.options)
		? question.options
			.map((option, optionIndex) =>
				normalizeAIGatewayQuestionOption(option, optionIndex)
			)
			.filter(Boolean)
		: [];

	return {
		id: getNonEmptyString(question.id) || `q-${index + 1}`,
		question: questionText,
		description: description || undefined,
		kind: options.length > 0 ? "single-select" : "text",
		options,
	};
}

function normalizeAIGatewayAskUserQuestionsInput(input) {
	const questions = Array.isArray(input)
		? input
		: isObjectRecord(input) && Array.isArray(input.questions)
			? input.questions
			: null;

	if (!questions || questions.length === 0) {
		return null;
	}

	const normalizedQuestions = questions
		.map((question, index) => normalizeAIGatewayQuestion(question, index))
		.filter(Boolean);
	if (normalizedQuestions.length === 0) {
		return null;
	}

	return {
		title:
			isObjectRecord(input)
				? getNonEmptyString(input.title) ||
					getNonEmptyString(input.header) ||
					undefined
				: undefined,
		description:
			isObjectRecord(input)
				? getNonEmptyString(input.description) || undefined
				: undefined,
		questions: normalizedQuestions,
	};
}

function buildQuestionCardPayloadFromAIGatewayDeferredTool(input, defaults = {}) {
	const normalizedInput = normalizeAIGatewayAskUserQuestionsInput(input);
	if (!normalizedInput) {
		return null;
	}

	return buildQuestionCardPayloadFromRequestUserInput(
		normalizedInput,
		defaults,
	);
}

function normalizePlanTask(task, index) {
	if (typeof task === "string") {
		const label = getNonEmptyString(task);
		return label ? { id: `task-${index + 1}`, label, blockedBy: [] } : null;
	}

	if (!isObjectRecord(task)) {
		return null;
	}

	const label =
		getNonEmptyString(task.label) ||
		getNonEmptyString(task.title) ||
		getNonEmptyString(task.task) ||
		getNonEmptyString(task.text);
	if (!label) {
		return null;
	}

	return {
		id: getNonEmptyString(task.id) || `task-${index + 1}`,
		label,
		blockedBy: Array.isArray(task.blockedBy)
			? task.blockedBy
				.map((entry) => getNonEmptyString(entry))
				.filter(Boolean)
			: [],
		agent: getNonEmptyString(task.agent) || undefined,
	};
}

function buildPlanWidgetPayloadFromAIGatewayDeferredTool(input, options = {}) {
	const record = isObjectRecord(input) ? input : null;
	const markdown = record
		? getNonEmptyString(record.plan) ||
			getNonEmptyString(record.markdown) ||
			getNonEmptyString(record.content)
		: getNonEmptyString(input);
	if (!markdown) {
		return null;
	}

	const taskCandidates = record
		? Array.isArray(record.tasks)
			? record.tasks
			: Array.isArray(record.steps)
				? record.steps
				: []
		: [];
	const tasks = taskCandidates
		.map((task, index) => normalizePlanTask(task, index))
		.filter(Boolean);
	const agents = tasks
		.map((task) => getNonEmptyString(task.agent))
		.filter(Boolean);

	return {
		title:
			(record
				? getNonEmptyString(record.title) ||
					getNonEmptyString(record.name) ||
					getNonEmptyString(record.planTitle)
				: null) || "Plan",
		description:
			record
				? getNonEmptyString(record.description) ||
					getNonEmptyString(record.summary) ||
					getNonEmptyString(record.subtitle) ||
					undefined
				: undefined,
		shortDescription:
			record
				? getNonEmptyString(record.shortDescription) ||
					getNonEmptyString(record.short_description) ||
					undefined
				: undefined,
		markdown,
		tasks,
		agents: [...new Set(agents)].sort(),
		deferredToolCallId: getNonEmptyString(options.toolCallId) || undefined,
	};
}

function buildQuestionMetaFromQuestionCardPayload(payload) {
	if (!payload || !Array.isArray(payload.questions)) {
		return [];
	}

	return payload.questions
		.filter((question) =>
			question &&
			typeof question.id === "string" &&
			typeof question.label === "string"
		)
		.map((question) => ({
			id: question.id,
			label: question.label,
			options: Array.isArray(question.options)
				? question.options
					.filter((option) =>
						option &&
						typeof option.id === "string" &&
						typeof option.label === "string"
					)
					.map((option) => ({
						id: option.id,
						label: option.label,
					}))
				: [],
		}));
}

module.exports = {
	extractAIGatewayDeferredToolFromAssistantText,
	normalizeAIGatewayAskUserQuestionsInput,
	buildQuestionCardPayloadFromAIGatewayDeferredTool,
	buildPlanWidgetPayloadFromAIGatewayDeferredTool,
	buildQuestionMetaFromQuestionCardPayload,
};
