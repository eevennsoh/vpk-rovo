"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";

import { useSidebar } from "@/app/contexts/context-sidebar";
import { AdminSidebar } from "./variants/admin";
import { JiraSidebar } from "./variants/jira";
import { ConfluenceSidebar } from "./variants/confluence";

type Product = "admin" | "home" | "jira" | "confluence" | "rovo" | "search";

interface SidebarProps {
	product: Product;
	embedded?: boolean;
}

export default function Sidebar({ product, embedded = false }: Readonly<SidebarProps>) {
	const [selectedItem, setSelectedItem] = useState(product === "confluence" ? "Demo Live page" : "Vitafleet Q4 Launch");
	const { isVisible, isHovered, setHovered } = useSidebar();
	const shouldShow = isVisible || isHovered;

	// Render the appropriate sidebar based on product
	const renderSidebarContent = () => {
		switch (product) {
			case "admin":
				return <AdminSidebar />;
			case "jira":
				return <JiraSidebar selectedItem={selectedItem} onSelectItem={setSelectedItem} />;
			case "confluence":
				return <ConfluenceSidebar selectedItem={selectedItem} onSelectItem={setSelectedItem} />;
			default:
				return <JiraSidebar selectedItem={selectedItem} onSelectItem={setSelectedItem} />;
		}
	};

	return (
		<>
			<div
				style={{
					width: "230px",
					height: embedded ? "100%" : (isVisible ? "100vh" : "calc(100vh - 48px)"),
					backgroundColor: token("elevation.surface"),
					borderRight: `1px solid ${token("color.border")}`,
					position: embedded ? "absolute" : "fixed",
					left: 0,
					top: embedded ? 0 : (isVisible ? "0" : "48px"),
					transform: shouldShow ? "translateX(0)" : "translateX(-100%)",
					transition: "transform var(--duration-medium) var(--ease-in-out)",
					overflow: "auto",
					zIndex: isVisible || isHovered ? 99 : 50,
				}}
				onMouseLeave={() => {
					if (isHovered && !isVisible) {
						setHovered(false);
					}
				}}
			>
				<div
					style={{
						padding: token("space.150"),
						paddingTop: embedded ? token("space.150") : (isVisible ? "calc(48px + 12px)" : token("space.150")),
						display: "flex",
						flexDirection: "column",
					}}
				>
					{renderSidebarContent()}
				</div>
			</div>

			{/* Border overlay that sits above top nav when sidebar is visible */}
			{isVisible && !embedded && (
				<div
					style={{
						position: "fixed",
						left: "229px",
						top: 0,
						width: "1px",
						height: "48px",
						backgroundColor: token("color.border"),
						zIndex: 102,
						transform: shouldShow ? "translateX(0)" : "translateX(-100%)",
						transition: "transform var(--duration-medium) var(--ease-in-out)",
					}}
				/>
			)}
		</>
	);
}
