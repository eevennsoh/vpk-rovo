"use client";

import AppLayout from "@/components/projects/page";
import ProjectsView from "@/components/projects/projects/page";

export default function ProjectsPage() {
	return (
		<AppLayout product="jira">
			<ProjectsView />
		</AppLayout>
	);
}
