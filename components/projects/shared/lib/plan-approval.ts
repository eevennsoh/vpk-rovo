import type { ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import type { RovoAppActiveRun } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { toNonEmptyString } from "@/lib/utils";

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

export interface PlanApprovalState {
	planKey: string;
	status: "accepted" | "pending";
}

function hashPlanKeySegment(value: string): string {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}

	return hash.toString(36);
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

	return normalizedTaskIds.length > 0
		? `${normalizedTitle}-${normalizedTaskIds.join("|")}`
		: normalizedTitle;
}

function buildPlanApprovalIdentityKey(input: {
	title?: string;
	taskIds?: ReadonlyArray<string>;
	markdown?: string;
	deferredToolCallId?: string;
}): string | null {
	const deferredToolCallId = toNonEmptyString(input.deferredToolCallId);
	if (deferredToolCallId) {
		return `tool:${deferredToolCallId}`;
	}

	const planTitle = toNonEmptyString(input.title);
	const taskIds = input.taskIds ?? [];
	const taskKey = serializePlanApprovalKey(planTitle ?? "", taskIds);
	if (taskKey) {
		return taskKey;
	}

	const markdown = toNonEmptyString(input.markdown);
	if (!planTitle || !markdown) {
		return planTitle;
	}

	return `${planTitle}-${hashPlanKeySegment(markdown)}`;
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
		planTasks: [],
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

	return !!planWidget.deferredToolCallId;
}

export function findAcceptedPlanKey(
	messages: ReadonlyArray<RovoUIMessage>,
): string | null {
	const state = getPlanApprovalState(messages, null);
	return state?.status === "accepted" ? state.planKey : null;
}

function getNextAssistantMessage(
	messages: ReadonlyArray<RovoUIMessage>,
	acceptanceIndex: number,
): RovoUIMessage | null {
	for (let index = acceptanceIndex + 1; index < messages.length; index += 1) {
		const nextMessage = messages[index];
		if (nextMessage.role === "assistant") {
			return nextMessage;
		}
		if (nextMessage.role === "user") {
			return null;
		}
	}

	return null;
}

function hasFollowUpWidgetError(
	messages: ReadonlyArray<RovoUIMessage>,
	acceptanceIndex: number,
): boolean {
	const nextMessage = getNextAssistantMessage(messages, acceptanceIndex);
	if (!nextMessage) {
		return false;
	}

	return nextMessage.parts.some(
		(part) => part.type === "data-widget-error",
	);
}

function isSubstantiveAssistantPart(
	part: RovoUIMessage["parts"][number],
): boolean {
	if (part.type === "text") {
		return typeof part.text === "string" && part.text.trim().length > 0;
	}

	if (
		part.type === "data-route-decision" ||
		part.type === "data-thinking-status" ||
		part.type === "data-thinking-event" ||
		part.type === "data-widget-loading" ||
		part.type === "data-turn-complete" ||
		part.type === "data-suggested-questions"
	) {
		return false;
	}

	return true;
}

function hasSubstantiveAssistantFollowUp(
	messages: ReadonlyArray<RovoUIMessage>,
	acceptanceIndex: number,
): boolean {
	const nextMessage = getNextAssistantMessage(messages, acceptanceIndex);
	if (!nextMessage) {
		return false;
	}

	return nextMessage.parts.some((part) => isSubstantiveAssistantPart(part));
}

export function getPlanApprovalState(
	messages: ReadonlyArray<RovoUIMessage>,
	activeRun: RovoAppActiveRun | null,
): PlanApprovalState | null {
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

		const planKey = toNonEmptyString(message.metadata?.planApprovalPlanKey);
		if (!planKey) {
			return null;
		}

		if (hasFollowUpWidgetError(messages, index)) {
			continue;
		}

		if (activeRun !== null) {
			return { status: "pending", planKey };
		}

		if (hasSubstantiveAssistantFollowUp(messages, index)) {
			return { status: "accepted", planKey };
		}

		return null;
	}

	return null;
}

export function getPlanApprovalKeyFromPlanWidget(
	planWidget: ParsedPlanWidgetPayload | null,
): string | null {
	if (!planWidget) {
		return null;
	}

	return buildPlanApprovalIdentityKey({
		title: planWidget.title,
		taskIds: planWidget.tasks.map((task) => task.id),
		markdown: planWidget.markdown,
		deferredToolCallId:
			planWidget.deferredToolCallId ?? planWidget.toolCallId,
	});
}

export function getPlanApprovalKeyFromSubmission(
	submission: Readonly<PlanApprovalSubmission>,
): string | null {
	return buildPlanApprovalIdentityKey({
		title: submission.planTitle,
		taskIds: (submission.planTasks ?? []).map((task) => task.id),
		deferredToolCallId:
			submission.deferredToolCallId ?? submission.toolCallId,
	});
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
