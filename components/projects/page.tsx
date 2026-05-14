"use client";

import React, { useState, useEffect } from "react";
import { token } from "@/lib/tokens";
import TopNavigation from "@/components/blocks/top-navigation/page";
import Sidebar from "@/components/blocks/product-sidebar/page";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import ChatPanel from "@/components/projects/sidebar-chat/page";
import { useSidebar } from "@/app/contexts/context-sidebar";
import { useRovoChat } from "@/app/contexts";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search";

interface AppLayoutProps {
	product: Product;
	children: React.ReactNode;
	embedded?: boolean;
	hideFloatingRovo?: boolean;
	hideRovoAction?: boolean;
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
}: Readonly<AppLayoutProps>) {
	const isEmbedded = useIsEmbedded(embedded);
	const { isVisible } = useSidebar();
	const { isOpen: isChatOpen, toggleChat } = useRovoChat();
	const chatPanelWidth = 400;
	const showChatPanel = !isEmbedded && !hideRovoAction && isChatOpen;
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
						transition: isEmbedded
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
						aria-hidden={!isChatOpen}
						{...(!isChatOpen ? { inert: true } : {})}
						style={{
							position: "absolute",
							top: 0,
							right: 0,
							bottom: 0,
							width: `${chatPanelWidth}px`,
							padding: token("space.100"),
							pointerEvents: isChatOpen ? "auto" : "none",
							transform: isChatOpen ? "translateX(0)" : `translateX(${chatPanelWidth}px)`,
							transition: "transform var(--duration-medium) var(--ease-in-out)",
							willChange: "transform",
							zIndex: 90,
						}}
					>
						<ChatPanel onClose={toggleChat} />
					</div>
				) : null}
			</div>

			{/* Floating Rovo Button */}
			<div data-shell-chrome="">
				{!isEmbedded && !hideFloatingRovo && !hideRovoAction ? <FloatingRovoButton product={product} embedded={isEmbedded} /> : null}
			</div>
		</div>
	);
}
