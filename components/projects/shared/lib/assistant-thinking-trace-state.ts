import type { ReasoningPhase } from "../hooks/use-reasoning-phase";
import {
	buildThinkingNarrationMap,
	getAgentExecutionSummaries,
	getAllDataParts,
	getLatestTodoQueue,
	getThinkingToolCallSummaries,
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
	hasWidgetOutput?: boolean;
	lifecyclePhase: ReasoningPhase;
}

interface ResolveAssistantThinkingTraceVisibilityResult {
	effectiveIsThinkingActive: boolean;
	nextLatched: boolean;
}

export interface AssistantThinkingTraceData {
	agentExecutions: AgentExecutionSummary[];
	hasAgentExecutions: boolean;
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
	thinkingToolCalls?: ThinkingToolCallSummary[];
}

interface ResolveThinkingToolCallStepOpenOptions {
	toolCallId: string;
	autoOpenToolCallId: string | null;
	manuallyOpenedToolCallIds: ReadonlySet<string>;
	manuallyClosedToolCallIds: ReadonlySet<string>;
}

export function getLatestThinkingToolCallId(
	thinkingToolCalls: ReadonlyArray<ThinkingToolCallSummary>,
): string | null {
	return thinkingToolCalls.at(-1)?.id ?? null;
}

export function resolveThinkingToolCallStepOpen({
	toolCallId,
	autoOpenToolCallId,
	manuallyOpenedToolCallIds,
	manuallyClosedToolCallIds,
}: Readonly<ResolveThinkingToolCallStepOpenOptions>): boolean {
	if (manuallyOpenedToolCallIds.has(toolCallId)) {
		return true;
	}

	return toolCallId === autoOpenToolCallId && !manuallyClosedToolCallIds.has(toolCallId);
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
	hasWidgetOutput = false,
	lifecyclePhase,
}: Readonly<ResolveAssistantThinkingTracePhaseOptions>): ReasoningPhase {
	if (!isThinkingActive) {
		return "idle";
	}

	if (hasAwaitingInputToolCalls) {
		return "thinking";
	}

	if (hasTurnComplete && !isThinkingLifecycleStreaming) {
		return "completed";
	}

	if (!hasBackendThinkingActivity) {
		return isThinkingLifecycleStreaming ? "preload" : "idle";
	}

	if (isPostToolsGeneration) {
		return "thinking";
	}

	if (hasWidgetOutput) {
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
	const thinkingToolCalls =
		options.thinkingToolCalls ?? getThinkingToolCallSummaries(message);
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
