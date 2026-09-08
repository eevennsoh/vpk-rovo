"use client";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import { useState } from "react";

import { ROVO_AGENT_SELECTOR_AGENTS } from "@/app/data/directory/agents";
import { AgentSelector, type AgentSelectorAgent } from "@/components/blocks/agent-selector";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ContextBarPill } from "@/components/ui-custom/context-bar";
import {
	DEFAULT_PINNED_SPACE_AGENT_IDS,
	WORK_ITEM_PINNED_ITEMS_LABEL,
} from "@/components/blocks/jira-work-item/lib/work-item-picker-options";

interface ActivityComposerAgentContextPillProps {
	onInvokeAgent: (agent: Pick<AgentSelectorAgent, "id" | "name" | "avatarSrc" | "brandName">) => void;
}

/** Opens the shared agent selector and immediately invokes the chosen agent. */
export function ActivityComposerAgentContextPill({
	onInvokeAgent,
}: Readonly<ActivityComposerAgentContextPillProps>) {
	const [isOpen, setIsOpen] = useState(false);
	const [pinnedAgentIds, setPinnedAgentIds] = useState<readonly string[]>(DEFAULT_PINNED_SPACE_AGENT_IDS);
	const [query, setQuery] = useState("");

	const handleOpenChange = (nextOpen: boolean) => {
		setIsOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	};

	const handleAgentToggle = (agentId: string) => {
		const agent = ROVO_AGENT_SELECTOR_AGENTS.find((candidate) => candidate.id === agentId);
		if (!agent) {
			return;
		}
		onInvokeAgent(agent);
		setIsOpen(false);
		setQuery("");
	};

	const handleFooterAction = () => {
		setIsOpen(false);
		setQuery("");
	};

	return (
		<DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
			<DropdownMenuTrigger
				render={
					<ContextBarPill
						className="motion-reduce:transition-none"
						icon={<Icon aria-hidden render={<AiAgentIcon label="" size="small" />} />}
					/>
				}
			>
				Assign agents
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="max-h-none w-[360px] overflow-hidden p-0"
				positionerClassName="z-[502]"
				sideOffset={8}
			>
				<AgentSelector
					agents={ROVO_AGENT_SELECTOR_AGENTS}
					onAgentToggle={handleAgentToggle}
					onBrowseAgents={handleFooterAction}
					onCreateAgent={handleFooterAction}
					onPinnedAgentIdsChange={setPinnedAgentIds}
					onQueryChange={setQuery}
					pinnedAgentIds={pinnedAgentIds}
					pinnedItemsLabel={WORK_ITEM_PINNED_ITEMS_LABEL}
					query={query}
					selectionMode="single"
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
