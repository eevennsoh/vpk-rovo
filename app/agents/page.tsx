"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function AgentsContent() {
	const Demo = use(loadDemoComponent("agents", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function AgentsPage() {
	return (
		<Suspense>
			<AgentsContent />
		</Suspense>
	);
}
