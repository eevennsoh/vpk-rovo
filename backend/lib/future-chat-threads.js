const fs = require("node:fs/promises");
const path = require("node:path");

const RETENTION_LIMIT = 40;

function createId() {
	return `future-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toIsoDate(value = Date.now()) {
	const date = value instanceof Date ? value : new Date(value);
	return date.toISOString();
}

function safeJsonParse(rawValue) {
	try {
		return JSON.parse(rawValue);
	} catch {
		return null;
	}
}

function getTimestamp(value) {
	if (typeof value !== "string" || !value.trim()) {
		return Number.NaN;
	}

	return Date.parse(value);
}

function buildThreadPaths(rootDir, threadId) {
	const threadDir = path.join(rootDir, threadId);
	return {
		threadDir,
		threadFilePath: path.join(threadDir, "thread.json"),
	};
}

function normalizeRealtimeMessages(rawMessages) {
	if (!Array.isArray(rawMessages)) {
		return [];
	}

	return rawMessages.filter((message) => {
		return (
			message &&
			typeof message === "object" &&
			typeof message.id === "string" &&
			message.id.trim().length > 0 &&
			(message.role === "user" || message.role === "assistant") &&
			Array.isArray(message.parts)
		);
	});
}

function normalizeActiveRun(rawActiveRun, updatedAtFallback) {
	if (!rawActiveRun || typeof rawActiveRun !== "object") {
		return null;
	}

	const id =
		typeof rawActiveRun.id === "string" && rawActiveRun.id.trim()
			? rawActiveRun.id.trim()
			: null;
	if (!id) {
		return null;
	}

	const status =
		rawActiveRun.status === "queued"
		|| rawActiveRun.status === "streaming"
		|| rawActiveRun.status === "background"
			? rawActiveRun.status
			: null;
	if (!status) {
		return null;
	}

	const startedAt =
		typeof rawActiveRun.startedAt === "string" && rawActiveRun.startedAt.trim()
			? rawActiveRun.startedAt.trim()
			: updatedAtFallback;
	const updatedAt =
		typeof rawActiveRun.updatedAt === "string" && rawActiveRun.updatedAt.trim()
			? rawActiveRun.updatedAt.trim()
			: startedAt;

	return {
		id,
		status,
		portIndex:
			typeof rawActiveRun.portIndex === "number"
			&& Number.isInteger(rawActiveRun.portIndex)
			&& rawActiveRun.portIndex >= 0
				? rawActiveRun.portIndex
				: null,
		rovoPort:
			typeof rawActiveRun.rovoPort === "number"
			&& Number.isInteger(rawActiveRun.rovoPort)
			&& rawActiveRun.rovoPort > 0
				? rawActiveRun.rovoPort
				: null,
		startedAt,
		updatedAt,
	};
}

function normalizeThreadRecord(rawThread) {
	if (!rawThread || typeof rawThread !== "object") {
		return null;
	}

	const id = typeof rawThread.id === "string" && rawThread.id.trim()
		? rawThread.id.trim()
		: null;
	if (!id) {
		return null;
	}

	const createdAt = typeof rawThread.createdAt === "string" && rawThread.createdAt.trim()
		? rawThread.createdAt
		: toIsoDate();
	const updatedAt = typeof rawThread.updatedAt === "string" && rawThread.updatedAt.trim()
		? rawThread.updatedAt
		: createdAt;

	return {
		id,
		title:
			typeof rawThread.title === "string" && rawThread.title.trim()
				? rawThread.title.trim()
				: "New chat",
		messages: Array.isArray(rawThread.messages) ? rawThread.messages : [],
		visibility: rawThread.visibility === "public" ? "public" : "private",
		modelId:
			typeof rawThread.modelId === "string" && rawThread.modelId.trim()
				? rawThread.modelId.trim()
				: null,
		provider:
			typeof rawThread.provider === "string" && rawThread.provider.trim()
				? rawThread.provider.trim()
				: null,
		realtimeMessages: normalizeRealtimeMessages(rawThread.realtimeMessages),
		activeDocumentId:
			typeof rawThread.activeDocumentId === "string" && rawThread.activeDocumentId.trim()
				? rawThread.activeDocumentId.trim()
				: null,
		activeRun: normalizeActiveRun(rawThread.activeRun, updatedAt),
		createdAt,
		updatedAt,
	};
}

function createFutureChatThreadManager({ baseDir, logger }) {
	const threadsRootDir = path.join(baseDir, "future-chat", "threads");

	const writeJsonFile = async (filePath, payload) => {
		await fs.mkdir(path.dirname(filePath), { recursive: true });
		await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
	};

	const readThread = async (threadId) => {
		const { threadFilePath } = buildThreadPaths(threadsRootDir, threadId);

		try {
			const raw = await fs.readFile(threadFilePath, "utf8");
			return normalizeThreadRecord(safeJsonParse(raw));
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return null;
			}

			throw error;
		}
	};

	const listThreads = async ({ limit } = {}) => {
		let entries;
		try {
			entries = await fs.readdir(threadsRootDir);
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return [];
			}

			throw error;
		}

		const threads = [];
		for (const entry of entries) {
			const thread = await readThread(entry);
			if (thread) {
				threads.push(thread);
			}
		}

		threads.sort((left, right) => {
			const leftTime = getTimestamp(left.updatedAt);
			const rightTime = getTimestamp(right.updatedAt);
			return rightTime - leftTime;
		});

		const resolvedLimit =
			typeof limit === "number" && Number.isFinite(limit) && limit > 0
				? Math.floor(limit)
				: RETENTION_LIMIT;
		return threads.slice(0, resolvedLimit);
	};

	const pruneOldThreads = async () => {
		const threads = await listThreads({ limit: RETENTION_LIMIT + 20 });
		if (threads.length <= RETENTION_LIMIT) {
			return;
		}

		const staleThreads = threads.slice(RETENTION_LIMIT);
		for (const thread of staleThreads) {
			try {
				const { threadDir } = buildThreadPaths(threadsRootDir, thread.id);
				await fs.rm(threadDir, { recursive: true, force: true });
			} catch (error) {
				logger.error?.(`[FUTURE-CHAT] Failed to prune thread ${thread.id}:`, error);
			}
		}
	};

	const createThread = async ({
		id,
		title,
		messages,
		realtimeMessages,
		visibility,
		modelId,
		provider,
		activeDocumentId,
		activeRun,
		createdAt,
		updatedAt,
	} = {}) => {
		const threadId =
			typeof id === "string" && id.trim() ? id.trim() : createId();
		const now = toIsoDate();
		const nextThread = normalizeThreadRecord({
			id: threadId,
			title,
			messages,
			realtimeMessages,
			visibility,
			modelId,
			provider,
			activeDocumentId,
			activeRun,
			createdAt: createdAt || now,
			updatedAt: updatedAt || now,
		});

		const { threadFilePath } = buildThreadPaths(threadsRootDir, threadId);
		await writeJsonFile(threadFilePath, nextThread);
		await pruneOldThreads();
		return nextThread;
	};

	const updateThread = async (threadId, fields = {}) => {
		const currentThread = await readThread(threadId);
		if (!currentThread) {
			return null;
		}

		const nextThread = normalizeThreadRecord({
			...currentThread,
			...fields,
			id: currentThread.id,
			createdAt: currentThread.createdAt,
			updatedAt:
				typeof fields.updatedAt === "string" && fields.updatedAt.trim()
					? fields.updatedAt
					: toIsoDate(),
		});
		const { threadFilePath } = buildThreadPaths(threadsRootDir, threadId);
		await writeJsonFile(threadFilePath, nextThread);
		return nextThread;
	};

	const getRealtimeMessages = async (threadId) => {
		const thread = await readThread(threadId);
		if (!thread) {
			return null;
		}

		return normalizeRealtimeMessages(thread.realtimeMessages);
	};

	const replaceRealtimeMessages = async (threadId, realtimeMessages) => {
		const currentThread = await readThread(threadId);
		if (!currentThread) {
			return null;
		}

		const nextRealtimeMessages = normalizeRealtimeMessages(realtimeMessages);
		return updateThread(threadId, {
			realtimeMessages: nextRealtimeMessages,
		});
	};

	const upsertRealtimeMessage = async (threadId, realtimeMessage) => {
		const currentThread = await readThread(threadId);
		if (!currentThread) {
			return null;
		}

		const [nextRealtimeMessage] = normalizeRealtimeMessages([realtimeMessage]);
		if (!nextRealtimeMessage) {
			return currentThread;
		}

		const existingMessages = normalizeRealtimeMessages(currentThread.realtimeMessages);
		const existingIndex = existingMessages.findIndex(
			(message) => message.id === nextRealtimeMessage.id,
		);
		if (existingIndex === -1) {
			existingMessages.push(nextRealtimeMessage);
		} else {
			existingMessages.splice(existingIndex, 1, nextRealtimeMessage);
		}

		return updateThread(threadId, {
			realtimeMessages: existingMessages,
		});
	};

	const deleteThread = async (threadId) => {
		const { threadDir } = buildThreadPaths(threadsRootDir, threadId);
		await fs.rm(threadDir, { recursive: true, force: true });
	};

	const deleteAllThreads = async () => {
		await fs.rm(threadsRootDir, { recursive: true, force: true });
	};

	return {
		listThreads,
		getThread: readThread,
		getRealtimeMessages,
		createThread,
		replaceRealtimeMessages,
		upsertRealtimeMessage,
		updateThread,
		deleteThread,
		deleteAllThreads,
	};
}

module.exports = {
	createFutureChatThreadManager,
};
