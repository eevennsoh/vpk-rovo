"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import AddIcon from "@atlaskit/icon/core/add";
import ColumnAgentAssignment from "./column-agent-assignment";
import type { BoardAgentData } from "../data/board-agents";

interface BoardColumnProps {
	agents: readonly BoardAgentData[];
	assignedAgentIds: readonly string[];
	title: string;
	count: number;
	children: React.ReactNode;
	onCreateAgent: (columnTitle: string) => void;
	onToggleAgent: (agentId: string) => void;
}

export default function BoardColumn({
	agents,
	assignedAgentIds,
	title,
	count,
	children,
	onCreateAgent,
	onToggleAgent,
}: Readonly<BoardColumnProps>) {
	return (
		<div
			className="group/board-column"
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
			<div style={{ paddingBlock: token("space.100"), paddingInline: token("space.150") }}>
				<div className="flex min-w-0 items-center justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<span
							className="truncate"
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
					<ColumnAgentAssignment
						agents={agents}
						assignedAgentIds={assignedAgentIds}
						columnTitle={title}
						onCreateAgent={onCreateAgent}
						onToggleAgent={onToggleAgent}
					/>
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
					<Icon render={<AddIcon label="" size="small" />} />
					Create
				</Button>
			</div>
		</div>
	);
}
