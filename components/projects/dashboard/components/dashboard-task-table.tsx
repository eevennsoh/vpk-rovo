"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
	type Task,
	type TaskStatus,
	getTeamMember,
} from "@/app/data/dashboard-sample";

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
	todo: { label: "To Do", className: "bg-neutral-subtle text-text-subtle" },
	inprogress: { label: "In Progress", className: "bg-information-subtle text-information" },
	done: { label: "Done", className: "bg-success-subtle text-success" },
};

const PRIORITY_CONFIG: Record<string, string> = {
	High: "text-danger",
	Medium: "text-warning",
	Low: "text-text-subtlest",
};

interface DashboardTaskTableProps {
	tasks: Task[];
	statusFilter: TaskStatus | "all";
	onStatusFilterChange: (status: TaskStatus | "all") => void;
}

export default function DashboardTaskTable({
	tasks,
	statusFilter,
	onStatusFilterChange,
}: DashboardTaskTableProps) {
	const filterOptions: { value: TaskStatus | "all"; label: string }[] = [
		{ value: "all", label: "All" },
		{ value: "todo", label: "To Do" },
		{ value: "inprogress", label: "In Progress" },
		{ value: "done", label: "Done" },
	];

	return (
		<Card className="bg-surface-raised overflow-hidden">
			{/* Table header */}
			<div
				className="flex items-center justify-between"
				style={{ padding: `${token("space.200")} ${token("space.200")}` }}
			>
				<h2
					className="text-text"
					style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}
				>
					Work Items
				</h2>
				<div className="flex gap-1">
					{filterOptions.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => onStatusFilterChange(opt.value)}
							className={cn(
								"rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
								statusFilter === opt.value
									? "bg-selected text-selected-text"
									: "text-text-subtle hover:bg-surface-hovered",
							)}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>
			<Separator />

			{/* Table */}
			<div className="overflow-auto" style={{ maxHeight: 420 }}>
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-surface-sunken">
							<th
								className="text-text-subtlest text-left font-medium"
								style={{ padding: `${token("space.100")} ${token("space.200")}` }}
							>
								Key
							</th>
							<th
								className="text-text-subtlest text-left font-medium"
								style={{ padding: `${token("space.100")} ${token("space.200")}` }}
							>
								Summary
							</th>
							<th
								className="text-text-subtlest text-left font-medium"
								style={{ padding: `${token("space.100")} ${token("space.200")}` }}
							>
								Status
							</th>
							<th
								className="text-text-subtlest text-left font-medium"
								style={{ padding: `${token("space.100")} ${token("space.200")}` }}
							>
								Priority
							</th>
							<th
								className="text-text-subtlest text-left font-medium"
								style={{ padding: `${token("space.100")} ${token("space.200")}` }}
							>
								Assignee
							</th>
						</tr>
					</thead>
					<tbody>
						{tasks.map((task) => {
							const status = STATUS_CONFIG[task.status];
							const member = getTeamMember(task.assigneeId);
							return (
								<tr
									key={task.id}
									className="border-b border-border hover:bg-surface-hovered transition-colors"
								>
									<td
										className="text-link font-medium whitespace-nowrap"
										style={{ padding: `${token("space.100")} ${token("space.200")}` }}
									>
										{task.id}
									</td>
									<td
										className="text-text"
										style={{
											padding: `${token("space.100")} ${token("space.200")}`,
											maxWidth: 300,
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{task.summary}
									</td>
									<td style={{ padding: `${token("space.100")} ${token("space.200")}` }}>
										<span
											className={cn(
												"inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
												status.className,
											)}
										>
											{status.label}
										</span>
									</td>
									<td
										className={cn("font-medium", PRIORITY_CONFIG[task.priority])}
										style={{ padding: `${token("space.100")} ${token("space.200")}` }}
									>
										{task.priority}
									</td>
									<td
										className="text-text-subtle"
										style={{ padding: `${token("space.100")} ${token("space.200")}` }}
									>
										{member?.name ?? "Unassigned"}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</Card>
	);
}
