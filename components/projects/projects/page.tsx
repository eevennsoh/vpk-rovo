"use client";

import { token } from "@/lib/tokens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProjectsHeader from "./components/projects-header";
import OverviewTab from "./components/overview-tab";
import IssuesTab from "./components/issues-tab";
import { useJiraData } from "./hooks/use-jira-data";

export default function ProjectsView() {
	const {
		issues,
		stats,
		statusDistribution,
		priorityBreakdown,
		issuesOverTime,
		assigneeWorkload,
	} = useJiraData();

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
			<ProjectsHeader projectName="Atlas Platform" />

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
				<Tabs defaultValue="overview">
					<TabsList variant="line">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="issues">Issues</TabsTrigger>
					</TabsList>

					<TabsContent value="overview">
						<OverviewTab
							stats={stats}
							statusDistribution={statusDistribution}
							priorityBreakdown={priorityBreakdown}
							issuesOverTime={issuesOverTime}
							assigneeWorkload={assigneeWorkload}
						/>
					</TabsContent>

					<TabsContent value="issues">
						<IssuesTab issues={issues} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
