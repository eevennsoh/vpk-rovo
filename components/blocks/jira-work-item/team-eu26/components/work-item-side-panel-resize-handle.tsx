"use client";

import { cn } from "@/lib/utils";
import { SidebarResizeHandle } from "@/components/ui/sidebar";
import type { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";

interface WorkItemSidePanelResizeHandleProps {
	ariaLabel: string;
	className?: string;
	resize: ReturnType<typeof useSidebarResize>;
	side?: "left" | "right";
	testId: string;
}

export function WorkItemSidePanelResizeHandle({
	ariaLabel,
	className,
	resize,
	side = "left",
	testId,
}: Readonly<WorkItemSidePanelResizeHandleProps>) {
	return (
		<SidebarResizeHandle
			aria-label={ariaLabel}
			aria-orientation="vertical"
			aria-valuemax={resize.maxWidth}
			aria-valuemin={resize.minWidth}
			aria-valuenow={resize.sidebarWidth}
			className={cn(
				"bottom-6! bg-transparent duration-normal ease-out-practical focus-visible:bg-bg-selected-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>div]:h-16 [&>div]:origin-center [&>div]:transition-[opacity,background-color,scale] hover:[&>div]:scale-105 data-[active]:[&>div]:scale-105 focus-visible:[&>div]:scale-105 focus-visible:[&>div]:bg-bg-selected-bold focus-visible:[&>div]:opacity-100 [&>div]:duration-medium [&>div]:ease-out-practical motion-reduce:transition-none motion-reduce:[&>div]:scale-100 motion-reduce:[&>div]:transition-none",
				className,
			)}
			data-active={resize.isResizing ? "" : undefined}
			data-testid={testId}
			onDoubleClick={resize.onResizeHandleDoubleClick}
			onKeyDown={resize.onResizeHandleKeyDown}
			onPointerDown={resize.onResizeHandlePointerDown}
			onPointerEnter={resize.onResizeHandlePointerEnter}
			onPointerLeave={resize.onResizeHandlePointerLeave}
			role="separator"
			side={side}
			tabIndex={0}
		/>
	);
}
