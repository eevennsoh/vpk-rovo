import { useMemo } from "react";
import {
	isRenderableRovoUIMessage,
	getMessageText,
	hasTurnCompleteSignal,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { collectAssistantThinkingTraceData } from "@/components/projects/shared/lib/assistant-thinking-trace-state";
import { useDynamicThinkingLabel } from "@/components/projects/shared/hooks/use-dynamic-thinking-label";
import {
	useReasoningPhase,
	getReasoningPropsForPhase,
	type ReasoningPhase,
	type ReasoningPhaseProps,
} from "@/components/projects/shared/hooks/use-reasoning-phase";
import { resolveThinkingLabelForSurface } from "@/components/projects/shared/lib/thinking-label-policy";
import {
	resolveThinkingIndicatorVisibility,
} from "@/components/projects/shared/lib/reasoning-display-phase";

interface UseStreamingIndicatorOptions {
	isStreaming: boolean;
	isSubmitPending: boolean;
	thinkingLabel: string;
	reasoningContent?: string;
	streamingIndicatorVariant: "thinking" | "reasoning-expanded";
	streamingIndicatorMessages?: RovoUIMessage[];
	lastAssistantMessageId: string | null;
}

export interface StreamingIndicatorState {
	shouldShow: boolean;
	shouldShowPreloader: boolean;
	shouldShowThinkingStatus: boolean;
	hasBackendThinkingStarted: boolean;
	resolvedLabel: string;
	reasoningKey: string;
	shouldUseExpanded: boolean;
	trimmedContent: string;
	hasContent: boolean;
	hasToolCalls: boolean;
	hasDetails: boolean;
	allowAutoCollapse: boolean;
	thinkingToolCalls: ReturnType<typeof collectAssistantThinkingTraceData>["thinkingToolCalls"];
	lastSourceMessageId?: string;
	reasoningPhase: ReasoningPhase;
	reasoningPhaseProps: ReasoningPhaseProps;
}

export function useStreamingIndicatorState(
	uiMessages: RovoUIMessage[],
	options: Readonly<UseStreamingIndicatorOptions>
): StreamingIndicatorState {
	const {
		isStreaming,
		isSubmitPending,
		thinkingLabel,
		reasoningContent,
		streamingIndicatorVariant,
		streamingIndicatorMessages,
		lastAssistantMessageId,
	} = options;

	const sourceMessages = useMemo(
		() =>
			(streamingIndicatorMessages ?? uiMessages).filter(isRenderableRovoUIMessage),
		[streamingIndicatorMessages, uiMessages]
	);
	const lastSource = sourceMessages[sourceMessages.length - 1];
	const isAssistantSource = lastSource?.role === "assistant";
	const isLastAssistantMessage = lastSource?.id === lastAssistantMessageId;

	const thinkingTraceData = isAssistantSource
		? collectAssistantThinkingTraceData(lastSource)
		: null;
	const thinkingStatusParts = thinkingTraceData?.thinkingStatusParts ?? [];
	const thinkingStatusPart =
		thinkingStatusParts[thinkingStatusParts.length - 1] ?? null;
	const hasThinkingStatus = thinkingStatusPart !== null;
	const thinkingEventParts = thinkingTraceData?.thinkingEventParts ?? [];
	const lastThinkingEventPart =
		thinkingEventParts[thinkingEventParts.length - 1] ?? null;
	const thinkingToolCalls = thinkingTraceData?.thinkingToolCalls ?? [];
	const hasToolCalls = thinkingToolCalls.length > 0;
	const hasBackendThinkingStarted =
		thinkingTraceData?.hasBackendThinkingActivity ?? false;
	const hasTurnComplete =
		isAssistantSource ? hasTurnCompleteSignal(lastSource) : false;

	const hasInlineThinkingStatus =
		Boolean(isAssistantSource) &&
		Boolean(isLastAssistantMessage) &&
		hasBackendThinkingStarted &&
		!hasTurnComplete;

	const isAwaitingOutput =
		isStreaming &&
		isAssistantSource &&
		getMessageText(lastSource) === "";

	const shouldShowFromStream =
		isStreaming &&
		sourceMessages.length > 0 &&
		!hasInlineThinkingStatus &&
		(lastSource?.role === "user" || isAwaitingOutput || hasBackendThinkingStarted);
	const shouldShow = shouldShowFromStream || isSubmitPending;
	const isThinkingStreaming = isStreaming && hasBackendThinkingStarted;

	const thinkingStatusUpdateSignal = [
		lastSource?.id ?? "stream",
		`status-count:${thinkingStatusParts.length}`,
		`status-id:${thinkingStatusPart?.id ?? ""}`,
		`status-label:${thinkingStatusPart?.data.label ?? ""}`,
		`status-content:${thinkingStatusPart?.data.content ?? ""}`,
		`event-count:${thinkingEventParts.length}`,
		`event-id:${lastThinkingEventPart?.data.eventId ?? ""}`,
		`event-phase:${lastThinkingEventPart?.data.phase ?? ""}`,
	].join("|");

	const { label: dynamicLabel } = useDynamicThinkingLabel({
		baseLabel: thinkingStatusPart?.data.label ?? thinkingLabel,
		isStreaming: isThinkingStreaming,
		updateSignal: thinkingStatusUpdateSignal,
		fallbackLabel: thinkingLabel,
	});

	const resolvedContent = hasThinkingStatus
		? thinkingStatusParts
				.map((part) => part.data.content)
				.filter(Boolean)
				.join("\n\n") || reasoningContent
		: reasoningContent;

	const trimmedContent = resolvedContent?.trim() ?? "";
	const hasContent = trimmedContent.length > 0;
	const hasDetails = hasContent || hasToolCalls;

	const reasoningKey = lastSource?.id ?? "stream";
	const { phase: reasoningPhase, duration: reasoningDuration } =
		useReasoningPhase({
			isStreaming: isThinkingStreaming,
			hasMessageText: hasBackendThinkingStarted,
			responseKey: reasoningKey,
			autoIdle: true,
			minPreloadMs: 0,
		});
	const visibility = resolveThinkingIndicatorVisibility({
		requestActive: shouldShow,
		hasThinkingStatusInline: hasInlineThinkingStatus,
		hasBackendThinkingActivity: hasBackendThinkingStarted,
		reasoningPhase,
	});

	const reasoningPhaseProps = getReasoningPropsForPhase(
		reasoningPhase,
		reasoningDuration,
		hasDetails
	);
	const resolvedLabel = resolveThinkingLabelForSurface({
		baseLabel: dynamicLabel,
		surface: "fullscreen",
		reasoningPhase,
	});

	return {
		shouldShow: visibility.shouldShowAny,
		shouldShowPreloader: visibility.shouldShowPreloader,
		shouldShowThinkingStatus: visibility.shouldShowThinkingStatus,
		hasBackendThinkingStarted,
		resolvedLabel,
		reasoningKey,
		shouldUseExpanded: streamingIndicatorVariant === "reasoning-expanded",
		trimmedContent,
		hasContent,
		hasToolCalls,
		hasDetails,
		allowAutoCollapse: hasTurnComplete,
		thinkingToolCalls,
		lastSourceMessageId: lastSource?.id,
		reasoningPhase,
		reasoningPhaseProps,
	};
}
