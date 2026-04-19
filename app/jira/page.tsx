"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function JiraContent() {
	const Demo = use(loadDemoComponent("jira", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function JiraPage() {
	return (
		<Suspense>
			<JiraContent />
		</Suspense>
	);
}
