"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS } from "@/components/blocks/skills-directory/data/sidebar-groups";

export type SkillsDirectoryAgent = AgentBrowserAgent;
export type SkillsDirectorySidebarGroup = AgentBrowserSidebarGroup;

export interface SkillsDirectoryDialogProps {
	agents: readonly SkillsDirectoryAgent[];
	onSelectAgent?: (agent: SkillsDirectoryAgent) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgents?: readonly SkillsDirectoryAgent[];
	sidebarGroups?: readonly SkillsDirectorySidebarGroup[];
	title?: string;
}

const EMPTY_SKILLS_DIRECTORY_AGENTS: readonly SkillsDirectoryAgent[] = [];

export function SkillsDirectoryDialog({
	agents,
	onSelectAgent,
	open,
	onOpenChange,
	sessionAgents = EMPTY_SKILLS_DIRECTORY_AGENTS,
	sidebarGroups = DEFAULT_SKILLS_DIRECTORY_SIDEBAR_GROUPS,
	title,
}: Readonly<SkillsDirectoryDialogProps>) {
	const directoryAgents = useMemo(
		() => [...agents, ...sessionAgents],
		[agents, sessionAgents],
	);

	return (
		<AgentBrowserDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			agents={directoryAgents}
			onSelectAgent={onSelectAgent}
			sidebarGroups={sidebarGroups}
		/>
	);
}
