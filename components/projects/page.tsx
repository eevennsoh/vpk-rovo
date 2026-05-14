"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { token } from "@/lib/tokens";
import TopNavigation from "@/components/blocks/top-navigation/page";
import Sidebar from "@/components/blocks/product-sidebar/page";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import ChatPanel from "@/components/projects/sidebar-chat/page";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import { SidebarResizeHandle } from "@/components/ui/sidebar";
import { useSidebarResize } from "@/components/projects/rovo/hooks/use-sidebar-resize";
import { useSidebar } from "@/app/contexts/context-sidebar";
import { useRovoChat } from "@/app/contexts";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search";

interface AppLayoutProps {
	product: Product;
	children: React.ReactNode;
	embedded?: boolean;
	hideFloatingRovo?: boolean;
	hideRovoAction?: boolean;
	/**
	 * When true, render the sidebar chat flush against the surrounding shell:
	 * no outer padding, no border radius, and only a single dividing border on
	 * the left edge. Used by routes where the chat butts up against the top
	 * nav and viewport edges (e.g. /agents, /jira).
	 */
	chatPanelFlush?: boolean;
}

/**
 * Detect iframe context so generated apps rendered inside the artifact
 * panel's iframe automatically hide all shell chrome (TopNavigation,
 * Sidebar, FloatingRovoButton, RovoChatPanel).
 *
 * Defers the browser-only check to an effect so the first client render
 * matches the server render (both return false), avoiding hydration mismatch.
 */
function useIsEmbedded(explicit: boolean): boolean {
	const [auto, setAuto] = useState(false);
	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout> | null = null;
		let nextAuto = false;
		if (document.documentElement.dataset.embedded !== undefined) {
			nextAuto = true;
		} else {
			try {
				nextAuto = window.self !== window.top;
			} catch {
				nextAuto = true; // cross-origin iframe
			}
		}

		if (!nextAuto) {
			return;
		}

		let cancelled = false;
		const syncEmbeddedState = () => {
			if (!cancelled) {
				setAuto(true);
			}
		};

		if (typeof queueMicrotask === "function") {
			queueMicrotask(syncEmbeddedState);
		} else {
			timeout = setTimeout(syncEmbeddedState, 0);
		}

		return () => {
			cancelled = true;
			if (timeout !== null) {
				clearTimeout(timeout);
			}
		};
	}, []);
	return explicit || auto;
}

export default function AppLayout({
	product,
	children,
	embedded = false,
	hideFloatingRovo,
	hideRovoAction = false,
	chatPanelFlush = false,
}: Readonly<AppLayoutProps>) {
	const isEmbedded = useIsEmbedded(embedded);
	const { isVisible } = useSidebar();
	const { chatSurface, toggleChat } = useRovoChat();
	const chatResize = useSidebarResize({
		defaultWidth: 400,
		minWidth: 320,
		maxWidth: 720,
		direction: "rtl",
	});
	const chatPanelWidth = chatResize.sidebarWidth;
	const isSidebarChatActive = chatSurface === "sidebar";
	const isFloatingChatActive = chatSurface === "floating";
	const showChatPanel = !isEmbedded && !hideRovoAction && isSidebarChatActive;
	const showFloatingChat = !isEmbedded && !hideRovoAction && isFloatingChatActive;
	const sidebarWidth = isEmbedded || !isVisible ? "0px" : "230px";
	const shellViewportHeight = isEmbedded ? "100dvh" : "100vh";
	const shellContentHeight = isEmbedded ? "100dvh" : "calc(100vh - 48px)";
	const shellStyle = {
		minHeight: shellViewportHeight,
		height: shellViewportHeight,
		backgroundColor: token("color.background.neutral.subtle"),
		overflow: "hidden",
		"--vpk-project-shell-content-height": shellContentHeight,
		"--vpk-project-shell-top-offset": isEmbedded ? "0px" : "48px",
	} as React.CSSProperties;

	return (
		<div style={shellStyle}>
			<div data-shell-chrome="">
				{!isEmbedded ? <TopNavigation product={product} hideRovoAction={hideRovoAction} /> : null}
			</div>

			<div style={{ display: "flex", height: shellContentHeight, position: "relative" }}>
				<div data-shell-chrome="">
					{!isEmbedded ? <Sidebar product={product} embedded={isEmbedded} /> : null}
				</div>

				{/* Main Content Area */}
				<div
					style={{
						marginLeft: sidebarWidth,
						marginRight: showChatPanel ? `${chatPanelWidth}px` : "0px",
						transition: isEmbedded || chatResize.isResizing
							? undefined
							: "margin-left var(--duration-medium) var(--ease-in-out), margin-right var(--duration-medium) var(--ease-in-out)",
						flex: 1,
						overflow: "auto",
					}}
				>
					{children}
				</div>

				{/* In-situ Rovo Chat Panel */}
				{!isEmbedded && !hideRovoAction ? (
					<div
						data-shell-chrome=""
						aria-hidden={!isSidebarChatActive}
						{...(!isSidebarChatActive ? { inert: true } : {})}
						style={{
							position: "absolute",
							top: 0,
							right: 0,
							bottom: 0,
							width: `${chatPanelWidth}px`,
							padding: chatPanelFlush ? 0 : token("space.100"),
							pointerEvents: isSidebarChatActive ? "auto" : "none",
							transform: isSidebarChatActive ? "translateX(0)" : `translateX(${chatPanelWidth}px)`,
							transition: chatResize.isResizing ? undefined : "transform var(--duration-medium) var(--ease-in-out)",
							willChange: "transform",
							zIndex: 90,
						}}
					>
						<ChatPanel
							onClose={toggleChat}
							containerStyle={
								chatPanelFlush
									? {
											borderRadius: 0,
											borderWidth: 0,
										}
									: undefined
							}
						/>
						<SidebarResizeHandle
							side="left"
							data-active={chatResize.isResizing ? "" : undefined}
							onDoubleClick={chatResize.onResizeHandleDoubleClick}
							onPointerDown={chatResize.onResizeHandlePointerDown}
							onPointerEnter={chatResize.onResizeHandlePointerEnter}
							onPointerLeave={chatResize.onResizeHandlePointerLeave}
						/>
					</div>
				) : null}
			</div>

			{/* Floating Rovo Chat (anchored bottom-right) */}
			<AnimatePresence>
				{showFloatingChat ? <RovoFloatingChat key="floating-chat" /> : null}
			</AnimatePresence>

			{/* Floating Rovo Button */}
			<div data-shell-chrome="">
				{!isEmbedded && !hideFloatingRovo && !hideRovoAction ? <FloatingRovoButton product={product} embedded={isEmbedded} /> : null}
			</div>
		</div>
	);
}
