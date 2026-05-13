import type { RovoAppThread } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { sortByUpdatedAtDesc } from "@/lib/utils";

export function sortRovoAppThreadsByUpdatedAtDesc(
	threads: ReadonlyArray<RovoAppThread>,
): RovoAppThread[] {
	return sortByUpdatedAtDesc(threads);
}

export function filterDeletedRovoAppThreads(
	threads: ReadonlyArray<RovoAppThread>,
	deletedThreadIds: ReadonlySet<string>,
): RovoAppThread[] {
	if (deletedThreadIds.size === 0) {
		return sortRovoAppThreadsByUpdatedAtDesc(threads);
	}

	return sortRovoAppThreadsByUpdatedAtDesc(
		threads.filter((thread) => !deletedThreadIds.has(thread.id)),
	);
}

export function mergeRovoAppThreadWithLocalTitle(
	threads: ReadonlyArray<RovoAppThread>,
	nextThread: RovoAppThread,
): RovoAppThread {
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

export function updateRovoAppThreadTitleRecord(
	threads: ReadonlyArray<RovoAppThread>,
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
	threads: RovoAppThread[];
} {
	const deletedThreadIds = updateOptions?.deletedThreadIds;
	if (deletedThreadIds?.has(options.threadId)) {
		return {
			didUpdate: false,
			threads: filterDeletedRovoAppThreads(threads, deletedThreadIds),
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
		threads: upsertRovoAppThreadRecord(
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

export function updateRovoAppThreadMessagesRecord(
	threads: ReadonlyArray<RovoAppThread>,
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
	threads: RovoAppThread[];
} {
	const deletedThreadIds = updateOptions?.deletedThreadIds;
	if (deletedThreadIds?.has(options.threadId)) {
		return {
			didUpdate: false,
			threads: filterDeletedRovoAppThreads(threads, deletedThreadIds),
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
		threads: upsertRovoAppThreadRecord(
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

export function upsertRovoAppThreadRecord(
	threads: ReadonlyArray<RovoAppThread>,
	nextThread: RovoAppThread,
	options?: {
		deletedThreadIds?: ReadonlySet<string>;
	},
): RovoAppThread[] {
	const deletedThreadIds = options?.deletedThreadIds;
	if (deletedThreadIds?.has(nextThread.id)) {
		return filterDeletedRovoAppThreads(threads, deletedThreadIds);
	}

	const existingIndex = threads.findIndex((thread) => thread.id === nextThread.id);
	const nextThreads = existingIndex === -1 ? [nextThread, ...threads] : [...threads];
	if (existingIndex !== -1) {
		nextThreads[existingIndex] = nextThread;
	}

	return deletedThreadIds
		? filterDeletedRovoAppThreads(nextThreads, deletedThreadIds)
		: sortRovoAppThreadsByUpdatedAtDesc(nextThreads);
}
