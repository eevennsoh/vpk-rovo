import type { AgentBrowserSidebarGroup } from "@/components/blocks/agent-browser";

export const DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS: readonly AgentBrowserSidebarGroup[] = [
	{
		title: "Favourites",
		agentIds: ["feedback-analyzer", "ai-insights-agent"],
	},
	{
		title: "By my teams",
		agentIds: [
			"readiness-checker",
			"code-reviewer",
			"pipeline-troubleshooter",
			"meeting-insights-reporter",
		],
	},
	{
		title: "By partners",
		agentIds: ["google-drive", "github-copilot", "slack", "notion"],
	},
];
