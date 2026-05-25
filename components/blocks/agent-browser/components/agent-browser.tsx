"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CommentIcon from "@atlaskit/icon/core/comment";
import SearchIcon from "@atlaskit/icon/core/search";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";
import StarStarredIcon from "@atlaskit/icon/core/star-starred";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export interface AgentBrowserAgent {
	id: string;
	name: string;
	byline: string;
	avatarSrc: string;
	description?: string;
}

export interface AgentBrowserSidebarGroup {
	title: string;
	agentIds: readonly string[];
}

export interface AgentBrowserCategory {
	id: string;
	label: string;
}

export interface AgentBrowserProps {
	agents: readonly AgentBrowserAgent[];
	categories?: readonly AgentBrowserCategory[];
	sidebarGroups?: readonly AgentBrowserSidebarGroup[];
	recommendedCount?: number;
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
const DEFAULT_RECOMMENDED_COUNT = 4;

function derivePublisher(byline: string): string {
	const match = /\bby\s+(.+)$/i.exec(byline);
	return (match?.[1] ?? byline).trim();
}

function isVerified(publisher: string): boolean {
	return publisher.toLowerCase() === "atlassian";
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

function formatCompact(value: number): string {
	if (value >= 10000) return `${Math.round(value / 1000)}K`;
	if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
	return `${value}`;
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
	ids: readonly string[],
): readonly AgentBrowserAgent[] {
	return ids
		.map((id) => all.find((agent) => agent.id === id))
		.filter((agent): agent is AgentBrowserAgent => Boolean(agent));
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
				className="grid max-h-[85vh] grid-rows-[auto_minmax(0,1fr)] gap-0 p-0 sm:max-w-[1200px]"
			>
				<div className="flex items-center justify-between px-6 pt-6 pb-4">
					<DialogTitle className="text-base font-medium leading-5 text-text">
						{title}
					</DialogTitle>
				</div>
				<div className="min-h-0 overflow-y-auto px-6 pb-6">
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
	recommendedCount = DEFAULT_RECOMMENDED_COUNT,
	onSelectAgent,
}: Readonly<AgentBrowserProps>) {
	const initialCategory = categories[0]?.id ?? "all";
	const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => filterByQuery(agents, query), [agents, query]);
	const recommended = filtered.slice(0, recommendedCount);
	const rest = filtered.slice(recommendedCount);

	return (
		<div className="flex gap-8">
			<DirectorySidebar
				categories={categories}
				activeCategory={activeCategory}
				onSelectCategory={setActiveCategory}
				sidebarGroups={sidebarGroups}
				agents={agents}
				onSelectAgent={onSelectAgent}
			/>

			<div className="flex min-w-0 flex-1 flex-col gap-5">
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
					<Button variant="outline" size="sm" className="gap-1.5 rounded-xs font-normal text-text">
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
					<div className="flex flex-col gap-8">
						{recommended.length > 0 ? (
							<AgentSection
								title="Recommended"
								agents={recommended}
								onSelectAgent={onSelectAgent}
							/>
						) : null}
						{rest.length > 0 ? (
							<AgentSection title="All agents" agents={rest} onSelectAgent={onSelectAgent} />
						) : null}
					</div>
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
		<nav aria-label="Agent categories" className="hidden w-[220px] shrink-0 flex-col gap-5 md:flex">
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
					agents={pickAgentsByIds(agents, group.agentIds)}
					onSelectAgent={onSelectAgent}
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
			<button
				type="button"
				onClick={onClick}
				aria-current={active ? "page" : undefined}
				className={cn(
					"relative flex w-full items-center rounded-xs px-3 py-1.5 text-left text-sm leading-5 transition-colors duration-fast ease-out",
					active
						? "bg-selected text-selected-text font-medium before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-selected-text"
						: "text-text hover:bg-neutral-subtle-hovered",
				)}
			>
				{label}
			</button>
		</li>
	);
}

interface SidebarGroupProps {
	title: string;
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function SidebarGroup({ title, agents, onSelectAgent }: Readonly<SidebarGroupProps>) {
	if (agents.length === 0) return null;
	return (
		<div className="flex flex-col gap-1.5">
			<p className="px-3 text-xs font-semibold uppercase leading-4 tracking-wide text-text-subtlest">
				{title}
			</p>
			<ul className="flex flex-col gap-0.5">
				{agents.map((agent) => (
					<li key={agent.id}>
						<button
							type="button"
							onClick={() => onSelectAgent?.(agent)}
							className="flex w-full items-center gap-2 rounded-xs px-3 py-1.5 text-left text-sm leading-5 text-text transition-colors duration-fast ease-out hover:bg-neutral-subtle-hovered"
						>
							<Avatar size="sm" shape="square" className="shrink-0">
								<Image
									alt=""
									aria-hidden
									className="size-full object-contain"
									height={24}
									src={agent.avatarSrc}
									width={24}
								/>
							</Avatar>
							<span className="truncate">{agent.name}</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}

interface AgentSectionProps {
	title: string;
	agents: readonly AgentBrowserAgent[];
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function AgentSection({ title, agents, onSelectAgent }: Readonly<AgentSectionProps>) {
	return (
		<section className="flex flex-col gap-3">
			<h2 className="text-xs font-semibold uppercase leading-4 tracking-wide text-text-subtlest">
				{title}
			</h2>
			<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{agents.map((agent) => (
					<li key={agent.id}>
						<AgentDirectoryCard agent={agent} onSelectAgent={onSelectAgent} />
					</li>
				))}
			</ul>
		</section>
	);
}

interface AgentDirectoryCardProps {
	agent: AgentBrowserAgent;
	onSelectAgent?: (agent: AgentBrowserAgent) => void;
}

function AgentDirectoryCard({ agent, onSelectAgent }: Readonly<AgentDirectoryCardProps>) {
	const publisher = derivePublisher(agent.byline);
	const verified = isVerified(publisher);
	const rating = syntheticRating(agent.id);
	const feedback = syntheticFeedback(agent.id);
	const chats = syntheticChats(agent.id);
	const interactive = Boolean(onSelectAgent);

	const content = (
		<>
			<div className="flex items-start gap-3">
				<Avatar size="default" shape="hexagon" className="shrink-0">
					<Image
						alt=""
						aria-hidden
						className="size-full object-contain"
						height={32}
						src={agent.avatarSrc}
						width={32}
					/>
				</Avatar>
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-base font-semibold leading-5 text-text">{agent.name}</h3>
					<p className="flex items-center gap-1 text-xs leading-4 text-text-subtle">
						<span>By</span>
						<span className="truncate text-link">{publisher}</span>
						{verified ? (
							<Icon
								className="text-icon-information"
								render={<StatusVerifiedIcon label="Verified" size="small" color="currentColor" />}
							/>
						) : null}
					</p>
				</div>
			</div>

			<p className="line-clamp-2 min-h-10 text-xs leading-5 text-text-subtle">
				{agent.description ?? `Learn how ${agent.name} can help your team work faster.`}
			</p>

			<div className="flex items-center gap-4 text-xs leading-4 text-text-subtle">
				<span className="inline-flex items-center gap-1">
					<Icon className="text-icon-subtle" render={<StarStarredIcon label="" size="small" color="currentColor" />} />
					{rating.toFixed(1)} ({formatCompact(feedback)} feedback)
				</span>
				<span className="inline-flex items-center gap-1">
					<Icon className="text-icon-subtle" render={<CommentIcon label="" size="small" color="currentColor" />} />
					{formatCompact(chats)} chats
				</span>
			</div>
		</>
	);

	const cardClassName =
		"flex h-full w-full flex-col gap-3 rounded-md border border-border bg-surface p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-fast ease-out hover:-translate-y-0.5 hover:border-border-selected hover:bg-surface-hovered";

	if (interactive) {
		return (
			<button type="button" onClick={() => onSelectAgent?.(agent)} className={cardClassName}>
				{content}
			</button>
		);
	}

	return <article className={cardClassName}>{content}</article>;
}
