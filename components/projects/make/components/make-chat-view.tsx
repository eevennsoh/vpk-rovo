"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getLatestDataPart, isMessageTextStreaming } from "@/lib/rovo-ui-messages";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { ChatMessages } from "@/components/projects/shared/components/chat-messages";
import { useScrollAnchoring } from "@/components/projects/shared/hooks/use-scroll-anchoring";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { parsePlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import type { ParsedQuestionCardPayload } from "@/components/projects/shared/lib/question-card-widget";
import type { ClarificationAnswers } from "@/components/projects/shared/lib/question-card-widget";
import type { QueuedPromptItem } from "@/app/contexts";
import { Footer } from "@/components/ui/footer";
import ArrowDownIcon from "@atlaskit/icon/core/arrow-down";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { getPlanModeCopy } from "@/components/projects/make/lib/make-copy";
import {
	useMakeState,
	useMakeActions,
} from "@/app/contexts/context-make";
import MakeComposer from "./make-composer";
import { MakeCardWidgetInline } from "./make-card-widget-inline";
import { PlanPreviewModal } from "./plan-preview-modal";
import { useScrollToBottom } from "../hooks/use-scroll-to-bottom";
import { useDismissibleCards } from "../hooks/use-dismissible-cards";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAT_COMPOSER_BASE_BOTTOM_PADDING = "128px";
const CHAT_COMPOSER_WITH_QUEUE_BOTTOM_PADDING = "320px";
const OVERLAY_CARD_BOTTOM_PADDING = "520px";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAwaitingIndicatorLabel(
	showQuestionCard: boolean,
): string {
	if (showQuestionCard) return "Waiting for your answers";
	return "Awaiting user response";
}

/**
 * Scans messages for plan widget data parts and returns the message ID
 * of the latest (most recent) plan widget. All earlier plan widgets
 * should be rendered in collapsed state.
 */
function findLatestPlanWidgetMessageId(
	messages: ReadonlyArray<RovoUIMessage>,
): string | null {
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i];
		if (message.role !== "assistant") continue;

		for (let j = message.parts.length - 1; j >= 0; j--) {
			const part = message.parts[j] as {
				type?: string;
				data?: { type?: unknown; payload?: unknown };
			};
			if (part.type !== "data-widget-data") continue;
			if (typeof part.data?.type === "string" && part.data.type === "plan") {
				// Verify the payload actually parses to a valid plan widget
				const parsed = parsePlanWidgetPayload(part.data.payload);
				if (parsed && parsed.tasks.length > 0) {
					return message.id;
				}
			}
		}
	}
	return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ScrollToBottomButtonProps {
	visible: boolean;
	onClick: () => void;
}

function ScrollToBottomButton({ visible, onClick }: Readonly<ScrollToBottomButtonProps>) {
	if (!visible) return null;

	return (
		<Button
			aria-label="Scroll to bottom"
			className="absolute bottom-full left-1/2 mb-4 -translate-x-1/2 cursor-pointer rounded-full border-0 bg-surface hover:bg-surface-hovered"
			size="icon"
			variant="ghost"
			onClick={onClick}
			style={{ boxShadow: token("elevation.shadow.overlay") }}
		>
			<ArrowDownIcon label="" color={token("color.icon.subtlest")} size="small" />
		</Button>
	);
}

interface BottomOverlayProps {
	showQuestionCard: boolean;
	activeQuestionCard: ParsedQuestionCardPayload | null;
	activeQuestionCardKey: string | null;
	onClarificationSubmit: (answers: ClarificationAnswers) => void;
	onHideQuestionCard: () => void;
	onDismissQuestionCard: () => void;
	composerProps: {
		prompt: string;
		placeholder: string;
		isStreaming: boolean;
		queuedPrompts: ReadonlyArray<QueuedPromptItem>;
		onPromptChange: (value: string) => void;
		onSubmit: () => Promise<void> | void;
		onStop: () => Promise<void>;
		onRemoveQueuedPrompt: (id: string) => void;
	};
}

function BottomOverlay({
	showQuestionCard,
	activeQuestionCard,
	activeQuestionCardKey,
	onClarificationSubmit,
	onHideQuestionCard,
	onDismissQuestionCard,
	composerProps,
}: Readonly<BottomOverlayProps>) {
	if (showQuestionCard && activeQuestionCard && activeQuestionCardKey) {
		return (
			<ClarificationQuestionCard
				key={activeQuestionCardKey}
				questionCard={activeQuestionCard}
				onSubmit={(answers) => {
					onClarificationSubmit(answers);
					onHideQuestionCard();
				}}
				onDismiss={onDismissQuestionCard}
			/>
		);
	}

	return <MakeComposer {...composerProps} />;
}

interface ChatFooterProps {
	showOverlayHints: boolean;
}

function ChatFooter({ showOverlayHints }: Readonly<ChatFooterProps>) {
	if (!showOverlayHints) return <Footer />;

	return (
		<Footer hideIcon>
			<span>
				<kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to navigate
			</span>
			<span aria-hidden>•</span>
			<span>
				<kbd className="font-sans">↵</kbd> Enter to select
			</span>
			<span aria-hidden>•</span>
			<span>Esc to skip</span>
		</Footer>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MakeChatView() {
	const {
		prompt,
		isStreaming,
		isSubmitPending,
		isWidgetLoading,
		uiMessages,
		normalizedUiMessages: streamingUiMessages,
		activeQuestionCard,
		enrichedPlanTitle,
		queuedPrompts,
		activeChatId,
	} = useMakeState();

	const {
		setPrompt,
		handleSubmit,
		stopStreaming,
		removeQueuedPrompt,
		handleClarificationSubmit,
		handleClarificationDismiss,
		handleBuild,
		handleSuggestedQuestionClick,
	} = useMakeActions();

	const [previewModal, setPreviewModal] = useState<{
		open: boolean;
		title: string;
		description: string;
		tasks: { id: string; label: string; blockedBy: string[]; agent?: string }[];
		agents: string[];
	}>({ open: false, title: "", description: "", tasks: [], agents: [] });

	const { conversationContextRef, scrollSpacerRef } = useScrollAnchoring({
		uiMessages,
	});
	const { showScrollButton, scrollToBottom } = useScrollToBottom({
		conversationContextRef,
	});
	const {
		shouldShowQuestionCard,
		activeQuestionCardKey,
		hideQuestionCard,
		dismissQuestionCard,
	} = useDismissibleCards({
		activeQuestionCard,
		scopeKey: activeChatId,
		onDismissQuestionCard: handleClarificationDismiss,
	});

	const isRequestInFlight = isStreaming || isSubmitPending;
	const gatedShouldShowQuestionCard = shouldShowQuestionCard && !isWidgetLoading;
	const showBottomOverlayCard = gatedShouldShowQuestionCard;
	const isAwaitingUserInput = gatedShouldShowQuestionCard;
	const chatComposerBottomPadding = queuedPrompts.length > 0 ? CHAT_COMPOSER_WITH_QUEUE_BOTTOM_PADDING : CHAT_COMPOSER_BASE_BOTTOM_PADDING;
	const contentBottomPadding = showBottomOverlayCard ? OVERLAY_CARD_BOTTOM_PADDING : chatComposerBottomPadding;
	const shouldShowBottomGradient = true;
	const modeCopy = getPlanModeCopy();

	// Determine which plan widget message is the latest (most recent) one.
	// All earlier plan widgets are rendered collapsed.
	const latestPlanWidgetMessageId = useMemo(
		() => findLatestPlanWidgetMessageId(uiMessages),
		[uiMessages],
	);

	// Build handler for a specific plan widget payload
	const onBuildPlan = handleBuild;

	useEffect(() => {
		if (!showBottomOverlayCard) return;
		void conversationContextRef.current?.scrollToBottom({
			animation: "instant",
			ignoreEscapes: true,
		});
	}, [conversationContextRef, showBottomOverlayCard]);

	const renderPlanWidget = useCallback(
		(widget: { type: string; data: unknown }, message: RovoUIMessage): React.ReactNode => {
			const parsedPlanWidget = parsePlanWidgetPayload(widget.data);
			const latestWidgetLoadingPart = getLatestDataPart(message, "data-widget-loading");
			const isPlanWidgetLoading =
				latestWidgetLoadingPart?.data.type === "plan" &&
				latestWidgetLoadingPart.data.loading === true;
			const isPlanWidgetStreaming = isPlanWidgetLoading || isMessageTextStreaming(message);

			if (!parsedPlanWidget) return null;

			const isCollapsed = latestPlanWidgetMessageId !== null && message.id !== latestPlanWidgetMessageId;
			const isLatest = message.id === latestPlanWidgetMessageId;

			return (
				<div className="pt-2">
					<MakeCardWidgetInline
						title={parsedPlanWidget.title}
						description={parsedPlanWidget.description}
						enrichedTitle={isLatest ? enrichedPlanTitle?.title : undefined}
						enrichedDescription={isLatest ? enrichedPlanTitle?.description : undefined}
						tasks={parsedPlanWidget.tasks}
						isStreaming={isPlanWidgetStreaming}
						collapsed={isCollapsed}
						onBuild={() => onBuildPlan(parsedPlanWidget)}
						onOpenPreview={() =>
							setPreviewModal({
								open: true,
								title: isLatest && enrichedPlanTitle ? enrichedPlanTitle.title : parsedPlanWidget.title,
								description: isLatest && enrichedPlanTitle ? enrichedPlanTitle.description : (parsedPlanWidget.description ?? ""),
								tasks: parsedPlanWidget.tasks,
								agents: parsedPlanWidget.agents,
							})
						}
					/>
				</div>
			);
		},
		[enrichedPlanTitle, latestPlanWidgetMessageId, onBuildPlan],
	);

	const renderWidget = useCallback(
		(widget: { type: string; data: unknown }, message: RovoUIMessage) => {
			if (widget.type !== "plan") {
				// Make-tab interview remains text/question-card/plan only.
				// Rich media/genui widgets are suppressed here by design.
				return null;
			}

			return renderPlanWidget(widget, message);
		},
		[renderPlanWidget],
	);

	const composerProps = useMemo(
		() => ({
			prompt,
			placeholder: modeCopy.placeholder,
			isStreaming: isRequestInFlight,
			queuedPrompts,
			onPromptChange: setPrompt,
			onSubmit: handleSubmit,
			onStop: stopStreaming,
			onRemoveQueuedPrompt: removeQueuedPrompt,
		}),
		[prompt, modeCopy.placeholder, isRequestInFlight, queuedPrompts, setPrompt, handleSubmit, stopStreaming, removeQueuedPrompt],
	);

	return (
		<div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
			<div className="flex min-h-0 flex-1 justify-center overflow-hidden px-4">
				<div className="flex min-h-0 w-full max-w-[800px] flex-col">
					<ChatMessages
						uiMessages={uiMessages}
						streamingIndicatorMessages={streamingUiMessages}
						hideScrollbar
						onSuggestedQuestionClick={handleSuggestedQuestionClick}
						conversationContextRef={conversationContextRef}
						scrollSpacerRef={scrollSpacerRef}
						contentTopPadding="24px"
						contentBottomPadding={contentBottomPadding}
						isStreaming={isStreaming}
						isSubmitPending={isSubmitPending}
						streamingIndicatorVariant="reasoning-expanded"
						showFeedbackActions={false}
							showFollowUpSuggestions={!isAwaitingUserInput}
							showAwaitingIndicator={isAwaitingUserInput}
							awaitingIndicatorLabel={getAwaitingIndicatorLabel(gatedShouldShowQuestionCard)}
							renderWidget={renderWidget}
						/>
				</div>
			</div>

			{shouldShowBottomGradient ? (
				<div
					aria-hidden
					className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52"
					style={{
						background: `linear-gradient(to top, ${token("elevation.surface")} 28%, transparent 100%)`,
					}}
				/>
			) : null}

				<div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 px-4">
					<div className="pointer-events-auto relative mx-auto w-full max-w-[800px]">
						<ScrollToBottomButton visible={showScrollButton} onClick={scrollToBottom} />
						<BottomOverlay
							showQuestionCard={gatedShouldShowQuestionCard}
							activeQuestionCard={activeQuestionCard}
							activeQuestionCardKey={activeQuestionCardKey}
							onClarificationSubmit={handleClarificationSubmit}
							onHideQuestionCard={hideQuestionCard}
							onDismissQuestionCard={dismissQuestionCard}
							composerProps={composerProps}
						/>
					</div>
				</div>

				<div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
					<ChatFooter showOverlayHints={gatedShouldShowQuestionCard} />
				</div>

			<PlanPreviewModal
				open={previewModal.open}
				onOpenChange={(open) => setPreviewModal((prev) => ({ ...prev, open }))}
				title={previewModal.title}
				description={previewModal.description}
				tasks={previewModal.tasks}
					onBuild={() => {
						onBuildPlan({
							title: previewModal.title,
							description: previewModal.description,
							markdown: previewModal.description,
							tasks: previewModal.tasks,
							agents: previewModal.agents,
						});
					}}
			/>
		</div>
	);
}
