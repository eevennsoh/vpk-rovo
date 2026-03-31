import type { FutureChatActiveRun } from "@/lib/future-chat-types";
import {
	getThinkingToolCallSummaries,
	isMessageVisibleInTranscript,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import {
	derivePlanEmojiFromTitle,
	extractTaskHeadingFromLabel,
} from "@/components/projects/shared/lib/plan-identity";
import {
	getPlanApprovalKeyFromPlanWidget,
	getPlanApprovalState,
} from "@/components/projects/shared/lib/plan-approval";
import {
	getAllPlanWidgetPayloads,
	type ParsedPlanTask,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import {
	getLatestFutureChatTodoProgress,
	type FutureChatTodoProgressItem,
	type FutureChatTodoProgressSnapshot,
} from "@/components/projects/future-chat/lib/future-chat-update-todo-progress";
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
	planEmoji: string;
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

function getLatestFutureChatTodoProgressFromMessages(
	messages: ReadonlyArray<RovoUIMessage>,
): FutureChatTodoProgressSnapshot | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "assistant") {
			continue;
		}

		const parsedSnapshot = getLatestFutureChatTodoProgress(
			getThinkingToolCallSummaries(message),
		);
		if (parsedSnapshot) {
			return parsedSnapshot;
		}
	}

	return null;
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
	const heading = extractTaskHeadingFromLabel(task.label) || task.label;
	return {
		id: task.id,
		content: heading,
		label: heading,
		status: "pending",
		blockedBy: [...task.blockedBy],
	};
}

function normalizeTaskIdAlias(taskId: string): string {
	const normalizedTaskId = taskId.trim();
	if (!normalizedTaskId) {
		return normalizedTaskId;
	}

	const prefixedMatch = normalizedTaskId.match(/^task-(\d+)$/iu);
	if (prefixedMatch?.[1]) {
		return `task-${Number.parseInt(prefixedMatch[1], 10)}`;
	}

	if (/^\d+$/u.test(normalizedTaskId)) {
		return `task-${Number.parseInt(normalizedTaskId, 10)}`;
	}

	return normalizedTaskId;
}

function taskIdsMatch(leftTaskId: string, rightTaskId: string): boolean {
	return normalizeTaskIdAlias(leftTaskId) === normalizeTaskIdAlias(rightTaskId);
}

function mergeTodoItemsWithPlanTasks(
	planTasks: ReadonlyArray<ParsedPlanTask>,
	snapshot: FutureChatTodoProgressSnapshot | null,
): Array<FutureChatTodoProgressItem & { agentName?: string }> {
	const snapshotItems = snapshot?.items ?? [];
	const mergedItems: Array<FutureChatTodoProgressItem & { agentName?: string }> = [];
	const matchedSnapshotIds = new Set<string>();

	for (const planTask of planTasks) {
		const snapshotItem =
			snapshotItems.find((item) =>
				!matchedSnapshotIds.has(item.id) && taskIdsMatch(planTask.id, item.id)
			) ?? null;
		if (snapshotItem) {
			matchedSnapshotIds.add(snapshotItem.id);
		}
		const fallbackHeading =
			extractTaskHeadingFromLabel(planTask.label) || planTask.label;

		mergedItems.push({
			...(snapshotItem ?? buildPlanTaskRecord(planTask)),
			id: planTask.id,
			content: snapshotItem?.content ?? fallbackHeading,
			label: snapshotItem?.label ?? fallbackHeading,
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
const LABEL_ALREADY_PREFIXED_PATTERN = /^#\d+\s/u;

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
): FutureChatPlanExecutionProgressTask {
	const description =
		item.status === "pending"
			? buildBlockedByDescription(item.blockedBy)
			: "";

	const numericId = extractNumericTaskId(item.id);
	const alreadyPrefixed = LABEL_ALREADY_PREFIXED_PATTERN.test(item.label);
	const label =
		numericId !== null && !alreadyPrefixed
			? `#${numericId} ${item.label}`
			: item.label;

	return {
		id: item.id,
		label,
		description,
		agentName: item.agentName,
	};
}

function buildStatusGroups(
	items: ReadonlyArray<FutureChatTodoProgressItem & { agentName?: string }>,
): FutureChatPlanExecutionStatusGroups {
	return items.reduce<FutureChatPlanExecutionStatusGroups>(
		(result, item) => {
			const progressTask = toProgressTask(item);
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
	const mergedItems = mergeTodoItemsWithPlanTasks(
		acceptedPlanWidget.tasks,
		latestSnapshot,
	);
	const taskStatusGroups = buildStatusGroups(mergedItems);
	const runStatus =
		activeRun !== null
			? "running"
			: mergedItems.every((item) => item.status === "completed")
				? "completed"
				: "failed";
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
			acceptedPlanWidget.tasks
				.map((task) => toNonEmptyString(task.agent))
				.filter((agent): agent is string => agent !== null),
		).size,
		1,
	);

	return {
		planKey: approvalState.planKey,
		planTitle: acceptedPlanWidget.title,
		planEmoji:
			acceptedPlanWidget.emoji ??
			derivePlanEmojiFromTitle(acceptedPlanWidget.title),
		runStatus,
		runCreatedAt,
		runCompletedAt,
		agentCount,
		taskCount: mergedItems.length,
		taskStatusGroups:
			mergedItems.length > 0 ? taskStatusGroups : EMPTY_STATUS_GROUPS,
	};
}
