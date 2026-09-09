import type {
	AgentSession,
	AgentSessionStatus,
	StaticTimelineEvent,
} from "@/components/blocks/jira-work-item/data/session-state";

export const AGENT_ROW_STATUS_TOOLTIP = {
	running: "Working",
	waiting: "Needs input",
	completed: "Finished",
} as const satisfies Record<AgentSessionStatus, string>;

export type AgentRowStatusTooltip = (typeof AGENT_ROW_STATUS_TOOLTIP)[AgentSessionStatus];

/**
 * Live session status wins (later sessions overwrite). Completed changed-files
 * outputs cover agents that finished without a remaining session. Assigned
 * agents with neither still read as Working.
 */
export function resolveAgentRowSessionStatus(
	sessions: readonly Pick<AgentSession, "agentId" | "status">[],
	agentId: string,
	staticEvents: readonly StaticTimelineEvent[] = [],
): AgentSessionStatus {
	let status: AgentSessionStatus | undefined;
	for (const session of sessions) {
		if (session.agentId === agentId) {
			status = session.status;
		}
	}
	if (status) {
		return status;
	}
	for (const event of staticEvents) {
		if (event.kind === "changed-files" && event.sessionItem?.state === "complete") {
			const actorId = event.actor.id.replace(/^static-/u, "");
			if (actorId === agentId) {
				return "completed";
			}
		}
	}
	return "running";
}

export function agentRowStatusTooltip(
	sessions: readonly Pick<AgentSession, "agentId" | "status">[],
	agentId: string,
	staticEvents: readonly StaticTimelineEvent[] = [],
): AgentRowStatusTooltip {
	return AGENT_ROW_STATUS_TOOLTIP[resolveAgentRowSessionStatus(sessions, agentId, staticEvents)];
}
