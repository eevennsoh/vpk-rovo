"use client";

import { token } from "@/lib/tokens";

interface ColumnHeader {
	label: string;
}

export const CHILD_ITEMS_GRID_COLUMNS = "minmax(0, 1fr) 76px 88px 148px";

const COLUMN_HEADERS: ColumnHeader[] = [
	{ label: "Work" },
	{ label: "Priority" },
	{ label: "Assignee" },
	{ label: "Status" },
];

export function ChildItemsTableHeader() {
	return (
		<div
			role="row"
			style={{
				display: "grid",
				gridTemplateColumns: CHILD_ITEMS_GRID_COLUMNS,
				backgroundColor: token("elevation.surface.sunken"),
				minHeight: "40px",
			}}
		>
			{COLUMN_HEADERS.map((col, index) => (
				<div
					key={col.label}
					role="columnheader"
					style={{
						minWidth: 0,
						padding: `0 ${index === 0 ? token("space.200") : token("space.100")}`,
						display: "flex",
						alignItems: "center",
						borderLeft: index > 0 ? `1px solid ${token("color.border")}` : undefined,
					}}
				>
					<span className="truncate text-sm font-semibold text-text-subtle" title={col.label}>
						{col.label}
					</span>
				</div>
			))}
		</div>
	);
}
