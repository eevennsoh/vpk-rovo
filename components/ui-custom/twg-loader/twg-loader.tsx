"use client";

/**
 * TWG Loader — Teamwork Graph branded loading indicator.
 *
 * A four-dot logo that bursts out from the center, then continuously draws a
 * multi-color "snake" between the dots, rotating between patterns. Mirrors the
 * public size API of `@atlaskit/spinner` so it can be a drop-in replacement at
 * existing call sites.
 *
 * Ported from the Atlassian Teamwork Graph microsite `LoadingSpinner`. The SVG
 * is rendered once and updated imperatively from a `requestAnimationFrame` loop
 * to avoid re-rendering React 60 times/sec.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
	computeFrame,
	computeStaticFrame,
	DOT_ORDER,
	DOT_RADIUS,
	DRAW_PATTERNS,
	type FrameState,
	getDotColors,
	getLineColor,
	getMaskColor,
	HIDDEN_DASH,
	LINE_WIDTH,
	type TWGLoaderSize,
	MAX_LINE_COUNT,
	NODE_STROKE_WIDTH,
	SIZE_PX,
	updateDots,
	updateLines,
	VIEWBOX_CENTER,
	VIEWBOX_SIZE,
} from "./utils";

export type { TWGLoaderSize } from "./utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** SSR-safe `prefers-reduced-motion: reduce` media query hook. */
function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const mql = window.matchMedia(REDUCED_MOTION_QUERY);
		const update = () => setReduced(mql.matches);
		update();
		mql.addEventListener("change", update);
		return () => mql.removeEventListener("change", update);
	}, []);

	return reduced;
}

export interface TWGLoaderProps {
	/**
	 * Visual size. Mirrors `@atlaskit/spinner`.
	 *
	 * @default 'medium'
	 */
	size?: TWGLoaderSize;
	/**
	 * Accessible label announced to assistive technology while the logo is
	 * spinning.
	 *
	 * @default 'Loading'
	 */
	label?: string;
	/** Additional classes applied to the wrapping element. */
	className?: string;
	/** Optional test id applied to the wrapping element. */
	testId?: string;
}

export function TWGLoader({
	size = "medium",
	label = "Loading",
	className,
	testId,
}: Readonly<TWGLoaderProps>) {
	const sizePx = SIZE_PX[size];
	const reducedMotion = usePrefersReducedMotion();

	// Tokens flip with the active theme; resolve once per render.
	const dotColors = useMemo(() => getDotColors(), []);
	const lineColor = useMemo(() => getLineColor(), []);
	const maskColor = useMemo(() => getMaskColor(), []);

	const svgRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		const svg = svgRef.current;
		if (!svg) return;

		const applyFrame = ({
			positions,
			drawFrac,
			retractFrac,
			patternIndex,
		}: FrameState) => {
			updateDots(svg, positions);
			updateLines(
				svg,
				positions,
				DRAW_PATTERNS[patternIndex],
				drawFrac,
				retractFrac,
			);
		};

		if (reducedMotion) {
			applyFrame(computeStaticFrame());
			return;
		}

		let rafId = 0;
		let startTime = 0;

		const tick = (timestamp: number) => {
			if (!startTime) startTime = timestamp;
			const elapsedSeconds = (timestamp - startTime) / 1000;
			applyFrame(computeFrame(elapsedSeconds));
			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(rafId);
		};
	}, [reducedMotion]);

	return (
		<div
			data-slot="twg-loader"
			role="status"
			aria-label={label}
			data-testid={testId}
			className={cn("inline-flex leading-[0]", className)}
		>
			<svg
				ref={svgRef}
				width={sizePx}
				height={sizePx}
				viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
				fill="none"
				aria-hidden="true"
				focusable="false"
			>
				{/* Snake / connector lines. One <path> per segment. */}
				<g>
					{Array.from({ length: MAX_LINE_COUNT }, (_, i) => (
						<path
							key={`line-${i}`}
							id={`line-${i}`}
							stroke={lineColor}
							strokeWidth={LINE_WIDTH}
							strokeLinecap="butt"
							fill="none"
							strokeDasharray={HIDDEN_DASH}
						/>
					))}
				</g>

				{/* Background masks — punch a hole under each dot. */}
				<g>
					{DOT_ORDER.map((i) => (
						<circle
							key={`mask-${i}`}
							data-type="mask"
							data-idx={i}
							cx={VIEWBOX_CENTER}
							cy={VIEWBOX_CENTER}
							r={DOT_RADIUS}
							fill={maskColor}
							stroke="none"
						/>
					))}
				</g>

				{/* Dot rings — drawn in brand color, on top of the masks. */}
				<g>
					{DOT_ORDER.map((i) => (
						<circle
							key={`dot-${i}`}
							data-type="dot"
							data-idx={i}
							cx={VIEWBOX_CENTER}
							cy={VIEWBOX_CENTER}
							r={DOT_RADIUS}
							fill="none"
							stroke={dotColors[i]}
							strokeWidth={NODE_STROKE_WIDTH}
						/>
					))}
				</g>
			</svg>
		</div>
	);
}

export default TWGLoader;
