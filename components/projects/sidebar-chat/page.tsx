"use client";

import { useEffect, useMemo, useCallback, useRef, useState, type CSSProperties } from "react";
import { DEFAULT_REASONING_OPTION_ID } from "@/components/blocks/shared-ui/data/customize-menu-data";
import { useRovoChat } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import type { ChatContextBarDescriptor } from "./lib/chat-context-bar";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ui-custom/conversation";
import { MessageTurns } from "@/components/projects/shared/message-turns";
import { isRenderableRovoUIMessage } from "@/lib/rovo-ui-messages";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import {
	buildClarificationMessageMetadata,
	buildClarificationDismissPrompt,
	buildClarificationSummaryPrompt,
	createClarificationSubmission,
	getLatestQuestionCardPayload,
	type ClarificationAnswers,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	getLatestPendingPlanWidget,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import {
	getPlanApprovalKeyFromPlanWidget,
	type PlanApprovalSelection,
} from "@/components/projects/shared/lib/plan-approval";
import { buildGenerativeWidgetSubmitPrompt, type GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import type { GenerativeCardAnimationProps } from "@/components/projects/shared/components/generative-widget-card";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { QuestionCardShortcutsFooter } from "@/components/projects/shared/components/question-card-shortcuts-footer";
import { ApprovalCard } from "@/components/blocks/approval-card/page";
import { useDismissibleCards } from "@/components/projects/shared/hooks/use-dismissible-cards";
import type { RovoSuggestion } from "@/lib/rovo-suggestions";
import ChatHeader from "./components/chat-header";
import { ChatHistoryDrawer } from "./components/chat-history-drawer";
import ChatGreeting from "./components/chat-greeting";
import ChatComposer from "./components/chat-composer";
import MessageBubble from "./components/message-bubble";
import type { ArtifactResult } from "./components/artifact-result-card";
import { StreamingThinkingIndicator } from "./components/streaming-thinking-indicator";
import { PreloadThinkingIndicator } from "@/components/projects/shared/components/preload-thinking-indicator";
import { chatStyles } from "./data/styles";
import { cn } from "@/lib/utils";
import { useChatSubmit } from "./hooks/use-chat-submit";
import { useScrollAnchor } from "./hooks/use-scroll-anchor";
import { useThinkingStatus } from "./hooks/use-thinking-status";
import { type DelegationRequest, useRealtimeVoice } from "@/components/projects/rovo/hooks/use-realtime-voice";
import styles from "./chat.module.css";

interface ChatPanelCardsProps {
	generativeAnimation?: GenerativeCardAnimationProps;
}

export interface ChatPanelGreetingProps {
	heading?: string;
	illustrationSrc?: string;
	illustrationDarkSrc?: string;
	showHero?: boolean;
	suggestions?: ReadonlyArray<RovoSuggestion>;
}

interface ChatPanelProps {
	onClose: () => void;
	sendPromptOptions?: SendPromptOptions;
	enableSmartWidgets?: boolean;
	cards?: ChatPanelCardsProps;
	greeting?: ChatPanelGreetingProps;
	hideHeader?: boolean;
	abortOnUnmount?: boolean;
	containerClassName?: string;
	containerStyle?: CSSProperties;
	onSurfaceSwitch?: ChatSurfaceSwitchHandler;
	chatContextBar?: ChatContextBarDescriptor | null;
	onArtifactDialogOpen?: (artifact: ArtifactResult) => void;
	preserveFloatingSurfaceOnArtifactDialogOpen?: boolean;
}

const COMPACT_CHAT_WIDTH_MAX = 520;
const REGULAR_CHAT_WIDTH_MAX = 900;
const ARTIFACT_DIALOG_FLOATING_PIN_REASON = "sidebar-chat-artifact-dialog";

type SmartWidthClass = "compact" | "regular" | "wide";

type RealtimeTranscriptPayload =
	| string
	| {
			delta?: string;
			text?: string;
			transcript?: string;
	  };

function getSmartWidthClass(widthPx: number): SmartWidthClass {
	if (widthPx <= COMPACT_CHAT_WIDTH_MAX) return "compact";
	if (widthPx <= REGULAR_CHAT_WIDTH_MAX) return "regular";
	return "wide";
}

function getRealtimeTranscriptText(payload: RealtimeTranscriptPayload): string {
	if (typeof payload === "string") {
		return payload;
	}

	return payload.text ?? payload.transcript ?? payload.delta ?? "";
}

export default function ChatPanel({
	onClose,
	sendPromptOptions,
	enableSmartWidgets = false,
	cards,
	greeting,
	hideHeader = false,
	abortOnUnmount = true,
	containerClassName,
	containerStyle,
	onSurfaceSwitch,
	chatContextBar,
	onArtifactDialogOpen,
	preserveFloatingSurfaceOnArtifactDialogOpen = false,
}: Readonly<ChatPanelProps>): React.ReactElement {
	const {
		resetChat,
		uiMessages: rawUiMessages,
		sendPrompt,
		acceptPlanReview,
		submitPlanApproval,
		editMessage,
		editingMessageId,
		setEditingMessageId,
		chatSurface,
		activeThreadId,
		isHistoryOpen,
		pinFloating,
		toggleHistory,
		unpinFloating,
	} = useRovoChat();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const artifactDialogFloatingPinRef = useRef(false);
	const [containerWidthPx, setContainerWidthPx] = useState<number | null>(null);
	const [viewportWidthPx, setViewportWidthPx] = useState<number | null>(null);
	const [selectedReasoning, setSelectedReasoning] = useState(DEFAULT_REASONING_OPTION_ID);

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

	const {
		prompt,
		setPrompt,
		handleSubmit,
		submitPrompt,
		abort,
		uiMessages,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		activeRequestStartedAt,
		queuedPrompts,
		removeQueuedPrompt,
	} = useChatSubmit({
		defaultPromptOptions: resolvedSendPromptOptions,
	});
	const realtimeTranscriptRef = useRef("");
	const handleRealtimeSpeechStarted = useCallback(() => {
		realtimeTranscriptRef.current = "";
		setPrompt("");
	}, [setPrompt]);
	const handleRealtimeTranscript = useCallback((payload: RealtimeTranscriptPayload) => {
		const transcriptText = getRealtimeTranscriptText(payload);
		if (!transcriptText.trim()) {
			return;
		}

		realtimeTranscriptRef.current = transcriptText;
		setPrompt(transcriptText);
	}, [setPrompt]);
	const handleRealtimeDelegateToRovo = useCallback(
		(request: DelegationRequest) => {
			const promptText = request.prompt.trim();
			if (!promptText) {
				return;
			}

			const contextDescription = mergeRovoContextDescriptions(
				resolvedSendPromptOptions?.contextDescription,
				request.conversationSummary ? `[Voice context] ${request.conversationSummary}` : undefined,
			);
			const promptOptions = contextDescription
				? {
						...resolvedSendPromptOptions,
						contextDescription,
					}
				: resolvedSendPromptOptions;
			realtimeTranscriptRef.current = "";
			setPrompt("");
			void sendPrompt(promptText, promptOptions);
		},
		[resolvedSendPromptOptions, sendPrompt, setPrompt],
	);
	const realtime = useRealtimeVoice({
		chatMessages: uiMessages,
		isGenerating: isStreaming,
		onDelegateToRovo: handleRealtimeDelegateToRovo,
		onSpeechStarted: handleRealtimeSpeechStarted,
		onSpeechTranscriptCompleted: handleRealtimeTranscript,
		onSpeechTranscriptDelta: handleRealtimeTranscript,
	});
	const isRealtimeVoiceActive = realtime.voiceState !== "idle";
	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			realtimeTranscriptRef.current = "";
			setPrompt("");
			realtime.connect();
			return;
		}

		const transcriptToPreserve = realtime.currentTranscript || realtimeTranscriptRef.current;
		realtime.disconnect();
		if (transcriptToPreserve.trim()) {
			setPrompt(transcriptToPreserve);
		}
	}, [realtime, setPrompt]);
	const isStreamingLifecycleActive = isStreaming || isSubmitPending;
	const isRequestInFlight = hasInFlightTurn;
	const hasPendingChatWork = isRequestInFlight || queuedPrompts.length > 0;

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
	const activePendingPlan = useMemo(() => getLatestPendingPlanWidget(rawUiMessages), [rawUiMessages]);
	const [dismissedApprovalCardKey, setDismissedApprovalCardKey] = useState<string | null>(null);
	const [isSubmittingPlanApproval, setIsSubmittingPlanApproval] = useState(false);
	const pendingPlanKey = activePendingPlan?.planWidget.deferredToolCallId ?? null;
	const shouldShowApprovalCard =
		activePendingPlan !== null &&
		pendingPlanKey !== dismissedApprovalCardKey &&
		!shouldShowQuestionCard &&
		!isStreamingLifecycleActive;

	useEffect(() => {
		setDismissedApprovalCardKey(null);
		setIsSubmittingPlanApproval(false);
	}, [activeThreadId]);

	const { conversationContextRef, scrollSpacerRef, getLatestTurnTargetTop, scrollFollowMode } = useScrollAnchor({
		isGenerationActive: isStreamingLifecycleActive,
		uiMessages,
	});

	const thinking = useThinkingStatus({
		messages,
		isRequestInFlight,
		activeRequestStartedAt,
	});

	useEffect(() => {
		if (!abortOnUnmount) return;
		return () => abort();
	}, [abort, abortOnUnmount]);

	const releaseArtifactDialogFloatingPin = useCallback(() => {
		if (!artifactDialogFloatingPinRef.current) {
			return;
		}

		artifactDialogFloatingPinRef.current = false;
		unpinFloating(ARTIFACT_DIALOG_FLOATING_PIN_REASON);
	}, [unpinFloating]);

	useEffect(() => releaseArtifactDialogFloatingPin, [releaseArtifactDialogFloatingPin]);

	const hasMessages = messages.length > 0;
	const shouldHugEmptyGreeting = !hasMessages && greeting?.showHero === false;
	const shouldUseAutoMessageTrack = shouldHugEmptyGreeting && containerStyle?.display === "grid";
	const resolvedContainerStyle = shouldUseAutoMessageTrack
		? { ...containerStyle, gridTemplateRows: "auto auto" }
		: containerStyle;

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
	const handleBuildPlan = useCallback(
		(planWidget: ParsedPlanWidgetPayload) => {
			return acceptPlanReview(planWidget);
		},
		[acceptPlanReview],
	);
	const handlePlanApprovalSubmit = useCallback(
		(selection: PlanApprovalSelection) => {
			if (!activePendingPlan) return;
			setIsSubmittingPlanApproval(true);
			void submitPlanApproval(activePendingPlan.planWidget, selection)
				.finally(() => setIsSubmittingPlanApproval(false));
		},
		[activePendingPlan, submitPlanApproval],
	);
	const handleDismissApprovalCard = useCallback(() => {
		setDismissedApprovalCardKey(pendingPlanKey);
	}, [pendingPlanKey]);
	const resolvePlanBuildState = useCallback(
		(planWidget: ParsedPlanWidgetPayload, message: { id: string }) => {
			if (!planWidget.deferredToolCallId) {
				return {};
			}

			const isActivePendingPlan =
				activePendingPlan?.sourceMessageId === message.id &&
				getPlanApprovalKeyFromPlanWidget(activePendingPlan.planWidget) ===
					getPlanApprovalKeyFromPlanWidget(planWidget);
			if (isActivePendingPlan) {
				return {};
			}

			return {
				isBuildDisabled: true,
				buildDisabledReason: activePendingPlan
					? "A newer reply superseded this plan."
					: "This plan is no longer awaiting review.",
			};
		},
		[activePendingPlan],
	);

	const handleFollowUpSuggestionClick = useCallback((question: string) => void submitPrompt(question), [submitPrompt]);

	const handleGreetingSuggestionClick = useCallback(
		(suggestion: RovoSuggestion) => {
			const hasSeparatePrompt = suggestion.prompt && suggestion.prompt !== suggestion.label;

			void sendPrompt(suggestion.prompt ?? suggestion.label, {
				...resolvedSendPromptOptions,
				contextDescription: mergeRovoContextDescriptions(
					resolvedSendPromptOptions?.contextDescription,
					suggestion.contextDescription,
				),
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

	const handleArtifactDialogOpen = useCallback(
		(artifact: ArtifactResult) => {
			if (
				preserveFloatingSurfaceOnArtifactDialogOpen &&
				chatSurface === "floating" &&
				!artifactDialogFloatingPinRef.current
			) {
				artifactDialogFloatingPinRef.current = true;
				pinFloating(ARTIFACT_DIALOG_FLOATING_PIN_REASON);
			}

			onArtifactDialogOpen?.(artifact);
		},
		[
			chatSurface,
			onArtifactDialogOpen,
			pinFloating,
			preserveFloatingSurfaceOnArtifactDialogOpen,
		],
	);

	const messagesContainerStyle = {
		display: chatStyles.messagesContainer.display,
		flexDirection: chatStyles.messagesContainer.flexDirection,
		justifyContent: hasMessages || shouldHugEmptyGreeting ? "flex-start" : "flex-end",
		flex: hasMessages || shouldHugEmptyGreeting ? "0 0 auto" : chatStyles.messagesContainer.flex,
		minHeight: shouldHugEmptyGreeting ? "auto" : "100%",
	};

	return (
		<div ref={panelRef} className={cn("relative overflow-hidden", containerClassName)} style={{ ...chatStyles.chatPanel, ...resolvedContainerStyle }}>
			<ChatHistoryDrawer active={!hideHeader && chatSurface === "sidebar"} />
			{!hideHeader && (
				<div className="shrink-0">
					<ChatHeader
						isHistoryOpen={isHistoryOpen}
						onClose={onClose}
						onHistoryToggle={toggleHistory}
						onNewChat={resetChat}
						onSurfaceSwitch={onSurfaceSwitch}
					/>
				</div>
			)}

			<Conversation className="min-h-0 min-w-0 flex-1" contextRef={conversationContextRef} followMode={scrollFollowMode} initial={false} targetScrollTop={getLatestTurnTargetTop}>
				<ConversationContent
					className="mx-auto flex min-w-0 max-w-[800px] flex-col gap-4 px-4 py-6 md:gap-6"
					style={messagesContainerStyle}
				>
					{messages.length === 0 ? (
						<div className="w-full" style={chatStyles.emptyState}>
							<ChatGreeting
								heading={greeting?.heading}
								illustrationSrc={greeting?.illustrationSrc}
								illustrationDarkSrc={greeting?.illustrationDarkSrc}
								isMaxMode={selectedReasoning === "max"}
								showHero={greeting?.showHero}
								suggestions={greeting?.suggestions}
								onSuggestionClick={handleGreetingSuggestionClick}
							/>
						</div>
					) : (
						<MessageTurns
							isUserMessage={(message) => message.role === "user"}
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
									showFollowUpSuggestions={message.id === lastAssistantMessageId && !hasPendingChatWork}
									enableSmartWidgets={enableSmartWidgets}
									generativeCardAnimation={cards?.generativeAnimation}
									editingMessageId={editingMessageId}
									onEditMessage={(messageId, nextText) =>
										editMessage(messageId, nextText, resolvedSendPromptOptions)
									}
									onSetEditingMessageId={setEditingMessageId}
									onWidgetPrimaryAction={handleWidgetPrimaryAction}
									onBuildPlan={handleBuildPlan}
									resolvePlanBuildState={resolvePlanBuildState}
									onArtifactDialogOpen={handleArtifactDialogOpen}
									onArtifactDialogClose={releaseArtifactDialogFloatingPin}
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
				<ConversationScrollButton className="z-10 transition-all" />
			</Conversation>

			<div className="min-w-0 shrink-0">
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
				) : shouldShowApprovalCard && activePendingPlan ? (
					<>
						<ApprovalCard
							key={pendingPlanKey ?? undefined}
							onDismiss={handleDismissApprovalCard}
							onSelect={handlePlanApprovalSubmit}
							isSubmitting={isSubmittingPlanApproval}
						/>
						<QuestionCardShortcutsFooter escLabel="cancel" />
					</>
				) : (
					<>
						<ChatComposer
							prompt={prompt}
							isStreaming={isStreamingLifecycleActive}
							hasInFlightTurn={hasInFlightTurn}
							queuedPrompts={queuedPrompts}
							micStream={realtime.micStream}
							onPromptChange={setPrompt}
							onSubmit={handleSubmit}
							onStop={abort}
							onToggleRealtimeVoice={handleToggleRealtimeVoice}
							onRemoveQueuedPrompt={removeQueuedPrompt}
							onReasoningChange={setSelectedReasoning}
							realtimeVoiceActive={isRealtimeVoiceActive}
							selectedReasoning={selectedReasoning}
							chatContextBar={chatContextBar}
						/>
					</>
				)}
			</div>
		</div>
	);
}
