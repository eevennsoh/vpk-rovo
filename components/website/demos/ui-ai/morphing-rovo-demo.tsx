"use client";

import { useMemo, useState } from "react";

import { MorphingRovo } from "@/components/ui-ai/morphing-rovo";
import { GUI } from "@/components/utils/gui";

const EASE_OPTIONS = [
	{ value: "backOut" as const, label: "backOut (default)" },
	{ value: "easeInOut" as const, label: "easeInOut" },
	{ value: "circOut" as const, label: "circOut" },
	{ value: "linear" as const, label: "linear" },
] as const;

export default function MorphingRovoDemo() {
	const [size, setSize] = useState(64);
	const [duration, setDuration] = useState(0.6);
	const [ease, setEase] = useState<string>("backOut");
	const [blur, setBlur] = useState(2);

	const config = useMemo(
		() => ({
			size,
			duration,
			ease,
			blur,
		}),
		[size, duration, ease, blur],
	);

	return (
		<div className="grid h-full w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
			<div className="flex h-full min-h-[350px] w-full items-center justify-center rounded-lg bg-surface p-12">
				<MorphingRovo.Shape size={size} duration={duration} ease={ease} blur={blur} />
			</div>
			<GUI.Panel title="Morphing Rovo controls" values={config}>
				<GUI.Control
					id="morphing-size"
					label="Size"
					description="Width and height of the shape in pixels."
					value={size}
					defaultValue={64}
					min={16}
					max={192}
					step={1}
					unit="px"
					onChange={setSize}
				/>
				<GUI.Control
					id="morphing-duration"
					label="Duration"
					description="Duration of each morph step in seconds."
					value={duration}
					defaultValue={0.6}
					min={0.2}
					max={2}
					step={0.1}
					unit="s"
					onChange={setDuration}
				/>
				<GUI.Select
					id="morphing-ease"
					label="Ease"
					description="Easing function for each morph transition."
					value={ease}
					options={EASE_OPTIONS}
					onChange={setEase}
				/>
				<GUI.Control
					id="morphing-blur"
					label="Blur"
					description="Max blur radius at transition midpoints. 0 disables."
					value={blur}
					defaultValue={2}
					min={0}
					max={8}
					step={0.5}
					unit="px"
					onChange={setBlur}
				/>
			</GUI.Panel>
		</div>
	);
}
