"use client";

import Image from "next/image";
import { type KeyboardEvent, type MouseEvent, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CrossIcon from "@atlaskit/icon/core/cross";
import SearchIcon from "@atlaskit/icon/core/search";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
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
const AGENT_CARD_OVERLAY_SHADOW = token("elevation.shadow.overlay");
const AGENT_CARD_HOVER_ANIMATION = {
	borderColor: "transparent",
	boxShadow: AGENT_CARD_OVERLAY_SHADOW,
	transform: "scale(1.006)",
} as const;
const AGENT_CARD_REDUCED_HOVER_ANIMATION = {
	borderColor: "transparent",
	boxShadow: AGENT_CARD_OVERLAY_SHADOW,
} as const;
const AGENT_CARD_TAP_ANIMATION = {
	transform: "scale(0.998)",
} as const;
const AGENT_CARD_HOVER_TRANSITION = {
	type: "spring",
	bounce: 0.16,
	visualDuration: 0.22,
} as const;

function derivePublisher(byline: string): string {
	const match = /\bby\s+(.+)$/i.exec(byline);
	return (match?.[1] ?? byline).trim();
}

function isVerified(agent: AgentBrowserAgent, publisher: string): boolean {
	if (agent.attributionKind) return agent.attributionKind === "company";
	return ["atlassian", "google", "github", "slack", "notion"].includes(publisher.toLowerCase());
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
				<div className="min-h-0 overflow-hidden px-6 pb-6">
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

			<div className="flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto">
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
		<nav aria-label="Agent categories" className="hidden h-full min-h-0 w-[220px] shrink-0 flex-col gap-5 overflow-y-auto md:flex">
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
	const verified = isVerified(agent, publisher);
	const rating = syntheticRating(agent.id);
	const feedback = syntheticFeedback(agent.id);
	const chats = syntheticChats(agent.id);
	const interactive = Boolean(onSelectAgent);
	const shouldReduceMotion = useReducedMotion();
	const hoverAnimation = shouldReduceMotion ? AGENT_CARD_REDUCED_HOVER_ANIMATION : AGENT_CARD_HOVER_ANIMATION;
	const tapAnimation = shouldReduceMotion ? undefined : AGENT_CARD_TAP_ANIMATION;
	const handleSelectAgent = () => onSelectAgent?.(agent);
	const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (!interactive) return;
		if (event.key !== "Enter" && event.key !== " ") return;

		event.preventDefault();
		handleSelectAgent();
	};
	const handleMoreActionClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
	};

	const content = (
		<>
			<div className="flex items-start gap-2">
				<Avatar size="default" shape="hexagon" className="shrink-0">
					<Image
						alt=""
						aria-hidden
						className={getDirectoryCardAvatarClassName(agent)}
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
				<Button
					aria-label={`More actions for ${agent.name}`}
					className="size-6 shrink-0 cursor-pointer opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100"
					onClick={handleMoreActionClick}
					size="icon-xs"
					type="button"
					variant="ghost"
				>
					<ShowMoreHorizontalIcon label="" size="small" />
				</Button>
			</div>

			<p className="line-clamp-2 min-h-10 text-sm leading-5 text-text">
				{agent.description ?? `Learn how ${agent.name} can help your team work faster.`}
			</p>

			<div className="flex items-center gap-4 text-xs leading-4 text-text-subtlest">
				<span className="inline-flex items-center gap-1">
					<Icon
						className="size-3 text-icon-subtlest [&_svg]:size-3"
						render={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
					/>
					{rating.toFixed(1)} ({formatCompact(feedback)} feedback)
				</span>
				<span className="inline-flex items-center gap-1">
					<Icon
						className="size-3 text-icon-subtlest [&_svg]:size-3"
						render={<AiChatIcon label="" size="small" spacing="none" color="currentColor" />}
					/>
					{formatCompact(chats)} chats
				</span>
			</div>
		</>
	);

	const cardClassName =
		"group/card flex h-full w-full cursor-pointer flex-col gap-3 rounded-md border border-border bg-surface p-4 text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
	const cardMotionProps = {
		className: cardClassName,
		style: { willChange: "transform, box-shadow, border-color" },
		transition: AGENT_CARD_HOVER_TRANSITION,
		whileHover: hoverAnimation,
	};

	if (interactive) {
		return (
			<motion.article
				aria-label={`Select ${agent.name}`}
				onClick={handleSelectAgent}
				onKeyDown={handleCardKeyDown}
				role="button"
				tabIndex={0}
				whileTap={tapAnimation}
				{...cardMotionProps}
			>
				{content}
			</motion.article>
		);
	}

	return <motion.article {...cardMotionProps}>{content}</motion.article>;
}
