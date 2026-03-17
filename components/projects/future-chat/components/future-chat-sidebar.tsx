"use client";

import { useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import ShapesIcon from "@atlaskit/icon/core/shapes";
import Heading from "@/components/blocks/shared-ui/heading";
import { Button } from "@/components/ui/button";
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
	SidebarMenuBadge,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { shouldShowFutureChatSidebarRunIndicator } from "@/components/projects/future-chat/lib/future-chat-sidebar-run-indicator";
import type { FutureChatRunStatus, FutureChatThread } from "@/lib/future-chat-types";
import { cn } from "@/lib/utils";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

interface FutureChatSidebarProps {
	activeThreadId: string | null;
	hoverOpen?: boolean;
	onDeleteThread: (threadId: string) => Promise<void>;
	onNewChat: () => void;
	onSidebarMouseEnter?: () => void;
	onSidebarMouseLeave?: () => void;
	onSelectThread: (threadId: string) => Promise<void>;
	threads: ReadonlyArray<FutureChatThread>;
	threadsLoaded?: boolean;
	topOffset?: boolean;
}

function FutureChatSidebarNavItem({
	hoverIcon,
	icon,
	label,
	onClick,
	trailing,
}: Readonly<{
	hoverIcon?: React.ReactNode;
	icon: React.ReactNode;
	label: string;
	onClick?: () => void;
	trailing?: React.ReactNode;
}>) {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				className="h-8 gap-1.5 rounded-md px-1"
				onClick={onClick}
				size="default"
				type="button"
			>
				<span className="flex size-6 items-center justify-center">
					{hoverIcon ? (
						<>
							<span className="flex items-center justify-center group-hover/menu-button:hidden">{icon}</span>
							<span className="hidden items-center justify-center group-hover/menu-button:flex">{hoverIcon}</span>
						</>
					) : (
						icon
					)}
				</span>
				<span className="flex-1 truncate text-sm font-medium">{label}</span>
			</SidebarMenuButton>
			{trailing}
		</SidebarMenuItem>
	);
}

function FutureChatSidebarThreadItem({
	isActive,
	runStatus,
	onDeleteThread,
	onSelectThread,
	thread,
}: Readonly<{
	isActive: boolean;
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
				className={cn(
					"h-auto min-h-9 rounded-lg py-2 pl-3 group-hover/menu-item:bg-sidebar-accent group-hover/menu-item:text-sidebar-accent-foreground",
					showRunIndicator ? "pr-16" : "pr-10",
				)}
				isActive={isActive}
				onClick={() => {
					setOpenMobile(false);
					void onSelectThread(thread.id);
				}}
				size="lg"
				type="button"
			>
				<div className="min-w-0 flex-1">
					<div className="truncate text-sm font-medium leading-5 text-text-subtle">
						{thread.title}
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
							className="!top-1/2 right-1 size-6 -translate-y-1/2 rounded-md text-icon-subtle hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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
					<MoreHorizontalIcon className="size-3" />
					<span className="sr-only">More</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" side="bottom">
					<DropdownMenuGroup>
						<DropdownMenuItem
							className="text-text-danger data-[highlighted]:text-text-danger"
							elemBefore={<Trash2Icon className="text-icon-danger" />}
							onClick={() => void onDeleteThread(thread.id)}
						>
							Delete
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			{showRunIndicator ? (
				<div className="pointer-events-none absolute inset-y-0 right-8 flex items-center justify-center group-data-[collapsible=icon]:hidden">
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

export function FutureChatSidebar({
	activeThreadId,
	hoverOpen = false,
	onDeleteThread,
	onNewChat,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	onSelectThread,
	threads,
	threadsLoaded = true,
	topOffset = false,
}: Readonly<FutureChatSidebarProps>) {
	const [chatsExpanded, setChatsExpanded] = useState(true);

	return (
		<Sidebar
			aria-label="Future Chat navigation"
			className={cn(
				"px-3 group-data-[state=expanded]:group-data-[side=left]:border-r group-data-[state=expanded]:group-data-[side=left]:border-border",
				topOffset && "!top-12 !h-[calc(100svh-3rem)]",
			)}
			onMouseEnter={onSidebarMouseEnter}
			onMouseLeave={onSidebarMouseLeave}
			role="complementary"
			style={hoverOpen ? { left: 0, zIndex: 20, boxShadow: token("elevation.shadow.overlay") } : { zIndex: 20 }}
			variant="inset"
		>
			<SidebarContent className="bg-sidebar/60">
				{/* Top navigation items */}
				<SidebarGroup className="p-0">
					<SidebarGroupContent>
						<SidebarMenu>
							<FutureChatSidebarNavItem
								icon={
									<span className="flex size-5 items-center justify-center rounded-full bg-text text-text-inverse">
										<AddIcon label="" size="small" />
									</span>
								}
								label="New chat"
								onClick={onNewChat}
								trailing={
									<SidebarMenuBadge className="rounded bg-bg-neutral leading-4">
										⎇⌘N
									</SidebarMenuBadge>
								}
							/>
							<FutureChatSidebarNavItem
								icon={<ScorecardIcon label="" size="medium" />}
								label="Tasks"
								trailing={
									<SidebarMenuBadge className="rounded bg-bg-neutral leading-4">
										3
									</SidebarMenuBadge>
								}
							/>
							<FutureChatSidebarNavItem
								icon={<ShapesIcon label="" size="medium" />}
								label="Artifacts"
							/>
							<FutureChatSidebarNavItem
								icon={<AiAgentIcon label="" size="medium" />}
								label="Agents"
							/>
							<FutureChatSidebarNavItem
								hoverIcon={
									chatsExpanded
										? <ChevronDownIcon label="" size="small" />
										: <ChevronRightIcon label="" size="small" />
								}
								icon={<AiChatIcon label="" size="medium" />}
								label="Chats"
								onClick={() => setChatsExpanded((prev) => !prev)}
								trailing={
									<SidebarMenuAction
										className="top-1 right-1 size-6 rounded text-text-subtlest hover:bg-bg-neutral-hovered peer-data-[size=default]/menu-button:top-1"
										onClick={(e) => {
											e.stopPropagation();
											onNewChat();
										}}
										onPointerDown={(e) => {
											e.stopPropagation();
										}}
										type="button"
									>
										<AddIcon label="New chat" size="small" />
									</SidebarMenuAction>
								}
							/>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				{/* Chat threads list */}
				{chatsExpanded ? (
					threadsLoaded && threads.length === 0 ? (
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
							<SidebarGroupContent>
								<SidebarMenu>
											{threads.map((thread) => (
												<FutureChatSidebarThreadItem
													isActive={thread.id === activeThreadId}
													key={thread.id}
													onDeleteThread={onDeleteThread}
													onSelectThread={onSelectThread}
													runStatus={thread.activeRun?.status ?? null}
													thread={thread}
												/>
											))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
					)
				) : null}
			</SidebarContent>
		</Sidebar>
	);
}
