"use client";

import * as React from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AppsIcon from "@atlaskit/icon/core/apps";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import PersonAvatarIcon from "@atlaskit/icon/core/person-avatar";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import TeamworkGraphIcon from "@atlaskit/icon-lab/core/teamwork-graph";
import { token } from "@/lib/tokens";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { SidebarNavItem } from "@/components/ui/sidebar-nav-item";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import { cn } from "@/lib/utils";

interface RovoAppSidebarProps {
	activeThreadId: string | null;
	agentCreationThreadIds?: ReadonlySet<string>;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	hoverOpen?: boolean;
	isResizing?: boolean;
	onDeleteThread: (threadId: string) => Promise<void>;
	onNewChat: () => void;
	onSidebarMouseEnter?: () => void;
	onSidebarMouseLeave?: () => void;
	onSelectThread: (threadId: string) => Promise<void>;
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

interface ActiveStudioAgentCreationThread {
	id: string;
	title: string;
}

function getAgentCreationThreadTitle(thread: RovoAppThread | null): string {
	const title = thread?.title.trim();

	if (title && title !== "New chat") {
		return title;
	}

	return "Agent creation";
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

function StudioSidebarNavigation({
	activeAgentCreationThread,
	onSelectAgentCreationThread,
}: Readonly<{
	activeAgentCreationThread: ActiveStudioAgentCreationThread | null;
	onSelectAgentCreationThread?: (threadId: string) => void;
}>) {
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
								const shouldShowAgentCreationThread = isAgentsItem && activeAgentCreationThread !== null;

								return (
									<React.Fragment key={item.label}>
										<StudioSidebarNavItem
											{...item}
											isExpanded={shouldShowAgentCreationThread ? true : item.isExpanded}
											isSelected={shouldShowAgentCreationThread ? false : item.isSelected}
										/>
										{shouldShowAgentCreationThread ? (
											<div className="mt-0.5 pl-7">
												<SidebarNavItem
													label={activeAgentCreationThread.title}
													leading={<AiAgentIcon label="" />}
													leadingSize="small"
													isSelected
													onClick={() => onSelectAgentCreationThread?.(activeAgentCreationThread.id)}
													className="min-h-7"
												/>
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
	agentCreationThreadIds,
	hoverOpen = false,
	isResizing,
	onSelectThread,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	resizeHandle,
	threads,
	topOffset = false,
}: Readonly<RovoAppSidebarProps>) {
	const activeAgentCreationThread = React.useMemo<ActiveStudioAgentCreationThread | null>(() => {
		if (!activeThreadId || !agentCreationThreadIds?.has(activeThreadId)) {
			return null;
		}

		const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? null;

		return {
			id: activeThreadId,
			title: getAgentCreationThreadTitle(activeThread),
		};
	}, [activeThreadId, agentCreationThreadIds, threads]);

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
					activeAgentCreationThread={activeAgentCreationThread}
					onSelectAgentCreationThread={(threadId) => {
						void onSelectThread(threadId);
					}}
				/>
			</SidebarContent>
		</Sidebar>
	);
}
