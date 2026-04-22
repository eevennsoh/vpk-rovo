"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function AwakeContent() {
	const Demo = use(loadDemoComponent("awake", "arts"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function AwakePage() {
	return (
		<Suspense>
			<AwakeContent />
		</Suspense>
	);
}
