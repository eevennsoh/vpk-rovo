"use client";

import { createContext, use, useCallback, useMemo, useRef, useState } from "react";
import type { RovoAppQueuedAction } from "@/lib/rovo-app-types";
import {
	appendRovoAppQueuedActions,
	clearRovoAppQueuedActions,
	type RovoAppQueuedActionsByThreadId,
	peekRovoAppQueuedAction,
	prependRovoAppQueuedAction,
	removeRovoAppQueuedAction,
	shiftRovoAppQueuedAction,
} from "@/components/projects/rovo/lib/rovo-app-queue-state";

interface RovoAppQueueContextValue {
	appendQueuedActionsForThread: (
		threadId: string,
		nextActions: ReadonlyArray<RovoAppQueuedAction>,
	) => void;
	clearQueuedActionsForThread: (threadId: string) => void;
	enqueueQueuedAction: (action: RovoAppQueuedAction) => void;
	prependQueuedAction: (action: RovoAppQueuedAction) => void;
	queuedActionsByThreadId: RovoAppQueuedActionsByThreadId;
	removeQueuedAction: (threadId: string, actionId: string) => void;
	peekNextQueuedActionForThread: (
		threadId: string,
	) => RovoAppQueuedAction | null;
	shiftNextQueuedActionForThread: (
		threadId: string,
	) => RovoAppQueuedAction | null;
}

const RovoAppQueueContext =
	createContext<RovoAppQueueContextValue | null>(null);

export function RovoAppQueueProvider({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const [queuedActionsByThreadId, setQueuedActionsByThreadId] =
		useState<RovoAppQueuedActionsByThreadId>({});
	const queuedActionsRef =
		useRef<RovoAppQueuedActionsByThreadId>(queuedActionsByThreadId);

	const commitQueuedActions = useCallback(
		(nextState: RovoAppQueuedActionsByThreadId) => {
			queuedActionsRef.current = nextState;
			setQueuedActionsByThreadId(nextState);
		},
		[],
	);

	const appendQueuedActionsForThread = useCallback(
		(
			threadId: string,
			nextActions: ReadonlyArray<RovoAppQueuedAction>,
		) => {
			commitQueuedActions(
				appendRovoAppQueuedActions(
					queuedActionsRef.current,
					threadId,
					nextActions,
				),
			);
		},
		[commitQueuedActions],
	);

	const enqueueQueuedAction = useCallback(
		(action: RovoAppQueuedAction) => {
			appendQueuedActionsForThread(action.threadId, [action]);
		},
		[appendQueuedActionsForThread],
	);

	const prependQueuedAction = useCallback(
		(action: RovoAppQueuedAction) => {
			commitQueuedActions(
				prependRovoAppQueuedAction(
					queuedActionsRef.current,
					action.threadId,
					action,
				),
			);
		},
		[commitQueuedActions],
	);

	const removeQueuedAction = useCallback(
		(threadId: string, actionId: string) => {
			commitQueuedActions(
				removeRovoAppQueuedAction(
					queuedActionsRef.current,
					threadId,
					actionId,
				),
			);
		},
		[commitQueuedActions],
	);

	const clearQueuedActionsForThread = useCallback(
		(threadId: string) => {
			commitQueuedActions(
				clearRovoAppQueuedActions(queuedActionsRef.current, threadId),
			);
		},
		[commitQueuedActions],
	);

	const peekNextQueuedActionForThread = useCallback((threadId: string) => {
		return peekRovoAppQueuedAction(queuedActionsRef.current, threadId);
	}, []);

	const shiftNextQueuedActionForThread = useCallback((threadId: string) => {
		const nextResult = shiftRovoAppQueuedAction(
			queuedActionsRef.current,
			threadId,
		);
		commitQueuedActions(nextResult.state);
		return nextResult.action;
	}, [commitQueuedActions]);

	const value = useMemo<RovoAppQueueContextValue>(() => ({
		appendQueuedActionsForThread,
		clearQueuedActionsForThread,
		enqueueQueuedAction,
		peekNextQueuedActionForThread,
		prependQueuedAction,
		queuedActionsByThreadId,
		removeQueuedAction,
		shiftNextQueuedActionForThread,
	}), [
		appendQueuedActionsForThread,
		clearQueuedActionsForThread,
		enqueueQueuedAction,
		peekNextQueuedActionForThread,
		prependQueuedAction,
		queuedActionsByThreadId,
		removeQueuedAction,
		shiftNextQueuedActionForThread,
	]);

	return (
		<RovoAppQueueContext value={value}>
			{children}
		</RovoAppQueueContext>
	);
}

export function RovoAppQueueBoundary({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const value = use(RovoAppQueueContext);
	if (value) {
		return children;
	}

	return <RovoAppQueueProvider>{children}</RovoAppQueueProvider>;
}

export function useRovoAppQueue() {
	const value = use(RovoAppQueueContext);
	if (!value) {
		throw new Error("useRovoAppQueue must be used within RovoAppQueueProvider.");
	}

	return value;
}
