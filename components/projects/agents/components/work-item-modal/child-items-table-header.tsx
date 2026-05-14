"use client";

import { token } from "@/lib/tokens";

interface ColumnHeader {
	label: string;
	width?: string;
	flex?: number;
	hasBorder: boolean;
	alignCenter?: boolean;
}

const COLUMN_HEADERS: ColumnHeader[] = [
	{ label: "Type", width: "32px", hasBorder: false, alignCenter: true },
	{ label: "Key", width: "80px", hasBorder: true },
	{ label: "Summary", flex: 1, hasBorder: true },
	{ label: "Priority", width: "32px", hasBorder: true },
	{ label: "Assignee", width: "32px", hasBorder: true },
	{ label: "Status", width: "120px", hasBorder: true },
];

export function ChildItemsTableHeader() {
	return (
		<div
			style={{
				display: "flex",
				backgroundColor: token("elevation.surface.sunken"),
				borderBottom: `1px solid ${token("color.border")}`,
				padding: "0 8px",
				fontWeight: "medium",
			}}
		>
			{COLUMN_HEADERS.map((col) => (
				<div
					key={col.label}
					style={{
						width: col.width,
						flex: col.flex,
						padding: token("space.100"),
						display: col.alignCenter ? "flex" : undefined,
						alignItems: col.alignCenter ? "center" : undefined,
						borderLeft: col.hasBorder ? `1px solid ${token("color.border")}` : undefined,
					}}
				>
					<span className="text-xs font-semibold text-text">
						{col.label}
					</span>
				</div>
			))}
		</div>
	);
}
