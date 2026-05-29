"use client";

import { useEffect, useMemo, useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageTurns } from "@/components/projects/shared/message-turns";
import {
	getMessageAgentResult,
	getMessageArtifactResult,
	hasTurnCompleteSignal,
	isRenderableRovoUIMessage,
	type RovoDataParts,
} from "@/lib/rovo-ui-messages";
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
import { ArtifactResultCard, type ArtifactResult } from "./components/artifact-result-card";
import { AgentResultCard, isGeneratedAgentResult } from "./components/agent-result-card";
import { StreamingThinkingIndicator } from "./components/streaming-thinking-indicator";
import { PreloadThinkingIndicator } from "@/components/projects/shared/components/preload-thinking-indicator";
import { chatStyles } from "./data/styles";
import { cn } from "@/lib/utils";
import { useChatSubmit } from "./hooks/use-chat-submit";
import { useScrollAnchor } from "./hooks/use-scroll-anchor";
import { useThinkingStatus } from "./hooks/use-thinking-status";
import { appendOptimisticCompactUserMessage } from "./lib/optimistic-user-message";
import { type DelegationRequest, useRealtimeVoice } from "@/components/projects/rovo/hooks/use-realtime-voice";
import { useClicky } from "@/components/projects/rovo/hooks/use-clicky";
import { useClickyVoice } from "@/components/projects/rovo/hooks/use-clicky-voice";
import { ClickyOverlay } from "@/components/projects/rovo/components/clicky/clicky-overlay";
import { parseClickyResponse } from "@/components/projects/rovo/lib/clicky-point-parser";
import styles from "./chat.module.css";

interface ChatPanelCardsProps {
	generativeAnimation?: GenerativeCardAnimationProps;
}

type GeneratedResult =
	| { type: "artifact"; result: ArtifactResult }
	| { type: "agent"; result: RovoDataParts["agent-result"] };

export interface ChatPanelGreetingProps {
	heading?: string;
	illustrationSrc?: string;
	illustrationDarkSrc?: string;
	showHero?: boolean;
	suggestions?: ReadonlyArray<RovoSuggestion>;
}

export interface ChatPanelCustomAgentTabs {
	activity?: ReactNode;
	trigger?: ReactNode;
}

interface ChatPanelProps {
	onClose: () => void;
	sendPromptOptions?: SendPromptOptions;
	enableSmartWidgets?: boolean;
	cards?: ChatPanelCardsProps;
	greeting?: ChatPanelGreetingProps;
	customAgentTabs?: ChatPanelCustomAgentTabs;
	hideHeader?: boolean;
	headerVariant?: "default" | "minimal";
	abortOnUnmount?: boolean;
	containerClassName?: string;
	containerStyle?: CSSProperties;
	onSurfaceSwitch?: ChatSurfaceSwitchHandler;
	chatContextBar?: ChatContextBarDescriptor | null;
	onArtifactResult?: (artifact: ArtifactResult) => void;
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

function CustomAgentTabEmptyState({
	description,
	title,
}: Readonly<{
	description: string;
	title: string;
}>): React.ReactElement {
	return (
		<div className="flex min-h-[220px] items-center justify-center p-6 text-center">
			<div className="max-w-[280px] space-y-2">
				<h3 className="text-sm font-semibold text-text">{title}</h3>
				<p className="text-sm leading-6 text-text-subtle">{description}</p>
			</div>
		</div>
	);
}

function isCustomAgentTabsProfile(agent: { byline?: string }): boolean {
	return /\bcustom agent\b/iu.test(agent.byline ?? "");
}

export default function ChatPanel({
	onClose,
	sendPromptOptions,
	enableSmartWidgets = false,
	cards,
	greeting,
	customAgentTabs,
	hideHeader = false,
	headerVariant = "default",
	abortOnUnmount = true,
	containerClassName,
	containerStyle,
	onSurfaceSwitch,
	chatContextBar,
	onArtifactResult,
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
		selectedAgent,
		selectableAgents,
		selectAgent,
		isCustomAgentSelected,
		activePrompt,
		isHistoryOpen,
		pinFloating,
		toggleHistory,
		unpinFloating,
	} = useRovoChat();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const artifactDialogFloatingPinRef = useRef(false);
	const reportedArtifactResultKeysRef = useRef<Set<string>>(new Set());
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

	// --- Rovo AI cursor companion (Clicky) ---
	const clicky = useClicky();
	const {
		toggle: toggleClicky,
		isActive: isClickyActive,
		deactivate: deactivateClicky,
		startListening: clickyStartListening,
		startProcessing: clickyStartProcessing,
		startPointing: clickyStartPointing,
		startSpeaking: clickyStartSpeaking,
		returnToIdle: clickyReturnToIdle,
		addExchange: clickyAddExchange,
		screenshotDimensions: clickyScreenshotDimensions,
		setScreenshotDimensions: clickySetScreenshotDimensions,
	} = clicky;

	// Cmd+Shift+K (Mac) / Ctrl+Shift+K toggles the AI cursor; Escape deactivates it.
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "K" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleClicky();
				return;
			}

			if (e.key === "Escape" && isClickyActive) {
				deactivateClicky();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isClickyActive, deactivateClicky, toggleClicky]);

	const realtimeTranscriptRef = useRef("");
	const handleRealtimeSpeechStarted = useCallback(() => {
		realtimeTranscriptRef.current = "";

		// Clicky runs a private voice + screenshot loop; leave the composer untouched.
		if (isClickyActive) {
			clickyStartListening();
			return;
		}

		setPrompt("");
	}, [isClickyActive, clickyStartListening, setPrompt]);
	const handleRealtimeTranscript = useCallback((payload: RealtimeTranscriptPayload) => {
		// Suppress live transcript deltas in the composer while Clicky is active.
		if (isClickyActive) {
			return;
		}

		const transcriptText = getRealtimeTranscriptText(payload);
		if (!transcriptText.trim()) {
			return;
		}

		realtimeTranscriptRef.current = transcriptText;
		setPrompt(transcriptText);
	}, [isClickyActive, setPrompt]);
	const handleRealtimeTranscriptCompleted = useCallback((payload: RealtimeTranscriptPayload) => {
		const transcriptText = getRealtimeTranscriptText(payload);

		// Clicky: transition to processing and record the user's spoken question
		// instead of routing it into the chat composer/thread.
		if (isClickyActive) {
			clickyStartProcessing();
			if (transcriptText.trim()) {
				clickyAddExchange({ role: "user", content: transcriptText });
			}
			return;
		}

		if (!transcriptText.trim()) {
			return;
		}

		realtimeTranscriptRef.current = transcriptText;
		setPrompt(transcriptText);
	}, [isClickyActive, clickyStartProcessing, clickyAddExchange, setPrompt]);
	const handleRealtimeAssistantTextCompleted = useCallback((payload: { messageId?: string; text?: string } | string) => {
		// Only Clicky consumes the realtime model's own text response (POINT tags);
		// normal voice mode delegates to the Rovo chat stream instead.
		if (!isClickyActive) {
			return;
		}

		const text = typeof payload === "string" ? payload : (payload.text ?? "");
		if (!text) {
			return;
		}

		const parsed = parseClickyResponse(text, clickyScreenshotDimensions);
		clickyAddExchange({ role: "assistant", content: parsed.text || text });
		if (parsed.point) {
			clickyStartPointing(parsed.point, parsed.text);
		} else {
			clickyStartSpeaking(text);
		}
	}, [isClickyActive, clickyScreenshotDimensions, clickyAddExchange, clickyStartPointing, clickyStartSpeaking]);
	const handleRealtimeDelegateToRovo = useCallback(
		(request: DelegationRequest) => {
			// Clicky's spoken queries must never delegate into the chat thread.
			if (isClickyActive) {
				return;
			}

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
		[isClickyActive, resolvedSendPromptOptions, sendPrompt, setPrompt],
	);
	const realtime = useRealtimeVoice({
		chatMessages: uiMessages,
		isGenerating: isStreaming,
		onDelegateToRovo: handleRealtimeDelegateToRovo,
		onSpeechStarted: handleRealtimeSpeechStarted,
		onSpeechTranscriptCompleted: handleRealtimeTranscriptCompleted,
		onSpeechTranscriptDelta: handleRealtimeTranscript,
		onAssistantTextCompleted: handleRealtimeAssistantTextCompleted,
	});

	// --- Clicky voice bridge: connects realtime + injects prompt + sends screenshots ---
	useClickyVoice({
		clickyState: clicky.state,
		isClickyActive,
		sendImageInput: realtime.sendImageInput,
		isRealtimeConnected: realtime.isConnected,
		connectRealtime: realtime.connect,
		disconnectRealtime: realtime.disconnect,
		injectContext: realtime.injectContext,
		onScreenshotCaptured: clickySetScreenshotDimensions,
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

	const rawMessages = useMemo(() => uiMessages.filter(isRenderableRovoUIMessage), [uiMessages]);
	const optimisticPrompt = activePrompt ?? (isSubmitPending ? queuedPrompts[0] ?? null : null);
	const messages = useMemo(
		() => appendOptimisticCompactUserMessage(rawMessages, optimisticPrompt),
		[optimisticPrompt, rawMessages]
	);

	useEffect(() => {
		if (!onArtifactResult) {
			return;
		}

		for (const message of messages) {
			const artifactResult = getMessageArtifactResult(message);
			if (!artifactResult) {
				continue;
			}

			const resultKey = `${message.id}:${artifactResult.documentId}:${artifactResult.action}`;
			if (reportedArtifactResultKeysRef.current.has(resultKey)) {
				continue;
			}

			reportedArtifactResultKeysRef.current.add(resultKey);
			onArtifactResult(artifactResult);
		}
	}, [messages, onArtifactResult]);
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
		enableTargetFollow: chatSurface !== "floating",
		isGenerationActive: isStreamingLifecycleActive,
		uiMessages: messages,
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
	const handleAgentResultSelect = useCallback((agent: RovoDataParts["agent-result"]) => {
		if (selectableAgents.some((selectableAgent) => selectableAgent.id === agent.agentId)) {
			selectAgent(agent.agentId);
		}
	}, [selectAgent, selectableAgents]);

	const messagesContainerStyle = {
		display: chatStyles.messagesContainer.display,
		flexDirection: chatStyles.messagesContainer.flexDirection,
		justifyContent: hasMessages || shouldHugEmptyGreeting ? "flex-start" : "flex-end",
		flex: hasMessages || shouldHugEmptyGreeting ? "0 0 auto" : chatStyles.messagesContainer.flex,
		minHeight: shouldHugEmptyGreeting ? "auto" : "100%",
	};
	const isHeaderHistoryEnabled = !hideHeader && headerVariant === "default";
	const shouldRenderHeaderHistory = isHeaderHistoryEnabled && chatSurface !== "floating";
	const shouldRenderCustomAgentTabs = Boolean(customAgentTabs) || (isCustomAgentSelected && isCustomAgentTabsProfile(selectedAgent));
	const chatConversationBody = (
		<Conversation
			className="min-h-0 min-w-0 flex-1"
			contextRef={conversationContextRef}
			followMode={scrollFollowMode}
			initial={false}
			resize={isStreamingLifecycleActive ? "instant" : "smooth"}
			resizeTarget={isStreamingLifecycleActive ? "bottom" : "follow"}
			targetScrollTop={getLatestTurnTargetTop}
		>
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
							selectedAgent={selectedAgent}
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
							/>
						)}
						renderTurnAfter={(turn) => {
							const generatedResults = turn.flatMap((message): GeneratedResult[] => {
								const artifactResult = getMessageArtifactResult(message);
								const agentResult = getMessageAgentResult(message);
								const generatedAgentResult =
									isGeneratedAgentResult(agentResult) && hasTurnCompleteSignal(message)
										? agentResult
										: null;
								const results: GeneratedResult[] = [];

								if (artifactResult && !generatedAgentResult) {
									results.push({ type: "artifact", result: artifactResult });
								}
								if (generatedAgentResult) {
									results.push({ type: "agent", result: generatedAgentResult });
								}

								return results;
							});

							return generatedResults.length > 0 ? (
								<div className="w-full space-y-2" data-testid="rovo-generated-result-group">
									{generatedResults.map((generatedResult) => (
										generatedResult.type === "artifact" ? (
											<ArtifactResultCard
												key={`artifact-${generatedResult.result.documentId}-${generatedResult.result.action}`}
												artifact={generatedResult.result}
												onDialogOpen={handleArtifactDialogOpen}
												onDialogClose={releaseArtifactDialogFloatingPin}
											/>
										) : (
											<AgentResultCard
												key={`agent-${generatedResult.result.agentId}-${generatedResult.result.action}`}
												agent={generatedResult.result}
												onSelectAgent={handleAgentResultSelect}
											/>
										)
									))}
								</div>
							) : null;
						}}
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
	);
	const chatComposerBody = (
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
						clickyActive={isClickyActive}
						onPromptChange={setPrompt}
						onSubmit={handleSubmit}
						onStop={abort}
						onToggleClicky={toggleClicky}
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
	);
	const chatPanelBody = (
		<>
			{chatConversationBody}
			{chatComposerBody}
		</>
	);

	return (
		<div ref={panelRef} className={cn("relative overflow-hidden", containerClassName)} style={{ ...chatStyles.chatPanel, ...resolvedContainerStyle }}>
			<ChatHistoryDrawer active={shouldRenderHeaderHistory} />
			{!hideHeader && (
				<div className="shrink-0">
					<ChatHeader
						variant={headerVariant}
						isHistoryOpen={isHistoryOpen}
						onClose={onClose}
						onHistoryToggle={toggleHistory}
						onNewChat={resetChat}
						onSurfaceSwitch={onSurfaceSwitch}
					/>
				</div>
			)}
			{shouldRenderCustomAgentTabs ? (
				<>
					<Tabs defaultValue="chat" aria-label="Custom agent views" className="min-h-0 min-w-0 flex-1">
						<div className={cn("shrink-0 px-3 pb-3", hideHeader ? "pt-3" : null)}>
							<TabsList className="w-full">
								<TabsTrigger value="chat">Chat</TabsTrigger>
								<TabsTrigger value="trigger">Trigger</TabsTrigger>
								<TabsTrigger value="activity">Activity</TabsTrigger>
							</TabsList>
						</div>
						<TabsContent value="chat" keepMounted className="min-h-0 flex flex-1 flex-col data-[hidden]:hidden">
							{chatConversationBody}
						</TabsContent>
						<TabsContent value="trigger" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 data-[hidden]:hidden">
							{customAgentTabs?.trigger ?? (
								<CustomAgentTabEmptyState
									title="No trigger configured"
									description={`${selectedAgent.name} does not have trigger details in this view yet.`}
								/>
							)}
						</TabsContent>
						<TabsContent value="activity" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 data-[hidden]:hidden">
							{customAgentTabs?.activity ?? (
								<CustomAgentTabEmptyState
									title="No activity yet"
									description={`${selectedAgent.name} has not recorded activity in this view yet.`}
								/>
							)}
						</TabsContent>
					</Tabs>
					{chatComposerBody}
				</>
			) : (
				chatPanelBody
			)}
			<ClickyOverlay
				state={clicky.state}
				pointTarget={clicky.pointTarget}
				responseText={clicky.responseText}
				history={clicky.history}
				screenshotDimensions={clickyScreenshotDimensions}
				onReturnToIdle={clickyReturnToIdle}
			/>
		</div>
	);
}
