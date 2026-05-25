import type { RovoAppQueuedAction } from "@/lib/rovo-app-types";

export type RovoAppQueuedActionsByThreadId = Record<
	string,
	RovoAppQueuedAction[]
>;

export function appendRovoAppQueuedActions(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
	nextActions: ReadonlyArray<RovoAppQueuedAction>,
): RovoAppQueuedActionsByThreadId {
	if (!threadId || nextActions.length === 0) {
		return { ...state };
	}

	return {
		...state,
		[threadId]: [...(state[threadId] ?? []), ...nextActions],
	};
}

export function prependRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
	action: RovoAppQueuedAction,
): RovoAppQueuedActionsByThreadId {
	if (!threadId) {
		return { ...state };
	}

	return {
		...state,
		[threadId]: [action, ...(state[threadId] ?? [])],
	};
}

export function removeRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
	actionId: string,
): RovoAppQueuedActionsByThreadId {
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

export function clearRovoAppQueuedActions(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
): RovoAppQueuedActionsByThreadId {
	if (!threadId || !(threadId in state)) {
		return { ...state };
	}

	const nextState = { ...state };
	delete nextState[threadId];
	return nextState;
}

export function peekRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
): RovoAppQueuedAction | null {
	return state[threadId]?.[0] ?? null;
}

export function shiftRovoAppQueuedAction(
	state: Readonly<RovoAppQueuedActionsByThreadId>,
	threadId: string,
): {
	action: RovoAppQueuedAction | null;
	state: RovoAppQueuedActionsByThreadId;
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
