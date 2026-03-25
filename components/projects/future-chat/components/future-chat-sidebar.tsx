"use client";

import * as React from "react";
import {
	differenceInCalendarDays,
	formatDistanceToNowStrict,
	isToday,
	isYesterday,
	parseISO,
} from "date-fns";
import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import ShapesIcon from "@atlaskit/icon/core/shapes";
import SkillIcon from "@atlaskit/icon-lab/core/skill";
import Heading from "@/components/blocks/shared-ui/heading";
import { Button } from "@/components/ui/button";
import { SidebarNavItem, SidebarNavItemAction, SidebarNavItemCount } from "@/components/ui/sidebar-nav-item";
import { Shimmer } from "@/components/ui-ai/shimmer";
import { Spinner } from "@/components/ui/spinner";
import { token } from "@/lib/tokens";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenuAction,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { shouldShowFutureChatSidebarRunIndicator } from "@/components/projects/future-chat/lib/future-chat-sidebar-run-indicator";
import type { FutureChatRunStatus, FutureChatThread } from "@/lib/future-chat-types";
import { cn } from "@/lib/utils";
import DeleteIcon from "@atlaskit/icon/core/delete";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";

interface FutureChatSidebarProps {
	activeThreadId: string | null;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	hoverOpen?: boolean;
	isGeneratingTitle?: boolean;
	onDeleteThread: (threadId: string) => Promise<void>;
	onNewChat: () => void;
	onSidebarMouseEnter?: () => void;
	onSidebarMouseLeave?: () => void;
	onSelectThread: (threadId: string) => Promise<void>;
	pendingTitleThreadId?: string | null;
	threads: ReadonlyArray<FutureChatThread>;
	threadsLoaded?: boolean;
	topOffset?: boolean;
}

type FutureChatThreadSectionLabel =
	| "Today"
	| "Yesterday"
	| "Previous 7 Days"
	| "Previous 30 Days"
	| "Older";

const FUTURE_CHAT_THREAD_SECTION_ORDER: readonly FutureChatThreadSectionLabel[] = [
	"Today",
	"Yesterday",
	"Previous 7 Days",
	"Previous 30 Days",
	"Older",
];

function getFutureChatThreadSectionLabel(updatedAt: string): FutureChatThreadSectionLabel {
	const updatedAtDate = parseISO(updatedAt);
	if (Number.isNaN(updatedAtDate.getTime())) {
		return "Older";
	}

	if (isToday(updatedAtDate)) {
		return "Today";
	}

	if (isYesterday(updatedAtDate)) {
		return "Yesterday";
	}

	const dayDifference = differenceInCalendarDays(new Date(), updatedAtDate);
	if (dayDifference <= 7) {
		return "Previous 7 Days";
	}

	if (dayDifference <= 30) {
		return "Previous 30 Days";
	}

	return "Older";
}

function groupFutureChatThreadsByDate(
	threads: ReadonlyArray<FutureChatThread>,
): ReadonlyArray<{
	label: FutureChatThreadSectionLabel;
	threads: ReadonlyArray<FutureChatThread>;
}> {
	const groupedThreads = new Map<
		FutureChatThreadSectionLabel,
		FutureChatThread[]
	>(
		FUTURE_CHAT_THREAD_SECTION_ORDER.map((label) => [label, []]),
	);

	for (const thread of threads) {
		groupedThreads.get(getFutureChatThreadSectionLabel(thread.updatedAt))?.push(thread);
	}

	return FUTURE_CHAT_THREAD_SECTION_ORDER
		.map((label) => ({
			label,
			threads: groupedThreads.get(label) ?? [],
		}))
		.filter((section) => section.threads.length > 0);
}

function FutureChatSidebarNavItem({
	icon,
	label,
	onClick,
	selected = false,
	showChevron = false,
	trailing,
}: Readonly<{
	icon: React.ReactNode;
	label: string;
	onClick?: () => void;
	selected?: boolean;
	showChevron?: boolean;
	trailing?: React.ReactNode;
}>) {
	return (
		<SidebarMenuItem className="relative">
			<SidebarNavItem
				className={cn(
					selected && "[&_button]:text-text-selected",
				)}
				isSelected={selected}
				label={label}
				leading={icon}
				leadingSize="medium"
				meta={trailing}
				onClick={onClick}
				actions={showChevron ? (
					<SidebarNavItemAction aria-label={`Open ${label}`}>
						<ChevronRightIcon label="" />
					</SidebarNavItemAction>
				) : null}
			/>
		</SidebarMenuItem>
	);
}

function FutureChatSidebarThreadItem({
	isActive,
	isPendingTitle = false,
	onCancelThreadRun,
	runStatus,
	onDeleteThread,
	onSelectThread,
	thread,
}: Readonly<{
	isActive: boolean;
	isPendingTitle?: boolean;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	runStatus?: FutureChatRunStatus | null;
	onDeleteThread: (threadId: string) => Promise<void>;
	onSelectThread: (threadId: string) => Promise<void>;
	thread: FutureChatThread;
}>) {
	const { setOpenMobile } = useSidebar();
	const showRunIndicator = shouldShowFutureChatSidebarRunIndicator(runStatus);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				className="h-auto min-h-9 rounded-lg p-1.5 group-has-data-[sidebar=menu-action]/menu-item:pr-1.5 group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground"
				isActive={isActive}
				onClick={() => {
					setOpenMobile(false);
					void onSelectThread(thread.id);
				}}
				size="lg"
				type="button"
			>
				<div className="min-w-0 flex-1 group-hover/menu-item:mr-[28px] group-has-[[data-sidebar=menu-action][aria-expanded]]/menu-item:mr-[28px]">
					<div className="truncate text-sm font-medium leading-5 text-text-subtle">
						{isPendingTitle ? (
							<Shimmer
								key={`${thread.id}:${thread.title}`}
								as="span"
								duration={1}
								className="block max-w-full truncate motion-safe:animate-[sd-blurIn_160ms_ease-out_both] motion-reduce:animate-none"
							>
								{thread.title}
							</Shimmer>
						) : (
							<span
								key={`${thread.id}:${thread.title}`}
								className="block truncate motion-safe:animate-[sd-blurIn_160ms_ease-out_both] motion-reduce:animate-none"
							>
								{thread.title}
							</span>
						)}
					</div>
					<div className="mt-0.5 flex items-center text-xs font-normal text-text-subtlest">
						<span>
							{formatDistanceToNowStrict(new Date(thread.updatedAt), { addSuffix: true })}
						</span>
					</div>
				</div>
			</SidebarMenuButton>

			<DropdownMenu modal={true}>
				<DropdownMenuTrigger
					render={(
						<SidebarMenuAction
							showOnHover
							className={cn(
								"!top-1/2 right-1 size-6 -translate-y-1/2 rounded-md text-icon-subtle hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-[opacity,transform] duration-normal ease-[var(--ease-out)]",
								showRunIndicator && "group-focus-within/menu-item:opacity-0 aria-expanded:opacity-100 data-[state=open]:opacity-100",
							)}
							onClick={(event) => {
								event.stopPropagation();
							}}
							onPointerDown={(event) => {
								event.stopPropagation();
							}}
							type="button"
						/>
					)}
				>
					<ShowMoreHorizontalIcon label="More" color="currentColor" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" side="bottom">
					<DropdownMenuGroup>
						{showRunIndicator ? (
							<DropdownMenuItem
								elemBefore={<svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="14" rx="2.5" /></svg>}
								onClick={() => void onCancelThreadRun(thread.id)}
							>
								Cancel run
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem
							variant="destructive"
							elemBefore={<DeleteIcon label="" />}
							onClick={() => void onDeleteThread(thread.id)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			{showRunIndicator ? (
				<div className="pointer-events-none absolute inset-y-0 right-1 flex items-center justify-center group-hover/menu-item:hidden group-has-[[data-sidebar=menu-action][aria-expanded=true]]/menu-item:hidden group-has-[[data-sidebar=menu-action][data-state=open]]/menu-item:hidden group-data-[collapsible=icon]:hidden">
					<div className="flex size-6 items-center justify-center">
						<Spinner
							size="xs"
							aria-hidden="true"
							className="shrink-0 text-icon-subtle"
						/>
					</div>
				</div>
			) : null}
		</SidebarMenuItem>
	);
}

function FutureChatSidebarThreadSection({
	activeThreadId,
	isGeneratingTitle,
	label,
	onCancelThreadRun,
	onDeleteThread,
	onSelectThread,
	pendingTitleThreadId,
	threads,
}: Readonly<{
	activeThreadId: string | null;
	isGeneratingTitle: boolean;
	label: string;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	onDeleteThread: (threadId: string) => Promise<void>;
	onSelectThread: (threadId: string) => Promise<void>;
	pendingTitleThreadId: string | null;
	threads: ReadonlyArray<FutureChatThread>;
}>) {
	return (
		<section aria-label={label}>
			<div className="flex h-8 items-center px-1.5 text-xs font-bold leading-4 text-text-subtlest">
				{label}
			</div>
			<SidebarMenu>
				{threads.map((thread) => (
					<FutureChatSidebarThreadItem
						isActive={thread.id === activeThreadId}
						isPendingTitle={isGeneratingTitle && pendingTitleThreadId === thread.id}
						onCancelThreadRun={onCancelThreadRun}
						key={thread.id}
						onDeleteThread={onDeleteThread}
						onSelectThread={onSelectThread}
						runStatus={thread.activeRun?.status ?? null}
						thread={thread}
					/>
				))}
			</SidebarMenu>
		</section>
	);
}

export function FutureChatSidebar({
	activeThreadId,
	onCancelThreadRun,
	hoverOpen = false,
	isGeneratingTitle = false,
	onDeleteThread,
	onNewChat,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	onSelectThread,
	pendingTitleThreadId = null,
	threads,
	threadsLoaded = true,
	topOffset = false,
}: Readonly<FutureChatSidebarProps>) {
	const isNewChatSelected = activeThreadId === null;
	const threadSections = React.useMemo(() => groupFutureChatThreadsByDate(threads), [threads]);

	return (
		<Sidebar
			aria-label="Future Chat navigation"
			className={cn(
				"bg-sidebar !px-3 !pb-0 group-data-[state=expanded]:group-data-[side=left]:border-r group-data-[state=expanded]:group-data-[side=left]:border-border",
				topOffset && "!top-12 !h-[calc(100svh-3rem)]",
			)}
			onMouseEnter={onSidebarMouseEnter}
			onMouseLeave={onSidebarMouseLeave}
			role="complementary"
			style={hoverOpen ? { left: 0, zIndex: 50, boxShadow: token("elevation.shadow.overlay") } : { zIndex: 50 }}
			variant="inset"
		>
			<SidebarContent className="bg-sidebar gap-3">
				{/* Top navigation items */}
				<SidebarGroup className="p-0">
					<SidebarGroupContent>
						<SidebarMenu>
							<FutureChatSidebarNavItem
								icon={
									<span
										className={cn(
											"flex size-5 items-center justify-center rounded-full text-text-inverse",
											isNewChatSelected ? "bg-bg-selected-bold" : "bg-text",
										)}
									>
										<AddIcon color="currentColor" label="" size="small" />
									</span>
								}
								label="New chat"
								onClick={onNewChat}
								selected={isNewChatSelected}
								trailing={
										<SidebarNavItemCount className="pointer-events-auto min-w-0 rounded-xs px-1 font-normal text-text">
											⌥⇧N
										</SidebarNavItemCount>
								}
							/>
							<FutureChatSidebarNavItem
								icon={<ScorecardIcon label="" size="medium" />}
								label="Tasks"
								showChevron
							/>
							<FutureChatSidebarNavItem
								icon={<ShapesIcon label="" size="medium" />}
								label="Artifacts"
								showChevron
							/>
	<FutureChatSidebarNavItem
								icon={<AiAgentIcon label="" size="medium" />}
								label="Agents"
								showChevron
							/>
							<FutureChatSidebarNavItem
								icon={<SkillIcon label="" size="medium" />}
								label="Skills"
								showChevron
							/>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Chat threads list */}
				{threadsLoaded && threads.length === 0 && !isGeneratingTitle ? (
					<SidebarGroup className="flex flex-1 items-center justify-center p-0">
						<SidebarGroupContent>
							<div className="flex w-full flex-col items-center gap-4 px-6 text-center">
								<div className="stagger-fade-in flex w-full flex-col items-center gap-1">
									<Heading as="h3" size="xsmall">
										Get started
									</Heading>
									<p className="text-sm text-text-subtle">
										Start a conversation to get going.
									</p>
								</div>
								<div className="stagger-fade-in" style={{ animationDelay: "0.06s" }}>
									<Button
										onClick={onNewChat}
										variant="outline"
									>
										Chat
									</Button>
								</div>
							</div>
						</SidebarGroupContent>
					</SidebarGroup>
				) : (
					<SidebarGroup className="p-0">
						<SidebarGroupContent className="flex flex-col gap-2">
							{isGeneratingTitle && threads.length === 0 ? (
								<SidebarMenu>
									<SidebarMenuItem>
										<SidebarMenuButton
											className="h-auto min-h-9 rounded-lg p-1.5"
											size="lg"
											type="button"
											aria-label="Generating chat title"
										>
											<div className="min-w-0 flex-1">
												<div className="text-sm font-medium leading-5">
													<Shimmer
														as="span"
														duration={1}
														className="block max-w-full truncate motion-safe:animate-[sd-blurIn_160ms_ease-out_both] motion-reduce:animate-none"
													>
														Generating chat title
													</Shimmer>
												</div>
											</div>
										</SidebarMenuButton>
									</SidebarMenuItem>
								</SidebarMenu>
							) : null}
							{threadSections.map((section) => (
								<FutureChatSidebarThreadSection
									activeThreadId={activeThreadId}
									isGeneratingTitle={isGeneratingTitle}
									key={section.label}
									label={section.label}
									onCancelThreadRun={onCancelThreadRun}
									onDeleteThread={onDeleteThread}
									onSelectThread={onSelectThread}
									pendingTitleThreadId={pendingTitleThreadId}
									threads={section.threads}
								/>
							))}
						</SidebarGroupContent>
					</SidebarGroup>
				)}
			</SidebarContent>
		</Sidebar>
	);
}
