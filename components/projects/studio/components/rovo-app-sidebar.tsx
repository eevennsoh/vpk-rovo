"use client";

import * as React from "react";
import Image from "next/image";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AppsIcon from "@atlaskit/icon/core/apps";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import MenuIcon from "@atlaskit/icon/core/menu";
import PersonAvatarIcon from "@atlaskit/icon/core/person-avatar";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import TeamworkGraphIcon from "@atlaskit/icon-lab/core/teamwork-graph";
import { token } from "@/lib/tokens";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import type { StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
import { getStudioSidebarRecentAgents, type StudioSidebarRecentAgentItem } from "@/components/projects/studio/lib/studio-sidebar-recent-agents";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import { cn } from "@/lib/utils";

interface RovoAppSidebarProps {
	activeThreadId: string | null;
	agentCreationThreads?: ReadonlyArray<StudioAgentCreationThread>;
	selectedAgentId?: string;
	sessionAgentEntries?: ReadonlyArray<StudioSessionAgentEntry>;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	hoverOpen?: boolean;
	isResizing?: boolean;
	onDeleteThread: (threadId: string) => Promise<void>;
	onNewChat: () => void;
	onSelectAgent?: (agentId: string) => void;
	onSidebarMouseEnter?: () => void;
	onSidebarMouseLeave?: () => void;
	onSelectThread: (threadId: string) => Promise<void>;
	onViewAllAgents?: () => void;
	resizeHandle?: React.ReactNode;
	threads: ReadonlyArray<RovoAppThread>;
	threadsLoaded?: boolean;
	topOffset?: boolean;
}

interface StudioSidebarNavItem {
	icon: React.ReactNode;
	isExpanded?: boolean;
	isSelected?: boolean;
	label: string;
}

interface StudioSidebarNavSection {
	items: ReadonlyArray<StudioSidebarNavItem>;
	title?: string;
}

const STUDIO_SIDEBAR_NAV_SECTIONS: ReadonlyArray<StudioSidebarNavSection> = [
	{
		items: [
			{
				icon: <PersonAvatarIcon label="" />,
				label: "For you",
			},
			{
				icon: <ChartTrendUpIcon label="" />,
				label: "Insights",
			},
		],
	},
	{
		title: "Browse",
		items: [
			{
				icon: <SkillIcon label="" />,
				label: "Skills",
			},
			{
				icon: <TeamworkGraphIcon label="" />,
				label: "Teamwork Graph",
			},
		],
	},
	{
		title: "Build",
		items: [
			{
				icon: <AppsIcon label="" />,
				label: "Apps",
			},
			{
				icon: <AiAgentIcon label="" />,
				isSelected: true,
				label: "Agents",
			},
			{
				icon: <AutomationIcon label="" />,
				label: "Automation",
			},
		],
	},
];

interface StudioAgentCreationThread {
	id: string;
	lastTouchedAt: number;
	title: string;
}

function StudioSidebarNavItem({ icon, isExpanded, isSelected = false, label }: Readonly<StudioSidebarNavItem>) {
	return (
		<SidebarNavItem
			label={label}
			leading={icon}
			leadingSize="medium"
			isExpanded={isExpanded}
			isSelected={isSelected}
		/>
	);
}

function StudioSidebarAgentAvatar({
	label = "",
	size = "small",
	src,
}: Readonly<{
	label?: string;
	size?: "small" | "medium";
	src: string;
}>) {
	return (
		<Image
			alt={label}
			aria-hidden={label ? undefined : true}
			className={cn(size === "small" ? "size-4" : "size-5", "object-contain")}
			height={16}
			src={src}
			width={16}
		/>
	);
}

function getRecentAgentItemSelected(
	item: StudioSidebarRecentAgentItem,
	activeThreadId: string | null,
	selectedAgentId?: string,
): boolean {
	if (item.kind === "wip") {
		return item.id === activeThreadId;
	}

	return item.id === selectedAgentId;
}

function StudioSidebarNavigation({
	activeThreadId,
	agentCreationThreads = [],
	onSelectAgent,
	onSelectAgentCreationThread,
	onViewAllAgents,
	selectedAgentId,
	sessionAgentEntries = [],
}: Readonly<{
	activeThreadId: string | null;
	agentCreationThreads?: ReadonlyArray<StudioAgentCreationThread>;
	onSelectAgent?: (agentId: string) => void;
	onSelectAgentCreationThread?: (threadId: string) => void;
	onViewAllAgents?: () => void;
	selectedAgentId?: string;
	sessionAgentEntries?: ReadonlyArray<StudioSessionAgentEntry>;
}>) {
	const recentAgents = React.useMemo(() => getStudioSidebarRecentAgents([
		...agentCreationThreads.map((thread) => ({
			id: thread.id,
			kind: "wip" as const,
			label: thread.title,
			lastTouchedAt: thread.lastTouchedAt,
		})),
		...sessionAgentEntries.map((entry) => ({
			avatarSrc: entry.profile.avatarSrc,
			id: entry.profile.id,
			kind: "agent" as const,
			label: entry.profile.name,
			lastTouchedAt: entry.lastTouchedAt,
		})),
	]), [agentCreationThreads, sessionAgentEntries]);
	const hasRecentAgents = recentAgents.items.length > 0;
	const hasSelectedRecentAgent = recentAgents.items.some((item) =>
		getRecentAgentItemSelected(item, activeThreadId, selectedAgentId)
	);

	return (
		<nav aria-label="Studio" className="flex shrink-0 flex-col gap-3">
			<div className="flex flex-col gap-3">
				{STUDIO_SIDEBAR_NAV_SECTIONS.map((section, sectionIndex) => (
					<div
						key={section.title ?? `section-${sectionIndex}`}
						className="flex flex-col gap-1"
					>
						{section.title ? (
							<div className="px-1.5 text-xs font-semibold leading-4 text-text-subtlest">
								{section.title}
							</div>
						) : null}
						<div className="flex flex-col">
							{section.items.map((item) => {
								const isAgentsItem = item.label === "Agents";
								const shouldShowRecentAgents = isAgentsItem && hasRecentAgents;

								return (
									<React.Fragment key={item.label}>
										<StudioSidebarNavItem
											{...item}
											isExpanded={shouldShowRecentAgents ? true : item.isExpanded}
											isSelected={shouldShowRecentAgents && hasSelectedRecentAgent ? false : item.isSelected}
										/>
										{shouldShowRecentAgents ? (
											<div className="mt-0.5 flex flex-col gap-0.5 pl-7">
												<div className="px-1.5 text-xs font-semibold leading-4 text-text-subtlest">
													Recent
												</div>
												{recentAgents.items.map((recentAgent) => (
													<SidebarNavItem
														key={`${recentAgent.kind}:${recentAgent.id}`}
														label={recentAgent.label}
														leading={
															recentAgent.avatarSrc ? (
																<StudioSidebarAgentAvatar src={recentAgent.avatarSrc} />
															) : (
																<AiAgentIcon label="" />
															)
														}
														leadingSize="small"
														isSelected={getRecentAgentItemSelected(recentAgent, activeThreadId, selectedAgentId)}
														onClick={() => {
															if (recentAgent.kind === "wip") {
																onSelectAgentCreationThread?.(recentAgent.id);
															} else {
																onSelectAgent?.(recentAgent.id);
															}
														}}
														className="min-h-7"
													/>
												))}
												{recentAgents.showViewAll ? (
													<SidebarNavItem
														label="View all agents"
														leading={<MenuIcon label="" />}
														leadingSize="small"
														onClick={onViewAllAgents}
														className="min-h-7"
													/>
												) : null}
											</div>
										) : null}
									</React.Fragment>
								);
							})}
						</div>
					</div>
				))}
			</div>
		</nav>
	);
}

export function RovoAppSidebar({
	activeThreadId,
	agentCreationThreads,
	hoverOpen = false,
	isResizing,
	selectedAgentId,
	onSelectThread,
	onSelectAgent,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	onViewAllAgents,
	resizeHandle,
	sessionAgentEntries,
	topOffset = false,
}: Readonly<RovoAppSidebarProps>) {
	return (
		<Sidebar
			aria-label="Studio navigation"
			className={cn(
				// Horizontal padding lives on content wrappers, not here; avoid doubling with inner `px-3`.
				"bg-sidebar !px-0 !pb-0",
				// Resize handle paints the divider; container border-r would stack to a 2px edge.
				!resizeHandle && "group-data-[state=expanded]:group-data-[side=left]:border-r group-data-[state=expanded]:group-data-[side=left]:border-border",
				topOffset && "!top-12 !h-[calc(100svh-3rem)]",
			)}
			isResizing={isResizing}
			onMouseEnter={onSidebarMouseEnter}
			onMouseLeave={onSidebarMouseLeave}
			resizeHandle={resizeHandle}
			role="complementary"
			style={hoverOpen ? { left: 0, zIndex: 50, boxShadow: token("elevation.shadow.overlay") } : { zIndex: 50 }}
			variant="inset"
		>
			<SidebarContent className="gap-3 overflow-hidden bg-sidebar px-3">
				<StudioSidebarNavigation
					activeThreadId={activeThreadId}
					agentCreationThreads={agentCreationThreads}
					onSelectAgent={onSelectAgent}
					onSelectAgentCreationThread={(threadId) => {
						void onSelectThread(threadId);
					}}
					onViewAllAgents={onViewAllAgents}
					selectedAgentId={selectedAgentId}
					sessionAgentEntries={sessionAgentEntries}
				/>
			</SidebarContent>
		</Sidebar>
	);
}
