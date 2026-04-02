"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter as SidebarFooterSlot,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
	useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/utils/theme-wrapper";
import { MakeSidebarFooter } from "@/components/blocks/make-artifact/components/sidebar-footer";
import AgentsProgress from "@/components/blocks/agent-progress/page";
import { resolvePlanVisualIdentity } from "@/components/projects/shared/lib/plan-identity";
import MakeGalleryContent from "./components/make-gallery-content";
import SearchIcon from "@atlaskit/icon/core/search";
import SidebarCollapseIcon from "@atlaskit/icon/core/sidebar-collapse";
import SidebarExpandIcon from "@atlaskit/icon/core/sidebar-expand";
import NotificationIcon from "@atlaskit/icon/core/notification";

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface MakePageSidebarProps extends React.ComponentProps<typeof Sidebar> {
	isOverlay?: boolean;
	isHoverReveal?: boolean;
	onPinSidebar?: () => void;
}

function MakePageSidebar({ isOverlay, isHoverReveal, onPinSidebar, ...props }: Readonly<MakePageSidebarProps>) {
	const { toggleSidebar } = useSidebar();

	return (
		<Sidebar
			collapsible="offcanvas"
			className="[&_[data-slot=sidebar-inner]]:relative [&_[data-slot=sidebar-inner]]:bg-bg-neutral-subtle"
			{...props}
		>
			<SidebarHeader className="h-14 bg-bg-neutral-subtle px-4 py-0">
				<div className="flex h-full items-center justify-between">
					<div className="flex items-center text-icon-subtle">
						<div
							className={cn(
								"w-9 overflow-hidden transition-all duration-normal ease-out",
								!isHoverReveal && !isOverlay && "w-0 opacity-0",
							)}
						>
							<Button aria-label="Pin sidebar" size="icon" variant="ghost" onClick={onPinSidebar}>
								<SidebarExpandIcon label="" />
							</Button>
						</div>
						<div className="flex items-center gap-2 p-1">
							<Image src="/1p/rovo.svg" alt="" width={20} height={20} aria-hidden />
							<span style={{ font: token("font.heading.xsmall") }} className="text-text">
								Rovo
							</span>
						</div>
					</div>
					<div
						className={cn(
							"w-9 overflow-hidden text-icon-subtle transition-all duration-normal ease-out",
							(isOverlay || isHoverReveal) && "w-0 opacity-0",
						)}
					>
						<Button aria-label="Collapse sidebar" size="icon" variant="ghost" onClick={toggleSidebar}>
							<SidebarCollapseIcon label="" />
						</Button>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent className="bg-bg-neutral-subtle">
				<div className="flex flex-col gap-3 px-3 pt-3">
					<div className="relative">
						<div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-icon-subtle">
							<SearchIcon label="" size="small" />
						</div>
						<Input placeholder="Search" className="pl-9" />
					</div>

					<button
						type="button"
						className="flex min-h-8 w-full items-center justify-center rounded-full border border-dashed border-border px-3"
					>
						<span className="text-sm font-medium text-text-subtle">
							New chat
						</span>
					</button>
				</div>

				<div className="px-3 pt-3">
					<p style={{ font: token("font.heading.xxsmall") }} className="pl-1.5 text-text-subtlest">
						Done
					</p>
					<div className="mt-2">
						<AgentsProgress
							runStatus="completed"
							defaultCollapsed
							planTitle="Flexible Friday Plan"
							planVisualIdentity={resolvePlanVisualIdentity("Flexible Friday Plan")}
							runCreatedAt="2026-02-17T15:18:00.000Z"
							runCompletedAt="2026-02-17T15:24:00.000Z"
						/>
					</div>
				</div>
			</SidebarContent>

			<SidebarFooterSlot className="max-h-[50%] overflow-y-auto bg-surface p-0">
				<MakeSidebarFooter />
			</SidebarFooterSlot>
		</Sidebar>
	);
}

// ---------------------------------------------------------------------------
// Collapsed sidebar branding (shown in top bar when sidebar is closed)
// ---------------------------------------------------------------------------

function CollapsedBranding({
	sidebarOpen,
	sidebarHovered,
	onExpandSidebar,
	onHoverEnter,
	onHoverLeave,
}: Readonly<{
	sidebarOpen: boolean;
	sidebarHovered: boolean;
	onExpandSidebar: () => void;
	onHoverEnter: () => void;
	onHoverLeave: () => void;
}>) {
	return (
		<div
			className={cn(
				"flex shrink-0 items-center gap-1 overflow-hidden text-icon-subtle transition-all duration-200 ease-[var(--ease-in-out)]",
				sidebarOpen || sidebarHovered ? "pointer-events-none mr-0 w-0 opacity-0" : "mr-3",
			)}
			onMouseEnter={onHoverEnter}
			onMouseLeave={onHoverLeave}
		>
			<Button aria-label="Expand sidebar" size="icon" variant="ghost" onClick={onExpandSidebar}>
				<SidebarExpandIcon label="" />
			</Button>
			<div className="flex items-center gap-2 p-1">
				<Image src="/1p/rovo.svg" alt="" width={20} height={20} aria-hidden />
				<span style={{ font: token("font.heading.xsmall") }} className="text-text">
					Rovo
				</span>
			</div>
			<div className="mx-1 h-5 w-px shrink-0 bg-border" />
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main content area with tabs
// ---------------------------------------------------------------------------

function MakeContent({
	sidebarOpen,
	sidebarHovered,
	onExpandSidebar,
	onHoverEnter,
	onHoverLeave,
}: Readonly<{
	sidebarOpen: boolean;
	sidebarHovered: boolean;
	onExpandSidebar: () => void;
	onHoverEnter: () => void;
	onHoverLeave: () => void;
}>) {
	const router = useRouter();
	const pathname = usePathname();

	const handleGalleryItemSelect = useCallback(() => {
		if (pathname.startsWith("/preview/blocks/")) {
			router.push("/preview/blocks/make-artifact");
			return;
		}
		if (pathname.startsWith("/components/blocks/")) {
			router.push("/components/blocks/make-artifact");
			return;
		}
		router.push("/make");
	}, [pathname, router]);

	return (
		<Tabs defaultValue="make" className="relative flex flex-1 flex-col gap-0">
			<div className="pointer-events-none absolute top-0 right-0 z-20 flex h-14 items-center gap-0.5 pr-4 text-icon-subtle">
				<div className="pointer-events-auto">
					<ThemeToggle />
				</div>
				<Button
					aria-label="Notifications"
					size="icon"
					variant="ghost"
					className="pointer-events-auto"
				>
					<NotificationIcon label="" />
				</Button>
				<div className="pointer-events-auto flex size-8 items-center justify-center">
					<Avatar size="sm" className="cursor-pointer">
						<AvatarImage src="/avatar-human/austin-lambert.png" alt="User avatar" />
						<AvatarFallback>U</AvatarFallback>
					</Avatar>
				</div>
			</div>
			<div className="flex h-14 items-center border-b border-border px-4">
				<CollapsedBranding
					sidebarOpen={sidebarOpen}
					sidebarHovered={sidebarHovered}
					onExpandSidebar={onExpandSidebar}
					onHoverEnter={onHoverEnter}
					onHoverLeave={onHoverLeave}
				/>
				<TabsList className="w-fit shrink-0">
					<TabsTrigger value="home">Home</TabsTrigger>
					<TabsTrigger value="make">Make</TabsTrigger>
					<TabsTrigger value="chat">Chat</TabsTrigger>
					<TabsTrigger value="search">Search</TabsTrigger>
				</TabsList>
			</div>
				<TabsContent value="make" className="min-h-0 flex-1 overflow-hidden">
					<MakeGalleryContent onItemSelect={handleGalleryItemSelect} />
				</TabsContent>
			<TabsContent value="home" className="min-h-0 flex-1 overflow-hidden">
				<div className="flex h-full items-center justify-center text-sm text-text-subtlest">
					Home
				</div>
			</TabsContent>
			<TabsContent value="chat" className="min-h-0 flex-1 overflow-hidden">
				<div className="flex h-full items-center justify-center text-sm text-text-subtlest">
					Chat
				</div>
			</TabsContent>
			<TabsContent value="search" className="min-h-0 flex-1 overflow-hidden">
				<div className="flex h-full items-center justify-center text-sm text-text-subtlest">
					Search
				</div>
			</TabsContent>
		</Tabs>
	);
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function MakePageBlock() {
	const [isOpen, setIsOpen] = useState(true);
	const [isHovered, setIsHovered] = useState(false);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isSidebarCollapsedAndHovered = !isOpen && isHovered;

	const handleHoverEnter = useCallback(() => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setIsHovered(true);
	}, []);

	const handleHoverLeave = useCallback(() => {
		hoverTimeoutRef.current = setTimeout(() => {
			setIsHovered(false);
		}, 100);
	}, []);

	const handlePinSidebar = useCallback(() => {
		setIsOpen(true);
		setIsHovered(false);
	}, []);

	return (
		<SidebarProvider
			open={isOpen || isHovered}
			onOpenChange={setIsOpen}
			style={
				{
					"--sidebar-width": "320px",
				} as React.CSSProperties
			}
			className={cn(
				"[&_[data-slot=sidebar-gap]]:ease-[var(--ease-in-out)] [&_[data-slot=sidebar-container]]:ease-[var(--ease-in-out)]",
			)}
		>
			<MakePageSidebar
				isOverlay={false}
				isHoverReveal={isSidebarCollapsedAndHovered}
				onPinSidebar={handlePinSidebar}
				onMouseEnter={handleHoverEnter}
				onMouseLeave={handleHoverLeave}
			/>
			<SidebarInset className="h-svh overflow-hidden">
				<div className="flex h-full min-h-0 flex-col">
					<MakeContent
						sidebarOpen={isOpen}
						sidebarHovered={isHovered}
						onExpandSidebar={() => setIsOpen(true)}
						onHoverEnter={handleHoverEnter}
						onHoverLeave={handleHoverLeave}
					/>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
