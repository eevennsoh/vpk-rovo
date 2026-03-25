"use client";

import { cn } from "@/lib/utils";
import { useRovoChatPanel } from "../hooks/use-rovo-chat-panel";
import { useDismissibleCards } from "@/components/projects/shared/hooks/use-dismissible-cards";
import RovoChatHeader from "./rovo-chat-header";
import RovoChatMessages from "./rovo-chat-messages";
import RovoChatInput from "./rovo-chat-input";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { QuestionCardShortcutsFooter } from "@/components/projects/shared/components/question-card-shortcuts-footer";
import styles from "./rovo-chat-panel.module.css";
import type { Product } from "../types";

interface RovoChatPanelProps {
	onClose: () => void;
	product: Product;
	embedded?: boolean;
}

export default function RovoChatPanel({
	onClose,
	product,
	embedded = false,
}: Readonly<RovoChatPanelProps>) {
	const {
		prompt,
		setPrompt,
		variant,
		setVariant,
		uiMessages,
		userName,
		isStreaming,
		isSubmitPending,
		queuedPrompts,
		removeQueuedPrompt,
		contextEnabled,
		setContextEnabled,
		conversationContextRef,
		scrollSpacerRef,
		handleSubmit,
		handleSuggestedQuestionClick,
		handleWidgetPrimaryAction,
		handleFullScreen,
		hasChatStarted,
		activeQuestionCard,
		handleClarificationSubmit,
		handleClarificationDismiss,
		stopStreaming,
	} = useRovoChatPanel({ product });
	const isRequestInFlight = isStreaming || isSubmitPending;
		const { shouldShowQuestionCard: shouldShowQuestionCardRaw, activeQuestionCardKey, hideQuestionCard, dismissQuestionCard } =
			useDismissibleCards({
				activeQuestionCard,
				onDismissQuestionCard: handleClarificationDismiss,
			});
	const shouldShowQuestionCard = !isRequestInFlight && shouldShowQuestionCardRaw;

	const isFloating = variant === "floating";
	const panelHeight = isFloating
		? (hasChatStarted ? "640px" : "340px")
		: "var(--vpk-project-shell-content-height, calc(100vh - 48px))";

	return (
		<div
			className={cn(
				styles.rovoChatPanel,
				"flex w-[400px] flex-col bg-surface",
				"transition-[height]",
				isFloating
					? "fixed right-6 bottom-6 z-[1000] rounded-xl shadow-2xl"
					: "relative border-l border-border",
			)}
			style={{
				height: panelHeight,
				transitionDuration: "var(--duration-slow)",
				transitionTimingFunction: "var(--ease-in-out)",
				maxHeight: embedded ? "100%" : undefined,
			}}
		>
			<RovoChatHeader
				onClose={onClose}
				variant={variant}
				onVariantChange={setVariant}
				onFullScreen={handleFullScreen}
			/>

			<RovoChatMessages
				uiMessages={uiMessages}
				variant={variant}
				messageMode="ask"
				enableSmartWidgets={true}
				onSuggestedQuestionClick={handleSuggestedQuestionClick}
				onWidgetPrimaryAction={handleWidgetPrimaryAction}
				userName={userName ?? undefined}
				conversationContextRef={conversationContextRef}
				scrollSpacerRef={scrollSpacerRef}
				contentBottomPadding={shouldShowQuestionCard && activeQuestionCard !== null ? "24px" : undefined}
				isStreaming={isStreaming}
				isSubmitPending={isSubmitPending}
				showAwaitingIndicator={shouldShowQuestionCardRaw && activeQuestionCard !== null}
				awaitingIndicatorLabel="Waiting for your answers"
			/>

			{shouldShowQuestionCard && activeQuestionCard ? (
				<div className="px-3 pb-1">
					<ClarificationQuestionCard
						key={activeQuestionCardKey ?? undefined}
						questionCard={activeQuestionCard}
						onSubmit={(answers) => {
							void handleClarificationSubmit(answers);
							hideQuestionCard();
						}}
						onDismiss={dismissQuestionCard}
					/>
					<QuestionCardShortcutsFooter />
				</div>
			) : (
				<RovoChatInput
					prompt={prompt}
					isStreaming={isStreaming}
					hasInFlightTurn={isRequestInFlight}
					onPromptChange={setPrompt}
					onSubmit={handleSubmit}
					onStop={stopStreaming}
					contextEnabled={contextEnabled}
					onContextToggle={setContextEnabled}
					product={product}
					queuedPrompts={queuedPrompts}
					onRemoveQueuedPrompt={removeQueuedPrompt}
				/>
			)}
		</div>
	);
}
