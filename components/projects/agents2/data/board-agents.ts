import type { KanbanBoardAgentData } from "@/components/blocks/kanban-board";

export type { KanbanBoardAgentData as BoardAgentData } from "@/components/blocks/kanban-board";

export const BOARD_AGENTS: readonly KanbanBoardAgentData[] = [
	{
		id: "github-copilot",
		name: "GitHub Copilot",
		byline: "Agent by GitHub",
		avatarSrc: "/3p/github/24.svg",
	},
	{
		id: "readiness-checker",
		name: "Readiness Checker",
		byline: "Rovo agent by Enterprise Solutions",
		avatarSrc: "/avatar-agent/teamwork-agents/readiness-checker.svg",
	},
	{
		id: "figma",
		name: "Figma",
		byline: "by Figma",
		avatarSrc: "/3p/figma/24.svg",
	},
	{
		id: "canva",
		name: "Canva",
		byline: "by Canva",
		avatarSrc: "/3p/canva/24.svg",
	},
	{
		id: "code-reviewer",
		name: "Code Experience Builder",
		byline: "Dev agent by Atlassian",
		avatarSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
	},
	{
		id: "pipeline-troubleshooter",
		name: "Pipeline Troubleshooter",
		byline: "Dev agent by Atlassian",
		avatarSrc: "/avatar-agent/dev-agents/pipeline-troubleshooter.svg",
	},
	{
		id: "meeting-insights-reporter",
		name: "Meeting Insights Reporter",
		byline: "Teamwork agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/meeting-insights-reporter.svg",
	},
	{
		id: "product-requirements-guide",
		name: "Product Requirements Guide",
		byline: "Teamwork agent by Atlassian",
		avatarSrc: "/avatar-agent/teamwork-agents/product-requirements-guide.svg",
	},
	{
		id: "feedback-analyzer",
		name: "Feedback Analyzer",
		byline: "Product agent by Atlassian",
		avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
	},
	{
		id: "notion",
		name: "Notion",
		byline: "by Notion",
		avatarSrc: "/3p/notion/24.svg",
	},
	{
		id: "slack",
		name: "Slack",
		byline: "by Slack",
		avatarSrc: "/3p/slack/24.svg",
	},
	{
		id: "google-drive",
		name: "Google Drive",
		byline: "by Google",
		avatarSrc: "/3p/google-drive/24.svg",
	},
] as const;
