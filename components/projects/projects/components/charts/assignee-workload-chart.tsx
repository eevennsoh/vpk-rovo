"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart";
import type { AssigneeChartData } from "../../lib/transform-jira-data";

const chartConfig = {
	done: {
		label: "Done",
		color: "var(--color-chart-1)",
	},
	open: {
		label: "Open",
		color: "var(--color-chart-2)",
	},
} satisfies ChartConfig;

interface AssigneeWorkloadChartProps {
	data: AssigneeChartData[];
}

export default function AssigneeWorkloadChart({ data }: AssigneeWorkloadChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Assignee Workload</CardTitle>
				<CardDescription>Issues per team member</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="assignee"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							tickFormatter={(value: string) => value.split(" ")[0]}
						/>
						<YAxis tickLine={false} axisLine={false} />
						<ChartTooltip content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar
							dataKey="done"
							stackId="a"
							fill="var(--color-done)"
							radius={[0, 0, 4, 4]}
						/>
						<Bar
							dataKey="open"
							stackId="a"
							fill="var(--color-open)"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
