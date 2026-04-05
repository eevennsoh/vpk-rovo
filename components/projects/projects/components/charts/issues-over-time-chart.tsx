"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

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
import type { TimelineChartData } from "../../lib/transform-jira-data";

const chartConfig = {
	created: {
		label: "Created",
		color: "var(--color-chart-3)",
	},
	resolved: {
		label: "Resolved",
		color: "var(--color-chart-1)",
	},
} satisfies ChartConfig;

interface IssuesOverTimeChartProps {
	data: TimelineChartData[];
}

export default function IssuesOverTimeChart({ data }: IssuesOverTimeChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Issues Over Time</CardTitle>
				<CardDescription>Created vs resolved by week</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart
						accessibilityLayer
						data={data}
						margin={{ left: 12, right: 12 }}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="week"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent indicator="dot" />}
						/>
						<Area
							dataKey="resolved"
							type="natural"
							fill="var(--color-resolved)"
							fillOpacity={0.4}
							stroke="var(--color-resolved)"
							stackId="a"
						/>
						<Area
							dataKey="created"
							type="natural"
							fill="var(--color-created)"
							fillOpacity={0.4}
							stroke="var(--color-created)"
							stackId="a"
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
