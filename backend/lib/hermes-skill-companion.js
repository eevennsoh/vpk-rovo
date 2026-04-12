const {
	listHermesSkills,
} = require("./hermes-skills");
const {
	clipText,
	getNonEmptyString,
} = require("./shared-utils");
const {
	executeStructuredFallbackTask,
	parseStructuredJsonResponse,
} = require("./rovo-task-executor");
const { validateSkillBundle } = require("./hermes-skills-hub");

const DEFAULT_SKILL_COMPANION_TIMEOUT_MS = 8_000;
const SKILL_COMPANION_HISTORY_LIMIT = 6;

function formatConversationHistory(conversationHistory) {
	if (!Array.isArray(conversationHistory) || conversationHistory.length === 0) {
		return null;
	}

	const recentHistory = conversationHistory
		.slice(-SKILL_COMPANION_HISTORY_LIMIT)
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

function buildInstalledSkillsSummary(skills) {
	if (!Array.isArray(skills) || skills.length === 0) {
		return "No Hermes skills are currently installed.";
	}

	return skills
		.filter(Boolean)
		.slice(0, 80)
		.map((skill) => {
			const summary = getNonEmptyString(skill.description) ?? getNonEmptyString(skill.summary);
			return `- ${skill.id} — ${skill.title}${summary ? `: ${clipText(summary, 140)}` : ""}`;
		})
		.join("\n");
}

function buildHermesSkillCompanionMessages({
	conversationHistory,
	installedSkills,
	latestAssistantMessage,
	latestUserMessage,
}) {
	const sections = [
		"Review this completed turn and decide whether it produced a reusable Hermes skill change.",
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

	sections.push(`Installed Hermes skills:\n${buildInstalledSkillsSummary(installedSkills)}`);

	return [
		{
			role: "system",
			content: [
				"[Hermes Skill Companion]",
				"You are reviewing a finished turn from another assistant.",
				"Only create, update, or delete a Hermes skill when the turn surfaced a reusable workflow, durable procedure, or repeated correction.",
				"Do not create skills for one-off task state, ephemeral debugging, or facts that belong in Hermes memory instead.",
				"Reply exactly with a JSON object using mode `structured-skill-fallback`.",
				"The JSON must include an `actions` array. Each action must be one of: `create`, `update`, or `delete`.",
				"Each action must include `category`, `name`, and `rationale`.",
				"`create` and `update` actions must include a `files` array with at least `SKILL.md`.",
				"Use `update` only when a similar installed skill should be changed instead of creating a duplicate.",
				"If nothing reusable should be captured, reply with `{ \"mode\": \"structured-skill-fallback\", \"actions\": [] }`.",
				"[End Hermes Skill Companion]",
			].join("\n"),
		},
		{
			role: "user",
			content: sections.join("\n\n"),
		},
	];
}

function buildHermesSkillCompanionExecutionInput(options) {
	const messages = buildHermesSkillCompanionMessages(options);
	return {
		prompt: messages[1]?.content ?? "",
		system: messages[0]?.content ?? "",
	};
}

function normalizeStructuredSkillAction(action) {
	if (!action || typeof action !== "object") {
		return null;
	}

	const actionType =
		action.action === "create" || action.action === "update" || action.action === "delete"
			? action.action
			: null;
	const category = getNonEmptyString(action.category);
	const name = getNonEmptyString(action.name);
	const rationale = getNonEmptyString(action.rationale);
	if (!actionType || !category || !name || !rationale) {
		return null;
	}

	const files = Array.isArray(action.files)
		? action.files
				.filter((file) => file && typeof file === "object")
				.map((file) => ({
					path: getNonEmptyString(file.path),
					content: typeof file.content === "string" ? file.content : null,
				}))
				.filter((file) => file.path && file.content !== null)
				.map((file) => ({
					path: file.path,
					content: file.content,
				}))
		: [];
	if (actionType !== "delete") {
		const validation = validateSkillBundle({
			name,
			category,
			files,
		});
		if (!validation.valid) {
			return null;
		}
	}

	return {
		action: actionType,
		category,
		name,
		summary: getNonEmptyString(action.summary),
		rationale,
		files,
	};
}

function parseStructuredHermesSkillFallback(text) {
	const payload = parseStructuredJsonResponse(text);
	if (!payload) {
		return null;
	}

	const mode = getNonEmptyString(payload.mode);
	if (mode !== "structured-skill-fallback") {
		return null;
	}

	const actionsSource = Array.isArray(payload.actions) ? payload.actions : null;
	if (!actionsSource) {
		return null;
	}
	const actions = actionsSource
		.map(normalizeStructuredSkillAction)
		.filter(Boolean);
	if (actionsSource.length > 0 && actions.length === 0) {
		return null;
	}

	return {
		mode,
		summary: getNonEmptyString(payload.summary),
		actions,
	};
}

function createStructuredSkillCompanionError(message) {
	const error = new Error(message);
	error.code = "HERMES_SKILL_COMPANION_INVALID_OUTPUT";
	return error;
}

async function applyStructuredHermesSkillActions(
	actions,
	{
		upsertDraftImpl,
		sourceMessageId = null,
		sourceThreadId = null,
	} = {},
) {
	const appliedActions = [];
	for (const action of Array.isArray(actions) ? actions : []) {
		const draft = await upsertDraftImpl({
			...action,
			sourceMessageId,
			sourceThreadId,
		});
		appliedActions.push({
			...action,
			draft,
		});
	}

	return appliedActions;
}

async function executeSkillCompanionViaGateway({ prompt, signal, system, timeoutMs }) {
	const fallbackResult = await executeStructuredFallbackTask({
		prompt,
		signal,
		system,
		timeoutMs,
	});
	const structuredResult = parseStructuredHermesSkillFallback(fallbackResult.text);
	if (!structuredResult) {
		throw createStructuredSkillCompanionError(
			"Hermes skill companion returned invalid structured output.",
		);
	}
	return {
		backend: "ai-gateway",
		didRun: true,
		responseText: fallbackResult.text,
		structuredResult,
	};
}

async function runHermesSkillCompanionReview({
	applyStructuredSkillActionsImpl = applyStructuredHermesSkillActions,
	conversationHistory,
	executeBackgroundTaskImpl = executeSkillCompanionViaGateway,
	installedSkillsImpl = listHermesSkills,
	latestAssistantMessage,
	latestUserMessage,
	sourceMessageId = null,
	sourceThreadId = null,
	timeoutMs = DEFAULT_SKILL_COMPANION_TIMEOUT_MS,
	upsertDraftImpl,
}) {
	const normalizedLatestUserMessage = getNonEmptyString(latestUserMessage);
	const normalizedLatestAssistantMessage = getNonEmptyString(latestAssistantMessage);
	if (!normalizedLatestUserMessage && !normalizedLatestAssistantMessage) {
		return {
			didReview: false,
			reason: "missing_turn_text",
		};
	}

	const installedSkills = await installedSkillsImpl();
	const abortController = new AbortController();
	const timer = setTimeout(() => {
		abortController.abort();
	}, timeoutMs);

	try {
		const executionInput = buildHermesSkillCompanionExecutionInput({
			conversationHistory,
			installedSkills,
			latestAssistantMessage: normalizedLatestAssistantMessage,
			latestUserMessage: normalizedLatestUserMessage,
		});
		const payload = await executeBackgroundTaskImpl({
			...executionInput,
			conflictPolicy: "wait-for-turn",
			parseStructuredResult: parseStructuredHermesSkillFallback,
			signal: abortController.signal,
			timeoutMs,
		});
		if (!payload?.structuredResult) {
			throw createStructuredSkillCompanionError(
				"Hermes skill companion review completed without structured actions metadata.",
			);
		}
		const structuredSkillActions = await applyStructuredSkillActionsImpl(
			payload.structuredResult.actions,
			{
				sourceMessageId,
				sourceThreadId,
				upsertDraftImpl,
			},
		);

		return {
			didReview: true,
			responseText: payload.responseText ?? null,
			structuredFallback: {
				actions: structuredSkillActions,
				mode: payload.structuredResult.mode,
				summary: payload.structuredResult.summary ?? null,
			},
			structuredSkillActions,
		};
	} finally {
		clearTimeout(timer);
	}
}

module.exports = {
	DEFAULT_SKILL_COMPANION_TIMEOUT_MS,
	applyStructuredHermesSkillActions,
	buildHermesSkillCompanionExecutionInput,
	buildHermesSkillCompanionMessages,
	executeSkillCompanionViaGateway,
	parseStructuredHermesSkillFallback,
	runHermesSkillCompanionReview,
};
