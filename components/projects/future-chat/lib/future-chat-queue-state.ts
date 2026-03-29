import type { FutureChatQueuedAction } from "@/lib/future-chat-types";

export type FutureChatQueuedActionsByThreadId = Record<
	string,
	FutureChatQueuedAction[]
>;

export function appendFutureChatQueuedActions(
	state: Readonly<FutureChatQueuedActionsByThreadId>,
	threadId: string,
	nextActions: ReadonlyArray<FutureChatQueuedAction>,
): FutureChatQueuedActionsByThreadId {
	if (!threadId || nextActions.length === 0) {
		return { ...state };
	}

	return {
		...state,
		[threadId]: [...(state[threadId] ?? []), ...nextActions],
	};
}

export function removeFutureChatQueuedAction(
	state: Readonly<FutureChatQueuedActionsByThreadId>,
	threadId: string,
	actionId: string,
): FutureChatQueuedActionsByThreadId {
	if (!threadId || !actionId) {
		return { ...state };
	}

	const existingActions = state[threadId] ?? [];
	const nextActions = existingActions.filter((action) => action.id !== actionId);
	if (nextActions.length === existingActions.length) {
		return { ...state };
	}

	if (nextActions.length === 0) {
		const nextState = { ...state };
		delete nextState[threadId];
		return nextState;
	}

	return {
		...state,
		[threadId]: nextActions,
	};
}

export function clearFutureChatQueuedActions(
	state: Readonly<FutureChatQueuedActionsByThreadId>,
	threadId: string,
): FutureChatQueuedActionsByThreadId {
	if (!threadId || !(threadId in state)) {
		return { ...state };
	}

	const nextState = { ...state };
	delete nextState[threadId];
	return nextState;
}

export function peekFutureChatQueuedAction(
	state: Readonly<FutureChatQueuedActionsByThreadId>,
	threadId: string,
): FutureChatQueuedAction | null {
	return state[threadId]?.[0] ?? null;
}

export function shiftFutureChatQueuedAction(
	state: Readonly<FutureChatQueuedActionsByThreadId>,
	threadId: string,
): {
	action: FutureChatQueuedAction | null;
	state: FutureChatQueuedActionsByThreadId;
} {
	const existingActions = state[threadId] ?? [];
	const nextAction = existingActions[0] ?? null;
	if (!nextAction) {
		return {
			action: null,
			state: { ...state },
		};
	}

	if (existingActions.length === 1) {
		const nextState = { ...state };
		delete nextState[threadId];
		return {
			action: nextAction,
			state: nextState,
		};
	}

	return {
		action: nextAction,
		state: {
			...state,
			[threadId]: existingActions.slice(1),
		},
	};
}
