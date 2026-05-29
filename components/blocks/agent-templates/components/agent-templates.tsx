"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { DEFAULT_AGENT_TEMPLATES_SIDEBAR_GROUPS } from "@/components/blocks/agent-templates/data/sidebar-groups";

export type AgentTemplatesAgent = AgentBrowserAgent;
export type AgentTemplatesSidebarGroup = AgentBrowserSidebarGroup;

export interface AgentTemplatesDialogProps {
	agents: readonly AgentTemplatesAgent[];
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgents?: readonly AgentTemplatesAgent[];
	sidebarGroups?: readonly AgentTemplatesSidebarGroup[];
	title?: string;
}

const EMPTY_AGENT_TEMPLATES_AGENTS: readonly AgentTemplatesAgent[] = [];

export function AgentTemplatesDialog({
	agents,
	onSelectAgent,
	open,
	onOpenChange,
	sessionAgents = EMPTY_AGENT_TEMPLATES_AGENTS,
	sidebarGroups = DEFAULT_AGENT_TEMPLATES_SIDEBAR_GROUPS,
	title = "Agent templates",
}: Readonly<AgentTemplatesDialogProps>) {
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
