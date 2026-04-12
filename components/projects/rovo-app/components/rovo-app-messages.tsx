"use client";

import { motion, useReducedMotion } from "motion/react";
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
import { ArtifactCard, type ArtifactKind } from "@/components/ui-ai/artifact";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from "@/components/ui-ai/chain-of-thought";
import { CodeBlock } from "@/components/ui-ai/code-block";
import {
	AdsReasoningTrigger,
	Reasoning,
	ReasoningContent,
	isTimelineOnlyContent,
} from "@/components/ui-ai/reasoning";
import { ToolInput, ToolOutput } from "@/components/ui-ai/tool";
import { Icon } from "@/components/ui/icon";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import { InlineEdit } from "@/components/ui/inline-edit";
import { getRovoAppInterruptionLabel } from "@/lib/rovo-app-interruptions";
import {
	resolveRovoAppMessageArtifactDisplay,
	resolveRovoAppOrphanArtifactDisplay,
	type RovoAppPendingArtifactResult,
} from "@/components/projects/rovo-app/lib/rovo-app-message-artifacts";
import {
	sanitizeRovoAppAssistantText,
	shouldRenderRovoAppAssistantActions,
	shouldRenderRovoAppAssistantText,
	shouldRenderRovoAppAssistantMessage,
	shouldRenderRovoAppVisibleWidget,
	shouldRenderRovoAppWidget,
} from "@/components/projects/rovo-app/lib/rovo-app-message-display";
import {
	resolveRovoAppPendingAssistantDisplayState,
	resolveRovoAppStreamingAssistantMessageId,
} from "@/components/projects/rovo-app/lib/rovo-app-streaming-assistant";
import {
	resolveRovoAppThinkingStatusPhase,
	resolveRovoAppThinkingVisibility,
} from "@/components/projects/rovo-app/lib/rovo-app-thinking-status-phase";
import {
	resolveRovoAppScrollAnchorLayout,
} from "@/components/projects/rovo-app/lib/rovo-app-scroll-anchor";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import { AssistantSuggestionsSection } from "@/components/projects/shared/components/assistant-suggestions-section";
import { PlanWidgetInlineCard } from "@/components/projects/shared/components/plan-widget-inline-card";
import { PreloadThinkingIndicator } from "@/components/projects/shared/components/preload-thinking-indicator";
import { useDynamicThinkingLabel } from "@/components/projects/shared/hooks/use-dynamic-thinking-label";
import {
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
	getMessageReasoningTimestamps,
	getMessageInterruption,
	getLatestDataPart,
	getLatestTodoQueue,
	getLatestRouteDecision,
	getMessageReasoning,
	getMessageSources,
	getMessageText,
	getThinkingToolCallSummaries,
	buildThinkingNarrationMap,
	hasTurnCompleteSignal,
	isMessageTextStreaming,
	type AgentExecutionStatus,
	type AgentExecutionSummary,
	type RoutingDecision,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import {
	getLatestRovoAppTodoProgress,
	type RovoAppTodoProgressItem,
} from "@/components/projects/rovo-app/lib/rovo-app-update-todo-progress";
import {
	getLatestPendingPlanWidget,
	getLatestPlanWidgetPayload,
	parsePlanWidgetPayload,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import {
	hasMatchingClarificationResponse,
	parseQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import { resolvePlanVisualIdentity } from "@/components/projects/shared/lib/plan-identity";
import type { VisualIdentity } from "@/components/projects/shared/lib/visual-identity";
import { cn } from "@/lib/utils";
import { renderResolvedToolIcon, resolveToolIcon } from "@/components/projects/shared/lib/tool-icon-resolver";
import type { RovoAppDocument } from "@/lib/rovo-app-types";
import type { RovoAppStreamingArtifact } from "@/components/projects/rovo-app/lib/rovo-app-streaming-artifact";
import Image from "next/image";
import { Component, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnswerCard } from "@/components/blocks/answer-card/components/answer-card";
import Heading from "@/components/blocks/shared-ui/heading";

interface RovoAppMessagesProps {
	activeDocumentId: string | null;
	compact?: boolean;
	extraHorizontalPaddingWhenCompact?: boolean;
	documents: ReadonlyArray<RovoAppDocument>;
	editingMessageId: string | null;
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	onBuildPlan?: (planWidget: ParsedPlanWidgetPayload) => void | Promise<void>;
	onEditMessage: (messageId: string, nextText: string) => Promise<void>;
	onOpenArtifactFromCard: (documentId: string, element: HTMLElement) => void;
	onOpenPlanPreview?: (planWidget: ParsedPlanWidgetPayload, sourceMessageId?: string) => void;
	onRegisterArtifactCard: (documentId: string, element: HTMLElement) => void;
	onRegenerate: () => void;
	onScrollActiveUserMessageChange?: (messageId: string | null) => void;
	onSelectSuggestion: (suggestion: string) => Promise<void>;
	onSetEditingMessageId: (messageId: string | null) => void;
	onVote: (messageId: string, value: "up" | "down" | null) => Promise<void>;
	pendingPlanMetadataMessageIds: ReadonlySet<string>;
	pendingArtifactResult: RovoAppPendingArtifactResult | null;
	scrollAnchorMessageId: string | null;
	scrollFollowMode: ConversationFollowMode;
	showEmptyState?: boolean;
	shouldSuppressLatestAssistantSuggestions?: boolean;
	streamingArtifact: RovoAppStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	votes: Record<string, "up" | "down">;
}

const ROVO_APP_SCROLL_ANCHOR_SELECTOR = "[data-rovo-app-scroll-anchor='true']";

const StepThinkingIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => (
	<Icon render={<AiAgentIcon label={label} size={size} spacing={spacing} {...props} />} />
);
const StepChecklistIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => (
	<Icon render={<ListChecklistIcon label={label} size={size} spacing={spacing} {...props} />} />
);
const StepAgentsIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => (
	<Icon render={<PeopleGroupIcon label={label} size={size} spacing={spacing} {...props} />} />
);
const StepStreamIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => (
	<Icon render={<AiGenerativeTextSummaryIcon label={label} size={size} spacing={spacing} {...props} />} />
);

function isHermesContextTranscriptMessage(
	message: Pick<RovoUIMessage, "id" | "role" | "parts">,
): boolean {
	if (message.role !== "assistant") {
		return false;
	}

	if (
		message.id.startsWith("hermes-memory-")
		|| message.id.startsWith("hermes-skill-")
	) {
		return true;
	}

	const widgetType = getLatestDataPart(message, "data-widget-data")?.data.type;
	if (widgetType === "hermes-memory" || widgetType === "hermes-skill") {
		return true;
	}

	return getLatestDataPart(message, "data-route-decision")?.data.reason === "hermes_context_widget";
}

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
	if (state === "pending") {
		return "pending";
	}
	return "complete";
}

function isToolCallStepOpenByDefault(state: string): boolean {
	return (
		state === "running" ||
		state === "awaiting-input" ||
		state === "approval-requested" ||
		state === "error" ||
		state === "denied"
	);
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
		console.error("[RovoApp] Assistant message render failed", {
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

function computeRovoAppAnchorScrollTop(
	defaultTargetTop: number,
	scrollElement: HTMLElement,
	scrollSpacerRef: RefObject<HTMLDivElement | null>,
): number {
	const scrollAnchorElement = scrollElement.querySelector<HTMLElement>(
		ROVO_APP_SCROLL_ANCHOR_SELECTOR,
	);
	if (!scrollAnchorElement) {
		if (scrollSpacerRef.current) {
			scrollSpacerRef.current.style.height = "0px";
		}
		return defaultTargetTop;
	}

	const scrollRect = scrollElement.getBoundingClientRect();
	const scrollAnchorRect = scrollAnchorElement.getBoundingClientRect();
	const { spacerHeight, targetScrollTop } = resolveRovoAppScrollAnchorLayout({
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

function RovoAppScrollAnchorSync({
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

function RovoAppScrollActiveTracker({
	onActiveChange,
}: Readonly<{
	onActiveChange: (messageId: string | null) => void;
}>) {
	const { scrollRef } = useConversationContext();
	const onActiveChangeRef = useRef(onActiveChange);

	useEffect(() => {
		onActiveChangeRef.current = onActiveChange;
	});

	useEffect(() => {
		const scrollElement = scrollRef.current;
		if (!scrollElement) return;

		function handleScroll() {
			const container = scrollRef.current;
			if (!container) return;

			const containerRect = container.getBoundingClientRect();
			const threshold = containerRect.top + containerRect.height * 0.3;
			const userMessageNodes = container.querySelectorAll<HTMLElement>("[data-message-id][data-role='user']");

			let activeId: string | null = null;
			for (const node of userMessageNodes) {
				const nodeRect = node.getBoundingClientRect();
				if (nodeRect.top <= threshold) {
					activeId = node.getAttribute("data-message-id");
				}
			}

			// When scrolled to top, always prefer the first (topmost) user message.
			// Without this, when multiple messages are close together and both above
			// the threshold, the last one wins and the first can never be highlighted.
			if (userMessageNodes.length > 0 && container.scrollTop <= 10) {
				activeId = userMessageNodes[0].getAttribute("data-message-id");
			}

			onActiveChangeRef.current(activeId);
		}

		handleScroll();
		scrollElement.addEventListener("scroll", handleScroll, { passive: true });
		return () => scrollElement.removeEventListener("scroll", handleScroll);
	}, [scrollRef]);

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
	const isDismissed = message.metadata?.clarificationStatus === "dismissed";
	const clarificationSummaryRows = (() => {
		if (isDismissed) return [];
		const meta = message.metadata;
		if (!meta || meta.source !== "clarification-submit") return [];
		if (!Array.isArray(meta.clarificationSummary)) return [];
		return meta.clarificationSummary.filter(
			(row): row is { question: string; answer: string; status?: "skipped" } =>
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
			data-rovo-app-scroll-anchor={isScrollAnchor ? "true" : undefined}
			data-message-id={message.id}
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
				<InlineEdit
					value={getMessageText(message)}
					multiline
					startWithEditViewOpen
					keepEditViewOpenOnBlur
					onConfirm={(nextValue) => void onEditMessage(message.id, nextValue)}
					onCancel={() => onSetEditingMessageId(null)}
				/>
			) : isDismissed ? (
				<AnswerCard label="Questions dismissed" rows={[]} />
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

function getTodoProgressVariant(
	status: RovoAppTodoProgressItem["status"],
): ComponentProps<typeof Lozenge>["variant"] {
	if (status === "completed") {
		return "success";
	}
	if (status === "in_progress") {
		return "information";
	}
	return "neutral";
}

function getTodoProgressLabel(
	status: RovoAppTodoProgressItem["status"],
): string {
	if (status === "completed") {
		return "Completed";
	}
	if (status === "in_progress") {
		return "In progress";
	}
	return "Pending";
}

function TraceTodoProgressSection({
	items,
}: Readonly<{
	items: ReadonlyArray<RovoAppTodoProgressItem>;
}>) {
	return (
		<div className="space-y-2">
			{items.map((item) => (
				<div
					key={item.id}
					className="rounded-lg border border-border/60 bg-background/60 px-3 py-2"
				>
					<div className="flex flex-wrap items-start gap-2">
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-text">{item.label}</p>
							<div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-subtle">
								<span>{item.id}</span>
								{item.activeForm && item.activeForm !== item.content ? (
									<span>{item.content}</span>
								) : null}
							</div>
						</div>
						<Lozenge variant={getTodoProgressVariant(item.status)}>
							{getTodoProgressLabel(item.status)}
						</Lozenge>
					</div>
				</div>
			))}
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
				<div key={execution.taskId} className="space-y-2">
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
						<div className="text-xs text-text-subtle">
							<MessageContent>
								<MessageResponse>{execution.content}</MessageResponse>
							</MessageContent>
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
	isPlanMetadataPending,
	isStreaming,
	isThinkingLifecycleStreaming,
	message,
	onBuildPlan,
	onOpenPlanPreview,
	onRegenerate,
	onVote,
	planBuildDisabled,
	planBuildDisabledReason,
	voteValue,
}: Readonly<{
	artifactCard: React.ReactNode;
	isQuestionCardResolved: boolean;
	isLastAssistant: boolean;
	isPlanMetadataPending: boolean;
	isStreaming: boolean;
	isThinkingLifecycleStreaming: boolean;
	message: RovoUIMessage;
	onBuildPlan?: (planWidget: ParsedPlanWidgetPayload) => void | Promise<void>;
	onOpenPlanPreview?: (planWidget: ParsedPlanWidgetPayload, sourceMessageId?: string) => void;
	onRegenerate: () => void;
	onVote: (messageId: string, value: "up" | "down" | null) => Promise<void>;
	planBuildDisabled?: boolean;
	planBuildDisabledReason?: string;
	voteValue?: "up" | "down";
}>) {
	const interruption = getMessageInterruption(message);
	const interruptionLabel = getRovoAppInterruptionLabel(interruption);
	const text = sanitizeRovoAppAssistantText(getMessageText(message));
	const reasoning = getMessageReasoning(message);
	const widget = getLatestDataPart(message, "data-widget-data");
	const widgetLoading = getLatestDataPart(message, "data-widget-loading");
	const widgetError = getLatestDataPart(message, "data-widget-error");
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
	const shouldShowWidget = shouldRenderRovoAppWidget({
		hasWidget: Boolean(widget),
		routeDecision,
		widgetType,
	});
	const shouldHideResolvedQuestionCard =
		widgetType === "question-card" && isQuestionCardResolved;
	const hasVisibleWidget = shouldRenderRovoAppVisibleWidget({
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
	const thinkingNarrationMap = buildThinkingNarrationMap(message);
	const latestTodoProgress = getLatestRovoAppTodoProgress(thinkingToolCalls);
	const todoProgressItems = latestTodoProgress?.items ?? [];
	const latestTodoQueue = getLatestTodoQueue(message);
	const todoQueueItems = latestTodoQueue?.items ?? [];
	const agentExecutions = getAgentExecutionSummaries(message);
	const hasThinkingStatusPart = thinkingStatusParts.length > 0;
	const hasThinkingEvents = thinkingEventParts.length > 0;
	const hasThinkingToolCalls = thinkingToolCalls.length > 0;
	const hasAwaitingInputToolCalls = thinkingToolCalls.some(
		(toolCall) => toolCall.state === "awaiting-input",
	);
	const hasTodoProgressItems = todoProgressItems.length > 0;
	const hasLegacyTodoQueueItems =
		!hasTodoProgressItems && todoQueueItems.length > 0;
	const hasAgentExecutions = agentExecutions.length > 0;
	const hasTraceDataSignals =
		hasThinkingEvents ||
		hasTodoProgressItems ||
		hasLegacyTodoQueueItems ||
		hasAgentExecutions;
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
		resolveRovoAppThinkingVisibility({
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
		hasTodoProgressItems ||
		hasLegacyTodoQueueItems ||
		hasAgentExecutions;
	const isThinkingStreaming =
		isThinkingLifecycleStreaming && thinkingActive && hasBackendThinkingActivity;

	const accumulatedThinkingContent = thinkingNarrationMap.unassociated
		.join("\n\n");
	const hasThinkingText = Boolean(accumulatedThinkingContent);
	const shouldShowThinkingSection =
		hasThinkingText &&
		!(isTimelineOnlyContent(accumulatedThinkingContent) && hasThinkingToolCalls);
	const hasPlanNarrationText = shouldShowWidget && parsedPlanWidget !== null && Boolean(text);
	const hasThinkingDetails =
		shouldShowThinkingSection ||
		hasTodoProgressItems ||
		hasLegacyTodoQueueItems ||
		hasAgentExecutions ||
		hasThinkingToolCalls ||
		hasPlanNarrationText;
	const shouldAutoOpenThinking =
		isThinkingStreaming ||
		hasAwaitingInputToolCalls ||
		thinkingToolCalls.some((toolCall) =>
			toolCall.state === "running" ||
			toolCall.state === "approval-requested"
		);
	const [thinkingUserOverride, setThinkingUserOverride] = useState<boolean | null>(null);
	const prevAutoOpenRef = useRef(shouldAutoOpenThinking);
	// Reset user override when streaming resumes (new turn / retry)
	useEffect(() => {
		if (shouldAutoOpenThinking && !prevAutoOpenRef.current) {
			const timeoutId = window.setTimeout(() => {
				setThinkingUserOverride(null);
			}, 0);
			prevAutoOpenRef.current = shouldAutoOpenThinking;
			return () => window.clearTimeout(timeoutId);
		}
		prevAutoOpenRef.current = shouldAutoOpenThinking;
	}, [shouldAutoOpenThinking]);
	const isThinkingOpen = thinkingUserOverride ?? (hasThinkingDetails && shouldAutoOpenThinking);

	const lastThinkingStatusPart =
		thinkingStatusParts[thinkingStatusParts.length - 1] ?? null;
	const lastThinkingEventPart =
		thinkingEventParts[thinkingEventParts.length - 1] ?? null;
	const thinkingTimestamps = getMessageReasoningTimestamps(message);

	const { phase: thinkingPhase, duration: thinkingDuration } = useReasoningPhase({
		isStreaming: isThinkingStreaming,
		hasMessageText: hasBackendThinkingActivity,
		responseKey: message.id,
		autoIdle: false,
		persistedStartTime: thinkingTimestamps.startedAt,
		persistedEndTime: thinkingTimestamps.completedAt,
	});
	const thinkingReasoningPhase = resolveRovoAppThinkingStatusPhase({
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
	const shouldRenderAssistantText = shouldRenderRovoAppAssistantText({
		hasText: Boolean(text),
		hasTurnComplete,
		hasToolActivity: hasThinkingToolCalls || hasTraceDataSignals,
		hasWidgetSignal: Boolean(widget) || widgetLoading?.data.loading === true,
		isFallbackRoute,
		isResponseInFlight,
		isTextPresentation,
		shouldRenderPlanWidget,
	});
	const shouldRenderAssistantActions =
		shouldRenderRovoAppAssistantActions({
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
		shouldRenderRovoAppAssistantMessage({
			hasArtifactCard: Boolean(artifactCard),
			hasAssistantText: shouldRenderAssistantText,
			hasInterruption: Boolean(interruptionLabel),
			hasReasoning: Boolean(reasoning?.text) || thinkingActive,
			hasSources: sources.length > 0,
			hasWidget: hasVisibleWidget,
			hasWidgetError: Boolean(widgetError),
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
								open={isThinkingOpen}
								onOpenChange={setThinkingUserOverride}
							>
								<ChainOfThoughtHeader
								state={thinkingReasoningPhase === "completed" ? "completed" : thinkingReasoningPhase === "thinking" ? "thinking" : "preload"}
								duration={thinkingReasoningPhase === "completed" ? thinkingDuration : undefined}
								showChevron={hasThinkingDetails}
							>
								{thinkingTriggerLabel}
							</ChainOfThoughtHeader>
								{hasThinkingDetails ? (
									<ChainOfThoughtContent>
										{shouldShowThinkingSection ? (
											<ChainOfThoughtStep
												icon={StepThinkingIcon}
												label={getReasoningSectionTitle("thinking")}
												status={isThinkingStreaming ? "active" : "complete"}
											>
												<CodeBlock
												className="text-xs"
												code={accumulatedThinkingContent}
												language="markdown"
											/>
											</ChainOfThoughtStep>
										) : null}
										{hasTodoProgressItems ? (
											<ChainOfThoughtStep
												icon={StepChecklistIcon}
												label={getReasoningSectionTitle("steps")}
												status={isThinkingStreaming ? "active" : "complete"}
											>
												<TraceTodoProgressSection items={todoProgressItems} />
											</ChainOfThoughtStep>
										) : null}
										{hasLegacyTodoQueueItems ? (
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
										{thinkingToolCalls.map((toolCall, index) => {
											const narration = toolCall.toolCallId
												? thinkingNarrationMap.byToolCallId.get(toolCall.toolCallId)
												: undefined;
											return (
												<ChainOfThoughtStep
													key={`${message.id}-cot-tool-${toolCall.id}-${index}`}
													collapsible
													defaultOpen={isToolCallStepOpenByDefault(toolCall.state)}
													iconRender={renderResolvedToolIcon(resolveToolIcon({ toolName: toolCall.toolName, title: toolCall.toolName, input: toolCall.input, mcpServer: toolCall.mcpServer }), { className: "size-4" })}
													label={toolCall.toolName}
													status={toolStateToCoTStatus(toolCall.state)}
												>
													{narration && narration.length > 0 ? (
														<div className="whitespace-pre-wrap text-xs text-text-subtle leading-5">
															{narration.join("\n\n")}
														</div>
													) : null}
													{toolCall.input !== undefined ? (
														<ToolInput input={toolCall.input} />
													) : null}
													<ToolOutput
														errorText={toolCall.errorText}
														output={toolCall.output}
														outputPreview={toolCall.outputPreview}
														outputBytes={toolCall.outputBytes}
														outputTruncated={toolCall.outputTruncated}
														suppressedRawOutput={toolCall.suppressedRawOutput}
													/>
												</ChainOfThoughtStep>
											);
										})}
										{hasPlanNarrationText ? (
											<ChainOfThoughtStep
												icon={StepStreamIcon}
												label={getReasoningSectionTitle("stream")}
												status={isMessageTextStreaming(message) ? "active" : "complete"}
											>
												<div className="whitespace-pre-wrap text-xs text-text-subtle leading-5">
													{text}
												</div>
											</ChainOfThoughtStep>
										) : null}
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

					{shouldRenderPlanWidget ? (
						<div className="w-full pt-2">
							<PlanWidgetInlineCard
								title={parsedPlanWidget.title}
								description={parsedPlanWidget.description}
								shortDescription={parsedPlanWidget.shortDescription}
								markdown={parsedPlanWidget.markdown}
								tasks={parsedPlanWidget.tasks}
								isStreaming={isPlanWidgetStreaming}
								isMetadataPending={isPlanMetadataPending}
								onBuild={onBuildPlan ? () => onBuildPlan(parsedPlanWidget) : undefined}
								onOpenPreview={onOpenPlanPreview ? () => onOpenPlanPreview(parsedPlanWidget, message.id) : undefined}
								isBuildDisabled={planBuildDisabled}
								buildDisabledReason={planBuildDisabledReason}
								shouldAutoCollapse={planBuildDisabled === true}
							/>
						</div>
					) : shouldShowWidget && widget && !shouldHideResolvedQuestionCard ? (
							<div className="w-full">
								<GenerativeWidgetCard
									thinkingToolCalls={thinkingToolCalls}
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

function RovoAppThinkingIndicator() {
	return <PreloadThinkingIndicator label={getPreloadShimmerLabel()} />;
}

function StreamingArtifactMessage({
	documentId,
	visualIdentity,
	kind,
	onOpenArtifactFromCard,
	onRegisterArtifactCard,
	streamingArtifact,
	title,
	versionNumber = 1,
}: Readonly<{
	documentId: string;
	visualIdentity?: VisualIdentity;
	kind: ArtifactKind;
	onOpenArtifactFromCard: (documentId: string, element: HTMLElement) => void;
	onRegisterArtifactCard: (documentId: string, element: HTMLElement) => void;
	streamingArtifact: RovoAppStreamingArtifact;
	title: string;
	versionNumber?: number;
}>) {
	return (
		<div
			className="group/message fade-in w-full animate-in duration-200"
			data-role="assistant"
			data-testid="message-assistant-streaming-artifact"
		>
			<div className="flex w-full items-start gap-2 md:gap-3">
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<ArtifactCard
						action={null}
						displayMode="preview"
						visualIdentity={visualIdentity}
						isStreaming={true}
						kind={kind}
						onOpen={(element) => onOpenArtifactFromCard(documentId, element)}
						onRegister={(element) => onRegisterArtifactCard(documentId, element)}
						previewContent={streamingArtifact.content}
						title={title}
						versionNumber={versionNumber}
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

export function RovoAppMessages({
	activeDocumentId,
	compact = false,
	extraHorizontalPaddingWhenCompact = false,
	documents,
	editingMessageId,
	isStreaming,
	messages,
	onBuildPlan,
	onEditMessage,
	onOpenArtifactFromCard,
	onOpenPlanPreview,
	onRegisterArtifactCard,
	onRegenerate,
	onScrollActiveUserMessageChange,
	onSelectSuggestion,
	onSetEditingMessageId,
	onVote,
	pendingPlanMetadataMessageIds,
	pendingArtifactResult,
	scrollAnchorMessageId,
	scrollFollowMode,
	showEmptyState = true,
	shouldSuppressLatestAssistantSuggestions = false,
	streamingArtifact,
	streamingArtifactMessageId,
	votes,
}: Readonly<RovoAppMessagesProps>) {
	const shouldReduceMotion = useReducedMotion();
	const scrollSpacerRef = useRef<HTMLDivElement | null>(null);
	const visibleMessages = useMemo(
		() => messages.filter((message) =>
			(message.role === "user" || message.role === "assistant")
			&& message.metadata?.visibility !== "hidden"
			&& !isHermesContextTranscriptMessage(message)
		),
		[messages],
	);
	const lastAssistantMessageId = useMemo(() => {
		return [...visibleMessages]
			.reverse()
			.find((message) => message.role === "assistant")?.id ?? null;
	}, [visibleMessages]);
	const pendingPlanReview = useMemo(
		() => getLatestPendingPlanWidget(messages),
		[messages],
	);
	const latestPlanPayload = useMemo(
		() => getLatestPlanWidgetPayload(messages),
		[messages],
	);
	const latestPlanVisualIdentity = latestPlanPayload
		? (latestPlanPayload.visualIdentity ?? resolvePlanVisualIdentity(latestPlanPayload.title))
		: undefined;
	const latestPlanTitle = latestPlanPayload?.title ?? null;
	const latestPlanShortDescription = latestPlanPayload?.shortDescription?.trim() || null;
	const orphanArtifactDisplay = useMemo(() => {
		return resolveRovoAppOrphanArtifactDisplay({
			activeDocumentId,
			documents,
			fallbackPreviewSummary: latestPlanShortDescription,
			fallbackTitle: latestPlanTitle,
			messages: visibleMessages,
		});
	}, [activeDocumentId, documents, latestPlanShortDescription, latestPlanTitle, visibleMessages]);
	const streamingAssistantMessageId = useMemo(() => {
		return resolveRovoAppStreamingAssistantMessageId(visibleMessages);
	}, [visibleMessages]);
	const pendingAssistantDisplayState = useMemo(() => {
		return resolveRovoAppPendingAssistantDisplayState({
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
			return computeRovoAppAnchorScrollTop(
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
			<RovoAppScrollAnchorSync scrollAnchorMessageId={scrollAnchorMessageId} />
				{onScrollActiveUserMessageChange ? (
					<RovoAppScrollActiveTracker onActiveChange={onScrollActiveUserMessageChange} />
				) : null}
			{shouldShowEmptyConversationState ? (
				<div className="flex flex-col items-center gap-2 py-6">
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: [0, 0.4, 0, 1] }}
						style={{ willChange: "transform, opacity" }}
					>
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
					</motion.div>
					<motion.div
						initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: [0, 0.4, 0, 1], delay: 0.1 }}
						style={{ willChange: "transform, opacity" }}
					>
						<Heading size="xlarge">How can I help?</Heading>
					</motion.div>
				</div>
			) : null}

			<ConversationContent
				className={cn(
					"mx-auto flex min-w-0 flex-col gap-4 py-6 md:gap-6",
					extraHorizontalPaddingWhenCompact && compact ? "px-9" : "px-3",
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

						const artifactDisplay = resolveRovoAppMessageArtifactDisplay({
							documents,
							fallbackPreviewSummary: latestPlanShortDescription,
							fallbackTitle: latestPlanTitle,
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
							const isActivePendingPlan =
								Boolean(messagePlanWidget?.deferredToolCallId) &&
								pendingPlanReview?.sourceMessageId === message.id;
							const planBuildDisabledReason = messagePlanWidget
								? isActivePendingPlan
									? undefined
									: pendingPlanReview
										? "A newer reply superseded this plan."
										: "This plan is no longer awaiting review."
								: undefined;
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
													<ArtifactCard
														action={resolvedArtifactDisplay.action}
														displayMode={resolvedArtifactDisplay.displayMode}
														visualIdentity={latestPlanVisualIdentity}
														isStreaming={resolvedArtifactDisplay.isStreaming}
														kind={resolvedArtifactDisplay.kind}
														onOpen={(element) =>
															onOpenArtifactFromCard(resolvedArtifactDisplay.documentId, element)
														}
														onRegister={(element) =>
															onRegisterArtifactCard(resolvedArtifactDisplay.documentId, element)
														}
														previewContent={resolvedArtifactDisplay.previewContent}
														previewSummary={resolvedArtifactDisplay.previewSummary ?? undefined}
														title={resolvedArtifactDisplay.title}
														versionNumber={resolvedArtifactDisplay.document?.versions.length ?? 1}
													/>
												) : null
											}
											isLastAssistant={message.id === lastAssistantMessageId}
											isPlanMetadataPending={pendingPlanMetadataMessageIds.has(message.id)}
											isQuestionCardResolved={isQuestionCardResolved}
											isStreaming={isStreaming}
											isThinkingLifecycleStreaming={isStreaming && message.id === streamingAssistantMessageId}
											message={message}
											onBuildPlan={onBuildPlan}
											onOpenPlanPreview={onOpenPlanPreview}
											onRegenerate={onRegenerate}
											onVote={onVote}
											planBuildDisabled={messagePlanWidget ? !isActivePendingPlan : undefined}
											planBuildDisabledReason={planBuildDisabledReason}
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
						visualIdentity={latestPlanVisualIdentity}
						kind={streamingArtifact.kind}
						onOpenArtifactFromCard={onOpenArtifactFromCard}
						onRegisterArtifactCard={onRegisterArtifactCard}
						streamingArtifact={streamingArtifact}
						title={streamingArtifact.title}
						versionNumber={
							documents.find((document) => document.id === streamingArtifact.documentId)?.versions.length
							?? 1
						}
					/>
				) : shouldShowPreloader ? (
					<RovoAppThinkingIndicator />
				) : null}
				<div aria-hidden className="h-0 shrink-0" ref={scrollSpacerRef} />
			</ConversationContent>

			<ConversationScrollButton className="z-10 transition-all" />
		</Conversation>
	);
}
