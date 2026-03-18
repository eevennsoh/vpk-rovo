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

export type ThinkingToolState = "running" | "completed" | "error";

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
	kind: "text" | "code" | "image" | "sheet";
	"artifact-result": {
		documentId: string;
		title: string;
		kind: "text" | "code" | "image" | "sheet";
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
		message: string;
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
	};
	"thinking-event": ThinkingEventUpdate;
	"tool-first-warning": ToolFirstWarningData;
	"agent-execution": AgentExecutionUpdate;
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
		| "agent-directive"
		| "plan-retry";
	/** Internal provenance for unified voice/chat routing */
	origin?: "realtime" | "rovodev";
	/** Stable timestamps for merging persisted realtime + RovoDev threads */
	createdAt?: string;
	updatedAt?: string;
	/** OpenAI Realtime-side identifier for correlating client/server events */
	realtimeMessageId?: string;
	/** Existing user message reused when GPT-Realtime delegates to RovoDev */
	delegatedFromId?: string;
	planApprovalDecision?: "auto-accept" | "continue-planning" | "custom";
	planApprovalPlanKey?: string;
	/** Short label shown in the user bubble instead of the full prompt text */
	displayLabel?: string;
	/** Structured clarification rows shown in the specialized user summary bubble */
	clarificationSummary?: Array<{
		question: string;
		answer: string;
	}>;
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

function isRequestUserInputToolName(toolName: unknown): boolean {
	if (typeof toolName !== "string") {
		return false;
	}

	const normalizedToolName = toolName.trim();
	if (!normalizedToolName) {
		return false;
	}

	return REQUEST_USER_INPUT_TOOL_NAME_REGEX.test(normalizedToolName);
}

function thinkingPhaseToState(phase: ThinkingEventPhase): ThinkingToolState {
	if (phase === "error") return "error";
	if (phase === "result") return "completed";
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
		const eventOutputPreview =
			typeof event.outputPreview === "string"
				? event.outputPreview
				: event.output;
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
				state: thinkingPhaseToState(event.phase),
				input: event.input,
				output: event.phase === "result" ? eventOutputPreview : undefined,
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
				summary.state = "running";
			}
			if (event.input !== undefined) {
				summary.input = event.input;
			}
			continue;
		}
		if (event.phase === "result") {
			summary.state = "completed";
			summary.errorText = undefined;
			if (eventOutputPreview !== undefined) {
				summary.output = eventOutputPreview;
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
		for (const summary of summaries) {
			if (summary.state !== "running") {
				continue;
			}

			summary.state = "completed";
			if (summary.output !== undefined || summary.outputPreview || summary.errorText) {
				continue;
			}

			const completionNote = isRequestUserInputToolName(summary.toolName)
				? "Awaiting your answers in the question card."
				: "Tool finished without an explicit result event.";
			summary.output = completionNote;
			summary.outputPreview = completionNote;
		}
	}

	return summaries;
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
