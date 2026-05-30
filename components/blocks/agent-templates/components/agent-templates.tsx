"use client";

import { type MouseEvent, type ReactElement, useMemo, useRef, useState } from "react";
import AngleBracketsIcon from "@atlaskit/icon/core/angle-brackets";
import ChartBarIcon from "@atlaskit/icon/core/chart-bar";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CreditCardIcon from "@atlaskit/icon/core/credit-card";
import CrossIcon from "@atlaskit/icon/core/cross";
import HeadphonesIcon from "@atlaskit/icon/core/headphones";
import PageIcon from "@atlaskit/icon/core/page";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import ProjectIcon from "@atlaskit/icon/core/project";
import SettingsIcon from "@atlaskit/icon/core/settings";
import ShapesIcon from "@atlaskit/icon/core/shapes";
import ShieldIcon from "@atlaskit/icon/core/shield";

import {
	type AgentBrowserAgent,
	type AgentBrowserSidebarGroup,
} from "@/components/blocks/agent-browser";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
	CardDirectoryAgentExpanded,
	type CardDirectoryTemplateSkill,
} from "@/components/ui-custom/card-directory";
import { type TwgToolSource } from "@/components/ui-custom/twg-tool";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * Carousel agents extend the shared `AgentBrowserAgent` identity with the richer
 * directory-card detail (`CardDirectoryAgentExpanded`) renders. Every detail field
 * is optional so plain `AgentBrowserAgent` data still satisfies the type — the card
 * derives a publisher from `byline` and falls back gracefully when detail is absent.
 */
export interface AgentTemplatesAgent extends AgentBrowserAgent {
	publisher?: string;
	verified?: boolean;
	capabilities?: readonly string[];
	sources?: ReadonlyArray<TwgToolSource>;
	skills?: ReadonlyArray<CardDirectoryTemplateSkill>;
	stats?: ReadonlyArray<{ value: string; label: string }>;
	collaborators?: ReadonlyArray<{ src: string; name: string }>;
	collaboratorOverflow?: number;
}
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
	{ id: "projects", label: "Projects", icon: <ProjectIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-blue" },
	{ id: "admin", label: "Admin", icon: <SettingsIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-subtle" },
	{ id: "content", label: "Content", icon: <PageIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-teal" },
	{ id: "analytics", label: "Analytics", icon: <ChartBarIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-green" },
	{ id: "development", label: "Development", icon: <AngleBracketsIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-discovery" },
	{ id: "support", label: "Support", icon: <HeadphonesIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-orange" },
	{ id: "design", label: "Design", icon: <ShapesIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-purple" },
	{ id: "security", label: "Security", icon: <ShieldIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-success" },
	{ id: "people", label: "People", icon: <PeopleGroupIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-warning" },
	{ id: "sales", label: "Sales", icon: <CreditCardIcon label="" size="small" color="currentColor" />, iconClassName: "text-icon-accent-magenta" },
] as const;

const EMPTY_CAPABILITIES: readonly string[] = [];

/** Pull the publisher from a byline like "Customer feedback insights by Atlassian" → "Atlassian". */
function deriveAgentPublisher(byline: string): string {
	return byline.match(/\bby\s+(.+)$/iu)?.[1].trim() ?? byline;
}

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
				className="grid h-[min(725px,calc(100svh-2rem))] max-h-[calc(100svh-2rem)] w-[min(1248px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-xl border border-border bg-surface p-0 shadow-xl sm:max-w-[1248px]"
				showCloseButton={false}
			>
				<header className="border-b border-border px-6 py-6">
					<div className="flex h-8 items-center justify-between gap-4">
						<div
							aria-label="Template categories"
							className="flex min-w-0 items-center gap-2 overflow-x-auto p-1 -m-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
						className="mt-4 text-text"
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
							<AgentTemplateCard
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

function AgentTemplateCard({
	agent,
	onSelectAgent,
}: Readonly<{
	agent: AgentTemplatesAgent;
	onSelectAgent?: (agent: AgentTemplatesAgent) => void;
}>) {
	// Fixed 360px width keeps cards in step with AGENT_TEMPLATES_CARD_SCROLL_OFFSET (360 + 16 gap);
	// `h-full` fills the carousel row, `shrink-0` stops the flex track from squeezing them.
	return (
		<CardDirectoryAgentExpanded
			avatarSrc={agent.avatarSrc}
			capabilities={agent.capabilities ?? EMPTY_CAPABILITIES}
			className="h-full w-90 shrink-0"
			collaboratorOverflow={agent.collaboratorOverflow}
			collaborators={agent.collaborators}
			description={agent.description}
			name={agent.name}
			onSelect={onSelectAgent ? () => onSelectAgent(agent) : undefined}
			publisher={agent.publisher ?? deriveAgentPublisher(agent.byline)}
			skills={agent.skills}
			sources={agent.sources}
			stats={agent.stats}
			verified={agent.verified}
		/>
	);
}
