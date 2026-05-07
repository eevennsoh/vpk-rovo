"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useId, useState } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export const SCRIBBLES_DEFAULT_SCALE = 16;
export const SCRIBBLES_DEFAULT_BASE_FREQUENCY = 0.02;
export const SCRIBBLES_DEFAULT_NUM_OCTAVES = 2;
export const SCRIBBLES_DEFAULT_SEED = 1;
export const SCRIBBLES_DEFAULT_INTERVAL_MS = 100;
export const SCRIBBLES_DEFAULT_AMOUNT = 0.5;
export const SCRIBBLES_DEFAULT_OFFSETS = [-0.02, 0.01, -0.01, 0.02] as const;

export interface ScribblesAnimation {
	enabled?: boolean;
	intervalMs?: number;
	amount?: number;
	offsets?: readonly number[];
}

export interface ScribblesProps {
	children: ReactNode;
	scale?: number;
	baseFrequency?: number;
	numOctaves?: number;
	seed?: number;
	animation?: ScribblesAnimation;
	filterId?: string;
	className?: string;
	style?: CSSProperties;
}

export interface ScribblesFilterProps {
	id: string;
	scale: number;
	baseFrequency: number;
	numOctaves: number;
	seed: number;
	animation?: ScribblesAnimation;
}

function useScribblesFilterId(filterId?: string): string {
	const reactId = useId();
	return filterId ?? `scribbles-${reactId.replace(/:/g, "")}`;
}

function clampFrequency(frequency: number): number {
	return Math.max(0.001, frequency);
}

function formatFrequency(frequency: number): string {
	return clampFrequency(frequency).toFixed(4);
}

export function ScribblesFilter({
	id,
	scale,
	baseFrequency,
	numOctaves,
	seed,
	animation,
}: ScribblesFilterProps) {
	const reduceMotion = useReducedMotion();
	const [frame, setFrame] = useState(0);
	const offsets = animation?.offsets ?? SCRIBBLES_DEFAULT_OFFSETS;
	const intervalMs = animation?.intervalMs ?? SCRIBBLES_DEFAULT_INTERVAL_MS;
	const amount = animation?.amount ?? SCRIBBLES_DEFAULT_AMOUNT;
	const animationEnabled = Boolean(animation?.enabled) && !reduceMotion && offsets.length > 0;

	useEffect(() => {
		if (!animationEnabled) {
			setFrame(0);
			return;
		}

		const intervalId = window.setInterval(() => {
			setFrame((currentFrame) => (currentFrame + 1) % offsets.length);
		}, intervalMs);

		return () => window.clearInterval(intervalId);
	}, [animationEnabled, intervalMs, offsets.length]);

	const activeOffset = animationEnabled ? offsets[frame % offsets.length] ?? 0 : 0;
	const resolvedBaseFrequency = baseFrequency + activeOffset * amount;

	return (
		<svg
			aria-hidden="true"
			focusable="false"
			className="pointer-events-none absolute h-0 w-0"
		>
			<defs>
				<filter
					id={id}
					x="-20%"
					y="-20%"
					width="140%"
					height="140%"
					colorInterpolationFilters="sRGB"
				>
					<feTurbulence
						type="turbulence"
						baseFrequency={formatFrequency(resolvedBaseFrequency)}
						numOctaves={numOctaves}
						seed={seed}
						result="scribble-noise"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="scribble-noise"
						scale={scale}
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
			</defs>
		</svg>
	);
}

export function Scribbles({
	children,
	scale = SCRIBBLES_DEFAULT_SCALE,
	baseFrequency = SCRIBBLES_DEFAULT_BASE_FREQUENCY,
	numOctaves = SCRIBBLES_DEFAULT_NUM_OCTAVES,
	seed = SCRIBBLES_DEFAULT_SEED,
	animation,
	filterId,
	className,
	style,
}: ScribblesProps) {
	const resolvedFilterId = useScribblesFilterId(filterId);

	return (
		<>
			<ScribblesFilter
				id={resolvedFilterId}
				scale={scale}
				baseFrequency={baseFrequency}
				numOctaves={numOctaves}
				seed={seed}
				animation={animation}
			/>
			<div
				className={cn("relative", className)}
				style={{
					...style,
					filter: `url(#${resolvedFilterId})`,
				}}
			>
				{children}
			</div>
		</>
	);
}

export default Scribbles;
