"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function Agents2Content() {
	const Demo = use(loadDemoComponent("agents2", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function Agents2Page() {
	return (
		<Suspense>
			<Agents2Content />
		</Suspense>
	);
}
