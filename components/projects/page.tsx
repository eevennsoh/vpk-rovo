"use client";

import React from "react";
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

export default function AppLayout({
	product,
	children,
	embedded = false,
	hideFloatingRovo,
}: Readonly<AppLayoutProps>) {
	const { isVisible } = useSidebar();
	const { isOpen, closeChat } = useRovoChat();
	const sidebarWidth = isVisible ? "230px" : "0px";
	const shellViewportHeight = embedded ? "100%" : "100vh";
	const shellContentHeight = embedded ? "calc(100% - 48px)" : "calc(100vh - 48px)";
	const shellStyle = {
		minHeight: shellViewportHeight,
		height: shellViewportHeight,
		backgroundColor: token("color.background.neutral.subtle"),
		overflow: "hidden",
		"--vpk-project-shell-content-height": shellContentHeight,
		"--vpk-project-shell-top-offset": embedded ? "0px" : "48px",
	} as React.CSSProperties;

	return (
		<div style={shellStyle}>
			<TopNavigation product={product} />

			<div style={{ display: "flex", height: shellContentHeight, position: "relative" }}>
				{/* Sidebar */}
				<Sidebar product={product} embedded={embedded} />

				{/* Main Content Area */}
				<div
					style={{
						marginLeft: sidebarWidth,
						transition: "margin-left var(--duration-medium) var(--ease-in-out)",
						flex: 1,
						overflow: "auto",
					}}
				>
					{children}
				</div>

				{/* Rovo Chat Panel */}
				{isOpen && <RovoChatPanel onClose={closeChat} product={product} embedded={embedded} />}
			</div>

			{/* Floating Rovo Button */}
			{!hideFloatingRovo && <FloatingRovoButton product={product} embedded={embedded} />}
		</div>
	);
}
