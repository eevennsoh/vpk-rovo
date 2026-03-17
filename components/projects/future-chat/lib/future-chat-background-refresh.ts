import type { ChatStatus } from "ai";

export function shouldHydrateCompletedActiveBackgroundThread({
	activeStreamThreadIds,
	activeThreadId,
	status,
	threadId,
}: Readonly<{
	activeStreamThreadIds: ReadonlySet<string>;
	activeThreadId: string | null;
	status: ChatStatus;
	threadId: string;
}>): boolean {
	if (threadId !== activeThreadId) {
		return false;
	}

	if (activeStreamThreadIds.has(threadId)) {
		return false;
	}

	return status !== "submitted" && status !== "streaming";
}
