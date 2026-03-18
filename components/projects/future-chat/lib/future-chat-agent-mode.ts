export type FutureChatAgentMode = "ask" | "default" | "plan";

export function getFutureChatPortRoutingPayload(portIndex?: number): {
	portIndex?: number;
} {
	return typeof portIndex === "number" && Number.isInteger(portIndex) && portIndex >= 0
		? { portIndex }
		: {};
}

export function buildFutureChatCancelUrl(portIndex?: number): string {
	const payload = getFutureChatPortRoutingPayload(portIndex);
	return typeof payload.portIndex === "number"
		? `/api/chat-cancel?portIndex=${encodeURIComponent(String(payload.portIndex))}`
		: "/api/chat-cancel";
}

export function buildFutureChatAgentModeRequest(input: {
	mode: FutureChatAgentMode;
	portIndex?: number;
}): {
	mode: FutureChatAgentMode;
	portIndex?: number;
} {
	return {
		mode: input.mode,
		...getFutureChatPortRoutingPayload(input.portIndex),
	};
}

export function buildFutureChatAgentModeUrl(portIndex?: number): string {
	const payload = getFutureChatPortRoutingPayload(portIndex);
	return typeof payload.portIndex === "number"
		? `/api/agent-mode?portIndex=${encodeURIComponent(String(payload.portIndex))}`
		: "/api/agent-mode";
}

export function parseFutureChatAgentMode(
	value: unknown,
): FutureChatAgentMode | null {
	if (
		value === "ask"
		|| value === "default"
		|| value === "plan"
	) {
		return value;
	}

	return null;
}

export async function fetchFutureChatAgentMode(
	fetchImpl: typeof fetch,
	portIndex?: number,
): Promise<FutureChatAgentMode | null> {
	const response = await fetchImpl(buildFutureChatAgentModeUrl(portIndex), {
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
