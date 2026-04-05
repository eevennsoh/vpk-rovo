import type { FutureChatActiveRun } from "@/lib/future-chat-types";
import type { VisualIdentity } from "@/components/projects/shared/lib/visual-identity";
import {
	getAllDataParts,
	getMessageArtifactResult,
	isMessageVisibleInTranscript,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { resolvePlanVisualIdentity } from "@/components/projects/shared/lib/plan-identity";
import {
	getPlanApprovalKeyFromPlanWidget,
	getPlanApprovalState,
} from "@/components/projects/shared/lib/plan-approval";
import {
	getAllPlanWidgetPayloads,
	type ParsedPlanTask,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import type { FutureChatTodoProgressItem } from "@/components/projects/future-chat/lib/future-chat-update-todo-progress";
import {
	futureChatPlanTaskIdsMatch,
	getLatestFutureChatTodoProgressFromMessages,
} from "@/components/projects/future-chat/lib/future-chat-plan-task-labels";
import { toNonEmptyString } from "@/lib/utils";

export interface FutureChatPlanExecutionProgressTask {
	id: string;
	label: string;
	description: string;
	agentName?: string;
}

export interface FutureChatPlanExecutionStatusGroups {
	done: FutureChatPlanExecutionProgressTask[];
	inReview: FutureChatPlanExecutionProgressTask[];
	inProgress: FutureChatPlanExecutionProgressTask[];
	failed: FutureChatPlanExecutionProgressTask[];
	todo: FutureChatPlanExecutionProgressTask[];
}

export interface FutureChatPlanExecutionTrackerViewModel {
	planKey: string;
	planTitle: string;
	planVisualIdentity: VisualIdentity;
	runStatus: "running" | "completed" | "failed";
	runCreatedAt: string | null;
	runCompletedAt: string | null;
	agentCount: number;
	taskCount: number;
	taskStatusGroups: FutureChatPlanExecutionStatusGroups;
}

const EMPTY_STATUS_GROUPS: FutureChatPlanExecutionStatusGroups = {
	done: [],
	inReview: [],
	inProgress: [],
	failed: [],
	todo: [],
};

function isVisibleUserMessage(message: RovoUIMessage): boolean {
	return message.role === "user" && isMessageVisibleInTranscript(message);
}

function findAcceptedPlanApprovalIndex(
	messages: ReadonlyArray<RovoUIMessage>,
	planKey: string,
): number {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "user") {
			continue;
		}
		if (message.metadata?.source !== "plan-approval-submit") {
			continue;
		}
		if (message.metadata?.planApprovalDecision !== "auto-accept") {
			continue;
		}
		if (message.metadata?.planApprovalPlanKey !== planKey) {
			continue;
		}

		return index;
	}

	return -1;
}

function findAcceptedPlanWidget(
	messages: ReadonlyArray<RovoUIMessage>,
	planKey: string,
): ParsedPlanWidgetPayload | null {
	const planWidgets = getAllPlanWidgetPayloads(messages);
	for (let index = planWidgets.length - 1; index >= 0; index -= 1) {
		const planWidget = planWidgets[index];
		if (getPlanApprovalKeyFromPlanWidget(planWidget) === planKey) {
			return planWidget;
		}
	}

	return null;
}

function hasArtifactResultInMessages(
	messages: ReadonlyArray<RovoUIMessage>,
): boolean {
	return messages.some((message) => getMessageArtifactResult(message) !== null);
}

function resolveExecutionWindowMessages(
	messages: ReadonlyArray<RovoUIMessage>,
	approvalIndex: number,
): ReadonlyArray<RovoUIMessage> {
	const executionMessages: RovoUIMessage[] = [];
	for (let index = approvalIndex + 1; index < messages.length; index += 1) {
		const message = messages[index];
		if (isVisibleUserMessage(message)) {
			break;
		}

		executionMessages.push(message);
	}

	return executionMessages;
}

function formatBlockedByTaskId(taskId: string): string {
	const numericId = extractNumericTaskId(taskId);
	return numericId !== null ? `#${numericId}` : taskId;
}

function buildBlockedByDescription(blockedBy: ReadonlyArray<string>): string {
	if (blockedBy.length === 0) {
		return "Ready to start";
	}

	return `Blocked by ${blockedBy.map(formatBlockedByTaskId).join(", ")}`;
}

function buildPlanTaskRecord(task: ParsedPlanTask): FutureChatTodoProgressItem {
	return {
		id: task.id,
		content: task.label,
		label: task.label,
		status: "pending",
		blockedBy: [...task.blockedBy],
	};
}

function mergeTodoItemsWithPlanTasks(
	planTasks: ReadonlyArray<ParsedPlanTask>,
	snapshot: ReturnType<typeof getLatestFutureChatTodoProgressFromMessages>,
): Array<FutureChatTodoProgressItem & { agentName?: string }> {
	const snapshotItems = snapshot?.items ?? [];

	// When planTasks is empty (new plans no longer pre-seed tasks),
	// return snapshot items directly — no merge needed.
	if (planTasks.length === 0) {
		return snapshotItems.map((item) => ({ ...item }));
	}

	const mergedItems: Array<FutureChatTodoProgressItem & { agentName?: string }> = [];
	const matchedSnapshotIds = new Set<string>();

	for (const planTask of planTasks) {
		const snapshotItem =
			snapshotItems.find((item) =>
				!matchedSnapshotIds.has(item.id) &&
				futureChatPlanTaskIdsMatch(planTask.id, item.id)
			) ?? null;
		if (snapshotItem) {
			matchedSnapshotIds.add(snapshotItem.id);
		}

		mergedItems.push({
			...(snapshotItem ?? buildPlanTaskRecord(planTask)),
			id: planTask.id,
			content: snapshotItem?.content ?? planTask.label,
			label: snapshotItem?.label ?? planTask.label,
			blockedBy:
				snapshotItem && snapshotItem.blockedBy.length > 0
					? [...snapshotItem.blockedBy]
					: [...planTask.blockedBy],
			agentName: planTask.agent,
		});
	}

	for (const snapshotItem of snapshotItems) {
		if (matchedSnapshotIds.has(snapshotItem.id)) {
			continue;
		}
		mergedItems.push(snapshotItem);
	}

	return mergedItems;
}

const PREFIXED_TASK_ID_PATTERN = /^task-(\d+)$/iu;
const NUMERIC_ID_PATTERN = /^\d+$/u;
function extractNumericTaskId(taskId: string): string | null {
	const trimmed = taskId.trim();
	const prefixedMatch = trimmed.match(PREFIXED_TASK_ID_PATTERN);
	if (prefixedMatch?.[1]) {
		return prefixedMatch[1];
	}
	if (NUMERIC_ID_PATTERN.test(trimmed)) {
		return trimmed;
	}
	return null;
}

function toProgressTask(
	item: FutureChatTodoProgressItem & { agentName?: string },
	thinkingStatusContent: string | null,
): FutureChatPlanExecutionProgressTask {
	const description =
		item.status === "pending"
			? buildBlockedByDescription(item.blockedBy)
			: item.status === "in_progress"
				? (item.activeForm ?? thinkingStatusContent ?? "")
				: "";

	return {
		id: item.id,
		label: item.label,
		description,
		agentName: item.agentName,
	};
}

function buildStatusGroups(
	items: ReadonlyArray<FutureChatTodoProgressItem & { agentName?: string }>,
	thinkingStatusContent: string | null,
): FutureChatPlanExecutionStatusGroups {
	return items.reduce<FutureChatPlanExecutionStatusGroups>(
		(result, item) => {
			const progressTask = toProgressTask(item, thinkingStatusContent);
			if (item.status === "completed") {
				result.done.push(progressTask);
				return result;
			}
			if (item.status === "in_progress") {
				result.inProgress.push(progressTask);
				return result;
			}

			result.todo.push(progressTask);
			return result;
		},
		{
			done: [],
			inReview: [],
			inProgress: [],
			failed: [],
			todo: [],
		},
	);
}

function getLatestThinkingStatusContent(
	messages: ReadonlyArray<RovoUIMessage>,
): string | null {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		if (message.role !== "assistant") {
			continue;
		}

		const thinkingParts = getAllDataParts(message, "data-thinking-status");
		for (let j = thinkingParts.length - 1; j >= 0; j -= 1) {
			const content = thinkingParts[j].data?.content;
			if (typeof content === "string" && content.trim().length > 0) {
				return content.trim();
			}
		}
	}

	return null;
}

function resolveRunCompletedAt(
	executionMessages: ReadonlyArray<RovoUIMessage>,
	fallbackUpdatedAt?: string | null,
): string | null {
	for (let index = executionMessages.length - 1; index >= 0; index -= 1) {
		const message = executionMessages[index];
		if (message.role !== "assistant") {
			continue;
		}

		for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
			const part = message.parts[partIndex];
			if (part.type !== "data-turn-complete") {
				continue;
			}

			const timestamp = toNonEmptyString(part.data?.timestamp);
			if (timestamp) {
				return timestamp;
			}
		}

		const updatedAt = toNonEmptyString(message.metadata?.updatedAt);
		if (updatedAt) {
			return updatedAt;
		}
	}

	return toNonEmptyString(fallbackUpdatedAt);
}

export function buildFutureChatPlanExecutionDismissKey(
	threadId: string,
	planKey: string,
): string {
	return `${threadId}:${planKey}`;
}

export function clearFutureChatPlanExecutionDismissalsForThread(
	dismissedKeys: ReadonlySet<string>,
	threadId: string,
): Set<string> {
	const threadPrefix = `${threadId}:`;
	return new Set(
		Array.from(dismissedKeys).filter(
			(dismissedKey) => !dismissedKey.startsWith(threadPrefix),
		),
	);
}

export function resolveFutureChatPlanExecutionTracker(input: {
	activeRun: FutureChatActiveRun | null;
	messages: ReadonlyArray<RovoUIMessage>;
	threadId: string | null;
	threadUpdatedAt?: string | null;
}): FutureChatPlanExecutionTrackerViewModel | null {
	const { activeRun, messages, threadId, threadUpdatedAt } = input;
	if (!threadId) {
		return null;
	}

	const approvalState = getPlanApprovalState(messages, activeRun);
	if (!approvalState) {
		return null;
	}

	const acceptedPlanWidget = findAcceptedPlanWidget(
		messages,
		approvalState.planKey,
	);
	if (!acceptedPlanWidget) {
		return null;
	}

	const approvalIndex = findAcceptedPlanApprovalIndex(
		messages,
		approvalState.planKey,
	);
	if (approvalIndex === -1) {
		return null;
	}

	const executionMessages = resolveExecutionWindowMessages(messages, approvalIndex);
	const latestSnapshot = getLatestFutureChatTodoProgressFromMessages(executionMessages);
	const thinkingStatusContent = getLatestThinkingStatusContent(executionMessages);
	const mergedItems = mergeTodoItemsWithPlanTasks(
		acceptedPlanWidget.tasks,
		latestSnapshot,
	);
	const runEndedWithArtifact =
		activeRun === null && hasArtifactResultInMessages(executionMessages);
	const runStatus: "running" | "completed" | "failed" =
		activeRun !== null
			? "running"
			: runEndedWithArtifact ||
				  mergedItems.every((item) => item.status === "completed")
				? "completed"
				: "failed";
	const finalItems =
		runStatus === "completed"
			? mergedItems.map((item) =>
					item.status === "completed"
						? item
						: { ...item, status: "completed" as const },
				)
			: mergedItems;
	const taskStatusGroups = buildStatusGroups(finalItems, thinkingStatusContent);
	const runCreatedAt =
		toNonEmptyString(activeRun?.startedAt) ??
		toNonEmptyString(messages[approvalIndex]?.metadata?.createdAt) ??
		null;
	const runCompletedAt =
		runStatus === "running"
			? null
			: resolveRunCompletedAt(executionMessages, threadUpdatedAt);
	const agentCount = Math.max(
		new Set(
			(acceptedPlanWidget.tasks.length > 0
				? acceptedPlanWidget.tasks
						.map((task) => toNonEmptyString(task.agent))
						.filter((agent): agent is string => agent !== null)
				: finalItems
						.map((item) => toNonEmptyString(item.agentName))
						.filter((agent): agent is string => agent !== null)
			),
		).size,
		1,
	);

	return {
		planKey: approvalState.planKey,
		planTitle: acceptedPlanWidget.title,
		planVisualIdentity:
			acceptedPlanWidget.visualIdentity ??
			resolvePlanVisualIdentity(acceptedPlanWidget.title),
		runStatus,
		runCreatedAt,
		runCompletedAt,
		agentCount,
		taskCount: finalItems.length,
		taskStatusGroups:
			finalItems.length > 0 ? taskStatusGroups : EMPTY_STATUS_GROUPS,
	};
}
