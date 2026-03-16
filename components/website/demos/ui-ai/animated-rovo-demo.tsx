"use client";

import { useMemo, useState } from "react";

import { AnimatedRovo, type AnimatedRovoShapeTransition } from "@/components/ui-ai/animated-rovo";
import { GUI } from "@/components/utils/gui";

const EASE_OPTIONS = [
	{ value: "linear" as const, label: "linear" },
	{ value: "easeInOut" as const, label: "easeInOut" },
	{ value: "circIn" as const, label: "circIn" },
	{ value: "circOut" as const, label: "circOut" },
] as const;

const TYPE_OPTIONS = [
	{ value: "tween" as const, label: "tween" },
	{ value: "spring" as const, label: "spring" },
] as const;

export default function AnimatedRovoDemo() {
	const [size, setSize] = useState(64);
	const [streaming, setStreaming] = useState(false);
	const [fullSpinProbability, setFullSpinProbability] = useState(0.35);
	const [danceDistancePercent, setDanceDistancePercent] = useState(8);
	const [type, setType] = useState<"spring" | "tween">("tween");
	const [duration, setDuration] = useState(2);
	const [ease, setEase] = useState<"linear" | "easeInOut" | "circIn" | "circOut">("linear");
	const [bounce, setBounce] = useState(0.3);

	const transition = useMemo<AnimatedRovoShapeTransition>(
		() =>
			type === "spring"
				? { type, duration, bounce }
				: { type, duration, ease },
		[type, duration, ease, bounce],
	);

	const config = useMemo(
		() => ({
			size,
			streaming,
			...(streaming ? {} : { fullSpinProbability, danceDistancePercent }),
			transition,
		}),
		[size, streaming, fullSpinProbability, danceDistancePercent, transition],
	);

	return (
		<div className="grid h-full w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
			<div className="flex h-full min-h-[350px] w-full items-center justify-center rounded-lg bg-surface p-12">
				<AnimatedRovo.Root
					size={size}
					streaming={streaming}
					fullSpinProbability={fullSpinProbability}
					danceDistancePercent={danceDistancePercent}
					transition={transition}
				/>
			</div>
			<GUI.Panel title="Animated Rovo controls" values={config}>
				<GUI.Control
					id="rovo-size"
					label="Size"
					description="Width and height of the logo in pixels."
					value={size}
					defaultValue={64}
					min={16}
					max={192}
					step={1}
					unit="px"
					onChange={setSize}
				/>
				<GUI.Toggle
					id="rovo-streaming"
					label="Streaming"
					description="Settles outer pendulum animations while inner wheel keeps rotating."
					checked={streaming}
					onChange={setStreaming}
				/>
				{!streaming ? (
					<>
						<GUI.Control
							id="rovo-full-spin-probability"
							label="Full spin probability"
							description="Chance that the next sporadic spin is a full 360-degree rotation."
							value={fullSpinProbability}
							defaultValue={0.35}
							min={0}
							max={1}
							step={0.01}
							onChange={setFullSpinProbability}
						/>
						<GUI.Control
							id="rovo-dance-distance-percent"
							label="Dance distance"
							description="How far the logo dances vertically from its origin as a percentage of size."
							value={danceDistancePercent}
							defaultValue={8}
							min={0}
							max={100}
							step={1}
							unit="%"
							onChange={setDanceDistancePercent}
						/>
					</>
				) : null}
				<GUI.Select
					id="rovo-type"
					label="Transition type"
					description="Animation interpolation method for the inner color wheel."
					value={type}
					options={TYPE_OPTIONS}
					onChange={setType}
				/>
				<GUI.Control
					id="rovo-duration"
					label="Duration"
					description="Visual duration per 360-degree rotation in seconds."
					value={duration}
					defaultValue={2}
					min={0.3}
					max={6}
					step={0.1}
					unit="s"
					onChange={setDuration}
				/>
				{type === "tween" ? (
					<GUI.Select
						id="rovo-ease"
						label="Ease"
						description="Easing function applied to each rotation step."
						value={ease}
						options={EASE_OPTIONS}
						onChange={setEase}
					/>
				) : (
					<GUI.Control
						id="rovo-bounce"
						label="Bounce"
						description="Spring bounce factor (0 = no bounce, 1 = max bounce)."
						value={bounce}
						defaultValue={0.3}
						min={0}
						max={1}
						step={0.01}
						onChange={setBounce}
					/>
				)}
			</GUI.Panel>
		</div>
	);
}
