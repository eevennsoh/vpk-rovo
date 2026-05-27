"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS } from "@/components/blocks/agents-directory/data/sidebar-groups";

export type AgentsDirectoryAgent = AgentBrowserAgent;
export type AgentsDirectorySidebarGroup = AgentBrowserSidebarGroup;

export interface AgentsDirectoryDialogProps {
	agents: readonly AgentsDirectoryAgent[];
	onSelectAgent?: (agent: AgentsDirectoryAgent) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgents?: readonly AgentsDirectoryAgent[];
	sidebarGroups?: readonly AgentsDirectorySidebarGroup[];
	title?: string;
}

const EMPTY_AGENTS_DIRECTORY_AGENTS: readonly AgentsDirectoryAgent[] = [];

export function AgentsDirectoryDialog({
	agents,
	onSelectAgent,
	open,
	onOpenChange,
	sessionAgents = EMPTY_AGENTS_DIRECTORY_AGENTS,
	sidebarGroups = DEFAULT_AGENTS_DIRECTORY_SIDEBAR_GROUPS,
	title,
}: Readonly<AgentsDirectoryDialogProps>) {
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
