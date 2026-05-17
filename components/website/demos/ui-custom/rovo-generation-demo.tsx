"use client";

import { useCallback, useMemo, useState } from "react";

import { RovoGeneration } from "@/components/ui-custom/rovo-generation";
import { buttonVariants } from "@/components/ui/button";
import { GUI } from "@/components/utils/gui";
import { cn } from "@/lib/utils";

function RovoGenerationExampleStage({
	glow = false,
	border = false,
	animated = true,
}: Readonly<{
	glow?: boolean;
	border?: boolean;
	animated?: boolean;
}>) {
	return (
		<div className="flex min-h-[180px] w-full items-center justify-center rounded-lg bg-surface p-10">
			<RovoGeneration.Root
				animated={animated}
				border={border}
				generating={glow || border}
				glow={glow}
			/>
		</div>
	);
}

export default function RovoGenerationDemo() {
	const [glow, setGlow] = useState(true);
	const [border, setBorder] = useState(true);
	const [animated, setAnimated] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [generationRunId, setGenerationRunId] = useState(0);
	const [size, setSize] = useState(100);
	const [duration, setDuration] = useState(4);
	const [borderWidth, setBorderWidth] = useState(1);
	const [glowBlur, setGlowBlur] = useState(16);
	const [glowOpacity, setGlowOpacity] = useState(0.35);

	const config = useMemo(
		() => ({
			glow,
			border,
			animated,
			generating,
			size,
			duration,
			borderWidth,
			glowBlur,
			glowOpacity,
		}),
		[glow, border, animated, generating, size, duration, borderWidth, glowBlur, glowOpacity],
	);

	const handleRunGeneration = useCallback(() => {
		setGenerationRunId((currentRunId) => currentRunId + 1);
		setGenerating(true);
	}, []);

	const handleGenerationComplete = useCallback(() => {
		setGenerating(false);
	}, []);

	return (
		<div className="grid h-full w-full gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-stretch">
			<div className="flex h-full min-h-[390px] w-full flex-col items-center justify-center gap-8 rounded-lg bg-surface p-8">
				<RovoGeneration.Root
					animated={animated}
					border={border}
					borderWidth={borderWidth}
					data-rovo-generation-demo-main="true"
					duration={duration}
					generating={generating}
					glow={glow}
					glowBlur={glowBlur}
					glowOpacity={glowOpacity}
					key={generationRunId}
					onGenerationComplete={handleGenerationComplete}
					size={size}
				/>
				<div className="grid grid-cols-2 gap-5">
					<RovoGeneration.Root animated={false} duration={duration} size={64} />
					<RovoGeneration.Root animated={false} duration={duration} glow size={64} />
					<RovoGeneration.Root animated={false} border duration={duration} size={64} />
					<RovoGeneration.Root animated={false} border duration={duration} glow size={64} />
				</div>
			</div>
			<GUI.Panel title="Rovo Generation controls" values={config}>
				<div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-3">
					<div className="min-w-0">
						<p className="text-xs font-medium text-text">
							{generating ? "Generating" : "Default state"}
						</p>
						<p className="mt-1 text-[12px] leading-4 text-text-subtlest">
							{generating ? "Returns after the selected duration." : "Run selected effects."}
						</p>
					</div>
					<button
						type="button"
						className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
						onClick={handleRunGeneration}
					>
						{generating ? "Restart" : "Run"}
					</button>
				</div>
				<GUI.Toggle
					id="rovo-generation-glow"
					label="Rainbow glow"
					description="Adds the blurred conic glow while generating."
					checked={glow}
					onChange={setGlow}
				/>
				<GUI.Toggle
					id="rovo-generation-border"
					label="Rainbow border"
					description="Adds the conic stroke while generating."
					checked={border}
					onChange={setBorder}
				/>
				<GUI.Toggle
					id="rovo-generation-animated"
					label="Animate"
					description="Applies a linear Motion curve while generating."
					checked={animated}
					onChange={setAnimated}
				/>
				<GUI.Control
					id="rovo-generation-size"
					label="Size"
					description="Width and height of the main tile."
					value={size}
					defaultValue={100}
					min={56}
					max={180}
					step={1}
					unit="px"
					onChange={setSize}
				/>
				<GUI.Control
					id="rovo-generation-duration"
					label="Duration"
					description="Seconds before the generated state returns to default."
					value={duration}
					defaultValue={4}
					min={1}
					max={12}
					step={0.1}
					unit="s"
					onChange={setDuration}
				/>
				<GUI.Control
					id="rovo-generation-border-width"
					label="Border width"
					description="Thickness of the rainbow stroke."
					value={borderWidth}
					defaultValue={1}
					min={1}
					max={6}
					step={0.5}
					unit="px"
					onChange={setBorderWidth}
				/>
				<GUI.Control
					id="rovo-generation-glow-blur"
					label="Glow blur"
					description="Blur radius for the rainbow glow."
					value={glowBlur}
					defaultValue={16}
					min={0}
					max={40}
					step={1}
					unit="px"
					onChange={setGlowBlur}
				/>
				<GUI.Control
					id="rovo-generation-glow-opacity"
					label="Glow opacity"
					description="Opacity of the blurred glow layer."
					value={glowOpacity}
					defaultValue={0.35}
					min={0}
					max={1}
					step={0.05}
					onChange={setGlowOpacity}
				/>
			</GUI.Panel>
		</div>
	);
}

export function RovoGenerationDemoDefault() {
	return <RovoGenerationExampleStage />;
}

export function RovoGenerationDemoRainbowGlow() {
	return <RovoGenerationExampleStage glow />;
}

export function RovoGenerationDemoRainbowBorder() {
	return <RovoGenerationExampleStage border />;
}

export function RovoGenerationDemoRainbowGlowAndBorder() {
	return <RovoGenerationExampleStage border glow />;
}
