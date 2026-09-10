import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import {
	type AgentAssignmentAgent,
	type AgentAssignmentStatusKind,
} from "@/components/blocks/agent-assignment";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";

export const INITIAL_ASSIGNED_AGENT_IDS = [
	"github-copilot",
	"release-notes-drafter",
	"code-reviewer",
	"readiness-checker",
] as const;

export const DEMO_USED_AGENT_IDS = [
	"github-copilot",
	"release-notes-drafter",
] as const;

interface DemoAgentState {
	statusKind: AgentAssignmentStatusKind;
	statusLabel: string;
	status?: string;
	intervalMs?: number;
	jitterMs?: number;
	labels?: readonly string[];
}

const DEMO_AGENT_STATES: Readonly<Record<string, DemoAgentState>> = {
	"github-copilot": {
		statusKind: "working",
		statusLabel: "Running",
		intervalMs: 1700,
		jitterMs: 1900,
		labels: [
			"Inspecting changed files",
			"Tracing affected call sites",
			"Checking the proposed patch across every changed file in this review",
		],
	},
	"release-notes-drafter": {
		statusKind: "needs-input",
		statusLabel: "Needs input",
		status: "Needs input",
	},
	"code-reviewer": {
		statusKind: "idle",
		statusLabel: "Idle",
	},
	"readiness-checker": {
		statusKind: "idle",
		statusLabel: "Idle",
	},
};

function getDemoAssignedAgent(agent: AgentSelectorAgent): AgentAssignmentAgent {
	const demoStatus = DEMO_AGENT_STATES[agent.id] ?? {
		statusKind: "idle" as const,
		statusLabel: "Idle",
	};

	return {
		...agent,
		statusKind: demoStatus.statusKind,
		statusLabel: demoStatus.statusLabel,
		...(demoStatus.status ? { status: demoStatus.status } : {}),
		...(demoStatus.labels ? {
			statusSequence: demoStatus.labels,
			statusCycleIntervalMs: demoStatus.intervalMs,
			statusCycleJitterMs: demoStatus.jitterMs,
		} : {}),
	};
}

export function getAgentAssignmentDemoAssignedAgents(
	assignedAgentIds: readonly string[] = INITIAL_ASSIGNED_AGENT_IDS,
	options: { codeReviewerFinished?: boolean } = {},
): AgentAssignmentAgent[] {
	return assignedAgentIds.flatMap((agentId): AgentAssignmentAgent[] => {
		const agent = ROVO_AGENT_SELECTOR_AGENTS.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return [];
		}
		const assigned = getDemoAssignedAgent(agent);
		if (agent.id === "code-reviewer" && options.codeReviewerFinished) {
			return [{
				...assigned,
				status: "Finished",
				statusKind: "finished",
				statusLabel: "Finished",
			}];
		}
		return [assigned];
	});
}
