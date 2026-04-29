"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function PersonalGraphContent() {
	const Demo = use(loadDemoComponent("personal-graph", "arts"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function PersonalGraphPage() {
	return (
		<Suspense>
			<PersonalGraphContent />
		</Suspense>
	);
}
