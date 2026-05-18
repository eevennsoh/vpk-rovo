"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EditIcon from "@atlaskit/icon/core/edit";
import Image from "next/image";
import { useState, type ReactElement } from "react";

import { AgentSelector, type AgentSelectorAction } from "@/components/blocks/agent-selector";
import { AGENT_SELECTOR_CUSTOM_AGENT_DEMO_AGENTS, AGENT_SELECTOR_DEMO_AGENTS } from "@/components/blocks/agent-selector/data/demo-agents";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

interface AgentSelectorPageProps {
	variant?: "default" | "selected-agent-actions";
}

export default function AgentSelectorPage({ variant = "default" }: Readonly<AgentSelectorPageProps> = {}): ReactElement {
	const [open, setOpen] = useState(true);
	const [selectedAgentIds, setSelectedAgentIds] = useState<readonly string[]>(
		variant === "selected-agent-actions" ? ["ai-insights-agent"] : ["github-copilot"]
	);
	const agents = variant === "selected-agent-actions" ? AGENT_SELECTOR_CUSTOM_AGENT_DEMO_AGENTS : AGENT_SELECTOR_DEMO_AGENTS;
	const selectedAgentActions: readonly AgentSelectorAction[] = variant === "selected-agent-actions"
		? [
			{
				id: "chat-with-rovo",
				icon: <Image alt="" aria-hidden className="mx-auto block size-4 object-contain object-center" height={16} src="/1p/rovo.svg" width={16} />,
				label: "Chat with Rovo",
				onSelect: () => setOpen(false),
			},
			{
				id: "edit-agent",
				icon: <Icon className="size-4" render={<EditIcon label="" />} />,
				label: "Edit agent",
				onSelect: () => setOpen(false),
			},
		]
		: [];

	function toggleAgent(agentId: string) {
		if (variant === "selected-agent-actions") {
			setSelectedAgentIds([agentId]);
			return;
		}

		setSelectedAgentIds((currentIds) => (
			currentIds.includes(agentId)
				? currentIds.filter((currentId) => currentId !== agentId)
				: [...currentIds, agentId]
		));
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger
				render={
					<Button aria-label="Select agent" variant="outline" />
				}
			>
				Select agent
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-[360px] overflow-hidden p-0" portalled={false} sideOffset={8}>
				<AgentSelector
					agents={agents}
					heading={variant === "selected-agent-actions" ? "Switch to another agent" : undefined}
					onAgentToggle={toggleAgent}
					onBrowseAgents={() => undefined}
					onCreateAgent={() => undefined}
					selectedAgentActions={selectedAgentActions}
					selectedAgentIds={selectedAgentIds}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { AgentSelector } from "@/components/blocks/agent-selector";
export type { AgentSelectorAction, AgentSelectorAgent, AgentSelectorProps } from "@/components/blocks/agent-selector";
