"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/utils/theme-wrapper";
import { Footer } from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import ArrowDownIcon from "@atlaskit/icon/core/arrow-down";
import PromptGallery from "@/components/blocks/prompt-gallery";
import DiscoveryGallery from "@/components/blocks/discovery-gallery/page";
import { ChatMessages } from "@/components/projects/shared/components/chat-messages";
import { useScrollAnchoring } from "@/components/projects/shared/hooks/use-scroll-anchoring";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { ApprovalCard } from "@/components/blocks/approval-card/page";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import { getLatestPlanWidgetPayload, parsePlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import type { ClarificationAnswers } from "@/components/projects/shared/lib/question-card-widget";
import type { PlanApprovalSelection } from "@/components/projects/shared/lib/plan-approval";
import {
	getLatestDataPart,
	isMessageTextStreaming,
	type RovoRenderableUIMessage,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";

import { useMakeState, useMakeActions } from "@/app/contexts/context-make";
import { getChatTabCopy, getPlanModeCopy } from "../lib/make-copy";
import MakeComposer from "./make-composer";
import { useScrollToBottom } from "../hooks/use-scroll-to-bottom";
import { useDismissibleCards } from "../hooks/use-dismissible-cards";
import { MakeCardWidgetInline } from "./make-card-widget-inline";
import { PlanPreviewModal } from "./plan-preview-modal";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAT_COMPOSER_BASE_BOTTOM_PADDING = "128px";
const CHAT_COMPOSER_WITH_QUEUE_BOTTOM_PADDING = "320px";
const OVERLAY_CARD_BOTTOM_PADDING = "520px";
const BASE_COMPOSER_HEIGHT = 108;
const EXPANDED_GALLERY_COMPOSER_HEIGHT = 132;
const COMPOSER_CHROME_HEIGHT = 84;

const MODE_TRANSITION = { duration: 0.2 };
const MODE_ENTER = { opacity: 1, y: 0 };
const MODE_EXIT_UP = { opacity: 0, y: -8 };
const MODE_INITIAL_DOWN = { opacity: 0, y: 8 };

function getAwaitingIndicatorLabel(
	showQuestionCard: boolean,
	showApprovalCard: boolean,
): string {
	if (showQuestionCard) return "Waiting for your answers";
	if (showApprovalCard) return "Waiting for your approval";
	return "Awaiting user response";
}

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

function ScrollToBottomButton({
	visible,
	onClick,
}: Readonly<ScrollToBottomButtonProps>) {
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
			<ArrowDownIcon
				label=""
				color={token("color.icon.subtlest")}
				size="small"
			/>
		</Button>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface MakeFullscreenChatProps {
	autoFocusComposer?: boolean;
}

export function MakeFullscreenChat({
	autoFocusComposer = true,
}: Readonly<MakeFullscreenChatProps>) {
	const {
		chatTabPrompt,
		chatTabIsStreaming,
		chatTabIsSubmitPending,
		chatTabMessages: uiMessages,
		chatTabNormalizedMessages: streamingUiMessages,
		chatTabActiveQuestionCard,
		chatTabQueuedPrompts: queuedPrompts,
		chatTabIsPlanMessageComplete,
		isMakeToggleActive,
		chatTabActiveChatId,
		executedPlanKey,
		enrichedPlanTitle,
	} = useMakeState();

	const {
		setChatTabPrompt: setPrompt,
		handleChatTabSubmit: handleSubmit,
		stopChatTabStreaming: stopStreaming,
		removeChatTabQueuedPrompt: removeQueuedPrompt,
		handleChatTabSuggestedQuestionClick: handleSuggestedQuestionClick,
		handleChatTabWidgetPrimaryAction: handleWidgetPrimaryAction,
		handleChatTabClarificationSubmit,
		handleChatTabClarificationDismiss,
		handleChatTabApprovalSubmit,
		handleBuild,
		toggleMakeMode,
	} = useMakeActions();

	const [previewPrompt, setPreviewPrompt] = useState<string | null>(null);
	const [galleryExpanded, setGalleryExpanded] = useState(false);
	const [previewPromptHeight, setPreviewPromptHeight] = useState(0);
	const [previewModal, setPreviewModal] = useState<{
		open: boolean;
		title: string;
		description: string;
		tasks: { id: string; label: string; blockedBy: string[]; agent?: string }[];
		agents: string[];
	}>({ open: false, title: "", description: "", tasks: [], agents: [] });
	const composerContainerRef = useRef<HTMLDivElement>(null);
	const previewMeasureRef = useRef<HTMLTextAreaElement | null>(null);
	const textareaElementRef = useRef<HTMLTextAreaElement | null>(null);
	const { actualTheme } = useTheme();
	const isPreviewPlaceholderActive =
		!!previewPrompt && chatTabPrompt.length === 0;

	const chatTabCopy = getChatTabCopy();
	const planModeCopy = getPlanModeCopy();
	const modeCopy = isMakeToggleActive ? planModeCopy : chatTabCopy;

	const illustrationSrc =
		actualTheme === "dark"
			? modeCopy.illustration.dark
			: modeCopy.illustration.light;

	const { conversationContextRef, scrollSpacerRef } = useScrollAnchoring({
		uiMessages,
	});
	const { showScrollButton, scrollToBottom } = useScrollToBottom({
		conversationContextRef,
	});
	const activePlanWidget = useMemo(
		() => getLatestPlanWidgetPayload(streamingUiMessages),
		[streamingUiMessages],
	);
	const {
		shouldShowQuestionCard,
		shouldShowApprovalCard,
		activeQuestionCardKey,
		activePlanKey,
		hideQuestionCard,
		dismissQuestionCard,
		dismissApprovalCard,
	} = useDismissibleCards({
		activeQuestionCard: chatTabActiveQuestionCard,
		activePlanWidget,
		messages: streamingUiMessages,
		scopeKey: chatTabActiveChatId,
		onDismissQuestionCard: handleChatTabClarificationDismiss,
	});

	const isRequestInFlight = chatTabIsStreaming || chatTabIsSubmitPending;
	const hasMessages = uiMessages.length > 0;
	const gatedShouldShowQuestionCard = shouldShowQuestionCard && !isRequestInFlight;
	const isPlanAlreadyExecuted = executedPlanKey !== null && executedPlanKey === activePlanKey;
	const gatedShouldShowApprovalCard =
		shouldShowApprovalCard && chatTabIsPlanMessageComplete && !isRequestInFlight && !isPlanAlreadyExecuted;
	const showBottomOverlayCard =
		gatedShouldShowQuestionCard || gatedShouldShowApprovalCard;
	const isAwaitingUserInput = showBottomOverlayCard;
	const chatComposerBottomPadding =
		queuedPrompts.length > 0
			? CHAT_COMPOSER_WITH_QUEUE_BOTTOM_PADDING
			: CHAT_COMPOSER_BASE_BOTTOM_PADDING;
	const contentBottomPadding = showBottomOverlayCard
		? OVERLAY_CARD_BOTTOM_PADDING
		: chatComposerBottomPadding;
	const latestPlanWidgetMessageId = useMemo(
		() => findLatestPlanWidgetMessageId(uiMessages),
		[uiMessages],
	);

	useEffect(() => {
		if (!showBottomOverlayCard) {
			return;
		}

		void conversationContextRef.current?.scrollToBottom({
			animation: "instant",
			ignoreEscapes: true,
		});
	}, [conversationContextRef, showBottomOverlayCard]);

	const measurePreviewPromptHeight = useCallback(
		(previewText: string | null) => {
			const textareaElement = textareaElementRef.current;
			const previewMeasureElement = previewMeasureRef.current;
			if (
				!previewText ||
				!textareaElement ||
				!previewMeasureElement ||
				chatTabPrompt.length > 0
			) {
				setPreviewPromptHeight(0);
				return;
			}

			const nextTextareaWidth = textareaElement.clientWidth;
			const computedStyle = window.getComputedStyle(textareaElement);
			previewMeasureElement.style.width = `${nextTextareaWidth}px`;
			previewMeasureElement.style.font = computedStyle.font;
			previewMeasureElement.style.fontSize = computedStyle.fontSize;
			previewMeasureElement.style.fontWeight = computedStyle.fontWeight;
			previewMeasureElement.style.letterSpacing = computedStyle.letterSpacing;
			previewMeasureElement.style.lineHeight = computedStyle.lineHeight;
			previewMeasureElement.style.padding = "0";
			previewMeasureElement.style.border = "0";
			previewMeasureElement.value = previewText;
			setPreviewPromptHeight(previewMeasureElement.scrollHeight);
		},
		[chatTabPrompt]
	);

	useEffect(() => {
		const textareaElement = textareaElementRef.current;
		if (!textareaElement) {
			return;
		}

		const resizeObserver = new ResizeObserver(() => {
			if (!previewPrompt) {
				return;
			}
			measurePreviewPromptHeight(previewPrompt);
		});
		resizeObserver.observe(textareaElement);

		return () => {
			resizeObserver.disconnect();
		};
	}, [measurePreviewPromptHeight, previewPrompt]);

	// -----------------------------------------------------------------------
	// Callbacks
	// -----------------------------------------------------------------------

	const handlePromptGallerySelect = useCallback(
		(selectedPrompt: string) => {
			setPrompt(selectedPrompt);
			composerContainerRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "start",
			});
			requestAnimationFrame(() => {
				const textarea =
					composerContainerRef.current?.querySelector<HTMLTextAreaElement>(
						'textarea[aria-label="Chat message input"]',
					);
				if (!textarea) return;
				textarea.focus();
				const cursorPosition = textarea.value.length;
				textarea.setSelectionRange(cursorPosition, cursorPosition);
			});
		},
		[setPrompt],
	);

	const handlePreviewStart = useCallback(
		(previewText: string) => {
			setPreviewPrompt(previewText);
			measurePreviewPromptHeight(previewText);
		},
		[measurePreviewPromptHeight]
	);

	const handlePreviewEnd = useCallback(() => {
		setPreviewPrompt(null);
		setPreviewPromptHeight(0);
	}, []);

	const handlePromptChange = useCallback(
		(value: string) => {
			setPrompt(value);
			if (value.length > 0) {
				setPreviewPromptHeight(0);
				return;
			}
			if (previewPrompt) {
				measurePreviewPromptHeight(previewPrompt);
			}
		},
		[measurePreviewPromptHeight, previewPrompt, setPrompt]
	);

	const handleMakeToggle = useCallback(() => {
		if (isMakeToggleActive) {
			setGalleryExpanded(false);
		}
		toggleMakeMode();
	}, [isMakeToggleActive, toggleMakeMode]);

	const handleTextareaReady = useCallback(
		(textareaElement: HTMLTextAreaElement | null) => {
			textareaElementRef.current = textareaElement;
			if (textareaElement) {
				measurePreviewPromptHeight(previewPrompt);
			}
		},
		[measurePreviewPromptHeight, previewPrompt]
	);

	const customComposerHeight = useMemo<string | undefined>(() => {
		if (chatTabPrompt.length > 0) {
			return undefined;
		}

		const baseHeight = galleryExpanded
			? EXPANDED_GALLERY_COMPOSER_HEIGHT
			: BASE_COMPOSER_HEIGHT;

		if (!isPreviewPlaceholderActive) {
			return `${baseHeight}px`;
		}

		const measuredHeight = Math.ceil(COMPOSER_CHROME_HEIGHT + previewPromptHeight);
		return `${Math.max(baseHeight, measuredHeight)}px`;
	}, [
		galleryExpanded,
		isPreviewPlaceholderActive,
		previewPromptHeight,
		chatTabPrompt,
	]);

	const renderPlanWidget = useCallback(
		(
			widget: { type: string; data: unknown },
			message: RovoRenderableUIMessage,
		): React.ReactNode => {
			const parsedPlanWidget = parsePlanWidgetPayload(widget.data);
			const latestWidgetLoadingPart = getLatestDataPart(message, "data-widget-loading");
			const isPlanWidgetLoading =
				latestWidgetLoadingPart?.data.type === "plan" &&
				latestWidgetLoadingPart.data.loading === true;
			const isPlanWidgetStreaming = isPlanWidgetLoading || isMessageTextStreaming(message);

			if (!parsedPlanWidget) return null;

			const isCollapsed =
				latestPlanWidgetMessageId !== null && message.id !== latestPlanWidgetMessageId;
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
						onBuild={() => handleBuild(parsedPlanWidget, "chat")}
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
		[enrichedPlanTitle, handleBuild, latestPlanWidgetMessageId],
	);

	const renderWidget = useCallback(
		(
			widget: { type: string; data: unknown },
			message: RovoRenderableUIMessage,
		): React.ReactNode => {
			if (widget.type === "question-card") {
				return null;
			}

			if (widget.type === "plan") {
				return renderPlanWidget(widget, message);
			}

			return (
				<GenerativeWidgetCard
					widgetType={widget.type}
					widgetData={widget.data}
					onPrimaryAction={handleWidgetPrimaryAction}
				/>
			);
		},
		[handleWidgetPrimaryAction, renderPlanWidget],
	);

	const handleClarificationSubmit = useCallback(
		(answers: ClarificationAnswers) => {
			handleChatTabClarificationSubmit(answers);
			hideQuestionCard();
		},
		[handleChatTabClarificationSubmit, hideQuestionCard],
	);

	const handleApprovalSubmit = useCallback(
		(selection: PlanApprovalSelection) => {
			handleChatTabApprovalSubmit(selection);
			dismissApprovalCard();
		},
		[handleChatTabApprovalSubmit, dismissApprovalCard],
	);

	const composerProps = useMemo(
		() => ({
			autoFocus: autoFocusComposer,
			prompt: chatTabPrompt,
			placeholder: previewPrompt ?? modeCopy.placeholder,
			isStreaming: isRequestInFlight,
			queuedPrompts,
			onPromptChange: setPrompt,
			onSubmit: handleSubmit,
			onStop: stopStreaming,
			onRemoveQueuedPrompt: removeQueuedPrompt,
			isMakeActive: isMakeToggleActive,
			onMakeToggle: handleMakeToggle,
		}),
		[
			chatTabPrompt,
			previewPrompt,
			modeCopy.placeholder,
			isRequestInFlight,
			queuedPrompts,
			autoFocusComposer,
			setPrompt,
			handleSubmit,
			stopStreaming,
			removeQueuedPrompt,
			isMakeToggleActive,
			handleMakeToggle,
		],
	);

	// -----------------------------------------------------------------------
	// Initial view (no messages)
	// -----------------------------------------------------------------------

	if (!hasMessages) {
		return (
			<>
				<div
					className={cn(
						"flex h-full min-h-0 flex-1 flex-col overflow-y-auto px-4",
						galleryExpanded && "pt-16",
					)}
				>
					<div className={cn(
						"flex w-full flex-1 flex-col items-center gap-2",
						!galleryExpanded && "justify-center",
					)}>
							<AnimatePresence mode="wait">
							<motion.div
								key={isMakeToggleActive ? "make" : "chat"}
								className="flex flex-col items-center gap-6 px-4 py-6"
								initial={MODE_INITIAL_DOWN}
								animate={MODE_ENTER}
								exit={MODE_EXIT_UP}
								transition={MODE_TRANSITION}
							>
									<Image
										src={illustrationSrc}
										alt={modeCopy.illustrationAlt}
										width={80}
										height={80}
									/>

									<h2
										style={{ font: token("font.heading.xxlarge") }}
										className="text-text text-center"
									>
										{modeCopy.heading}
									</h2>
								</motion.div>
							</AnimatePresence>

							<div
								ref={composerContainerRef}
								className="w-full max-w-[800px] px-1"
							>
								<MakeComposer
									{...composerProps}
									onPromptChange={handlePromptChange}
									customHeight={customComposerHeight}
									isPreviewPlaceholderActive={isPreviewPlaceholderActive}
									onTextareaReady={handleTextareaReady}
								/>
							</div>

							<div className="mt-4 w-full max-w-[800px] px-1">
								<AnimatePresence mode="wait">
									{isMakeToggleActive ? (
									<motion.div
										key="discovery"
										initial={MODE_INITIAL_DOWN}
										animate={MODE_ENTER}
										exit={MODE_EXIT_UP}
										transition={MODE_TRANSITION}
									>
										<DiscoveryGallery
											onSelect={handlePromptGallerySelect}
											onPreviewStart={handlePreviewStart}
											onPreviewEnd={handlePreviewEnd}
										/>
									</motion.div>
								) : (
									<motion.div
										key="prompt"
										initial={MODE_INITIAL_DOWN}
										animate={MODE_ENTER}
										exit={MODE_EXIT_UP}
										transition={MODE_TRANSITION}
									>
											<PromptGallery
												onSelect={handlePromptGallerySelect}
												onPreviewStart={handlePreviewStart}
												onPreviewEnd={handlePreviewEnd}
												onExpandChange={setGalleryExpanded}
											/>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
					</div>

					<Footer className="mt-6" />
				</div>
				<textarea
					ref={previewMeasureRef}
					aria-hidden
					readOnly
					tabIndex={-1}
					className="pointer-events-none absolute -z-10 m-0 h-0 w-0 overflow-hidden opacity-0"
					style={{
						whiteSpace: "pre-wrap",
						overflowWrap: "break-word",
						wordBreak: "break-word",
					}}
				/>
			</>
		);
	}

	// -----------------------------------------------------------------------
	// Active chat view (has messages)
	// -----------------------------------------------------------------------

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
						isStreaming={chatTabIsStreaming}
						isSubmitPending={chatTabIsSubmitPending}
						streamingIndicatorVariant="reasoning-expanded"
						showFeedbackActions={false}
						showFollowUpSuggestions={!isAwaitingUserInput}
						showAwaitingIndicator={isAwaitingUserInput}
						awaitingIndicatorLabel={getAwaitingIndicatorLabel(
							gatedShouldShowQuestionCard,
							gatedShouldShowApprovalCard,
						)}
						renderWidget={renderWidget}
					/>
				</div>
			</div>

			<div
				aria-hidden
				className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52"
				style={{
					background: `linear-gradient(to top, ${token("elevation.surface")} 28%, transparent 100%)`,
				}}
			/>

			<div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 px-4">
				<div className="pointer-events-auto relative mx-auto w-full max-w-[800px]">
					<ScrollToBottomButton
						visible={showScrollButton}
						onClick={scrollToBottom}
					/>
					{gatedShouldShowQuestionCard &&
					chatTabActiveQuestionCard &&
					activeQuestionCardKey ? (
						<ClarificationQuestionCard
							key={activeQuestionCardKey}
							questionCard={chatTabActiveQuestionCard}
							isSubmitting={isRequestInFlight}
							onSubmit={handleClarificationSubmit}
							onDismiss={dismissQuestionCard}
						/>
					) : gatedShouldShowApprovalCard && activePlanKey ? (
						<div className="px-1">
							<ApprovalCard
								key={activePlanKey}
								isSubmitting={isRequestInFlight}
								onSubmit={handleApprovalSubmit}
								onDismiss={dismissApprovalCard}
							/>
						</div>
					) : (
						<MakeComposer {...composerProps} />
					)}
				</div>
			</div>

			<div className="absolute inset-x-0 bottom-0 z-20 flex justify-center">
				{showBottomOverlayCard ? (
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
				) : (
					<Footer />
				)}
			</div>

			<PlanPreviewModal
				open={previewModal.open}
				onOpenChange={(open) => setPreviewModal((prev) => ({ ...prev, open }))}
				title={previewModal.title}
				description={previewModal.description}
				tasks={previewModal.tasks}
				onBuild={() => {
					handleBuild(
						{
							title: previewModal.title,
							description: previewModal.description,
							markdown: previewModal.description,
							tasks: previewModal.tasks,
							agents: previewModal.agents,
						},
						"chat",
					);
				}}
			/>
		</div>
	);
}

export default MakeFullscreenChat;
