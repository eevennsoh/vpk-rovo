"use client";

import Image from "next/image";
import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";

import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { BoardAgentData } from "../data/board-agents";
import { useMemo, useState } from "react";

interface ColumnAgentAssignmentProps {
	agents: readonly BoardAgentData[];
	assignedAgentIds: readonly string[];
	columnTitle: string;
	onCreateAgent: (columnTitle: string) => void;
	onToggleAgent: (agentId: string) => void;
}

function getAgentInitials(name: string): string {
	return name
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function AgentAvatar({ agent, className }: Readonly<{ agent: BoardAgentData; className?: string }>) {
	return (
		<Avatar className={className} label={agent.name} shape="hexagon" size="sm">
			<AvatarImage alt="" src={agent.avatarSrc} />
			<AvatarFallback>{getAgentInitials(agent.name)}</AvatarFallback>
		</Avatar>
	);
}

function AgentStack({ agents }: Readonly<{ agents: readonly BoardAgentData[] }>) {
	const visibleAgents = agents.slice(0, 2);
	const overflowCount = Math.max(0, agents.length - visibleAgents.length);
	const label = agents.map((agent) => agent.name).join(", ");

	if (agents.length === 0) {
		return null;
	}

	return (
		<AvatarGroup className="-space-x-1.5" label={`Assigned agents: ${label}`}>
			{visibleAgents.map((agent) => (
				<AgentAvatar agent={agent} key={agent.id} />
			))}
			{overflowCount > 0 ? (
				<Avatar aria-label={`${overflowCount} more assigned agents`} shape="hexagon" size="sm">
					<AvatarFallback className="bg-bg-neutral-bold text-[10px] font-semibold text-text-inverse">
						+{overflowCount}
					</AvatarFallback>
				</Avatar>
			) : null}
		</AvatarGroup>
	);
}

function AgentLogo({ agent }: Readonly<{ agent: BoardAgentData }>) {
	return (
		<span className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm">
			<Image alt="" aria-hidden height={20} src={agent.avatarSrc} style={{ height: 20, width: 20 }} width={20} />
		</span>
	);
}

function AddAgentsPanel({
	agents,
	assignedAgents,
	assignedAgentIdSet,
	filteredUnassignedAgents,
	onCreateAgent,
	onQueryChange,
	onToggleAgent,
	query,
}: Readonly<{
	agents: readonly BoardAgentData[];
	assignedAgents: readonly BoardAgentData[];
	assignedAgentIdSet: ReadonlySet<string>;
	filteredUnassignedAgents: readonly BoardAgentData[];
	onCreateAgent: () => void;
	onQueryChange: (query: string) => void;
	onToggleAgent: (agentId: string) => void;
	query: string;
}>) {
	const visibleAgents = [...assignedAgents, ...filteredUnassignedAgents];

	return (
		<Command className="min-w-80 flex-1" shouldFilter={false}>
			<div className="px-4 pb-2 pt-4">
				<p className="mb-2 text-sm font-semibold text-text">Select agent</p>
				<CommandInput onValueChange={onQueryChange} placeholder="Search agents" value={query} />
			</div>
			<CommandList className="max-h-80 px-1.5 pb-2">
				{visibleAgents.length === 0 ? <CommandEmpty>No agents found.</CommandEmpty> : null}
				<CommandGroup>
					{visibleAgents.map((agent) => {
						const isSelected = assignedAgentIdSet.has(agent.id);
						return (
							<CommandItem
								aria-checked={isSelected}
								className="items-center gap-3 px-3 py-2.5"
								data-checked={isSelected}
								key={agent.id}
								keywords={[agent.name, agent.byline]}
								onSelect={() => onToggleAgent(agent.id)}
								role="menuitemcheckbox"
								value={agent.name}
							>
								<AgentLogo agent={agent} />
								<span className="min-w-0 flex-1">
									<span className="block truncate text-sm font-medium text-text">{agent.name}</span>
									<span className="block truncate text-xs text-text-subtle">{agent.byline}</span>
								</span>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
			<div className="border-t border-border p-1.5">
				<Button
					className="h-auto w-full justify-start gap-3 px-3 py-2.5 text-left text-sm font-normal"
					onClick={onCreateAgent}
					type="button"
					variant="ghost"
				>
					<Icon className="text-icon-subtle" render={<AddIcon label="" size="small" />} />
					<span>Create agent</span>
				</Button>
			</div>
			<span className="sr-only">{agents.length} agents available</span>
		</Command>
	);
}

export default function ColumnAgentAssignment({
	agents,
	assignedAgentIds,
	columnTitle,
	onCreateAgent,
	onToggleAgent,
}: Readonly<ColumnAgentAssignmentProps>) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const assignedAgents = useMemo(
		() => assignedAgentIds.map((id) => agents.find((agent) => agent.id === id)).filter((agent): agent is BoardAgentData => Boolean(agent)),
		[agents, assignedAgentIds],
	);
	const assignedAgentIdSet = useMemo(() => new Set(assignedAgentIds), [assignedAgentIds]);
	const filteredUnassignedAgents = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		const unassignedAgents = agents.filter((agent) => !assignedAgentIdSet.has(agent.id));

		if (!normalizedQuery) {
			return unassignedAgents;
		}

		return unassignedAgents.filter((agent) => {
			const searchableText = `${agent.name} ${agent.byline}`.toLowerCase();
			return searchableText.includes(normalizedQuery);
		});
	}, [agents, assignedAgentIdSet, query]);
	const hasAssignedAgents = assignedAgents.length > 0;
	const triggerLabel = hasAssignedAgents
		? `Manage agents for ${columnTitle}`
		: `Add agent to ${columnTitle}`;

	const handleCreateAgent = () => {
		setOpen(false);
		setQuery("");
		onCreateAgent(columnTitle);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		setOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	};

	return (
		<div className="flex min-w-0 shrink-0 items-center">
			<DropdownMenu open={open} onOpenChange={handleOpenChange}>
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger render={<span className="inline-flex" />}>
							<DropdownMenuTrigger
								render={
									<Button
										aria-label={triggerLabel}
										className={cn(
											"opacity-0 transition-opacity group-hover/board-column:opacity-100 group-focus-within/board-column:opacity-100",
											hasAssignedAgents ? "h-8 min-w-0 gap-1 px-1.5" : "size-7",
											(hasAssignedAgents || open) && "opacity-100",
										)}
										data-assigned={hasAssignedAgents || undefined}
										data-open={open || undefined}
										size={hasAssignedAgents ? "sm" : "icon-sm"}
										variant="ghost"
									/>
								}
							>
								{hasAssignedAgents ? (
									<>
										<AgentStack agents={assignedAgents} />
										<Icon className="ml-0.5 text-icon-subtle" render={<ChevronDownIcon label="" size="small" />} />
									</>
								) : (
									<Icon
										className={open ? "text-icon-brand" : "text-icon-subtle"}
										label="Agent"
										render={<AiAgentIcon label="" size="small" />}
									/>
								)}
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent>{hasAssignedAgents ? "Manage agents" : "Add agent"}</TooltipContent>
					</Tooltip>
				</TooltipProvider>
				<DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
					<AddAgentsPanel
						agents={agents}
						assignedAgents={assignedAgents}
						assignedAgentIdSet={assignedAgentIdSet}
						filteredUnassignedAgents={filteredUnassignedAgents}
						onCreateAgent={handleCreateAgent}
						onQueryChange={setQuery}
						onToggleAgent={onToggleAgent}
						query={query}
					/>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
