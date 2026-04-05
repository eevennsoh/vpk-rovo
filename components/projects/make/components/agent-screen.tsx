"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ui-ai/conversation";
import { Message, MessageContent } from "@/components/ui-ai/message";
import { AdsReasoningTrigger, Reasoning } from "@/components/ui-ai/reasoning";
import { REASONING_LABELS } from "@/components/projects/shared/lib/reasoning-labels";
import type { TaskExecution } from "../lib/execution-data";
import styles from "./agent-screen.module.css";

interface AgentScreenProps {
	execution: TaskExecution;
	className?: string;
}

function areAgentScreenPropsEqual(
	previous: Readonly<AgentScreenProps>,
	next: Readonly<AgentScreenProps>
): boolean {
	return (
		previous.className === next.className &&
		previous.execution.taskId === next.execution.taskId &&
		previous.execution.taskLabel === next.execution.taskLabel &&
		previous.execution.agentId === next.execution.agentId &&
		previous.execution.agentName === next.execution.agentName &&
		previous.execution.status === next.execution.status &&
		previous.execution.content === next.execution.content &&
		previous.execution.attempts === next.execution.attempts &&
		previous.execution.permanentlyFailed === next.execution.permanentlyFailed &&
		previous.execution.blockedBy === next.execution.blockedBy
	);
}

export const AgentScreen = memo(function AgentScreen({
	execution,
	className,
}: Readonly<AgentScreenProps>) {
	const isWorking = execution.status === "working";
	const isFailed = execution.status === "failed";
	const blockedByText = execution.blockedBy && execution.blockedBy.length > 0
		? `Blocked by: ${execution.blockedBy.map((id) => `#${id.replace(/^#?task-/, "")}`).join(", ")}`
		: null;

	const conversation = useMemo(() => {
		const result: { id: string; role: "assistant"; content: string }[] = [];

		if (execution.content) {
			result.push({ id: "a-0", role: "assistant", content: execution.content });
		}

		return result;
	}, [execution.content]);

	return (
		<div
			className={cn(
				styles.root,
				"flex flex-col overflow-hidden bg-surface",
				isFailed && "border-l-2 border-l-border-danger",
				className
			)}
		>
			<div className="relative z-10 flex items-center px-3 py-2" role="banner">
				{/* Progressive blur — fades content scrolling underneath */}
				<div
					aria-hidden
					className={cn(
						"pointer-events-none absolute inset-x-0 -bottom-6 h-6",
						styles.headerFade,
					)}
				>
					<div className="absolute inset-0 backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,black_20%,transparent)]" />
					<div className="absolute inset-0 bg-gradient-to-b from-surface to-transparent" />
				</div>
				<div className="flex min-w-0 items-center">
					<div className="flex min-w-0 flex-col items-start">
						<h3
							style={{ font: token("font.heading.xsmall") }}
							className={cn(
								"truncate",
								isFailed ? "text-text-danger" : "text-text"
							)}
						>
							{execution.agentName}
						</h3>
						<span className="truncate text-xs leading-4 text-text-subtlest">
							{execution.taskLabel}
						</span>
						{blockedByText ? (
							<span className="truncate text-xs leading-4 text-text-subtlest">
								{blockedByText}
							</span>
						) : null}
					</div>
				</div>
				{execution.permanentlyFailed ? (
					<span className="ml-auto shrink-0 rounded bg-bg-danger px-1.5 py-0.5 text-xs text-text-danger">
						Failed
					</span>
				) : execution.attempts != null && execution.attempts > 1 && isFailed ? (
					<span className="ml-auto shrink-0 rounded bg-bg-warning px-1.5 py-0.5 text-xs text-text-warning">
						Retry {execution.attempts - 1}/{2}
					</span>
				) : null}
			</div>

			<Conversation className={cn("min-h-0 flex-1", styles.conversationRoot)}>
				<ConversationContent className="gap-4 p-3">
					{conversation.length > 0 ? (
						conversation.map((msg) => (
							<Message key={msg.id} from="assistant" className="max-w-full">
								<MessageContent>
									<div className="whitespace-pre-wrap text-sm leading-6 text-text">{msg.content}</div>
								</MessageContent>
							</Message>
						))
					) : isWorking ? (
						<Message from="assistant" className="max-w-full">
							<MessageContent className="px-3">
								<Reasoning className="mb-0" isStreaming>
									<AdsReasoningTrigger label={REASONING_LABELS.trigger.working} showChevron={false} />
								</Reasoning>
							</MessageContent>
						</Message>
					) : null}
				</ConversationContent>
				<ConversationScrollButton />
			</Conversation>
		</div>
	);
}, areAgentScreenPropsEqual);

AgentScreen.displayName = "AgentScreen";
