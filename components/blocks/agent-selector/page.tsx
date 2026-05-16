"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { useState, type ReactElement } from "react";

import { AgentSelector } from "@/components/blocks/agent-selector";
import { AGENT_SELECTOR_DEMO_AGENTS } from "@/components/blocks/agent-selector/data/demo-agents";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AgentSelectorPage(): ReactElement {
	const [open, setOpen] = useState(true);
	const [selectedAgentIds, setSelectedAgentIds] = useState<readonly string[]>(["rovo-dev"]);

	function toggleAgent(agentId: string) {
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
					agents={AGENT_SELECTOR_DEMO_AGENTS}
					onAgentToggle={toggleAgent}
					onBrowseAgents={() => undefined}
					onCreateAgent={() => undefined}
					selectedAgentIds={selectedAgentIds}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { AgentSelector } from "@/components/blocks/agent-selector";
export type { AgentSelectorAgent, AgentSelectorProps } from "@/components/blocks/agent-selector";
