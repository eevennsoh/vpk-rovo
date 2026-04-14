"use client";

import React from "react";
import { token } from "@/lib/tokens";

interface DropdownMenuItemProps {
	icon: React.ReactNode;
	label: string;
	isSelected: boolean;
	onClick: () => void;
	fontSize?: string;
	fontWeight?: number;
}

export function DropdownMenuItem({
	icon,
	label,
	isSelected,
	onClick,
	fontSize,
	fontWeight,
}: Readonly<DropdownMenuItemProps>): React.ReactElement {
	return (
		<button
			onClick={onClick}
			style={{
				width: "100%",
				padding: token("space.100"),
				border: "none",
				background: isSelected ? token("color.background.selected") : "transparent",
				cursor: "pointer",
				textAlign: "left",
				borderRadius: "0px",
				color: isSelected ? token("color.text.selected") : "inherit",
			}}
		>
			<div className="flex items-center gap-2">
				{icon}
				<span style={{ fontWeight, fontSize }}>{label}</span>
			</div>
		</button>
	);
}

interface DropdownMenuContainerProps {
	children: React.ReactNode;
	top: number;
	left: number;
}

export function DropdownMenuContainer({
	children,
	top,
	left,
}: Readonly<DropdownMenuContainerProps>): React.ReactElement {
	return (
		<div
			style={{
				position: "fixed",
				top: `${top}px`,
				left: `${left}px`,
				backgroundColor: token("elevation.surface.overlay"),
				borderRadius: token("radius.large"),
				boxShadow: token("elevation.shadow.overlay"),
				zIndex: 2000,
				minWidth: "200px",
				padding: token("space.075"),
			}}
		>
			{children}
		</div>
	);
}
