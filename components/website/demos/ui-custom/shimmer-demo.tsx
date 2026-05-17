"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Shimmer } from "@/components/ui-custom/shimmer";
import { GUI } from "@/components/utils/gui";

function ShimmerDemoWavePreview() {
	const [key, setKey] = useState(0);
	const [duration, setDuration] = useState(1.4);
	const [spread, setSpread] = useState(2);
	const [xDistance, setXDistance] = useState(3);
	const [yDistance, setYDistance] = useState(-2);
	const [zDistance, setZDistance] = useState(12);
	const [scaleDistance, setScaleDistance] = useState(1.12);
	const [rotateYDistance, setRotateYDistance] = useState(14);
	const [repeatDelay, setRepeatDelay] = useState(0.1);
	const hasHydratedRef = useRef(false);

	const waveConfig = useMemo(
		() => ({
			duration,
			spread,
			xDistance,
			yDistance,
			zDistance,
			scaleDistance,
			rotateYDistance,
			transition: { ease: "easeInOut", repeatDelay },
		}),
		[
			duration,
			spread,
			xDistance,
			yDistance,
			zDistance,
			scaleDistance,
			rotateYDistance,
			repeatDelay,
		]
	);

	const handleRetry = useCallback(() => {
		setKey((prev) => prev + 1);
	}, []);

	useEffect(() => {
		if (!hasHydratedRef.current) {
			hasHydratedRef.current = true;
			return;
		}

		const timeoutId = window.setTimeout(() => {
			handleRetry();
		}, 75);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [waveConfig, handleRetry]);

	return (
		<div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
			<div className="flex w-full items-center py-10">
				<Shimmer
					key={key}
					baseColor="var(--color-muted-foreground)"
					baseGradientColor={["#1868db", "#bf63f3", "#fca700"]}
					duration={duration}
					rotateYDistance={rotateYDistance}
					scaleDistance={scaleDistance}
					spread={spread}
					transition={{ ease: "easeInOut", repeatDelay }}
					wave
					xDistance={xDistance}
					yDistance={yDistance}
					zDistance={zDistance}
					className="text-sm"
				>
					Wave shimmer
				</Shimmer>
			</div>
			<GUI.Panel title="Gradient shimmer" values={waveConfig}>
				<GUI.Control
					id="wave-duration"
					label="Duration"
					description="How long one full shimmer-wave cycle takes."
					value={duration}
					defaultValue={1.4}
					min={0.4}
					max={3}
					step={0.05}
					unit="s"
					onChange={setDuration}
				/>
				<GUI.Control
					id="wave-spread"
					label="Spread"
					description="How staggered the characters are across the wave."
					value={spread}
					defaultValue={2}
					min={0.5}
					max={4}
					step={0.1}
					onChange={setSpread}
				/>
				<GUI.Control
					id="wave-x-distance"
					label="X distance"
					description="How far each character moves left/right."
					value={xDistance}
					defaultValue={3}
					min={-6}
					max={6}
					step={0.1}
					unit="px"
					onChange={setXDistance}
				/>
				<GUI.Control
					id="wave-y-distance"
					label="Y distance"
					description="How far each character moves up/down."
					value={yDistance}
					defaultValue={-2}
					min={-6}
					max={6}
					step={0.1}
					unit="px"
					onChange={setYDistance}
				/>
				<GUI.Control
					id="wave-z-distance"
					label="Z distance"
					description="How much depth push/pull is applied toward the viewer."
					value={zDistance}
					defaultValue={12}
					min={-30}
					max={30}
					step={0.5}
					unit="px"
					onChange={setZDistance}
				/>
				<GUI.Control
					id="wave-scale-distance"
					label="Scale distance"
					description="How much each character grows at the wave peak."
					value={scaleDistance}
					defaultValue={1.12}
					min={0.5}
					max={2}
					step={0.01}
					unit="x"
					onChange={setScaleDistance}
				/>
				<GUI.Control
					id="wave-rotate-y-distance"
					label="Rotate Y distance"
					description="How much each character tilts around the vertical axis."
					value={rotateYDistance}
					defaultValue={14}
					min={-30}
					max={30}
					step={0.5}
					unit="deg"
					onChange={setRotateYDistance}
				/>
				<GUI.Control
					id="wave-repeat-delay"
					label="Repeat delay"
					description="Pause time before the next wave cycle starts."
					value={repeatDelay}
					defaultValue={0.1}
					min={0}
					max={2}
					step={0.01}
					unit="s"
					onChange={setRepeatDelay}
				/>
			</GUI.Panel>
		</div>
	);
}

function ShimmerDemoBasicPreview() {
	const [key, setKey] = useState(0);
	const [duration, setDuration] = useState(2);
	const [spread, setSpread] = useState(2);
	const hasHydratedRef = useRef(false);

	const shimmerConfig = useMemo(
		() => ({ duration, spread }),
		[duration, spread]
	);

	const handleRetry = useCallback(() => {
		setKey((prev) => prev + 1);
	}, []);

	useEffect(() => {
		if (!hasHydratedRef.current) {
			hasHydratedRef.current = true;
			return;
		}

		const timeoutId = window.setTimeout(() => {
			handleRetry();
		}, 75);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [shimmerConfig, handleRetry]);

	return (
		<div className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
			<div className="flex w-full items-center py-10">
				<Shimmer
					key={key}
					duration={duration}
					spread={spread}
					className="text-sm"
				>
					Thinking
				</Shimmer>
			</div>
			<GUI.Panel title="Neutral shimmer" values={shimmerConfig}>
				<GUI.Control
					id="shimmer-duration"
					label="Duration"
					description="How long one full shimmer sweep takes."
					value={duration}
					defaultValue={2}
					min={0.5}
					max={6}
					step={0.1}
					unit="s"
					onChange={setDuration}
				/>
				<GUI.Control
					id="shimmer-spread"
					label="Spread"
					description="Width of the highlight band across the text."
					value={spread}
					defaultValue={2}
					min={0.1}
					max={10}
					step={0.1}
					onChange={setSpread}
				/>
			</GUI.Panel>
		</div>
	);
}

export default function ShimmerDemo() {
	return (
		<div className="flex w-full flex-col gap-8">
			<ShimmerDemoWavePreview />
			<ShimmerDemoBasicPreview />
		</div>
	);
}

export function ShimmerDemoCustomDuration() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer duration={1} className="text-sm">Fast shimmer (1s)</Shimmer>
			<Shimmer duration={3} className="text-sm">Slow shimmer (3s)</Shimmer>
			<Shimmer duration={5} className="text-sm">Very slow shimmer (5s)</Shimmer>
		</div>
	);
}

export function ShimmerDemoCustomSpread() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer spread={1} className="text-sm">Narrow spread</Shimmer>
			<Shimmer spread={4} className="text-sm">Wide spread</Shimmer>
			<Shimmer spread={8} className="text-sm">Extra wide spread</Shimmer>
		</div>
	);
}

export function ShimmerDemoWave() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer wave className="text-sm">Wave shimmer enabled</Shimmer>
			<Shimmer wave duration={1.2} className="text-sm">Faster wave shimmer</Shimmer>
		</div>
	);
}

export function ShimmerDemoWaveColors() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer wave className="text-sm">
				Neutral wave shimmer
			</Shimmer>
			<Shimmer
				baseColor="var(--color-muted-foreground)"
				baseGradientColor={["#1868db", "#bf63f3", "#fca700"]}
				wave
				className="text-sm"
			>
				Dot-inspired gradient highlight
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoWaveGeometry() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer wave xDistance={1} yDistance={-1} className="text-sm">
				Subtle geometry
			</Shimmer>
			<Shimmer wave xDistance={4} yDistance={-3} className="text-sm">
				Expressive geometry
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoWaveDepth() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer wave zDistance={6} scaleDistance={1.04} rotateYDistance={6} className="text-sm">
				Soft depth
			</Shimmer>
			<Shimmer wave zDistance={16} scaleDistance={1.16} rotateYDistance={16} className="text-sm">
				Strong depth
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoWaveTimingSpread() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer wave duration={0.9} spread={1} className="text-sm">
				Tight and fast
			</Shimmer>
			<Shimmer wave duration={1.8} spread={3} className="text-sm">
				Wide and relaxed
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoWaveFullConfig() {
	return (
		<Shimmer
			baseColor="var(--color-muted-foreground)"
			baseGradientColor={["#1868db", "#bf63f3", "#fca700"]}
			duration={1.4}
			rotateYDistance={14}
			scaleDistance={1.12}
			spread={2}
			transition={{ ease: "easeInOut", repeatDelay: 0.1 }}
			wave
			xDistance={3}
			yDistance={-2}
			zDistance={12}
			className="text-sm"
		>
			Full wave configuration
		</Shimmer>
	);
}

export function ShimmerDemoHeading() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer as="h2" className="text-2xl font-bold">Generating response</Shimmer>
			<Shimmer as="span" className="text-xs text-muted-foreground">Processing your request...</Shimmer>
		</div>
	);
}
