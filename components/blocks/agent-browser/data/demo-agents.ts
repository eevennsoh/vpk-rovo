import type { AgentBrowserAgent, AgentBrowserSidebarGroup } from "../components/agent-browser";

export const DEMO_AGENT_BROWSER_AGENTS: readonly AgentBrowserAgent[] = [
	{
		id: "feedback-analyzer",
		name: "Feedback analyzer",
		byline: "Customer feedback insights by Atlassian",
		attributionKind: "company",
		avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
		description: "Surfaces themes and sentiment from raw customer feedback in seconds.",
	},
	{
		id: "ai-insights-agent",
		name: "AI insights agent",
		byline: "Product analytics by Product Experience",
		attributionKind: "team",
		avatarSrc: "/avatar-agent/teamwork-agents/customer-insights.svg",
		description: "Translates dashboards into narrative briefs your stakeholders will read.",
	},
	{
		id: "readiness-checker",
		name: "Readiness checker",
		byline: "Launch prep by Customer Success",
		attributionKind: "team",
		avatarSrc: "/avatar-agent/teamwork-agents/readiness-checker.svg",
		description: "Audits your launch plan against go-to-market readiness criteria.",
	},
	{
		id: "code-reviewer",
		name: "Code reviewer",
		byline: "Engineering quality by Mei Tan",
		attributionKind: "person",
		avatarSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
		description: "Reviews PRs for style, correctness, and security gotchas.",
	},
	{
		id: "pipeline-troubleshooter",
		name: "Pipeline troubleshooter",
		byline: "CI diagnostics by Platform Engineering",
		attributionKind: "team",
		avatarSrc: "/avatar-agent/dev-agents/pipeline-troubleshooter.svg",
		description: "Investigates failing builds and recommends the smallest viable fix.",
	},
	{
		id: "meeting-insights-reporter",
		name: "Meeting insights reporter",
		byline: "Meeting digests by Priya Shah",
		attributionKind: "person",
		avatarSrc: "/avatar-agent/teamwork-agents/meeting-insights-reporter.svg",
		description: "Turns transcripts into decisions, actions, and owners.",
	},
	{
		id: "google-drive",
		name: "Google Drive",
		byline: "File search by Google",
		attributionKind: "company",
		avatarSrc: "/3p/google-drive/24.svg",
		description: "Searches your Drive for the most relevant document in context.",
	},
	{
		id: "github-copilot",
		name: "GitHub Copilot",
		byline: "Code assistant by GitHub",
		attributionKind: "company",
		avatarSrc: "/3p/github/24.svg",
		description: "Pairs with you on code, tests, and refactors across your repos.",
	},
	{
		id: "slack",
		name: "Slack",
		byline: "Conversation search by Slack",
		attributionKind: "company",
		avatarSrc: "/3p/slack/24.svg",
		description: "Finds the right thread, channel, and decision in your workspace.",
	},
	{
		id: "notion",
		name: "Notion",
		byline: "Knowledge base by Notion",
		attributionKind: "company",
		avatarSrc: "/3p/notion/24.svg",
		description: "Pulls answers from your team's pages and databases.",
	},
	{
		id: "atlassian",
		name: "Atlassian",
		byline: "Teamwork search by Atlassian",
		attributionKind: "company",
		avatarSrc: "/1p/atlassian.svg",
		description: "Connects work across Jira, Confluence, and the rest of your suite.",
	},
];

export const DEMO_AGENT_BROWSER_SIDEBAR_GROUPS: readonly AgentBrowserSidebarGroup[] = [
	{
		title: "Favourites",
		agentIds: ["feedback-analyzer", "ai-insights-agent"],
	},
	{
		title: "By teams",
		showAll: true,
		items: [
			{
				id: "product-experience",
				label: "Product Experience",
				avatarSrc: "/avatar-project/compass.svg",
			},
			{
				id: "platform-engineering",
				label: "Platform Engineering",
				avatarSrc: "/avatar-project/code.svg",
			},
			{
				id: "customer-success",
				label: "Customer Success",
				avatarSrc: "/avatar-project/service-bell.svg",
			},
			{
				id: "revenue-operations",
				label: "Revenue Operations",
				avatarSrc: "/avatar-project/graph.svg",
			},
		],
	},
	{
		title: "By companies",
		showAll: true,
		agentIds: ["google-drive", "github-copilot", "slack", "notion"],
	},
];
