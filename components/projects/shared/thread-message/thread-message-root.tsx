"use client";

import { useMemo, type ReactNode } from "react";
import {
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
	Message as UiMessage,
} from "@/components/ui-custom/message";
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
import { UserMessageBubble } from "../components/user-message-bubble";
import { useAssistantThinkingTraceState } from "../components/assistant-thinking-trace";
import { ThreadMessageContext, type ThreadMessageContextValue } from "./thread-message-context";
import {
	getNormalizedWidgetDataParts,
	selectLatestRenderableWidgetPart,
} from "./lib/widget-selection";
import { filterThinkingToolCallsForVisibleWidget } from "./lib/thinking-tool-visibility";
import {
	isPostToolsGenuiGeneration as resolvePostToolsGenuiGeneration,
} from "./lib/thinking-status-state";

interface ThreadMessageRootProps {
	message: RovoRenderableUIMessage;
	surface: "sidebar" | "fullscreen";
	isThinkingLifecycleStreaming?: boolean;
	assistantStreamingRenderMode?: "rich" | "text-first";
	onDeleteMessage?: (messageId: string) => void;
	editingMessageId?: string | null;
	onEditMessage?: (messageId: string, nextText: string) => Promise<void> | void;
	onSetEditingMessageId?: (messageId: string | null) => void;
	showUserMessagePromptActions?: boolean;
	renderWidget?: (
		widget: { type: string; data: unknown },
		message: RovoRenderableUIMessage
	) => ReactNode;
	children: ReactNode;
}

function useThreadMessageDerived(
	message: RovoRenderableUIMessage,
	surface: "sidebar" | "fullscreen",
	isThinkingLifecycleStreaming: boolean,
	assistantStreamingRenderMode: "rich" | "text-first",
	renderWidget: ThreadMessageRootProps["renderWidget"],
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
	const shouldShowWidgetSections = Boolean(renderWidget);
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
	const hasArtifactResult = Boolean(getLatestDataPart(message, "data-artifact-result"));
	const hasAgentResult = Boolean(getLatestDataPart(message, "data-agent-result"));
	const isPostToolsGenuiGeneration = resolvePostToolsGenuiGeneration({
		widgetType,
		isWidgetLoading,
		hasAnyToolCalls: hasAnyThinkingToolCalls,
		hasRunningToolCalls: hasRunningThinkingToolCalls,
	});
	const isResponseInFlight = isStreaming || isThinkingLifecycleStreaming || isWidgetLoading;
	const isPostToolsResultPending = (
		isResponseInFlight &&
		hasAnyThinkingToolCalls &&
		!hasRunningThinkingToolCalls &&
		!hasArtifactResult &&
		!hasAgentResult
	);
	const isRetryThinkingStatus =
		getLatestDataPart(message, "data-thinking-status")?.data.label?.includes("Retrying") ?? false;
	const thinkingToolCallsForStatus =
		toolParts.length > 0 ? [] : visibleThinkingToolCalls;
	const thinkingTraceState = useAssistantThinkingTraceState({
		message,
		isThinkingLifecycleStreaming,
		isResponseInFlight,
		isPostToolsGeneration: isPostToolsGenuiGeneration,
		isPostToolsResultPending,
		hasWidgetOutput,
		isRetryThinkingStatus,
		thinkingToolCalls: thinkingToolCallsForStatus,
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
			(
				widgetType === "genui-preview" ||
				widgetType === "audio-preview" ||
				widgetType === "video-preview"
			) &&
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
			thinkingTraceState,
			thinkingStatusPart: thinkingTraceState.data.lastThinkingStatusPart,
			allThinkingStatusParts: thinkingTraceState.data.thinkingStatusParts,
			resolvedThinkingStatusLabel: thinkingTraceState.triggerLabel,
			isThinkingStatusActive: thinkingTraceState.thinkingActive,
			thinkingStatusReasoningPhase: thinkingTraceState.reasoningPhase,
			thinkingStatusDuration: thinkingTraceState.reasoningDuration,
			hasTurnComplete,
			isPostToolsGenuiGeneration,
			thinkingToolCallsForStatus,
			sources,
			toolParts,
			toolFirstWarning,
			hasToolFirstWarning,
			suggestedQuestions,
			renderedWidget,
			widgetType,
			isWidgetLoading,
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
			thinkingTraceState,
			hasTurnComplete,
			isPostToolsGenuiGeneration,
			hasToolFirstWarning,
			suggestedQuestions.length,
			routeDecision?.reason,
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
	editingMessageId,
	onEditMessage,
	onSetEditingMessageId,
	showUserMessagePromptActions = false,
	renderWidget,
	children,
}: Readonly<ThreadMessageRootProps>): ReactNode {
	const contextValue = useThreadMessageDerived(
		message,
		surface,
		isThinkingLifecycleStreaming,
		assistantStreamingRenderMode,
		renderWidget,
	);

	if (message.role === "user") {
		const displayLabel = message.metadata?.displayLabel;
		const attachments = message.parts.filter((part) => part.type === "file");
		return (
			<UserMessageBubble
				attachments={attachments}
				messageText={displayLabel || contextValue.rawMessageText}
				metadata={message.metadata}
				isEditing={editingMessageId === message.id}
				onDelete={
					onDeleteMessage
						? () => onDeleteMessage(message.id)
						: undefined
				}
				onEdit={
					onEditMessage
						? (nextText) => onEditMessage(message.id, nextText)
						: undefined
				}
				onStartEdit={
					onSetEditingMessageId
						? () => onSetEditingMessageId(message.id)
						: undefined
				}
				onCancelEdit={
					onSetEditingMessageId
						? () => onSetEditingMessageId(null)
						: undefined
				}
				showPromptActions={showUserMessagePromptActions}
			/>
		);
	}

	const hasRenderableReasoning =
		Boolean(contextValue.reasoning) &&
		!contextValue.isThinkingStatusActive;
	const hasRenderableTools =
		contextValue.toolParts.length > 0;
	const hasRenderableSuggestions =
		!contextValue.isStreaming &&
		contextValue.suggestedQuestions.length > 0 &&
		!contextValue.hasRenderedWidget;
	const hasRenderableContent =
		contextValue.shouldRenderMessageText ||
		hasRenderableReasoning ||
		contextValue.isThinkingStatusActive ||
		contextValue.hasToolFirstWarning ||
		hasRenderableTools ||
		contextValue.sources.length > 0 ||
		hasRenderableSuggestions ||
		contextValue.hasRenderedWidget;

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
