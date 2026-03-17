import type { FutureChatVisibility } from "@/lib/future-chat-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export interface FutureChatActiveThreadTransitionState {
	activeDocumentId: string | null;
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	threadId: string | null;
	visibility: FutureChatVisibility;
}

export interface FutureChatActiveThreadPersistencePayload {
	activeDocumentId: string | null;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	visibility: FutureChatVisibility;
}

export interface FutureChatActiveThreadTransitionPlan {
	persistence: {
		input: FutureChatActiveThreadPersistencePayload;
		threadId: string;
	} | null;
	shouldDetachStream: boolean;
	shouldTrackBackgroundStream: boolean;
	threadId: string | null;
}

function hasFutureChatSnapshotToPersist(
	state: Readonly<FutureChatActiveThreadTransitionState> & { threadId: string },
): boolean {
	return (
		state.messages.length > 0 ||
		state.realtimeMessages.length > 0 ||
		state.activeDocumentId !== null
	);
}

export function buildFutureChatActiveThreadTransitionPlan(
	state: Readonly<FutureChatActiveThreadTransitionState>,
): FutureChatActiveThreadTransitionPlan {
	const normalizedThreadId =
		typeof state.threadId === "string" && state.threadId.trim()
			? state.threadId.trim()
			: null;
	const shouldTrackBackgroundStream =
		state.isStreaming && normalizedThreadId !== null;

	if (!normalizedThreadId) {
		return {
			persistence: null,
			shouldDetachStream: false,
			shouldTrackBackgroundStream: false,
			threadId: null,
		};
	}

	const normalizedState = {
		...state,
		threadId: normalizedThreadId,
	};

	return {
		persistence: hasFutureChatSnapshotToPersist(normalizedState)
			? {
					threadId: normalizedThreadId,
					input: {
						activeDocumentId: state.activeDocumentId,
						messages: state.messages,
						realtimeMessages: state.realtimeMessages,
						visibility: state.visibility,
					},
				}
			: null,
		shouldDetachStream: shouldTrackBackgroundStream,
		shouldTrackBackgroundStream,
		threadId: normalizedThreadId,
	};
}
