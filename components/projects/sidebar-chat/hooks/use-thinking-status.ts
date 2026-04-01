import { useMemo } from "react";
import {
	getAllDataParts,
	getMessageReasoningTimestamps,
	getMessageText,
	getThinkingToolCallSummaries,
	hasTurnCompleteSignal,
	type RovoRenderableUIMessage,
} from "@/lib/rovo-ui-messages";
import { useDynamicThinkingLabel } from "@/components/projects/shared/hooks/use-dynamic-thinking-label";
import {
	useReasoningPhase,
	getReasoningPropsForPhase,
	type ReasoningPhase,
	type ReasoningPhaseProps,
} from "@/components/projects/shared/hooks/use-reasoning-phase";
import {
	resolveThinkingLabelForSurface,
} from "@/components/projects/shared/lib/thinking-label-policy";
import { getDefaultThinkingLabel } from "@/components/projects/shared/lib/reasoning-labels";
import {
	resolveThinkingIndicatorVisibility,
} from "@/components/projects/shared/lib/reasoning-display-phase";

interface UseThinkingStatusOptions {
	messages: RovoRenderableUIMessage[];
	isRequestInFlight: boolean;
}

interface ThinkingStatusResult {
	shouldShowThinking: boolean;
	shouldShowPreloader: boolean;
	shouldShowThinkingStatus: boolean;
	hasBackendThinkingStarted: boolean;
	isAssistantAwaitingOutput: boolean;
	hasInlineThinkingStatus: boolean;
	resolvedThinkingLabel: string;
	trimmedReasoningContent: string;
	hasReasoningContent: boolean;
	thinkingToolCalls: ReturnType<typeof getThinkingToolCallSummaries>;
	hasThinkingToolCalls: boolean;
	hasThinkingDetails: boolean;
	allowAutoCollapse: boolean;
	streamingReasoningKey: string;
	lastMessage: RovoRenderableUIMessage | undefined;
	reasoningPhase: ReasoningPhase;
	reasoningPhaseProps: ReasoningPhaseProps;
}

export function useThinkingStatus({
	messages,
	isRequestInFlight,
}: Readonly<UseThinkingStatusOptions>): ThinkingStatusResult {
	const hasMessages = messages.length > 0;
	const lastMessage = messages[messages.length - 1];
	const isAssistantMessage = lastMessage?.role === "assistant";

	const isAssistantAwaitingOutput =
		isRequestInFlight &&
		hasMessages &&
		isAssistantMessage &&
		getMessageText(lastMessage) === "";
	const thinkingStatusParts = isAssistantMessage
		? getAllDataParts(lastMessage, "data-thinking-status")
		: [];
	const thinkingStatusPart =
		thinkingStatusParts[thinkingStatusParts.length - 1] ?? null;
	const hasAssistantThinkingStatus = thinkingStatusPart !== null;

	const thinkingEventParts = isAssistantMessage
		? getAllDataParts(lastMessage, "data-thinking-event")
		: [];
	const lastThinkingEventPart =
		thinkingEventParts[thinkingEventParts.length - 1] ?? null;
	const thinkingToolCalls = isAssistantMessage
		? getThinkingToolCallSummaries(lastMessage)
		: [];
	const hasThinkingToolCalls = thinkingToolCalls.length > 0;
	const hasBackendThinkingStarted =
		hasAssistantThinkingStatus ||
		thinkingEventParts.length > 0 ||
		hasThinkingToolCalls;
	const hasTurnComplete =
		isAssistantMessage ? hasTurnCompleteSignal(lastMessage) : false;

	// When the last message's turn is complete, its thinking-status is from
	// a finished turn and should not suppress the external preloader for a
	// new in-flight request (e.g. after a hidden clarification submit).
	const hasInlineThinkingStatus =
		isAssistantMessage && hasAssistantThinkingStatus && !hasTurnComplete;
	const hasActiveThinkingSignals = hasBackendThinkingStarted && !hasTurnComplete;
	const isThinkingStreaming = isRequestInFlight && hasActiveThinkingSignals;

	// Detect the gap after a hidden message submit (e.g. clarification answer)
	// where the request is in flight but no new assistant message has appeared
	// yet. The last visible message is a completed assistant from the prior turn.
	const isWaitingForNewTurn =
		isAssistantMessage && hasTurnComplete;

	const shouldShowThinking =
		isRequestInFlight &&
		!hasInlineThinkingStatus &&
		(
			(hasMessages &&
				(lastMessage?.role === "user" || isAssistantAwaitingOutput || isWaitingForNewTurn)) ||
			!hasMessages
		);

	const thinkingStatusUpdateSignal = useMemo(
		() =>
			[
				lastMessage?.id ?? "stream",
				`status-count:${thinkingStatusParts.length}`,
				`status-id:${thinkingStatusPart?.id ?? ""}`,
				`status-label:${thinkingStatusPart?.data.label ?? ""}`,
				`status-content:${thinkingStatusPart?.data.content ?? ""}`,
				`event-count:${thinkingEventParts.length}`,
				`event-id:${lastThinkingEventPart?.data.eventId ?? ""}`,
				`event-phase:${lastThinkingEventPart?.data.phase ?? ""}`,
			].join("|"),
		[
			lastMessage?.id,
			thinkingStatusParts.length,
			thinkingStatusPart?.id,
			thinkingStatusPart?.data.label,
			thinkingStatusPart?.data.content,
			thinkingEventParts.length,
			lastThinkingEventPart?.data.eventId,
			lastThinkingEventPart?.data.phase,
		]
	);

	const { label: dynamicThinkingLabel } = useDynamicThinkingLabel({
		baseLabel: thinkingStatusPart?.data.label ?? getDefaultThinkingLabel(),
		isStreaming: isThinkingStreaming,
		updateSignal: thinkingStatusUpdateSignal,
		fallbackLabel: getDefaultThinkingLabel(),
	});

	const resolvedReasoningContent = hasAssistantThinkingStatus
		? thinkingStatusParts
				.map((part) => part.data.content)
				.filter(Boolean)
				.join("\n\n")
		: "";

	const trimmedReasoningContent = resolvedReasoningContent.trim();
	const hasReasoningContent = trimmedReasoningContent.length > 0;
	const hasThinkingDetails = hasReasoningContent || hasThinkingToolCalls;
	const streamingReasoningKey = lastMessage?.id ?? "stream";
	const reasoningTimestamps = lastMessage
		? getMessageReasoningTimestamps(lastMessage)
		: {};

	const { phase: reasoningPhase, duration: reasoningDuration } =
		useReasoningPhase({
			isStreaming: isThinkingStreaming,
			hasMessageText: hasActiveThinkingSignals,
			responseKey: streamingReasoningKey,
			autoIdle: true,
			minPreloadMs: 0,
			persistedStartTime: reasoningTimestamps.startedAt,
			persistedEndTime: reasoningTimestamps.completedAt,
		});
	const resolvedThinkingLabel = resolveThinkingLabelForSurface({
		baseLabel: dynamicThinkingLabel,
		surface: "sidebar",
		reasoningPhase,
	});
	const visibility = resolveThinkingIndicatorVisibility({
		requestActive: shouldShowThinking,
		hasThinkingStatusInline: hasInlineThinkingStatus,
		hasBackendThinkingActivity: hasActiveThinkingSignals,
		reasoningPhase,
	});

	const reasoningPhaseProps = getReasoningPropsForPhase(
		reasoningPhase,
		reasoningDuration,
		hasThinkingDetails
	);

	return {
		shouldShowThinking: visibility.shouldShowAny,
		shouldShowPreloader: visibility.shouldShowPreloader,
		shouldShowThinkingStatus: visibility.shouldShowThinkingStatus,
		hasBackendThinkingStarted,
		isAssistantAwaitingOutput,
		hasInlineThinkingStatus,
		resolvedThinkingLabel,
		trimmedReasoningContent,
		hasReasoningContent,
		thinkingToolCalls,
		hasThinkingToolCalls,
		hasThinkingDetails,
		allowAutoCollapse: hasTurnComplete,
		streamingReasoningKey,
		lastMessage,
		reasoningPhase,
		reasoningPhaseProps,
	};
}
