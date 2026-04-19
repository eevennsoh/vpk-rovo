"use client";

import type { CSSProperties, ReactNode } from "react";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CreateButton } from "@/components/blocks/top-navigation/components/create-button";
import { LeftNavigation } from "@/components/blocks/top-navigation/components/left-navigation";
import { RightNavigation } from "@/components/blocks/top-navigation/components/right-navigation";
import SearchSuggestionsPanel from "@/components/blocks/top-navigation/components/search-suggestions-panel";
import { useTopNavigation } from "@/components/blocks/top-navigation/hooks/use-top-navigation";
import {
	ROVO_APP_SEPARATOR_LINE_OFFSET_PX,
	TOP_NAV_PADDING_PX,
} from "@/components/blocks/top-navigation/layout-constants";
import { RovoAppSidebar } from "@/components/projects/rovo-app/components/rovo-app-sidebar";
import { useRovoAppThreadList } from "@/components/projects/rovo-app/hooks/use-rovo-app-thread-list";
import { buildRovoAppThreadPath } from "@/components/projects/rovo-app/lib/rovo-app-thread-route-sync";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { SidebarProvider, SidebarResizeHandle } from "@/components/ui/sidebar";
import SearchIcon from "@atlaskit/icon/core/search";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import { useSidebarResize } from "@/components/projects/rovo-app/hooks/use-sidebar-resize";

const SIDEBAR_MOTION_DURATION_TOKEN = "--duration-medium";
const SIDEBAR_MOTION_FALLBACK_MS = 200;
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 480;

function getCssDurationTokenMs(tokenName: string, fallbackMs: number): number {
	if (typeof window === "undefined") {
		return fallbackMs;
	}
	const tokenValue = window
		.getComputedStyle(document.documentElement)
		.getPropertyValue(tokenName);
	const parsed = Number.parseFloat(tokenValue);
	return Number.isFinite(parsed) ? parsed : fallbackMs;
}

interface RovoAppSurfaceShellProps {
	children: ReactNode;
}

export function RovoAppSurfaceShell({ children }: Readonly<RovoAppSurfaceShellProps>) {
	const router = useRouter();
	const nav = useTopNavigation();
	const { deleteThread, threads, threadsLoaded } = useRovoAppThreadList();

	const [sidebarOpen, setSidebarOpen] = useState(true);

	// Hover-reveal sidebar
	const [hoverRevealActive, setHoverRevealActive] = useState(false);
	const hoverLeaveTimerRef = useRef<number | null>(null);

	const clearHoverTimer = useCallback(() => {
		if (hoverLeaveTimerRef.current) {
			window.clearTimeout(hoverLeaveTimerRef.current);
			hoverLeaveTimerRef.current = null;
		}
	}, []);

	const scheduleSidebarHoverClose = useCallback(() => {
		clearHoverTimer();
		hoverLeaveTimerRef.current = window.setTimeout(() => {
			setHoverRevealActive(false);
		}, getCssDurationTokenMs(SIDEBAR_MOTION_DURATION_TOKEN, SIDEBAR_MOTION_FALLBACK_MS));
	}, [clearHoverTimer]);

	const handleSidebarHoverEnter = useCallback(() => {
		clearHoverTimer();
		setHoverRevealActive(true);
	}, [clearHoverTimer]);

	const handleSidebarHoverLeave = useCallback(() => {
		scheduleSidebarHoverClose();
	}, [scheduleSidebarHoverClose]);

	const handleSidebarContentMouseEnter = useCallback(() => {
		clearHoverTimer();
	}, [clearHoverTimer]);

	const handleSidebarContentMouseLeave = useCallback(() => {
		scheduleSidebarHoverClose();
	}, [scheduleSidebarHoverClose]);

	useEffect(() => {
		return () => clearHoverTimer();
	}, [clearHoverTimer]);

	const isHoverOpen = hoverRevealActive && !sidebarOpen;

	const sidebarResize = useSidebarResize({
		defaultWidth: ROVO_APP_SEPARATOR_LINE_OFFSET_PX,
		minWidth: SIDEBAR_MIN_WIDTH,
		maxWidth: SIDEBAR_MAX_WIDTH,
		onCollapse: useCallback(() => {
			setSidebarOpen(false);
		}, []),
	});
	const rovoAppSidebarStyle = {
		"--sidebar-width": `${sidebarResize.sidebarWidth}px`,
	} as CSSProperties;

	return (
		<SidebarProvider
			className="h-svh overflow-hidden"
			defaultOpen
			onOpenChange={setSidebarOpen}
			open={sidebarOpen}
			style={rovoAppSidebarStyle}
		>
			<RovoAppSidebar
				activeThreadId={null}
				hoverOpen={isHoverOpen}
				isGeneratingTitle={false}
				isResizing={sidebarResize.isResizing}
				onCancelThreadRun={() => Promise.resolve()}
				onDeleteThread={async (threadId) => {
					startTransition(() => {
						void deleteThread(threadId);
					});
				}}
				onNewChat={() => {
					router.push("/rovo-app");
				}}
				onSelectThread={async (threadId) => {
					router.push(buildRovoAppThreadPath(threadId));
				}}
				onSidebarMouseEnter={handleSidebarContentMouseEnter}
				onSidebarMouseLeave={handleSidebarContentMouseLeave}
				pendingTitleThreadId={null}
				resizeHandle={
					<SidebarResizeHandle
						data-active={sidebarResize.isResizing ? "" : undefined}
						data-will-collapse={sidebarResize.willCollapse ? "" : undefined}
						onDoubleClick={sidebarResize.onResizeHandleDoubleClick}
						onPointerDown={sidebarResize.onResizeHandlePointerDown}
						onPointerEnter={sidebarResize.onResizeHandlePointerEnter}
						onPointerLeave={sidebarResize.onResizeHandlePointerLeave}
					/>
				}
				threads={threads}
				threadsLoaded={threadsLoaded}
				topOffset
			/>

			{/* Sidebar header (LeftNavigation) */}
			<div
				className={cn(
					"fixed top-0 left-0 z-50 flex h-12 items-center px-3 transition-[width,border-color] duration-medium ease-in-out",
					sidebarResize.isResizing && "transition-none",
					sidebarOpen
						? cn(
								"w-(--sidebar-width) overflow-x-clip border-r",
								sidebarResize.isResizing ||
									sidebarResize.isResizeHandleHovered
									? "border-border-selected"
									: "border-border",
							)
						: "w-40 border-b border-border",
				)}
				style={{ backgroundColor: token("elevation.surface"), viewTransitionName: "persistent-sidebar" as never }}
			>
				<LeftNavigation
					product="rovo"
					windowWidth={nav.windowWidth}
					isVisible={nav.isVisible}
					isAppSwitcherOpen={nav.isAppSwitcherOpen}
					isSidebarResizing={sidebarResize.isResizing}
					hideAppSwitcher
					separatorLineOffsetPx={sidebarResize.sidebarWidth - TOP_NAV_PADDING_PX}
					onToggleSidebar={nav.toggleSidebar}
					onToggleAppSwitcher={nav.handleToggleAppSwitcher}
					onCloseAppSwitcher={nav.handleCloseAppSwitcher}
					onNavigate={(path) => nav.handleNavigate(path === "/" ? "/rovo-app" : path)}
					onHoverEnter={handleSidebarHoverEnter}
					onHoverLeave={handleSidebarHoverLeave}
				/>
			</div>

			{/* Main content area */}
			<div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
				{/* Top header bar */}
				<div
					className={cn(
						"flex h-12 shrink-0 items-center border-b px-3 transition-[padding] duration-medium ease-in-out",
						!sidebarOpen && "pl-44",
					)}
					style={{
						borderColor: token("color.border"),
						backgroundColor: token("elevation.surface"),
						viewTransitionName: "persistent-header" as never,
					}}
				>
					<div className="relative flex min-w-0 flex-1 items-center justify-start gap-2">
						<div
							ref={nav.searchContainerRef}
							className="relative flex h-9 w-full max-w-[680px] items-center"
						>
							<InputGroup
								className={cn(
									"h-7 rounded-md bg-bg-input shadow-none transition-[height,background-color,box-shadow] duration-medium ease-out hover:bg-bg-input-hovered",
									"has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0",
									nav.isSearchFocused && "h-9",
									nav.isSearchFocused && "relative z-[1001]",
								)}
								style={
									nav.isSearchFocused
										? {
												backgroundColor: token("elevation.surface.overlay"),
												boxShadow: token("elevation.shadow.overlay"),
											}
										: undefined
								}
							>
								<InputGroupAddon align="inline-start">
									<span className="size-4 shrink-0 text-icon-subtle">
										<SearchIcon label="" spacing="none" />
									</span>
								</InputGroupAddon>
								<InputGroupInput
									type="search"
									aria-label="Search"
									value={nav.searchValue}
									onChange={(event) => nav.setSearchValue(event.currentTarget.value)}
									onFocus={nav.handleFocusSearch}
									onKeyDown={nav.handleSearchKeyDown}
									placeholder="Search"
									className="h-full text-sm placeholder:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
								/>
							</InputGroup>
							<SearchSuggestionsPanel
								anchorRef={nav.searchContainerRef}
								isVisible={nav.isSearchFocused}
								onSearchAllApps={nav.handleSearchAllApps}
								onRecentItemClick={nav.handleRecentItemClick}
								onRecentSearchClick={nav.handleRecentSearchClick}
								panelRef={nav.searchPanelRef}
							/>
						</div>

						<CreateButton windowWidth={nav.windowWidth} />
					</div>
					<RightNavigation
						product="rovo"
						windowWidth={nav.windowWidth}
						onToggleChat={nav.toggleChat}
						onToggleTheme={nav.toggleTheme}
					/>
				</div>

				{/* Surface content */}
				<div className="flex-1 overflow-auto">
					{children}
				</div>
			</div>
		</SidebarProvider>
	);
}
