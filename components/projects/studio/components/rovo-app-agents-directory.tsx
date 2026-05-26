"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import type { StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
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
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgentEntries?: readonly StudioSessionAgentEntry[];
}

export function BrowseAgentsDialog({
	onSelectAgent,
	open,
	onOpenChange,
	sessionAgentEntries = [],
}: Readonly<BrowseAgentsDialogProps>) {
	const agents = useMemo(
		() =>
			[
				...ROVO_AGENT_PROFILES.map((profile) => ({
					id: profile.id,
					name: profile.name,
					byline: profile.byline,
					avatarSrc: profile.avatarSrc,
					description: profile.description,
				})),
				...sessionAgentEntries.map((entry) => ({
					id: entry.profile.id,
					name: entry.profile.name,
					byline: entry.profile.byline,
					avatarSrc: entry.profile.avatarSrc,
					description: entry.profile.description,
				})),
			],
		[sessionAgentEntries],
	);

	return (
		<AgentBrowserDialog
			open={open}
			onOpenChange={onOpenChange}
			agents={agents}
			onSelectAgent={onSelectAgent}
			sidebarGroups={STUDIO_SIDEBAR_GROUPS}
		/>
	);
}
