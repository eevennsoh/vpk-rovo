import type { ChatStatus } from "ai";
import type { FutureChatQueuedAction, FutureChatRunStatus } from "@/lib/future-chat-types";

export function isFutureChatThreadBusy({
	activeRunStatus,
	attachedRunStatus,
	status,
}: Readonly<{
	activeRunStatus?: FutureChatRunStatus | null;
	attachedRunStatus?: FutureChatRunStatus | null;
	status: ChatStatus;
}>): boolean {
	return (
		status === "submitted" ||
		status === "streaming" ||
		activeRunStatus !== null ||
		attachedRunStatus !== null
	);
}

export function hasQueuedFutureChatFollowUp({
	hasActiveQueuedAction = false,
	queuedCount,
}: Readonly<{
	hasActiveQueuedAction?: boolean;
	queuedCount: number;
}>): boolean {
	return hasActiveQueuedAction || queuedCount > 0;
}

export function canDispatchFutureChatQueuedAction({
	action,
	hasPendingPlanReview = false,
}: Readonly<{
	action: FutureChatQueuedAction | null;
	hasPendingPlanReview?: boolean;
}>): boolean {
	if (!action) {
		return false;
	}

	if (action.kind !== "prompt") {
		return true;
	}

	if (action.executionMode !== "plan-task") {
		return true;
	}

	return !hasPendingPlanReview;
}
