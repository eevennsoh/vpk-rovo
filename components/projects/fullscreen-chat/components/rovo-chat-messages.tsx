"use client";

import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { ConversationContextValue } from "@/components/ui-ai/conversation";
import { ChatMessages } from "@/components/projects/shared/components/chat-messages";
import { GenerativeWidgetCard } from "@/components/projects/shared/components/generative-widget-card";
import type { GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import ChatEmptyState from "./chat-empty-state";
import type { PanelVariant } from "../types";

interface RovoChatMessagesProps {
	uiMessages: RovoUIMessage[];
	variant: PanelVariant;
	onSuggestedQuestionClick?: (question: string) => void;
	userName?: string;
	conversationContextRef: React.RefObject<ConversationContextValue | null>;
	scrollSpacerRef?: React.RefObject<HTMLDivElement | null>;
	contentTopPadding?: string;
	contentBottomPadding?: string;
	hideScrollbar?: boolean;
	isStreaming?: boolean;
	isSubmitPending?: boolean;
	messageMode?: "plan" | "ask";
	enableSmartWidgets?: boolean;
	showAwaitingIndicator?: boolean;
	awaitingIndicatorLabel?: string;
	onWidgetPrimaryAction?: (
		payload: GenerativeWidgetPrimaryActionPayload
	) => Promise<void> | void;
}

export default function RovoChatMessages({
	uiMessages,
	variant,
	onSuggestedQuestionClick,
	userName,
	conversationContextRef,
	scrollSpacerRef,
	contentTopPadding,
	contentBottomPadding,
	hideScrollbar = true,
	isStreaming = false,
	isSubmitPending = false,
	messageMode = "ask",
	enableSmartWidgets = false,
	showAwaitingIndicator = false,
	awaitingIndicatorLabel,
	onWidgetPrimaryAction,
}: Readonly<RovoChatMessagesProps>) {
	return (
		<ChatMessages
			uiMessages={uiMessages}
			onSuggestedQuestionClick={onSuggestedQuestionClick}
			conversationContextRef={conversationContextRef}
			scrollSpacerRef={scrollSpacerRef}
			contentTopPadding={contentTopPadding}
			contentBottomPadding={contentBottomPadding}
			hideScrollbar={hideScrollbar}
			isStreaming={isStreaming}
			isSubmitPending={isSubmitPending}
			messageMode={messageMode}
			showWidgetSections={enableSmartWidgets}
			showAwaitingIndicator={showAwaitingIndicator}
			awaitingIndicatorLabel={awaitingIndicatorLabel}
			streamingIndicatorVariant="reasoning-expanded"
			renderEmptyState={() => (
				<ChatEmptyState variant={variant} userName={userName} />
			)}
			renderWidget={(widget) => {
				if (!enableSmartWidgets) {
					return null;
				}

				return (
					<GenerativeWidgetCard
						widgetType={widget.type}
						widgetData={widget.data}
						onPrimaryAction={onWidgetPrimaryAction}
					/>
				);
			}}
		/>
	);
}
