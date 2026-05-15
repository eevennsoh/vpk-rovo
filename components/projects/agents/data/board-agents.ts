export interface BoardAgentData {
	id: string;
	name: string;
	byline: string;
	avatarSrc: string;
}

export const BOARD_AGENTS: readonly BoardAgentData[] = [
	{
		id: "github-copilot",
		name: "GitHub Copilot",
		byline: "Agent by GitHub",
		avatarSrc: "/3p/github/24.svg",
	},
	{
		id: "rovo-dev",
		name: "Rovo Dev",
		byline: "by Atlassian",
		avatarSrc: "/1p/rovo.svg",
	},
	{
		id: "readiness-checker",
		name: "Readiness Checker",
		byline: "Rovo agent by {agentOwner}",
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
] as const;
