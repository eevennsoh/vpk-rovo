"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import {
	SAMPLE_TASKS,
	TEAM_MEMBERS,
	getTaskStats,
	getTeamMember,
	type Task,
	type TaskStatus,
} from "@/app/data/dashboard-sample";
import DashboardHeader from "./components/dashboard-header";
import DashboardKpiCards from "./components/dashboard-kpi-cards";
import DashboardTaskTable from "./components/dashboard-task-table";
import DashboardStatusChart from "./components/dashboard-status-chart";
import DashboardActivityTimeline from "./components/dashboard-activity-timeline";

export default function DashboardView() {
	const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

	const stats = getTaskStats();
	const filteredTasks =
		statusFilter === "all"
			? SAMPLE_TASKS
			: SAMPLE_TASKS.filter((task) => task.status === statusFilter);

	return (
		<div
			style={{
				height: "var(--vpk-project-shell-content-height, calc(100vh - 48px))",
				display: "flex",
				flexDirection: "column",
				overflow: "auto",
			}}
		>
			{/* Header */}
			<DashboardHeader />

			{/* Main content */}
			<div
				style={{
					flex: 1,
					padding: token("space.300"),
					display: "flex",
					flexDirection: "column",
					gap: token("space.300"),
				}}
			>
				{/* KPI Cards Row */}
				<DashboardKpiCards stats={stats} />

				{/* Charts + Table Row */}
				<div
					className={cn(
						"grid gap-4",
						"grid-cols-1 lg:grid-cols-[1fr_320px]",
					)}
				>
					{/* Left: Table */}
					<DashboardTaskTable
						tasks={filteredTasks}
						statusFilter={statusFilter}
						onStatusFilterChange={setStatusFilter}
					/>

					{/* Right: Chart + Activity */}
					<div className="flex flex-col gap-4">
						<DashboardStatusChart stats={stats} />
						<DashboardActivityTimeline tasks={SAMPLE_TASKS} />
					</div>
				</div>
			</div>
		</div>
	);
}
