import type { ToolPart } from "@/components/ui-ai/tool";
import {
	Tool,
	ToolContent,
	ToolHeader,
	ToolInput,
	ToolOutput,
} from "@/components/ui-ai/tool";
import type { ThinkingToolCallSummary } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";
import { useState } from "react";

type AssistantThinkingToolsSectionDefaultOpenMode = "details" | "running";

interface AssistantThinkingToolsSectionProps {
	thinkingToolCalls: ThinkingToolCallSummary[];
	idPrefix: string;
	defaultOpenMode?: AssistantThinkingToolsSectionDefaultOpenMode;
	className?: string;
}

interface AssistantThinkingToolItemProps {
	toolCall: ThinkingToolCallSummary;
	shouldDefaultOpen: boolean;
}

function hasToolDetails(toolCall: ThinkingToolCallSummary): boolean {
	return (
		toolCall.input !== undefined ||
		toolCall.output !== undefined ||
		Boolean(toolCall.errorText)
	);
}

function isToolRunning(toolCall: ThinkingToolCallSummary): boolean {
	return (
		toolCall.state === "running" ||
		toolCall.state === "approval-requested"
	);
}

function toToolUiState(
	state: ThinkingToolCallSummary["state"]
): ToolPart["state"] {
	if (state === "approval-requested") {
		return "approval-requested";
	}
	if (state === "running") {
		return "input-available";
	}
	if (state === "error") {
		return "output-error";
	}
	return "output-available";
}

function AssistantThinkingToolItem({
	toolCall,
	shouldDefaultOpen,
}: Readonly<AssistantThinkingToolItemProps>): React.ReactElement {
	const [isOpen, setIsOpen] = useState(shouldDefaultOpen);
	const [prevShouldDefaultOpen, setPrevShouldDefaultOpen] =
		useState(shouldDefaultOpen);

	if (prevShouldDefaultOpen !== shouldDefaultOpen) {
		setPrevShouldDefaultOpen(shouldDefaultOpen);
		if (prevShouldDefaultOpen && !shouldDefaultOpen) {
			setIsOpen(false);
		}
	}

	return (
		<Tool open={isOpen} onOpenChange={setIsOpen}>
			<ToolHeader
				title={toolCall.toolName}
				state={toToolUiState(toolCall.state)}
				type="dynamic-tool"
				toolName={toolCall.toolName}
			/>
			<ToolContent>
				{toolCall.input !== undefined ? (
					<ToolInput input={toolCall.input} />
				) : null}
				<ToolOutput
					errorText={toolCall.errorText}
					output={toolCall.output}
					outputBytes={toolCall.outputBytes}
					outputTruncated={toolCall.outputTruncated}
					suppressedRawOutput={toolCall.suppressedRawOutput}
				/>
			</ToolContent>
		</Tool>
	);
}

export function AssistantThinkingToolsSection({
	thinkingToolCalls,
	idPrefix,
	defaultOpenMode = "details",
	className,
}: Readonly<AssistantThinkingToolsSectionProps>): React.ReactElement {
	return (
		<div className={cn("space-y-2", className)}>
			{thinkingToolCalls.map((toolCall, index) => {
				const hasDetails = hasToolDetails(toolCall);
				const shouldDefaultOpen =
					defaultOpenMode === "running"
						? isToolRunning(toolCall) && hasDetails
						: hasDetails;

				return (
					<AssistantThinkingToolItem
						key={`${idPrefix}-thinking-tool-${toolCall.id}-${index}`}
						toolCall={toolCall}
						shouldDefaultOpen={shouldDefaultOpen}
					/>
				);
			})}
		</div>
	);
}
