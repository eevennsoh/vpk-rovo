"use client";

import { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";

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
import type { StatusChartData } from "../../lib/transform-jira-data";

const chartConfig = {
	count: {
		label: "Issues",
	},
	todo: {
		label: "To Do",
		color: "var(--color-chart-4)",
	},
	inprogress: {
		label: "In Progress",
		color: "var(--color-chart-2)",
	},
	done: {
		label: "Done",
		color: "var(--color-chart-1)",
	},
} satisfies ChartConfig;

interface StatusDistributionChartProps {
	data: StatusChartData[];
}

export default function StatusDistributionChart({ data }: StatusDistributionChartProps) {
	const totalIssues = useMemo(() => {
		return data.reduce((acc, curr) => acc + curr.count, 0);
	}, [data]);

	return (
		<Card className="flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>Status Distribution</CardTitle>
				<CardDescription>Issues by current status</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 pb-0">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[250px]"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={<ChartTooltipContent hideLabel />}
						/>
						<Pie
							data={data}
							dataKey="count"
							nameKey="status"
							innerRadius={60}
							strokeWidth={5}
						>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle"
											>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground text-3xl font-bold"
												>
													{totalIssues.toLocaleString()}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy ?? 0) + 24}
													className="fill-muted-foreground"
												>
													Issues
												</tspan>
											</text>
										);
									}
								}}
							/>
						</Pie>
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
