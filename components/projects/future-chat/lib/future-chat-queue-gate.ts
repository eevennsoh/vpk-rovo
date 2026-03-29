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
}: Readonly<{
	action: FutureChatQueuedAction | null;
}>): boolean {
	return action !== null;
}
