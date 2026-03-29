"use client";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { AnalyticsKpiCards } from "@/components/blocks/dashboard/components/analytics-kpi-cards";
import { ChartEngagementTrend } from "@/components/blocks/dashboard/components/chart-engagement-trend";
import { ChartFeatureAdoption } from "@/components/blocks/dashboard/components/chart-feature-adoption";
import { ChartFeatureComparison } from "@/components/blocks/dashboard/components/chart-feature-comparison";
import { ChartUserDistribution } from "@/components/blocks/dashboard/components/chart-user-distribution";

export default function OverviewView() {
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
			<header className="flex h-12 shrink-0 items-center gap-2 border-b px-4 lg:px-6">
				<h1 className="text-base font-medium">Overview</h1>
			</header>

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
				<AnalyticsKpiCards />

				{/* Engagement Trend — full width */}
				<div className="px-4 lg:px-6">
					<ChartEngagementTrend />
				</div>

				{/* Charts Row */}
				<div
					className={cn(
						"grid gap-4 px-4 lg:px-6",
						"grid-cols-1 lg:grid-cols-[1fr_1fr_320px]",
					)}
				>
					<ChartFeatureAdoption />
					<ChartFeatureComparison />
					<ChartUserDistribution />
				</div>
			</div>
		</div>
	);
}
