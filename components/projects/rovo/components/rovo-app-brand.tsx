"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import EditIcon from "@atlaskit/icon/core/edit";

import { useRovoSelectedAgent } from "@/app/contexts";
import { AgentSelector, type AgentSelectorAction } from "@/components/blocks/agent-selector";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
	isRovoAgentProfile,
	ROVO_AGENT_SELECTOR_AGENTS,
	ROVO_CUSTOM_AGENT_SELECTOR_AGENTS,
} from "@/components/projects/rovo/data/agent-profiles";

export function RovoAppBrand() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const {
		selectedAgent,
		selectedAgentId,
		isCustomAgentSelected,
		selectAgent,
		resetAgentToRovo,
	} = useRovoSelectedAgent();
	const selectedAgentIds = useMemo<readonly string[]>(() => [selectedAgentId], [selectedAgentId]);

	const closeSelector = useCallback(() => {
		setOpen(false);
		setQuery("");
	}, []);

	const selectedAgentActions = useMemo<readonly AgentSelectorAction[]>(() => {
		if (!isCustomAgentSelected) {
			return [];
		}

		return [
			{
				id: "chat-with-rovo",
				icon: <Image alt="" aria-hidden className="mx-auto block size-4 object-contain object-center" height={16} src="/1p/rovo.svg" width={16} />,
				label: "Chat with Rovo",
				onSelect: () => {
					resetAgentToRovo();
					closeSelector();
				},
			},
			{
				id: "edit-agent",
				icon: <Icon className="size-4" render={<EditIcon label="" />} />,
				label: "Edit agent",
				onSelect: closeSelector,
			},
		];
	}, [closeSelector, isCustomAgentSelected, resetAgentToRovo]);

	function handleAgentSelect(agentId: string) {
		selectAgent(agentId);
		closeSelector();
	}

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	}

	const selectorAgents = isCustomAgentSelected
		? ROVO_CUSTOM_AGENT_SELECTOR_AGENTS
		: ROVO_AGENT_SELECTOR_AGENTS;
	const triggerLabel = isRovoAgentProfile(selectedAgent) ? "Rovo" : selectedAgent.name;

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label={isCustomAgentSelected ? `Select ${selectedAgent.name}` : "Select Rovo agent"}
						className="h-8 shrink-0 gap-1.5 px-2 text-sm font-medium text-text"
						type="button"
						variant="ghost"
					/>
				}
			>
				<span
					aria-hidden
					data-icon="inline-start"
					className="flex size-4 items-center justify-center"
				>
					<Image
						src={selectedAgent.avatarSrc}
						alt=""
						className="size-4 object-contain"
						width={16}
						height={16}
					/>
				</span>
				<span className="font-semibold">{triggerLabel}</span>
				<Icon
					aria-hidden
					className="-ml-0.5 size-4 text-icon-subtle"
					data-icon="inline-end"
					render={<ChevronDownIcon label="" size="small" spacing="none" />}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[360px] overflow-hidden p-0"
				positionerClassName="z-[600]"
				sideOffset={8}
			>
				<AgentSelector
					agents={selectorAgents}
					heading={isCustomAgentSelected ? "Switch to another agent" : undefined}
					onAgentToggle={handleAgentSelect}
					onBrowseAgents={closeSelector}
					onCreateAgent={closeSelector}
					onQueryChange={setQuery}
					query={query}
					selectedAgentActions={selectedAgentActions}
					selectedAgentIds={selectedAgentIds}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
