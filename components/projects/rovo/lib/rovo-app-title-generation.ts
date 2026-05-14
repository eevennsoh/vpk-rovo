export function getPendingRovoAppTitleRequest(input: {
	pendingTitleMessage: string | null;
	pendingTitleThreadId: string | null;
	pendingTitleThreadIdRef: string | null;
}): {
	message: string;
	threadId: string;
} | null {
	if (!input.pendingTitleThreadId || !input.pendingTitleMessage) {
		return null;
	}

	if (input.pendingTitleThreadIdRef !== input.pendingTitleThreadId) {
		return null;
	}

	return {
		threadId: input.pendingTitleThreadId,
		message: input.pendingTitleMessage,
	};
}

export function shouldDeferRovoAppTitlePersistence(input: {
	activeThreadId: string | null;
	isGeneratingTitle: boolean;
	pendingTitleThreadId: string | null;
}): boolean {
	return (
		input.isGeneratingTitle
		&& input.activeThreadId !== null
		&& input.pendingTitleThreadId === input.activeThreadId
	);
}
