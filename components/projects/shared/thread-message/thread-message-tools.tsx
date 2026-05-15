"use client";

import { use, type ReactNode } from "react";
import { ThreadMessageContext } from "./thread-message-context";
import { AssistantToolsSection } from "../components/assistant-tools-section";

/**
 * Renders standalone tool invocation results.
 *
 * Self-gates: returns null when there are no tool parts.
 */
export function ThreadMessageTools(): ReactNode {
	const {
		message,
		toolParts,
	} = use(ThreadMessageContext)!;

	if (toolParts.length === 0) {
		return null;
	}

	return (
		<AssistantToolsSection messageId={message.id} toolParts={toolParts} />
	);
}
