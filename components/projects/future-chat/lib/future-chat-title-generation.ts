export function getPendingFutureChatTitleRequest(input: {
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
