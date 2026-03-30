"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useDynamicThinkingLabel } from "@/components/projects/shared/hooks/use-dynamic-thinking-label";
import {
	getAllDataParts,
	hasCreatePlanSkillSignal,
	hasTurnCompleteSignal,
	getLatestDataPart,
	getLatestRouteDecision,
	getMessageReasoning,
	getMessageSources,
	getMessageText,
	getThinkingToolCallSummaries,
	getToolFirstWarning,
	getMessageToolParts,
	isMessageTextStreaming,
	type RovoRenderableUIMessage,
	type RoutingDecision,
} from "@/lib/rovo-ui-messages";
import {
	useReasoningPhase,
	type ReasoningPhase,
} from "@/components/projects/shared/hooks/use-reasoning-phase";
import {
	Message as UiMessage,
} from "@/components/ui-ai/message";
import {
	extractPlanRenderableText,
	removeActionItemsSection,
	removeLeadingSingleCharacterFragment,
	removeTrailingSingleCharacterLine,
	sanitizeMarkdownArtifactMarkers,
} from "../lib/message-text-utils";
import {
	sanitizeQuestionCardMessageText,
	shouldSuppressQuestionCardMessageText,
} from "./lib/question-card-text-visibility";
import { parsePlanWidgetPayload } from "../lib/plan-widget";
import { buildPlanDescriptionFallback } from "./lib/plan-description-fallback";
import { resolveThinkingLabelForSurface } from "../lib/thinking-label-policy";
import {
	getAwaitingUserResponseLabel,
	getDefaultThinkingLabel,
	REASONING_LABELS,
} from "../lib/reasoning-labels";
import { UserMessageBubble } from "../components/user-message-bubble";
import { ThreadMessageContext, type ThreadMessageContextValue } from "./thread-message-context";
import {
	getNormalizedWidgetDataParts,
	selectLatestRenderableWidgetPart,
} from "./lib/widget-selection";
import { filterThinkingToolCallsForVisibleWidget } from "./lib/thinking-tool-visibility";
import {
	isPostToolsGenuiGeneration as resolvePostToolsGenuiGeneration,
	isThinkingStatusActive as resolveThinkingStatusActive,
	isThinkingStatusLifecycleStreaming as resolveThinkingStatusLifecycleStreaming,
} from "./lib/thinking-status-state";

interface ThreadMessageRootProps {
	message: RovoRenderableUIMessage;
	surface: "sidebar" | "fullscreen";
	isThinkingLifecycleStreaming?: boolean;
	assistantStreamingRenderMode?: "rich" | "text-first";
	onDeleteMessage?: (messageId: string) => void;
	renderWidget?: (
		widget: { type: string; data: unknown },
		message: RovoRenderableUIMessage
	) => ReactNode;
	renderLoadingWidget?: (widgetType?: string) => ReactNode;
	children: ReactNode;
}

function useThreadMessageDerived(
	message: RovoRenderableUIMessage,
	surface: "sidebar" | "fullscreen",
	isThinkingLifecycleStreaming: boolean,
	assistantStreamingRenderMode: "rich" | "text-first",
	renderWidget: ThreadMessageRootProps["renderWidget"],
	renderLoadingWidget: ThreadMessageRootProps["renderLoadingWidget"],
): ThreadMessageContextValue {
	const rawMessageText = getMessageText(message);
	const isStreaming = isMessageTextStreaming(message);

	// ---------- widget loading state (needed for thinking status) ----------
	const widgetLoadingPart = getLatestDataPart(message, "data-widget-loading");
	const loadingWidgetType =
		typeof widgetLoadingPart?.data.type === "string"
			? widgetLoadingPart.data.type
			: null;
	const isAnyWidgetLoading = widgetLoadingPart?.data.loading ?? false;
	const widgetDataParts = getNormalizedWidgetDataParts(message);
	const latestWidgetDataEntry =
		widgetDataParts.length > 0
			? widgetDataParts[widgetDataParts.length - 1]
			: null;

	// ---------- thinking status ----------
	const thinkingStatusPart = getLatestDataPart(message, "data-thinking-status");
	const allThinkingStatusParts = getAllDataParts(message, "data-thinking-status");
	const thinkingEventParts = getAllDataParts(message, "data-thinking-event");
	const lastThinkingEventPart =
		thinkingEventParts[thinkingEventParts.length - 1] ?? null;
	const thinkingStatusUpdateSignal = [
		message.id,
		`status-label:${thinkingStatusPart?.data.label ?? ""}`,
		`status-content:${thinkingStatusPart?.data.content ?? ""}`,
		`event-count:${thinkingEventParts.length}`,
		`event-id:${lastThinkingEventPart?.data.eventId ?? ""}`,
		`event-phase:${lastThinkingEventPart?.data.phase ?? ""}`,
	].join("|");
	const isRetryThinkingStatus =
		thinkingStatusPart?.data.label?.includes("Retrying") ?? false;
	const isThinkingStatusActive = resolveThinkingStatusActive({
		hasThinkingStatusPart: Boolean(thinkingStatusPart),
		hasThinkingEvents: thinkingEventParts.length > 0,
		isRetryThinkingStatus,
		isStreaming,
	});

	// Latch: prevent thinking-status flicker during streaming.
	// Once active, hold it active while the response is in-flight.
	// Parts can transiently disappear when the AI SDK reconstructs the message.
	const thinkingStatusLatchRef = useRef(false);
	if (isThinkingStatusActive) {
		thinkingStatusLatchRef.current = true;
	}
	const isResponseInFlight = isStreaming || isThinkingLifecycleStreaming;
	if (!isResponseInFlight) {
		thinkingStatusLatchRef.current = false;
	}
	const effectiveIsThinkingStatusActive =
		isThinkingStatusActive ||
		(thinkingStatusLatchRef.current && isResponseInFlight);

	const { label: dynamicThinkingStatusLabel } = useDynamicThinkingLabel({
		baseLabel: thinkingStatusPart?.data.label ?? getDefaultThinkingLabel(),
		isStreaming: isThinkingLifecycleStreaming && effectiveIsThinkingStatusActive,
		updateSignal: thinkingStatusUpdateSignal,
	});

	// ---------- widget data (remaining) ----------
	const widgetErrorPart = getLatestDataPart(message, "data-widget-error");
	const widgetErrorType =
		typeof widgetErrorPart?.data.type === "string"
			? widgetErrorPart.data.type
			: null;
	const suggestedQuestionsPart = getLatestDataPart(
		message,
		"data-suggested-questions"
	);
	const shouldShowWidgetSections = Boolean(renderWidget) || Boolean(renderLoadingWidget);
	const selectedWidgetDataEntry = selectLatestRenderableWidgetPart(
		widgetDataParts,
		shouldShowWidgetSections && typeof renderWidget === "function"
			? (widgetDataPart) => {
					const candidateIsLoading =
						isAnyWidgetLoading && loadingWidgetType === widgetDataPart.widgetType;
					const shouldRenderCandidateWhileLoading =
						widgetDataPart.widgetType === "genui-preview" ||
						widgetDataPart.widgetType === "question-card";
					const shouldSkipCandidate =
						(candidateIsLoading && !shouldRenderCandidateWhileLoading) ||
						(widgetDataPart.widgetType === "plan" && isStreaming);
					if (shouldSkipCandidate) {
						return false;
					}

					const candidateNode = renderWidget(
						{
							type: widgetDataPart.widgetType,
							data: widgetDataPart.part.data.payload,
						},
						message,
					);
					return candidateNode !== null && candidateNode !== undefined;
				}
			: undefined,
	);
	const widgetDataPart = selectedWidgetDataEntry?.part ?? null;
	const widgetType =
		selectedWidgetDataEntry?.widgetType ??
		latestWidgetDataEntry?.widgetType ??
		loadingWidgetType ??
		widgetErrorType ??
		undefined;
	const isWidgetLoading =
		isAnyWidgetLoading && (widgetType ? loadingWidgetType === widgetType : true);
	const hasWidgetPayload = Boolean(widgetDataPart);
	const hasWidgetOutput = hasWidgetPayload && !isWidgetLoading;

	// ---------- widget loading timeout ----------
	const [widgetLoadingTimedOut, setWidgetLoadingTimedOut] = useState(false);

	useEffect(() => {
		if (!isWidgetLoading) {
			setWidgetLoadingTimedOut(false);
			return;
		}
		const timer = setTimeout(() => {
			setWidgetLoadingTimedOut(true);
		}, 30_000);
		return () => clearTimeout(timer);
	}, [isWidgetLoading]);

	// ---------- route decision ----------
	const routeDecision: RoutingDecision | null = getLatestRouteDecision(message);
	const isFallbackTextRoute = routeDecision?.confidence !== undefined && routeDecision.confidence < 0.3;

	// ---------- message text processing ----------
	const normalizedWidgetText = widgetType
		? removeLeadingSingleCharacterFragment(rawMessageText)
		: rawMessageText;
	const isCreatePlanSkillFlow = hasCreatePlanSkillSignal(message);
	const planRenderableText =
		widgetType === "plan"
			? extractPlanRenderableText(normalizedWidgetText, {
					maxSummaryLines: 2,
				})
			: null;
	const baseMessageText =
		widgetType === "question-card"
			? removeTrailingSingleCharacterLine(normalizedWidgetText)
			: widgetType === "plan"
				? isCreatePlanSkillFlow
					? planRenderableText?.text ?? ""
					: removeActionItemsSection(normalizedWidgetText)
				: normalizedWidgetText;

	// ---------- derived data ----------
	const suggestedQuestions = suggestedQuestionsPart?.data.questions ?? [];
	const reasoning = getMessageReasoning(message);
	const sources = getMessageSources(message);
	const toolFirstWarning = getToolFirstWarning(message);
	const toolParts = getMessageToolParts(message);
	const thinkingToolCalls = getThinkingToolCallSummaries(message);
	const visibleThinkingToolCalls = filterThinkingToolCallsForVisibleWidget({
		thinkingToolCalls,
		widgetType,
	});
	const hasAnyThinkingToolCalls = thinkingToolCalls.length > 0;
	const hasRunningThinkingToolCalls = thinkingToolCalls.some(
		(toolCall) =>
			toolCall.state === "running" ||
			toolCall.state === "approval-requested"
	);
	const hasAwaitingInputToolCalls = thinkingToolCalls.some(
		(toolCall) => toolCall.state === "awaiting-input"
	);
	const isPostToolsGenuiGeneration = resolvePostToolsGenuiGeneration({
		widgetType,
		isWidgetLoading,
		hasAnyToolCalls: hasAnyThinkingToolCalls,
		hasRunningToolCalls: hasRunningThinkingToolCalls,
	});
	const messageTextBeforeSanitization = baseMessageText;
	const sanitizedMessageText = sanitizeMarkdownArtifactMarkers(
		messageTextBeforeSanitization
	);
	const questionCardMessageText =
		widgetType === "question-card"
			? sanitizeQuestionCardMessageText({
					widgetPayload: widgetDataPart?.data.payload,
					messageText: sanitizedMessageText,
				})
			: sanitizedMessageText;
	const thinkingToolCallsForStatus =
		toolParts.length > 0 ? [] : visibleThinkingToolCalls;
	const hasBackendThinkingActivity =
		Boolean(thinkingStatusPart) ||
		thinkingEventParts.length > 0 ||
		thinkingToolCalls.length > 0 ||
		toolParts.length > 0;
	const isThinkingStatusStreaming =
		resolveThinkingStatusLifecycleStreaming({
			isThinkingLifecycleStreaming,
			isThinkingStatusActive: effectiveIsThinkingStatusActive,
			hasBackendThinkingActivity,
		});
	const {
		phase: thinkingStatusLifecyclePhase,
		duration: thinkingStatusDuration,
	} = useReasoningPhase({
		isStreaming: isThinkingStatusStreaming,
		hasMessageText: hasBackendThinkingActivity,
		responseKey: `${message.id}:thinking-status`,
		autoIdle: false,
		minPreloadMs: 0,
	});
	const hasTurnComplete = hasTurnCompleteSignal(message);
	const hasToolFirstWarning =
		Boolean(toolFirstWarning?.message) && !isStreaming;

	// ---------- widget rendering ----------
	const isPlanWidgetFlow =
		widgetType === "plan" ||
		widgetLoadingPart?.data.type === "plan" ||
		widgetErrorPart?.data.type === "plan";
	const shouldSuppressStreamingText =
		shouldShowWidgetSections &&
		isStreaming &&
		Boolean(isPlanWidgetFlow) &&
		isCreatePlanSkillFlow &&
		assistantStreamingRenderMode !== "text-first";
	const thinkingStatusReasoningPhase: ReasoningPhase = (() => {
		if (!effectiveIsThinkingStatusActive) return "idle";
		if (hasAwaitingInputToolCalls) return "thinking";
		if (hasTurnComplete && !isThinkingLifecycleStreaming) return "completed";
		if (!hasBackendThinkingActivity) return isStreaming ? "preload" : "idle";
		if (isPostToolsGenuiGeneration) return "thinking";
		if (hasWidgetOutput) return "completed";
		return thinkingStatusLifecyclePhase;
	})();
	const baseThinkingStatusLabel = hasAwaitingInputToolCalls
		? getAwaitingUserResponseLabel()
		: isPostToolsGenuiGeneration
			? REASONING_LABELS.trigger.generatingResults
			: dynamicThinkingStatusLabel;
	const resolvedThinkingStatusLabel = resolveThinkingLabelForSurface({
		baseLabel: baseThinkingStatusLabel,
		surface,
		reasoningPhase: thinkingStatusReasoningPhase,
	});
	const parsedPlanWidgetPayload =
		widgetType === "plan" && widgetDataPart
			? parsePlanWidgetPayload(widgetDataPart.data.payload)
			: null;
	const planDescriptionFallback =
		widgetType === "plan" && parsedPlanWidgetPayload
			? buildPlanDescriptionFallback({
					messageText: normalizedWidgetText,
					planPayload: parsedPlanWidgetPayload,
				})
			: "";
	const planWidgetPayloadForRender =
		parsedPlanWidgetPayload &&
		(!parsedPlanWidgetPayload.description ||
			parsedPlanWidgetPayload.description.trim().length === 0) &&
		planDescriptionFallback.length > 0
			? {
					...parsedPlanWidgetPayload,
					description: planDescriptionFallback,
				}
			: parsedPlanWidgetPayload;
	const widgetPayloadForRender =
		widgetType === "plan"
			? planWidgetPayloadForRender ?? widgetDataPart?.data.payload
			: widgetDataPart?.data.payload;
	// GenUI payload can arrive before the trailing loading=false event.
	// Keep the card renderable when payload exists to avoid "stuck spinner" regressions.
	const shouldRenderWidgetWhileLoading =
		(widgetType === "genui-preview" || widgetType === "question-card") &&
		hasWidgetPayload;
	const renderedWidget =
		shouldShowWidgetSections &&
		widgetDataPart &&
		(!isWidgetLoading || shouldRenderWidgetWhileLoading) &&
		(widgetType !== "plan" || !isStreaming)
			? renderWidget?.(
					{
						type: widgetType ?? "widget",
						data: widgetPayloadForRender,
					},
					message
				) ?? null
			: null;
	const shouldHideLoadingWidget =
		(widgetType === "genui-preview" || widgetType === "question-card") &&
		hasWidgetPayload;
	const loadingWidgetNode =
		shouldShowWidgetSections && isWidgetLoading && !shouldHideLoadingWidget
			? widgetLoadingTimedOut &&
					(widgetType === "question-card" || widgetType === "genui-preview")
				? (
						<div className="rounded-xl border border-border-warning/40 bg-bg-warning-subtler px-3 py-2 text-sm text-text-warning">
							This widget is taking longer than expected to load. Use Stop and try
							again, or wait if the assistant is still generating.
						</div>
					)
				: widgetLoadingTimedOut
					? null
					: renderLoadingWidget?.(widgetType) ?? null
			: null;
	const shouldRenderPlanWidgetFirst = widgetType === "plan";
	const hasRenderedWidget =
		renderedWidget !== null && renderedWidget !== undefined;
	const shouldSuppressQuestionCardText = shouldSuppressQuestionCardMessageText({
		shouldShowWidgetSections,
		widgetType,
		isStreaming,
		widgetPayload: widgetPayloadForRender,
		messageText: questionCardMessageText,
	});
	const shouldSuppressPlanTextForWidget =
		shouldShowWidgetSections &&
		widgetType === "plan" &&
		hasRenderedWidget;
	const shouldSuppressTextForWidget =
		shouldSuppressStreamingText ||
		shouldSuppressPlanTextForWidget ||
		(widgetType === "plan" &&
			isCreatePlanSkillFlow &&
			isWidgetLoading) ||
		shouldSuppressQuestionCardText ||
		(
			shouldShowWidgetSections &&
			(widgetType === "genui-preview" || widgetType === "audio-preview") &&
			!isFallbackTextRoute &&
			(hasWidgetPayload || isWidgetLoading)
		);
	const shouldRenderMessageText =
		Boolean(questionCardMessageText) && !shouldSuppressTextForWidget;
	const shouldRenderPlainTextWhileStreaming =
		isStreaming && assistantStreamingRenderMode === "text-first";

	return useMemo<ThreadMessageContextValue>(
		() => ({
			message,
			surface,
			assistantStreamingRenderMode,
			messageText: questionCardMessageText,
			rawMessageText,
			isStreaming,
			reasoning,
			thinkingStatusPart,
			allThinkingStatusParts,
			resolvedThinkingStatusLabel,
			isThinkingStatusActive: effectiveIsThinkingStatusActive,
			thinkingStatusReasoningPhase,
			thinkingStatusDuration,
			hasTurnComplete,
			isPostToolsGenuiGeneration,
			thinkingToolCallsForStatus,
			sources,
			toolParts,
			toolFirstWarning,
			hasToolFirstWarning,
			suggestedQuestions,
			renderedWidget,
			loadingWidgetNode,
			widgetType,
			isWidgetLoading,
			widgetLoadingTimedOut,
			shouldRenderPlanWidgetFirst,
			hasRenderedWidget,
			shouldRenderMessageText,
			shouldRenderPlainTextWhileStreaming,
			routeDecision,
			isFallbackTextRoute,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps -- stable key fields + thinking signals for progressive streaming
		[
			message.id,
			surface,
			isStreaming,
			questionCardMessageText,
			widgetType,
			isWidgetLoading,
			widgetLoadingTimedOut,
			effectiveIsThinkingStatusActive,
			thinkingStatusReasoningPhase,
			thinkingStatusDuration,
			hasTurnComplete,
			isPostToolsGenuiGeneration,
			hasToolFirstWarning,
			suggestedQuestions.length,
			routeDecision?.reason,
			thinkingStatusUpdateSignal,
			resolvedThinkingStatusLabel,
			isThinkingLifecycleStreaming,
		]
	);
}

export function ThreadMessageRoot({
	message,
	surface,
	isThinkingLifecycleStreaming = false,
	assistantStreamingRenderMode = "rich",
	onDeleteMessage,
	renderWidget,
	renderLoadingWidget,
	children,
}: Readonly<ThreadMessageRootProps>): ReactNode {
	const contextValue = useThreadMessageDerived(
		message,
		surface,
		isThinkingLifecycleStreaming,
		assistantStreamingRenderMode,
		renderWidget,
		renderLoadingWidget,
	);

	if (message.role === "user") {
		const displayLabel = message.metadata?.displayLabel;
		return (
			<UserMessageBubble
				messageText={displayLabel || contextValue.rawMessageText}
				metadata={message.metadata}
				onDelete={
					onDeleteMessage
						? () => onDeleteMessage(message.id)
						: undefined
				}
			/>
		);
	}

	const hasRenderableReasoning =
		Boolean(contextValue.reasoning) &&
		!contextValue.isThinkingStatusActive;
	const hasRenderableTools =
		contextValue.toolParts.length > 0 &&
		!contextValue.isThinkingStatusActive;
	const hasRenderableSuggestions =
		!contextValue.isStreaming &&
		contextValue.suggestedQuestions.length > 0 &&
		!contextValue.hasRenderedWidget;
	const hasRenderableWidget =
		Boolean(contextValue.loadingWidgetNode) ||
		contextValue.hasRenderedWidget;
	const hasRenderableContent =
		contextValue.shouldRenderMessageText ||
		hasRenderableReasoning ||
		contextValue.isThinkingStatusActive ||
		contextValue.hasToolFirstWarning ||
		hasRenderableTools ||
		contextValue.sources.length > 0 ||
		hasRenderableSuggestions ||
		hasRenderableWidget;

	if (!hasRenderableContent) {
		return null;
	}

	return (
		<ThreadMessageContext value={contextValue}>
			<UiMessage from="assistant" className="max-w-full">
				{children}
			</UiMessage>
		</ThreadMessageContext>
	);
}
