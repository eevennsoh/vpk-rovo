"use client";

import { memo, useEffect } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Rovo brand colors cycling in a conic gradient
// ---------------------------------------------------------------------------

const ROVO_CONIC_GRADIENT = `conic-gradient(
	from var(--rovo-border-angle, 0deg),
	#1868DB 0deg, #1868DB 90deg,
	#FCA700 90deg, #FCA700 180deg,
	#AF59E1 180deg, #AF59E1 270deg,
	#6A9A23 270deg, #6A9A23 360deg
)`;

function buildTraceGradient(arcWidth: number, colors: [string, string]): string {
	const fade = 12;
	const solidStart = 360 - arcWidth;
	const midpoint = solidStart + arcWidth / 2;

	return `conic-gradient(
		from var(--rovo-border-angle, 0deg),
		transparent 0deg ${solidStart}deg,
		${colors[0]} ${solidStart + fade}deg,
		${colors[0]} ${midpoint}deg,
		${colors[1]} ${midpoint}deg,
		${colors[1]} ${360 - fade}deg,
		transparent 360deg
	)`;
}

const SHIMMER_KEYFRAMES = `
@keyframes rovo-border-spin {
	from { transform: rotate(0deg); }
	to   { transform: rotate(360deg); }
}
@keyframes rovo-border-spin-offset {
	from { transform: rotate(180deg); }
	to   { transform: rotate(540deg); }
}
@keyframes rovo-border-fade {
	0%   { opacity: 0; }
	12%  { opacity: 1; }
	72%  { opacity: 1; }
	100% { opacity: 0; }
}
@keyframes rovo-trace-fade {
	0%   { opacity: 0; }
	5%   { opacity: 1; }
	90%  { opacity: 1; }
	100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
	@keyframes rovo-border-spin {
		from { transform: rotate(0deg); }
		to   { transform: rotate(0deg); }
	}
}
`;

let shimmerStyleRefCount = 0;
let shimmerStyleElement: HTMLStyleElement | null = null;

export interface GenerativeCardShimmerBorderProps {
	/** Visual style: "shimmer" fills the border uniformly, "trace" shows a concentrated arc comet. */
	variant?: "shimmer" | "trace";
	/** Trace only — angular width of the visible arc in degrees. @default 90 */
	arcWidth?: number;
	duration?: number;
	borderRadius?: number;
	borderWidth?: number;
	className?: string;
}

export const GenerativeCardShimmerBorder = memo(
	function GenerativeCardShimmerBorder({
		variant = "shimmer",
		arcWidth = 90,
		duration = variant === "trace" ? 4000 : 1750,
		borderRadius = 12,
		borderWidth = 2,
		className,
	}: Readonly<GenerativeCardShimmerBorderProps>) {
		useEffect(() => {
			shimmerStyleRefCount++;
			if (shimmerStyleRefCount === 1) {
				const el = document.createElement("style");
				el.textContent = SHIMMER_KEYFRAMES;
				document.head.appendChild(el);
				shimmerStyleElement = el;
			}
			return () => {
				shimmerStyleRefCount--;
				if (shimmerStyleRefCount === 0 && shimmerStyleElement) {
					document.head.removeChild(shimmerStyleElement);
					shimmerStyleElement = null;
				}
			};
		}, []);

		const isTrace = variant === "trace";
		const durationSec = duration / 1000;
		const spinDuration = isTrace ? durationSec : durationSec * 0.45;
		const gradient = isTrace ? buildTraceGradient(arcWidth, ["#AF59E1", "#1868DB"]) : ROVO_CONIC_GRADIENT;
		const gradient2 = isTrace ? buildTraceGradient(arcWidth, ["#6A9A23", "#FCA700"]) : gradient;

		const fadeAnimation = isTrace
			? `rovo-trace-fade ${spinDuration}s var(--ease-out, ease-out) forwards`
			: `rovo-border-fade ${durationSec}s var(--ease-out, ease-out) forwards`;
		const primarySpinAnimation = isTrace
			? `rovo-border-spin ${spinDuration}s linear 1 forwards`
			: `rovo-border-spin ${spinDuration}s linear infinite`;
		const secondarySpinAnimation = isTrace
			? `rovo-border-spin-offset ${spinDuration}s linear 1 forwards`
			: `rovo-border-spin ${spinDuration}s linear ${-spinDuration / 2}s infinite`;

		const maskStyles: React.CSSProperties = {
			WebkitMask:
				"linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
			mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
			WebkitMaskComposite: "xor",
			maskComposite: "exclude",
		};

		return (
			<>
				{/* Second ring — offset by half a rotation for a chasing pair.
				    For shimmer this acts as a diffused glow halo behind the card. */}
				<div
					aria-hidden="true"
					className={cn("pointer-events-none absolute", className)}
					style={{
						inset: isTrace ? -borderWidth : -4,
						borderRadius: isTrace ? borderRadius + borderWidth : borderRadius + 4,
						overflow: "hidden",
						padding: isTrace ? borderWidth : undefined,
						zIndex: isTrace ? 1 : -1,
						animation: fadeAnimation,
						...(isTrace ? maskStyles : undefined),
					}}
				>
					<div
						style={{
							position: "absolute",
							inset: "-50%",
							background: gradient2,
							filter: isTrace ? undefined : "blur(6px)",
							animation: secondarySpinAnimation,
						}}
					/>
				</div>
				{/* Primary border ring — mask-composite excludes the content-box,
				    leaving only the borderWidth-px padding strip visible. */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute"
					style={{
						inset: -borderWidth,
						borderRadius: borderRadius + borderWidth,
						overflow: "hidden",
						padding: borderWidth,
						zIndex: 1,
						animation: fadeAnimation,
						...maskStyles,
					}}
				>
					<div
						style={{
							position: "absolute",
							inset: "-50%",
							background: gradient,
							animation: primarySpinAnimation,
						}}
					/>
				</div>
			</>
		);
	},
);
