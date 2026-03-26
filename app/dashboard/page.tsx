"use client";

import AppLayout from "@/components/projects/page";
import DashboardView from "@/components/projects/dashboard/page";

export default function DashboardPage() {
	return (
		<AppLayout product="jira">
			<DashboardView />
		</AppLayout>
	);
}
