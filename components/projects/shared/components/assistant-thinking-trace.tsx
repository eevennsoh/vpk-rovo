"use client";

import type { ComponentProps, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import ListChecklistIcon from "@atlaskit/icon/core/list-checklist";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import {
	ChainOfThought,
	ChainOfThoughtContent,
	ChainOfThoughtHeader,
	ChainOfThoughtStep,
} from "@/components/ui-custom/chain-of-thought";
import { CodeBlock } from "@/components/ui-custom/code-block";
import { MessageContent, MessageResponse } from "@/components/ui-custom/message";
import { isTimelineOnlyContent } from "@/components/ui-custom/reasoning";
import { ToolInput, ToolOutput } from "@/components/ui-custom/tool";
import { Icon } from "@/components/ui/icon";
import { Lozenge } from "@/components/ui/lozenge";
import { useDynamicThinkingLabel } from "@/components/projects/shared/hooks/use-dynamic-thinking-label";
import { useReasoningPhase, type ReasoningPhase } from "@/components/projects/shared/hooks/use-reasoning-phase";
import {
	getAwaitingUserResponseLabel,
	getDefaultThinkingLabel,
	getReasoningSectionTitle,
} from "@/components/projects/shared/lib/reasoning-labels";
import {
	collectAssistantThinkingTraceData,
	getLatestThinkingToolCallId,
	resolveAssistantThinkingTracePhase,
	resolveAssistantThinkingTraceVisibility,
	resolveThinkingToolCallStepOpen,
	type AssistantThinkingTraceData,
} from "@/components/projects/shared/lib/assistant-thinking-trace-state";
import {
	isThinkingStatusActive as checkThinkingStatusActive,
	resolveThinkingStatusTriggerLabel,
} from "@/components/projects/shared/thread-message/lib/thinking-status-state";
import {
	getMessageReasoningTimestamps,
	hasTurnCompleteSignal,
	type AgentExecutionStatus,
	type AgentExecutionSummary,
	type RovoUIMessage,
	type ThinkingToolCallSummary,
} from "@/lib/rovo-ui-messages";
import {
	type RovoAppTodoProgressItem,
} from "@/components/projects/shared/lib/rovo-todo-progress";
import { getToolDisplayInfo, renderResolvedToolIcon, resolveToolIcon } from "@/components/projects/shared/lib/tool-icon-resolver";
import { cn } from "@/lib/utils";

export interface AssistantThinkingTraceState {
	accumulatedThinkingContent: string;
	data: AssistantThinkingTraceData;
	hasPlanNarrationText: boolean;
	hasThinkingDetails: boolean;
	isOpen: boolean;
	isThinkingStreaming: boolean;
	message: RovoUIMessage;
	onOpenChange: (open: boolean) => void;
	planNarrationStreaming: boolean;
	planNarrationText: string;
	reasoningDuration: number | undefined;
	reasoningPhase: ReasoningPhase;
	shouldShowThinkingSection: boolean;
	thinkingActive: boolean;
	triggerLabel: string;
}

interface UseAssistantThinkingTraceStateOptions {
	message: RovoUIMessage;
	isThinkingLifecycleStreaming: boolean;
	isResponseInFlight: boolean;
	isPostToolsGeneration?: boolean;
	hasWidgetOutput?: boolean;
	isRetryThinkingStatus?: boolean;
	thinkingToolCalls?: ThinkingToolCallSummary[];
	planNarrationText?: string;
	planNarrationStreaming?: boolean;
}

interface AssistantThinkingTraceProps {
	state: AssistantThinkingTraceState;
	className?: string;
}

const StepThinkingIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => <Icon render={<AiAgentIcon label={label} size={size} spacing={spacing} {...props} />} />;
const StepChecklistIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => (
	<Icon render={<ListChecklistIcon label={label} size={size} spacing={spacing} {...props} />} />
);
const StepAgentsIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => <Icon render={<PeopleGroupIcon label={label} size={size} spacing={spacing} {...props} />} />;
const StepStreamIcon = ({ label = "", size = "small", spacing = "none", ...props }: NewCoreIconProps) => (
	<Icon render={<AiGenerativeTextSummaryIcon label={label} size={size} spacing={spacing} {...props} />} />
);

function toolStateToCoTStatus(state: string): "complete" | "active" | "pending" {
	if (state === "running" || state === "awaiting-input" || state === "approval-requested") {
		return "active";
	}
	if (state === "pending") {
		return "pending";
	}
	return "complete";
}

function isToolCallStepOpenByDefault(state: string): boolean {
	return state === "running" || state === "awaiting-input" || state === "approval-requested" || state === "error" || state === "denied";
}

function getNonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function formatToolDisplayName(value: string): string {
	return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

function toToolText(value: string): string {
	const text = formatToolDisplayName(value).toLowerCase();
	return text ? text[0]!.toUpperCase() + text.slice(1) : "Tool";
}

function asRecord(value: unknown): Record<string, unknown> | null {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

function getInputRecords(input: unknown): Record<string, unknown>[] {
	const root = asRecord(input);
	if (!root) {
		return [];
	}

	const records = [root];
	for (const key of ["arguments", "args", "input", "params", "parameters"]) {
		const nested = asRecord(root[key]);
		if (nested && !records.includes(nested)) {
			records.push(nested);
		}
	}
	return records;
}

function getInputString(input: unknown, keys: readonly string[]): string | null {
	for (const record of getInputRecords(input)) {
		for (const key of keys) {
			const value = getNonEmptyString(record[key]);
			if (value) {
				return value;
			}
		}
	}
	return null;
}

function clipToolDetail(value: string): string {
	const text = value.replace(/\s+/g, " ").trim();
	return text.length > 140 ? `${text.slice(0, 137).trimEnd()}...` : text;
}

function getThinkingToolDisplayName(toolCall: ThinkingToolCallSummary): string {
	const displayInfo = getToolDisplayInfo(toolCall.toolName, toolCall.input, toolCall.mcpServer);
	const displayName = getNonEmptyString(displayInfo.displayName) ?? toolCall.toolName;

	return formatToolDisplayName(displayName);
}

function getToolActionLabel(toolCall: ThinkingToolCallSummary): string {
	const displayInfo = getToolDisplayInfo(toolCall.toolName, toolCall.input, toolCall.mcpServer);
	const displayName = getThinkingToolDisplayName(toolCall);
	const normalizedDisplayName = displayName.toLowerCase();
	const server = displayInfo.server;

	if (toolCall.state === "awaiting-input") {
		return "Waiting for input";
	}
	if (toolCall.state === "approval-requested") {
		return "Awaiting approval";
	}
	if (toolCall.state === "error") {
		return `Could not ${normalizedDisplayName}`;
	}
	if (server === "forge-knowledge") {
		return "Searching Forge knowledge";
	}
	if (server === "remote-bitbucket-search") {
		return "Searching Bitbucket";
	}
	if (server === "ads-mcp") {
		return "Checking ADS";
	}
	if (server === "chrome-devtools") {
		return "Inspecting browser";
	}
	if (server === "web-search" || normalizedDisplayName.includes("search")) {
		return "Searching the web";
	}
	if (normalizedDisplayName === "rg" || normalizedDisplayName.includes("grep")) {
		return "Searching code";
	}
	if (normalizedDisplayName === "get skill" || normalizedDisplayName.includes("skill")) {
		return "Applying skills";
	}
	if (normalizedDisplayName === "bash" || normalizedDisplayName === "powershell" || normalizedDisplayName.includes("terminal")) {
		return "Running command";
	}
	if (normalizedDisplayName.includes("todo")) {
		return "Updating steps";
	}
	if (normalizedDisplayName.includes("agent")) {
		return "Coordinating agents";
	}
	if (normalizedDisplayName.includes("file") || normalizedDisplayName.includes("folder") || normalizedDisplayName.includes("grep")) {
		return normalizedDisplayName.includes("create") || normalizedDisplayName.includes("replace") || normalizedDisplayName.includes("delete") || normalizedDisplayName.includes("move")
			? "Editing files"
			: "Reading files";
	}
	if (normalizedDisplayName.startsWith("create") || normalizedDisplayName.startsWith("generate")) {
		return toToolText(displayName);
	}
	if (normalizedDisplayName.startsWith("update")) {
		return toToolText(displayName);
	}
	if (normalizedDisplayName.startsWith("run")) {
		return toToolText(displayName);
	}
	return `Using ${displayName}`;
}

function getThinkingToolTitle(toolCall: ThinkingToolCallSummary): string {
	return getToolActionLabel(toolCall);
}

function getToolInputDetail(toolCall: ThinkingToolCallSummary): string | null {
	const displayInfo = getToolDisplayInfo(toolCall.toolName, toolCall.input, toolCall.mcpServer);
	const displayName = getThinkingToolDisplayName(toolCall);
	const normalizedDisplayName = displayName.toLowerCase();
	const searchQuery = getInputString(toolCall.input, ["query", "q", "search", "searchQuery", "search_query", "terms", "text"]);
	if (
		searchQuery &&
		(
			displayInfo.server === "web-search" ||
			normalizedDisplayName === "rg" ||
			normalizedDisplayName.includes("grep") ||
			normalizedDisplayName.includes("search")
		)
	) {
		return `Searching ${clipToolDetail(searchQuery)}`;
	}

	const skillName = getInputString(toolCall.input, ["skill", "skillName", "skill_name", "name"]);
	const skillReason = getInputString(toolCall.input, ["reason", "purpose", "description"]);
	if (skillName && (normalizedDisplayName === "get skill" || normalizedDisplayName.includes("skill"))) {
		return skillReason
			? `Using ${clipToolDetail(skillName)} to ${clipToolDetail(skillReason)}`
			: `Using ${clipToolDetail(skillName)}`;
	}

	const command = getInputString(toolCall.input, ["command", "cmd", "script"]);
	if (command) {
		return `Running ${clipToolDetail(command)}`;
	}

	const path = getInputString(toolCall.input, ["path", "file", "filename", "filepath", "directory", "cwd"]);
	if (path) {
		return `Inspecting ${clipToolDetail(path)}`;
	}

	const url = getInputString(toolCall.input, ["url", "href", "link"]);
	if (url) {
		return `Opening ${clipToolDetail(url)}`;
	}

	const prompt = getInputString(toolCall.input, ["prompt", "message", "question", "instructions"]);
	if (prompt) {
		return clipToolDetail(prompt);
	}

	return null;
}

function getThinkingToolByline(
	toolCall: ThinkingToolCallSummary,
	narration?: readonly string[],
): string {
	const latestNarration = (() => {
		if (!narration) {
			return null;
		}
		for (let index = narration.length - 1; index >= 0; index -= 1) {
			const text = getNonEmptyString(narration[index]);
			if (text) {
				return text;
			}
		}
		return null;
	})();
	if (latestNarration) {
		return clipToolDetail(latestNarration);
	}

	const displayName = getThinkingToolDisplayName(toolCall);
	const inputDetail = getToolInputDetail(toolCall);
	if (inputDetail) {
		return inputDetail;
	}
	if (toolCall.state === "completed") {
		return "Complete";
	}
	if (toolCall.state === "error") {
		return toolCall.errorText ?? "Tool returned an error";
	}
	if (toolCall.state === "awaiting-input") {
		return "Waiting for your response";
	}
	if (toolCall.state === "approval-requested") {
		return `Review ${displayName} before it runs`;
	}
	return `Running ${displayName}`;
}

function getAgentExecutionVariant(status: AgentExecutionStatus): ComponentProps<typeof Lozenge>["variant"] {
	if (status === "completed") {
		return "success";
	}
	if (status === "failed") {
		return "danger";
	}
	return "information";
}

function getAgentExecutionLabel(status: AgentExecutionStatus): string {
	if (status === "completed") {
		return "Completed";
	}
	if (status === "failed") {
		return "Failed";
	}
	return "Working";
}

function getTodoProgressVariant(status: RovoAppTodoProgressItem["status"]): ComponentProps<typeof Lozenge>["variant"] {
	if (status === "completed") {
		return "success";
	}
	if (status === "in_progress") {
		return "information";
	}
	return "neutral";
}

function getTodoProgressLabel(status: RovoAppTodoProgressItem["status"]): string {
	if (status === "completed") {
		return "Completed";
	}
	if (status === "in_progress") {
		return "In progress";
	}
	return "Pending";
}

function TraceStepsSection({
	items,
}: Readonly<{
	items: ReadonlyArray<{
		id: string;
		text: string;
		blockedBy: string[];
		agent?: string;
	}>;
}>) {
	return (
		<div className="space-y-2">
			{items.map((item) => {
				const isBlocked = item.blockedBy.length > 0;

				return (
					<div key={item.id} className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
						<div className="flex flex-wrap items-start gap-2">
							<div className="min-w-0 flex-1">
								<p className="text-sm font-medium text-text">{item.text}</p>
								<div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-subtle">
									<span>{item.id}</span>
									{item.agent ? <span>{item.agent}</span> : null}
									{isBlocked ? <span>Blocked by {item.blockedBy.join(", ")}</span> : <span>Ready to run</span>}
								</div>
							</div>
							<Lozenge variant={isBlocked ? "warning" : "neutral"}>{isBlocked ? "Blocked" : "Queued"}</Lozenge>
						</div>
					</div>
				);
			})}
		</div>
	);
}

function TraceTodoProgressSection({
	items,
}: Readonly<{
	items: ReadonlyArray<RovoAppTodoProgressItem>;
}>) {
	return (
		<div className="space-y-2">
			{items.map((item) => (
				<div key={item.id} className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
					<div className="flex flex-wrap items-start gap-2">
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-text">{item.label}</p>
							<div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-subtle">
								<span>{item.id}</span>
								{item.activeForm && item.activeForm !== item.content ? <span>{item.content}</span> : null}
							</div>
						</div>
						<Lozenge variant={getTodoProgressVariant(item.status)}>{getTodoProgressLabel(item.status)}</Lozenge>
					</div>
				</div>
			))}
		</div>
	);
}

function TraceAgentExecutionSection({
	executions,
}: Readonly<{
	executions: ReadonlyArray<AgentExecutionSummary>;
}>) {
	return (
		<div className="space-y-2">
			{executions.map((execution) => (
				<div key={execution.taskId} className="space-y-2">
					<div className="flex flex-wrap items-start gap-2">
						<div className="min-w-0 flex-1">
							<p className="text-sm font-medium text-text">{execution.taskLabel}</p>
							<div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-text-subtle">
								<span>{execution.agentName}</span>
								<span>{execution.taskId}</span>
							</div>
						</div>
						<Lozenge variant={getAgentExecutionVariant(execution.status)}>{getAgentExecutionLabel(execution.status)}</Lozenge>
					</div>
					{execution.content ? (
						<div className="text-xs text-text-subtle">
							<MessageContent>
								<MessageResponse>{execution.content}</MessageResponse>
							</MessageContent>
						</div>
					) : null}
				</div>
			))}
		</div>
	);
}

export function useAssistantThinkingTraceState({
	message,
	isThinkingLifecycleStreaming,
	isResponseInFlight,
	isPostToolsGeneration = false,
	hasWidgetOutput = false,
	isRetryThinkingStatus = false,
	thinkingToolCalls,
	planNarrationText = "",
	planNarrationStreaming = false,
}: Readonly<UseAssistantThinkingTraceStateOptions>): AssistantThinkingTraceState {
	const data = useMemo(
		() => collectAssistantThinkingTraceData(message, { thinkingToolCalls }),
		[message, thinkingToolCalls],
	);
	const hasTurnComplete = hasTurnCompleteSignal(message);
	const rawThinkingActive = checkThinkingStatusActive({
		hasThinkingStatusPart: data.hasThinkingStatusPart,
		hasThinkingEvents: data.hasTraceDataSignals,
		isRetryThinkingStatus,
		isStreaming: isThinkingLifecycleStreaming,
	});
	const [hasLatchedThinking, setHasLatchedThinking] = useState(false);
	const { effectiveIsThinkingActive, nextLatched } = resolveAssistantThinkingTraceVisibility({
		isThinkingActive: rawThinkingActive,
		isResponseInFlight,
		wasLatched: hasLatchedThinking,
	});

	useEffect(() => {
		if (hasLatchedThinking === nextLatched) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setHasLatchedThinking(nextLatched);
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [hasLatchedThinking, nextLatched]);

	const thinkingActive = effectiveIsThinkingActive;
	const isThinkingStreaming =
		isThinkingLifecycleStreaming &&
		thinkingActive &&
		data.hasBackendThinkingActivity;
	const accumulatedThinkingContent = data.thinkingNarrationMap.unassociated.join("\n\n");
	const hasThinkingText = Boolean(accumulatedThinkingContent);
	const shouldShowThinkingSection =
		hasThinkingText &&
		!(isTimelineOnlyContent(accumulatedThinkingContent) && data.hasThinkingToolCalls);
	const hasPlanNarrationText = Boolean(planNarrationText);
	const hasThinkingDetails =
		shouldShowThinkingSection ||
		data.hasTodoProgressItems ||
		data.hasLegacyTodoQueueItems ||
		data.hasAgentExecutions ||
		data.hasThinkingToolCalls ||
		hasPlanNarrationText;
	const shouldAutoOpenThinking =
		isThinkingStreaming ||
		data.hasAwaitingInputToolCalls ||
		data.thinkingToolCalls.some((toolCall) => toolCall.state === "running" || toolCall.state === "approval-requested");
	const [thinkingUserOverride, setThinkingUserOverride] = useState<boolean | null>(null);
	const prevAutoOpenRef = useRef(shouldAutoOpenThinking);

	useEffect(() => {
		if (shouldAutoOpenThinking && !prevAutoOpenRef.current) {
			const timeoutId = window.setTimeout(() => {
				setThinkingUserOverride(null);
			}, 0);
			prevAutoOpenRef.current = shouldAutoOpenThinking;
			return () => window.clearTimeout(timeoutId);
		}
		prevAutoOpenRef.current = shouldAutoOpenThinking;
	}, [shouldAutoOpenThinking]);

	const isOpen = thinkingUserOverride ?? (hasThinkingDetails && shouldAutoOpenThinking);
	const thinkingTimestamps = getMessageReasoningTimestamps(message);
	const { phase: lifecyclePhase, duration: reasoningDuration } = useReasoningPhase({
		isStreaming: isThinkingStreaming,
		hasMessageText: data.hasBackendThinkingActivity,
		responseKey: message.id,
		autoIdle: false,
		persistedStartTime: thinkingTimestamps.startedAt,
		persistedEndTime: thinkingTimestamps.completedAt,
	});
	const reasoningPhase = resolveAssistantThinkingTracePhase({
		isThinkingActive: thinkingActive,
		hasTurnComplete,
		isThinkingLifecycleStreaming,
		hasBackendThinkingActivity: data.hasBackendThinkingActivity,
		hasAwaitingInputToolCalls: data.hasAwaitingInputToolCalls,
		isPostToolsGeneration,
		hasWidgetOutput,
		lifecyclePhase,
	});
	const thinkingUpdateSignal = [
		message.id,
		`status-count:${data.thinkingStatusParts.length}`,
		`status-id:${data.lastThinkingStatusPart?.id ?? ""}`,
		`status-label:${data.lastThinkingStatusPart?.data.label ?? ""}`,
		`event-count:${data.thinkingEventParts.length}`,
		`event-id:${data.lastThinkingEventPart?.data.eventId ?? ""}`,
	].join("|");
	const { label: dynamicThinkingLabel } = useDynamicThinkingLabel({
		baseLabel: data.lastThinkingStatusPart?.data.label ?? getDefaultThinkingLabel(),
		isStreaming: isThinkingStreaming,
		updateSignal: thinkingUpdateSignal,
		fallbackLabel: getDefaultThinkingLabel(),
	});
	const triggerLabel = data.hasAwaitingInputToolCalls
		? getAwaitingUserResponseLabel()
		: resolveThinkingStatusTriggerLabel({
				resolvedLabel: dynamicThinkingLabel,
				reasoningPhase,
				duration: reasoningDuration,
			});
	return {
		accumulatedThinkingContent,
		data,
		hasPlanNarrationText,
		hasThinkingDetails,
		isOpen,
		isThinkingStreaming,
		message,
		onOpenChange: setThinkingUserOverride,
		planNarrationStreaming,
		planNarrationText,
		reasoningDuration,
		reasoningPhase,
		shouldShowThinkingSection,
		thinkingActive,
		triggerLabel,
	};
}

function ThinkingToolCallStep({
	messageId,
	narration,
	open,
	toolCall,
	index,
	onOpenChange,
}: Readonly<{
	messageId: string;
	narration: string[] | undefined;
	open: boolean;
	toolCall: ThinkingToolCallSummary;
	index: number;
	onOpenChange: (open: boolean) => void;
}>): ReactNode {
	const status = toolStateToCoTStatus(toolCall.state);
	const resolvedToolIcon = resolveToolIcon({
		toolName: toolCall.toolName,
		title: toolCall.toolName,
		input: toolCall.input,
		mcpServer: toolCall.mcpServer,
	});

	return (
		<ChainOfThoughtStep
			key={`${messageId}-cot-tool-${toolCall.id}-${index}`}
			collapsible
			defaultOpen={isToolCallStepOpenByDefault(toolCall.state)}
			open={open}
			onOpenChange={onOpenChange}
			iconRender={renderResolvedToolIcon(resolvedToolIcon, {
				className: "size-4",
			})}
			label={getThinkingToolTitle(toolCall)}
			description={getThinkingToolByline(toolCall, narration)}
			status={status}
		>
			{narration && narration.length > 0 ? <div className="whitespace-pre-wrap text-xs text-text-subtle leading-5">{narration.join("\n\n")}</div> : null}
			{toolCall.input !== undefined ? <ToolInput input={toolCall.input} /> : null}
			<ToolOutput
				errorText={toolCall.errorText}
				output={toolCall.output}
				outputPreview={toolCall.outputPreview}
				outputBytes={toolCall.outputBytes}
				outputTruncated={toolCall.outputTruncated}
				suppressedRawOutput={toolCall.suppressedRawOutput}
			/>
		</ChainOfThoughtStep>
	);
}

export function AssistantThinkingTrace({
	state,
	className,
}: Readonly<AssistantThinkingTraceProps>): ReactNode {
	const [manuallyOpenedToolCallIds, setManuallyOpenedToolCallIds] = useState<Set<string>>(() => new Set());
	const [manuallyClosedToolCallIds, setManuallyClosedToolCallIds] = useState<Set<string>>(() => new Set());
	const toolCallIds = useMemo(
		() => state.data.thinkingToolCalls.map((toolCall) => toolCall.id),
		[state.data.thinkingToolCalls],
	);
	const toolCallIdsKey = toolCallIds.join("|");
	const autoOpenToolCallId = getLatestThinkingToolCallId(state.data.thinkingToolCalls);

	useEffect(() => {
		setManuallyOpenedToolCallIds(new Set());
		setManuallyClosedToolCallIds(new Set());
	}, [state.message.id]);

	useEffect(() => {
		const currentToolCallIds = new Set(toolCallIds);
		setManuallyOpenedToolCallIds((current) => {
			const next = new Set([...current].filter((toolCallId) => currentToolCallIds.has(toolCallId)));
			return next.size === current.size ? current : next;
		});
		setManuallyClosedToolCallIds((current) => {
			const next = new Set([...current].filter((toolCallId) => currentToolCallIds.has(toolCallId)));
			return next.size === current.size ? current : next;
		});
	}, [toolCallIds, toolCallIdsKey]);

	const handleToolCallOpenChange = useCallback((toolCallId: string, open: boolean) => {
		if (open) {
			setManuallyOpenedToolCallIds((current) => {
				if (current.has(toolCallId)) {
					return current;
				}
				const next = new Set(current);
				next.add(toolCallId);
				return next;
			});
			setManuallyClosedToolCallIds((current) => {
				if (!current.has(toolCallId)) {
					return current;
				}
				const next = new Set(current);
				next.delete(toolCallId);
				return next;
			});
			return;
		}

		setManuallyOpenedToolCallIds((current) => {
			if (!current.has(toolCallId)) {
				return current;
			}
			const next = new Set(current);
			next.delete(toolCallId);
			return next;
		});
		setManuallyClosedToolCallIds((current) => {
			if (current.has(toolCallId)) {
				return current;
			}
			const next = new Set(current);
			next.add(toolCallId);
			return next;
		});
	}, []);

	if (!state.thinkingActive) {
		return null;
	}

	return (
		<ChainOfThought className={cn("mb-0", className)} open={state.isOpen} onOpenChange={state.onOpenChange}>
			<ChainOfThoughtHeader
				state={state.reasoningPhase === "completed" ? "completed" : state.reasoningPhase === "thinking" ? "thinking" : "preload"}
				duration={state.reasoningPhase === "completed" ? state.reasoningDuration : undefined}
				showChevron={state.hasThinkingDetails}
			>
				{state.triggerLabel}
			</ChainOfThoughtHeader>
			{state.hasThinkingDetails ? (
				<ChainOfThoughtContent>
					{state.shouldShowThinkingSection ? (
						<ChainOfThoughtStep icon={StepThinkingIcon} label={getReasoningSectionTitle("thinking")} status={state.isThinkingStreaming ? "active" : "complete"}>
							<CodeBlock className="text-xs" code={state.accumulatedThinkingContent} language="markdown" />
						</ChainOfThoughtStep>
					) : null}
					{state.data.hasTodoProgressItems ? (
						<ChainOfThoughtStep icon={StepChecklistIcon} label={getReasoningSectionTitle("steps")} status={state.isThinkingStreaming ? "active" : "complete"}>
							<TraceTodoProgressSection items={state.data.todoProgressItems} />
						</ChainOfThoughtStep>
					) : null}
					{state.data.hasLegacyTodoQueueItems ? (
						<ChainOfThoughtStep icon={StepChecklistIcon} label={getReasoningSectionTitle("steps")} status={state.isThinkingStreaming ? "active" : "complete"}>
							<TraceStepsSection items={state.data.todoQueueItems} />
						</ChainOfThoughtStep>
					) : null}
					{state.data.hasAgentExecutions ? (
						<ChainOfThoughtStep icon={StepAgentsIcon} label={getReasoningSectionTitle("agents")} status={state.isThinkingStreaming ? "active" : "complete"}>
							<TraceAgentExecutionSection executions={state.data.agentExecutions} />
						</ChainOfThoughtStep>
					) : null}
					{state.data.thinkingToolCalls.map((toolCall, index) => {
						const narration = toolCall.toolCallId ? state.data.thinkingNarrationMap.byToolCallId.get(toolCall.toolCallId) : undefined;
						const isOpen = resolveThinkingToolCallStepOpen({
							toolCallId: toolCall.id,
							autoOpenToolCallId,
							manuallyOpenedToolCallIds,
							manuallyClosedToolCallIds,
						});
						return (
							<ThinkingToolCallStep
								key={`${state.message.id}-cot-tool-${toolCall.id}-${index}`}
								messageId={state.message.id}
								narration={narration}
								open={isOpen}
								toolCall={toolCall}
								index={index}
								onOpenChange={(open) => handleToolCallOpenChange(toolCall.id, open)}
							/>
						);
					})}
					{state.hasPlanNarrationText ? (
						<ChainOfThoughtStep icon={StepStreamIcon} label={getReasoningSectionTitle("stream")} status={state.planNarrationStreaming ? "active" : "complete"}>
							<div className="whitespace-pre-wrap text-xs text-text-subtle leading-5">{state.planNarrationText}</div>
						</ChainOfThoughtStep>
					) : null}
				</ChainOfThoughtContent>
			) : null}
		</ChainOfThought>
	);
}
