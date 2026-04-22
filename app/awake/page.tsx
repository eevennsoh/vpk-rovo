"use client";

import { Suspense, createElement, use } from "react";
import { loadDemoComponent } from "@/components/website/demo-registry-loader";

function WeatherContent() {
	const Demo = use(loadDemoComponent("weather", "arts"));
	if (!Demo) return null;
	return createElement(Demo);
}

export default function WeatherPage() {
	return (
		<Suspense>
			<WeatherContent />
		</Suspense>
	);
}
