"use client";

import Image from "next/image";
import { type MouseEvent, type ReactElement, type ReactNode, useMemo, useRef, useState } from "react";
import AiGenerativeTextSummaryIcon from "@atlaskit/icon/core/ai-generative-text-summary";
import CheckboxCheckedIcon from "@atlaskit/icon/core/checkbox-checked";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CrossIcon from "@atlaskit/icon/core/cross";
import EditIcon from "@atlaskit/icon/core/edit";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";
import MagicWandIcon from "@atlaskit/icon/core/magic-wand";
import SearchIcon from "@atlaskit/icon/core/search";
import BookOpenIcon from "@atlaskit/icon-lab/core/book-open";

import {
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export type AgentTemplatesAgent = AgentBrowserAgent;
export type AgentTemplatesSidebarGroup = AgentBrowserSidebarGroup;

export interface AgentTemplatesDialogProps {
	agents: readonly AgentTemplatesAgent[];
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	sessionAgents?: readonly AgentTemplatesAgent[];
	sidebarGroups?: readonly AgentTemplatesSidebarGroup[];
	title?: string;
}

const EMPTY_AGENT_TEMPLATES_AGENTS: readonly AgentTemplatesAgent[] = [];
const AGENT_TEMPLATES_DEFAULT_TITLE = "Personal agents that run routines, organize your context, and help you follow through.";
const AGENT_TEMPLATES_CARD_SCROLL_OFFSET = 376;

type AgentTemplatesCategory = {
	id: string;
	label: string;
	icon: ReactElement;
	iconClassName: string;
};

const AGENT_TEMPLATES_CATEGORIES: readonly AgentTemplatesCategory[] = [
	{ id: "analyze", label: "Analyze", icon: <EditIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-discovery" },
	{ id: "brainstorm", label: "Brainstorm", icon: <LightbulbIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-warning" },
	{ id: "review", label: "Review", icon: <EyeOpenIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-orange" },
	{ id: "summarize", label: "Summarize", icon: <AiGenerativeTextSummaryIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-blue" },
	{ id: "create", label: "Create", icon: <MagicWandIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-purple" },
	{ id: "execute", label: "Execute", icon: <CheckboxCheckedIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-success" },
	{ id: "find", label: "Find", icon: <SearchIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-blue" },
	{ id: "learn", label: "Learn", icon: <BookOpenIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-purple" },
] as const;

const PLACEHOLDER_FEATURES: readonly string[] = [
	"Feature description",
	"Feature description",
	"Feature description",
	"Feature description",
	"Feature description",
	"Feature description",
];

export function AgentTemplatesDialog({
	agents,
	onSelectAgent,
	open,
	onOpenChange,
	sessionAgents = EMPTY_AGENT_TEMPLATES_AGENTS,
	sidebarGroups,
	title = AGENT_TEMPLATES_DEFAULT_TITLE,
}: Readonly<AgentTemplatesDialogProps>) {
	void sidebarGroups;

	const scrollRef = useRef<HTMLDivElement>(null);
	const [activeCategory, setActiveCategory] = useState(AGENT_TEMPLATES_CATEGORIES[0].id);
	const templateAgents = useMemo(
		() => [...agents, ...sessionAgents],
		[agents, sessionAgents],
	);

	const handleScrollNext = (event: MouseEvent<HTMLButtonElement>) => {
		const scrollElement =
			scrollRef.current ??
			event.currentTarget.parentElement?.querySelector<HTMLDivElement>("[data-agent-templates-carousel]");
		if (!scrollElement) return;

		const previousScrollLeft = scrollElement.scrollLeft;
		scrollElement.scrollBy({
			left: AGENT_TEMPLATES_CARD_SCROLL_OFFSET,
			behavior: "smooth",
		});
		window.setTimeout(() => {
			if (scrollElement.scrollLeft !== previousScrollLeft) return;
			scrollElement.scrollBy({
				left: AGENT_TEMPLATES_CARD_SCROLL_OFFSET,
			});
		}, 150);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="grid h-[min(725px,calc(100svh-2rem))] max-h-[calc(100svh-2rem)] w-[min(1248px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] grid-rows-[192px_minmax(0,1fr)] gap-0 overflow-hidden rounded-xl border border-border bg-surface p-0 shadow-xl sm:max-w-[1248px]"
				showCloseButton={false}
			>
				<header className="px-6 pt-6">
					<div className="flex h-8 items-center justify-between gap-4">
						<div
							aria-label="Template categories"
							className="flex min-w-0 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
							role="group"
						>
							{AGENT_TEMPLATES_CATEGORIES.map((category) => (
								<AgentTemplatesCategoryButton
									active={activeCategory === category.id}
									category={category}
									key={category.id}
									onClick={() => setActiveCategory(category.id)}
								/>
							))}
						</div>
						<DialogClose render={<Button aria-label="Close agent templates" className="size-8 shrink-0" size="icon" variant="ghost" />}>
							<CrossIcon label="" />
						</DialogClose>
					</div>
					<DialogTitle
						className="mt-4 max-w-[760px] text-text"
						style={{ font: token("font.heading.xlarge") }}
					>
						{title}
					</DialogTitle>
				</header>

				<div className="relative min-h-0 overflow-hidden">
					<div
						aria-label="Agent templates"
						className="flex h-full gap-4 overflow-x-auto overflow-y-hidden px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
						data-agent-templates-carousel
						ref={scrollRef}
					>
						{templateAgents.map((agent) => (
							<AgentTemplatePlaceholderCard
								agent={agent}
								key={agent.id}
								onSelectAgent={onSelectAgent}
							/>
						))}
					</div>
					<Button
						aria-label="Show next agent templates"
						className="absolute top-1/2 right-3 z-10 size-12 -translate-y-1/2 rounded-md border border-border bg-surface-raised text-icon-subtle shadow-xl hover:bg-bg-neutral-subtle-hovered"
						onClick={handleScrollNext}
						size="icon"
						type="button"
						variant="ghost"
					>
						<Icon
							className="pointer-events-none [&_*]:pointer-events-none"
							render={<ChevronRightIcon label="" color="currentColor" />}
						/>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function AgentTemplatesCategoryButton({
	active,
	category,
	onClick,
}: Readonly<{
	active: boolean;
	category: AgentTemplatesCategory;
	onClick: () => void;
}>) {
	return (
		<Button
			aria-pressed={active}
			className="shrink-0"
			onClick={onClick}
			type="button"
			variant="outline"
		>
			<Icon
				className={cn("size-4 [&_svg]:size-4", category.iconClassName)}
				data-icon="inline-start"
				render={category.icon}
			/>
			{category.label}
		</Button>
	);
}

function AgentTemplatePlaceholderCard({
	agent,
	onSelectAgent,
}: Readonly<{
	agent: AgentTemplatesAgent;
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
}>) {
	const handleSelect = onSelectAgent ? () => onSelectAgent(agent) : undefined;
	const cardContent = (
		<>
			<div className="relative h-12 overflow-hidden rounded-t-md bg-bg-selected-bold">
				<Image
					alt=""
					aria-hidden
					className="absolute top-1/2 right-8 h-28 w-24 -translate-y-1/2 object-contain opacity-20"
					height={112}
					src={agent.avatarSrc}
					width={96}
				/>
			</div>
			<div className="relative flex min-h-0 flex-1 flex-col gap-5 px-4 pt-7 pb-4">
				<Image
					alt=""
					aria-hidden
					className="absolute -top-6 left-4 size-12 object-contain"
					height={48}
					src={agent.avatarSrc}
					width={48}
				/>
				<div className="flex flex-col gap-2">
					<div>
						<h3 className="truncate text-text" style={{ font: token("font.heading.small") }}>
							{agent.name}
						</h3>
						<p className="mt-1 truncate text-sm leading-5 text-text-subtle">
							{agent.byline}
						</p>
					</div>
					<p className="line-clamp-2 min-h-10 text-sm leading-5 text-text">
						{agent.description ?? "Take the busywork out of project management with automatic content updates."}
					</p>
				</div>
				<PlaceholderSection label="Works with">
					<div className="flex items-center gap-1">
						{["bg-bg-warning", "bg-bg-selected-bold", "bg-bg-success", "bg-bg-discovery", "bg-bg-information", "bg-bg-neutral"].map((className, index) => (
							<span
								aria-hidden
								className={cn("size-6 rounded-md border border-border", className)}
								key={`${agent.id}-source-${index}`}
							/>
						))}
					</div>
				</PlaceholderSection>
				<PlaceholderSection label="Skills">
					<div className="flex gap-2">
						<span className="h-5 w-[150px] rounded bg-bg-neutral-subtle" />
						<span className="h-5 w-[150px] rounded bg-bg-neutral-subtle" />
					</div>
				</PlaceholderSection>
				<div className="mt-auto rounded-xl border border-border bg-bg-input p-3">
					<ul className="flex max-h-40 flex-col gap-2 overflow-hidden">
						{PLACEHOLDER_FEATURES.map((feature, index) => (
							<li className="flex items-center gap-3" key={`${agent.id}-feature-${index}`}>
								<span className="grid size-5 shrink-0 place-items-center rounded-md bg-bg-neutral-subtle text-icon-subtlest">
									<MagicWandIcon label="" size="small" />
								</span>
								<span className="truncate text-sm leading-5 text-text-subtle">{feature}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</>
	);

	if (handleSelect) {
		return (
			<button
				aria-label={`Select ${agent.name}`}
				className="flex h-[518px] w-[360px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-border bg-surface text-left outline-none transition-colors hover:bg-bg-neutral-subtle-hovered focus-visible:border-border-selected focus-visible:ring-3 focus-visible:ring-ring/50"
				onClick={handleSelect}
				type="button"
			>
				{cardContent}
			</button>
		);
	}

	return (
		<article className="flex h-[518px] w-[360px] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-surface">
			{cardContent}
		</article>
	);
}

function PlaceholderSection({
	label,
	children,
}: Readonly<{
	label: string;
	children: ReactNode;
}>) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-xs font-semibold leading-4 text-text-subtlest">{label}</span>
			{children}
		</div>
	);
}
