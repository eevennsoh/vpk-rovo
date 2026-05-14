import type { RovoAppVisibility } from "@/lib/rovo-app-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export interface RovoAppActiveThreadTransitionState {
	activeDocumentId: string | null;
	isStreaming: boolean;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	threadId: string | null;
	visibility: RovoAppVisibility;
}

export interface RovoAppActiveThreadPersistencePayload {
	activeDocumentId: string | null;
	messages: ReadonlyArray<RovoUIMessage>;
	realtimeMessages: ReadonlyArray<RovoUIMessage>;
	visibility: RovoAppVisibility;
}

export interface RovoAppActiveThreadTransitionPlan {
	persistence: {
		input: RovoAppActiveThreadPersistencePayload;
		threadId: string;
	} | null;
	shouldDetachStream: boolean;
	shouldTrackBackgroundStream: boolean;
	threadId: string | null;
}

function hasRovoAppSnapshotToPersist(
	state: Readonly<RovoAppActiveThreadTransitionState> & { threadId: string },
): boolean {
	return (
		state.messages.length > 0 ||
		state.realtimeMessages.length > 0 ||
		state.activeDocumentId !== null
	);
}

export function buildRovoAppActiveThreadTransitionPlan(
	state: Readonly<RovoAppActiveThreadTransitionState>,
): RovoAppActiveThreadTransitionPlan {
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
		persistence: hasRovoAppSnapshotToPersist(normalizedState)
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
