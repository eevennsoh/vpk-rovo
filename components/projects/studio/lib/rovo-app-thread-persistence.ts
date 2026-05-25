import type { RovoAppVisibility } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export interface RecoverableRovoAppThreadState {
	activeDocumentId: string | null;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	threadId: string | null;
	title: string;
	visibility: RovoAppVisibility;
}

export function hasRecoverableRovoAppThreadState(
	state: Readonly<RecoverableRovoAppThreadState>,
): state is RecoverableRovoAppThreadState & { threadId: string } {
	if (typeof state.threadId !== "string" || !state.threadId.trim()) {
		return false;
	}

	return (
		state.messages.length > 0 ||
		state.realtimeMessages.length > 0 ||
		state.activeDocumentId !== null
	);
}

export function isRovoAppThreadNotFoundError(error: unknown): boolean {
	return error instanceof Error && error.message === "Thread not found";
}

export function shouldPersistResolvedRovoAppTitle(input: {
	deletedThreadIds: ReadonlySet<string>;
	threadId: string;
	threads: ReadonlyArray<{ id: string }>;
}): boolean {
	if (input.deletedThreadIds.has(input.threadId)) {
		return false;
	}

	return input.threads.some((thread) => thread.id === input.threadId);
}

export function shouldRecoverRovoAppThreadAfterPersistenceFailure(input: {
	error: unknown;
	state: Readonly<RecoverableRovoAppThreadState>;
}): boolean {
	return (
		isRovoAppThreadNotFoundError(input.error) &&
		hasRecoverableRovoAppThreadState(input.state)
	);
}

export function buildRecoverableRovoAppThreadInput(
	state: Readonly<RecoverableRovoAppThreadState>,
): {
	activeDocumentId: string | null;
	id: string;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	title: string;
	visibility: RovoAppVisibility;
} {
	const threadId = state.threadId?.trim();
	if (!threadId) {
		throw new Error("Cannot recover Rovo thread without an id.");
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
