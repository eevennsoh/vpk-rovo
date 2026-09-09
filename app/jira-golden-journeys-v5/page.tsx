"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraGoldenJourneysV5Content() {
	const Demo = use(loadDemoComponent("jira-golden-journeys-v5", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraGoldenJourneysV5Page() {
	return (
		<Suspense>
			<JiraGoldenJourneysV5Content />
		</Suspense>
	);
}
