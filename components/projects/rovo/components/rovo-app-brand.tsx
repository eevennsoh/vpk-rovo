"use client";

import { useState } from "react";
import Image from "next/image";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import { AgentSelector } from "@/components/blocks/agent-selector";
import { AGENT_SELECTOR_DEMO_AGENTS } from "@/components/blocks/agent-selector/data/demo-agents";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";

export function RovoAppBrand() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [selectedAgentIds, setSelectedAgentIds] = useState<readonly string[]>(["rovo-dev"]);

	function toggleAgent(agentId: string) {
		setSelectedAgentIds((currentIds) => (
			currentIds.includes(agentId)
				? currentIds.filter((currentId) => currentId !== agentId)
				: [...currentIds, agentId]
		));
	}

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	}

	function closeSelector() {
		setOpen(false);
		setQuery("");
	}

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label="Select Rovo agent"
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
						src="/1p/rovo.svg"
						alt=""
						width={16}
						height={16}
					/>
				</span>
				<span className="font-semibold">Rovo</span>
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
					agents={AGENT_SELECTOR_DEMO_AGENTS}
					onAgentToggle={toggleAgent}
					onBrowseAgents={closeSelector}
					onCreateAgent={closeSelector}
					onQueryChange={setQuery}
					query={query}
					selectedAgentIds={selectedAgentIds}
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
