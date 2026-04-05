"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { type Task, getTeamMember } from "@/app/data/dashboard-sample";

function formatRelativeDate(dateStr: string): string {
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
	return Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

const STATUS_ACTION: Record<string, string> = {
	done: "completed",
	inprogress: "started working on",
	todo: "created",
};

const STATUS_DOT_CLASS: Record<string, string> = {
	done: "bg-success",
	inprogress: "bg-warning",
	todo: "bg-neutral",
};

interface DashboardActivityTimelineProps {
	tasks: Task[];
}

export default function DashboardActivityTimeline({ tasks }: DashboardActivityTimelineProps) {
	// Sort by updatedAt descending, take 8 most recent
	const recentTasks = [...tasks]
		.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
		.slice(0, 8);

	return (
		<Card className="bg-surface-raised flex-1">
			<div style={{ padding: `${token("space.200")} ${token("space.200")}` }}>
				<h2
					className="text-text"
					style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}
				>
					Recent Activity
				</h2>
			</div>
			<Separator />
			<div
				style={{
					padding: token("space.200"),
					display: "flex",
					flexDirection: "column",
					gap: token("space.050"),
				}}
			>
				{recentTasks.map((task, idx) => {
					const member = getTeamMember(task.assigneeId);
					const action = STATUS_ACTION[task.status] ?? "updated";
					const dotClass = STATUS_DOT_CLASS[task.status] ?? "bg-neutral";
					const isLast = idx === recentTasks.length - 1;

					return (
						<div key={task.id} className="flex gap-3" style={{ minHeight: 36 }}>
							{/* Timeline dot + line */}
							<div className="flex flex-col items-center" style={{ width: 12 }}>
								<div
									className={cn("rounded-full mt-1.5 flex-shrink-0", dotClass)}
									style={{ width: 8, height: 8 }}
								/>
								{!isLast ? (
									<div
										className="bg-border flex-1"
										style={{ width: 1, marginTop: 2, marginBottom: 2 }}
									/>
								) : null}
							</div>

							{/* Content */}
							<div className="flex-1 pb-2" style={{ minWidth: 0 }}>
								<p
									className="text-text-subtle text-xs"
									style={{ margin: 0, lineHeight: 1.5 }}
								>
									<span className="text-text font-medium">{member?.name ?? "Someone"}</span>
									{" "}
									{action}
									{" "}
									<span className="text-link">{task.id}</span>
								</p>
								<p
									className="text-text-subtlest text-xs"
									style={{
										margin: 0,
										marginTop: 1,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{formatRelativeDate(task.updatedAt)}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</Card>
	);
}
