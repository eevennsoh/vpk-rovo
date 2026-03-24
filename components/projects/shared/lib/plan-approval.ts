import type { ParsedPlanTask, ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export type PlanApprovalDecision =
	| "auto-accept"
	| "continue-planning"
	| "custom";

export interface PlanApprovalSelection {
	decision: PlanApprovalDecision;
	customInstruction?: string;
}

export interface PlanApprovalTaskInfo {
	id: string;
	label: string;
	agent?: string;
	blockedBy: string[];
}

export interface PlanApprovalSubmission extends PlanApprovalSelection {
	planTitle?: string;
	planTasks?: PlanApprovalTaskInfo[];
	toolCallId?: string;
	deferredToolCallId?: string;
}

function toNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmedValue = value.trim();
	return trimmedValue.length > 0 ? trimmedValue : null;
}

export function serializePlanApprovalKey(
	planTitle: string,
	taskIds: ReadonlyArray<string>,
): string | null {
	const normalizedTitle = toNonEmptyString(planTitle);
	if (!normalizedTitle) {
		return null;
	}

	const normalizedTaskIds = taskIds
		.map((taskId) => toNonEmptyString(taskId))
		.filter((taskId): taskId is string => taskId !== null);
	if (normalizedTaskIds.length === 0) {
		return null;
	}

	return `${normalizedTitle}-${normalizedTaskIds.join("|")}`;
}

function extractTaskInfo(tasks: ReadonlyArray<ParsedPlanTask>): PlanApprovalTaskInfo[] {
	return tasks
		.filter((task) => task.label.trim().length > 0)
		.slice(0, 12)
		.map((task) => ({
			id: task.id,
			label: task.label.trim(),
			agent: task.agent,
			blockedBy: task.blockedBy,
		}));
}

export function createPlanApprovalSubmission(
	selection: PlanApprovalSelection,
	planWidget: ParsedPlanWidgetPayload | null
): PlanApprovalSubmission {
	const deferredToolCallId =
		planWidget?.deferredToolCallId ?? planWidget?.toolCallId;

	return {
		decision: selection.decision,
		customInstruction: selection.customInstruction?.trim() || undefined,
		planTitle: planWidget?.title?.trim() || undefined,
		planTasks: planWidget ? extractTaskInfo(planWidget.tasks) : [],
		toolCallId: deferredToolCallId,
		deferredToolCallId,
	};
}

export function planWidgetRequiresApproval(
	planWidget: ParsedPlanWidgetPayload | null,
): boolean {
	if (!planWidget) {
		return false;
	}

	if (planWidget.deferredToolCallId) {
		return true;
	}

	return planWidget.tasks.length > 0;
}

export function findAcceptedPlanKey(
	messages: ReadonlyArray<RovoUIMessage>,
): string | null {
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

		const planKey = message.metadata?.planApprovalPlanKey;
		if (typeof planKey === "string" && planKey.trim()) {
			return planKey;
		}
	}

	return null;
}

export function getPlanApprovalKeyFromPlanWidget(
	planWidget: ParsedPlanWidgetPayload | null,
): string | null {
	if (!planWidget) {
		return null;
	}

	return serializePlanApprovalKey(
		planWidget.title,
		planWidget.tasks.map((task) => task.id),
	);
}

export function getPlanApprovalKeyFromSubmission(
	submission: Readonly<PlanApprovalSubmission>,
): string | null {
	return serializePlanApprovalKey(
		submission.planTitle ?? "",
		(submission.planTasks ?? []).map((task) => task.id),
	);
}

function getDecisionLabel(decision: PlanApprovalDecision): string {
	if (decision === "auto-accept") {
		return "Yes, let's start cooking";
	}

	if (decision === "continue-planning") {
		return "No, keep planning";
	}

	return "Custom instruction";
}

export function buildPlanApprovalPrompt(
	submission: Readonly<PlanApprovalSubmission>
): string {
	const lines = [
		"I reviewed the plan and submitted an approval decision.",
		`Decision: ${getDecisionLabel(submission.decision)}.`,
	];

	if (submission.customInstruction?.trim()) {
		lines.push(`Additional instruction: ${submission.customInstruction.trim()}`);
	}

	lines.push("Use this approval to continue from the existing plan.");
	return lines.join("\n");
}
