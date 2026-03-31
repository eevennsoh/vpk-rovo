"use client";

import { useEffect, useMemo, useCallback, useRef, useState, type CSSProperties } from "react";
import { useRovoChat } from "@/app/contexts";
import { token } from "@/lib/tokens";
import type { SendPromptOptions } from "@/app/contexts";
import { Conversation, ConversationContent } from "@/components/ui-ai/conversation";
import { MessageTurns } from "@/components/projects/shared/message-turns";
import { isRenderableRovoUIMessage } from "@/lib/rovo-ui-messages";
import {
	buildClarificationMessageMetadata,
	buildClarificationDismissPrompt,
	buildClarificationSummaryPrompt,
	createClarificationSubmission,
	getLatestQuestionCardPayload,
	type ClarificationAnswers,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import { buildGenerativeWidgetSubmitPrompt, type GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import type { GenerativeCardAnimationProps } from "@/components/projects/shared/components/generative-widget-card";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { QuestionCardShortcutsFooter } from "@/components/projects/shared/components/question-card-shortcuts-footer";
import { useDismissibleCards } from "@/components/projects/shared/hooks/use-dismissible-cards";
import type { RovoSuggestion } from "@/lib/rovo-suggestions";
import ChatHeader from "./components/chat-header";
import ChatGreeting from "./components/chat-greeting";
import ChatComposer from "./components/chat-composer";
import MessageBubble from "./components/message-bubble";
import { StreamingThinkingIndicator } from "./components/streaming-thinking-indicator";
import { PreloadThinkingIndicator } from "@/components/projects/shared/components/preload-thinking-indicator";
import { chatStyles } from "./data/styles";
import { useChatSubmit } from "./hooks/use-chat-submit";
import { useScrollAnchor } from "./hooks/use-scroll-anchor";
import { useThinkingStatus } from "./hooks/use-thinking-status";
import styles from "./chat.module.css";

interface ChatPanelCardsProps {
	generativeAnimation?: GenerativeCardAnimationProps;
}

interface ChatPanelGreetingProps {
	heading?: string;
	illustrationSrc?: string;
	illustrationDarkSrc?: string;
	suggestions?: ReadonlyArray<RovoSuggestion>;
}

interface ChatPanelProps {
	onClose: () => void;
	sendPromptOptions?: SendPromptOptions;
	enableSmartWidgets?: boolean;
	cards?: ChatPanelCardsProps;
	greeting?: ChatPanelGreetingProps;
	hideHeader?: boolean;
	containerClassName?: string;
	containerStyle?: CSSProperties;
}

const COMPACT_CHAT_WIDTH_MAX = 520;
const REGULAR_CHAT_WIDTH_MAX = 900;

type SmartWidthClass = "compact" | "regular" | "wide";

function getSmartWidthClass(widthPx: number): SmartWidthClass {
	if (widthPx <= COMPACT_CHAT_WIDTH_MAX) return "compact";
	if (widthPx <= REGULAR_CHAT_WIDTH_MAX) return "regular";
	return "wide";
}

export default function ChatPanel({
	onClose,
	sendPromptOptions,
	enableSmartWidgets = false,
	cards,
	greeting,
	hideHeader = false,
	containerClassName,
	containerStyle,
}: Readonly<ChatPanelProps>): React.ReactElement {
	const { resetChat, uiMessages: rawUiMessages, sendPrompt } = useRovoChat();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const [containerWidthPx, setContainerWidthPx] = useState<number | null>(null);
	const [viewportWidthPx, setViewportWidthPx] = useState<number | null>(null);

	useEffect(() => {
		const updateViewportWidth = () => {
			if (typeof window === "undefined") return;
			const width = Math.max(1, Math.round(window.innerWidth));
			setViewportWidthPx((prev) => (prev === width ? prev : width));
		};

		updateViewportWidth();
		window.addEventListener("resize", updateViewportWidth);
		return () => window.removeEventListener("resize", updateViewportWidth);
	}, []);

	useEffect(() => {
		const panelElement = panelRef.current;
		if (!panelElement) return;

		const updateContainerWidth = (widthValue: number) => {
			const width = Math.max(1, Math.round(widthValue));
			setContainerWidthPx((prev) => (prev === width ? prev : width));
		};

		updateContainerWidth(panelElement.getBoundingClientRect().width);

		if (typeof ResizeObserver !== "function") return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			updateContainerWidth(entry.contentRect.width);
		});

		observer.observe(panelElement);
		return () => observer.disconnect();
	}, []);

	const resolvedSendPromptOptions = useMemo(() => {
		if (!sendPromptOptions?.smartGeneration) return sendPromptOptions;

		const widthSource = containerWidthPx ?? viewportWidthPx;
		const widthClass = widthSource ? getSmartWidthClass(widthSource) : undefined;

		return {
			...sendPromptOptions,
			smartGeneration: {
				...sendPromptOptions.smartGeneration,
				containerWidthPx: containerWidthPx ?? undefined,
				viewportWidthPx: viewportWidthPx ?? undefined,
				widthClass,
			},
		};
	}, [containerWidthPx, sendPromptOptions, viewportWidthPx]);

	const { prompt, setPrompt, handleSubmit, submitPrompt, abort, uiMessages, isStreaming, hasInFlightTurn, isSubmitPending, queuedPrompts, removeQueuedPrompt } = useChatSubmit({
		defaultPromptOptions: resolvedSendPromptOptions,
	});
	const isStreamingLifecycleActive = isStreaming || isSubmitPending;
	const isRequestInFlight = hasInFlightTurn;

	const messages = useMemo(() => uiMessages.filter(isRenderableRovoUIMessage), [uiMessages]);
	const lastAssistantMessageId = useMemo(() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].role === "assistant") {
				return messages[i].id;
			}
		}
		return null;
	}, [messages]);

	const activeQuestionCard = useMemo(() => getLatestQuestionCardPayload(rawUiMessages), [rawUiMessages]);
	const handleClarificationDismiss = useCallback(
		(questionCard: ParsedQuestionCardPayload) => {
			const dismissPrompt = buildClarificationDismissPrompt(questionCard);
			void sendPrompt(dismissPrompt, {
				...resolvedSendPromptOptions,
				messageMetadata: {
					...(resolvedSendPromptOptions?.messageMetadata ?? {}),
					...buildClarificationMessageMetadata(questionCard, {
						status: "dismissed",
					}),
				},
			});
		},
		[resolvedSendPromptOptions, sendPrompt],
	);

	const {
		shouldShowQuestionCard: shouldShowQuestionCardRaw,
		activeQuestionCardKey,
		hideQuestionCard,
		dismissQuestionCard,
	} = useDismissibleCards({
		activeQuestionCard,
		onDismissQuestionCard: handleClarificationDismiss,
	});
	const shouldShowQuestionCard = !isRequestInFlight && shouldShowQuestionCardRaw;

	const { conversationContextRef, scrollSpacerRef, getLatestTurnTargetTop } = useScrollAnchor({ uiMessages });

	const thinking = useThinkingStatus({
		messages,
		isRequestInFlight,
	});

	useEffect(() => {
		return () => abort();
	}, [abort]);

	const hasMessages = messages.length > 0;

	const handleClarificationSubmit = useCallback(
		(answers: ClarificationAnswers) => {
			if (!activeQuestionCard) return;

			const clarificationSubmission = createClarificationSubmission(activeQuestionCard, answers);
			const clarificationPrompt = buildClarificationSummaryPrompt(activeQuestionCard, answers);

			const clarificationMetadata = {
				...(resolvedSendPromptOptions?.messageMetadata ?? {}),
				...buildClarificationMessageMetadata(activeQuestionCard, {
					answers,
					status: "answered",
				}),
			};

			void sendPrompt(clarificationPrompt, {
				...resolvedSendPromptOptions,
				messageMetadata: clarificationMetadata,
				clarification: clarificationSubmission,
			});
		},
		[activeQuestionCard, resolvedSendPromptOptions, sendPrompt],
	);

	const handleFollowUpSuggestionClick = useCallback((question: string) => void submitPrompt(question), [submitPrompt]);

	const handleGreetingSuggestionClick = useCallback(
		(suggestion: RovoSuggestion) => {
			const existingContext = resolvedSendPromptOptions?.contextDescription?.trim();
			const suggestionContext = suggestion.contextDescription?.trim();
			const mergedContext = suggestionContext ? [existingContext, suggestionContext].filter(Boolean).join("\n\n") : existingContext;

			const hasSeparatePrompt = suggestion.prompt && suggestion.prompt !== suggestion.label;

			void sendPrompt(suggestion.prompt ?? suggestion.label, {
				...resolvedSendPromptOptions,
				contextDescription: mergedContext,
				messageMetadata: {
					...resolvedSendPromptOptions?.messageMetadata,
					...(hasSeparatePrompt ? { displayLabel: suggestion.label } : {}),
				},
			});
		},
		[resolvedSendPromptOptions, sendPrompt],
	);

	const handleWidgetPrimaryAction = useCallback(
		(payload: GenerativeWidgetPrimaryActionPayload) => {
			void submitPrompt(buildGenerativeWidgetSubmitPrompt(payload));
		},
		[submitPrompt],
	);

	const messagesContainerStyle = {
		...chatStyles.messagesContainer,
		justifyContent: hasMessages ? "flex-start" : "flex-end",
		flex: hasMessages ? "0 0 auto" : chatStyles.messagesContainer.flex,
		minHeight: "100%",
		paddingBottom: hasMessages ? chatStyles.messagesContainer.paddingBottom : token("space.400"),
	};

	return (
		<div ref={panelRef} className={containerClassName} style={{ ...chatStyles.chatPanel, ...containerStyle }}>
			{!hideHeader && (
				<div>
					<ChatHeader onClose={onClose} onNewChat={resetChat} />
				</div>
			)}

			<Conversation className="min-h-0 flex-1" contextRef={conversationContextRef} initial={false} targetScrollTop={getLatestTurnTargetTop}>
				<ConversationContent className="gap-0 p-0" style={messagesContainerStyle}>
					{messages.length === 0 ? (
						<div style={chatStyles.emptyState}>
							<ChatGreeting
								heading={greeting?.heading}
								illustrationSrc={greeting?.illustrationSrc}
								illustrationDarkSrc={greeting?.illustrationDarkSrc}
								suggestions={greeting?.suggestions}
								onSuggestionClick={handleGreetingSuggestionClick}
							/>
						</div>
					) : (
						<MessageTurns
							isUserMessage={(message) => message.role === "user"}
							getTurnContainerStyle={(_turn, turnIndex) => ({
								marginTop: turnIndex > 0 ? "24px" : "0",
							})}
							getMessageContainerClassName={(message) => (message.role === "assistant" ? "[&:empty]:hidden" : undefined)}
							getMessageContainerStyle={(message, messageIndex, turn) => {
								return {
									paddingLeft: message.role === "assistant" ? "12px" : "0",
									paddingRight: message.role === "assistant" ? "12px" : "0",
									marginTop: message.role === "assistant" && messageIndex > 0 && (turn[messageIndex - 1]?.role === "user" || turn[messageIndex - 1]?.role === "assistant") ? "24px" : "0",
								};
							}}
							latestTurnClassName={styles.latestTurn}
							latestTurnDataAttribute="data-chat-latest-turn"
							messages={messages}
							renderMessage={(message) => (
								<MessageBubble
									message={message}
									isThinkingLifecycleStreaming={isStreamingLifecycleActive && message.id === lastAssistantMessageId}
									onSuggestionClick={handleFollowUpSuggestionClick}
									enableSmartWidgets={enableSmartWidgets}
									generativeCardAnimation={cards?.generativeAnimation}
									onWidgetPrimaryAction={handleWidgetPrimaryAction}
								/>
							)}
						/>
					)}
					{thinking.shouldShowPreloader ? (
						<div style={chatStyles.thinkingContainer}>
							<PreloadThinkingIndicator />
						</div>
					) : null}
					{thinking.shouldShowThinkingStatus ? (
						<StreamingThinkingIndicator
							reasoningKey={thinking.streamingReasoningKey}
							label={thinking.resolvedThinkingLabel}
							hasDetails={thinking.hasThinkingDetails}
							hasReasoningContent={thinking.hasReasoningContent}
							trimmedReasoningContent={thinking.trimmedReasoningContent}
							hasThinkingToolCalls={thinking.hasThinkingToolCalls}
							thinkingToolCalls={thinking.thinkingToolCalls}
							allowAutoCollapse={thinking.allowAutoCollapse}
							lastMessageId={thinking.lastMessage?.id}
							containerStyle={chatStyles.thinkingContainer}
							phaseProps={thinking.reasoningPhaseProps}
						/>
					) : null}
					{hasMessages ? <div ref={scrollSpacerRef} aria-hidden style={{ height: 0, flexShrink: 0 }} /> : null}
				</ConversationContent>
			</Conversation>

			<div>
				{shouldShowQuestionCard && activeQuestionCard ? (
					<>
						<div className="px-3">
							<ClarificationQuestionCard
								key={activeQuestionCardKey ?? undefined}
								questionCard={activeQuestionCard}
								onSubmit={(answers) => {
									handleClarificationSubmit(answers);
									hideQuestionCard();
								}}
								onDismiss={dismissQuestionCard}
							/>
						</div>
						<QuestionCardShortcutsFooter />
					</>
				) : (
					<ChatComposer
						prompt={prompt}
						isStreaming={isStreamingLifecycleActive}
						hasInFlightTurn={hasInFlightTurn}
						queuedPrompts={queuedPrompts}
						onPromptChange={setPrompt}
						onSubmit={handleSubmit}
						onStop={abort}
						onRemoveQueuedPrompt={removeQueuedPrompt}
					/>
				)}
			</div>
		</div>
	);
}
