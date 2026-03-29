"use client";

import { createContext, use, useCallback, useMemo, useRef, useState } from "react";
import type { FutureChatQueuedAction } from "@/lib/future-chat-types";
import {
	appendFutureChatQueuedActions,
	clearFutureChatQueuedActions,
	type FutureChatQueuedActionsByThreadId,
	peekFutureChatQueuedAction,
	removeFutureChatQueuedAction,
	shiftFutureChatQueuedAction,
} from "@/components/projects/future-chat/lib/future-chat-queue-state";

interface FutureChatQueueContextValue {
	appendQueuedActionsForThread: (
		threadId: string,
		nextActions: ReadonlyArray<FutureChatQueuedAction>,
	) => void;
	clearQueuedActionsForThread: (threadId: string) => void;
	enqueueQueuedAction: (action: FutureChatQueuedAction) => void;
	queuedActionsByThreadId: FutureChatQueuedActionsByThreadId;
	removeQueuedAction: (threadId: string, actionId: string) => void;
	peekNextQueuedActionForThread: (
		threadId: string,
	) => FutureChatQueuedAction | null;
	shiftNextQueuedActionForThread: (
		threadId: string,
	) => FutureChatQueuedAction | null;
}

const FutureChatQueueContext =
	createContext<FutureChatQueueContextValue | null>(null);

export function FutureChatQueueProvider({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const [queuedActionsByThreadId, setQueuedActionsByThreadId] =
		useState<FutureChatQueuedActionsByThreadId>({});
	const queuedActionsRef =
		useRef<FutureChatQueuedActionsByThreadId>(queuedActionsByThreadId);

	const commitQueuedActions = useCallback(
		(nextState: FutureChatQueuedActionsByThreadId) => {
			queuedActionsRef.current = nextState;
			setQueuedActionsByThreadId(nextState);
		},
		[],
	);

	const appendQueuedActionsForThread = useCallback(
		(
			threadId: string,
			nextActions: ReadonlyArray<FutureChatQueuedAction>,
		) => {
			commitQueuedActions(
				appendFutureChatQueuedActions(
					queuedActionsRef.current,
					threadId,
					nextActions,
				),
			);
		},
		[commitQueuedActions],
	);

	const enqueueQueuedAction = useCallback(
		(action: FutureChatQueuedAction) => {
			appendQueuedActionsForThread(action.threadId, [action]);
		},
		[appendQueuedActionsForThread],
	);

	const removeQueuedAction = useCallback(
		(threadId: string, actionId: string) => {
			commitQueuedActions(
				removeFutureChatQueuedAction(
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
				clearFutureChatQueuedActions(queuedActionsRef.current, threadId),
			);
		},
		[commitQueuedActions],
	);

	const peekNextQueuedActionForThread = useCallback((threadId: string) => {
		return peekFutureChatQueuedAction(queuedActionsRef.current, threadId);
	}, []);

	const shiftNextQueuedActionForThread = useCallback((threadId: string) => {
		const nextResult = shiftFutureChatQueuedAction(
			queuedActionsRef.current,
			threadId,
		);
		commitQueuedActions(nextResult.state);
		return nextResult.action;
	}, [commitQueuedActions]);

	const value = useMemo<FutureChatQueueContextValue>(() => ({
		appendQueuedActionsForThread,
		clearQueuedActionsForThread,
		enqueueQueuedAction,
		peekNextQueuedActionForThread,
		queuedActionsByThreadId,
		removeQueuedAction,
		shiftNextQueuedActionForThread,
	}), [
		appendQueuedActionsForThread,
		clearQueuedActionsForThread,
		enqueueQueuedAction,
		peekNextQueuedActionForThread,
		queuedActionsByThreadId,
		removeQueuedAction,
		shiftNextQueuedActionForThread,
	]);

	return (
		<FutureChatQueueContext value={value}>
			{children}
		</FutureChatQueueContext>
	);
}

export function FutureChatQueueBoundary({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const value = use(FutureChatQueueContext);
	if (value) {
		return children;
	}

	return <FutureChatQueueProvider>{children}</FutureChatQueueProvider>;
}

export function useFutureChatQueue() {
	const value = use(FutureChatQueueContext);
	if (!value) {
		throw new Error("useFutureChatQueue must be used within FutureChatQueueProvider.");
	}

	return value;
}
