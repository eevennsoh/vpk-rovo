import {
	getThinkingToolCallSummaries,
	isMessageVisibleInTranscript,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { getPlanApprovalKeyFromPlanWidget } from "@/components/projects/shared/lib/plan-approval";
import type {
	ParsedPlanTask,
	ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import {
	getLatestRovoAppTodoProgress,
	type RovoAppTodoProgressSnapshot,
} from "@/components/projects/rovo-app/lib/rovo-app-update-todo-progress";

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

export function normalizeRovoAppPlanTaskIdAlias(taskId: string): string {
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

export function rovoAppPlanTaskIdsMatch(
	leftTaskId: string,
	rightTaskId: string,
): boolean {
	return (
		normalizeRovoAppPlanTaskIdAlias(leftTaskId) ===
		normalizeRovoAppPlanTaskIdAlias(rightTaskId)
	);
}

export function getLatestRovoAppTodoProgressFromMessages(
	messages: ReadonlyArray<RovoUIMessage>,
): RovoAppTodoProgressSnapshot | null {
	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (message.role !== "assistant") {
			continue;
		}

		const parsedSnapshot = getLatestRovoAppTodoProgress(
			getThinkingToolCallSummaries(message),
		);
		if (parsedSnapshot) {
			return parsedSnapshot;
		}
	}

	return null;
}

export function buildRovoAppPlanTaskDisplayLabels(
	planTasks: ReadonlyArray<ParsedPlanTask>,
	snapshot: RovoAppTodoProgressSnapshot | null,
): Record<string, string> {
	const snapshotItems = snapshot?.items ?? [];

	// When planTasks is empty (new plans no longer pre-seed tasks),
	// derive labels purely from snapshot items.
	if (planTasks.length === 0) {
		const taskLabels: Record<string, string> = {};
		for (const item of snapshotItems) {
			taskLabels[item.id] = item.label;
		}
		return taskLabels;
	}

	const matchedSnapshotIds = new Set<string>();
	const taskLabels: Record<string, string> = {};

	for (const planTask of planTasks) {
		const snapshotItem =
			snapshotItems.find(
				(item) =>
					!matchedSnapshotIds.has(item.id) &&
					rovoAppPlanTaskIdsMatch(planTask.id, item.id),
			) ?? null;
		if (snapshotItem) {
			matchedSnapshotIds.add(snapshotItem.id);
		}

		taskLabels[planTask.id] = snapshotItem?.label ?? planTask.label;
	}

	return taskLabels;
}

export function resolveRovoAppPlanTaskDisplayLabels(input: {
	messages: ReadonlyArray<RovoUIMessage>;
	planWidget: ParsedPlanWidgetPayload | null;
}): Record<string, string> {
	const { messages, planWidget } = input;
	if (!planWidget) {
		return {};
	}

	const planKey = getPlanApprovalKeyFromPlanWidget(planWidget);
	if (!planKey) {
		return buildRovoAppPlanTaskDisplayLabels(planWidget.tasks, null);
	}

	const approvalIndex = findAcceptedPlanApprovalIndex(messages, planKey);
	if (approvalIndex === -1) {
		return buildRovoAppPlanTaskDisplayLabels(planWidget.tasks, null);
	}

	const executionMessages = resolveExecutionWindowMessages(messages, approvalIndex);
	const latestSnapshot =
		getLatestRovoAppTodoProgressFromMessages(executionMessages);

	return buildRovoAppPlanTaskDisplayLabels(planWidget.tasks, latestSnapshot);
}
