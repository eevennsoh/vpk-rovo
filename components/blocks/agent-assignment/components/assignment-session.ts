import type { AgentAssignmentAgent } from "@/components/blocks/agent-assignment/components/agent-assignment";
import {
	resolveAssignedAgentStatusKind,
	type AgentAssignmentStatusKind,
} from "@/components/blocks/agent-assignment/components/assigned-agent-status";
import type { AgentListInvoker } from "@/components/blocks/agent-list/agent-list-types";
import type { JiraIssueAgentActivity } from "@/components/blocks/jira-issue/agent-activity";
import type { AgentSessionItem } from "@/components/blocks/agent-session/agent-session-types";

const DEFAULT_ASSIGNMENT_INVOKER = {
	avatarSrc: "/avatar-user/ting-chen/color/asow-teamwork-blue.png",
	name: "Priya Raman",
} as const satisfies AgentListInvoker;

export type AgentAssignmentVariant = "default" | "simple";

function assignmentSessionState(
	kind: AgentAssignmentStatusKind,
): AgentSessionItem["state"] {
	switch (kind) {
		case "working":
			return "running";
		case "needs-input":
			return "needs-input";
		case "finished":
		case "idle":
			return "complete";
		default: {
			const exhaustiveKind: never = kind;
			return exhaustiveKind;
		}
	}
}

function assignmentActivityState(
	kind: AgentAssignmentStatusKind,
): JiraIssueAgentActivity["state"] {
	switch (kind) {
		case "working":
			return "working";
		case "needs-input":
			return "awaiting-input";
		case "finished":
		case "idle":
			return "completed";
		default: {
			const exhaustiveKind: never = kind;
			return exhaustiveKind;
		}
	}
}

function assignmentActivityLabel(kind: AgentAssignmentStatusKind, agent: AgentAssignmentAgent): string {
	switch (kind) {
		case "working":
			return "Working";
		case "needs-input":
			return "Needs input";
		case "finished":
			return "Finished";
		case "idle":
			return agent.statusLabel.trim() || "Assigned";
		default: {
			const exhaustiveKind: never = kind;
			return exhaustiveKind;
		}
	}
}

/** Maps an assigned agent onto the Agent Session long-row model. */
export function toAssignmentSessionItem(agent: AgentAssignmentAgent): AgentSessionItem {
	const statusKind = resolveAssignedAgentStatusKind(agent);

	return {
		agent: {
			id: agent.id,
			kind: "agent",
			name: agent.name,
			...(agent.avatarSrc ? { avatarSrc: agent.avatarSrc } : {}),
			...(agent.brandName ? { brandName: agent.brandName } : {}),
		},
		id: agent.id,
		invokedBy: agent.invokedBy ?? DEFAULT_ASSIGNMENT_INVOKER,
		state: assignmentSessionState(statusKind),
		title: agent.name,
		...(agent.host !== undefined ? { host: agent.host } : {}),
		...(agent.role !== undefined ? { role: agent.role } : {}),
	};
}

/** Maps an assigned agent onto the Jira issue activity-row model. */
export function toAssignmentActivity(agent: AgentAssignmentAgent): JiraIssueAgentActivity {
	const statusKind = resolveAssignedAgentStatusKind(agent);

	return {
		id: agent.id,
		name: agent.name,
		label: assignmentActivityLabel(statusKind, agent),
		state: assignmentActivityState(statusKind),
		...(agent.avatarSrc ? { avatarSrc: agent.avatarSrc } : {}),
		...(agent.brandName ? { agentBrandName: agent.brandName } : {}),
		...(statusKind === "working" && agent.statusSequence
			? { labels: agent.statusSequence }
			: {}),
	};
}
