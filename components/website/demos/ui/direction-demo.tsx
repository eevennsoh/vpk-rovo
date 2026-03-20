"use client";

import { DirectionProvider, useDirection } from "@/components/ui/direction";

function DirectionDisplay() {
	const direction = useDirection();

	return (
		<div className="flex flex-col gap-2 rounded-lg border p-4">
			<p className="text-sm font-medium">
				Direction: {direction === "ltr" ? "Left-to-Right" : "Right-to-Left"}
			</p>
			<p className="text-sm text-muted-foreground">
				Current direction is set to <code>{direction}</code>.
			</p>
		</div>
	);
}

export default function DirectionDemo() {
	return (
		<DirectionProvider direction="ltr">
			<DirectionDisplay />
		</DirectionProvider>
	);
}

export function DirectionDemoDefault() {
	return (
		<DirectionProvider direction="ltr">
			<div className="flex flex-col gap-2 rounded-lg border p-4">
				<p className="text-sm font-medium">Left-to-Right</p>
				<p className="text-sm text-muted-foreground">Content flows from left to right.</p>
			</div>
		</DirectionProvider>
	);
}

export function DirectionDemoRtl() {
	return (
		<DirectionProvider direction="rtl">
			<div className="flex flex-col gap-2 rounded-lg border p-4" dir="rtl">
				<p className="text-sm font-medium">Right-to-Left</p>
				<p className="text-sm text-muted-foreground">Content flows from right to left.</p>
			</div>
		</DirectionProvider>
	);
}
