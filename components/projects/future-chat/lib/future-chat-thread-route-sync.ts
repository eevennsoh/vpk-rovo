import type {
	FutureChatThread,
	FutureChatVisibility,
} from "@/lib/future-chat-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

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

export function shouldReplacePendingFutureChatRoute(options: {
	activeThreadId: string | null;
	embedded: boolean;
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

	return options.activeThreadId === options.pendingThreadId;
}
