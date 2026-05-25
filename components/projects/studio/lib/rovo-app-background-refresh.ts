import type { ChatStatus } from "ai";
import type { RovoAppThread } from "@/lib/rovo-app-types";

export function getRovoAppBackgroundRefreshThreadIds({
	activeThreadId,
	threads,
}: Readonly<{
	activeThreadId: string | null;
	threads: ReadonlyArray<Pick<RovoAppThread, "activeRun" | "id">>;
}>): string[] {
	return threads
		.filter((thread) => thread.activeRun != null && thread.id !== activeThreadId)
		.map((thread) => thread.id)
		.sort();
}

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
