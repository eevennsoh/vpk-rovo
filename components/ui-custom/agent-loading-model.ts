export type AgentLoadingStatus = "working" | "finished";
export type AgentLoadingSlotName = "front" | "back" | "hidden";
export type AgentLoadingSize = "default" | "small";

export interface AgentLoadingStateful {
	status: AgentLoadingStatus;
}

export interface AgentLoadingSlots<T> {
	front: T;
	back: T | null;
	hidden: T | null;
}

export interface AgentLoadingSlottedAgent<T> {
	agent: T;
	slot: AgentLoadingSlotName;
}

export interface AgentLoadingSlotStyle {
	opacity: number;
	scale: number;
	x: number;
	y: number;
	zIndex: number;
}

/** Authored 24×24 Ferris canvas. The small variant scales this geometry to 16×16. */
export const AGENT_LOADING_CANVAS_PX = 24;
export const AGENT_LOADING_SIZE_PX = {
	default: 24,
	small: 16,
} as const satisfies Record<AgentLoadingSize, number>;

export function areAllAgentLoadingAgentsFinished(
	agents: readonly AgentLoadingStateful[],
): boolean {
	return agents.length > 0 && agents.every((agent) => agent.status === "finished");
}

export function shouldCycleAgentLoading(
	agents: readonly AgentLoadingStateful[],
): boolean {
	return agents.length > 1 && !areAllAgentLoadingAgentsFinished(agents);
}

export function getAgentLoadingSlots<T>(
	agents: readonly T[],
	frontIndex: number,
): AgentLoadingSlots<T> | null {
	if (agents.length < 2) return null;

	const normalizedIndex = ((frontIndex % agents.length) + agents.length) % agents.length;

	return {
		front: agents[normalizedIndex],
		back: agents.length > 1 ? agents[(normalizedIndex + 1) % agents.length] : null,
		hidden: agents.length > 2 ? agents[(normalizedIndex + 2) % agents.length] : null,
	};
}

export function listAgentLoadingSlots<T>(
	slots: AgentLoadingSlots<T>,
): readonly AgentLoadingSlottedAgent<T>[] {
	const listed: AgentLoadingSlottedAgent<T>[] = [];

	if (slots.hidden) {
		listed.push({ agent: slots.hidden, slot: "hidden" });
	}

	if (slots.back) {
		listed.push({ agent: slots.back, slot: "back" });
	}

	listed.push({ agent: slots.front, slot: "front" });

	return listed;
}

export function getAgentLoadingSlotStyle(slot: AgentLoadingSlotName): AgentLoadingSlotStyle {
	switch (slot) {
		case "front":
			return { x: 0, y: 0, scale: 1, opacity: 1, zIndex: 3 };
		case "back":
			return { x: 12, y: 12, scale: 0.75, opacity: 0.8, zIndex: 2 };
		case "hidden":
			return { x: 0, y: 20, scale: 0.25, opacity: 0, zIndex: 1 };
		default: {
			const exhaustive: never = slot;
			throw new Error(`Unhandled agent loading slot: ${String(exhaustive)}`);
		}
	}
}
