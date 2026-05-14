"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AddIcon from "@atlaskit/icon/core/add";

interface BoardColumnProps {
	title: string;
	count: number;
	children: React.ReactNode;
}

export default function BoardColumn({ title, count, children }: Readonly<BoardColumnProps>) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				height: "100%",
				backgroundColor: token("elevation.surface.sunken"),
				borderRadius: token("radius.large"),
			}}
		>
			{/* Column header */}
			<div style={{ paddingBlock: token("space.200"), paddingInline: token("space.150") }}>
				<div className="flex items-center gap-2">
					<span
						style={{
							font: token("font.body.small"),
							fontWeight: token("font.weight.medium"),
							color: token("color.text.subtle"),
						}}
					>
						{title.toUpperCase()}
					</span>
					<Badge>{count}</Badge>
				</div>
			</div>

			{/* Scrollable content */}
			<div
				style={{
					flexGrow: 1,
					overflowY: "auto",
					paddingBottom: token("space.100"),
					paddingInline: token("space.050"),
					display: "flex",
					flexDirection: "column",
					gap: token("space.050"),
				}}
			>
				{children}
			</div>

			{/* Create button */}
			<div style={{ paddingTop: token("space.100"), paddingBottom: "8px", paddingLeft: token("space.150") }}>
				<Button className="gap-2" size="sm" variant="ghost">
					<AddIcon label="" size="small" />
					Create
				</Button>
			</div>
		</div>
	);
}
