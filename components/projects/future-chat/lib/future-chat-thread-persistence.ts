import type { FutureChatVisibility } from "@/lib/future-chat-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export interface RecoverableFutureChatThreadState {
	activeDocumentId: string | null;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	threadId: string | null;
	title: string;
	visibility: FutureChatVisibility;
}

export function hasRecoverableFutureChatThreadState(
	state: Readonly<RecoverableFutureChatThreadState>,
): state is RecoverableFutureChatThreadState & { threadId: string } {
	if (typeof state.threadId !== "string" || !state.threadId.trim()) {
		return false;
	}

	return (
		state.messages.length > 0 ||
		state.realtimeMessages.length > 0 ||
		state.activeDocumentId !== null
	);
}

export function shouldRecoverFutureChatThreadAfterPersistenceFailure(input: {
	error: unknown;
	state: Readonly<RecoverableFutureChatThreadState>;
}): boolean {
	return (
		input.error instanceof Error &&
		input.error.message === "Thread not found" &&
		hasRecoverableFutureChatThreadState(input.state)
	);
}

export function buildRecoverableFutureChatThreadInput(
	state: Readonly<RecoverableFutureChatThreadState>,
): {
	activeDocumentId: string | null;
	id: string;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	title: string;
	visibility: FutureChatVisibility;
} {
	const threadId = state.threadId?.trim();
	if (!threadId) {
		throw new Error("Cannot recover Future Chat thread without an id.");
	}

	return {
		id: threadId,
		title: state.title,
		messages: state.messages,
		realtimeMessages: state.realtimeMessages,
		visibility: state.visibility,
		activeDocumentId: state.activeDocumentId,
	};
}
