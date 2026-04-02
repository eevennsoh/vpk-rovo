"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import { getCrmStats, type DealStageFilter } from "@/app/data/crm-data";
import CrmKpiCards from "./components/crm-kpi-cards";
import CrmDealsTable from "./components/crm-deals-table";
import CrmPipelineChart from "./components/crm-pipeline-chart";
import CrmActivityFeed from "./components/crm-activity-feed";
import UsersIcon from "@atlaskit/icon/core/people-group";

export default function CrmView() {
	const [stageFilter, setStageFilter] = useState<DealStageFilter>("all");
	const stats = getCrmStats();

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
			<div
				className="flex items-center gap-3 border-b border-border"
				style={{ padding: token("space.300"), paddingBottom: token("space.200") }}
			>
				<div className="flex items-center justify-center size-9 rounded-md bg-bg-information-subtler text-icon-information shrink-0">
					<UsersIcon label="" />
				</div>
				<div>
					<h1 className="text-text font-semibold text-base leading-tight">CRM Dashboard</h1>
					<p className="text-text-subtlest text-sm">Track deals, pipeline, and customer activity</p>
				</div>
			</div>

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
				{/* KPI Cards */}
				<CrmKpiCards stats={stats} />

				{/* Two-column layout: table + sidebar */}
				<div
					className={cn(
						"grid gap-4",
						"grid-cols-1 lg:grid-cols-[1fr_300px]",
					)}
				>
					{/* Left: Deals table */}
					<CrmDealsTable
						stageFilter={stageFilter}
						onStageFilterChange={setStageFilter}
					/>

					{/* Right: Pipeline chart + Activity feed */}
					<div className="flex flex-col gap-4">
						<CrmPipelineChart />
						<CrmActivityFeed />
					</div>
				</div>
			</div>
		</div>
	);
}
