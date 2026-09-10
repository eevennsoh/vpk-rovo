"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { GUI } from "@/components/utils/gui";

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

export function ShimmerDemoHeading() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer as="h2" className="text-2xl font-bold">Generating response</Shimmer>
			<Shimmer as="span" className="text-xs">Processing your request...</Shimmer>
		</div>
	);
}

export function ShimmerDemoColor() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer className="text-sm shimmer-color-blue-500/60">
				Generating response…
			</Shimmer>
			<Shimmer className="text-sm shimmer-color-[#378ADD]">
				Generating response…
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoDurationUtility() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer className="text-sm shimmer-duration-1000">
				Generating response…
			</Shimmer>
			<Shimmer className="text-sm shimmer-duration-3000">
				Generating response…
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoSpreadUtility() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer className="text-sm shimmer-spread-24">
				Generating response…
			</Shimmer>
			<Shimmer className="text-sm shimmer-spread-[5rem]">
				Generating response…
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoAngle() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer className="text-sm shimmer-angle-0">Generating response…</Shimmer>
			<Shimmer className="text-sm shimmer-angle-45">Generating response…</Shimmer>
		</div>
	);
}

export function ShimmerDemoOnce() {
	return (
		<Shimmer className="text-sm shimmer-duration-1100 shimmer-once">
			Response generated.
		</Shimmer>
	);
}

export function ShimmerDemoDisabled() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer className="text-sm shimmer-none">
				Shimmer disabled outright
			</Shimmer>
			<Shimmer className="text-sm md:shimmer-none">
				Shimmers on small screens, static from md up
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoRtl() {
	return (
		<div className="flex flex-col gap-3">
			<Shimmer as="span" dir="ltr" className="text-sm">
				Generating response…
			</Shimmer>
			<Shimmer as="span" dir="rtl" className="text-sm">
				جارٍ إنشاء الرد…
			</Shimmer>
		</div>
	);
}

export function ShimmerDemoMarker() {
	return (
		<div className="flex flex-col gap-3">
			<Marker role="status">
				<MarkerIcon>
					<Spinner />
				</MarkerIcon>
				<MarkerContent className="shimmer">Thinking…</MarkerContent>
			</Marker>
		</div>
	);
}
