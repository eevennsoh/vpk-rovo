"use client";

import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

const DEFAULT_SCALE = 20;
const DEFAULT_FREQUENCY_X = 0.012;
const DEFAULT_FREQUENCY_Y = 0.035;
const DEFAULT_NUM_OCTAVES = 3;
const DEFAULT_SEED = 4;
const DEFAULT_ANIMATION_DURATION = 5;

export type MeltAnimation = Readonly<{
	enabled?: boolean;
	duration?: number;
	scaleFrom?: number;
	scaleTo?: number;
	frequencyXFrom?: number;
	frequencyXTo?: number;
	frequencyYFrom?: number;
	frequencyYTo?: number;
}>;

export type MeltProps = Readonly<{
	children: ReactNode;
	scale?: number;
	frequencyX?: number;
	frequencyY?: number;
	numOctaves?: number;
	seed?: number;
	animation?: MeltAnimation;
	filterId?: string;
	className?: string;
	style?: CSSProperties;
}>;

type MeltFilterProps = Readonly<{
	id: string;
	scale: number;
	frequencyX: number;
	frequencyY: number;
	numOctaves: number;
	seed: number;
	animation?: MeltAnimation;
}>;

function formatFrequencyPair(frequencyX: number, frequencyY: number): string {
	return `${frequencyX} ${frequencyY}`;
}

function useMeltFilterId(filterId?: string): string {
	const reactId = useId();
	return filterId ?? `melt-${reactId.replace(/:/g, "")}`;
}

export function MeltFilter({
	id,
	scale,
	frequencyX,
	frequencyY,
	numOctaves,
	seed,
	animation,
}: MeltFilterProps) {
	const reduceMotion = useReducedMotion();
	const animationEnabled = Boolean(animation?.enabled) && !reduceMotion;
	const duration = animation?.duration ?? DEFAULT_ANIMATION_DURATION;
	const scaleFrom = animation?.scaleFrom ?? scale;
	const scaleTo = animation?.scaleTo ?? scale;
	const frequencyXFrom = animation?.frequencyXFrom ?? frequencyX;
	const frequencyXTo = animation?.frequencyXTo ?? frequencyX;
	const frequencyYFrom = animation?.frequencyYFrom ?? frequencyY;
	const frequencyYTo = animation?.frequencyYTo ?? frequencyY;

	return (
		<svg
			aria-hidden="true"
			focusable="false"
			className="pointer-events-none absolute h-0 w-0"
		>
			<defs>
				<filter
					id={id}
					x="-150%"
					y="-150%"
					width="400%"
					height="400%"
					colorInterpolationFilters="sRGB"
				>
					<feTurbulence
						type="fractalNoise"
						baseFrequency={formatFrequencyPair(
							animationEnabled ? frequencyXFrom : frequencyX,
							animationEnabled ? frequencyYFrom : frequencyY,
						)}
						numOctaves={numOctaves}
						seed={seed}
						result="noise"
					>
						{animationEnabled ? (
							<animate
								attributeName="baseFrequency"
								values={[
									formatFrequencyPair(frequencyXFrom, frequencyYFrom),
									formatFrequencyPair(frequencyXTo, frequencyYTo),
									formatFrequencyPair(frequencyXFrom, frequencyYFrom),
								].join(";")}
								dur={`${duration}s`}
								repeatCount="indefinite"
							/>
						) : null}
					</feTurbulence>
					<feDisplacementMap
						in="SourceGraphic"
						in2="noise"
						scale={animationEnabled ? scaleFrom : scale}
						xChannelSelector="R"
						yChannelSelector="G"
					>
						{animationEnabled ? (
							<animate
								attributeName="scale"
								values={`${scaleFrom};${scaleTo};${scaleFrom}`}
								dur={`${duration}s`}
								repeatCount="indefinite"
							/>
						) : null}
					</feDisplacementMap>
				</filter>
			</defs>
		</svg>
	);
}

export default function Melt({
	children,
	scale = DEFAULT_SCALE,
	frequencyX = DEFAULT_FREQUENCY_X,
	frequencyY = DEFAULT_FREQUENCY_Y,
	numOctaves = DEFAULT_NUM_OCTAVES,
	seed = DEFAULT_SEED,
	animation,
	filterId,
	className,
	style,
}: MeltProps) {
	const resolvedFilterId = useMeltFilterId(filterId);

	return (
		<>
			<MeltFilter
				id={resolvedFilterId}
				scale={scale}
				frequencyX={frequencyX}
				frequencyY={frequencyY}
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
