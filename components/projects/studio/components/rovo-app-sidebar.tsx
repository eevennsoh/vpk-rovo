"use client";

import * as React from "react";
import { ControlledChatHistoryPanel } from "@/components/projects/sidebar-chat/components/chat-history-drawer";
import { token } from "@/lib/tokens";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import { cn } from "@/lib/utils";

interface RovoAppSidebarProps {
	activeThreadId: string | null;
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

export function RovoAppSidebar({
	activeThreadId,
	onCancelThreadRun,
	hoverOpen = false,
	isResizing,
	onDeleteThread,
	onNewChat,
	onSidebarMouseEnter,
	onSidebarMouseLeave,
	onSelectThread,
	resizeHandle,
	threads,
	threadsLoaded = true,
	topOffset = false,
}: Readonly<RovoAppSidebarProps>) {
	const handleNewChat = React.useCallback(() => {
		onNewChat();
	}, [onNewChat]);

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
				<ControlledChatHistoryPanel
					activeThreadId={activeThreadId}
					cancelThreadRun={onCancelThreadRun}
					className="min-h-0 flex-1"
					deleteThread={onDeleteThread}
					onNewChat={handleNewChat}
					selectThread={onSelectThread}
					threads={threads}
					threadsLoaded={threadsLoaded}
				/>
			</SidebarContent>
		</Sidebar>
	);
}
