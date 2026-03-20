export type FutureChatAgentMode = "ask" | "default";

export function buildFutureChatCancelUrl(threadId?: string | null): string {
	return threadId
		? `/api/chat-cancel?threadId=${encodeURIComponent(threadId)}`
		: "/api/chat-cancel";
}

export function buildFutureChatAgentModeRequest(input: {
	mode: FutureChatAgentMode;
}): {
	mode: FutureChatAgentMode;
} {
	return {
		mode: input.mode,
	};
}

export function parseFutureChatAgentMode(
	value: unknown,
): FutureChatAgentMode | null {
	if (
		value === "ask"
		|| value === "default"
	) {
		return value;
	}

	return null;
}

export async function fetchFutureChatAgentMode(
	fetchImpl: typeof fetch,
): Promise<FutureChatAgentMode | null> {
	const response = await fetchImpl("/api/agent-mode", {
		method: "GET",
	});
	if (!response.ok) {
		throw new Error(`Agent mode request failed with status ${response.status}`);
	}

	const payload = (await response.json()) as {
		mode?: unknown;
	};
	return parseFutureChatAgentMode(payload.mode);
}
