export function getFutureChatPortRoutingPayload(portIndex?: number): {
	portIndex?: number;
} {
	return typeof portIndex === "number" && Number.isInteger(portIndex) && portIndex >= 0
		? { portIndex }
		: {};
}

export function buildFutureChatAgentModeRequest(input: {
	mode: "ask" | "default" | "plan";
	portIndex?: number;
}): {
	mode: "ask" | "default" | "plan";
	portIndex?: number;
} {
	return {
		mode: input.mode,
		...getFutureChatPortRoutingPayload(input.portIndex),
	};
}
