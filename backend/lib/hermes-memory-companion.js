const {
	enqueueWikiMemoryProposal,
	mapMemoryTargetToScope,
} = require("./wiki-memory-provider");
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
				"Reply exactly with a single JSON object using mode `structured-memory-fallback`.",
				"The JSON must include an `actions` array containing only `add` or `replace` entries.",
				"Each action must include `target` (`memory` or `user`) and `content`.",
				"Use `replace` only when the new fact should supersede prior memory for that target.",
				"Do not include commentary outside the JSON object in the fallback path.",
				"Durable memory here means wiki-backed Hermes memory, not repo lesson logs or skill updates.",
				"Prefer target `user` for user preferences, communication style, identity, and stable habits.",
				"Prefer target `memory` for environment facts, project conventions, reusable corrections, and durable workflow notes.",
				"Prefer `replace` over `add` when updating an existing fact to avoid stale duplicates.",
				"Direct requests to remember, save, or store something for future conversations are durable-memory candidates unless the request is actually for a reminder, scheduled action, or other future task.",
				"Decide from the meaning of the full turn, not simple keywords or fixed phrases.",
				"Ignore mistaken assistant claims about lacking a memory tool; judge whether the completed turn should produce durable memory.",
				"Skip temporary task state, one-off requests, ephemeral artifact details, reminders, and anything easily rediscovered.",
				"If nothing durable should be saved, reply with `{ \"mode\": \"structured-memory-fallback\", \"actions\": [] }`.",
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

	const target = typeof action.target === "string" && mapMemoryTargetToScope(action.target)
		? action.target
		: null;
	const actionType =
		action.action === "add" || action.action === "replace"
			? action.action
			: "add";
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
			: null;
	if (!actionsSource) {
		return null;
	}
	const actions = actionsSource
		.map(normalizeStructuredHermesMemoryAction)
		.filter(Boolean);
	if (actionsSource.length > 0 && actions.length === 0) {
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
		enqueueWikiMemoryProposalImpl = enqueueWikiMemoryProposal,
		sourceMessageId,
		sourceThreadId,
	} = {},
) {
	const appliedActions = [];
	for (const action of Array.isArray(actions) ? actions : []) {
		if (!action || typeof action !== "object") {
			continue;
		}

		const proposal = await enqueueWikiMemoryProposalImpl({
			action: action.action === "replace" ? "replace" : "add",
			content: action.content,
			sourceMessageId,
			sourceThreadId,
			summary: action.content.slice(0, 140),
			target: action.target,
		});
		appliedActions.push({
			...action,
			proposal,
			scope: mapMemoryTargetToScope(action.target),
		});
	}

	return appliedActions;
}

function createStructuredMemoryCompanionError(message) {
	const error = new Error(message);
	error.code = "HERMES_MEMORY_COMPANION_INVALID_OUTPUT";
	return error;
}

async function executeMemoryCompanionViaGateway({ prompt, system, signal, timeoutMs }) {
	const fallbackResult = await executeStructuredFallbackTask({
		prompt,
		signal,
		system,
		timeoutMs,
	});
	const structuredResult = parseStructuredHermesMemoryFallback(fallbackResult.text);
	if (!structuredResult) {
		throw createStructuredMemoryCompanionError(
			"Hermes memory companion returned invalid structured output.",
		);
	}
	return {
		backend: "ai-gateway",
		didRun: true,
		responseText: fallbackResult.text,
		structuredResult,
	};
}

async function runHermesMemoryCompanionReview({
	conversationHistory,
	executeBackgroundTaskImpl = executeMemoryCompanionViaGateway,
	applyStructuredMemoryActionsImpl = applyStructuredHermesMemoryActions,
	latestAssistantMessage,
	latestUserMessage,
	sourceMessageId,
	sourceThreadId,
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
		latestAssistantMessage: normalizedLatestAssistantMessage,
		latestUserMessage: normalizedLatestUserMessage,
	});
	const payload = await executeBackgroundTaskImpl({
		...executionInput,
		conflictPolicy: "wait-for-turn",
		parseStructuredResult: parseStructuredHermesMemoryFallback,
		timeoutMs,
	});
	if (!payload?.structuredResult) {
		throw createStructuredMemoryCompanionError(
			"Hermes memory companion review completed without structured actions metadata.",
		);
	}

	const structuredMemoryActions = await applyStructuredMemoryActionsImpl(
		payload.structuredResult.actions,
		{
			sourceMessageId,
			sourceThreadId,
		},
	);

	return {
		didReview: true,
		responseText: payload.responseText ?? null,
		structuredFallback: {
			actions: structuredMemoryActions,
			mode: payload.structuredResult.mode,
			summary: payload.structuredResult.summary ?? null,
		},
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
	parseStructuredHermesMemoryFallback,
	runHermesMemoryCompanionReview,
};
