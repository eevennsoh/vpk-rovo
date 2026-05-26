"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ErrorInfo, ReactNode, RefObject } from "react";
import { Attachment, AttachmentPreview, Attachments } from "@/components/ui-custom/attachments";
import { Conversation, ConversationContent, ConversationScrollButton, type ConversationFollowMode, useConversationContext } from "@/components/ui-custom/conversation";
import { Message, MessageActions, MessageContent, MessageCopyAction, MessageEditAction, MessageRegenerateAction, MessageResponse, MessageVoteActions } from "@/components/ui-custom/message";
import { ControlledRovoIllustration } from "@/components/ui-custom/rovo-illustration";
import { ArtifactCard, type ArtifactKind } from "@/components/ui-custom/artifact";
import { AdsReasoningTrigger, Reasoning, ReasoningContent } from "@/components/ui-custom/reasoning";
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/ui/icon-tile";
import { InlineEdit } from "@/components/ui/inline-edit";
import { AgentResultCard } from "@/components/projects/sidebar-chat/components/agent-result-card";
import { getRovoAppInterruptionLabel } from "@/lib/rovo-app-interruptions";
import { resolveRovoAppMessageArtifactDisplay, resolveRovoAppOrphanArtifactDisplay, type RovoAppPendingArtifactResult } from "@/components/projects/studio/lib/rovo-app-message-artifacts";
import {
	sanitizeRovoAppAssistantText,
	looksLikeBrowserFallbackAssistantText,
	shouldRenderRovoAppAssistantActions,
	shouldRenderRovoAppAssistantText,
	shouldRenderRovoAppAssistantMessage,
	shouldRenderRovoAppVisibleWidget,
	shouldRenderRovoAppWidget,
} from "@/components/projects/studio/lib/rovo-app-message-display";
import { resolveRovoAppPendingAssistantDisplayState, resolveRovoAppStreamingAssistantMessageId } from "@/components/projects/studio/lib/rovo-app-streaming-assistant";
import { resolveRovoAppScrollAnchorLayout } from "@/components/projects/studio/lib/rovo-app-scroll-anchor";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import { AssistantSuggestionsSection } from "@/components/projects/shared/components/assistant-suggestions-section";
import { PlanWidgetInlineCard } from "@/components/projects/shared/components/plan-widget-inline-card";
import { PreloadThinkingIndicator } from "@/components/projects/shared/components/preload-thinking-indicator";
import { AssistantThinkingTrace, useAssistantThinkingTraceState } from "@/components/projects/shared/components/assistant-thinking-trace";
import { getPreloadShimmerLabel } from "@/components/projects/shared/lib/reasoning-labels";
import {
	getAllDataParts,
	getMessageInterruption,
	getLatestDataPart,
	getMessageAgentResult,
	getLatestRouteDecision,
	getMessageReasoning,
	getMessageSources,
	getMessageText,
	hasTurnCompleteSignal,
	isMessageTextStreaming,
	type RovoDataParts,
	type RoutingDecision,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { getLatestPendingPlanWidget, getLatestPlanWidgetPayload, parsePlanWidgetPayload, type ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import { hasMatchingClarificationResponse, parseQuestionCardPayload } from "@/components/projects/shared/lib/question-card-widget";
import { resolvePlanVisualIdentity } from "@/components/projects/shared/lib/plan-identity";
import type { VisualIdentity } from "@/components/projects/shared/lib/visual-identity";
import { cn } from "@/lib/utils";
import { BrowserScreenshotPart } from "@/components/projects/studio/components/rovo-app-browser-screenshot";
import type { RovoAppDocument } from "@/lib/rovo-app-types";
import type { RovoAppStreamingArtifact } from "@/components/projects/studio/lib/rovo-app-streaming-artifact";
import { isRovoAgentProfile, type RovoAgentProfile } from "@/components/projects/studio/data/agent-profiles";
import Image from "next/image";
import { Component, Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnswerCard } from "@/components/blocks/answer-card/components/answer-card";
import Heading from "@/components/blocks/shared-ui/heading";

interface RovoAppMessagesProps {
	activeDocumentId: string | null;
	compact?: boolean;
	extraHorizontalPaddingWhenCompact?: boolean;
	isMaxMode?: boolean;
	documents: ReadonlyArray<RovoAppDocument>;
	editingMessageId: string | null;
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	onBuildPlan?: (planWidget: ParsedPlanWidgetPayload) => void | Promise<void>;
	onEditMessage: (messageId: string, nextText: string) => Promise<void>;
	onOpenArtifactFromCard: (documentId: string, element: HTMLElement) => void;
	onOpenBrowserPreview?: () => void;
	onOpenPlanPreview?: (planWidget: ParsedPlanWidgetPayload, sourceMessageId?: string) => void;
	onAgentResultSelect?: (agent: RovoDataParts["agent-result"], options?: { sourceMessageId?: string }) => void;
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
	selectedAgent?: RovoAgentProfile | null;
	showEmptyState?: boolean;
	shouldSuppressLatestAssistantSuggestions?: boolean;
	streamingArtifact: RovoAppStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	votes: Record<string, "up" | "down">;
}

const ROVO_APP_SCROLL_ANCHOR_SELECTOR = "[data-rovo-app-scroll-anchor='true']";
const ROVO_APP_EMPTY_STATE = {
	default: {
		heading: "Keep work moving with agents",
		id: "default",
		illustrationClassName: "h-[110px] w-[110px]",
		rovoIllustrationId: "ai",
		rovoIllustrationSize: 110,
	},
	max: {
		alt: "Max",
		darkIllustrationSrc: "/illustration-ai/max/dark.gif",
		heading: "Let's plan your next move",
		height: 67,
		id: "max",
		illustrationClassName: "h-[67px] w-[74px]",
		lightIllustrationSrc: "/illustration-ai/max/light.gif",
		width: 74,
	},
} as const;
const ROVO_APP_EMPTY_STATE_MODE_TRANSITION = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.14,
} as const;
const ROVO_APP_EMPTY_STATE_EXIT_TRANSITION = {
	duration: 0.08,
} as const;
const ROVO_APP_EMPTY_STATE_REDUCED_TRANSITION = {
	duration: 0.08,
} as const;
const ROVO_APP_EMPTY_STATE_CONTAINER_VARIANTS = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.04,
		},
	},
	exit: {
		transition: {
			staggerChildren: 0.02,
			staggerDirection: -1,
		},
	},
} as const;
const ROVO_APP_EMPTY_STATE_ITEM_VARIANTS = {
	hidden: {
		opacity: 0,
		transform: "translateY(6px)",
	},
	visible: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: ROVO_APP_EMPTY_STATE_MODE_TRANSITION,
	},
	exit: {
		opacity: 0,
		transform: "translateY(-6px)",
		transition: ROVO_APP_EMPTY_STATE_EXIT_TRANSITION,
	},
} as const;
const ROVO_APP_EMPTY_STATE_REDUCED_ITEM_VARIANTS = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: ROVO_APP_EMPTY_STATE_REDUCED_TRANSITION,
	},
	exit: {
		opacity: 0,
		transition: ROVO_APP_EMPTY_STATE_REDUCED_TRANSITION,
	},
} as const;
type RovoAppEmptyStateItemVariants = typeof ROVO_APP_EMPTY_STATE_ITEM_VARIANTS | typeof ROVO_APP_EMPTY_STATE_REDUCED_ITEM_VARIANTS;

function isHermesContextTranscriptMessage(message: Pick<RovoUIMessage, "id" | "role" | "parts">): boolean {
	if (message.role !== "assistant") {
		return false;
	}

	if (message.id.startsWith("hermes-memory-") || message.id.startsWith("hermes-skill-")) {
		return true;
	}

	const widgetType = getLatestDataPart(message, "data-widget-data")?.data.type;
	if (widgetType === "hermes-memory" || widgetType === "hermes-skill") {
		return true;
	}

	return getLatestDataPart(message, "data-route-decision")?.data.reason === "hermes_context_widget";
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
		resetMarker: string;
	}>
> {
	state = {
		hasError: false,
		resetMarker: getAssistantMessageRenderBoundaryResetMarker(this.props),
	};

	static getDerivedStateFromError() {
		return {
			hasError: true,
		};
	}

	static getDerivedStateFromProps(
		props: Readonly<{
			children: ReactNode;
			fallback: ReactNode;
			messageId: string;
			resetKey: string;
		}>,
		state: Readonly<{
			hasError: boolean;
			resetMarker: string;
		}>,
	) {
		const resetMarker = getAssistantMessageRenderBoundaryResetMarker(props);

		if (state.resetMarker !== resetMarker) {
			return {
				hasError: false,
				resetMarker,
			};
		}

		return null;
	}

	componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
		console.error("[RovoApp] Assistant message render failed", {
			messageId: this.props.messageId,
			error,
			componentStack: errorInfo.componentStack,
		});
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}

function getAssistantMessageRenderBoundaryResetMarker({
	messageId,
	resetKey,
}: Readonly<{
	messageId: string;
	resetKey: string;
}>): string {
	return `${messageId}:${resetKey}`;
}

function computeRovoAppAnchorScrollTop(defaultTargetTop: number, scrollElement: HTMLElement, scrollSpacerRef: RefObject<HTMLDivElement | null>): number {
	const scrollAnchorElement = scrollElement.querySelector<HTMLElement>(ROVO_APP_SCROLL_ANCHOR_SELECTOR);
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
	target = "follow",
}: Readonly<{
	scrollAnchorMessageId: string | null;
	target?: "bottom" | "follow";
}>) {
	const { scrollToBottom } = useConversationContext();
	const shouldReduceMotion = useReducedMotion();
	const didInitialScrollRef = useRef(false);
	const latestArgsRef = useRef({ scrollAnchorMessageId, target, scrollToBottom });

	useEffect(() => {
		latestArgsRef.current = { scrollAnchorMessageId, target, scrollToBottom };
	});

	// First-mount scroll happens synchronously before paint so long threads
	// don't briefly show their top before jumping to the anchor. Subsequent
	// anchor changes stay in the useEffect below to avoid blocking paint
	// while streaming.
	useLayoutEffect(() => {
		if (didInitialScrollRef.current) return;
		const { scrollAnchorMessageId: id, target: anchorTarget, scrollToBottom: scroll } = latestArgsRef.current;
		if (!id) return;

		didInitialScrollRef.current = true;
		void scroll({
			animation: "instant",
			ignoreEscapes: true,
			target: anchorTarget,
		});
	}, []);

	useEffect(() => {
		if (!scrollAnchorMessageId) {
			return;
		}

		if (!didInitialScrollRef.current) {
			didInitialScrollRef.current = true;
			return;
		}

		void scrollToBottom({
			animation: target === "bottom" || shouldReduceMotion ? "instant" : "smooth",
			ignoreEscapes: true,
			target,
		});
	}, [scrollAnchorMessageId, scrollToBottom, shouldReduceMotion, target]);

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
				typeof row?.question === "string" && row.question.trim().length > 0 && typeof row?.answer === "string" && row.answer.trim().length > 0,
		);
	})();
	const attachments = message.parts.filter((part): part is Extract<(typeof message.parts)[number], { type: "file" }> => part.type === "file");

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
						<MessageResponse className="font-medium text-inherit [&_*]:text-inherit">{getMessageText(message)}</MessageResponse>
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
	const isUnavailable = code === "ROVO_UNAVAILABLE";
	const isBusy = code === "ROVO_BUSY";

	const friendlyMessage = isUnavailable
		? "Studio is currently unavailable. Please try again later."
		: isBusy
			? "All Studio instances are busy. Your request will be retried shortly."
			: widgetError.data.message;

	const borderClass = isBusy ? "border-warning" : "border-danger";
	const bgClass = isBusy ? "bg-warning/5" : "bg-danger/5";
	const textClass = isBusy ? "text-warning" : "text-danger";

	return (
		<div className={cn("rounded-xl border px-3 py-2 text-sm", borderClass, bgClass)}>
			<p className={textClass}>{friendlyMessage}</p>
			{widgetError.data.canRetry ? (
				<div className="mt-2">
					<Button onClick={onRetry} size="sm" type="button" variant="outline">
						Retry
					</Button>
				</div>
			) : null}
			{widgetError.data.details ? (
				<div className="mt-2">
					<button className="text-text-subtlest text-xs underline" onClick={() => setShowDetails((prev) => !prev)} type="button">
						{showDetails ? "Hide details" : "Show details"}
					</button>
					{showDetails ? <pre className="mt-1 whitespace-pre-wrap text-text-subtlest text-xs">{widgetError.data.details}</pre> : null}
				</div>
			) : null}
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
	onOpenBrowserPreview,
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
	onOpenBrowserPreview?: () => void;
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
	const browserScreenshots = getAllDataParts(message, "data-browser-screenshot");
	const hasBrowserScreenshotContent = browserScreenshots.length > 0;
	const routeDecision: RoutingDecision | null = getLatestRouteDecision(message);

	// Widget type determines rendering path: "question-card" and "plan" widgets
	// render regardless of routing presentation (they come from Rovo tool calls
	// during clarification flows where presentation is "text"). GenUI widgets
	// only render when the routing decision says "genui_card".
	const widgetType = widget?.data.type ?? null;
	const parsedPlanWidget = widgetType === "plan" ? parsePlanWidgetPayload(widget?.data.payload) : null;
	const shouldShowWidget = shouldRenderRovoAppWidget({
		hasBrowserScreenshots: hasBrowserScreenshotContent,
		hasWidget: Boolean(widget),
		routeDecision,
		widgetType,
	});
	const shouldHideResolvedQuestionCard = widgetType === "question-card" && isQuestionCardResolved;
	const hasVisibleWidget = shouldRenderRovoAppVisibleWidget({
		hasWidget: shouldShowWidget,
		shouldHideResolvedQuestionCard,
	});
	const isTextPresentation = routeDecision ? routeDecision.presentation === "text" : !widget;
	const isFallbackRoute = routeDecision !== null && routeDecision.confidence < 0.3;

	const shouldRenderPlanWidget = shouldShowWidget && parsedPlanWidget !== null;
	const hasTurnComplete = hasTurnCompleteSignal(message);
	const isResponseInFlight = isMessageTextStreaming(message) || isThinkingLifecycleStreaming || widgetLoading?.data.loading === true;
	const thinkingTraceState = useAssistantThinkingTraceState({
		message,
		isThinkingLifecycleStreaming,
		isResponseInFlight,
		treatQuestionToolCallsAsAnswered: isQuestionCardResolved,
		planNarrationText: shouldRenderPlanWidget ? text : "",
		planNarrationStreaming: isMessageTextStreaming(message),
	});
	const thinkingToolCalls = thinkingTraceState.data.thinkingToolCalls;
	const hasThinkingToolCalls = thinkingTraceState.data.hasThinkingToolCalls;
	const hasTraceDataSignals = thinkingTraceState.data.hasTraceDataSignals;
	const thinkingActive = thinkingTraceState.thinkingActive;
	const shouldSuppressAssistantTextForBrowserScreenshot =
		hasBrowserScreenshotContent &&
		(
			widgetType === "genui-preview" ||
			looksLikeBrowserFallbackAssistantText(text)
		);
	const shouldRenderAssistantText = shouldRenderRovoAppAssistantText({
		hasText: Boolean(text),
		hasTurnComplete,
		hasToolActivity: hasThinkingToolCalls || hasTraceDataSignals,
		hasWidgetSignal: Boolean(widget) || widgetLoading?.data.loading === true,
		isFallbackRoute,
		isResponseInFlight,
		isTextPresentation,
		shouldRenderPlanWidget,
	}) && !shouldSuppressAssistantTextForBrowserScreenshot;
	const shouldRenderAssistantActions = shouldRenderRovoAppAssistantActions({
		hasArtifactCard: Boolean(artifactCard),
		hasBrowserScreenshots: hasBrowserScreenshotContent,
		hasAssistantText: shouldRenderAssistantText,
		hasInterruption: Boolean(interruptionLabel),
		hasSources: sources.length > 0,
		hasWidget: hasVisibleWidget,
		hasWidgetError: Boolean(widgetError),
		isLastAssistant,
		isResponseInFlight,
	});
	const shouldRenderAssistantMessage = shouldRenderRovoAppAssistantMessage({
		hasArtifactCard: Boolean(artifactCard),
		hasBrowserScreenshots: hasBrowserScreenshotContent,
		hasAssistantText: shouldRenderAssistantText,
		hasInterruption: Boolean(interruptionLabel),
		hasReasoning: Boolean(reasoning?.text) || thinkingActive,
		hasSources: sources.length > 0,
		hasWidget: hasVisibleWidget,
		hasWidgetError: Boolean(widgetError),
	});
	const isPlanWidgetStreaming = widgetType === "plan" && ((widgetLoading?.data.type === "plan" && widgetLoading.data.loading) || isMessageTextStreaming(message));

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
					<Button size="sm" type="button" variant="outline" onClick={onRegenerate}>
						Retry
					</Button>
				</div>
			) : null}
		</div>
	);

	return (
		<Message animate className="max-w-full" data-role="assistant" data-testid="message-assistant" from="assistant">
			<div className="flex w-full items-start gap-2 md:gap-3">
				<div className="flex min-w-0 flex-1 flex-col gap-3">
					<AssistantMessageRenderBoundary fallback={assistantRenderFallback} messageId={message.id} resetKey={`${message.parts.length}:${isStreaming ? "streaming" : "done"}`}>
						{thinkingActive ? (
							<AssistantThinkingTrace state={thinkingTraceState} />
						) : reasoning?.text ? (
							<Reasoning defaultOpen={reasoning.isStreaming} isStreaming={isStreaming && reasoning.isStreaming}>
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
								<GenerativeWidgetCard thinkingToolCalls={thinkingToolCalls} widgetData={widget.data.payload} widgetType={widget.data.type ?? "message"} />
							</div>
						) : null}

						{widgetError ? <WidgetErrorCard widgetError={widgetError} onRetry={onRegenerate} /> : null}

						{shouldRenderAssistantText ? (
							<MessageContent className="max-w-3xl">
								<MessageResponse isAnimating={isMessageTextStreaming(message)}>{text}</MessageResponse>
							</MessageContent>
						) : null}

						{artifactCard}

						{browserScreenshots.length > 0 ? (
							<div className="flex flex-col gap-2">
								{browserScreenshots.map((part, index) => (
									<BrowserScreenshotPart
										key={`browser-screenshot-${message.id}-${index}`}
										screenshot={part.data}
										onFocusBrowserPanel={onOpenBrowserPreview}
									/>
								))}
							</div>
						) : null}

						{interruptionLabel ? (
							<div className="inline-flex w-fit items-center rounded-full border border-border-warning/40 bg-bg-warning-subtler px-2.5 py-1 text-text-warning-bolder text-xs">{interruptionLabel}</div>
						) : null}

						{sources.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{sources.map((source) =>
										source.type === "source-url" && source.url ? (
											<Button key={`${message.id}-${source.url}`} nativeButton={false} render={<a aria-label={source.title || source.url} href={source.url} rel="noreferrer" target="_blank" />} size="sm" type="button" variant="outline">
												{source.title || source.url}
										</Button>
									) : (
										<Button key={`${message.id}-${source.title ?? "source"}`} size="sm" type="button" variant="outline">
											{source.title || "Source"}
										</Button>
									),
								)}
							</div>
						) : null}

						{shouldRenderAssistantActions && shouldRenderAssistantText ? (
							<MessageActions reveal="hover" className="flex-wrap text-text-subtle">
								<MessageCopyAction text={text} />
								<MessageVoteActions onVote={(v) => void onVote(message.id, v)} value={voteValue} />
								{isLastAssistant && !message.metadata?.realtimeMessageId ? <MessageRegenerateAction onClick={onRegenerate} /> : null}
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

function RovoAppCustomAgentEmptyState({
	agent,
	itemVariants,
	onSelectSuggestion,
}: Readonly<{
	agent: RovoAgentProfile;
	itemVariants: RovoAppEmptyStateItemVariants;
	onSelectSuggestion: (suggestion: string) => Promise<void>;
}>) {
	return (
		<motion.div
			animate="visible"
			className="flex flex-col items-center gap-8 py-6 text-center"
			exit="exit"
			initial="hidden"
			key={agent.id}
			variants={ROVO_APP_EMPTY_STATE_CONTAINER_VARIANTS}
		>
			<div className="flex max-w-[520px] flex-col items-center gap-3">
				<motion.div variants={itemVariants}>
					<Image alt="" aria-hidden className="size-10 object-contain" height={40} loading="eager" src={agent.avatarSrc} width={40} />
				</motion.div>
				<motion.div className="flex flex-col items-center gap-2" variants={itemVariants}>
					<Heading size="xlarge">{agent.name}</Heading>
					{agent.description ? (
						<p className="max-w-[460px] text-base leading-6 text-text-subtle">{agent.description}</p>
					) : null}
				</motion.div>
			</div>
			<motion.div className="flex w-full max-w-[720px] flex-col gap-2" variants={ROVO_APP_EMPTY_STATE_CONTAINER_VARIANTS}>
				{agent.starters.map((starter) => {
					const IconComponent = starter.icon;
					const starterPrompt = starter.prompt ?? starter.label;

					return (
						<motion.div key={starter.id} variants={itemVariants}>
							<button
								className="flex w-full items-center gap-4 rounded-lg p-2 text-left transition-colors hover:bg-bg-neutral-subtle-hovered"
								onClick={() => {
									void onSelectSuggestion(starterPrompt);
								}}
								type="button"
							>
								<IconTile
									aria-hidden={true}
									className="border border-border bg-surface"
									icon={IconComponent ? <IconComponent label={starter.label} /> : null}
									label={starter.label}
									size="medium"
								/>
								<span className="min-w-0 flex-1 text-base font-semibold leading-6 text-text-subtle">{starter.label}</span>
							</button>
						</motion.div>
					);
				})}
			</motion.div>
		</motion.div>
	);
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
		<div className="group/message fade-in w-full animate-in duration-medium" data-role="assistant" data-testid="message-assistant-streaming-artifact">
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
		<div className="fade-in mb-6 w-full animate-in duration-medium" data-role="assistant-suggestions">
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
	isMaxMode = false,
	documents,
	editingMessageId,
	isStreaming,
	messages,
	onBuildPlan,
	onEditMessage,
	onOpenArtifactFromCard,
	onOpenBrowserPreview,
	onOpenPlanPreview,
	onAgentResultSelect,
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
	selectedAgent = null,
	showEmptyState = true,
	shouldSuppressLatestAssistantSuggestions = false,
	streamingArtifact,
	streamingArtifactMessageId,
	votes,
}: Readonly<RovoAppMessagesProps>) {
	const shouldReduceMotion = useReducedMotion();
	const scrollSpacerRef = useRef<HTMLDivElement | null>(null);
	const visibleMessages = useMemo(
		() => messages.filter((message) => (message.role === "user" || message.role === "assistant") && message.metadata?.visibility !== "hidden" && !isHermesContextTranscriptMessage(message)),
		[messages],
	);
	const latestVisibleUserMessageId = useMemo(() => {
		for (let i = visibleMessages.length - 1; i >= 0; i--) {
			const message = visibleMessages[i];
			if (message.role === "user") {
				return message.id;
			}
		}
		return null;
	}, [visibleMessages]);
	const lastAssistantMessageId = useMemo(() => {
		return [...visibleMessages].reverse().find((message) => message.role === "assistant")?.id ?? null;
	}, [visibleMessages]);
	const pendingPlanReview = useMemo(() => getLatestPendingPlanWidget(messages), [messages]);
	const latestPlanPayload = useMemo(() => getLatestPlanWidgetPayload(messages), [messages]);
	const latestPlanVisualIdentity = latestPlanPayload ? (latestPlanPayload.visualIdentity ?? resolvePlanVisualIdentity(latestPlanPayload.title)) : undefined;
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
	const shouldShowPendingAssistantSurface = pendingAssistantDisplayState !== "idle";
	const shouldShowStreamingArtifactPreview = shouldShowPendingAssistantSurface && Boolean(streamingArtifact?.documentId) && streamingArtifactMessageId === null;
	const shouldShowPreloader = shouldShowPendingAssistantSurface && !shouldShowStreamingArtifactPreview;
	const shouldShowEmptyConversationState = showEmptyState && visibleMessages.length === 0;
	const customAgent = selectedAgent !== null && !isRovoAgentProfile(selectedAgent) ? selectedAgent : null;
	const emptyState = isMaxMode ? ROVO_APP_EMPTY_STATE.max : ROVO_APP_EMPTY_STATE.default;
	const emptyStateItemVariants = shouldReduceMotion ? ROVO_APP_EMPTY_STATE_REDUCED_ITEM_VARIANTS : ROVO_APP_EMPTY_STATE_ITEM_VARIANTS;
	const usesRovoIllustration = "rovoIllustrationId" in emptyState;
	const handleTargetScrollTop = useCallback((defaultTargetTop: number, { scrollElement }: { scrollElement: HTMLElement }) => {
		return computeRovoAppAnchorScrollTop(defaultTargetTop, scrollElement, scrollSpacerRef);
	}, []);

	useEffect(() => {
		if (scrollFollowMode !== "bottom" || !scrollSpacerRef.current) {
			return;
		}

		scrollSpacerRef.current.style.height = "0px";
	}, [scrollFollowMode]);

	return (
		<Conversation
			className={cn("relative bg-background", shouldShowEmptyConversationState && "!flex-none overflow-visible")}
			followMode={scrollFollowMode}
			resize={isStreaming && scrollAnchorMessageId === latestVisibleUserMessageId ? "instant" : "smooth"}
			resizeTarget={isStreaming && scrollAnchorMessageId === latestVisibleUserMessageId ? "bottom" : "follow"}
			targetScrollTop={handleTargetScrollTop}
		>
			<RovoAppScrollAnchorSync
				scrollAnchorMessageId={scrollAnchorMessageId}
				target={isStreaming && scrollAnchorMessageId === latestVisibleUserMessageId ? "bottom" : "follow"}
			/>
			{onScrollActiveUserMessageChange ? <RovoAppScrollActiveTracker onActiveChange={onScrollActiveUserMessageChange} /> : null}
			{shouldShowEmptyConversationState ? (
				<div className="flex flex-col items-center gap-2 py-6">
					<AnimatePresence mode="wait">
						{customAgent ? (
							<RovoAppCustomAgentEmptyState
								agent={customAgent}
								itemVariants={emptyStateItemVariants}
								key={`agent-${customAgent.id}`}
								onSelectSuggestion={onSelectSuggestion}
							/>
						) : (
							<motion.div
								animate="visible"
								className="flex flex-col items-center gap-2"
								exit="exit"
								initial="hidden"
								key={emptyState.id}
								variants={ROVO_APP_EMPTY_STATE_CONTAINER_VARIANTS}
							>
								<motion.div className={cn(emptyState.illustrationClassName, "relative")} style={{ willChange: "transform, opacity" }} variants={emptyStateItemVariants}>
									{usesRovoIllustration ? (
										<ControlledRovoIllustration illusId={emptyState.rovoIllustrationId} size={emptyState.rovoIllustrationSize} />
									) : (
										<>
											<Image alt={emptyState.alt} className={cn(emptyState.illustrationClassName, "object-contain dark:hidden [[data-color-mode=dark]_&]:hidden")} height={emptyState.height} priority src={emptyState.lightIllustrationSrc} width={emptyState.width} />
											<Image alt={emptyState.alt} className={cn(emptyState.illustrationClassName, "hidden object-contain dark:block [[data-color-mode=dark]_&]:block")} height={emptyState.height} priority src={emptyState.darkIllustrationSrc} width={emptyState.width} />
										</>
									)}
								</motion.div>
								<motion.div style={{ willChange: "transform, opacity" }} variants={emptyStateItemVariants}>
									<Heading size="xlarge">{emptyState.heading}</Heading>
								</motion.div>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			) : null}

			<ConversationContent
				className={cn(
					"mx-auto flex min-w-0 flex-col gap-4 py-6 md:gap-6",
					extraHorizontalPaddingWhenCompact && compact ? "px-9" : "px-4",
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
					const fallbackArtifactDisplay = orphanArtifactDisplay?.anchorMessageId === message.id ? orphanArtifactDisplay : null;
					const resolvedArtifactDisplay = artifactDisplay ?? fallbackArtifactDisplay;
					const shouldHideSuggestions = message.id !== lastAssistantMessageId || shouldSuppressLatestAssistantSuggestions;
					const suggestions = shouldHideSuggestions ? [] : (getLatestDataPart(message, "data-suggested-questions")?.data.questions ?? []);
					const agentResult = getMessageAgentResult(message);

					const messagePlanWidget = (() => {
						const widget = getLatestDataPart(message, "data-widget-data");
						if (widget?.data.type !== "plan") return null;
						return parsePlanWidgetPayload(widget.data.payload);
					})();
					const isActivePendingPlan = Boolean(messagePlanWidget?.deferredToolCallId) && pendingPlanReview?.sourceMessageId === message.id;
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
											onOpen={(element) => onOpenArtifactFromCard(resolvedArtifactDisplay.documentId, element)}
											onRegister={(element) => onRegisterArtifactCard(resolvedArtifactDisplay.documentId, element)}
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
								onOpenBrowserPreview={onOpenBrowserPreview}
								onOpenPlanPreview={onOpenPlanPreview}
								onRegenerate={onRegenerate}
								onVote={onVote}
								planBuildDisabled={messagePlanWidget ? !isActivePendingPlan : undefined}
								planBuildDisabledReason={planBuildDisabledReason}
								voteValue={votes[message.id]}
							/>
								{agentResult ? (
									<AgentResultCard
										agent={agentResult}
										onSelectAgent={
											onAgentResultSelect
												? (agent) => onAgentResultSelect(agent, { sourceMessageId: message.id })
												: undefined
										}
									/>
								) : null}
							<AssistantSuggestionPills messageId={message.id} onSelectSuggestion={onSelectSuggestion} suggestions={suggestions} />
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
						versionNumber={documents.find((document) => document.id === streamingArtifact.documentId)?.versions.length ?? 1}
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
