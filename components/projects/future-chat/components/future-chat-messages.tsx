"use client";

import { useReducedMotion } from "motion/react";
import type { RefObject } from "react";
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
	AdsReasoningTrigger,
	Reasoning,
	ReasoningContent,
	ReasoningSection,
	ReasoningText,
} from "@/components/ui-ai/reasoning";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getFutureChatInterruptionLabel } from "@/lib/future-chat-interruptions";
import {
	resolveFutureChatMessageArtifactDisplay,
	resolveFutureChatOrphanArtifactDisplay,
	type FutureChatPendingArtifactResult,
} from "@/components/projects/future-chat/lib/future-chat-message-artifacts";
import {
	sanitizeFutureChatAssistantText,
	shouldRenderFutureChatWidget,
} from "@/components/projects/future-chat/lib/future-chat-message-display";
import { resolveFutureChatStreamingAssistantMessageId } from "@/components/projects/future-chat/lib/future-chat-streaming-assistant";
import { resolveFutureChatThinkingStatusPhase } from "@/components/projects/future-chat/lib/future-chat-thinking-status-phase";
import {
	resolveFutureChatScrollAnchorLayout,
} from "@/components/projects/future-chat/lib/future-chat-scroll-anchor";
import { AssistantThinkingToolsSection } from "@/components/projects/shared/components/assistant-thinking-tools-section";
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
	getDefaultThinkingLabel,
	getPreloadShimmerLabel,
	getReasoningSectionTitle,
} from "@/components/projects/shared/lib/reasoning-labels";
import {
	isThinkingStatusActive as checkThinkingStatusActive,
	resolveThinkingStatusTriggerLabel,
} from "@/components/projects/shared/thread-message/lib/thinking-status-state";
import {
	getAllDataParts,
	getMessageInterruption,
	getLatestDataPart,
	getLatestRouteDecision,
	getMessageReasoning,
	getMessageSources,
	getMessageText,
	getThinkingToolCallSummaries,
	hasTurnCompleteSignal,
	isMessageTextStreaming,
	type RoutingDecision,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { parsePlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import { cn } from "@/lib/utils";
import { FutureChatArtifactCard } from "@/components/projects/future-chat/components/future-chat-artifact-card";
import type { FutureChatDocument } from "@/lib/future-chat-types";
import type { FutureChatStreamingArtifact } from "@/components/projects/future-chat/lib/future-chat-streaming-artifact";
import Image from "next/image";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Heading from "@/components/blocks/shared-ui/heading";

interface FutureChatMessagesProps {
	activeDocumentId: string | null;
	compact?: boolean;
	documents: ReadonlyArray<FutureChatDocument>;
	editingMessageId: string | null;
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
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
	streamingArtifact: FutureChatStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	votes: Record<string, "up" | "down">;
}

const FUTURE_CHAT_SCROLL_ANCHOR_SELECTOR = "[data-future-chat-scroll-anchor='true']";

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

function AssistantMessage({
	artifactCard,
	isLastAssistant,
	isStreaming,
	isThinkingLifecycleStreaming,
	message,
	onRegenerate,
	onVote,
	voteValue,
}: Readonly<{
	artifactCard: React.ReactNode;
	isLastAssistant: boolean;
	isStreaming: boolean;
	isThinkingLifecycleStreaming: boolean;
	message: RovoUIMessage;
	onRegenerate: () => void;
	onVote: (messageId: string, value: "up" | "down" | null) => Promise<void>;
	voteValue?: "up" | "down";
}>) {
	const interruption = getMessageInterruption(message);
	const interruptionLabel = getFutureChatInterruptionLabel(interruption);
	const text = sanitizeFutureChatAssistantText(getMessageText(message));
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
	const shouldShowWidget = shouldRenderFutureChatWidget({
		hasWidget: Boolean(widget),
		routeDecision,
		widgetType,
	});
	const isTextPresentation = routeDecision
		? routeDecision.presentation === "text"
		: !widget;
	const isFallbackRoute = routeDecision !== null && routeDecision.confidence < 0.3;

	// Thinking status extraction
	const thinkingStatusParts = getAllDataParts(message, "data-thinking-status");
	const thinkingEventParts = getAllDataParts(message, "data-thinking-event");
	const thinkingToolCalls = getThinkingToolCallSummaries(message);
	const hasThinkingStatusPart = thinkingStatusParts.length > 0;
	const hasThinkingEvents = thinkingEventParts.length > 0;
	const hasThinkingToolCalls = thinkingToolCalls.length > 0;
	const hasTurnComplete = hasTurnCompleteSignal(message);

	const thinkingActive = checkThinkingStatusActive({
		hasThinkingStatusPart,
		hasThinkingEvents,
		isRetryThinkingStatus: false,
		isStreaming: isThinkingLifecycleStreaming,
	});

	const hasBackendThinkingActivity =
		hasThinkingStatusPart || hasThinkingEvents || hasThinkingToolCalls;
	const isThinkingStreaming =
		isThinkingLifecycleStreaming && thinkingActive && hasBackendThinkingActivity;

	const accumulatedThinkingContent = thinkingStatusParts
		.map((part) => part.data.content)
		.filter(Boolean)
		.join("\n\n");
	const hasThinkingText = Boolean(accumulatedThinkingContent);
	const hasThinkingDetails = hasThinkingText || hasThinkingToolCalls;

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

	const thinkingTriggerLabel = resolveThinkingStatusTriggerLabel({
		resolvedLabel: dynamicThinkingLabel,
		reasoningPhase: thinkingReasoningPhase,
		duration: thinkingDuration,
	});

	const thinkingPhaseProps = getReasoningPropsForPhase(
		thinkingReasoningPhase,
		undefined,
		hasThinkingDetails,
	);
	const shouldRenderPlanWidget = shouldShowWidget && parsedPlanWidget !== null;
	const shouldRenderAssistantText =
		Boolean(text) &&
		(isTextPresentation || isFallbackRoute || !widget) &&
		!shouldRenderPlanWidget;
	const isPlanWidgetStreaming =
		widgetType === "plan" &&
		(
			(widgetLoading?.data.type === "plan" && widgetLoading.data.loading) ||
			isMessageTextStreaming(message)
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
					{thinkingActive ? (
						<Reasoning
							className="mb-0"
							autoExpandOnDetails
							hasDetails={hasThinkingDetails}
							defaultOpen={thinkingPhaseProps.defaultOpen ?? hasThinkingDetails}
							isStreaming={thinkingPhaseProps.isStreaming}
							streamingWave={thinkingPhaseProps.streamingWave}
							streamingWaveGradientColor={thinkingPhaseProps.streamingWaveGradientColor}
							animatedDots={thinkingPhaseProps.animatedDots}
							duration={thinkingReasoningPhase === "completed" ? thinkingDuration : undefined}
							allowAutoCollapse={hasTurnComplete}
						>
							<AdsReasoningTrigger
								label={thinkingTriggerLabel}
								showChevron={hasThinkingDetails}
								streaming={thinkingPhaseProps.triggerStreaming}
							/>
							{hasThinkingDetails ? (
								<ReasoningContent>
									<div className="space-y-4">
										{hasThinkingText ? (
											<ReasoningSection title={getReasoningSectionTitle("thinking")}>
												<ReasoningText
													maxVisibleTimelineItems={6}
													text={accumulatedThinkingContent}
													timelineMode="auto"
												/>
											</ReasoningSection>
										) : null}
										{hasThinkingToolCalls ? (
											<ReasoningSection title={getReasoningSectionTitle("tools")}>
												<AssistantThinkingToolsSection
													defaultOpenMode="running"
													idPrefix={message.id}
													thinkingToolCalls={thinkingToolCalls}
												/>
											</ReasoningSection>
										) : null}
									</div>
								</ReasoningContent>
							) : null}
						</Reasoning>
					) : reasoning?.text ? (
						<Reasoning
							defaultOpen={reasoning.isStreaming}
							isStreaming={isStreaming && reasoning.isStreaming}
						>
							<AdsReasoningTrigger />
							<ReasoningContent>{reasoning.text}</ReasoningContent>
						</Reasoning>
					) : null}

					{widgetLoading?.data.loading ? (
						<div className="w-full">
							<LoadingWidget widgetType={widgetLoading.data.type} />
						</div>
					) : null}

					{shouldRenderPlanWidget ? (
						<div className="w-full pt-2">
							<PlanWidgetInlineCard
								title={parsedPlanWidget.title}
								description={parsedPlanWidget.description}
								tasks={parsedPlanWidget.tasks}
								isStreaming={isPlanWidgetStreaming}
							/>
						</div>
					) : shouldShowWidget && widget ? (
						<div className="w-full">
							<GenerativeWidgetCard
								widgetData={widget.data.payload}
								widgetType={widget.data.type ?? "message"}
							/>
						</div>
					) : null}

					{widgetError ? (
						<div className="rounded-xl border border-danger bg-danger/5 px-3 py-2 text-danger text-sm">
							{widgetError.data.message}
						</div>
					) : null}

					{shouldRenderAssistantText ? (
						<MessageContent className="max-w-3xl">
							<MessageResponse isAnimating={(isStreaming && isLastAssistant) || isMessageTextStreaming(message)}>
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
	streamingArtifact,
	streamingArtifactMessageId,
	votes,
}: Readonly<FutureChatMessagesProps>) {
	const scrollSpacerRef = useRef<HTMLDivElement | null>(null);
	const visibleMessages = useMemo(
		() => messages.filter((message) => message.role === "user" || message.role === "assistant"),
		[messages],
	);
	const lastAssistantMessageId = useMemo(() => {
		return [...visibleMessages]
			.reverse()
			.find((message) => message.role === "assistant")?.id ?? null;
	}, [visibleMessages]);
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
	const isUserMessageLast = visibleMessages.at(-1)?.role === "user";
	const shouldShowPreloader = isStreaming && isUserMessageLast;
	const shouldShowStreamingArtifactPreview =
		isStreaming &&
		isUserMessageLast &&
		Boolean(streamingArtifact?.documentId) &&
		streamingArtifactMessageId === null;
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
					"mx-auto flex min-w-0 flex-col gap-4 px-3 py-6 md:gap-6",
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
						const suggestions =
							getLatestDataPart(message, "data-suggested-questions")?.data.questions ?? [];

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
									isStreaming={isStreaming}
									isThinkingLifecycleStreaming={isStreaming && message.id === streamingAssistantMessageId}
									message={message}
									onRegenerate={onRegenerate}
									onVote={onVote}
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
