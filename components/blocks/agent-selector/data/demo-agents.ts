import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import {
	AI_INSIGHTS_AGENT_ID,
	ROVO_AGENT_ID,
	ROVO_AGENT_SELECTOR_AGENTS,
	ROVO_CUSTOM_AGENT_SELECTOR_AGENTS,
} from "@/components/projects/rovo/data/agent-profiles";

const DEFAULT_AGENT_SELECTOR_ORDER = [
	"github-copilot",
	ROVO_AGENT_ID,
	"readiness-checker",
	"figma",
	"canva",
	"code-reviewer",
	"pipeline-troubleshooter",
	"meeting-insights-reporter",
	"product-requirements-guide",
	"feedback-analyzer",
	"notion",
	"slack",
	"google-drive",
] as const;

const CUSTOM_AGENT_SELECTOR_ORDER = [
	AI_INSIGHTS_AGENT_ID,
	"untitled-agent",
	"meeting-insights-reporter",
	"chatgpt-wrapper-app",
	"social-media-writer",
	"progress-tracker",
	"transcript-insights-reporter",
	"product-requirements-guide",
] as const;

function orderAgents(
	agents: readonly AgentSelectorAgent[],
	orderedIds: readonly string[],
): readonly AgentSelectorAgent[] {
	const agentById = new Map(agents.map((agent) => [agent.id, agent]));

	return orderedIds
		.map((agentId) => agentById.get(agentId))
		.filter((agent): agent is AgentSelectorAgent => Boolean(agent));
}

export const AGENT_SELECTOR_DEMO_AGENTS: readonly AgentSelectorAgent[] = orderAgents(
	ROVO_AGENT_SELECTOR_AGENTS,
	DEFAULT_AGENT_SELECTOR_ORDER,
);

export const AGENT_SELECTOR_CUSTOM_AGENT_DEMO_AGENTS: readonly AgentSelectorAgent[] = orderAgents(
	ROVO_CUSTOM_AGENT_SELECTOR_AGENTS,
	CUSTOM_AGENT_SELECTOR_ORDER,
);
