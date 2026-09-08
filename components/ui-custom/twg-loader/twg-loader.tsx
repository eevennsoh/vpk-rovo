"use client";

// oxlint-disable react-doctor/no-initialize-state -- These components intentionally seed local interactive state from props once before user edits take ownership.

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

import { useEffect, useId, useRef, useState } from "react";

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
	const instanceId = useId().replaceAll(":", "");
	const holesMaskId = `twg-loader-holes-${instanceId}`;

	// Dot ring colors render as CSS variables with fallbacks so SSR and client
	// hydration see the same attribute strings while the browser resolves theme.
	const dotColors = getDotColors();
	const lineColor = getLineColor();

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
		<output
			data-slot="twg-loader"
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
				<defs>
					<mask
						id={holesMaskId}
						maskUnits="userSpaceOnUse"
						x="0"
						y="0"
						width={VIEWBOX_SIZE}
						height={VIEWBOX_SIZE}
					>
						<rect
							width={VIEWBOX_SIZE}
							height={VIEWBOX_SIZE}
							fill="white"
						/>
						{DOT_ORDER.map((i) => (
							<circle
								key={`mask-${i}`}
								data-type="mask"
								data-idx={i}
								cx={VIEWBOX_CENTER}
								cy={VIEWBOX_CENTER}
								r={DOT_RADIUS}
								fill="black"
							/>
						))}
					</mask>
				</defs>

				{/* Snake / connector lines. Masked so they stop at each ring. */}
				<g mask={`url(#${holesMaskId})`}>
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

				{/* Dot rings — stroke only, interiors stay transparent. */}
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
		</output>
	);
}

export default TWGLoader;
