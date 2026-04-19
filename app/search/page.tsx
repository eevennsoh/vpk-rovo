"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function SearchContent() {
	const Demo = use(loadDemoComponent("search", "projects"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function SearchPage() {
	return (
		<Suspense>
			<SearchContent />
		</Suspense>
	);
}
