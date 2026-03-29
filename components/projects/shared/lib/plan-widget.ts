import { API_ENDPOINTS } from "@/lib/api-config";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { PlanApprovalState } from "@/components/projects/shared/lib/plan-approval";
import { resolvePlanDisplayTitle } from "@/components/projects/shared/lib/plan-identity";

interface StringRecord {
	[key: string]: unknown;
}

export interface ParsedPlanTask {
	id: string;
	label: string;
	blockedBy: string[];
	agent?: string;
}

export interface ParsedPlanWidgetPayload {
	title: string;
	description?: string;
	markdown: string;
	emoji?: string;
	tasks: ParsedPlanTask[];
	agents: string[];
	toolCallId?: string;
	deferredToolCallId?: string;
}

export interface PlanMermaidGraph {
	markdown: string;
	usesInferredLinearEdges: boolean;
	hasExplicitEdges: boolean;
}

export interface PendingPlanWidget {
	planWidget: ParsedPlanWidgetPayload;
	sourceMessageId: string;
}

export interface DeferredToolResponsePayload {
	tool_call_id: string;
	result: string;
}

const MERMAID_BLOCK_REGEX = /```mermaid\b[\s\S]*?```/gi;
const MERMAID_EDGE_REGEX =
	/\b[A-Za-z0-9_-]+\s*(?:-->|==>|-.->)\s*(?:\|[^|\n]+\|\s*)?[A-Za-z0-9_-]+\b/;

function createMermaidBlockRegex(): RegExp {
	return new RegExp(MERMAID_BLOCK_REGEX.source, MERMAID_BLOCK_REGEX.flags);
}

function isStringRecord(value: unknown): value is StringRecord {
	return typeof value === "object" && value !== null;
}

function getNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

function isMessageVisibleInTranscript(message: Pick<RovoUIMessage, "metadata">): boolean {
	return message.metadata?.visibility !== "hidden";
}

function getLatestPlanWidgetPart(message: Pick<RovoUIMessage, "parts">): {
	type?: unknown;
	payload?: unknown;
} | null {
	for (let index = message.parts.length - 1; index >= 0; index -= 1) {
		const part = message.parts[index] as {
			type?: string;
			data?: {
				type?: unknown;
				payload?: unknown;
			};
		};
		if (part?.type !== "data-widget-data" || !part.data) {
			continue;
		}

		if (getNonEmptyString(part.data.type) !== "plan") {
			continue;
		}

		return part.data;
	}

	return null;
}

function sanitizeMermaidNodeId(value: string): string {
	const normalizedValue = value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
	if (!normalizedValue) {
		return "task";
	}

	return /^[a-z_]/.test(normalizedValue)
		? normalizedValue
		: `task_${normalizedValue}`;
}

function createUniqueMermaidNodeId(
	baseId: string,
	usedNodeIds: Set<string>
): string {
	if (!usedNodeIds.has(baseId)) {
		usedNodeIds.add(baseId);
		return baseId;
	}

	let duplicateIndex = 2;
	let candidateId = `${baseId}_${duplicateIndex}`;
	while (usedNodeIds.has(candidateId)) {
		duplicateIndex += 1;
		candidateId = `${baseId}_${duplicateIndex}`;
	}

	usedNodeIds.add(candidateId);
	return candidateId;
}

function escapeMermaidLabel(value: string): string {
	return value.replace(/#/g, "#35;").replace(/"/g, "#quot;");
}

function parseTaskItem(
	taskItem: unknown,
	fallbackId: string
): ParsedPlanTask | null {
	if (typeof taskItem === "string") {
		const label = getNonEmptyString(taskItem);
		if (!label) return null;
		return { id: fallbackId, label, blockedBy: [] };
	}

	if (!isStringRecord(taskItem)) {
		return null;
	}

	const label =
		getNonEmptyString(taskItem.label) ??
		getNonEmptyString(taskItem.title) ??
		getNonEmptyString(taskItem.task) ??
		getNonEmptyString(taskItem.text);
	if (!label) return null;

	const id = getNonEmptyString(taskItem.id) ?? fallbackId;
	const blockedBy = Array.isArray(taskItem.blockedBy)
		? (taskItem.blockedBy.filter(
				(item) => typeof item === "string" && item.trim().length > 0
			) as string[])
		: [];
	const agent = getNonEmptyString(taskItem.agent) ?? undefined;

	return { id, label, blockedBy, agent };
}

export function parsePlanWidgetPayload(
	value: unknown
): ParsedPlanWidgetPayload | null {
	if (!isStringRecord(value)) {
		return null;
	}

	const record = isStringRecord(value.payload) ? value.payload : value;
	const taskCandidates = Array.isArray(record.tasks)
		? record.tasks
		: Array.isArray(record.steps)
			? record.steps
			: null;

	if (!taskCandidates) {
		return null;
	}

	const tasks = taskCandidates
		.map((task, index) => parseTaskItem(task, `task-${index + 1}`))
		.filter((task): task is ParsedPlanTask => task !== null);
	if (tasks.length === 0) {
		return null;
	}
	const title = resolvePlanDisplayTitle(
		getNonEmptyString(record.title) ??
			getNonEmptyString(record.name) ??
			getNonEmptyString(record.planTitle) ??
			undefined,
		tasks
	);

	const description =
		getNonEmptyString(record.description) ??
		getNonEmptyString(record.summary) ??
		getNonEmptyString(record.subtitle) ??
		undefined;
	const markdown =
		getNonEmptyString(record.markdown) ??
		getNonEmptyString(record.plan) ??
		description ??
		"";
	const emoji = getNonEmptyString(record.emoji) ?? undefined;

	const agentSet = new Set<string>();
	for (const task of tasks) {
		if (task.agent) {
			agentSet.add(task.agent);
		}
	}
	const agents = Array.from(agentSet).sort();

	const deferredToolCallId =
		getNonEmptyString(record.deferredToolCallId) ??
		getNonEmptyString(record.tool_call_id) ??
		undefined;

	return {
		title,
		description,
		markdown,
		emoji,
		tasks,
		agents,
		toolCallId: getNonEmptyString(record.tool_call_id) ?? undefined,
		deferredToolCallId,
	};
}

export function extractMermaidBlocksFromText(value: string): string[] {
	if (!value.trim()) {
		return [];
	}

	return Array.from(value.matchAll(createMermaidBlockRegex()), (match) =>
		match[0].trim()
	);
}

export function stripMermaidBlocksFromText(value: string): string {
	if (!value.trim()) {
		return "";
	}

	return value.replace(createMermaidBlockRegex(), "").trim();
}

export function hasDependencyEdgesInMermaid(value: string): boolean {
	const mermaidBlocks = extractMermaidBlocksFromText(value);
	if (mermaidBlocks.length === 0) {
		return false;
	}

	return mermaidBlocks.some((block) => MERMAID_EDGE_REGEX.test(block));
}

export function generateMermaidFromPlanTasks(
	tasks: ReadonlyArray<ParsedPlanTask>
): PlanMermaidGraph {
	if (!Array.isArray(tasks) || tasks.length === 0) {
		return {
			markdown: "",
			usesInferredLinearEdges: false,
			hasExplicitEdges: false,
		};
	}

	const usedNodeIds = new Set<string>();
	const taskIdToNodeId = new Map<string, string>();
	const nodeEntries = tasks.map((task, index) => {
		const taskId = getNonEmptyString(task.id) ?? `task-${index + 1}`;
		const nodeId = createUniqueMermaidNodeId(
			sanitizeMermaidNodeId(taskId),
			usedNodeIds
		);
		if (!taskIdToNodeId.has(taskId)) {
			taskIdToNodeId.set(taskId, nodeId);
		}

		return {
			nodeId,
			label: getNonEmptyString(task.label) ?? `Task ${index + 1}`,
			blockedBy: Array.isArray(task.blockedBy) ? task.blockedBy : [],
		};
	});

	const edgeLines: string[] = [];
	const seenEdges = new Set<string>();
	for (const node of nodeEntries) {
		for (const blockedByTaskId of node.blockedBy) {
			const dependencyTaskId = getNonEmptyString(blockedByTaskId);
			if (!dependencyTaskId) {
				continue;
			}

			const fromNodeId = taskIdToNodeId.get(dependencyTaskId);
			if (!fromNodeId) {
				continue;
			}

			const edgeKey = `${fromNodeId}->${node.nodeId}`;
			if (seenEdges.has(edgeKey)) {
				continue;
			}

			seenEdges.add(edgeKey);
			edgeLines.push(`  ${fromNodeId} --> ${node.nodeId}`);
		}
	}

	const hasExplicitEdges = edgeLines.length > 0;
	let usesInferredLinearEdges = false;
	if (!hasExplicitEdges && nodeEntries.length > 1) {
		usesInferredLinearEdges = true;
		for (let index = 1; index < nodeEntries.length; index += 1) {
			const fromNodeId = nodeEntries[index - 1].nodeId;
			const toNodeId = nodeEntries[index].nodeId;
			const edgeKey = `${fromNodeId}->${toNodeId}`;
			if (seenEdges.has(edgeKey)) {
				continue;
			}

			seenEdges.add(edgeKey);
			edgeLines.push(`  ${fromNodeId} --> ${toNodeId}`);
		}
	}

	const markdown = [
		"```mermaid",
		"graph TD",
		...nodeEntries.map(
			(node) => `  ${node.nodeId}["${escapeMermaidLabel(node.label)}"]`
		),
		...edgeLines,
		"```",
		"",
	].join("\n");

	return {
		markdown,
		usesInferredLinearEdges,
		hasExplicitEdges,
	};
}

export function getAllPlanWidgetPayloads(
	messages: ReadonlyArray<RovoUIMessage>
): ParsedPlanWidgetPayload[] {
	const results: ParsedPlanWidgetPayload[] = [];

	for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
		const message = messages[messageIndex];
		if (message.role !== "assistant") {
			continue;
		}

		for (let partIndex = 0; partIndex < message.parts.length; partIndex++) {
			const part = message.parts[partIndex] as {
				type?: string;
				data?: {
					type?: unknown;
					payload?: unknown;
				};
			};

			if (part.type !== "data-widget-data") {
				continue;
			}

			if (getNonEmptyString(part.data?.type) !== "plan") {
				continue;
			}

			const parsedPayload = parsePlanWidgetPayload(part.data?.payload);
			if (parsedPayload) {
				results.push(parsedPayload);
			}
		}
	}

	return results;
}

export function getLatestPlanWidgetPayload(
	messages: ReadonlyArray<RovoUIMessage>
): ParsedPlanWidgetPayload | null {
	const allPlans = getAllPlanWidgetPayloads(messages);
	return allPlans.length > 0 ? allPlans[allPlans.length - 1] : null;
}

export function getLatestPendingPlanWidget(
	messages: ReadonlyArray<RovoUIMessage>
): PendingPlanWidget | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!isMessageVisibleInTranscript(message)) {
			continue;
		}

		if (message.role === "user") {
			return null;
		}

		if (message.role !== "assistant") {
			continue;
		}

		const widgetPart = getLatestPlanWidgetPart(message);
		if (!widgetPart) {
			continue;
		}

		const parsedPlanWidget = parsePlanWidgetPayload(widgetPart.payload);
		if (!parsedPlanWidget?.deferredToolCallId) {
			continue;
		}

		return {
			planWidget: parsedPlanWidget,
			sourceMessageId: message.id,
		};
	}

	return null;
}

export function buildExitPlanModeDeferredToolResponse(
	planWidget: ParsedPlanWidgetPayload | null,
	result: string,
): DeferredToolResponsePayload | null {
	const toolCallId = getNonEmptyString(planWidget?.deferredToolCallId ?? planWidget?.toolCallId);
	const normalizedResult = getNonEmptyString(result);
	if (!toolCallId || !normalizedResult) {
		return null;
	}

	return {
		tool_call_id: toolCallId,
		result: normalizedResult,
	};
}

export interface PlanBuildableResult {
	buildable: boolean;
	reason?: string;
}

export function isPlanCardBuildable(
	planPayload: ParsedPlanWidgetPayload,
	allPlanPayloads: ReadonlyArray<ParsedPlanWidgetPayload>,
	approvalState: PlanApprovalState | null,
): PlanBuildableResult {
	if (approvalState?.status === "pending") {
		return { buildable: false, reason: "Plan execution is already in progress." };
	}

	if (approvalState?.status === "accepted") {
		return { buildable: false, reason: "A plan has already been accepted." };
	}

	if (allPlanPayloads.length === 0) {
		return { buildable: false, reason: "No plans available." };
	}

	const latestPlan = allPlanPayloads[allPlanPayloads.length - 1];
	const isLatest =
		planPayload.title === latestPlan.title &&
		planPayload.tasks.length === latestPlan.tasks.length &&
		planPayload.tasks.every((task, index) => task.id === latestPlan.tasks[index]?.id);

	if (!isLatest) {
		return { buildable: false, reason: "A newer plan is available." };
	}

	return { buildable: true };
}

export async function fetchEnrichedPlanTitle(
	plan: ParsedPlanWidgetPayload,
): Promise<{ title: string; description: string } | null> {
	try {
		const response = await fetch(API_ENDPOINTS.PLAN_TITLE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: plan.title,
				description: plan.description,
				tasks: plan.tasks.map((t) => t.label),
			}),
		});
		if (!response.ok) return null;
		const data = (await response.json()) as { title?: string; description?: string };
		const title = data.title?.trim();
		const description = data.description?.trim();
		if (!title) return null;
		return { title, description: description ?? "" };
	} catch {
		return null;
	}
}
