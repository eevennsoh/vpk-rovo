"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import SearchIcon from "@atlaskit/icon/core/search";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import { CardDirectoryAgent } from "@/components/ui-custom/card-directory";
import { token } from "@/lib/tokens";

export interface AgentBrowserAgent {
	id: string;
	name: string;
	byline: string;
	attributionKind?: "company" | "team" | "person";
	avatarSrc: string;
	description?: string;
}

export interface AgentBrowserSidebarGroup {
	title: string;
	agentIds?: readonly string[];
	items?: readonly AgentBrowserSidebarItem[];
	showAll?: boolean;
}

export interface AgentBrowserSidebarItem {
	id: string;
	label: string;
	avatarSrc: string;
}

export interface AgentBrowserCategory {
	id: string;
	label: string;
}

export interface AgentBrowserProps {
	agents: readonly AgentBrowserAgent[];
	categories?: readonly AgentBrowserCategory[];
	sidebarGroups?: readonly AgentBrowserSidebarGroup[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

export interface AgentBrowserDialogProps extends AgentBrowserProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title?: string;
}

const DEFAULT_CATEGORIES: readonly AgentBrowserCategory[] = [
	{ id: "all", label: "All" },
	{ id: "my-agents", label: "My agents" },
] as const;

function derivePublisher(byline: string): string {
	const match = /\bby\s+(.+)$/i.exec(byline);
	return (match?.[1] ?? byline).trim();
}

function isVerified(agent: AgentBrowserAgent, publisher: string): boolean {
	if (agent.attributionKind) return agent.attributionKind === "company";
	return ["atlassian", "google", "github", "slack", "notion", "figma", "canva"].includes(publisher.toLowerCase());
}

function hashString(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash * 31 + value.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function syntheticRating(id: string): number {
	const remainder = hashString(id) % 16;
	return Number((3.5 + remainder / 10).toFixed(1));
}

function syntheticChats(id: string): number {
	return 100 + (hashString(`${id}-chats`) % 9900);
}

function syntheticFeedback(id: string): number {
	return 50 + (hashString(`${id}-feedback`) % 2000);
}

function filterByQuery(
	agents: readonly AgentBrowserAgent[],
	query: string,
): readonly AgentBrowserAgent[] {
	const normalized = query.trim().toLowerCase();
	if (!normalized) return agents;
	return agents.filter((agent) => {
		const haystack = `${agent.name} ${agent.byline} ${agent.description ?? ""}`.toLowerCase();
		return haystack.includes(normalized);
	});
}

function pickAgentsByIds(
	all: readonly AgentBrowserAgent[],
	ids: readonly string[] = [],
): readonly AgentBrowserAgent[] {
	return ids
		.map((id) => all.find((agent) => agent.id === id))
		.filter((agent): agent is AgentBrowserAgent => Boolean(agent));
}

function getSidebarGroupItems(
	all: readonly AgentBrowserAgent[],
	group: AgentBrowserSidebarGroup,
): readonly AgentBrowserSidebarItem[] {
	if (group.items) return group.items;
	return pickAgentsByIds(all, group.agentIds).map((agent) => ({
		id: agent.id,
		label: agent.name,
		avatarSrc: agent.avatarSrc,
	}));
}

function getDirectoryCardAvatarClassName(agent: AgentBrowserAgent): string {
	if (agent.id === "google-drive" || agent.id === "slack") {
		return "size-full scale-85 object-contain";
	}

	return "size-full object-contain";
}

export function AgentBrowserDialog({
	open,
	onOpenChange,
	title = "Browse agents",
	...browserProps
}: Readonly<AgentBrowserDialogProps>) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="grid h-[min(800px,calc(100svh-2rem))] max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-[1200px]"
				showCloseButton={false}
			>
				<div className="flex items-center justify-between px-6 pt-6 pb-4">
					<DialogTitle className="text-base font-medium leading-5 text-text">
						{title}
					</DialogTitle>
					<DialogClose render={<Button variant="ghost" size="icon" />}>
						<CrossIcon label="" />
						<span className="sr-only">Close</span>
					</DialogClose>
				</div>
				<div className="min-h-0 overflow-hidden px-6">
					<AgentBrowser {...browserProps} />
				</div>
			</DialogContent>
		</Dialog>
	);
}

export function AgentBrowser({
	agents,
	categories = DEFAULT_CATEGORIES,
	sidebarGroups = [],
	onSelectAgent,
}: Readonly<AgentBrowserProps>) {
	const initialCategory = categories[0]?.id ?? "all";
	const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => filterByQuery(agents, query), [agents, query]);

	return (
		<div className="grid h-full min-h-0 grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)]">
			<DirectorySidebar
				categories={categories}
				activeCategory={activeCategory}
				onSelectCategory={setActiveCategory}
				sidebarGroups={sidebarGroups}
				agents={agents}
				onSelectAgent={onSelectAgent}
			/>

			<div className="-mx-4 flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-4 pt-2 pb-6">
				<InputGroup>
					<InputGroupAddon>
						<SearchIcon label="" />
					</InputGroupAddon>
					<InputGroupInput
						aria-label="Search agents"
						placeholder="Search agents"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
				</InputGroup>

				<div className="flex items-center justify-between">
					<Button variant="outline">
						Sort by popularity
						<Icon render={<ChevronDownIcon label="" size="small" color="currentColor" />} />
					</Button>
					<p className="text-sm leading-5 text-text-subtle">
						Showing {filtered.length.toLocaleString("en-US")} results
					</p>
				</div>

				{filtered.length === 0 ? (
					<p className="text-sm text-text-subtlest">No agents match &ldquo;{query}&rdquo;.</p>
				) : (
					<AgentSection agents={filtered} onSelectAgent={onSelectAgent} />
				)}
			</div>
		</div>
	);
}

interface DirectorySidebarProps {
	categories: readonly AgentBrowserCategory[];
	activeCategory: string;
	onSelectCategory: (category: string) => void;
	sidebarGroups: readonly AgentBrowserSidebarGroup[];
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function DirectorySidebar({
	categories,
	activeCategory,
	onSelectCategory,
	sidebarGroups,
	agents,
	onSelectAgent,
}: Readonly<DirectorySidebarProps>) {
	return (
		<nav aria-label="Agent categories" className="hidden h-full min-h-0 w-[220px] shrink-0 flex-col gap-5 overflow-y-auto pt-1 md:flex">
			<ul className="flex flex-col gap-0.5">
				{categories.map((category) => (
					<SidebarPrimaryItem
						key={category.id}
						label={category.label}
						active={activeCategory === category.id}
						onClick={() => onSelectCategory(category.id)}
					/>
				))}
			</ul>
			{sidebarGroups.map((group) => (
				<SidebarGroup
					key={group.title}
					title={group.title}
					items={getSidebarGroupItems(agents, group)}
					agents={agents}
					onSelectAgent={onSelectAgent}
					showAll={group.showAll}
				/>
			))}
		</nav>
	);
}

interface SidebarPrimaryItemProps {
	label: string;
	active: boolean;
	onClick: () => void;
}

function SidebarPrimaryItem({ label, active, onClick }: Readonly<SidebarPrimaryItemProps>) {
	return (
		<li>
			<SidebarNavItem label={label} isSelected={active} onClick={onClick} />
		</li>
	);
}

interface SidebarGroupProps {
	title: string;
	items: readonly AgentBrowserSidebarItem[];
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
	showAll?: boolean;
}

function SidebarGroup({ title, items, agents, onSelectAgent, showAll = false }: Readonly<SidebarGroupProps>) {
	if (items.length === 0) return null;
	return (
		<div className="flex flex-col gap-1.5">
			<p style={{ font: token("font.heading.xxsmall") }} className="px-1.5 text-text-subtlest">
				{title}
			</p>
			<ul className="flex flex-col gap-0.5">
				{items.map((item) => {
					const agent = agents.find((candidate) => candidate.id === item.id);
					return (
						<li key={item.id}>
							<SidebarNavItem
								label={item.label}
								leading={<SidebarItemAvatar item={item} />}
								leadingSize="medium"
								onClick={agent ? () => onSelectAgent?.(agent) : undefined}
							/>
						</li>
					);
				})}
				{showAll ? (
					<li>
						<SidebarNavItem
							label="Show all"
							leading={<AlignTextLeftIcon label="" size="small" />}
							leadingSize="medium"
						/>
					</li>
				) : null}
			</ul>
		</div>
	);
}

function SidebarItemAvatar({ item }: Readonly<{ item: AgentBrowserSidebarItem }>) {
	if (item.avatarSrc.startsWith("/avatar-project/")) {
		return (
			<span className="flex size-6 shrink-0 items-center justify-center">
				<Avatar size="sm" shape="square" label={item.label} className="size-5">
					<AvatarImage alt="" aria-hidden src={item.avatarSrc} />
				</Avatar>
			</span>
		);
	}

	return (
		<Avatar size="sm" shape="square" className="shrink-0 after:border-0">
			<Image
				alt=""
				aria-hidden
				className="size-full object-contain"
				height={24}
				src={item.avatarSrc}
				width={24}
			/>
		</Avatar>
	);
}

interface AgentSectionProps {
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function AgentSection({ agents, onSelectAgent }: Readonly<AgentSectionProps>) {
	return (
		<section aria-label="Agents">
			<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{agents.map((agent) => {
					const publisher = derivePublisher(agent.byline);
					return (
						<li key={agent.id}>
							<CardDirectoryAgent
								avatarImageClassName={getDirectoryCardAvatarClassName(agent)}
								avatarSrc={agent.avatarSrc}
								chatCount={syntheticChats(agent.id)}
								description={agent.description}
								feedbackCount={syntheticFeedback(agent.id)}
								name={agent.name}
								onMoreActions={() => {}}
								onSelect={onSelectAgent ? () => onSelectAgent(agent) : undefined}
								publisher={publisher}
								rating={syntheticRating(agent.id)}
								verified={isVerified(agent, publisher)}
							/>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
