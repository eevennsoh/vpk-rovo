import type { FutureChatThread } from "@/lib/future-chat-types";
import { sortByUpdatedAtDesc } from "@/lib/utils";

export function sortFutureChatThreadsByUpdatedAtDesc(
	threads: ReadonlyArray<FutureChatThread>,
): FutureChatThread[] {
	return sortByUpdatedAtDesc(threads);
}

export function filterDeletedFutureChatThreads(
	threads: ReadonlyArray<FutureChatThread>,
	deletedThreadIds: ReadonlySet<string>,
): FutureChatThread[] {
	if (deletedThreadIds.size === 0) {
		return sortFutureChatThreadsByUpdatedAtDesc(threads);
	}

	return sortFutureChatThreadsByUpdatedAtDesc(
		threads.filter((thread) => !deletedThreadIds.has(thread.id)),
	);
}

export function upsertFutureChatThreadRecord(
	threads: ReadonlyArray<FutureChatThread>,
	nextThread: FutureChatThread,
	options?: {
		deletedThreadIds?: ReadonlySet<string>;
	},
): FutureChatThread[] {
	const deletedThreadIds = options?.deletedThreadIds;
	if (deletedThreadIds?.has(nextThread.id)) {
		return filterDeletedFutureChatThreads(threads, deletedThreadIds);
	}

	const existingIndex = threads.findIndex((thread) => thread.id === nextThread.id);
	const nextThreads = existingIndex === -1 ? [nextThread, ...threads] : [...threads];
	if (existingIndex !== -1) {
		nextThreads[existingIndex] = nextThread;
	}

	return deletedThreadIds
		? filterDeletedFutureChatThreads(nextThreads, deletedThreadIds)
		: sortFutureChatThreadsByUpdatedAtDesc(nextThreads);
}
