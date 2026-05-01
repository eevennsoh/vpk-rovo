"use client";

import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import {
	Conversation,
	ConversationContent,
	type ConversationContextValue,
} from "@/components/ui-ai/conversation";
import { Message } from "@/components/ui-ai/message";
import {
	AdsReasoningTrigger,
	Reasoning,
} from "@/components/ui-ai/reasoning";
import { cn } from "@/lib/utils";
import { MessageTurns } from "@/components/projects/shared/message-turns";
import { ThreadMessage } from "@/components/projects/shared/thread-message";
import {
	isRenderableRovoUIMessage,
	type RovoUIMessage,
	type RovoRenderableUIMessage,
} from "@/lib/rovo-ui-messages";
import { PreloadThinkingIndicator } from "./preload-thinking-indicator";
import { StreamingThinkingIndicator } from "./streaming-thinking-indicator";
import { useStreamingIndicatorState } from "@/components/projects/shared/hooks/use-streaming-indicator";
import {
	getAwaitingUserResponseLabel,
	getDefaultThinkingLabel,
} from "@/components/projects/shared/lib/reasoning-labels";
import styles from "./chat-messages.module.css";

export interface ChatMessagesProps {
	uiMessages: RovoUIMessage[];
	onSuggestedQuestionClick?: (question: string) => void;
	onDeleteMessage?: (messageId: string) => void;
	conversationContextRef: React.RefObject<ConversationContextValue | null>;
	scrollSpacerRef?: React.RefObject<HTMLDivElement | null>;
	contentTopPadding?: string;
	contentBottomPadding?: string;
	hideScrollbar?: boolean;
	isStreaming?: boolean;
	isSubmitPending?: boolean;
	messageMode?: "plan" | "ask";
	reasoningContent?: string;
	streamingIndicatorVariant?: "thinking" | "reasoning-expanded";
	streamingIndicatorMessages?: RovoUIMessage[];
	showAwaitingIndicator?: boolean;
	awaitingIndicatorLabel?: string;
	showFeedbackActions?: boolean;
	showFollowUpSuggestions?: boolean;
	showWidgetSections?: boolean;
	assistantStreamingRenderMode?: "rich" | "text-first";
	renderEmptyState?: () => ReactNode;
	renderWidget?: (
		widget: { type: string; data: unknown },
		message: RovoRenderableUIMessage
	) => ReactNode;
}

/**
 * Pixel offset from the top of the scroll container to position the latest
 * turn, giving visual breathing room above the newest message group.
 */
const LATEST_TURN_TOP_INSET_PX = 48;

/**
 * Calculate the scroll position that places the latest conversation turn near
 * the top of the viewport, dynamically adjusting a spacer element when the
 * content is too short to reach the desired offset naturally.
 */
function computeLatestTurnScrollTop(
	defaultTargetTop: number,
	scrollElement: HTMLElement,
	scrollSpacerRef?: React.RefObject<HTMLDivElement | null>
): number {
	const latestTurnElement = scrollElement.querySelector<HTMLElement>(
		"[data-rovo-latest-turn='true']"
	);
	if (!latestTurnElement) return defaultTargetTop;

	const scrollRect = scrollElement.getBoundingClientRect();
	const latestTurnRect = latestTurnElement.getBoundingClientRect();
	const rawTargetTop = scrollElement.scrollTop + (latestTurnRect.top - scrollRect.top);
	const desiredTargetTop = Math.max(0, rawTargetTop - LATEST_TURN_TOP_INSET_PX);

	const availableScrollRange = scrollElement.scrollHeight - scrollElement.clientHeight;
	const currentSpacerHeight = scrollSpacerRef?.current?.offsetHeight ?? 0;
	const availableScrollRangeWithoutSpacer = Math.max(
		0,
		availableScrollRange - currentSpacerHeight
	);
	const requiredSpacer = Math.max(
		0,
		desiredTargetTop - availableScrollRangeWithoutSpacer
	);

	if (scrollSpacerRef?.current) {
		scrollSpacerRef.current.style.height = `${requiredSpacer}px`;
	}

	const maxScrollTop = Math.max(
		0,
		scrollElement.scrollHeight - scrollElement.clientHeight
	);

	return Math.min(maxScrollTop, desiredTargetTop);
}

export function ChatMessages({
	uiMessages,
	onSuggestedQuestionClick,
	onDeleteMessage,
	conversationContextRef,
	scrollSpacerRef,
	contentTopPadding,
	contentBottomPadding,
	hideScrollbar = true,
	isStreaming = false,
	isSubmitPending = false,
	messageMode = "plan",
	reasoningContent,
	streamingIndicatorVariant = "thinking",
	streamingIndicatorMessages,
	showAwaitingIndicator = false,
	awaitingIndicatorLabel = getAwaitingUserResponseLabel(),
	showFeedbackActions,
	showFollowUpSuggestions,
	showWidgetSections: showWidgetSectionsProp,
	assistantStreamingRenderMode = "rich",
	renderEmptyState,
	renderWidget,
}: Readonly<ChatMessagesProps>): ReactNode {
	const renderableMessages = useMemo(
		() => uiMessages.filter(isRenderableRovoUIMessage),
		[uiMessages]
	);
	const isPureMode = messageMode === "ask";
	const shouldShowWidgetSections = showWidgetSectionsProp ?? !isPureMode;
	const thinkingLabel = getDefaultThinkingLabel();

	const lastAssistantMessageId = useMemo(() => {
		for (let i = renderableMessages.length - 1; i >= 0; i--) {
			if (renderableMessages[i].role === "assistant") {
				return renderableMessages[i].id;
			}
		}
		return null;
	}, [renderableMessages]);

	const indicator = useStreamingIndicatorState(uiMessages, {
		isStreaming,
		isSubmitPending,
		thinkingLabel,
		reasoningContent,
		streamingIndicatorVariant,
		streamingIndicatorMessages,
		lastAssistantMessageId,
	});

	const handleTargetScrollTop = useCallback(
		(defaultTargetTop: number, { scrollElement }: { scrollElement: HTMLElement }) =>
			computeLatestTurnScrollTop(defaultTargetTop, scrollElement, scrollSpacerRef),
		[scrollSpacerRef]
	);
	const isRequestInFlight = isStreaming || isSubmitPending;

	return (
		<Conversation
			className={cn("min-h-0 flex-1", hideScrollbar && styles.hideScrollbar)}
			contextRef={conversationContextRef}
			initial={false}
			targetScrollTop={handleTargetScrollTop}
		>
			<ConversationContent
				className="flex w-full shrink-0 flex-col gap-6 p-3"
				style={{
					paddingTop: contentTopPadding,
					paddingBottom: contentBottomPadding ?? "80px",
				}}
			>
				{renderableMessages.length === 0 ? (
					renderEmptyState?.() ?? null
				) : (
					<MessageTurns
						isUserMessage={(message) => message.role === "user"}
						getTurnContainerClassName={() => "w-full"}
						getTurnContainerStyle={(_turn, turnIndex) => ({
							marginTop: turnIndex > 0 ? "24px" : "0",
						})}
						getMessageContainerStyle={(message, messageIndex, turn) => {
							return {
								display: "flex",
								justifyContent: message.role === "user" ? "flex-end" : "flex-start",
								marginTop:
									message.role === "assistant" &&
									messageIndex > 0 &&
									(
										turn[messageIndex - 1]?.role === "user" ||
										turn[messageIndex - 1]?.role === "assistant"
									)
										? "24px"
										: "0",
							};
						}}
						latestTurnClassName={styles.latestTurn}
						latestTurnDataAttribute="data-rovo-latest-turn"
						messages={renderableMessages}
						renderMessage={(message) => {
							const shouldShowFeedback = showFeedbackActions ?? true;
							const shouldShowSuggestions = showFollowUpSuggestions ?? true;
							return (
								<ThreadMessage.Root
									message={message}
									surface="fullscreen"
									isThinkingLifecycleStreaming={
										isRequestInFlight && message.id === lastAssistantMessageId
									}
									assistantStreamingRenderMode={assistantStreamingRenderMode}
									onDeleteMessage={onDeleteMessage}
									renderWidget={shouldShowWidgetSections ? renderWidget : undefined}
								>
									<ThreadMessage.Reasoning />
									<ThreadMessage.ThinkingStatus />
									<ThreadMessage.Widget position="before-content" />
									<ThreadMessage.Content />
									{shouldShowFeedback ? <ThreadMessage.Feedback /> : null}
									{!isPureMode ? (
										<>
											<ThreadMessage.Tools />
											<ThreadMessage.ToolFirstWarning />
										</>
									) : null}
									<ThreadMessage.Sources />
									{shouldShowSuggestions ? (
										<ThreadMessage.Suggestions onSuggestionClick={onSuggestedQuestionClick} />
									) : null}
									<ThreadMessage.Widget position="after-content" />
								</ThreadMessage.Root>
							);
						}}
					/>
				)}
				{indicator.shouldShowPreloader ? (
					<div className="flex justify-start">
						<PreloadThinkingIndicator />
					</div>
				) : null}
				{indicator.shouldShowThinkingStatus ? (
					<StreamingThinkingIndicator
						reasoningKey={indicator.reasoningKey}
						label={indicator.resolvedLabel}
						hasDetails={indicator.shouldUseExpanded && indicator.hasDetails}
						hasReasoningContent={indicator.hasContent}
						trimmedReasoningContent={indicator.trimmedContent}
						hasThinkingToolCalls={indicator.hasToolCalls}
						thinkingToolCalls={indicator.thinkingToolCalls}
						allowAutoCollapse={indicator.allowAutoCollapse}
						lastMessageId={indicator.lastSourceMessageId}
						containerClassName="flex justify-start"
						phaseProps={indicator.reasoningPhaseProps}
					/>
				) : null}
				{!indicator.shouldShowPreloader && !indicator.shouldShowThinkingStatus && showAwaitingIndicator ? (
					<div className="flex justify-start">
						<Message from="assistant" className="max-w-full">
							<Reasoning className="mb-0" isStreaming>
								<AdsReasoningTrigger label={awaitingIndicatorLabel} showChevron={false} streaming />
							</Reasoning>
						</Message>
					</div>
				) : null}
				<div ref={scrollSpacerRef} aria-hidden className="h-0 shrink-0" />
			</ConversationContent>
		</Conversation>
	);
}
