import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";

interface StringRecord {
	[key: string]: unknown;
}

type QuestionKind = "single-select" | "multi-select" | "text";

export type ClarificationAnswerValue = string | string[];
export type ClarificationAnswers = Record<string, ClarificationAnswerValue>;

export interface ClarificationSubmission {
	sessionId: string;
	round: number;
	answers: ClarificationAnswers;
	completed: boolean;
	toolCallId?: string;
	deferredToolCallId?: string;
}

export interface ParsedQuestionCardOption {
	id: string;
	label: string;
	description?: string;
	recommended?: boolean;
}

export interface ParsedQuestionCardQuestion {
	id: string;
	label: string;
	description?: string;
	required: boolean;
	kind: QuestionKind;
	options: ParsedQuestionCardOption[];
	placeholder?: string;
}

export interface ParsedQuestionCardPayload {
	type: "question-card";
	sessionId: string;
	round: number;
	maxRounds: number;
	title: string;
	description?: string;
	directive?: string;
	requiredCount: number;
	questions: ParsedQuestionCardQuestion[];
	sourceMessageId?: string;
	toolCallId?: string;
	deferredToolCallId?: string;
}

export interface ClarificationSummaryRow {
	question: string;
	answer: string;
	status?: "skipped";
}

export interface DeferredToolResponsePayload {
	tool_call_id: string;
	result: Record<string, string[]>;
}

type ClarificationStatus = "answered" | "dismissed";

const DEFAULT_SESSION_ID = "clarification-session";
const DEFAULT_MAX_ROUNDS = Number.MAX_SAFE_INTEGER;
const DEFAULT_TITLE = "Help me clarify this";
const DEFAULT_PLACEHOLDER = "Tell Rovo what to do...";
const MAX_GENERATED_OPTIONS = 8;
const QUESTION_CARD_SKIPPED_VALUE = "Skipped";
const CLARIFICATION_DISMISS_SUMMARY_QUESTION = "Clarification status";
const CLARIFICATION_DISMISS_SUMMARY_ANSWER = "User dismissed";

/**
 * Matches options that just say the user will type/enter/provide their own answer,
 * e.g. "I'll type the space name", "I will enter it myself", "Type my own".
 * These are redundant when the custom input field is shown.
 */
const SELF_TYPE_OPTION_PATTERN =
	/^i('ll| will) (type|enter|specify|provide|write|input|paste|share|send)\b|^(type|enter|specify|provide|write|paste|share|send) (my own|it myself|manually)|(?:next|following) (message|reply|response|turn)/i;
const QUESTION_KINDS: ReadonlySet<QuestionKind> = new Set([
	"single-select",
	"multi-select",
	"text",
]);

function isStringRecord(value: unknown): value is StringRecord {
	return typeof value === "object" && value !== null;
}

function getNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

function isAssistantMessageInterrupted(message: Pick<RovoUIMessage, "metadata">): boolean {
	return message.metadata?.interruption?.status === "interrupted";
}

function getPositiveInteger(value: unknown): number | null {
	if (typeof value === "number" && Number.isInteger(value) && value > 0) {
		return value;
	}

	if (typeof value === "string") {
		const parsedValue = Number.parseInt(value, 10);
		if (Number.isInteger(parsedValue) && parsedValue > 0) {
			return parsedValue;
		}
	}

	return null;
}

function normalizeAnswerValue(value: unknown): ClarificationAnswerValue | null {
	if (typeof value === "string") {
		const normalizedValue = value.trim();
		return normalizedValue.length > 0 ? normalizedValue : null;
	}

	if (!Array.isArray(value)) {
		return null;
	}

	const normalizedValues = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter((item) => item.length > 0);
	return normalizedValues.length > 0 ? normalizedValues : null;
}

function normalizeQuestionKind(value: unknown): QuestionKind {
	if (typeof value !== "string") {
		return "single-select";
	}

	const normalizedValue = value.trim().toLowerCase() as QuestionKind;
	return QUESTION_KINDS.has(normalizedValue) ? normalizedValue : "single-select";
}

function hasValidPlanWidgetPayload(value: unknown): boolean {
	if (!isStringRecord(value)) {
		return false;
	}

	const record = isStringRecord(value.payload) ? value.payload : value;
	const taskCandidates = Array.isArray(record.tasks)
		? record.tasks
		: Array.isArray(record.steps)
			? record.steps
			: null;
	if (!taskCandidates || taskCandidates.length === 0) {
		return false;
	}

	return taskCandidates.some((taskItem) => {
		if (typeof taskItem === "string") {
			return taskItem.trim().length > 0;
		}

		if (!isStringRecord(taskItem)) {
			return false;
		}

		const taskLabel =
			getNonEmptyString(taskItem.label) ??
			getNonEmptyString(taskItem.title) ??
			getNonEmptyString(taskItem.task) ??
			getNonEmptyString(taskItem.text);
		return Boolean(taskLabel);
	});
}

function normalizeQuestionOptions(value: unknown): ParsedQuestionCardOption[] {
	if (!Array.isArray(value)) {
		return [];
	}

	const seenOptionIds = new Set<string>();
	const seenOptionLabels = new Set<string>();
	const options: ParsedQuestionCardOption[] = [];

	for (const [index, option] of value.entries()) {
		if (!isStringRecord(option)) continue;

		const label =
			getNonEmptyString(option.label) ??
			getNonEmptyString(option.title) ??
			getNonEmptyString(option.text);
		if (!label) continue;

		// Skip options that just tell the user to type their own answer —
		// the custom input field already serves that purpose.
		if (SELF_TYPE_OPTION_PATTERN.test(label)) continue;

		const optionId = getNonEmptyString(option.id) ?? `option-${index + 1}`;
		const normalizedLabel = label.toLowerCase();
		if (seenOptionIds.has(optionId) || seenOptionLabels.has(normalizedLabel)) {
			continue;
		}

		seenOptionIds.add(optionId);
		seenOptionLabels.add(normalizedLabel);
		options.push({
			id: optionId,
			label,
			description: getNonEmptyString(option.description) ?? undefined,
			recommended: Boolean(option.recommended),
		});
	}

	return options.slice(0, MAX_GENERATED_OPTIONS);
}

function getUniqueQuestionId(baseId: string, seenQuestionIds: Set<string>): string {
	let uniqueQuestionId = baseId;
	let duplicateIndex = 2;
	while (seenQuestionIds.has(uniqueQuestionId)) {
		uniqueQuestionId = `${baseId}-${duplicateIndex}`;
		duplicateIndex += 1;
	}

	seenQuestionIds.add(uniqueQuestionId);
	return uniqueQuestionId;
}

export function parseQuestionCardPayload(
	value: unknown
): ParsedQuestionCardPayload | null {
	if (!isStringRecord(value)) {
		return null;
	}

	const record = isStringRecord(value.payload) ? value.payload : value;
	const recordType = getNonEmptyString(record.type);
	if (recordType && recordType !== "question-card") {
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

	const questions: ParsedQuestionCardQuestion[] = [];
	const seenQuestionIds = new Set<string>();
	const seenLabels = new Set<string>();

	for (const [index, question] of questionsValue.entries()) {
		if (!isStringRecord(question)) continue;

		const questionLabel =
			getNonEmptyString(question.label) ??
			getNonEmptyString(question.title) ??
			getNonEmptyString(question.question) ??
			getNonEmptyString(question.text);
		if (!questionLabel) continue;

		const normalizedLabel = questionLabel.toLowerCase();
		if (seenLabels.has(normalizedLabel)) continue;
		seenLabels.add(normalizedLabel);

		const options = normalizeQuestionOptions(question.options);
		const baseQuestionId = getNonEmptyString(question.id) ?? `q-${index + 1}`;
		const questionId = getUniqueQuestionId(baseQuestionId, seenQuestionIds);

		questions.push({
			id: questionId,
			label: questionLabel,
			description: getNonEmptyString(question.description) ?? undefined,
			required: question.required !== false,
			kind: normalizeQuestionKind(question.kind),
			options,
			placeholder: getNonEmptyString(question.placeholder) ?? DEFAULT_PLACEHOLDER,
		});
	}
	if (questions.length === 0) {
		return null;
	}

	const requiredCount = questions.filter((question) => question.required).length;
	return {
		type: "question-card",
		sessionId: getNonEmptyString(record.sessionId) ?? DEFAULT_SESSION_ID,
		round: getPositiveInteger(record.round) ?? 1,
		maxRounds: getPositiveInteger(record.maxRounds) ?? DEFAULT_MAX_ROUNDS,
		title: getNonEmptyString(record.title) ?? DEFAULT_TITLE,
		description: getNonEmptyString(record.description) ?? undefined,
		directive: getNonEmptyString(record.directive) ?? undefined,
		requiredCount,
		questions,
		toolCallId:
			getNonEmptyString(record.toolCallId) ??
			getNonEmptyString(record.tool_call_id) ??
			undefined,
		deferredToolCallId:
			getNonEmptyString(record.deferredToolCallId) ??
			getNonEmptyString(record.toolCallId) ??
			getNonEmptyString(record.tool_call_id) ??
			undefined,
	};
}

function isAnswerProvided(
	question: ParsedQuestionCardQuestion,
	answers: ClarificationAnswers
): boolean {
	const answerValue = answers[question.id];
	if (question.kind === "multi-select") {
		return Array.isArray(answerValue) && answerValue.length > 0;
	}

	return typeof answerValue === "string" && answerValue.trim().length > 0;
}

function sanitizeClarificationAnswers(
	questionCard: ParsedQuestionCardPayload,
	answers: ClarificationAnswers
): ClarificationAnswers {
	return questionCard.questions.reduce<ClarificationAnswers>((result, question) => {
		const normalizedAnswerValue = normalizeAnswerValue(answers[question.id]);
		if (!normalizedAnswerValue) {
			return result;
		}

		result[question.id] = normalizedAnswerValue;
		return result;
	}, {});
}

function resolveAnswerOptionLabel(
	question: ParsedQuestionCardQuestion,
	answer: string
): string {
	const matchingOption = question.options.find((option) => option.id === answer);
	return matchingOption?.label ?? answer;
}

function formatAnswerForSummary(
	question: ParsedQuestionCardQuestion,
	value: ClarificationAnswerValue
): string {
	if (Array.isArray(value)) {
		return value.map((answer) => resolveAnswerOptionLabel(question, answer)).join(", ");
	}

	return resolveAnswerOptionLabel(question, value);
}

export function buildClarificationSummaryRows(
	questionCard: ParsedQuestionCardPayload,
	answers: ClarificationAnswers
): ClarificationSummaryRow[] {
	const sanitizedAnswers = sanitizeClarificationAnswers(questionCard, answers);
	return questionCard.questions
		.map((question) => {
			const answerValue = sanitizedAnswers[question.id];
			if (!answerValue) {
				return null;
			}

			const formattedAnswer = formatAnswerForSummary(question, answerValue);
			if (formattedAnswer === QUESTION_CARD_SKIPPED_VALUE) {
				return {
					question: question.label,
					answer: formattedAnswer,
					status: "skipped" as const,
				};
			}

			return {
				question: question.label,
				answer: formattedAnswer,
			};
		})
		.filter((row): row is ClarificationSummaryRow => row !== null);
}

export function buildClarificationSummaryDisplayLabel(
	questionCard: ParsedQuestionCardPayload,
	answers: ClarificationAnswers
): string {
	const summaryRows = buildClarificationSummaryRows(questionCard, answers);
	if (summaryRows.length === 0) {
		return `Requirements captured for "${questionCard.title}".`;
	}

	const answerCount = summaryRows.length;
	const answerLabel = answerCount === 1 ? "answer" : "answers";
	return `Requirements captured (${answerCount} ${answerLabel}).`;
}

function buildClarificationDismissSummaryRows(): ClarificationSummaryRow[] {
	return [
		{
			question: CLARIFICATION_DISMISS_SUMMARY_QUESTION,
			answer: CLARIFICATION_DISMISS_SUMMARY_ANSWER,
		},
	];
}

export function getQuestionCardResolutionKey(
	questionCard: Pick<
		ParsedQuestionCardPayload,
		"sessionId" | "round" | "toolCallId" | "deferredToolCallId"
	> | null
): string | null {
	if (!questionCard) {
		return null;
	}

	const toolCallId =
		getNonEmptyString(questionCard.deferredToolCallId) ??
		getNonEmptyString(questionCard.toolCallId);
	if (toolCallId) {
		return `tool:${toolCallId}`;
	}

	const sessionId = getNonEmptyString(questionCard.sessionId);
	const round = getPositiveInteger(questionCard.round);
	if (!sessionId || !round) {
		return null;
	}

	return `session:${sessionId}:round:${round}`;
}

function getClarificationResolutionKeyFromMetadata(
	metadata: RovoMessageMetadata | undefined
): string | null {
	if (!metadata || metadata.source !== "clarification-submit") {
		return null;
	}

	const toolCallId = getNonEmptyString(metadata.clarificationToolCallId);
	if (toolCallId) {
		return `tool:${toolCallId}`;
	}

	const sessionId = getNonEmptyString(metadata.clarificationSessionId);
	const round = getPositiveInteger(metadata.clarificationRound);
	if (!sessionId || !round) {
		return null;
	}

	return `session:${sessionId}:round:${round}`;
}

function isClarificationSubmitMessage(
	message: Pick<RovoUIMessage, "role" | "metadata">
): boolean {
	return (
		message.role === "user" &&
		message.metadata?.source === "clarification-submit"
	);
}

export function buildClarificationMessageMetadata(
	questionCard: ParsedQuestionCardPayload,
	options: Readonly<{
		answers?: ClarificationAnswers;
		status?: ClarificationStatus;
		visibility?: "visible" | "hidden";
	}>
): RovoMessageMetadata {
	const metadata: RovoMessageMetadata = {
		source: "clarification-submit",
		clarificationToolCallId:
			questionCard.deferredToolCallId ?? questionCard.toolCallId,
		clarificationSessionId: questionCard.sessionId,
		clarificationRound: questionCard.round,
		clarificationStatus: options.status ?? "answered",
	};

	if (options.visibility) {
		metadata.visibility = options.visibility;
	}

	if (options.status === "dismissed") {
		metadata.clarificationSummary = buildClarificationDismissSummaryRows();
		metadata.displayLabel = "User dismissed clarification questions.";
		return metadata;
	}

	if (options.answers) {
		metadata.clarificationSummary = buildClarificationSummaryRows(
			questionCard,
			options.answers,
		);
		metadata.displayLabel = buildClarificationSummaryDisplayLabel(
			questionCard,
			options.answers
		);
	}

	return metadata;
}

export function hasMatchingClarificationResponse(
	messages: ReadonlyArray<RovoUIMessage>,
	questionCard: ParsedQuestionCardPayload
): boolean {
	const resolutionKey = getQuestionCardResolutionKey(questionCard);
	let sawStructuredClarificationSubmit = false;

	for (const message of messages) {
		if (!isClarificationSubmitMessage(message)) {
			continue;
		}

		const messageResolutionKey = getClarificationResolutionKeyFromMetadata(
			message.metadata
		);
		if (!messageResolutionKey) {
			continue;
		}

		sawStructuredClarificationSubmit = true;
		if (resolutionKey && messageResolutionKey === resolutionKey) {
			return true;
		}
	}

	if (resolutionKey && sawStructuredClarificationSubmit) {
		return false;
	}

	const sourceMessageIndex = questionCard.sourceMessageId
		? messages.findIndex((message) => message.id === questionCard.sourceMessageId)
		: -1;
	if (sourceMessageIndex === -1) {
		return false;
	}

	return messages
		.slice(sourceMessageIndex + 1)
		.some((message) => isClarificationSubmitMessage(message));
}

export function hasRequiredClarificationAnswers(
	questionCard: ParsedQuestionCardPayload,
	answers: ClarificationAnswers
): boolean {
	return questionCard.questions.every((question) => {
		if (!question.required) {
			return true;
		}

		return isAnswerProvided(question, answers);
	});
}

export function createClarificationSubmission(
	questionCard: ParsedQuestionCardPayload,
	answers: ClarificationAnswers
): ClarificationSubmission {
	const sanitizedAnswers = sanitizeClarificationAnswers(questionCard, answers);
	const deferredToolCallId =
		questionCard.deferredToolCallId ?? questionCard.toolCallId;

	return {
		sessionId: questionCard.sessionId,
		round: questionCard.round,
		answers: sanitizedAnswers,
		completed: hasRequiredClarificationAnswers(questionCard, sanitizedAnswers),
		toolCallId: deferredToolCallId,
		deferredToolCallId,
	};
}

export function buildClarificationSummaryPrompt(
	questionCard: ParsedQuestionCardPayload,
	answers: ClarificationAnswers,
): string {
	const summaryRows = buildClarificationSummaryRows(questionCard, answers);
	const answerSummaryLines = summaryRows.map(
		(summaryRow) => `- ${summaryRow.question}: ${summaryRow.answer}`
	);

	if (answerSummaryLines.length === 0) {
		return `Please continue with a best-effort plan for "${questionCard.title}".`;
	}

	return [
		`Here are my clarification answers for "${questionCard.title}":`,
		"",
		...answerSummaryLines,
	].join("\n");
}

/**
 * Adapts QuestionCard answers to the format expected by the ask_user_questions tool.
 *
 * The tool expects `Record<string, string[]>` where keys are question *text* (labels),
 * not question IDs. This function maps question IDs back to their labels and normalizes
 * all answer values to `string[]` (the tool always expects a list, even for single-select).
 *
 * @param answers - ID-keyed answers from the QuestionCard component
 * @param questions - The parsed questions that were displayed (provides ID → label mapping)
 * @returns Text-keyed answers with array values matching the tool contract
 */
export function adaptAnswersForToolContract(
	answers: ClarificationAnswers,
	questions: ReadonlyArray<ParsedQuestionCardQuestion>
): Record<string, string[]> {
	const idToLabel = new Map(questions.map((q) => [q.id, q.label]));

	return Object.entries(answers).reduce<Record<string, string[]>>(
		(acc, [questionId, value]) => {
			const questionText = idToLabel.get(questionId) ?? questionId;
			acc[questionText] = Array.isArray(value) ? value : [value];
			return acc;
		},
		{}
	);
}

export function buildDeferredToolResponse(
	questionCard: ParsedQuestionCardPayload,
	answers: ClarificationAnswers
): DeferredToolResponsePayload | null {
	const toolCallId = questionCard.deferredToolCallId ?? questionCard.toolCallId;
	if (!toolCallId) {
		return null;
	}

	const sanitizedAnswers = sanitizeClarificationAnswers(questionCard, answers);
	const result = questionCard.questions.reduce<Record<string, string[]>>(
		(acc, question) => {
			const value = sanitizedAnswers[question.id];
			if (!value) {
				return acc;
			}

			const normalizedValues = Array.isArray(value)
				? value.map((answer) => resolveAnswerOptionLabel(question, answer))
				: [resolveAnswerOptionLabel(question, value)];
			acc[question.label] = normalizedValues;
			return acc;
		},
		{},
	);

	return {
		tool_call_id: toolCallId,
		result,
	};
}

/**
 * Builds a system-level message to notify RovoDev that the user dismissed
 * a clarification question card and that execution should pause until the
 * user provides a new instruction.
 */
export function buildClarificationDismissPrompt(
	questionCard: ParsedQuestionCardPayload
): string {
	return [
		`The user dismissed the clarification questions for "${questionCard.title}".`,
		"This is an explicit response: they dismissed the whole question set.",
		"Do not proceed.",
		"Wait for the user's next instructions.",
	].join(" ");
}

function findLatestQuestionCardInAssistantMessage(
	message: RovoUIMessage,
): ParsedQuestionCardPayload | null {
	if (isAssistantMessageInterrupted(message)) {
		return null;
	}

	for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex--) {
		const part = message.parts[partIndex] as {
			type?: string;
			data?: {
				type?: unknown;
				payload?: unknown;
			};
		};

		if (part.type !== "data-widget-data") {
			continue;
		}

		if (getNonEmptyString(part.data?.type) !== "question-card") {
			continue;
		}

		const parsedPayload = parseQuestionCardPayload(part.data?.payload);
		if (parsedPayload) {
			return {
				...parsedPayload,
				sourceMessageId: message.id,
			};
		}
	}

	return null;
}

/**
 * Returns the active clarification question card for the docked overlay.
 *
 * On deferred resume turns, the new `ask_user_questions` payload often lands on a
 * **new** assistant message after the user's answer. Older logic only inspected
 * the latest assistant row, which could be empty mid-stream or miss cards that
 * belong to the post-user assistant turn. We therefore prefer question-card
 * widgets on assistant messages **after** the last user message, scanning
 * newest-first; then fall back to the latest assistant message for first-turn
 * edge cases.
 */
export function getLatestQuestionCardPayload(
	messages: ReadonlyArray<RovoUIMessage>
): ParsedQuestionCardPayload | null {
	const latestAssistantMessageIndex = messages.findLastIndex(
		(message) => message.role === "assistant"
	);
	if (latestAssistantMessageIndex === -1) {
		return null;
	}

	const latestUserMessageIndex = messages.findLastIndex(
		(message) => message.role === "user"
	);
	if (latestUserMessageIndex > latestAssistantMessageIndex) {
		return null;
	}

	const latestAssistantMessage = messages[latestAssistantMessageIndex];
	const hasValidPlanWidget = latestAssistantMessage.parts.some((part) => {
		const candidate = part as {
			type?: string;
			data?: {
				type?: unknown;
				payload?: unknown;
			};
		};
		if (candidate.type !== "data-widget-data") {
			return false;
		}

		const widgetType = getNonEmptyString(candidate.data?.type);
		if (widgetType !== "plan") {
			return false;
		}

		return hasValidPlanWidgetPayload(candidate.data?.payload);
	});
	if (hasValidPlanWidget) {
		return null;
	}

	const minAssistantIndex =
		latestUserMessageIndex === -1 ? 0 : latestUserMessageIndex + 1;

	const assistantIndices: number[] = [];
	for (let index = 0; index < messages.length; index += 1) {
		if (messages[index]?.role === "assistant") {
			assistantIndices.push(index);
		}
	}

	for (let k = assistantIndices.length - 1; k >= 0; k -= 1) {
		const messageIndex = assistantIndices[k] ?? -1;
		if (messageIndex < minAssistantIndex) {
			break;
		}

		const message = messages[messageIndex];
		if (!message || message.role !== "assistant") {
			continue;
		}

		if (isAssistantMessageInterrupted(message)) {
			continue;
		}

		const found = findLatestQuestionCardInAssistantMessage(message);
		if (found && !hasMatchingClarificationResponse(messages, found)) {
			return found;
		}
	}

	const fallbackQuestionCard =
		findLatestQuestionCardInAssistantMessage(latestAssistantMessage);
	if (
		fallbackQuestionCard &&
		!hasMatchingClarificationResponse(messages, fallbackQuestionCard)
	) {
		return fallbackQuestionCard;
	}

	return null;
}
