"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import AddIcon from "@atlaskit/icon/core/add";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import CrossIcon from "@atlaskit/icon/core/cross";
import DeleteIcon from "@atlaskit/icon/core/delete";
import EditIcon from "@atlaskit/icon/core/edit";
import FolderClosedIcon from "@atlaskit/icon/core/folder-closed";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import HistoryIcon from "@atlaskit/icon-lab/core/history";
import { useRovoChat } from "@/app/contexts";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { shouldShowRovoAppSidebarRunIndicator } from "@/components/projects/rovo/lib/rovo-app-sidebar-run-indicator";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import { cn } from "@/lib/utils";

const DRAWER_ID = "rovo-chat-history-drawer";

interface ChatHistoryDrawerProps {
	active?: boolean;
}

function TopNavIconSlot({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<span className="flex size-6 shrink-0 items-center justify-center text-icon-subtle">
			{children}
		</span>
	);
}

function TopNavStaticRow({
	children,
	icon,
}: Readonly<{
	children: ReactNode;
	icon: ReactNode;
}>) {
	return (
		<div className="flex min-h-8 w-full items-center gap-1 rounded-md p-1 text-text-subtle">
			<TopNavIconSlot>{icon}</TopNavIconSlot>
			<span className="min-w-0 truncate pl-0.5 text-sm font-medium leading-5">
				{children}
			</span>
		</div>
	);
}

function ChatHistoryNewChatRow({
	onCreate,
}: Readonly<{
	onCreate: () => void;
}>) {
	return (
		<button
			type="button"
			className="relative flex min-h-8 w-full items-center gap-1 rounded-md bg-bg-selected py-1 pr-9 pl-1 text-left text-text-selected outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focused"
			onClick={onCreate}
		>
			<TopNavIconSlot>
				<EditIcon label="" />
			</TopNavIconSlot>
			<span className="min-w-0 truncate pl-0.5 text-sm font-medium leading-5">
				New chat
			</span>
			<span aria-hidden className="absolute left-0 top-1/2 h-3 w-0.5 -translate-y-1/2 bg-current" />
		</button>
	);
}

function ChatHistorySectionHeading() {
	return (
		<div className="flex h-8 shrink-0 items-center justify-between px-1.5 py-2">
			<div className="truncate text-xs font-semibold leading-4 text-text-subtlest">
				Chats
			</div>
			<div aria-hidden className="flex shrink-0 items-center gap-1 text-icon-subtle">
				<span className="flex size-6 items-center justify-center">
					<FolderClosedIcon label="" size="small" />
				</span>
				<span className="flex size-6 items-center justify-center">
					<AddIcon label="" size="small" />
				</span>
			</div>
		</div>
	);
}

function ChatHistoryThreadRow({
	activeThreadId,
	onCancelThreadRun,
	onDeleteThread,
	onSelectThread,
	thread,
}: Readonly<{
	activeThreadId: string | null;
	onCancelThreadRun: (threadId: string) => Promise<void>;
	onDeleteThread: (threadId: string) => Promise<void>;
	onSelectThread: (threadId: string) => Promise<void>;
	thread: RovoAppThread;
}>) {
	const showRunIndicator = shouldShowRovoAppSidebarRunIndicator(thread.activeRun?.status ?? null);
	const isActive = thread.id === activeThreadId;

	return (
		<div
			className={cn(
				"group relative rounded-lg",
				isActive ? "bg-bg-selected text-text-selected" : "text-text hover:bg-bg-neutral",
			)}
		>
			<button
				type="button"
				className="grid w-full grid-cols-[minmax(0,1fr)_24px] items-center gap-3 rounded-lg p-1.5 text-left outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focused"
				onClick={() => void onSelectThread(thread.id)}
			>
				<span className="min-w-0">
					<span className="block truncate text-sm font-medium leading-5">{thread.title}</span>
					<span className={cn("block truncate text-xs leading-4", isActive ? "text-text-selected" : "text-text-subtlest")}>
						{formatDistanceToNowStrict(new Date(thread.updatedAt), { addSuffix: true })}
					</span>
				</span>
				<span className="relative flex size-6 items-center justify-center">
					{showRunIndicator ? (
						<Spinner size="xs" aria-hidden="true" className="shrink-0 text-icon-subtle" />
					) : null}
				</span>
			</button>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={`More actions for ${thread.title}`}
							className="absolute top-1/2 right-1.5 size-6 -translate-y-1/2 opacity-0 transition-opacity duration-normal ease-out group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
							size="icon"
							variant="ghost"
							onClick={(event) => event.stopPropagation()}
						/>
					}
				>
					<ShowMoreHorizontalIcon label="" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" positionerClassName="z-[760]">
					<DropdownMenuGroup>
						{showRunIndicator ? (
							<DropdownMenuItem
								elemBefore={<span aria-hidden className="size-3 rounded-[2px] bg-current" />}
								onSelect={() => void onCancelThreadRun(thread.id)}
							>
								Cancel run
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem variant="destructive" elemBefore={<DeleteIcon label="" />} onSelect={() => void onDeleteThread(thread.id)}>
							Delete
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export function ChatHistoryDrawer({
	active = true,
}: Readonly<ChatHistoryDrawerProps>): ReactElement | null {
	const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
	const {
		activeThreadId,
		cancelThreadRun,
		closeHistory,
		deleteThread,
		isHistoryOpen,
		refreshThreads,
		resetChat,
		selectThread,
		threads,
		threadsLoaded,
	} = useRovoChat();

	const handleOpenChange = (open: boolean) => {
		if (!open || !active) {
			closeHistory();
		}
	};

	const handleNewChat = () => {
		resetChat();
		closeHistory();
		void refreshThreads();
	};

	const handleSelectThread = async (threadId: string) => {
		closeHistory();
		await selectThread(threadId);
	};

	if (!active || !isHistoryOpen) {
		return null;
	}

	return (
		<div ref={setPortalContainer} className="absolute inset-0 z-20" data-chat-history-drawer-layer="">
			{portalContainer ? (
				<Sheet open={isHistoryOpen} onOpenChange={handleOpenChange}>
					<SheetContent
						id={DRAWER_ID}
						aria-describedby="rovo-chat-history-description"
						aria-labelledby="rovo-chat-history-title"
						className="z-30 !w-80 max-w-[calc(100%_-_40px)] gap-0 overflow-hidden rounded-r-xl border-r border-border bg-surface-overlay p-0 shadow-xl"
						contained
						overlayClassName="z-20"
						portalContainer={portalContainer}
						side="left"
						showCloseButton={false}
					>
						<SheetHeader className="sr-only">
							<SheetTitle id="rovo-chat-history-title">Chat history</SheetTitle>
							<SheetDescription id="rovo-chat-history-description">
								Recent Rovo threads
							</SheetDescription>
						</SheetHeader>
						<SheetClose
							aria-label="Close history"
							className={cn(
								buttonVariants({ variant: "ghost", size: "icon" }),
								"absolute top-3 left-3 z-10",
							)}
						>
							<CrossIcon label="" size="small" />
						</SheetClose>
						<div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-14">
							<div className="flex shrink-0 flex-col">
								<ChatHistoryNewChatRow onCreate={handleNewChat} />
								<TopNavStaticRow icon={<CheckCircleIcon label="" />}>Tasks</TopNavStaticRow>
								<TopNavStaticRow icon={<AiAgentIcon label="" />}>Agents</TopNavStaticRow>
								<TopNavStaticRow icon={<HistoryIcon label="" />}>Chats</TopNavStaticRow>
								<div className="h-3 shrink-0" aria-hidden />
								<ChatHistorySectionHeading />
							</div>
							<div className="min-h-0 flex-1 overflow-y-auto">
								{!threadsLoaded ? (
									<div className="flex h-24 items-center justify-center text-text-subtle">
										<Spinner size="sm" aria-label="Loading chat history" />
									</div>
								) : threads.length === 0 ? (
									<div className="rounded-lg border border-border px-3 py-4 text-sm text-text-subtle">
										No recent chats yet.
									</div>
								) : (
									<div className="flex flex-col">
										{threads.map((thread) => (
											<ChatHistoryThreadRow
												key={thread.id}
												activeThreadId={activeThreadId}
												onCancelThreadRun={cancelThreadRun}
												onDeleteThread={deleteThread}
												onSelectThread={handleSelectThread}
												thread={thread}
											/>
										))}
									</div>
								)}
							</div>
						</div>
					</SheetContent>
				</Sheet>
			) : null}
		</div>
	);
}
