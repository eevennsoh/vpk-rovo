"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TaskStats {
	total: number;
	todo: number;
	inprogress: number;
	done: number;
}

interface BarSegment {
	label: string;
	value: number;
	colorClass: string;
	bgClass: string;
}

interface DashboardStatusChartProps {
	stats: TaskStats;
}

export default function DashboardStatusChart({ stats }: DashboardStatusChartProps) {
	const segments: BarSegment[] = [
		{ label: "Done", value: stats.done, colorClass: "text-success", bgClass: "bg-success" },
		{ label: "In Progress", value: stats.inprogress, colorClass: "text-warning", bgClass: "bg-warning" },
		{ label: "To Do", value: stats.todo, colorClass: "text-text-subtle", bgClass: "bg-neutral" },
	];

	return (
		<Card className="bg-surface-raised">
			<div style={{ padding: `${token("space.200")} ${token("space.200")}` }}>
				<h2
					className="text-text"
					style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}
				>
					Task Distribution
				</h2>
			</div>
			<Separator />
			<div
				style={{
					padding: token("space.200"),
					display: "flex",
					flexDirection: "column",
					gap: token("space.200"),
				}}
			>
				{/* Stacked bar */}
				<div
					className="flex overflow-hidden rounded-md"
					style={{ height: 24 }}
				>
					{segments.map((seg) => {
						const pct = stats.total > 0 ? (seg.value / stats.total) * 100 : 0;
						return pct > 0 ? (
							<div
								key={seg.label}
								className={cn(seg.bgClass, "transition-all")}
								style={{ width: `${pct}%`, minWidth: pct > 0 ? 8 : 0 }}
								title={`${seg.label}: ${seg.value} (${Math.round(pct)}%)`}
							/>
						) : null;
					})}
				</div>

				{/* Legend */}
				<div className="flex flex-col gap-2">
					{segments.map((seg) => {
						const pct = stats.total > 0 ? Math.round((seg.value / stats.total) * 100) : 0;
						return (
							<div key={seg.label} className="flex items-center justify-between text-xs">
								<div className="flex items-center gap-2">
									<div
										className={cn("rounded-sm", seg.bgClass)}
										style={{ width: 10, height: 10, flexShrink: 0 }}
									/>
									<span className="text-text-subtle">{seg.label}</span>
								</div>
								<span className="text-text font-medium">
									{seg.value} ({pct}%)
								</span>
							</div>
						);
					})}
				</div>
			</div>
		</Card>
	);
}
