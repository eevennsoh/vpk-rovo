export type RovoAppAgentMode = "ask" | "default" | "plan";

export function buildRovoAppCancelUrl(threadId?: string | null): string {
	return threadId
		? `/api/chat-cancel?threadId=${encodeURIComponent(threadId)}`
		: "/api/chat-cancel";
}

export function buildRovoAppAgentModeRequest(input: {
	mode: RovoAppAgentMode;
}): {
	mode: RovoAppAgentMode;
} {
	return {
		mode: input.mode,
	};
}

export function parseRovoAppAgentMode(
	value: unknown,
): RovoAppAgentMode | null {
	if (
		value === "ask"
		|| value === "default"
		|| value === "plan"
	) {
		return value;
	}

	return null;
}

export async function fetchRovoAppAgentMode(
	fetchImpl: typeof fetch,
): Promise<RovoAppAgentMode | null> {
	const response = await fetchImpl("/api/agent-mode", {
		method: "GET",
	});
	if (!response.ok) {
		throw new Error(`Agent mode request failed with status ${response.status}`);
	}

	const payload = (await response.json()) as {
		mode?: unknown;
	};
	return parseRovoAppAgentMode(payload.mode);
}
