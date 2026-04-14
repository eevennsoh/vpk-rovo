"use client";

import React from "react";
import { token } from "@/lib/tokens";
import ConfluenceHeader from "./components/confluence-header";
import DocumentEditor from "./components/document-editor";
import FloatingConfluenceActions from "./components/floating-confluence-actions";

interface ConfluenceViewProps {
	embedded?: boolean;
}

export default function ConfluenceView({
	embedded = false,
}: Readonly<ConfluenceViewProps>) {
	return (
		<div
			style={{
				height: "var(--vpk-project-shell-content-height, calc(100vh - 48px))",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				position: "relative",
			}}
		>
			{/* Fixed Header */}
			<ConfluenceHeader embedded={embedded} />

			{/* Scrollable Content Area */}
			<div
				style={{
					flex: 1,
					overflow: "auto",
					marginTop: "56px", // Height of fixed header
				}}
			>
				<div
					style={{
						padding: `0px ${token("space.300")}`,
						display: "flex",
						justifyContent: "center",
					}}
				>
					<div style={{ maxWidth: "760px", width: "100%" }}>
						<DocumentEditor />
					</div>
				</div>
			</div>

			{/* Floating Confluence Actions */}
			<FloatingConfluenceActions embedded={embedded} />
		</div>
	);
}
