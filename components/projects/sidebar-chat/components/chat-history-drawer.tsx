"use client";

import { formatDistanceToNowStrict } from "date-fns";
import AddIcon from "@atlaskit/icon/core/add";
import CrossIcon from "@atlaskit/icon/core/cross";
import DeleteIcon from "@atlaskit/icon/core/delete";
import LinkExternalIcon from "@atlaskit/icon/core/link-external";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { useRovoChat } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { shouldShowRovoAppSidebarRunIndicator } from "@/components/projects/rovo/lib/rovo-app-sidebar-run-indicator";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import { cn } from "@/lib/utils";

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
		<div className={cn("group relative rounded-md", isActive ? "bg-bg-selected text-text-selected" : "text-text hover:bg-bg-neutral")}>
			<button
				type="button"
				className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1.5 pr-9 text-left outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focused"
				onClick={() => void onSelectThread(thread.id)}
			>
				<span className="min-w-0">
					<span className="block truncate text-sm font-medium leading-5">{thread.title}</span>
					<span className="block truncate text-xs leading-4 text-text-subtle">
						{formatDistanceToNowStrict(new Date(thread.updatedAt), { addSuffix: true })}
					</span>
				</span>
				{showRunIndicator ? (
					<Spinner size="xs" aria-hidden="true" className="shrink-0 text-icon-subtle" />
				) : null}
			</button>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger
					render={
						<Button
							aria-label={`More actions for ${thread.title}`}
							className="absolute top-1/2 right-1 size-7 -translate-y-1/2 opacity-0 transition-opacity duration-normal ease-out group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
							size="icon"
							variant="ghost"
							onClick={(event) => event.stopPropagation()}
						/>
					}
				>
					<ShowMoreHorizontalIcon label="" size="small" />
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" positionerClassName="z-[650]">
					<DropdownMenuGroup>
						{showRunIndicator ? (
							<DropdownMenuItem
								elemBefore={<span aria-hidden className="size-3 rounded-[2px] bg-current" />}
								onClick={() => void onCancelThreadRun(thread.id)}
							>
								Cancel run
							</DropdownMenuItem>
						) : null}
						<DropdownMenuItem variant="destructive" elemBefore={<DeleteIcon label="" />} onClick={() => void onDeleteThread(thread.id)}>
							Delete
						</DropdownMenuItem>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export function ChatHistoryDrawer(): React.ReactElement | null {
	const {
		activeThreadId,
		cancelThreadRun,
		closeHistory,
		deleteThread,
		isHistoryOpen,
		openCurrentThreadFullscreen,
		refreshThreads,
		resetChat,
		selectThread,
		threads,
		threadsLoaded,
	} = useRovoChat();

	if (!isHistoryOpen) {
		return null;
	}

	return (
		<div className="absolute inset-y-0 left-0 z-[620] flex w-[min(320px,calc(100%-40px))] flex-col border-r border-border bg-surface-overlay shadow-2xl">
			<div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
				<div className="min-w-0">
					<div className="truncate text-sm font-semibold text-text">Chat history</div>
					<div className="truncate text-xs text-text-subtle">Recent Rovo threads</div>
				</div>
				<Button aria-label="Close history" size="icon" variant="ghost" onClick={closeHistory}>
					<CrossIcon label="" size="small" />
				</Button>
			</div>
			<div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
				<Button
					className="min-w-0 flex-1 justify-start"
					size="sm"
					variant="secondary"
					onClick={() => {
						resetChat();
						closeHistory();
						void refreshThreads();
					}}
				>
					<AddIcon label="" size="small" />
					New chat
				</Button>
				<Button aria-label="Open current thread fullscreen" size="icon" variant="ghost" onClick={openCurrentThreadFullscreen} disabled={!activeThreadId}>
					<LinkExternalIcon label="" size="small" />
				</Button>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-2">
				{!threadsLoaded ? (
					<div className="flex h-24 items-center justify-center text-text-subtle">
						<Spinner size="sm" aria-label="Loading chat history" />
					</div>
				) : threads.length === 0 ? (
					<div className="rounded-md border border-border px-3 py-4 text-sm text-text-subtle">
						No recent chats yet.
					</div>
				) : (
					<div className="space-y-1">
						{threads.map((thread) => (
							<ChatHistoryThreadRow
								key={thread.id}
								activeThreadId={activeThreadId}
								onCancelThreadRun={cancelThreadRun}
								onDeleteThread={deleteThread}
								onSelectThread={selectThread}
								thread={thread}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
