import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";

export interface ToolApprovalDecisionState {
	approved: boolean;
	denyMessage?: string;
}

export interface ToolApprovalSubmitDecision {
	toolCallId: string;
	approved: boolean;
	denyMessage?: string;
}

export type ToolApprovalProgressMode = "position" | "remaining";

export type ToolApprovalSubmissionMode = "batch" | "per-decision";

interface ToolApprovalDecisionTransitionInput {
	items: ToolApprovalPayload["items"];
	activeIndex: number;
	decisionsByToolCallId: Record<string, ToolApprovalDecisionState>;
	toolCallId: string;
	approved: boolean;
	denyMessage?: string;
	submissionMode?: ToolApprovalSubmissionMode;
}

interface ToolApprovalProgressLabelInput {
	items: ToolApprovalPayload["items"];
	activeIndex: number;
	decisionsByToolCallId: Record<string, ToolApprovalDecisionState>;
	progressMode?: ToolApprovalProgressMode;
}

export interface ToolApprovalDecisionTransition {
	nextDecisionsByToolCallId: Record<string, ToolApprovalDecisionState>;
	nextActiveIndex: number;
	submission: ToolApprovalSubmitDecision[];
	shouldSubmit: boolean;
	isComplete: boolean;
}

export function buildSubmissionPayload(
	items: ToolApprovalPayload["items"],
	decisionsByToolCallId: Record<string, ToolApprovalDecisionState>,
): ToolApprovalSubmitDecision[] {
	const submission: ToolApprovalSubmitDecision[] = [];

	for (const item of items) {
		const decision = decisionsByToolCallId[item.toolCallId];
		if (!decision) {
			continue;
		}

		submission.push({
			toolCallId: item.toolCallId,
			approved: decision.approved,
			denyMessage: decision.denyMessage,
		});
	}

	return submission;
}

export function findNextUndecidedIndex(
	items: ToolApprovalPayload["items"],
	activeIndex: number,
	decisionsByToolCallId: Record<string, ToolApprovalDecisionState>,
): number {
	for (let index = activeIndex + 1; index < items.length; index += 1) {
		if (!decisionsByToolCallId[items[index]?.toolCallId]) {
			return index;
		}
	}

	for (let index = 0; index < items.length; index += 1) {
		if (!decisionsByToolCallId[items[index]?.toolCallId]) {
			return index;
		}
	}

	return activeIndex;
}

export function getToolApprovalDecisionTransition({
	items,
	activeIndex,
	decisionsByToolCallId,
	toolCallId,
	approved,
	denyMessage,
	submissionMode = "batch",
}: Readonly<ToolApprovalDecisionTransitionInput>): ToolApprovalDecisionTransition {
	const nextDecisionsByToolCallId = {
		...decisionsByToolCallId,
		[toolCallId]: {
			approved,
			denyMessage,
		},
	};
	const submission = buildSubmissionPayload(items, nextDecisionsByToolCallId);
	const isComplete = submission.length === items.length;

	return {
		nextDecisionsByToolCallId,
		nextActiveIndex: findNextUndecidedIndex(items, activeIndex, nextDecisionsByToolCallId),
		submission,
		shouldSubmit: submissionMode === "per-decision" || isComplete,
		isComplete,
	};
}

export function getToolApprovalProgressLabel({
	items,
	activeIndex,
	decisionsByToolCallId,
	progressMode = "position",
}: Readonly<ToolApprovalProgressLabelInput>): string | null {
	if (items.length <= 1) {
		return null;
	}

	if (progressMode === "remaining") {
		const remainingCount = items.length - buildSubmissionPayload(items, decisionsByToolCallId).length;
		return `${remainingCount} left`;
	}

	return `${activeIndex + 1} / ${items.length}`;
}
