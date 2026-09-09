/**
 * Pure row model for the Details rail "assigned agents" menu.
 *
 * Turns the crew roster plus live session state into one row per assigned
 * agent. Status resolution is delegated to `agent-row-status` so the menu row,
 * the trigger avatar tooltip, and the byline can never disagree.
 */

import type { AgentAssignmentStatusKind } from "@/components/blocks/agent-assignment/components/assigned-agent-status";
import type { CrewMember } from "@/components/blocks/jira-work-item/data/metadata-crew";
import type {
	AgentSession,
	AgentSessionStatus,
	StaticTimelineEvent,
} from "@/components/blocks/jira-work-item/data/session-state";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import {
	agentRowStatusTooltip,
	resolveAgentRowSessionStatus,
	type AgentRowStatusTooltip,
} from "./agent-row-status";

export interface AssignedAgentRow {
	agentId: string;
	name: string;
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
	/** Last session in `sessions` matching the agent; absent when the agent never ran. */
	session?: AgentSession;
	statusKind: AgentAssignmentStatusKind;
	statusLabel: AgentRowStatusTooltip;
}

function toAssignmentStatusKind(status: AgentSessionStatus): AgentAssignmentStatusKind {
	switch (status) {
		case "running":
			return "working";
		case "waiting":
			return "needs-input";
		case "completed":
			return "finished";
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

/** Later sessions win, matching `resolveAgentRowSessionStatus`. */
export function resolveLatestAgentSession(
	sessions: readonly AgentSession[],
	agentId: string,
): AgentSession | undefined {
	let latest: AgentSession | undefined;
	for (const session of sessions) {
		if (session.agentId === agentId) {
			latest = session;
		}
	}
	return latest;
}

/** Distinct directory agents that already have a session on this work item. */
export function resolveUsedAgentIds(sessions: readonly AgentSession[]): readonly string[] {
	const usedAgentIds: string[] = [];
	const seen = new Set<string>();
	for (const session of sessions) {
		if (session.agentId.startsWith("skill:") || seen.has(session.agentId)) {
			continue;
		}
		seen.add(session.agentId);
		usedAgentIds.push(session.agentId);
	}
	return usedAgentIds;
}

export function resolveAssignedAgentRows(
	members: readonly CrewMember[],
	sessions: readonly AgentSession[],
	staticEvents: readonly StaticTimelineEvent[] = [],
): AssignedAgentRow[] {
	const rows: AssignedAgentRow[] = [];
	for (const member of members) {
		if (member.kind !== "agent") {
			continue;
		}
		const session = resolveLatestAgentSession(sessions, member.id);
		const sessionStatus = resolveAgentRowSessionStatus(sessions, member.id, staticEvents);
		rows.push({
			agentId: member.id,
			name: member.name,
			...(member.avatarUrl ? { avatarSrc: member.avatarUrl } : {}),
			...(member.brandName ? { brandName: member.brandName } : {}),
			...(session ? { session } : {}),
			statusKind: toAssignmentStatusKind(sessionStatus),
			statusLabel: agentRowStatusTooltip(sessions, member.id, staticEvents),
		});
	}
	return rows;
}
