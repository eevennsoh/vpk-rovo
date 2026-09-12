"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraTeamEu26Content() {
	const Demo = use(loadDemoComponent("jira-team-eu26", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraTeamEu26Page() {
	return (
		<Suspense>
			<JiraTeamEu26Content />
		</Suspense>
	);
}
