import type { FutureChatThread } from "@/lib/future-chat-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
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

export function mergeFutureChatThreadWithLocalTitle(
	threads: ReadonlyArray<FutureChatThread>,
	nextThread: FutureChatThread,
): FutureChatThread {
	const existingThread = threads.find((thread) => thread.id === nextThread.id);
	if (!existingThread || existingThread.title === nextThread.title) {
		return nextThread;
	}

	// Never let a stale server response overwrite an already-resolved
	// non-default title with the "New chat" placeholder.
	const existingIsReal = existingThread.title.trim().length > 0
		&& existingThread.title.trim() !== "New chat";
	const nextIsPlaceholder = !nextThread.title.trim()
		|| nextThread.title.trim() === "New chat";
	if (existingIsReal && nextIsPlaceholder) {
		return {
			...nextThread,
			title: existingThread.title,
			updatedAt: existingThread.updatedAt,
		};
	}

	const existingUpdatedAt = Date.parse(existingThread.updatedAt);
	const nextUpdatedAt = Date.parse(nextThread.updatedAt);
	const hasNewerExistingTitle =
		existingThread.title.trim().length > 0
		&& Number.isFinite(existingUpdatedAt)
		&& (!Number.isFinite(nextUpdatedAt) || existingUpdatedAt > nextUpdatedAt);
	if (!hasNewerExistingTitle) {
		return nextThread;
	}

	return {
		...nextThread,
		title: existingThread.title,
		updatedAt: existingThread.updatedAt,
	};
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

export function updateFutureChatThreadMessagesRecord(
	threads: ReadonlyArray<FutureChatThread>,
	options: {
		threadId: string;
		messages: ReadonlyArray<RovoUIMessage>;
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
				messages: [...options.messages],
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
