import type { AgentListAgent, AgentListInvoker } from "@/components/blocks/agent-list";

import type { AgentSessionItem } from "./agent-session-types";

/**
 * "Claude with Annie" — the agent that ran the session and the human who
 * invoked it, as one string.
 *
 * The medium card spends this on accessible names only; the drag chip prints
 * it. Both must read identically, so the sentence lives here rather than being
 * rebuilt per surface. Sessions with no invoker degrade to the agent name.
 */
export function agentIdentityLabel(
	agent: AgentListAgent,
	attributedBy?: AgentListInvoker,
): string {
	return attributedBy === undefined ? agent.name : `${agent.name} with ${attributedBy.name}`;
}

/** `agentIdentityLabel` for a session row. */
export function agentSessionIdentityLabel(item: AgentSessionItem): string {
	return agentIdentityLabel(item.agent, item.invokedBy);
}
