"use client";

import { use, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
	getLatestDataPart,
} from "@/lib/rovo-ui-messages";
import {
	MessageContent,
	MessageResponse,
} from "@/components/ui-custom/message";
import { ThreadMessageContext } from "./thread-message-context";

export function ThreadMessageContent(): ReactNode {
	const {
		message,
		messageText,
		isStreaming,
		isWidgetLoading,
		shouldRenderMessageText,
		shouldRenderPlainTextWhileStreaming,
	} = use(ThreadMessageContext)!;

	if (!shouldRenderMessageText) {
		return null;
	}

	const widgetDataPart = getLatestDataPart(message, "data-widget-data");

	return (
		<MessageContent
			className={cn(
				(widgetDataPart || isWidgetLoading) && "mb-2"
			)}
		>
			{shouldRenderPlainTextWhileStreaming ? (
				<div className="whitespace-pre-wrap break-words text-sm leading-6 text-text">
					{messageText}
				</div>
			) : (
				<MessageResponse isAnimating={isStreaming}>
					{messageText}
				</MessageResponse>
			)}
		</MessageContent>
	);
}
