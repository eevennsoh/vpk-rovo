"use client";

import { useReducedMotion } from "motion/react";
import type { ComponentProps, ErrorInfo, ReactNode, RefObject } from "react";
import {
	Attachment,
	AttachmentPreview,
	Attachments,
} from "@/components/ui-ai/attachments";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
	type ConversationFollowMode,
	useConversationContext,
} from "@/components/ui-ai/conversation";
import {
	Message,
	MessageActions,
	MessageContent,
	MessageCopyAction,
	MessageEditAction,
	MessageRegenerateAction,
	MessageResponse,
	MessageVoteActions,
} from "@/components/ui-ai/message";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from "@/components/ui-ai/chain-of-thought";
import {
	AdsReasoningTrigger,
	Reasoning,
	ReasoningContent,
	isTimelineOnlyContent,
} from "@/components/ui-ai/reasoning";
import { ToolInput, ToolOutput } from "@/components/ui-ai/tool";
import { Icon } from "@/components/ui/icon";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import WrenchIcon from "@atlaskit/icon-lab/core/wrench";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import { Textarea } from "@/components/ui/textarea";
import { getFutureChatInterruptionLabel } from "@/lib/future-chat-interruptions";
import {
	resolveFutureChatMessageArtifactDisplay,
	resolveFutureChatOrphanArtifactDisplay,
	type FutureChatPendingArtifactResult,
} from "@/components/projects/future-chat/lib/future-chat-message-artifacts";
import {
	sanitizeFutureChatAssistantText,
	shouldRenderFutureChatAssistantActions,
	shouldRenderFutureChatAssistantMessage,
	shouldRenderFutureChatVisibleWidget,
	shouldRenderFutureChatWidget,
} from "@/components/projects/future-chat/lib/future-chat-message-display";
import {
	resolveFutureChatPendingAssistantDisplayState,
	resolveFutureChatStreamingAssistantMessageId,
} from "@/components/projects/future-chat/lib/future-chat-streaming-assistant";
import {
	resolveFutureChatThinkingStatusPhase,
	resolveFutureChatThinkingVisibility,
} from "@/components/projects/future-chat/lib/future-chat-thinking-status-phase";
import {
	resolveFutureChatScrollAnchorLayout,
} from "@/components/projects/future-chat/lib/future-chat-scroll-anchor";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import LoadingWidget from "@/components/projects/shared/components/loading-widget";
import { AssistantSuggestionsSection } from "@/components/projects/shared/components/assistant-suggestions-section";
import { PlanWidgetInlineCard } from "@/components/projects/shared/components/plan-widget-inline-card";
import { useDynamicThinkingLabel } from "@/components/projects/shared/hooks/use-dynamic-thinking-label";
import {
	getReasoningPropsForPhase,
	useReasoningPhase,
} from "@/components/projects/shared/hooks/use-reasoning-phase";
import {
	getAwaitingUserResponseLabel,
	getDefaultThinkingLabel,
	getPreloadShimmerLabel,
	getReasoningSectionTitle,
} from "@/components/projects/shared/lib/reasoning-labels";
import {
	isThinkingStatusActive as checkThinkingStatusActive,
	resolveThinkingStatusTriggerLabel,
} from "@/components/projects/shared/thread-message/lib/thinking-status-state";
import {
	getAgentExecutionSummaries,
	getAllDataParts,
	getMessageInterruption,
	getLatestDataPart,
	getLatestTodoQueue,
	getLatestRouteDecision,
	getMessageReasoning,
	getMessageSources,
	getMessageText,
	getThinkingToolCallSummaries,
	hasTurnCompleteSignal,
	isMessageTextStreaming,
	type AgentExecutionStatus,
	type AgentExecutionSummary,
	type RoutingDecision,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import {
	getAllPlanWidgetPayloads,
	isPlanCardBuildable,
	parsePlanWidgetPayload,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import {
	hasMatchingClarificationResponse,
	parseQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import { findAcceptedPlanKey } from "@/components/projects/shared/lib/plan-approval";
import { cn } from "@/lib/utils";
import { FutureChatArtifactCard } from "@/components/projects/future-chat/components/future-chat-artifact-card";
import type { FutureChatDocument } from "@/lib/future-chat-types";
import type { FutureChatStreamingArtifact } from "@/components/projects/future-chat/lib/future-chat-streaming-artifact";
import Image from "next/image";
import { Component, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnswerCard } from "@/components/blocks/answer-card/components/answer-card";
import Heading from "@/components/blocks/shared-ui/heading";

interface FutureChatMessagesProps {
	activeDocumentId: string | null;
	compact?: boolean;
	documents: ReadonlyArray<FutureChatDocument>;
	editingMessageId: string | null;
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	onBuildPlan?: (planWidget: ParsedPlanWidgetPayload) => void;
	onEditMessage: (messageId: string, nextText: string) => Promise<void>;
	onOpenArtifactFromCard: (documentId: string, element: HTMLElement) => void;
	onRegisterArtifactCard: (documentId: string, element: HTMLElement) => void;
	onRegenerate: () => void;
	onSelectSuggestion: (suggestion: string) => Promise<void>;
	onSetEditingMessageId: (messageId: string | null) => void;
	onVote: (messageId: string, value: "up" | "down" | null) => Promise<void>;
	pendingArtifactResult: FutureChatPendingArtifactResult | null;
	scrollAnchorMessageId: string | null;
	scrollFollowMode: ConversationFollowMode;
	showEmptyState?: boolean;
	shouldSuppressLatestAssistantSuggestions?: boolean;
	streamingArtifact: FutureChatStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	votes: Record<string, "up" | "down">;
}

const FUTURE_CHAT_SCROLL_ANCHOR_SELECTOR = "[data-future-chat-scroll-anchor='true']";

const StepThinkingIcon = ({ className }: { className?: string }) => (
	<Icon render={<AiAgentIcon label="" spacing="none" />} className={className} />
);
const StepChecklistIcon = ({ className }: { className?: string }) => (
	<Icon render={<ListChecklistIcon label="" spacing="none" />} className={className} />
);
const StepAgentsIcon = ({ className }: { className?: string }) => (
	<Icon render={<PeopleGroupIcon label="" spacing="none" />} className={className} />
);
const StepToolIcon = ({ className }: { className?: string }) => (
	<Icon render={<WrenchIcon label="" spacing="none" />} className={className} />
);

function toolStateToCoTStatus(
	state: string,
): "complete" | "active" | "pending" {
	if (
		state === "running" ||
		state === "awaiting-input" ||
		state === "approval-requested"
	) {
		return "active";
	}
	return "complete";
}

class AssistantMessageRenderBoundary extends Component<
	Readonly<{
		children: ReactNode;
		fallback: ReactNode;
		messageId: string;
		resetKey: string;
	}>,
	Readonly<{
		hasError: boolean;
	}>
> {
	state = {
		hasError: false,
	};

	static getDerivedStateFromError() {
		return {
			hasError: true,
		};
	}

	componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
		console.error("[FutureChat] Assistant message render failed", {
			messageId: this.props.messageId,
			error,
			componentStack: errorInfo.componentStack,
		});
	}

	componentDidUpdate(
		prevProps: Readonly<{
			children: ReactNode;
			fallback: ReactNode;
			messageId: string;
			resetKey: string;
		}>,
	) {
		if (
			this.state.hasError &&
			(
				prevProps.messageId !== this.props.messageId ||
				prevProps.resetKey !== this.props.resetKey
			)
		) {
			this.setState({
				hasError: false,
			});
		}
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}

function computeFutureChatAnchorScrollTop(
	defaultTargetTop: number,
	scrollElement: HTMLElement,
	scrollSpacerRef: RefObject<HTMLDivElement | null>,
): number {
	const scrollAnchorElement = scrollElement.querySelector<HTMLElement>(
		FUTURE_CHAT_SCROLL_ANCHOR_SELECTOR,
	);
	if (!scrollAnchorElement) {
		if (scrollSpacerRef.current) {
			scrollSpacerRef.current.style.height = "0px";
		}
		return defaultTargetTop;
	}

	const scrollRect = scrollElement.getBoundingClientRect();
	const scrollAnchorRect = scrollAnchorElement.getBoundingClientRect();
	const { spacerHeight, targetScrollTop } = resolveFutureChatScrollAnchorLayout({
		anchorOffsetTop: scrollAnchorRect.top - scrollRect.top,
		clientHeight: scrollElement.clientHeight,
		currentSpacerHeight: scrollSpacerRef.current?.offsetHeight ?? 0,
		defaultTargetTop,
		scrollHeight: scrollElement.scrollHeight,
		scrollTop: scrollElement.scrollTop,
	});

	if (scrollSpacerRef.current) {
		scrollSpacerRef.current.style.height = `${spacerHeight}px`;
	}

	return targetScrollTop;
}

function FutureChatScrollAnchorSync({
	scrollAnchorMessageId,
}: Readonly<{
	scrollAnchorMessageId: string | null;
}>) {
	const { scrollToBottom } = useConversationContext();
	const shouldReduceMotion = useReducedMotion();

	useEffect(() => {
		if (!scrollAnchorMessageId) {
			return;
		}

		void scrollToBottom({
			animation: shouldReduceMotion ? "instant" : "smooth",
			ignoreEscapes: true,
		});
	}, [scrollAnchorMessageId, scrollToBottom, shouldReduceMotion]);

	return null;
}

function UserMessage({
	isEditing,
	isScrollAnchor,
	message,
	onEditMessage,
	onSetEditingMessageId,
}: Readonly<{
	isEditing: boolean;
	isScrollAnchor: boolean;
	message: RovoUIMessage;
	onEditMessage: (messageId: string, nextText: string) => Promise<void>;
	onSetEditingMessageId: (messageId: string | null) => void;
}>) {
	const [draft, setDraft] = useState(() => getMessageText(message));
	const clarificationSummaryRows = (() => {
		const meta = message.metadata;
		if (!meta || meta.source !== "clarification-submit") return [];
		if (!Array.isArray(meta.clarificationSummary)) return [];
		return meta.clarificationSummary.filter(
			(row): row is { question: string; answer: string } =>
				typeof row?.question === "string" &&
				row.question.trim().length > 0 &&
				typeof row?.answer === "string" &&
				row.answer.trim().length > 0,
		);
	})();
	const attachments = message.parts.filter(
		(part): part is Extract<(typeof message.parts)[number], { type: "file" }> =>
			part.type === "file",
	);

	return (
		<Message
			animate
			className={isEditing ? "w-full max-w-full" : undefined}
			data-future-chat-scroll-anchor={isScrollAnchor ? "true" : undefined}
			data-role="user"
			data-testid="message-user"
			fitContent={!isEditing}
			from="user"
		>
			{attachments.length > 0 ? (
				<Attachments className="justify-end" variant="grid">
					{attachments.map((attachment) => (
						<Attachment
							key={`${message.id}-${attachment.url}-${attachment.filename ?? "attachment"}`}
							data={{
								...attachment,
								id: `${message.id}-${attachment.url}-${attachment.filename ?? "attachment"}`,
							}}
						>
							<AttachmentPreview />
						</Attachment>
					))}
				</Attachments>
			) : null}

			{isEditing ? (
				<div className="rounded-2xl border border-border bg-background p-3 shadow-xs">
					<Textarea
						className="min-h-[140px] resize-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
						onChange={(event) => setDraft(event.currentTarget.value)}
						value={draft}
					/>
					<div className="mt-3 flex justify-end gap-2">
						<Button
							onClick={() => onSetEditingMessageId(null)}
							size="sm"
							type="button"
							variant="ghost"
						>
							Cancel
						</Button>
						<Button
							onClick={() => void onEditMessage(message.id, draft)}
							size="sm"
							type="button"
						>
							Send
						</Button>
					</div>
				</div>
			) : clarificationSummaryRows.length > 0 ? (
				<>
					<AnswerCard rows={clarificationSummaryRows} />
					<MessageActions reveal="hover" className="justify-end text-text-subtle">
						<MessageCopyAction text={getMessageText(message)} />
					</MessageActions>
				</>
			) : (
				<>
					<MessageContent>
						<MessageResponse className="font-medium text-inherit [&_*]:text-inherit">
							{getMessageText(message)}
						</MessageResponse>
					</MessageContent>
					<MessageActions reveal="hover" className="justify-end text-text-subtle">
						<MessageCopyAction text={getMessageText(message)} />
						<MessageEditAction onClick={() => onSetEditingMessageId(message.id)} />
					</MessageActions>
				</>
			)}
		</Message>
	);
}

function WidgetErrorCard({
	widgetError,
	onRetry,
}: Readonly<{
	widgetError: { data: { code?: string; message: string; details?: string; canRetry?: boolean } };
	onRetry: () => void;
}>) {
	const [showDetails, setShowDetails] = useState(false);
	const code = widgetError.data.code;
	const isUnavailable = code === "ROVODEV_UNAVAILABLE";
	const isBusy = code === "ROVODEV_BUSY";

	const friendlyMessage = isUnavailable
		? "RovoDev is currently unavailable. Please try again later."
		: isBusy
			? "All RovoDev instances are busy. Your request will be retried shortly."
			: widgetError.data.message;

	const borderClass = isBusy ? "border-warning" : "border-danger";
	const bgClass = isBusy ? "bg-warning/5" : "bg-danger/5";
	const textClass = isBusy ? "text-warning" : "text-danger";

	return (
		<div className={cn("rounded-xl border px-3 py-2 text-sm", borderClass, bgClass)}>
			<p className={textClass}>{friendlyMessage}</p>
			{widgetError.data.canRetry ? (
				<div className="mt-2">
					<Button
						onClick={onRetry}
						size="sm"
						type="button"
						variant="outline"
					>
						Retry
					</Button>
				</div>
			) : null}
			{widgetError.data.details ? (
				<div className="mt-2">
					<button
						className="text-text-subtlest text-xs underline"
						onClick={() => setShowDetails((prev) => !prev)}
						type="button"
					>
						{showDetails ? "Hide details" : "Show details"}
					</button>
					{showDetails ? (
						<pre className="mt-1 whitespace-pre-wrap text-text-subtlest text-xs">
							{widgetError.data.details}
						</pre>
					) : null}
				</div>
			) : null}
		</div>
	);
}

function getAgentExecutionVariant(
	status: AgentExecutionStatus
): ComponentProps<typeof Lozenge>["variant"] {
	if (status === "completed") {
		return "success";
	}
	if (status === "failed") {
		return "danger";
	}
	return "information";
}

function getAgentExecutionLabel(status: AgentExecutionStatus): string {
	if (status === "completed") {
		return "Completed";
	}
	if (status === "failed") {
		return "Failed";
	}
	return "Working";
}

function TraceStepsSection({
	items,
}: Readonly<{
	items: ReadonlyArray<{
		id: string;
		text: string;
		blockedBy: string[];
		agent?: string;
	}>;
}>) {
	return (
		<div className="space-y-2">
			{items.map((item) => {
				const isBlocked = item.blockedBy.length > 0;

				return (
					<div
						key={item.id}
						className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
					>
						<div className="flex flex-wrap items-start gap-2">
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-text">{item.text}</p>
								<div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-subtle">
									<span>{item.id}</span>
									{item.agent ? <span>{item.agent}</span> : null}
									{isBlocked ? (
										<span>Blocked by {item.blockedBy.join(", ")}</span>
									) : (
										<span>Ready to run</span>
									)}
								</div>
							</div>
							<Lozenge variant={isBlocked ? "warning" : "neutral"}>
								{isBlocked ? "Blocked" : "Queued"}
							</Lozenge>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function TraceAgentExecutionSection({
	executions,
}: Readonly<{
	executions: ReadonlyArray<AgentExecutionSummary>;
}>) {
	return (
		<div className="space-y-2">
			{executions.map((execution) => (
				<div
					key={execution.taskId}
					className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
				>
					<div className="flex flex-wrap items-start gap-2">
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-text">
								{execution.taskLabel}
							</p>
							<div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-subtle">
								<span>{execution.agentName}</span>
								<span>{execution.taskId}</span>
							</div>
						</div>
						<Lozenge variant={getAgentExecutionVariant(execution.status)}>
							{getAgentExecutionLabel(execution.status)}
						</Lozenge>
					</div>
					{execution.content ? (
						<div className="mt-2 rounded-md bg-muted/40 px-3 py-2">
							<pre className="whitespace-pre-wrap break-words text-xs leading-5 text-text-subtle">
								{execution.content}
							</pre>
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

function AssistantMessage({
	artifactCard,
	isQuestionCardResolved,
	isLastAssistant,
	isStreaming,
	isThinkingLifecycleStreaming,
	message,
	onBuildPlan,
	onRegenerate,
	onVote,
	planBuildDisabled,
	planBuildDisabledReason,
	voteValue,
}: Readonly<{
	artifactCard: React.ReactNode;
	isQuestionCardResolved: boolean;
	isLastAssistant: boolean;
	isStreaming: boolean;
	isThinkingLifecycleStreaming: boolean;
	message: RovoUIMessage;
	onBuildPlan?: (planWidget: ParsedPlanWidgetPayload) => void;
	onRegenerate: () => void;
	onVote: (messageId: string, value: "up" | "down" | null) => Promise<void>;
	planBuildDisabled?: boolean;
	planBuildDisabledReason?: string;
	voteValue?: "up" | "down";
}>) {
	const interruption = getMessageInterruption(message);
	const interruptionLabel = getFutureChatInterruptionLabel(interruption);
	const text = sanitizeFutureChatAssistantText(getMessageText(message));
	const reasoning = getMessageReasoning(message);
	const widget = getLatestDataPart(message, "data-widget-data");
	const widgetLoading = getLatestDataPart(message, "data-widget-loading");
	const widgetError = getLatestDataPart(message, "data-widget-error");
	const [questionWidgetLoadTimedOut, setQuestionWidgetLoadTimedOut] =
		useState(false);

	useEffect(() => {
		const loading = widgetLoading?.data.loading ?? false;
		const loadType = widgetLoading?.data.type;
		if (!loading || loadType !== "question-card") {
			const rafId = window.requestAnimationFrame(() => {
				setQuestionWidgetLoadTimedOut(false);
			});
			return () => {
				window.cancelAnimationFrame(rafId);
			};
		}

		const timeoutId = window.setTimeout(() => {
			setQuestionWidgetLoadTimedOut(true);
		}, 30_000);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [widgetLoading?.data.loading, widgetLoading?.data.type]);
	const sources = getMessageSources(message);
	const routeDecision: RoutingDecision | null = getLatestRouteDecision(message);

	// Widget type determines rendering path: "question-card" and "plan" widgets
	// render regardless of routing presentation (they come from RovoDev tool calls
	// during clarification flows where presentation is "text"). GenUI widgets
	// only render when the routing decision says "genui_card".
	const widgetType = widget?.data.type ?? null;
	const parsedPlanWidget = widgetType === "plan"
		? parsePlanWidgetPayload(widget?.data.payload)
		: null;
	const shouldShowWidget = shouldRenderFutureChatWidget({
		hasWidget: Boolean(widget),
		routeDecision,
		widgetType,
	});
	const shouldHideResolvedQuestionCard =
		widgetType === "question-card" && isQuestionCardResolved;
	const hasVisibleWidget = shouldRenderFutureChatVisibleWidget({
		hasWidget: shouldShowWidget,
		shouldHideResolvedQuestionCard,
	});
	const isTextPresentation = routeDecision
		? routeDecision.presentation === "text"
		: !widget;
	const isFallbackRoute = routeDecision !== null && routeDecision.confidence < 0.3;

	// Thinking status extraction
	const thinkingStatusParts = getAllDataParts(message, "data-thinking-status");
	const thinkingEventParts = getAllDataParts(message, "data-thinking-event");
	const thinkingToolCalls = getThinkingToolCallSummaries(message);
	const latestTodoQueue = getLatestTodoQueue(message);
	const todoQueueItems = latestTodoQueue?.items ?? [];
	const agentExecutions = getAgentExecutionSummaries(message);
	const hasThinkingStatusPart = thinkingStatusParts.length > 0;
	const hasThinkingEvents = thinkingEventParts.length > 0;
	const hasThinkingToolCalls = thinkingToolCalls.length > 0;
	const hasAwaitingInputToolCalls = thinkingToolCalls.some(
		(toolCall) => toolCall.state === "awaiting-input",
	);
	const hasTodoQueueItems = todoQueueItems.length > 0;
	const hasAgentExecutions = agentExecutions.length > 0;
	const hasTraceDataSignals =
		hasThinkingEvents || hasTodoQueueItems || hasAgentExecutions;
	const hasTurnComplete = hasTurnCompleteSignal(message);

	const rawThinkingActive = checkThinkingStatusActive({
		hasThinkingStatusPart,
		hasThinkingEvents: hasTraceDataSignals,
		isRetryThinkingStatus: false,
		isStreaming: isThinkingLifecycleStreaming,
	});
	const isResponseInFlight =
		isMessageTextStreaming(message) ||
		isThinkingLifecycleStreaming ||
		widgetLoading?.data.loading === true;
	const [hasLatchedThinking, setHasLatchedThinking] = useState(false);
	const { effectiveIsThinkingActive, nextLatched } =
		resolveFutureChatThinkingVisibility({
			isThinkingActive: rawThinkingActive,
			isResponseInFlight,
			wasLatched: hasLatchedThinking,
		});
	useEffect(() => {
		if (hasLatchedThinking === nextLatched) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setHasLatchedThinking(nextLatched);
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [hasLatchedThinking, nextLatched]);
	const thinkingActive = effectiveIsThinkingActive;

	const hasBackendThinkingActivity =
		hasThinkingStatusPart ||
		hasThinkingEvents ||
		hasThinkingToolCalls ||
		hasTodoQueueItems ||
		hasAgentExecutions;
	const isThinkingStreaming =
		isThinkingLifecycleStreaming && thinkingActive && hasBackendThinkingActivity;

	const accumulatedThinkingContent = thinkingStatusParts
		.map((part) => part.data.content)
		.filter(Boolean)
		.join("\n\n");
	const hasThinkingText = Boolean(accumulatedThinkingContent);
	const shouldShowThinkingSection =
		hasThinkingText &&
		!(isTimelineOnlyContent(accumulatedThinkingContent) && hasThinkingToolCalls);
	const hasThinkingDetails =
		shouldShowThinkingSection ||
		hasTodoQueueItems ||
		hasAgentExecutions ||
		hasThinkingToolCalls;

	const lastThinkingStatusPart =
		thinkingStatusParts[thinkingStatusParts.length - 1] ?? null;
	const lastThinkingEventPart =
		thinkingEventParts[thinkingEventParts.length - 1] ?? null;

	const { phase: thinkingPhase, duration: thinkingDuration } = useReasoningPhase({
		isStreaming: isThinkingStreaming,
		hasMessageText: hasBackendThinkingActivity,
		responseKey: message.id,
		autoIdle: false,
	});
	const thinkingReasoningPhase = resolveFutureChatThinkingStatusPhase({
		isThinkingActive: thinkingActive,
		hasTurnComplete,
		isThinkingLifecycleStreaming,
		hasBackendThinkingActivity,
		hasAwaitingInputToolCalls,
		lifecyclePhase: thinkingPhase,
	});

	const thinkingUpdateSignal = [
		message.id,
		`status-count:${thinkingStatusParts.length}`,
		`status-id:${lastThinkingStatusPart?.id ?? ""}`,
		`status-label:${lastThinkingStatusPart?.data.label ?? ""}`,
		`event-count:${thinkingEventParts.length}`,
		`event-id:${lastThinkingEventPart?.data.eventId ?? ""}`,
	].join("|");

	const { label: dynamicThinkingLabel } = useDynamicThinkingLabel({
		baseLabel: lastThinkingStatusPart?.data.label ?? getDefaultThinkingLabel(),
		isStreaming: isThinkingStreaming,
		updateSignal: thinkingUpdateSignal,
		fallbackLabel: getDefaultThinkingLabel(),
	});

	const thinkingTriggerLabel = hasAwaitingInputToolCalls
		? getAwaitingUserResponseLabel()
		: resolveThinkingStatusTriggerLabel({
				resolvedLabel: dynamicThinkingLabel,
				reasoningPhase: thinkingReasoningPhase,
				duration: thinkingDuration,
	});

	const shouldRenderPlanWidget = shouldShowWidget && parsedPlanWidget !== null;
	const shouldRenderAssistantText =
		Boolean(text) &&
		(isTextPresentation || isFallbackRoute || !widget) &&
		!shouldRenderPlanWidget;
	const shouldRenderAssistantActions =
		shouldRenderFutureChatAssistantActions({
			hasArtifactCard: Boolean(artifactCard),
			hasAssistantText: shouldRenderAssistantText,
			hasInterruption: Boolean(interruptionLabel),
			hasSources: sources.length > 0,
			hasWidget: hasVisibleWidget,
			hasWidgetError: Boolean(widgetError),
			isLastAssistant,
			isResponseInFlight,
		});
	const shouldRenderAssistantMessage =
		shouldRenderFutureChatAssistantMessage({
			hasArtifactCard: Boolean(artifactCard),
			hasAssistantText: shouldRenderAssistantText,
			hasInterruption: Boolean(interruptionLabel),
			hasReasoning: Boolean(reasoning?.text) || thinkingActive,
			hasSources: sources.length > 0,
			hasWidget: hasVisibleWidget,
			hasWidgetError: Boolean(widgetError),
			hasWidgetLoading: widgetLoading?.data.loading ?? false,
		});
	const isPlanWidgetStreaming =
		widgetType === "plan" &&
		(
			(widgetLoading?.data.type === "plan" && widgetLoading.data.loading) ||
			isMessageTextStreaming(message)
		);

	if (!shouldRenderAssistantMessage) {
		return null;
	}

	const assistantRenderFallback = (
		<div className="flex flex-col gap-3">
			<div className="rounded-xl border border-border-warning/40 bg-bg-warning-subtler px-3 py-2 text-sm text-text-warning">
				I couldn&apos;t render part of this response. Retry the message or continue the chat.
			</div>
			{shouldRenderAssistantText ? (
				<MessageContent className="max-w-3xl">
					<MessageResponse>{text}</MessageResponse>
				</MessageContent>
			) : null}
			{isLastAssistant ? (
				<div>
					<Button
						size="sm"
						type="button"
						variant="outline"
						onClick={onRegenerate}
					>
						Retry
					</Button>
				</div>
			) : null}
		</div>
	);

	return (
		<Message
			animate
			className="max-w-full"
			data-role="assistant"
			data-testid="message-assistant"
			from="assistant"
		>
			<div className="flex w-full items-start gap-2 md:gap-3">
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<AssistantMessageRenderBoundary
						fallback={assistantRenderFallback}
						messageId={message.id}
						resetKey={`${message.parts.length}:${isStreaming ? "streaming" : "done"}`}
					>
						{thinkingActive ? (
							<ChainOfThought
								className="mb-0"
								defaultOpen={hasThinkingDetails}
							>
								<ChainOfThoughtHeader>{thinkingTriggerLabel}</ChainOfThoughtHeader>
								{hasThinkingDetails ? (
									<ChainOfThoughtContent>
										{shouldShowThinkingSection ? (
											<ChainOfThoughtStep
												icon={StepThinkingIcon}
												label={getReasoningSectionTitle("thinking")}
												status={isThinkingStreaming ? "active" : "complete"}
											>
												<pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs">
													{accumulatedThinkingContent}
												</pre>
											</ChainOfThoughtStep>
										) : null}
										{hasTodoQueueItems ? (
											<ChainOfThoughtStep
												icon={StepChecklistIcon}
												label={getReasoningSectionTitle("steps")}
												status={isThinkingStreaming ? "active" : "complete"}
											>
												<TraceStepsSection items={todoQueueItems} />
											</ChainOfThoughtStep>
										) : null}
										{hasAgentExecutions ? (
											<ChainOfThoughtStep
												icon={StepAgentsIcon}
												label={getReasoningSectionTitle("agents")}
												status={isThinkingStreaming ? "active" : "complete"}
											>
												<TraceAgentExecutionSection executions={agentExecutions} />
											</ChainOfThoughtStep>
										) : null}
										{thinkingToolCalls.map((toolCall, index) => (
											<ChainOfThoughtStep
												key={`${message.id}-cot-tool-${toolCall.id}-${index}`}
												icon={StepToolIcon}
												label={toolCall.toolName}
												status={toolStateToCoTStatus(toolCall.state)}
											>
												{toolCall.input !== undefined ? (
													<ToolInput input={toolCall.input} />
												) : null}
												<ToolOutput
													errorText={toolCall.errorText}
													output={toolCall.output}
													outputBytes={toolCall.outputBytes}
													outputTruncated={toolCall.outputTruncated}
													suppressedRawOutput={toolCall.suppressedRawOutput}
												/>
											</ChainOfThoughtStep>
										))}
									</ChainOfThoughtContent>
								) : null}
							</ChainOfThought>
						) : reasoning?.text ? (
							<Reasoning
								defaultOpen={reasoning.isStreaming}
								isStreaming={isStreaming && reasoning.isStreaming}
							>
								<AdsReasoningTrigger />
								<ReasoningContent>{reasoning.text}</ReasoningContent>
							</Reasoning>
						) : null}

						{widgetLoading?.data.loading && !shouldHideResolvedQuestionCard ? (
							<div className="w-full">
								{questionWidgetLoadTimedOut &&
								widgetLoading.data.type === "question-card" ? (
									<div className="rounded-xl border border-border-warning/40 bg-bg-warning-subtler px-3 py-2 text-sm text-text-warning">
										Clarification questions are taking longer than expected to load.
										Use Stop and try again, or wait if the assistant is still
										working.
									</div>
								) : (
									<LoadingWidget widgetType={widgetLoading.data.type} />
								)}
							</div>
						) : null}

					{shouldRenderPlanWidget ? (
						<div className="w-full pt-2">
							<PlanWidgetInlineCard
								title={parsedPlanWidget.title}
								description={parsedPlanWidget.description}
								tasks={parsedPlanWidget.tasks}
								isStreaming={isPlanWidgetStreaming}
								onBuild={onBuildPlan ? () => onBuildPlan(parsedPlanWidget) : undefined}
								isBuildDisabled={planBuildDisabled}
								buildDisabledReason={planBuildDisabledReason}
							/>
						</div>
					) : shouldShowWidget && widget && !shouldHideResolvedQuestionCard ? (
							<div className="w-full">
								<GenerativeWidgetCard
									widgetData={widget.data.payload}
									widgetType={widget.data.type ?? "message"}
								/>
							</div>
						) : null}

						{widgetError ? (
							<WidgetErrorCard
								widgetError={widgetError}
								onRetry={onRegenerate}
							/>
						) : null}

						{shouldRenderAssistantText ? (
							<MessageContent className="max-w-3xl">
								<MessageResponse isAnimating={isMessageTextStreaming(message)}>
									{text}
								</MessageResponse>
							</MessageContent>
						) : null}

						{artifactCard}

						{interruptionLabel ? (
							<div className="inline-flex w-fit items-center rounded-full border border-border-warning/40 bg-bg-warning-subtler px-2.5 py-1 text-text-warning-bolder text-xs">
								{interruptionLabel}
							</div>
						) : null}

						{sources.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{sources.map((source) => (
									source.type === "source-url" && source.url ? (
										<Button
											key={`${message.id}-${source.url}`}
											nativeButton={false}
											render={(
												<a
													href={source.url}
													rel="noreferrer"
													target="_blank"
												/>
											)}
											size="sm"
											type="button"
											variant="outline"
										>
											{source.title || source.url}
										</Button>
									) : (
										<Button
											key={`${message.id}-${source.title ?? "source"}`}
											size="sm"
											type="button"
											variant="outline"
										>
											{source.title || "Source"}
										</Button>
									)
								))}
							</div>
						) : null}

						{shouldRenderAssistantActions && shouldRenderAssistantText ? (
							<MessageActions reveal="hover" className="flex-wrap text-text-subtle">
								<MessageCopyAction text={text} />
								<MessageVoteActions
									onVote={(v) => void onVote(message.id, v)}
									value={voteValue}
								/>
								{isLastAssistant && !message.metadata?.realtimeMessageId ? (
									<MessageRegenerateAction onClick={onRegenerate} />
								) : null}
							</MessageActions>
						) : null}
					</AssistantMessageRenderBoundary>
				</div>
			</div>
		</Message>
	);
}

function FutureChatThinkingIndicator() {
	const preloadPhaseProps = getReasoningPropsForPhase("preload", undefined, false);
	return (
		<div className="w-full">
			<div className="flex items-start gap-2 md:gap-3">
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<Reasoning
						className="mb-0"
						defaultOpen={false}
						isStreaming={preloadPhaseProps.isStreaming}
						streamingWave={preloadPhaseProps.streamingWave}
						streamingWaveGradientColor={preloadPhaseProps.streamingWaveGradientColor}
						animatedDots={preloadPhaseProps.animatedDots}
					>
						<AdsReasoningTrigger
							label={getPreloadShimmerLabel()}
							showChevron={false}
							streaming={preloadPhaseProps.triggerStreaming}
						/>
					</Reasoning>
				</div>
			</div>
		</div>
	);
}

function StreamingArtifactMessage({
	documentId,
	kind,
	onOpenArtifactFromCard,
	onRegisterArtifactCard,
	streamingArtifact,
	title,
}: Readonly<{
	documentId: string;
	kind: "text" | "code" | "image" | "sheet";
	onOpenArtifactFromCard: (documentId: string, element: HTMLElement) => void;
	onRegisterArtifactCard: (documentId: string, element: HTMLElement) => void;
	streamingArtifact: FutureChatStreamingArtifact;
	title: string;
}>) {
	return (
		<div
			className="group/message fade-in w-full animate-in duration-200"
			data-role="assistant"
			data-testid="message-assistant-streaming-artifact"
		>
			<div className="flex w-full items-start gap-2 md:gap-3">
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<FutureChatArtifactCard
						action={null}
						displayMode="preview"
						documentId={documentId}
						isStreaming={true}
						kind={kind}
						onOpen={onOpenArtifactFromCard}
						onRegister={onRegisterArtifactCard}
						previewContent={streamingArtifact.content}
						title={title}
					/>
				</div>
			</div>
		</div>
	);
}

function AssistantSuggestionPills({
	messageId,
	onSelectSuggestion,
	suggestions,
}: Readonly<{
	messageId: string;
	onSelectSuggestion: (suggestion: string) => Promise<void>;
	suggestions: ReadonlyArray<string>;
}>) {
	if (suggestions.length === 0) {
		return null;
	}

	return (
		<div
			className="fade-in mb-6 w-full animate-in duration-200"
			data-role="assistant-suggestions"
		>
			<div className="flex w-full items-start gap-2 md:gap-3">
				<div aria-hidden className="size-8 shrink-0" />
				<div className="flex min-w-0 flex-1 justify-end">
					<AssistantSuggestionsSection
						className="max-w-3xl py-0"
						messageId={messageId}
						onSuggestionClick={(suggestion) => {
							void onSelectSuggestion(suggestion);
						}}
						suggestedQuestions={suggestions}
					/>
				</div>
			</div>
		</div>
	);
}

export function FutureChatMessages({
	activeDocumentId,
	compact = false,
	documents,
	editingMessageId,
	isStreaming,
	messages,
	onBuildPlan,
	onEditMessage,
	onOpenArtifactFromCard,
	onRegisterArtifactCard,
	onRegenerate,
	onSelectSuggestion,
	onSetEditingMessageId,
	onVote,
	pendingArtifactResult,
	scrollAnchorMessageId,
	scrollFollowMode,
	showEmptyState = true,
	shouldSuppressLatestAssistantSuggestions = false,
	streamingArtifact,
	streamingArtifactMessageId,
	votes,
}: Readonly<FutureChatMessagesProps>) {
	const scrollSpacerRef = useRef<HTMLDivElement | null>(null);
	const visibleMessages = useMemo(
		() => messages.filter((message) =>
			(message.role === "user" || message.role === "assistant")
			&& message.metadata?.visibility !== "hidden"
		),
		[messages],
	);
	const lastAssistantMessageId = useMemo(() => {
		return [...visibleMessages]
			.reverse()
			.find((message) => message.role === "assistant")?.id ?? null;
	}, [visibleMessages]);
	const allPlanPayloads = useMemo(
		() => getAllPlanWidgetPayloads(messages),
		[messages],
	);
	const acceptedPlanKey = useMemo(
		() => findAcceptedPlanKey(messages),
		[messages],
	);
	const orphanArtifactDisplay = useMemo(() => {
		return resolveFutureChatOrphanArtifactDisplay({
			activeDocumentId,
			documents,
			messages: visibleMessages,
		});
	}, [activeDocumentId, documents, visibleMessages]);
	const streamingAssistantMessageId = useMemo(() => {
		return resolveFutureChatStreamingAssistantMessageId(visibleMessages);
	}, [visibleMessages]);
	const pendingAssistantDisplayState = useMemo(() => {
		return resolveFutureChatPendingAssistantDisplayState({
			isStreaming,
			messages: visibleMessages,
		});
	}, [isStreaming, visibleMessages]);
	const shouldShowPendingAssistantSurface =
		pendingAssistantDisplayState !== "idle";
	const shouldShowStreamingArtifactPreview =
		shouldShowPendingAssistantSurface &&
		Boolean(streamingArtifact?.documentId) &&
		streamingArtifactMessageId === null;
	const shouldShowPreloader =
		shouldShowPendingAssistantSurface && !shouldShowStreamingArtifactPreview;
	const shouldShowEmptyConversationState =
		showEmptyState && visibleMessages.length === 0;
	const handleTargetScrollTop = useCallback(
		(defaultTargetTop: number, { scrollElement }: { scrollElement: HTMLElement }) => {
			return computeFutureChatAnchorScrollTop(
				defaultTargetTop,
				scrollElement,
				scrollSpacerRef,
			);
		},
		[],
	);

	return (
		<Conversation
			className={cn(
				"relative bg-background",
				shouldShowEmptyConversationState && "!flex-none overflow-visible",
			)}
			followMode={scrollFollowMode}
			targetScrollTop={handleTargetScrollTop}
		>
			<FutureChatScrollAnchorSync scrollAnchorMessageId={scrollAnchorMessageId} />
			{shouldShowEmptyConversationState ? (
				<div className="flex flex-col items-center gap-2 py-6">
					<Image
						alt="Chat"
						className="h-auto w-auto object-contain dark:hidden"
						height={67}
						loading="eager"
						src="/illustration-ai/chat/light.svg"
						width={74}
					/>
					<Image
						alt="Chat"
						className="hidden h-auto w-auto object-contain dark:block"
						height={67}
						loading="eager"
						src="/illustration-ai/chat/dark.svg"
						width={74}
					/>
					<Heading size="xlarge">How can I help?</Heading>
				</div>
			) : null}

			<ConversationContent
				className={cn(
					"mx-auto flex min-w-0 flex-col gap-4 px-6 py-6 md:gap-6",
					compact ? "max-w-none" : "max-w-[800px]",
					shouldShowEmptyConversationState && "hidden",
				)}
			>
				{visibleMessages.map((message) => {
						if (message.role === "user") {
							return (
								<UserMessage
									isEditing={editingMessageId === message.id}
									isScrollAnchor={message.id === scrollAnchorMessageId}
									key={message.id}
									message={message}
									onEditMessage={onEditMessage}
									onSetEditingMessageId={onSetEditingMessageId}
								/>
							);
						}

						const artifactDisplay = resolveFutureChatMessageArtifactDisplay({
							documents,
							message,
							pendingArtifactResult,
							streamingArtifact,
							streamingArtifactMessageId,
						});
						const fallbackArtifactDisplay =
							orphanArtifactDisplay?.anchorMessageId === message.id
								? orphanArtifactDisplay
								: null;
							const resolvedArtifactDisplay =
								artifactDisplay ?? fallbackArtifactDisplay;
							const shouldHideSuggestions =
								message.id !== lastAssistantMessageId ||
								shouldSuppressLatestAssistantSuggestions;
							const suggestions =
								shouldHideSuggestions
									? []
									: (
										getLatestDataPart(message, "data-suggested-questions")?.data
											.questions ?? []
									);

							const messagePlanWidget = (() => {
								const widget = getLatestDataPart(message, "data-widget-data");
								if (widget?.data.type !== "plan") return null;
								return parsePlanWidgetPayload(widget.data.payload);
							})();
							const planBuildState = messagePlanWidget
								? isPlanCardBuildable(messagePlanWidget, allPlanPayloads, acceptedPlanKey)
								: null;
							const isQuestionCardResolved = (() => {
								const widget = getLatestDataPart(message, "data-widget-data");
								if (widget?.data.type !== "question-card") {
									return false;
								}

								const questionCard = parseQuestionCardPayload(widget.data.payload);
								if (!questionCard) {
									return false;
								}

								return hasMatchingClarificationResponse(messages, {
									...questionCard,
									sourceMessageId: message.id,
								});
							})();

							return (
								<Fragment key={message.id}>
								<AssistantMessage
									artifactCard={
										resolvedArtifactDisplay ? (
											<FutureChatArtifactCard
												action={resolvedArtifactDisplay.action}
												displayMode={resolvedArtifactDisplay.displayMode}
												documentId={resolvedArtifactDisplay.documentId}
												isStreaming={resolvedArtifactDisplay.isStreaming}
												kind={resolvedArtifactDisplay.kind}
												onOpen={onOpenArtifactFromCard}
												onRegister={onRegisterArtifactCard}
												previewContent={resolvedArtifactDisplay.previewContent}
												title={resolvedArtifactDisplay.title}
											/>
										) : null
									}
									isLastAssistant={message.id === lastAssistantMessageId}
									isQuestionCardResolved={isQuestionCardResolved}
									isStreaming={isStreaming}
									isThinkingLifecycleStreaming={isStreaming && message.id === streamingAssistantMessageId}
									message={message}
									onBuildPlan={onBuildPlan}
									onRegenerate={onRegenerate}
									onVote={onVote}
									planBuildDisabled={planBuildState ? !planBuildState.buildable : undefined}
									planBuildDisabledReason={planBuildState?.reason}
									voteValue={votes[message.id]}
								/>
								<AssistantSuggestionPills
									messageId={message.id}
									onSelectSuggestion={onSelectSuggestion}
									suggestions={suggestions}
								/>
							</Fragment>
						);
					})}

				{shouldShowStreamingArtifactPreview && streamingArtifact?.documentId ? (
					<StreamingArtifactMessage
						documentId={streamingArtifact.documentId}
						kind={streamingArtifact.kind}
						onOpenArtifactFromCard={onOpenArtifactFromCard}
						onRegisterArtifactCard={onRegisterArtifactCard}
						streamingArtifact={streamingArtifact}
						title={streamingArtifact.title}
					/>
				) : shouldShowPreloader ? (
					<FutureChatThinkingIndicator />
				) : null}
				<div aria-hidden className="h-0 shrink-0" ref={scrollSpacerRef} />
			</ConversationContent>

			<ConversationScrollButton className="z-10 transition-all" />
		</Conversation>
	);
}
