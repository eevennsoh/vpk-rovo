"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Lozenge } from "@/components/ui/lozenge";
import type { WorkItem } from "../lib/types";

interface WorkItemRowProps {
	item: WorkItem;
	isLast: boolean;
	onClick: (item: WorkItem) => void;
}

function getStatusAppearance(status: string): "neutral" | "information" | "success" | "danger" {
	const lowerStatus = status.toLowerCase();
	if (lowerStatus.includes("progress") || lowerStatus.includes("review")) return "information";
	if (lowerStatus.includes("done") || lowerStatus.includes("complete")) return "success";
	if (lowerStatus.includes("blocked")) return "danger";
	return "neutral";
}

function getPriorityColor(priority?: string) {
	switch (priority) {
		case "High":
			return "text-text-danger";
		case "Medium":
			return "text-text-warning";
		case "Low":
			return "text-text-subtle";
		default:
			return "text-text-subtle";
	}
}

function formatDate(dateString: string) {
	try {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
	} catch {
		return dateString;
	}
}

export function WorkItemRow({ item, isLast, onClick }: Readonly<WorkItemRowProps>) {
	return (
		<button
			type="button"
			onClick={() => onClick(item)}
			className={cn(
				"flex w-full cursor-pointer flex-col gap-[var(--ds-space-075)] text-left",
				"hover:bg-bg-neutral-subtle-hovered focus-visible:outline-2 focus-visible:outline-border-focused focus-visible:-outline-offset-2",
				!isLast && "border-b border-border",
			)}
			style={{
				padding: `${token("space.100")} ${token("space.150")}`,
			}}
		>
			<div className="flex items-start justify-between" style={{ gap: token("space.100") }}>
				<div className="flex-1">
					<div className="flex items-center" style={{ gap: token("space.100"), marginBottom: token("space.050") }}>
						<span
							className="font-mono font-semibold text-link"
							style={{ font: token("font.body.small"), fontWeight: 600 }}
						>
							{item.key}
						</span>
						{item.priority ? (
							<span
								className={cn("text-[10px] font-semibold uppercase tracking-wide", getPriorityColor(item.priority))}
							>
								{item.priority}
							</span>
						) : null}
					</div>
					<div className="font-medium text-text" style={{ font: token("font.body"), fontWeight: 500 }}>
						{item.summary}
					</div>
				</div>
				<Lozenge variant={getStatusAppearance(item.status)}>{item.status}</Lozenge>
			</div>
			{item.dueDate ? (
				<div
					className="flex items-center text-text-subtlest"
					style={{ font: token("font.body.small"), gap: token("space.050") }}
				>
					<span>Due:</span>
					<span className="font-medium">{formatDate(item.dueDate)}</span>
				</div>
			) : null}
		</button>
	);
}
