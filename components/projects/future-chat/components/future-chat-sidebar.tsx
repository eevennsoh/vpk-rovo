"use client";

import { formatDistanceToNowStrict, isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import Heading from "@/components/blocks/shared-ui/heading";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import type { FutureChatThread } from "@/lib/future-chat-types";
import { cn } from "@/lib/utils";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

interface FutureChatSidebarProps {
	activeThreadId: string | null;
	onDeleteThread: (threadId: string) => Promise<void>;
	onNewChat: () => void;
	onSelectThread: (threadId: string) => Promise<void>;
	threads: ReadonlyArray<FutureChatThread>;
	topOffset?: boolean;
}

interface GroupedThreads {
	today: FutureChatThread[];
	yesterday: FutureChatThread[];
	lastWeek: FutureChatThread[];
	lastMonth: FutureChatThread[];
	older: FutureChatThread[];
}

function groupThreadsByDate(threads: ReadonlyArray<FutureChatThread>): GroupedThreads {
	const now = new Date();
	const oneWeekAgo = subWeeks(now, 1);
	const oneMonthAgo = subMonths(now, 1);

	return threads.reduce<GroupedThreads>(
		(groups, thread) => {
			const updatedAt = new Date(thread.updatedAt);
			if (isToday(updatedAt)) {
				groups.today.push(thread);
			} else if (isYesterday(updatedAt)) {
				groups.yesterday.push(thread);
			} else if (updatedAt > oneWeekAgo) {
				groups.lastWeek.push(thread);
			} else if (updatedAt > oneMonthAgo) {
				groups.lastMonth.push(thread);
			} else {
				groups.older.push(thread);
			}
			return groups;
		},
		{
			today: [],
			yesterday: [],
			lastWeek: [],
			lastMonth: [],
			older: [],
		},
	);
}

function FutureChatSidebarItem({
	isActive,
	onDeleteThread,
	onSelectThread,
	thread,
}: Readonly<{
	isActive: boolean;
	onDeleteThread: (threadId: string) => Promise<void>;
	onSelectThread: (threadId: string) => Promise<void>;
	thread: FutureChatThread;
}>) {
	const { setOpenMobile } = useSidebar();

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				className="h-auto min-h-12 items-start rounded-lg px-2.5 py-2.5"
				isActive={isActive}
				onClick={() => {
					setOpenMobile(false);
					void onSelectThread(thread.id);
				}}
				size="lg"
				type="button"
			>
				<div className="min-w-0 flex-1">
					<div className="truncate text-sm leading-5">{thread.title}</div>
					<div className="mt-1 flex items-center gap-1 text-[11px] text-sidebar-foreground/60">
						<span>{formatDistanceToNowStrict(new Date(thread.updatedAt), { addSuffix: true })}</span>
						{isActive ? (
							<>
								<span aria-hidden="true">•</span>
								<span>Open</span>
							</>
						) : null}
					</div>
				</div>
			</SidebarMenuButton>

			<DropdownMenu modal={true}>
				<DropdownMenuTrigger
					render={(
						<SidebarMenuAction
							className="mr-0.5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
							onClick={(event) => {
								event.stopPropagation();
							}}
							onPointerDown={(event) => {
								event.stopPropagation();
							}}
							showOnHover={!isActive}
						>
							<MoreHorizontalIcon className="size-4" />
							<span className="sr-only">More</span>
						</SidebarMenuAction>
					)}
				/>
					<DropdownMenuContent align="end" side="bottom">
						<DropdownMenuItem
							className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive"
							onClick={() => void onDeleteThread(thread.id)}
						>
							<Trash2Icon className="mr-2 size-4" />
							Delete
						</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
}

export function FutureChatSidebar({
	activeThreadId,
	onDeleteThread,
	onNewChat,
	onSelectThread,
	threads,
	topOffset = false,
}: Readonly<FutureChatSidebarProps>) {
	const groupedThreads = groupThreadsByDate(threads);
	const groups: Array<{ label: string; threads: FutureChatThread[] }> = [
		{ label: "Today", threads: groupedThreads.today },
		{ label: "Yesterday", threads: groupedThreads.yesterday },
		{ label: "Last 7 days", threads: groupedThreads.lastWeek },
		{ label: "Last 30 days", threads: groupedThreads.lastMonth },
		{ label: "Older", threads: groupedThreads.older },
	];

	return (
		<Sidebar
			aria-label="Future Chat threads"
			className={cn(
				"group-data-[state=expanded]:group-data-[side=left]:border-r group-data-[state=expanded]:group-data-[side=left]:border-border",
				topOffset && "!top-12 !h-[calc(100svh-3rem)]",
			)}
			role="complementary"
			variant="inset"
		>
			<SidebarContent className="bg-sidebar/60">
				{threads.length === 0 ? (
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
					groups.map((group) => {
						if (group.threads.length === 0) {
							return null;
						}

						return (
							<SidebarGroup key={group.label} className="p-0">
								<SidebarGroupLabel>{group.label}</SidebarGroupLabel>
								<SidebarGroupContent>
									<SidebarMenu>
										{group.threads.map((thread) => (
											<FutureChatSidebarItem
												isActive={thread.id === activeThreadId}
												key={thread.id}
												onDeleteThread={onDeleteThread}
												onSelectThread={onSelectThread}
												thread={thread}
											/>
										))}
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						);
					})
				)}
			</SidebarContent>
		</Sidebar>
	);
}
