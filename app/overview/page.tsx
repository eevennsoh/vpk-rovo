"use client";

import AppLayout from "@/components/projects/page";
import OverviewView from "@/components/projects/overview/page";

export default function OverviewPage() {
	return (
		<AppLayout product="overview">
			<OverviewView />
		</AppLayout>
	);
}
