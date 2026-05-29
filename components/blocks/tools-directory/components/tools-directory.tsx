"use client";

import { useMemo } from "react";

import {
	AgentBrowserDialog,
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { DEFAULT_TOOLS_DIRECTORY_SIDEBAR_GROUPS } from "@/components/blocks/tools-directory/data/sidebar-groups";

export type ToolsDirectoryTool = AgentBrowserAgent;
export type ToolsDirectorySidebarGroup = AgentBrowserSidebarGroup;

export interface ToolsDirectoryDialogProps {
	onOpenChange: (open: boolean) => void;
	onSelectTool?: (tool: ToolsDirectoryTool) => void;
	open: boolean;
	sessionTools?: readonly ToolsDirectoryTool[];
	sidebarGroups?: readonly ToolsDirectorySidebarGroup[];
	title?: string;
	tools: readonly ToolsDirectoryTool[];
}

const EMPTY_TOOLS_DIRECTORY_TOOLS: readonly ToolsDirectoryTool[] = [];

export function ToolsDirectoryDialog({
	onOpenChange,
	onSelectTool,
	open,
	sessionTools = EMPTY_TOOLS_DIRECTORY_TOOLS,
	sidebarGroups = DEFAULT_TOOLS_DIRECTORY_SIDEBAR_GROUPS,
	title,
	tools,
}: Readonly<ToolsDirectoryDialogProps>) {
	const directoryTools = useMemo(
		() => [...tools, ...sessionTools],
		[tools, sessionTools],
	);

	return (
		<AgentBrowserDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title ?? "Browse tools"}
			agents={directoryTools}
			onSelectAgent={onSelectTool}
			sidebarGroups={sidebarGroups}
		/>
	);
}
