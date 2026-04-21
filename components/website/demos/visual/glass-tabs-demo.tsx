"use client";

import * as React from "react";

import { GlassTabs } from "@/components/ui/glass-tabs";

const GLASS_TAB_OPTIONS = [
	{ value: "location", label: "Location" },
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

type GlassTabsDemoValue = (typeof GLASS_TAB_OPTIONS)[number]["value"];

export default function GlassTabsDemo() {
	const [value, setValue] = React.useState<GlassTabsDemoValue>("location");

	return (
		<div
			className="relative flex w-full items-center justify-center overflow-hidden px-6 py-10"
			style={{
				minHeight: 240,
			}}
		>
			<GlassTabs
				aria-label="Weather theme"
				options={GLASS_TAB_OPTIONS}
				value={value}
				onChange={setValue}
			/>
		</div>
	);
}
