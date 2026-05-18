import type { ReasoningPhase } from "../hooks/use-reasoning-phase";
import {
	buildThinkingNarrationMap,
	getAgentExecutionSummaries,
	getAllDataParts,
	getLatestTodoQueue,
	getThinkingToolCallSummaries,
	isRequestUserInputToolName,
	type AgentExecutionSummary,
	type RovoDataPart,
	type RovoUIMessage,
	type ThinkingNarrationMap,
	type ThinkingToolCallSummary,
} from "../../../../lib/rovo-ui-messages";
import {
	getLatestRovoAppTodoProgress,
	type RovoAppTodoProgressItem,
} from "./rovo-todo-progress";

interface ResolveAssistantThinkingTraceVisibilityOptions {
	isThinkingActive: boolean;
	isResponseInFlight: boolean;
	wasLatched: boolean;
}

interface ResolveAssistantThinkingTracePhaseOptions {
	isThinkingActive: boolean;
	hasTurnComplete: boolean;
	isThinkingLifecycleStreaming: boolean;
	hasBackendThinkingActivity: boolean;
	hasAwaitingInputToolCalls: boolean;
	isPostToolsGeneration?: boolean;
	isPostToolsResultPending?: boolean;
	hasWidgetOutput?: boolean;
	lifecyclePhase: ReasoningPhase;
}

interface ResolveAssistantThinkingTraceOpenOptions {
	allowAutoOpen?: boolean;
	hasThinkingToolCalls: boolean;
	reasoningPhase: ReasoningPhase;
	userOpenOverride: boolean | null;
}

interface ResolveAssistantThinkingTraceResponseGenerationStepOptions {
	hasAwaitingInputToolCalls: boolean;
	hasThinkingToolCalls: boolean;
	hasWidgetOutput?: boolean;
	isPostToolsGeneration?: boolean;
	isPostToolsResultPending?: boolean;
}

interface ShouldCollapseAssistantThinkingTraceOptions {
	previousReasoningPhase: ReasoningPhase;
	reasoningPhase: ReasoningPhase;
}

interface ResolveAssistantThinkingTraceVisibilityResult {
	effectiveIsThinkingActive: boolean;
	nextLatched: boolean;
}

export interface AssistantThinkingTraceData {
	agentExecutions: AgentExecutionSummary[];
	hasAgentExecutions: boolean;
	hasAnsweredQuestionToolCalls: boolean;
	hasAwaitingInputToolCalls: boolean;
	hasBackendThinkingActivity: boolean;
	hasLegacyTodoQueueItems: boolean;
	hasThinkingEvents: boolean;
	hasThinkingStatusPart: boolean;
	hasThinkingToolCalls: boolean;
	hasTodoProgressItems: boolean;
	hasTraceDataSignals: boolean;
	lastThinkingEventPart: RovoDataPart<"thinking-event"> | null;
	lastThinkingStatusPart: RovoDataPart<"thinking-status"> | null;
	thinkingEventParts: RovoDataPart<"thinking-event">[];
	thinkingNarrationMap: ThinkingNarrationMap;
	thinkingStatusParts: RovoDataPart<"thinking-status">[];
	thinkingToolCalls: ThinkingToolCallSummary[];
	todoProgressItems: RovoAppTodoProgressItem[];
	todoQueueItems: Array<{
		id: string;
		text: string;
		blockedBy: string[];
		agent?: string;
	}>;
}

interface CollectAssistantThinkingTraceDataOptions {
	answeredQuestionToolCallIds?: ReadonlySet<string> | readonly string[];
	treatQuestionToolCallsAsAnswered?: boolean;
	thinkingToolCalls?: ThinkingToolCallSummary[];
}

interface ResolveThinkingToolCallStepOpenOptions {
	toolCallId: string;
	manuallyOpenedToolCallIds: ReadonlySet<string>;
}

const QUESTIONS_ANSWERED_OUTPUT = "Questions answered.";

function getAnsweredQuestionToolCallIdSet(
	value: ReadonlySet<string> | readonly string[] | undefined,
): ReadonlySet<string> {
	if (!value) {
		return new Set();
	}

	return value instanceof Set ? value : new Set(value);
}

function isAnsweredQuestionToolCall(
	toolCall: ThinkingToolCallSummary,
	answeredToolCallIds: ReadonlySet<string>,
	treatQuestionToolCallsAsAnswered: boolean,
): boolean {
	if (!isRequestUserInputToolName(toolCall.toolName)) {
		return false;
	}

	if (treatQuestionToolCallsAsAnswered) {
		return true;
	}

	if (answeredToolCallIds.has(toolCall.id)) {
		return true;
	}

	return toolCall.toolCallId ? answeredToolCallIds.has(toolCall.toolCallId) : false;
}

function resolveAnsweredQuestionToolCalls(
	thinkingToolCalls: readonly ThinkingToolCallSummary[],
	options: Readonly<CollectAssistantThinkingTraceDataOptions>,
): {
	hasAnsweredQuestionToolCalls: boolean;
	thinkingToolCalls: ThinkingToolCallSummary[];
} {
	const answeredToolCallIds = getAnsweredQuestionToolCallIdSet(
		options.answeredQuestionToolCallIds,
	);
	const treatQuestionToolCallsAsAnswered =
		options.treatQuestionToolCallsAsAnswered === true;
	let hasAnsweredQuestionToolCalls = false;

	const resolvedThinkingToolCalls = thinkingToolCalls.map((toolCall) => {
		const isAnswered = isAnsweredQuestionToolCall(
			toolCall,
			answeredToolCallIds,
			treatQuestionToolCallsAsAnswered,
		);
		if (!isAnswered) {
			return toolCall;
		}

		hasAnsweredQuestionToolCalls = true;
		if (toolCall.state !== "awaiting-input") {
			return toolCall;
		}

		return {
			...toolCall,
			state: "completed" as const,
			output: QUESTIONS_ANSWERED_OUTPUT,
			outputPreview: QUESTIONS_ANSWERED_OUTPUT,
			errorText: undefined,
		};
	});

	return {
		hasAnsweredQuestionToolCalls,
		thinkingToolCalls: resolvedThinkingToolCalls,
	};
}

export function resolveThinkingToolCallStepOpen({
	toolCallId,
	manuallyOpenedToolCallIds,
}: Readonly<ResolveThinkingToolCallStepOpenOptions>): boolean {
	return manuallyOpenedToolCallIds.has(toolCallId);
}

export function resolveAssistantThinkingTraceOpen({
	allowAutoOpen = true,
	hasThinkingToolCalls,
	reasoningPhase,
	userOpenOverride,
}: Readonly<ResolveAssistantThinkingTraceOpenOptions>): boolean {
	if (userOpenOverride !== null) {
		return userOpenOverride;
	}

	if (!allowAutoOpen) {
		return false;
	}

	return (
		hasThinkingToolCalls &&
		(reasoningPhase === "preload" || reasoningPhase === "thinking")
	);
}

export function resolveAssistantThinkingTraceResponseGenerationStep({
	hasAwaitingInputToolCalls,
	hasThinkingToolCalls,
	hasWidgetOutput = false,
	isPostToolsGeneration = false,
	isPostToolsResultPending = false,
}: Readonly<ResolveAssistantThinkingTraceResponseGenerationStepOptions>): boolean {
	return (
		hasThinkingToolCalls &&
		!hasAwaitingInputToolCalls &&
		!hasWidgetOutput &&
		(isPostToolsGeneration || isPostToolsResultPending)
	);
}

export function shouldCollapseAssistantThinkingTraceOnPhaseChange({
	previousReasoningPhase,
	reasoningPhase,
}: Readonly<ShouldCollapseAssistantThinkingTraceOptions>): boolean {
	return previousReasoningPhase !== "completed" && reasoningPhase === "completed";
}

export function resolveAssistantThinkingTraceVisibility({
	isThinkingActive,
	isResponseInFlight,
	wasLatched,
}: Readonly<ResolveAssistantThinkingTraceVisibilityOptions>): ResolveAssistantThinkingTraceVisibilityResult {
	const nextLatched = isThinkingActive ? true : isResponseInFlight ? wasLatched : false;

	return {
		effectiveIsThinkingActive:
			isThinkingActive || (nextLatched && isResponseInFlight),
		nextLatched,
	};
}

export function resolveAssistantThinkingTracePhase({
	isThinkingActive,
	hasTurnComplete,
	isThinkingLifecycleStreaming,
	hasBackendThinkingActivity,
	hasAwaitingInputToolCalls,
	isPostToolsGeneration = false,
	isPostToolsResultPending = false,
	hasWidgetOutput = false,
	lifecyclePhase,
}: Readonly<ResolveAssistantThinkingTracePhaseOptions>): ReasoningPhase {
	if (!isThinkingActive) {
		return "idle";
	}

	if (hasAwaitingInputToolCalls) {
		return "thinking";
	}

	if (!hasBackendThinkingActivity) {
		return isThinkingLifecycleStreaming ? "preload" : "idle";
	}

	if (hasWidgetOutput) {
		return "completed";
	}

	if (isPostToolsGeneration) {
		return "thinking";
	}

	if (isPostToolsResultPending) {
		return "thinking";
	}

	if (hasTurnComplete && !isThinkingLifecycleStreaming) {
		return "completed";
	}

	return lifecyclePhase;
}

export function collectAssistantThinkingTraceData(
	message: Pick<RovoUIMessage, "parts">,
	options: Readonly<CollectAssistantThinkingTraceDataOptions> = {},
): AssistantThinkingTraceData {
	const thinkingStatusParts = getAllDataParts(message, "data-thinking-status");
	const thinkingEventParts = getAllDataParts(message, "data-thinking-event");
	const rawThinkingToolCalls =
		options.thinkingToolCalls ?? getThinkingToolCallSummaries(message);
	const {
		hasAnsweredQuestionToolCalls,
		thinkingToolCalls,
	} = resolveAnsweredQuestionToolCalls(rawThinkingToolCalls, options);
	const thinkingNarrationMap = buildThinkingNarrationMap(message);
	const latestTodoProgress = getLatestRovoAppTodoProgress(thinkingToolCalls);
	const todoProgressItems = latestTodoProgress?.items ?? [];
	const latestTodoQueue = getLatestTodoQueue(message);
	const todoQueueItems = latestTodoQueue?.items ?? [];
	const agentExecutions = getAgentExecutionSummaries(message);
	const lastThinkingStatusPart =
		thinkingStatusParts[thinkingStatusParts.length - 1] ?? null;
	const lastThinkingEventPart =
		thinkingEventParts[thinkingEventParts.length - 1] ?? null;
	const hasThinkingStatusPart = thinkingStatusParts.length > 0;
	const hasThinkingEvents = thinkingEventParts.length > 0;
	const hasThinkingToolCalls = thinkingToolCalls.length > 0;
	const hasAwaitingInputToolCalls = thinkingToolCalls.some(
		(toolCall) => toolCall.state === "awaiting-input"
	);
	const hasTodoProgressItems = todoProgressItems.length > 0;
	const hasLegacyTodoQueueItems = !hasTodoProgressItems && todoQueueItems.length > 0;
	const hasAgentExecutions = agentExecutions.length > 0;
	const hasTraceDataSignals =
		hasThinkingEvents ||
		hasTodoProgressItems ||
		hasLegacyTodoQueueItems ||
		hasAgentExecutions;
	const hasBackendThinkingActivity =
		hasThinkingStatusPart ||
		hasThinkingEvents ||
		hasThinkingToolCalls ||
		hasTodoProgressItems ||
		hasLegacyTodoQueueItems ||
		hasAgentExecutions;

	return {
		agentExecutions,
		hasAgentExecutions,
		hasAnsweredQuestionToolCalls,
		hasAwaitingInputToolCalls,
		hasBackendThinkingActivity,
		hasLegacyTodoQueueItems,
		hasThinkingEvents,
		hasThinkingStatusPart,
		hasThinkingToolCalls,
		hasTodoProgressItems,
		hasTraceDataSignals,
		lastThinkingEventPart,
		lastThinkingStatusPart,
		thinkingEventParts,
		thinkingNarrationMap,
		thinkingStatusParts,
		thinkingToolCalls,
		todoProgressItems,
		todoQueueItems,
	};
}
