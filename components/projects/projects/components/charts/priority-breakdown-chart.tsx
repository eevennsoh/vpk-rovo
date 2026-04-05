"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

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
	type ChartConfig,
} from "@/components/ui/chart";
import type { PriorityChartData } from "../../lib/transform-jira-data";

const chartConfig = {
	count: {
		label: "Issues",
	},
	highest: {
		label: "Highest",
		color: "var(--color-chart-5)",
	},
	high: {
		label: "High",
		color: "var(--color-chart-3)",
	},
	medium: {
		label: "Medium",
		color: "var(--color-chart-2)",
	},
	low: {
		label: "Low",
		color: "var(--color-chart-4)",
	},
} satisfies ChartConfig;

interface PriorityBreakdownChartProps {
	data: PriorityChartData[];
}

export default function PriorityBreakdownChart({ data }: PriorityBreakdownChartProps) {
	return (
		<Card className="flex flex-col">
			<CardHeader>
				<CardTitle>Priority Breakdown</CardTitle>
				<CardDescription>Issues by priority level</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<BarChart
						accessibilityLayer
						data={data}
						layout="vertical"
						margin={{ left: 0 }}
					>
						<XAxis type="number" dataKey="count" hide />
						<YAxis
							dataKey="priority"
							type="category"
							tickLine={false}
							tickMargin={10}
							axisLine={false}
							width={70}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Bar dataKey="count" radius={5} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
