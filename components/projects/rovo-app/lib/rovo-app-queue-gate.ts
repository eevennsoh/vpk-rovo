import type { ChatStatus } from "ai";
import type { RovoAppQueuedAction, RovoAppRunStatus } from "@/lib/rovo-app-types";

export function isRovoAppThreadBusy({
	activeRunStatus,
	attachedRunStatus,
	status,
}: Readonly<{
	activeRunStatus?: RovoAppRunStatus | null;
	attachedRunStatus?: RovoAppRunStatus | null;
	status: ChatStatus;
}>): boolean {
	return (
		status === "submitted" ||
		status === "streaming" ||
		activeRunStatus !== null ||
		attachedRunStatus !== null
	);
}

export function hasQueuedRovoAppFollowUp({
	hasActiveQueuedAction = false,
	queuedCount,
}: Readonly<{
	hasActiveQueuedAction?: boolean;
	queuedCount: number;
}>): boolean {
	return hasActiveQueuedAction || queuedCount > 0;
}

export function canDispatchRovoAppQueuedAction({
	action,
	hasPendingClarification = false,
	hasPendingPlanApproval = false,
	hasPendingToolApproval = false,
}: Readonly<{
	action: RovoAppQueuedAction | null;
	hasPendingClarification?: boolean;
	hasPendingPlanApproval?: boolean;
	hasPendingToolApproval?: boolean;
}>): boolean {
	return (
		action !== null &&
		!hasPendingClarification &&
		!hasPendingPlanApproval &&
		!hasPendingToolApproval
	);
}
