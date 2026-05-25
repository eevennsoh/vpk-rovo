"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { ROVO_AGENT_PROFILES } from "@/components/projects/studio/data/agent-profiles";

const STUDIO_SIDEBAR_GROUPS: readonly AgentBrowserSidebarGroup[] = [
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

interface BrowseAgentsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function BrowseAgentsDialog({ open, onOpenChange }: Readonly<BrowseAgentsDialogProps>) {
	const agents = useMemo(
		() =>
			ROVO_AGENT_PROFILES.map((profile) => ({
				id: profile.id,
				name: profile.name,
				byline: profile.byline,
				avatarSrc: profile.avatarSrc,
				description: profile.description,
			})),
		[],
	);

	return (
		<AgentBrowserDialog
			open={open}
			onOpenChange={onOpenChange}
			agents={agents}
			sidebarGroups={STUDIO_SIDEBAR_GROUPS}
		/>
	);
}
