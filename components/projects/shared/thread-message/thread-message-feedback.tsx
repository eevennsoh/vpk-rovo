"use client";

import { use, type ReactNode } from "react";
import { ThreadMessageContext } from "./thread-message-context";
import { AssistantFeedbackActions } from "../components/assistant-feedback-actions";
import { shouldRenderThreadMessageFeedback } from "./lib/feedback-visibility";

export function ThreadMessageFeedback(): ReactNode {
	const {
		messageText,
		isStreaming,
		isThinkingStatusActive,
		isWidgetLoading,
		shouldRenderMessageText,
		hasRenderedWidget,
	} = use(ThreadMessageContext)!;

	if (
		!shouldRenderThreadMessageFeedback({
			hasRenderedWidget,
			isStreaming,
			isThinkingStatusActive,
			isWidgetLoading,
			shouldRenderMessageText,
		})
	) {
		return null;
	}

	return <AssistantFeedbackActions messageText={messageText} />;
}
