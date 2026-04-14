"use client";

import { ReactNode } from "react";
import { token } from "@/lib/tokens";

interface ModalContainerProps {
	children: ReactNode;
}

export function ModalContainer({ children }: Readonly<ModalContainerProps>) {
	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				width: "calc(100vw - 120px)",
				maxWidth: "1200px",
				height: "calc(100vh - 120px)",
				backgroundColor: token("elevation.surface.overlay"),
				borderRadius: token("radius.xlarge"),
				boxShadow: token("elevation.shadow.overlay"),
				zIndex: 501,
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}
		>
			{children}
		</div>
	);
}

interface TwoColumnLayoutProps {
	children: ReactNode;
}

export function TwoColumnLayout({ children }: Readonly<TwoColumnLayoutProps>) {
	return <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>{children}</div>;
}

interface LeftColumnProps {
	children: ReactNode;
}

export function LeftColumn({ children }: Readonly<LeftColumnProps>) {
	return (
		<div style={{ flex: 1, overflowY: "auto", padding: token("space.400") }}>
			{children}
		</div>
	);
}

interface RightColumnProps {
	children: ReactNode;
}

export function RightColumn({ children }: Readonly<RightColumnProps>) {
	return (
		<div
			style={{
				minWidth: "320px",
				maxWidth: "450px",
				width: "408px",
				overflowY: "auto",
				display: "flex",
				flexDirection: "column",
				paddingLeft: token("space.100"),
				paddingRight: token("space.300"),
			}}
		>
			{children}
		</div>
	);
}
