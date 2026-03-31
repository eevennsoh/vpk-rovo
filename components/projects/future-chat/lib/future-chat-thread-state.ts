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

export function updateFutureChatThreadTitleRecord(
	threads: ReadonlyArray<FutureChatThread>,
	options: {
		threadId: string;
		title: string;
		updatedAt: string;
	},
	updateOptions?: {
		deletedThreadIds?: ReadonlySet<string>;
	},
): {
	didUpdate: boolean;
	threads: FutureChatThread[];
} {
	const deletedThreadIds = updateOptions?.deletedThreadIds;
	if (deletedThreadIds?.has(options.threadId)) {
		return {
			didUpdate: false,
			threads: filterDeletedFutureChatThreads(threads, deletedThreadIds),
		};
	}

	const existingThread = threads.find((thread) => thread.id === options.threadId);
	if (!existingThread) {
		return {
			didUpdate: false,
			threads: [...threads],
		};
	}

	return {
		didUpdate: true,
		threads: upsertFutureChatThreadRecord(
			threads,
			{
				...existingThread,
				title: options.title,
				updatedAt: options.updatedAt,
			},
			updateOptions,
		),
	};
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
