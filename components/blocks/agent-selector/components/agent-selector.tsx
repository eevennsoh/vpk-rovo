"use client";

import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import Image from "next/image";
import { useMemo, useState, type ReactElement, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export interface AgentSelectorAgent {
	id: string;
	name: string;
	byline: string;
	avatarSrc: string;
}

export interface AgentSelectorAction {
	id: string;
	icon: ReactNode;
	label: string;
	onSelect?: () => void;
}

export interface AgentSelectorProps {
	agents: readonly AgentSelectorAgent[];
	browseAgentsLabel?: string;
	className?: string;
	createAgentLabel?: string;
	defaultQuery?: string;
	emptyMessage?: string;
	heading?: string;
	onAgentToggle?: (agentId: string) => void;
	onBrowseAgents?: () => void;
	onCreateAgent?: () => void;
	onQueryChange?: (query: string) => void;
	query?: string;
	searchPlaceholder?: string;
	selectionMode?: "multiple" | "single";
	selectedAgentActions?: readonly AgentSelectorAction[];
	selectedAgentIds?: readonly string[];
}

const EMPTY_SELECTED_AGENT_IDS: readonly string[] = [];
const EMPTY_SELECTED_AGENT_ACTIONS: readonly AgentSelectorAction[] = [];
const ACTION_BUTTON_CLASS = "h-8 min-h-8 w-full justify-start gap-3 px-3 py-0 text-left text-sm font-normal";
const ACTION_ICON_CLASS = "grid size-6 shrink-0 place-items-center text-icon-subtle";

function matchesAgent(agent: AgentSelectorAgent, query: string): boolean {
	const searchableText = `${agent.name} ${agent.byline}`.toLowerCase();
	return searchableText.includes(query);
}

function AgentSelectorLogo({ agent }: Readonly<{ agent: AgentSelectorAgent }>): ReactElement {
	return (
		<span className="grid size-6 shrink-0 place-items-center overflow-hidden rounded-sm">
			<Image alt="" aria-hidden className="mx-auto block size-6 object-contain object-center" height={24} src={agent.avatarSrc} width={24} />
		</span>
	);
}

export function AgentSelector({
	agents,
	browseAgentsLabel = "Browse agents",
	className,
	createAgentLabel = "Create agent",
	defaultQuery = "",
	emptyMessage = "No agents found.",
	heading = "Select an agent",
	onAgentToggle,
	onBrowseAgents,
	onCreateAgent,
	onQueryChange,
	query,
	searchPlaceholder = "Search agents",
	selectionMode = "multiple",
	selectedAgentActions,
	selectedAgentIds,
}: Readonly<AgentSelectorProps>): ReactElement {
	const [internalQuery, setInternalQuery] = useState(defaultQuery);
	const selectedIds = selectedAgentIds ?? EMPTY_SELECTED_AGENT_IDS;
	const selectedActions = selectedAgentActions ?? EMPTY_SELECTED_AGENT_ACTIONS;
	const resolvedQuery = query ?? internalQuery;
	const normalizedQuery = resolvedQuery.trim().toLowerCase();
	const selectedAgentIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
	const visibleAgents = useMemo(() => {
		const agentById = new Map(agents.map((agent) => [agent.id, agent]));
		const selectedAgents = selectedIds
			.map((agentId) => agentById.get(agentId))
			.filter((agent): agent is AgentSelectorAgent => Boolean(agent));
		const unselectedAgents = agents.filter((agent) => !selectedAgentIdSet.has(agent.id));
		const filteredUnselectedAgents = normalizedQuery
			? unselectedAgents.filter((agent) => matchesAgent(agent, normalizedQuery))
			: unselectedAgents;

		return [...selectedAgents, ...filteredUnselectedAgents];
	}, [agents, normalizedQuery, selectedAgentIdSet, selectedIds]);

	function handleQueryChange(nextQuery: string) {
		if (query === undefined) {
			setInternalQuery(nextQuery);
		}
		onQueryChange?.(nextQuery);
	}

	const hasFooterActions = Boolean(onBrowseAgents || onCreateAgent);
	const hasSelectedAgentActions = selectedActions.length > 0;
	const supportsMultipleSelection = selectionMode === "multiple";

	return (
		<Command className={cn("h-[26rem] max-h-[min(26rem,var(--available-height))] min-h-0 min-w-80 flex-1 p-3", className)} shouldFilter={false}>
			{hasSelectedAgentActions ? (
				<div aria-label="Selected agent actions" className="flex shrink-0 flex-col border-b border-border pb-3" role="group">
					{selectedActions.map((action) => (
						<Button
							className={ACTION_BUTTON_CLASS}
							key={action.id}
							onClick={action.onSelect}
							type="button"
							variant="ghost"
						>
							<span className={ACTION_ICON_CLASS}>
								{action.icon}
							</span>
							<span className="text-text">{action.label}</span>
						</Button>
					))}
				</div>
			) : null}
			<div className={cn("shrink-0", hasSelectedAgentActions && "pt-4")}>
				<p className="mb-2 text-xs font-semibold leading-4 text-text-subtlest">{heading}</p>
				<CommandInput
					aria-label={searchPlaceholder}
					inputGroupClassName="has-[[data-slot=input-group-control]:focus-visible]:border-input has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&>[data-align=inline-start]]:pl-4 has-[>[data-align=inline-start]]:[&>input]:pl-4"
					onValueChange={handleQueryChange}
					placeholder={searchPlaceholder}
					value={resolvedQuery}
					wrapperClassName="p-0"
				/>
			</div>
			<CommandList aria-label="Agents" className="min-h-0 max-h-none flex-1 p-0">
				{visibleAgents.length === 0 ? <CommandEmpty>{emptyMessage}</CommandEmpty> : null}
				<CommandGroup className="!px-0 !py-1.5">
					{visibleAgents.map((agent) => {
						const isSelected = selectedAgentIdSet.has(agent.id);
						return (
							<CommandItem
								aria-checked={supportsMultipleSelection ? isSelected : undefined}
								className="h-12 min-h-12 items-center gap-3 rounded-[6px] px-3 py-1.5"
								data-checked={supportsMultipleSelection && isSelected ? true : undefined}
								key={agent.id}
								keywords={[agent.name, agent.byline]}
								onSelect={() => onAgentToggle?.(agent.id)}
								role={supportsMultipleSelection ? "menuitemcheckbox" : undefined}
								showCheckIcon={supportsMultipleSelection}
								value={agent.name}
							>
								<AgentSelectorLogo agent={agent} />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-normal leading-4 text-text">{agent.name}</span>
									<span className="block truncate text-xs leading-4 text-text-subtle">{agent.byline}</span>
								</span>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
			{hasFooterActions ? (
				<div className="sticky bottom-0 z-10 flex shrink-0 flex-col border-t border-border bg-popover p-0 pt-3">
					{onBrowseAgents ? (
						<Button
							className={ACTION_BUTTON_CLASS}
							onClick={onBrowseAgents}
							type="button"
							variant="ghost"
						>
							<span className={ACTION_ICON_CLASS}>
								<Icon className="size-4" render={<AiAgentIcon label="" />} />
							</span>
							<span className="text-text">{browseAgentsLabel}</span>
						</Button>
					) : null}
					{onCreateAgent ? (
						<Button
							className={ACTION_BUTTON_CLASS}
							onClick={onCreateAgent}
							type="button"
							variant="ghost"
						>
							<span className={ACTION_ICON_CLASS}>
								<Icon className="size-4" render={<AddIcon label="" />} />
							</span>
							<span className="text-text">{createAgentLabel}</span>
						</Button>
					) : null}
				</div>
			) : null}
			<span className="sr-only">{agents.length} agents available</span>
		</Command>
	);
}
