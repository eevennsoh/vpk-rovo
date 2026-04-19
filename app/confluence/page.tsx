"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function ConfluenceContent() {
	const Demo = use(loadDemoComponent("confluence", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function ConfluencePage() {
	return (
		<Suspense>
			<ConfluenceContent />
		</Suspense>
	);
}
