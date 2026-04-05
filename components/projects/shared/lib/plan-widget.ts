import { API_ENDPOINTS } from "@/lib/api-config";
import { isMessageVisibleInTranscript, type RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { VisualIdentity } from "@/components/projects/shared/lib/visual-identity";
import { normalizeVisualIdentity } from "@/components/projects/shared/lib/visual-identity";
import { toNonEmptyString } from "@/lib/utils";
import type { PlanApprovalState } from "@/components/projects/shared/lib/plan-approval";
import { resolvePlanVisualIdentity } from "@/components/projects/shared/lib/plan-identity";

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
	shortDescription?: string;
	markdown: string;
	visualIdentity?: VisualIdentity;
	tasks: ParsedPlanTask[];
	agents: string[];
	toolCallId?: string;
	deferredToolCallId?: string;
}

export interface SourcedPlanWidget {
	planWidget: ParsedPlanWidgetPayload;
	sourceMessageId: string;
}

export interface PendingPlanWidget {
	planWidget: ParsedPlanWidgetPayload;
	sourceMessageId: string;
}

export interface EnrichedPlanMetadata {
	title: string;
	shortDescription: string;
}

export interface DeferredToolResponsePayload {
	tool_call_id: string;
	result: string;
}

function isStringRecord(value: unknown): value is StringRecord {
	return typeof value === "object" && value !== null;
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

		if (toNonEmptyString(part.data.type) !== "plan") {
			continue;
		}

		return part.data;
	}

	return null;
}

function parseTaskItem(
	taskItem: unknown,
	fallbackId: string
): ParsedPlanTask | null {
	if (typeof taskItem === "string") {
		const label = toNonEmptyString(taskItem);
		if (!label) return null;
		return { id: fallbackId, label, blockedBy: [] };
	}

	if (!isStringRecord(taskItem)) {
		return null;
	}

	const label =
		toNonEmptyString(taskItem.label) ??
		toNonEmptyString(taskItem.title) ??
		toNonEmptyString(taskItem.task) ??
		toNonEmptyString(taskItem.text);
	if (!label) return null;

	const id = toNonEmptyString(taskItem.id) ?? fallbackId;
	const blockedBy = Array.isArray(taskItem.blockedBy)
		? (taskItem.blockedBy.filter(
				(item) => typeof item === "string" && item.trim().length > 0
			) as string[])
		: [];
	const agent = toNonEmptyString(taskItem.agent) ?? undefined;

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
			: [];

	const tasks = taskCandidates
		.map((task, index) => parseTaskItem(task, `task-${index + 1}`))
		.filter((task): task is ParsedPlanTask => task !== null);

	const title =
		toNonEmptyString(record.title) ??
		toNonEmptyString(record.name) ??
		toNonEmptyString(record.planTitle) ??
		"Plan";

	const description =
		toNonEmptyString(record.description) ??
		toNonEmptyString(record.summary) ??
		toNonEmptyString(record.subtitle) ??
		undefined;
	const shortDescription =
		toNonEmptyString(record.shortDescription) ??
		toNonEmptyString(record.short_description) ??
		undefined;
	const markdown =
		toNonEmptyString(record.markdown) ??
		toNonEmptyString(record.plan) ??
		description ??
		"";

	if (!markdown && tasks.length === 0) {
		return null;
	}

	const visualIdentity =
		normalizeVisualIdentity(record.visualIdentity) ??
		resolvePlanVisualIdentity(title);

	const agentSet = new Set<string>();
	for (const task of tasks) {
		if (task.agent) {
			agentSet.add(task.agent);
		}
	}
	const agents = Array.from(agentSet).sort();

	const deferredToolCallId =
		toNonEmptyString(record.deferredToolCallId) ??
		toNonEmptyString(record.tool_call_id) ??
		undefined;

	return {
		title,
		description,
		shortDescription,
		markdown,
		visualIdentity,
		tasks,
		agents,
		toolCallId: toNonEmptyString(record.tool_call_id) ?? undefined,
		deferredToolCallId,
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

			if (toNonEmptyString(part.data?.type) !== "plan") {
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
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "assistant") {
			continue;
		}

		const widgetPart = getLatestPlanWidgetPart(message);
		if (!widgetPart) {
			continue;
		}

		const parsed = parsePlanWidgetPayload(widgetPart.payload);
		if (parsed) {
			return parsed;
		}
	}

	return null;
}

export function getLatestSourcedPlanWidget(
	messages: ReadonlyArray<RovoUIMessage>
): SourcedPlanWidget | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!isMessageVisibleInTranscript(message) || message.role !== "assistant") {
			continue;
		}

		const widgetPart = getLatestPlanWidgetPart(message);
		if (!widgetPart) {
			continue;
		}

		const parsedPlanWidget = parsePlanWidgetPayload(widgetPart.payload);
		if (!parsedPlanWidget) {
			continue;
		}

		return {
			planWidget: parsedPlanWidget,
			sourceMessageId: message.id,
		};
	}

	return null;
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
	const toolCallId = toNonEmptyString(planWidget?.deferredToolCallId ?? planWidget?.toolCallId);
	const normalizedResult = toNonEmptyString(result);
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
		(planPayload.deferredToolCallId && latestPlan.deferredToolCallId)
			? planPayload.deferredToolCallId === latestPlan.deferredToolCallId
			: planPayload.title === latestPlan.title &&
				planPayload.markdown === latestPlan.markdown;

	if (!isLatest) {
		return { buildable: false, reason: "A newer plan is available." };
	}

	return { buildable: true };
}

export async function fetchEnrichedPlanTitle(
	plan: ParsedPlanWidgetPayload,
): Promise<EnrichedPlanMetadata | null> {
	try {
		const response = await fetch(API_ENDPOINTS.PLAN_TITLE, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				title: plan.title,
				description: plan.description,
				markdown: plan.markdown,
				tasks: plan.tasks.map((t) => t.label),
			}),
		});
		if (!response.ok) return null;
		const data = (await response.json()) as {
			title?: string;
			shortDescription?: string;
			description?: string;
		};
		const title = data.title?.trim();
		const shortDescription = data.shortDescription?.trim() || data.description?.trim();
		if (!title) return null;
		return { title, shortDescription: shortDescription ?? "" };
	} catch {
		return null;
	}
}

export function updatePlanWidgetMetadataInMessages(
	messages: ReadonlyArray<RovoUIMessage>,
	options: Readonly<{
		sourceMessageId?: string | null;
		title?: string;
		shortDescription?: string;
	}>
): RovoUIMessage[] {
	const normalizedTitle = toNonEmptyString(options.title);
	const normalizedShortDescription = toNonEmptyString(options.shortDescription);
	if (!normalizedTitle && !normalizedShortDescription) {
		return messages as RovoUIMessage[];
	}

	const targetMessageIndex =
		typeof options.sourceMessageId === "string" && options.sourceMessageId.trim().length > 0
			? messages.findIndex((message) => message.id === options.sourceMessageId)
			: (() => {
					for (let index = messages.length - 1; index >= 0; index -= 1) {
						const message = messages[index];
						if (!isMessageVisibleInTranscript(message) || message.role !== "assistant") {
							continue;
						}

						if (getLatestPlanWidgetPart(message)) {
							return index;
						}
					}
					return -1;
				})();
	if (targetMessageIndex === -1) {
		return messages as RovoUIMessage[];
	}

	let didUpdate = false;
	const nextMessages = messages.map((message, messageIndex) => {
		if (messageIndex !== targetMessageIndex) {
			return message;
		}

		const nextParts = [...message.parts];
		for (let partIndex = nextParts.length - 1; partIndex >= 0; partIndex -= 1) {
			const part = nextParts[partIndex] as {
				type?: string;
				data?: {
					type?: unknown;
					payload?: unknown;
				};
			};
			if (part.type !== "data-widget-data" || toNonEmptyString(part.data?.type) !== "plan") {
				continue;
			}

			if (!isStringRecord(part.data?.payload)) {
				break;
			}

			const payload = part.data.payload;
			const nextPayload = { ...payload };
			let didUpdatePayload = false;

			if (normalizedTitle && normalizedTitle !== toNonEmptyString(payload.title)) {
				nextPayload.title = normalizedTitle;
				nextPayload.visualIdentity = resolvePlanVisualIdentity(normalizedTitle);
				didUpdatePayload = true;
			}

			if (
				normalizedShortDescription &&
				normalizedShortDescription !== toNonEmptyString(payload.shortDescription)
			) {
				nextPayload.shortDescription = normalizedShortDescription;
				didUpdatePayload = true;
			}

			if (!didUpdatePayload) {
				break;
			}

			nextParts[partIndex] = {
				...part,
				data: {
					...part.data,
					payload: nextPayload,
				},
			} as (typeof nextParts)[number];
			didUpdate = true;
			break;
		}

		return didUpdate ? { ...message, parts: nextParts } : message;
	});

	return didUpdate ? nextMessages : messages as RovoUIMessage[];
}
