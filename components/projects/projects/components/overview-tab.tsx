"use client";

import { cn } from "@/lib/utils";
import SummaryCards from "./summary-cards";
import StatusDistributionChart from "./charts/status-distribution-chart";
import PriorityBreakdownChart from "./charts/priority-breakdown-chart";
import IssuesOverTimeChart from "./charts/issues-over-time-chart";
import AssigneeWorkloadChart from "./charts/assignee-workload-chart";
import type { ProjectStats } from "../lib/types";
import type {
	StatusChartData,
	PriorityChartData,
	TimelineChartData,
	AssigneeChartData,
} from "../lib/transform-jira-data";

interface OverviewTabProps {
	stats: ProjectStats;
	statusDistribution: StatusChartData[];
	priorityBreakdown: PriorityChartData[];
	issuesOverTime: TimelineChartData[];
	assigneeWorkload: AssigneeChartData[];
}

export default function OverviewTab({
	stats,
	statusDistribution,
	priorityBreakdown,
	issuesOverTime,
	assigneeWorkload,
}: OverviewTabProps) {
	return (
		<div className="flex flex-col gap-6">
			{/* KPI Cards */}
			<SummaryCards stats={stats} />

			{/* Charts Row 1: Status + Priority */}
			<div
				className={cn(
					"grid gap-4",
					"grid-cols-1 lg:grid-cols-2",
				)}
			>
				<StatusDistributionChart data={statusDistribution} />
				<PriorityBreakdownChart data={priorityBreakdown} />
			</div>

			{/* Charts Row 2: Timeline + Workload */}
			<div
				className={cn(
					"grid gap-4",
					"grid-cols-1 lg:grid-cols-2",
				)}
			>
				<IssuesOverTimeChart data={issuesOverTime} />
				<AssigneeWorkloadChart data={assigneeWorkload} />
			</div>
		</div>
	);
}
