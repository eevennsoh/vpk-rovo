"use client";

import { use, type ReactNode } from "react";
import { AssistantThinkingTrace } from "@/components/projects/shared/components/assistant-thinking-trace";
import { ThreadMessageContext } from "./thread-message-context";

export function ThreadMessageThinkingStatus(): ReactNode {
	const { thinkingTraceState } = use(ThreadMessageContext)!;

	return <AssistantThinkingTrace state={thinkingTraceState} />;
}
