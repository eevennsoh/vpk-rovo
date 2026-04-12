import {
	getToolName,
	isReasoningUIPart,
	isTextUIPart,
	isToolUIPart,
	type DynamicToolUIPart,
	type SourceDocumentUIPart,
	type SourceUrlUIPart,
	type ToolUIPart,
	type UIMessage,
} from "ai";
import type { RovoAppPromptMode } from "@/lib/rovo-app-types";

// ---------------------------------------------------------------------------
// Routing decision types (v2)
// ---------------------------------------------------------------------------

export type RoutingIntent = "chat" | "artifact_create" | "artifact_update" | "genui";
export type RoutingPresentation = "text" | "genui_card" | "artifact_preview";
export type RoutingOrigin = "text" | "voice";

export interface RoutingDecision {
	readonly intent: RoutingIntent;
	readonly presentation: RoutingPresentation;
	readonly confidence: number;
	readonly reason: string;
	readonly origin: RoutingOrigin;
}

export type AgentExecutionStatus = "working" | "completed" | "failed";

export interface AgentExecutionUpdate {
	agentId: string;
	agentName: string;
	taskId: string;
	taskLabel: string;
	status: AgentExecutionStatus;
	content?: string;
}

export type ThinkingEventPhase = "start" | "result" | "error";

export type ThinkingStatusActivity =
	| "image"
	| "audio"
	| "ui"
	| "data"
	| "results";

export type ThinkingStatusSource = "backend" | "fallback";

export interface ThinkingEventUpdate {
	eventId: string;
	phase: ThinkingEventPhase;
	toolName: string;
	toolCallId?: string;
	input?: unknown;
	output?: unknown;
	outputPreview?: string;
	outputTruncated?: boolean;
	outputBytes?: number;
	suppressedRawOutput?: boolean;
	errorText?: string;
	timestamp: string;
	mcpServer?: string;
	permissionScenario?: string;
}

export type ThinkingToolState =
	| "approval-requested"
	| "running"
	| "awaiting-input"
	| "completed"
	| "error";

export interface ThinkingToolCallSummary {
	id: string;
	toolName: string;
	toolCallId?: string;
	state: ThinkingToolState;
	input?: unknown;
	output?: unknown;
	outputPreview?: string;
	outputTruncated?: boolean;
	outputBytes?: number;
	suppressedRawOutput?: boolean;
	errorText?: string;
	timestamp?: string;
	mcpServer?: string;
	permissionScenario?: string;
}

export interface AgentExecutionSummary {
	agentId: string;
	agentName: string;
	taskId: string;
	taskLabel: string;
	status: AgentExecutionStatus;
	content: string;
}

export interface ToolApprovalItem {
	id: string;
	toolCallId: string;
	toolName: string;
	title: string;
	description: string;
	targetPath?: string;
	commandPreview?: string | null;
	riskLevel?: "low" | "medium" | "high";
	permissionScenario?: string;
}

export interface ToolApprovalPayload {
	approvalId: string;
	threadId?: string;
	createdAt?: string;
	items: ToolApprovalItem[];
}

export interface ToolFirstWarningData {
	message: string;
	domains: string[];
	attempts: number;
	retriesUsed: number;
	hadRelevantToolStart: boolean;
	relevantToolErrors: number;
	lastRelevantToolName?: string | null;
	lastRelevantErrorCategory?: string | null;
	lastRelevantError?: string | null;
	rovoDevFallback: boolean;
}

export type RovoMessageInterruptionSource =
	| "artifact-submission"
	| "voice-barge-in"
	| "user-stop";

export interface RovoMessageInterruption {
	status: "interrupted";
	source: RovoMessageInterruptionSource;
	interruptedAt: string;
}

export type RovoDataParts = {
	id: string;
	title: string;
	kind: "text" | "code" | "image" | "sheet" | "excalidraw";
	"artifact-result": {
		documentId: string;
		title: string;
		kind: "text" | "code" | "image" | "sheet" | "excalidraw";
		action: "create" | "update";
	};
	clear: null;
	finish: null;
	"cancel-streaming": null;
	textDelta: string;
	codeDelta: string;
	"widget-loading": {
		type?: string;
		loading: boolean;
	};
	"widget-data": {
		type?: string;
		payload: unknown;
	};
	"widget-error": {
		type?: string;
		code?: string;
		message: string;
		details?: string;
		canRetry?: boolean;
	};
	"suggested-questions": {
		questions: string[];
	};
	"thinking-status": {
		label: string;
		content?: string;
		activity?: ThinkingStatusActivity;
		source?: ThinkingStatusSource;
		timestamp?: string;
	};
	"thinking-event": ThinkingEventUpdate;
	"tool-first-warning": ToolFirstWarningData;
	"agent-execution": AgentExecutionUpdate;
	"tool-approval": ToolApprovalPayload;
	"todo-queue": {
		items: Array<{
			id: string;
			text: string;
			blockedBy: string[];
			agent?: string;
		}>;
	};
	"turn-complete": {
		timestamp: string;
	};
	"route-decision": RoutingDecision;
};

export type RovoDataPart<KEY extends keyof RovoDataParts & string> = {
	type: `data-${KEY}`;
	id?: string;
	data: RovoDataParts[KEY];
};

export interface RovoMessageMetadata {
	visibility?: "visible" | "hidden";
	source?:
		| "clarification-submit"
		| "plan-approval-submit"
		| "tool-approval-submit"
		| "agent-directive"
		| "plan-retry"
		| "plan-task-dispatch";
	/** Internal provenance for unified voice/chat routing */
	origin?: "realtime" | "rovodev";
	/** Stable timestamps for merging persisted realtime + RovoDev threads */
	createdAt?: string;
	updatedAt?: string;
	/** OpenAI Realtime-side identifier for correlating client/server events */
	realtimeMessageId?: string;
	/** Existing user message reused when GPT-Realtime delegates to RovoDev */
	delegatedFromId?: string;
	/** Mode snapped when the user submitted the prompt. */
	submittedMode?: RovoAppPromptMode;
	planApprovalDecision?: "auto-accept" | "continue-planning" | "custom";
	planApprovalPlanKey?: string;
	/** Short label shown in the user bubble instead of the full prompt text */
	displayLabel?: string;
	/** Structured clarification rows shown in the specialized user summary bubble */
	clarificationSummary?: Array<{
		question: string;
		answer: string;
		status?: "skipped";
	}>;
	/** Correlates clarification submits/dismissals with a specific deferred question card */
	clarificationToolCallId?: string;
	clarificationSessionId?: string;
	clarificationRound?: number;
	clarificationStatus?: "answered" | "dismissed";
	toolApprovalId?: string;
	/** Assistant turn status used for transcript rendering and persistence */
	interruption?: RovoMessageInterruption;
}

export type RovoUIMessage = UIMessage<RovoMessageMetadata, RovoDataParts>;
export type RovoRenderableUIMessage = RovoUIMessage & {
	role: "user" | "assistant";
};
export type RovoToolPart = ToolUIPart | DynamicToolUIPart;
export type RovoSourcePart = SourceUrlUIPart | SourceDocumentUIPart;

const CREATE_PLAN_SIGNAL_REGEX = /\bcreate[-_\s]?plan\b/i;
const REQUEST_USER_INPUT_TOOL_NAME_REGEX =
	/(?:^|\.)(?:request_user_input|ask_user_questions|ask_user_question)$/i;
const ROUTING_INTENTS = new Set<RoutingIntent>([
	"chat",
	"artifact_create",
	"artifact_update",
	"genui",
]);
const ROUTING_PRESENTATIONS = new Set<RoutingPresentation>([
	"text",
	"genui_card",
	"artifact_preview",
]);
const ROUTING_ORIGINS = new Set<RoutingOrigin>(["text", "voice"]);

export function isRequestUserInputToolName(toolName: unknown): boolean {
	if (typeof toolName !== "string") {
		return false;
	}

	const normalizedToolName = toolName.trim();
	if (!normalizedToolName) {
		return false;
	}

	return REQUEST_USER_INPUT_TOOL_NAME_REGEX.test(normalizedToolName);
}

function thinkingPhaseToState(
	phase: ThinkingEventPhase,
	options: { permissionScenario?: string } = {}
): ThinkingToolState {
	if (phase === "error") return "error";
	if (phase === "result") return "completed";
	if (
		typeof options.permissionScenario === "string" &&
		options.permissionScenario.trim().length > 0
	) {
		return "approval-requested";
	}
	return "running";
}

function extractOutputPreview(
	phase: ThinkingEventPhase,
	preview: unknown
): string | undefined {
	if (phase !== "result" && phase !== "error") return undefined;
	return typeof preview === "string" ? preview : undefined;
}

export function createAssistantTextMessage(
	id: string,
	content: string
): RovoUIMessage {
	return {
		id,
		role: "assistant",
		parts: [{ type: "text", text: content, state: "done" }],
	};
}

export function getLatestUserMessageId(
	messages: ReadonlyArray<Pick<RovoUIMessage, "id" | "role">>
): string | null {
	for (let index = messages.length - 1; index >= 0; index--) {
		if (messages[index].role === "user") {
			return messages[index].id;
		}
	}

	return null;
}

export function isRenderableRovoUIMessage(
	message: RovoUIMessage
): message is RovoRenderableUIMessage {
	return (
		(message.role === "user" || message.role === "assistant") &&
		message.metadata?.visibility !== "hidden"
	);
}

export function isMessageVisibleInTranscript(
	message: Pick<RovoUIMessage, "metadata">
): boolean {
	return message.metadata?.visibility !== "hidden";
}

export function getLatestDataPart<KEY extends keyof RovoDataParts & string>(
	message: Pick<RovoUIMessage, "parts">,
	type: `data-${KEY}`
): RovoDataPart<KEY> | null {
	for (let index = message.parts.length - 1; index >= 0; index--) {
		const part = message.parts[index];
		if (part.type === type) {
			return part as RovoDataPart<KEY>;
		}
	}

	return null;
}

function clampRoutingConfidence(value: unknown): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return 1;
	}

	return Math.max(0, Math.min(1, value));
}

export function isRoutingDecision(value: unknown): value is RoutingDecision {
	if (!value || typeof value !== "object") {
		return false;
	}

	const candidate = value as Partial<RoutingDecision>;
	return (
		ROUTING_INTENTS.has(candidate.intent as RoutingIntent) &&
		ROUTING_PRESENTATIONS.has(candidate.presentation as RoutingPresentation) &&
		typeof candidate.confidence === "number" &&
		Number.isFinite(candidate.confidence) &&
		typeof candidate.reason === "string" &&
		candidate.reason.trim().length > 0 &&
		ROUTING_ORIGINS.has(candidate.origin as RoutingOrigin)
	);
}

function normalizeRoutingDecision(value: unknown): RoutingDecision | null {
	if (!isRoutingDecision(value)) {
		return null;
	}

	return {
		intent: value.intent,
		presentation: value.presentation,
		confidence: clampRoutingConfidence(value.confidence),
		reason: value.reason.trim(),
		origin: value.origin,
	};
}

export function getLatestRouteDecision(
	message: Pick<RovoUIMessage, "parts">
): RoutingDecision | null {
	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index];
		if (part.type !== "data-route-decision") {
			continue;
		}

		const routeDecision = normalizeRoutingDecision(part.data);
		if (routeDecision) {
			return routeDecision;
		}
	}

	return null;
}

export function getAllDataParts<KEY extends keyof RovoDataParts & string>(
	message: Pick<RovoUIMessage, "parts">,
	type: `data-${KEY}`
): RovoDataPart<KEY>[] {
	const result: RovoDataPart<KEY>[] = [];
	for (const part of message.parts) {
		if (part.type === type) {
			result.push(part as RovoDataPart<KEY>);
		}
	}
	return result;
}

export function hasTurnCompleteSignal(
	message: Pick<RovoUIMessage, "parts">
): boolean {
	for (let index = message.parts.length - 1; index >= 0; index--) {
		if (message.parts[index].type === "data-turn-complete") {
			return true;
		}
	}

	return false;
}

function getIsoTimestamp(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}

	return Number.isFinite(Date.parse(trimmed)) ? trimmed : undefined;
}

function getLatestTurnCompleteTimestamp(
	message: Pick<RovoUIMessage, "parts">
): string | undefined {
	return getIsoTimestamp(
		getLatestDataPart(message, "data-turn-complete")?.data.timestamp
	);
}

export interface MessageReasoningTimestamps {
	startedAt?: string;
	completedAt?: string;
}

export function getMessageReasoningTimestamps(
	message: Pick<RovoUIMessage, "parts" | "metadata">
): MessageReasoningTimestamps {
	const thinkingStatusParts = getAllDataParts(message, "data-thinking-status");
	const thinkingEventParts = getAllDataParts(message, "data-thinking-event");
	const thinkingStatusTimestamps = thinkingStatusParts
		.map((part) => getIsoTimestamp(part.data.timestamp))
		.filter((timestamp): timestamp is string => timestamp !== undefined);
	const thinkingEventTimestamps = thinkingEventParts
		.map((part) => getIsoTimestamp(part.data.timestamp))
		.filter((timestamp): timestamp is string => timestamp !== undefined);
	const startedAt =
		thinkingEventTimestamps[0] ??
		thinkingStatusTimestamps[0] ??
		getIsoTimestamp(message.metadata?.createdAt);
	const completedAt =
		getLatestTurnCompleteTimestamp(message) ??
		thinkingEventTimestamps[thinkingEventTimestamps.length - 1] ??
		thinkingStatusTimestamps[thinkingStatusTimestamps.length - 1] ??
		getIsoTimestamp(message.metadata?.updatedAt);

	return {
		startedAt,
		completedAt,
	};
}

export function getMessageInterruption(
	message: Pick<RovoUIMessage, "metadata">
): RovoMessageInterruption | null {
	const interruption = message.metadata?.interruption;
	if (interruption?.status !== "interrupted") {
		return null;
	}

	return interruption;
}

export function getMessageText(
	message: Pick<RovoUIMessage, "parts">
): string {
	return message.parts
		.filter(isTextUIPart)
		.map((part) => part.text)
		.join("\n\n")
		.trim();
}

export function isMessageTextStreaming(
	message: Pick<RovoUIMessage, "parts">
): boolean {
	return message.parts.some(
		(part) => part.type === "text" && part.state === "streaming"
	);
}

export function getMessageReasoning(
	message: Pick<RovoUIMessage, "parts">
): { text: string; isStreaming: boolean } | null {
	const reasoningParts = message.parts.filter(isReasoningUIPart);
	if (reasoningParts.length === 0) {
		return null;
	}

	const text = reasoningParts
		.map((part) => part.text)
		.join("\n\n")
		.trim();
	const isStreaming = reasoningParts.some((part) => part.state === "streaming");
	if (text.length === 0 && !isStreaming) {
		return null;
	}

	return {
		text,
		isStreaming,
	};
}

export function getMessageSources(
	message: Pick<RovoUIMessage, "parts">
): RovoSourcePart[] {
	const sources = message.parts.filter(
		(part): part is RovoSourcePart =>
			part.type === "source-url" || part.type === "source-document"
	);
	const seenSourceIds = new Set<string>();

	return sources.filter((sourcePart) => {
		const sourceKey = `${sourcePart.type}:${sourcePart.sourceId}`;
		if (seenSourceIds.has(sourceKey)) {
			return false;
		}

		seenSourceIds.add(sourceKey);
		return true;
	});
}

export function getMessageArtifactResult(
	message: Pick<RovoUIMessage, "parts">
): RovoDataParts["artifact-result"] | null {
	return getLatestDataPart(message, "data-artifact-result")?.data ?? null;
}

export function getMessageToolParts(
	message: Pick<RovoUIMessage, "parts">
): RovoToolPart[] {
	return message.parts.filter(isToolUIPart);
}

export function getThinkingEvents(
	message: Pick<RovoUIMessage, "parts">
): ThinkingEventUpdate[] {
	return getAllDataParts(message, "data-thinking-event").map((part) => part.data);
}

export interface ThinkingNarrationMap {
	/** Narration texts keyed by toolCallId */
	byToolCallId: Map<string, string[]>;
	/** Narration texts that don't precede any tool call */
	unassociated: string[];
}

/**
 * Walk `message.parts` in chronological order to associate narration
 * (`data-thinking-status` content) with the tool call it precedes.
 *
 * Buffer consecutive status parts. When a `data-thinking-event` with
 * `phase === "start"` appears, flush the buffer into that event's
 * `toolCallId` bucket. Any leftover narration that doesn't precede a
 * tool call is returned as `unassociated`.
 */
export function buildThinkingNarrationMap(
	message: Pick<RovoUIMessage, "parts">,
): ThinkingNarrationMap {
	const byToolCallId = new Map<string, string[]>();
	let buffer: string[] = [];

	for (const part of message.parts) {
		if (part.type === "data-thinking-status") {
			const data = (part as RovoDataPart<"thinking-status">).data;
			if (typeof data.content === "string" && data.content.trim()) {
				buffer.push(data.content.trim());
			}
			continue;
		}

		if (part.type === "data-thinking-event") {
			const data = (part as RovoDataPart<"thinking-event">).data;
			if (data.phase === "start" && buffer.length > 0) {
				const toolCallId =
					typeof data.toolCallId === "string" && data.toolCallId.trim()
						? data.toolCallId.trim()
						: undefined;
				if (toolCallId) {
					const existing = byToolCallId.get(toolCallId) ?? [];
					existing.push(...buffer);
					byToolCallId.set(toolCallId, existing);
					buffer = [];
				}
			}
		}
	}

	return { byToolCallId, unassociated: buffer };
}

export function getToolFirstWarning(
	message: RovoUIMessage
): ToolFirstWarningData | null {
	return getLatestDataPart(message, "data-tool-first-warning")?.data ?? null;
}

export function getThinkingToolCallSummaries(
	message: Pick<RovoUIMessage, "parts">
): ThinkingToolCallSummary[] {
	const events = getThinkingEvents(message);
	if (events.length === 0) {
		return [];
	}

	const summaries: ThinkingToolCallSummary[] = [];
	const summaryIndexByKey = new Map<string, number>();

	for (const [index, event] of events.entries()) {
		const eventId =
			typeof event.eventId === "string" && event.eventId.trim()
				? event.eventId.trim()
				: `thinking-event-${index}`;
		const toolCallId =
			typeof event.toolCallId === "string" && event.toolCallId.trim()
				? event.toolCallId.trim()
				: undefined;
		const key = toolCallId ? `call:${toolCallId}` : `event:${eventId}`;
		const toolName =
			typeof event.toolName === "string" && event.toolName.trim()
				? event.toolName.trim()
				: "Tool";
		const timestamp =
			typeof event.timestamp === "string" && event.timestamp.trim()
				? event.timestamp.trim()
				: undefined;
		const summaryIndex = summaryIndexByKey.get(key);
		const eventOutput = event.output;
		const eventOutputPreview =
			typeof event.outputPreview === "string"
				? event.outputPreview
				: typeof eventOutput === "string"
					? eventOutput
					: undefined;
		const eventOutputTruncated = event.outputTruncated === true;
		const eventOutputBytes =
			typeof event.outputBytes === "number" && Number.isFinite(event.outputBytes)
				? event.outputBytes
				: undefined;
		const eventSuppressedRawOutput = event.suppressedRawOutput === true;

		if (summaryIndex === undefined) {
			summaries.push({
				id: key,
				toolName,
				toolCallId,
				state: thinkingPhaseToState(event.phase, {
					permissionScenario: event.permissionScenario,
				}),
				input: event.input,
				output:
					event.phase === "result" || event.phase === "error"
						? eventOutput
						: undefined,
				outputPreview: extractOutputPreview(event.phase, eventOutputPreview),
				outputTruncated: eventOutputTruncated || undefined,
				outputBytes: eventOutputBytes,
				suppressedRawOutput: eventSuppressedRawOutput || undefined,
				errorText:
					event.phase === "error"
						? event.errorText ??
							(typeof eventOutputPreview === "string"
								? eventOutputPreview
								: undefined)
						: undefined,
				timestamp,
				mcpServer: typeof event.mcpServer === "string" && event.mcpServer.trim() ? event.mcpServer.trim() : undefined,
				permissionScenario: typeof event.permissionScenario === "string" && event.permissionScenario.trim() ? event.permissionScenario.trim() : undefined,
			});
			summaryIndexByKey.set(key, summaries.length - 1);
			continue;
		}

		const summary = summaries[summaryIndex];
		summary.toolName = toolName;
		summary.toolCallId = toolCallId;
		if (timestamp) {
			summary.timestamp = timestamp;
		}
		if (typeof event.mcpServer === "string" && event.mcpServer.trim()) {
			summary.mcpServer = event.mcpServer.trim();
		}
		if (typeof event.permissionScenario === "string" && event.permissionScenario.trim()) {
			summary.permissionScenario = event.permissionScenario.trim();
		}
		if (event.phase === "start") {
			if (summary.state !== "completed" && summary.state !== "error") {
				summary.state = thinkingPhaseToState(event.phase, {
					permissionScenario: event.permissionScenario,
				});
			}
			if (event.input !== undefined) {
				summary.input = event.input;
			}
			continue;
		}
		if (event.phase === "result") {
			summary.state = "completed";
			summary.errorText = undefined;
			if (eventOutput !== undefined) {
				summary.output = eventOutput;
			}
			if (typeof eventOutputPreview === "string") {
				summary.outputPreview = eventOutputPreview;
			}
			if (eventOutputTruncated) {
				summary.outputTruncated = true;
			}
			if (eventOutputBytes !== undefined) {
				summary.outputBytes = eventOutputBytes;
			}
			if (eventSuppressedRawOutput) {
				summary.suppressedRawOutput = true;
			}
			continue;
		}
		summary.state = "error";
		if (eventOutput !== undefined) {
			summary.output = eventOutput;
		}
		if (typeof eventOutputPreview === "string") {
			summary.outputPreview = eventOutputPreview;
		}
		if (eventOutputTruncated) {
			summary.outputTruncated = true;
		}
		if (eventOutputBytes !== undefined) {
			summary.outputBytes = eventOutputBytes;
		}
		if (eventSuppressedRawOutput) {
			summary.suppressedRawOutput = true;
		}
		summary.errorText =
			event.errorText ??
			(typeof eventOutputPreview === "string"
				? eventOutputPreview
				: summary.errorText);
	}

	if (hasTurnCompleteSignal(message)) {
		const agentExecutionUpdates = getAgentExecutionUpdates(message);
		for (const summary of summaries) {
			if (
				summary.state !== "running" &&
				summary.state !== "approval-requested"
			) {
				continue;
			}

			const isRequestUserInput = isRequestUserInputToolName(summary.toolName);
			summary.state = isRequestUserInput ? "awaiting-input" : "completed";
			if (summary.output !== undefined || summary.outputPreview || summary.errorText) {
				continue;
			}

			const hasSubagentExecution =
				summary.toolName === "invoke_subagents" &&
				agentExecutionUpdates.some((update) => update.taskId.trim().length > 0);
			const completionNote = isRequestUserInput
				? "Awaiting your answers in the question card."
				: hasSubagentExecution
					? "Subagent exploration completed, but the parent tool did not emit a final result event."
					: "Tool finished without an explicit result event.";
			summary.output = completionNote;
			summary.outputPreview = completionNote;
		}
	}

	return summaries;
}

export function getAgentExecutionUpdates(
	message: Pick<RovoUIMessage, "parts">
): AgentExecutionUpdate[] {
	return getAllDataParts(message, "data-agent-execution")
		.map((part) => part.data)
		.filter(
			(update): update is AgentExecutionUpdate =>
				typeof update?.agentId === "string" &&
				update.agentId.trim().length > 0 &&
				typeof update?.taskId === "string" &&
				update.taskId.trim().length > 0
		);
}

export function getAgentExecutionSummaries(
	message: Pick<RovoUIMessage, "parts">
): AgentExecutionSummary[] {
	const updates = getAgentExecutionUpdates(message);
	if (updates.length === 0) {
		return [];
	}

	const summaries: AgentExecutionSummary[] = [];
	const summaryIndexByTaskId = new Map<string, number>();

	for (const update of updates) {
		const summaryIndex = summaryIndexByTaskId.get(update.taskId);
		if (summaryIndex === undefined) {
			summaries.push({
				agentId: update.agentId,
				agentName: update.agentName,
				taskId: update.taskId,
				taskLabel: update.taskLabel,
				status: update.status,
				content: update.content ?? "",
			});
			summaryIndexByTaskId.set(update.taskId, summaries.length - 1);
			continue;
		}

		const summary = summaries[summaryIndex];
		summary.agentId = update.agentId;
		summary.agentName = update.agentName;
		summary.taskId = update.taskId;
		summary.taskLabel = update.taskLabel;
		summary.status = update.status;
		if (update.content) {
			summary.content = `${summary.content}${update.content}`;
		}
	}

	return summaries;
}

export function getLatestTodoQueue(
	message: Pick<RovoUIMessage, "parts">
): RovoDataParts["todo-queue"] | null {
	return getLatestDataPart(message, "data-todo-queue")?.data ?? null;
}

function normalizeToolApprovalItem(value: unknown): ToolApprovalItem | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Partial<ToolApprovalItem>;
	if (
		typeof candidate.id !== "string" ||
		candidate.id.trim().length === 0 ||
		typeof candidate.toolCallId !== "string" ||
		candidate.toolCallId.trim().length === 0 ||
		typeof candidate.toolName !== "string" ||
		candidate.toolName.trim().length === 0 ||
		typeof candidate.title !== "string" ||
		candidate.title.trim().length === 0 ||
		typeof candidate.description !== "string" ||
		candidate.description.trim().length === 0
	) {
		return null;
	}

	return {
		id: candidate.id.trim(),
		toolCallId: candidate.toolCallId.trim(),
		toolName: candidate.toolName.trim(),
		title: candidate.title.trim(),
		description: candidate.description.trim(),
		targetPath:
			typeof candidate.targetPath === "string" && candidate.targetPath.trim()
				? candidate.targetPath.trim()
				: undefined,
		commandPreview:
			typeof candidate.commandPreview === "string" && candidate.commandPreview.trim()
				? candidate.commandPreview.trim()
				: undefined,
		riskLevel:
			candidate.riskLevel === "low" ||
			candidate.riskLevel === "medium" ||
			candidate.riskLevel === "high"
				? candidate.riskLevel
				: undefined,
		permissionScenario:
			typeof candidate.permissionScenario === "string" && candidate.permissionScenario.trim()
				? candidate.permissionScenario.trim()
				: undefined,
	};
}

function normalizeToolApprovalPayload(value: unknown): ToolApprovalPayload | null {
	if (!value || typeof value !== "object") {
		return null;
	}

	const candidate = value as Partial<ToolApprovalPayload>;
	if (
		typeof candidate.approvalId !== "string" ||
		candidate.approvalId.trim().length === 0 ||
		!Array.isArray(candidate.items)
	) {
		return null;
	}

	const items = candidate.items
		.map((item) => normalizeToolApprovalItem(item))
		.filter((item): item is ToolApprovalItem => item !== null);
	if (items.length === 0) {
		return null;
	}

	return {
		approvalId: candidate.approvalId.trim(),
		threadId:
			typeof candidate.threadId === "string" && candidate.threadId.trim()
				? candidate.threadId.trim()
				: undefined,
		createdAt:
			typeof candidate.createdAt === "string" && candidate.createdAt.trim()
				? candidate.createdAt.trim()
				: undefined,
		items,
	};
}

export function getLatestToolApproval(
	message: Pick<RovoUIMessage, "parts">
): ToolApprovalPayload | null {
	return normalizeToolApprovalPayload(
		getLatestDataPart(message, "data-tool-approval")?.data ?? null,
	);
}

export function getLatestPendingToolApproval(
	messages: ReadonlyArray<RovoUIMessage>,
): ToolApprovalPayload | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!message || !Array.isArray(message.parts)) {
			continue;
		}

		if (
			message.role === "user" &&
			message.metadata?.source === "tool-approval-submit"
		) {
			return null;
		}

		if (message.role !== "assistant") {
			continue;
		}

		const approval = getLatestToolApproval(message);
		if (approval) {
			return approval;
		}
	}

	return null;
}

export function getToolPartName(toolPart: RovoToolPart): string {
	return getToolName(toolPart);
}

function hasCreatePlanSignal(value: unknown): boolean {
	if (typeof value !== "string") {
		return false;
	}

	return CREATE_PLAN_SIGNAL_REGEX.test(value);
}

export function hasCreatePlanSkillSignal(
	message: Pick<RovoUIMessage, "parts">
): boolean {
	if (hasCreatePlanSignal(getMessageText(message))) {
		return true;
	}

	const thinkingStatusParts = getAllDataParts(message, "data-thinking-status");
	for (const part of thinkingStatusParts) {
		if (
			hasCreatePlanSignal(part.data.label) ||
			hasCreatePlanSignal(part.data.content)
		) {
			return true;
		}
	}

	const toolParts = getMessageToolParts(message);
	for (const toolPart of toolParts) {
		if (hasCreatePlanSignal(getToolPartName(toolPart))) {
			return true;
		}
	}

	return false;
}
