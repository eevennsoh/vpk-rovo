const {
	addHermesMemoryEntry,
	normalizeHermesMemoryTarget,
	replaceHermesMemory,
} = require("./hermes-memory");
const {
	clipText,
	extractTextFromUiParts,
	getNonEmptyString,
} = require("./shared-utils");
const {
	executeStructuredFallbackTask,
	parseStructuredJsonResponse,
} = require("./rovo-task-executor");

const DEFAULT_MEMORY_COMPANION_TIMEOUT_MS = 20_000;
const MEMORY_COMPANION_HISTORY_LIMIT = 6;

const EXPLICIT_MEMORY_REQUEST_PATTERNS = [
	/\bremember\s+(?:this|that|it|me)\b/i,
	/\b(?:save|store|add|put)\b.{0,24}\b(?:this|that|it)\b.{0,24}\b(?:to|into|in)\b.{0,12}\b(?:your\s+)?(?:durable\s+)?memory\b/i,
	/\b(?:save|store|add|put)\b.{0,24}\b(?:to|into|in)\b.{0,12}\b(?:your\s+)?(?:durable\s+)?memory\b/i,
	/\bkeep\b.{0,24}\b(?:this|that|it)\b.{0,24}\bfor\s+future\s+conversations\b/i,
];

function isExplicitHermesMemoryRequest(message) {
	const normalizedMessage = getNonEmptyString(message);
	if (!normalizedMessage) {
		return false;
	}

	return EXPLICIT_MEMORY_REQUEST_PATTERNS.some((pattern) => pattern.test(normalizedMessage));
}

function getLatestAssistantTextFromMessages(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const candidateMessage = messages[index];
		if (!candidateMessage || candidateMessage.role !== "assistant") {
			continue;
		}

		const text = extractTextFromUiParts(candidateMessage.parts);
		if (text) {
			return text;
		}
	}

	return null;
}

function formatConversationHistory(conversationHistory) {
	if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
		return null;
	}

	const recentHistory = conversationHistory
		.slice(-MEMORY_COMPANION_HISTORY_LIMIT)
		.map((message) => {
			const roleLabel = message?.type === "assistant" ? "Assistant" : "User";
			const content = clipText(message?.content, 480);
			return content ? `${roleLabel}: ${content}` : null;
		})
		.filter(Boolean);

	if (recentHistory.length === 0) {
		return null;
	}

	return recentHistory.join("\n");
}

function buildHermesMemoryCompanionMessages({
	conversationHistory,
	explicitSaveRequest = false,
	latestAssistantMessage,
	latestUserMessage,
}) {
	const sections = [
		"Review this conversation excerpt and persist durable Hermes memory only when it will help in future conversations.",
	];
	const formattedHistory = formatConversationHistory(conversationHistory);
	if (formattedHistory) {
		sections.push(`Recent conversation:\n${formattedHistory}`);
	}

	const normalizedLatestUserMessage = clipText(latestUserMessage, 1_200);
	if (normalizedLatestUserMessage) {
		sections.push(`Latest user message:\n${normalizedLatestUserMessage}`);
	}

	const normalizedLatestAssistantMessage = clipText(latestAssistantMessage, 2_000);
	if (normalizedLatestAssistantMessage) {
		sections.push(`Latest assistant response:\n${normalizedLatestAssistantMessage}`);
	}

	return [
		{
			role: "system",
			content: [
				"[Hermes Memory Companion]",
				"You are reviewing a finished turn from another assistant.",
				"Emit a single JSON object with `mode` set to `structured-memory-fallback` and an `actions` array containing only `add` or `replace` entries.",
				"Each action must include `target` (`memory` or `user`) and `content`.",
				"Use `replace` only when you intend to replace the full memory document for that target.",
				"Do not include commentary outside the JSON object in the fallback path.",
				"Durable memory here means Hermes memory, not repo lesson logs or skill updates.",
				"Prefer target `user` for user preferences, communication style, identity, and stable habits.",
				"Prefer target `memory` for environment facts, project conventions, reusable corrections, and durable workflow notes.",
				"Prefer `replace` over `add` when updating an existing fact to avoid duplicates.",
				"Skip temporary task state, one-off requests, ephemeral artifact details, and anything easily rediscovered.",
				"If you decide nothing durable should be saved, reply exactly: Nothing to save.",
				explicitSaveRequest
					? "The user explicitly asked to remember or save something. Save it now unless it is clearly transient."
					: null,
				"[End Hermes Memory Companion]",
			]
				.filter(Boolean)
				.join("\n"),
		},
		{
			role: "user",
			content: sections.join("\n\n"),
		},
	];
}

function buildHermesMemoryCompanionExecutionInput(options) {
	const messages = buildHermesMemoryCompanionMessages(options);
	return {
		prompt: messages[1]?.content ?? "",
		system: messages[0]?.content ?? "",
	};
}

function normalizeStructuredHermesMemoryAction(action) {
	if (!action || typeof action !== "object") {
		return null;
	}

	const target = normalizeHermesMemoryTarget(action.target);
	const actionType =
		action.action === "add" || action.action === "replace"
			? action.action
			: null;
	const content = getNonEmptyString(action.content);
	if (!target || !actionType || !content) {
		return null;
	}

	return {
		action: actionType,
		content,
		target,
	};
}

function parseStructuredHermesMemoryFallback(text) {
	const payload = parseStructuredJsonResponse(text);
	if (!payload) {
		return null;
	}

	const mode = getNonEmptyString(payload.mode);
	if (mode !== "structured-memory-fallback") {
		return null;
	}

	const actionsSource = Array.isArray(payload.actions)
		? payload.actions
		: Array.isArray(payload.memoryActions)
			? payload.memoryActions
			: [];
	const actions = actionsSource
		.map(normalizeStructuredHermesMemoryAction)
		.filter(Boolean);

	if (actions.length === 0) {
		return null;
	}

	return {
		actions,
		mode,
		summary: getNonEmptyString(payload.summary),
	};
}

async function applyStructuredHermesMemoryActions(
	actions,
	{
		addMemoryEntryImpl = addHermesMemoryEntry,
		replaceMemoryImpl = replaceHermesMemory,
	} = {},
) {
	const appliedActions = [];
	for (const action of Array.isArray(actions) ? actions : []) {
		if (!action || typeof action !== "object") {
			continue;
		}

		if (action.action === "add") {
			const memory = await addMemoryEntryImpl(action.target, {
				content: action.content,
			});
			appliedActions.push({
				...action,
				memory,
			});
			continue;
		}

		if (action.action === "replace") {
			const memory = await replaceMemoryImpl(action.target, {
				content: action.content,
			});
			appliedActions.push({
				...action,
				memory,
			});
		}
	}

	return appliedActions;
}

async function executeMemoryCompanionViaGateway({ prompt, system, signal, timeoutMs }) {
	const fallbackResult = await executeStructuredFallbackTask({
		prompt,
		signal,
		system,
		timeoutMs,
	});
	const structuredResult = parseStructuredHermesMemoryFallback(fallbackResult.text);
	return {
		backend: "ai-gateway",
		didRun: true,
		responseText: fallbackResult.text,
		structuredResult,
	};
}

async function runHermesMemoryCompanionReview({
	conversationHistory,
	explicitSaveRequest = false,
	executeBackgroundTaskImpl = executeMemoryCompanionViaGateway,
	applyStructuredMemoryActionsImpl = applyStructuredHermesMemoryActions,
	latestAssistantMessage,
	latestUserMessage,
	timeoutMs = DEFAULT_MEMORY_COMPANION_TIMEOUT_MS,
}) {
	const normalizedLatestUserMessage = getNonEmptyString(latestUserMessage);
	const normalizedLatestAssistantMessage = getNonEmptyString(latestAssistantMessage);
	if (!normalizedLatestUserMessage && !normalizedLatestAssistantMessage) {
		return {
			didReview: false,
			reason: "missing_turn_text",
		};
	}

	const executionInput = buildHermesMemoryCompanionExecutionInput({
		conversationHistory,
		explicitSaveRequest,
		latestAssistantMessage: normalizedLatestAssistantMessage,
		latestUserMessage: normalizedLatestUserMessage,
	});
	const payload = await executeBackgroundTaskImpl({
		...executionInput,
		conflictPolicy: "wait-for-turn",
		parseStructuredResult: parseStructuredHermesMemoryFallback,
		timeoutMs,
	});

	const structuredMemoryActions = payload.structuredResult
		? await applyStructuredMemoryActionsImpl(payload.structuredResult.actions)
		: [];

	return {
		didReview: true,
		explicitSaveRequest,
		responseText: payload.responseText ?? null,
		structuredFallback: payload.structuredResult
			? {
				actions: structuredMemoryActions,
				mode: payload.structuredResult.mode,
				summary: payload.structuredResult.summary ?? null,
			}
			: null,
		structuredMemoryActions,
	};
}

module.exports = {
	DEFAULT_MEMORY_COMPANION_TIMEOUT_MS,
	applyStructuredHermesMemoryActions,
	buildHermesMemoryCompanionExecutionInput,
	buildHermesMemoryCompanionMessages,
	executeMemoryCompanionViaGateway,
	getLatestAssistantTextFromMessages,
	isExplicitHermesMemoryRequest,
	parseStructuredHermesMemoryFallback,
	runHermesMemoryCompanionReview,
};
