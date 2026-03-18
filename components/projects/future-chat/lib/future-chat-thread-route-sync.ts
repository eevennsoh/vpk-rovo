import type {
	FutureChatThread,
	FutureChatVisibility,
} from "@/lib/future-chat-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export const FUTURE_CHAT_ROOT_PATH = "/future-chat";

export function buildFutureChatThreadPersistKey(options: {
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	visibility: FutureChatVisibility;
	activeDocumentId: string | null;
	title: string;
}): string {
	return JSON.stringify({
		messages: options.messages,
		realtimeMessages: options.realtimeMessages,
		visibility: options.visibility,
		activeDocumentId: options.activeDocumentId,
		title: options.title,
	});
}

export function buildFutureChatThreadPath(threadId: string): string {
	return `${FUTURE_CHAT_ROOT_PATH}/${encodeURIComponent(threadId)}`;
}

export function getFutureChatThreadIdFromPath(pathname: string): string | null {
	const normalizedPath =
		pathname === `${FUTURE_CHAT_ROOT_PATH}/`
			? FUTURE_CHAT_ROOT_PATH
			: pathname;

	if (normalizedPath === FUTURE_CHAT_ROOT_PATH) {
		return null;
	}

	const threadPathPrefix = `${FUTURE_CHAT_ROOT_PATH}/`;
	if (!normalizedPath.startsWith(threadPathPrefix)) {
		return null;
	}

	const threadIdSegment = normalizedPath.slice(threadPathPrefix.length);
	if (!threadIdSegment || threadIdSegment.includes("/")) {
		return null;
	}

	try {
		return decodeURIComponent(threadIdSegment);
	} catch {
		return null;
	}
}

export function shouldReplaceFutureChatRouteAfterPersistence(options: {
	pendingThreadId: string | null;
	thread: FutureChatThread;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	visibility: FutureChatVisibility;
	activeDocumentId: string | null;
	title: string;
}): boolean {
	if (!options.pendingThreadId || options.thread.id !== options.pendingThreadId) {
		return false;
	}

	const expectedPersistKey = buildFutureChatThreadPersistKey({
		messages: options.messages,
		realtimeMessages: options.realtimeMessages,
		visibility: options.visibility,
		activeDocumentId: options.activeDocumentId,
		title: options.title,
	});
	const persistedThreadKey = buildFutureChatThreadPersistKey({
		messages: options.thread.messages,
		realtimeMessages: options.thread.realtimeMessages,
		visibility: options.thread.visibility,
		activeDocumentId: options.thread.activeDocumentId,
		title: options.thread.title,
	});

	return persistedThreadKey === expectedPersistKey;
}

export function shouldSkipFutureChatThreadLoad(options: {
	activeThreadId: string | null;
	hasHydratedThreadState: boolean;
	requestedThreadId: string;
}): boolean {
	if (!options.activeThreadId || !options.hasHydratedThreadState) {
		return false;
	}

	return options.activeThreadId === options.requestedThreadId;
}

export function shouldLoadInitialFutureChatThread(options: {
	initialThreadId: string | null;
	lastLoadedInitialThreadId: string | null;
}): options is {
	initialThreadId: string;
	lastLoadedInitialThreadId: string | null;
} {
	if (!options.initialThreadId) {
		return false;
	}

	return options.initialThreadId !== options.lastLoadedInitialThreadId;
}

export function shouldReplacePendingFutureChatRoute(options: {
	activeThreadId: string | null;
	embedded: boolean;
	hasPersistedThreadState: boolean;
	isStreaming: boolean;
	isVoiceMode: boolean;
	pendingThreadId: string | null;
}): boolean {
	if (options.embedded || options.isVoiceMode || options.isStreaming) {
		return false;
	}

	if (!options.activeThreadId || !options.pendingThreadId) {
		return false;
	}

	if (!options.hasPersistedThreadState) {
		return false;
	}

	return options.activeThreadId === options.pendingThreadId;
}
