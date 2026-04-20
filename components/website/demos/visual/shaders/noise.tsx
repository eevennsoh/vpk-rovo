"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

export type NoiseBlendMode =
	| "multiply"
	| "overlay"
	| "soft-light"
	| "screen";

export interface NoiseProps {
	className?: string;
	opacity?: number;
	grainSize?: number;
	borderRadius?: number | string;
	seed?: number;
	color?: string;
	blendMode?: NoiseBlendMode;
	style?: CSSProperties;
}

function buildNoiseDataUri(seed: number, color: string) {
	const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" preserveAspectRatio="none">
	<filter id="noise" x="0%" y="0%" width="100%" height="100%">
		<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" seed="${seed}" stitchTiles="stitch" result="field"/>
		<feColorMatrix in="field" type="saturate" values="0" result="mono"/>
		<feComponentTransfer in="mono" result="contrast">
			<feFuncR type="gamma" amplitude="1.35" exponent="1.45" offset="0"/>
			<feFuncG type="gamma" amplitude="1.35" exponent="1.45" offset="0"/>
			<feFuncB type="gamma" amplitude="1.35" exponent="1.45" offset="0"/>
		</feComponentTransfer>
	</filter>
	<mask id="mask">
		<rect width="128" height="128" filter="url(#noise)"/>
	</mask>
	<rect width="128" height="128" fill="${color}" mask="url(#mask)"/>
</svg>`;

	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export default function Noise({
	className,
	opacity = 0.18,
	grainSize = 140,
	borderRadius = "inherit",
	seed = 7,
	color = "#101214",
	blendMode = "multiply",
	style,
}: NoiseProps) {
	const backgroundImage = useMemo(
		() => buildNoiseDataUri(seed, color),
		[color, seed],
	);

	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none block", className)}
			style={{
				opacity,
				borderRadius,
				mixBlendMode: blendMode,
				backgroundImage,
				backgroundRepeat: "repeat",
				backgroundPosition: "0 0",
				backgroundSize: `${grainSize}px ${grainSize}px`,
				...style,
			}}
		/>
	);
}
