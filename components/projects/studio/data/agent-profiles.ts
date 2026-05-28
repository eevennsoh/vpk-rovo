import AiChatIcon from "@atlaskit/icon/core/ai-chat";

import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";
import type { RovoSuggestion } from "@/lib/rovo-suggestions";

export const ROVO_AGENT_ID = "rovo-dev";
export const AI_INSIGHTS_AGENT_ID = "ai-insights-agent";

export interface RovoAgentProfile extends AgentSelectorAgent {
	description?: string;
	starters: readonly RovoSuggestion[];
	contextDescription?: string;
}

const EMPTY_STARTERS: readonly RovoSuggestion[] = [];

function createStarter(id: string, label: string, prompt = label): RovoSuggestion {
	return {
		id,
		label,
		prompt,
		icon: AiChatIcon,
		type: "skill",
	};
}

function createDefaultStarters(agentId: string, agentName: string): readonly RovoSuggestion[] {
	return [
		createStarter(`${agentId}-overview`, `Ask ${agentName} for an overview`),
		createStarter(`${agentId}-summary`, `Summarize this with ${agentName}`),
		createStarter(`${agentId}-next-steps`, `Get ${agentName}'s recommended next steps`),
	];
}

function createAgentContext(params: {
	byline: string;
	description?: string;
	name: string;
}): string {
	return [
		"[Selected custom agent]",
		`Agent: ${params.name}`,
		`Byline: ${params.byline}`,
		params.description ? `Description: ${params.description}` : null,
		"Answer as this selected agent while using the existing Rovo chat capabilities and available context.",
		"[End selected custom agent]",
	]
		.filter((line): line is string => Boolean(line))
		.join("\n");
}

function createProfile(params: Omit<RovoAgentProfile, "contextDescription" | "starters"> & {
	contextDescription?: string;
	starters?: readonly RovoSuggestion[];
}): RovoAgentProfile {
	const starters = params.starters ?? createDefaultStarters(params.id, params.name);
	const contextDescription = params.id === ROVO_AGENT_ID
		? undefined
		: params.contextDescription ?? createAgentContext({
				byline: params.byline,
				description: params.description,
				name: params.name,
			});

	return {
		...params,
		contextDescription,
		starters,
	};
}

const AI_INSIGHTS_DESCRIPTION =
	"Researches and summarizes latest AI trends, breakthroughs, and industry developments for weekly insights.";

export const ROVO_AGENT_PROFILES: readonly RovoAgentProfile[] = [
	createProfile({
		id: "github-copilot",
		name: "GitHub Copilot",
		byline: "Agent by GitHub",
		avatarSrc: "/3p/github/24.svg",
		description: "Helps review code, explain repository changes, and suggest implementation paths.",
	}),
	createProfile({
		id: "release-notes-drafter",
		name: "Release Notes Drafter",
		byline: "Custom agent by Diego Alvarez",
		avatarSrc: "/avatar-agent/teamwork-agents/release-notes-drafter.svg",
		description: "Turns merged changes and tickets into clear, customer-ready release notes.",
	}),
	createProfile({
		id: ROVO_AGENT_ID,
		name: "Rovo Dev",
		byline: "by Atlassian",
		avatarSrc: "/1p/rovo.svg",
		starters: EMPTY_STARTERS,
	}),
	createProfile({
		id: "readiness-checker",
		name: "Readiness Checker",
		byline: "Rovo agent by Enterprise Solutions",
		avatarSrc: "/avatar-agent/teamwork-agents/readiness-checker.svg",
		description: "Checks plans, launches, and work items for readiness gaps before handoff.",
	}),
	createProfile({
		id: "figma",
		name: "Figma",
		byline: "by Figma",
		avatarSrc: "/3p/figma/24.svg",
		description: "Finds design context, summarizes frames, and helps connect UI work to design intent.",
	}),
	createProfile({
		id: "canva",
		name: "Canva",
		byline: "by Canva",
		avatarSrc: "/3p/canva/24.svg",
		description: "Helps draft visual assets, campaign ideas, and design-ready content.",
	}),
	createProfile({
		id: "code-reviewer",
		name: "Code Reviewer",
		byline: "Dev agent by Atlassian",
		avatarSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
		description: "Reviews changes for correctness, maintainability, and test coverage.",
	}),
	createProfile({
		id: "pipeline-troubleshooter",
		name: "Pipeline Troubleshooter",
		byline: "Dev agent by Atlassian",
		avatarSrc: "/avatar-agent/dev-agents/pipeline-troubleshooter.svg",
		description: "Diagnoses failing builds, deployment issues, and CI configuration problems.",
	}),
	createProfile({
		id: "meeting-insights-reporter",
		name: "Meeting Insights Reporter",
		byline: "Teamwork agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/meeting-insights-reporter.svg",
		description: "Turns meeting notes and transcripts into summaries, decisions, and follow-ups.",
	}),
	createProfile({
		id: "product-requirements-guide",
		name: "Product Requirements Guide",
		byline: "Teamwork agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/product-requirements-guide.svg",
		description: "Helps shape goals, requirements, risks, and acceptance criteria.",
	}),
	createProfile({
		id: "feedback-analyzer",
		name: "Feedback Analyzer",
		byline: "Product agent by Atlassian",
		avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
		description: "Clusters customer feedback and surfaces themes, sentiment, and product opportunities.",
	}),
	createProfile({
		id: "notion",
		name: "Notion",
		byline: "by Notion",
		avatarSrc: "/3p/notion/24.svg",
		description: "Helps organize notes, docs, and project knowledge into structured pages.",
	}),
	createProfile({
		id: "slack",
		name: "Slack",
		byline: "by Slack",
		avatarSrc: "/3p/slack/24.svg",
		description: "Drafts, summarizes, and prepares Slack-ready team communication.",
	}),
	createProfile({
		id: "google-drive",
		name: "Google Drive",
		byline: "by Google",
		avatarSrc: "/3p/google-drive/24.svg",
		description: "Helps locate, summarize, and work with Drive files and document context.",
	}),
	createProfile({
		id: "atlassian",
		name: "Atlassian",
		byline: "by Atlassian",
		avatarSrc: "/1p/atlassian.svg",
		description: "Searches and connects work across Jira, Confluence, and the Teamwork Graph.",
	}),
	createProfile({
		id: AI_INSIGHTS_AGENT_ID,
		name: "AI Insights Agent",
		byline: "Custom agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/customer-insights.svg",
		description: AI_INSIGHTS_DESCRIPTION,
		starters: [
			createStarter("ai-insights-agent-latest-trends", "What are the latest AI trends this week?"),
			createStarter("ai-insights-agent-breakthroughs", "Summarize recent AI breakthroughs for me"),
			createStarter("ai-insights-agent-industry-insights", "Give me AI industry insights and developments"),
		],
	}),
	createProfile({
		id: "untitled-agent",
		name: "Untitled",
		byline: "Custom agent",
		avatarSrc: "/avatar-agent/teamwork-agents/wildcard-1.svg",
		description: "A flexible custom agent for open-ended research, writing, and planning tasks.",
	}),
	createProfile({
		id: "chatgpt-wrapper-app",
		name: "ChatGPT Wrapper App",
		byline: "Custom agent",
		avatarSrc: "/avatar-agent/teamwork-agents/wildcard-4.svg",
		description: "Wraps general chat workflows with lightweight task framing and response structure.",
	}),
	createProfile({
		id: "social-media-writer",
		name: "Social Media Writer",
		byline: "Teamwork agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/social-media-writer.svg",
		description: "Drafts concise social posts, campaign variations, and channel-ready copy.",
	}),
	createProfile({
		id: "progress-tracker",
		name: "Progress Tracker",
		byline: "Teamwork agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
		description: "Summarizes project movement, blockers, and next actions across work streams.",
	}),
	createProfile({
		id: "transcript-insights-reporter",
		name: "Transcript Insights Reporter",
		byline: "Teamwork agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/transcript-insights-reporter.svg",
		description: "Extracts themes, decisions, and action items from long transcripts.",
	}),
] as const;

export const ROVO_AGENT_PROFILE_BY_ID = new Map(
	ROVO_AGENT_PROFILES.map((agent) => [agent.id, agent]),
);

// The Browse agents directory lists addable agents only. Rovo Dev is the
// built-in platform default (not a custom agent you add), so it is excluded
// here while remaining in ROVO_AGENT_PROFILES for default-agent lookups.
export const ROVO_DIRECTORY_AGENT_PROFILES: readonly RovoAgentProfile[] = ROVO_AGENT_PROFILES
	.filter((agent) => agent.id !== ROVO_AGENT_ID);

export const ROVO_AGENT_SELECTOR_AGENTS: readonly AgentSelectorAgent[] = ROVO_AGENT_PROFILES
	.filter((agent) => agent.id !== ROVO_AGENT_ID)
	.map((agent) => ({
		id: agent.id,
		name: agent.name,
		byline: agent.byline,
		avatarSrc: agent.avatarSrc,
	}));

export const ROVO_CUSTOM_AGENT_SELECTOR_AGENTS: readonly AgentSelectorAgent[] = ROVO_AGENT_SELECTOR_AGENTS;

export function getRovoAgentProfile(agentId: string): RovoAgentProfile {
	const fallbackAgent = ROVO_AGENT_PROFILE_BY_ID.get(ROVO_AGENT_ID);
	if (!fallbackAgent) {
		throw new Error("Missing default Rovo agent profile.");
	}

	return ROVO_AGENT_PROFILE_BY_ID.get(agentId) ?? fallbackAgent;
}

export function isRovoAgentProfile(agent: Pick<RovoAgentProfile, "id"> | null | undefined): boolean {
	return agent?.id === ROVO_AGENT_ID;
}

export function getRovoAgentPromptContext(agent: RovoAgentProfile): string | undefined {
	return isRovoAgentProfile(agent) ? undefined : agent.contextDescription;
}
