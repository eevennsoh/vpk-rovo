"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { SAMPLE_TASKS, getTaskStats, type TaskStatus } from "@/app/data/dashboard-sample";

interface StatusChartProps {
	/**
	 * Optional filter function to aggregate filtered task counts
	 */
	filterFn?: (task: typeof SAMPLE_TASKS[0]) => boolean;
	/**
	 * Optional custom height in pixels
	 */
	height?: number;
}

/**
 * Prepares chart data by aggregating task counts by status
 * Optionally applies filter function before aggregation
 */
function prepareChartData(
	filterFn?: (task: typeof SAMPLE_TASKS[0]) => boolean,
): Array<{ status: string; count: number }> {
	const statuses: TaskStatus[] = ["todo", "inprogress", "done"];

	return statuses.map((status) => {
		const tasksWithStatus = SAMPLE_TASKS.filter((task) => task.status === status);
		const count = filterFn ? tasksWithStatus.filter(filterFn).length : tasksWithStatus.length;

		return {
			status: getStatusLabel(status),
			count,
		};
	});
}

/**
 * Maps TaskStatus to display labels
 */
function getStatusLabel(status: TaskStatus): string {
	switch (status) {
		case "todo":
			return "To Do";
		case "inprogress":
			return "In Progress";
		case "done":
			return "Done";
		default:
			return "Unknown";
	}
}

/**
 * StatusChart component renders a bar chart showing task count by status
 *
 * Features:
 * - Visualizes task distribution across statuses
 * - Supports optional filtering (respects parent filter state)
 * - Responsive height with sensible default (280px)
 * - X-axis: status labels (To Do, In Progress, Done)
 * - Y-axis: task count with automatic scaling
 */
export function StatusChart({ filterFn }: StatusChartProps) {
	const chartData = prepareChartData(filterFn);
	const totalTasks = chartData.reduce((sum, item) => sum + item.count, 0);

	const chartConfig = {
		count: {
			label: "Tasks",
			color: "#0052CC",
		},
	} satisfies ChartConfig;

	return (
		<div className="flex flex-col gap-4">
			{/* Chart Title and Summary */}
			<div className="flex flex-col gap-1">
				<h3 className="text-sm font-medium text-text">Task Distribution</h3>
				<p className="text-xs text-text-subtle">
					{totalTasks} task{totalTasks !== 1 ? "s" : ""} across all statuses
				</p>
			</div>

			{/* Bar Chart */}
			<ChartContainer config={chartConfig} className="h-64 w-full">
				<BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
					<CartesianGrid vertical={false} />
					<XAxis
						dataKey="status"
						tickLine={false}
						tickMargin={10}
						axisLine={false}
					/>
					<ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
					<Bar
						dataKey="count"
						fill="var(--color-count)"
						radius={8}
					/>
				</BarChart>
			</ChartContainer>
		</div>
	);
}

/**
 * Helper component to display status statistics as inline metrics
 * Useful for dashboard header or summary sections
 */
export function StatusStats() {
	const stats = getTaskStats();

	const metrics = [
		{ label: "Total", value: stats.total, variant: "neutral" as const },
		{ label: "To Do", value: stats.todo, variant: "neutral" as const },
		{ label: "In Progress", value: stats.inprogress, variant: "information" as const },
		{ label: "Done", value: stats.done, variant: "success" as const },
	];

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{metrics.map((metric) => (
				<div
					key={metric.label}
					className="flex flex-col gap-1 rounded-lg border border-border bg-bg-neutral-subtle p-3"
				>
					<p className="text-xs font-medium text-text-subtle">{metric.label}</p>
					<p className="text-lg font-semibold text-text">{metric.value}</p>
				</div>
			))}
		</div>
	);
}
