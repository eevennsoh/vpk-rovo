"use client";

import React, { useState } from "react";
import { token } from "@/lib/tokens";
import TopNavigation from "@/components/blocks/top-navigation/page";
import Sidebar from "@/components/blocks/product-sidebar/page";
import { RovoChatPanel } from "@/components/projects/fullscreen-chat";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import { useSidebar } from "@/app/contexts/context-sidebar";
import { useRovoChat } from "@/app/contexts";

type Product = "home" | "jira" | "confluence" | "rovo" | "search";

interface AppLayoutProps {
	product: Product;
	children: React.ReactNode;
	embedded?: boolean;
	hideFloatingRovo?: boolean;
}

/**
 * Detect iframe context so generated apps rendered inside the artifact
 * panel's iframe automatically hide all shell chrome (TopNavigation,
 * Sidebar, FloatingRovoButton, RovoChatPanel).
 */
function useIsEmbedded(explicit: boolean): boolean {
	const [auto] = useState(() => {
		if (typeof window === "undefined") return false;
		try {
			return window.self !== window.top;
		} catch {
			return true; // cross-origin iframe
		}
	});
	return explicit || auto;
}

export default function AppLayout({
	product,
	children,
	embedded = false,
	hideFloatingRovo,
}: Readonly<AppLayoutProps>) {
	const isEmbedded = useIsEmbedded(embedded);
	const { isVisible } = useSidebar();
	const { isOpen, closeChat } = useRovoChat();
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
			{!isEmbedded && <TopNavigation product={product} />}

			<div style={{ display: "flex", height: shellContentHeight, position: "relative" }}>
				{!isEmbedded && <Sidebar product={product} embedded={isEmbedded} />}

				{/* Main Content Area */}
				<div
					style={{
						marginLeft: sidebarWidth,
						transition: isEmbedded ? undefined : "margin-left var(--duration-medium) var(--ease-in-out)",
						flex: 1,
						overflow: "auto",
					}}
				>
					{children}
				</div>

				{/* Rovo Chat Panel */}
				{!isEmbedded && isOpen && <RovoChatPanel onClose={closeChat} product={product} embedded={isEmbedded} />}
			</div>

			{/* Floating Rovo Button */}
			{!isEmbedded && !hideFloatingRovo && <FloatingRovoButton product={product} embedded={isEmbedded} />}
		</div>
	);
}
