"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, useMotionValue, useMotionValueEvent } from "motion/react";

import { cn } from "@/lib/utils";

import {
	DEFAULT_SVG_TRACE_CONFIG,
	SVG_TRACE_ROVO_COLORS,
	type SvgTraceConfig,
	type SvgTraceEasingId,
} from "./data";
import { clampColorStopCount, clampTraceLength, type SvgTraceShape } from "./lib";

type SvgTracingProps = Readonly<{
	shape: SvgTraceShape;
	config?: SvgTraceConfig;
	playing?: boolean;
	resetKey?: number;
	className?: string;
}>;

type TraceSegmentProps = Readonly<{
	d: string;
	color: string;
	index: number;
	colorStopCount: number;
	pathLengthPx: number;
	traceWindow: TraceWindow;
	segmentCap: SvgTraceConfig["segmentCap"];
	strokeWidth: number;
}>;

type TracePathProps = Readonly<{
	d: string;
	traceWindow: TraceWindow;
	segments: readonly {
		index: number;
		color: string;
	}[];
	showOutline: boolean;
	segmentCap: SvgTraceConfig["segmentCap"];
	strokeWidth: number;
}>;

type TraceWindow = Readonly<{
	start: number;
	end: number;
}>;

type SvgTraceEasing = "linear" | [number, number, number, number] | ((progress: number) => number);

const SVG_TRACE_EASINGS: Record<SvgTraceEasingId, SvgTraceEasing> = {
	linear: "linear",
	ease: [0.25, 0.1, 0.25, 1],
	"ease-in": [0.42, 0, 1, 1],
	"ease-out": [0, 0, 0.58, 1],
	"ease-in-out": [0.42, 0, 0.58, 1],
	custom: "linear",
	easeInSine: [0.12, 0, 0.39, 0],
	easeOutSine: [0.61, 1, 0.88, 1],
	easeInOutSine: [0.37, 0, 0.63, 1],
	easeInQuad: [0.11, 0, 0.5, 0],
	easeOutQuad: [0.5, 1, 0.89, 1],
	easeInOutQuad: [0.45, 0, 0.55, 1],
	easeInCubic: [0.32, 0, 0.67, 0],
	easeOutCubic: [0.33, 1, 0.68, 1],
	easeInOutCubic: [0.65, 0, 0.35, 1],
	easeInQuart: [0.5, 0, 0.75, 0],
	easeOutQuart: [0.25, 1, 0.5, 1],
	easeInOutQuart: [0.76, 0, 0.24, 1],
	easeInQuint: [0.64, 0, 0.78, 0],
	easeOutQuint: [0.22, 1, 0.36, 1],
	easeInOutQuint: [0.83, 0, 0.17, 1],
	easeInExpo: [0.7, 0, 0.84, 0],
	easeOutExpo: [0.16, 1, 0.3, 1],
	easeInOutExpo: [0.87, 0, 0.13, 1],
	easeInCirc: [0.55, 0, 1, 0.45],
	easeOutCirc: [0, 0.55, 0.45, 1],
	easeInOutCirc: [0.85, 0, 0.15, 1],
	easeInBack: [0.36, 0, 0.66, -0.56],
	easeOutBack: [0.34, 1.56, 0.64, 1],
	easeInOutBack: [0.68, -0.6, 0.32, 1.6],
	easeInElastic: easeInElastic,
	easeOutElastic: easeOutElastic,
	easeInOutElastic: easeInOutElastic,
	easeInBounce: easeInBounce,
	easeOutBounce: easeOutBounce,
	easeInOutBounce: easeInOutBounce,
};

function easeInElastic(progress: number) {
	const c4 = (2 * Math.PI) / 3;
	if (progress === 0 || progress === 1) return progress;
	return -Math.pow(2, 10 * progress - 10) * Math.sin((progress * 10 - 10.75) * c4);
}

function easeOutElastic(progress: number) {
	const c4 = (2 * Math.PI) / 3;
	if (progress === 0 || progress === 1) return progress;
	return Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
}

function easeInOutElastic(progress: number) {
	const c5 = (2 * Math.PI) / 4.5;
	if (progress === 0 || progress === 1) return progress;
	if (progress < 0.5) {
		return -(Math.pow(2, 20 * progress - 10) * Math.sin((20 * progress - 11.125) * c5)) / 2;
	}
	return (Math.pow(2, -20 * progress + 10) * Math.sin((20 * progress - 11.125) * c5)) / 2 + 1;
}

function easeOutBounce(progress: number) {
	const n1 = 7.5625;
	const d1 = 2.75;
	if (progress < 1 / d1) {
		return n1 * progress * progress;
	}
	if (progress < 2 / d1) {
		const shifted = progress - 1.5 / d1;
		return n1 * shifted * shifted + 0.75;
	}
	if (progress < 2.5 / d1) {
		const shifted = progress - 2.25 / d1;
		return n1 * shifted * shifted + 0.9375;
	}
	const shifted = progress - 2.625 / d1;
	return n1 * shifted * shifted + 0.984375;
}

function easeInBounce(progress: number) {
	return 1 - easeOutBounce(1 - progress);
}

function easeInOutBounce(progress: number) {
	if (progress < 0.5) return (1 - easeOutBounce(1 - 2 * progress)) / 2;
	return (1 + easeOutBounce(2 * progress - 1)) / 2;
}

function getSvgTraceEasing(
	easingId: SvgTraceConfig["easingId"],
	customBezier: SvgTraceConfig["customBezier"],
): SvgTraceEasing {
	if (easingId === "custom") {
		return [...customBezier] as [number, number, number, number];
	}
	return SVG_TRACE_EASINGS[easingId] ?? "linear";
}

function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setReduced(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	return reduced;
}

function TraceSegment({
	d,
	color,
	index,
	colorStopCount,
	pathLengthPx,
	traceWindow,
	segmentCap,
	strokeWidth,
}: TraceSegmentProps) {
	const colorStart = index / colorStopCount;
	const colorEnd = (index + 1) / colorStopCount;
	const visibleStart = Math.max(traceWindow.start, colorStart);
	const visibleEnd = Math.min(traceWindow.end, colorEnd);
	const visibleLength = Math.max(0, visibleEnd - visibleStart);
	if (visibleLength <= 0) return null;

	const dashLength = `${visibleLength * pathLengthPx + 1} ${pathLengthPx}`;
	const dashOffset = -(visibleStart * pathLengthPx);

	return (
		<path
			d={d}
			fill="none"
			stroke={color}
			strokeDasharray={dashLength}
			strokeDashoffset={dashOffset}
			strokeLinecap={segmentCap}
			strokeLinejoin="round"
			strokeWidth={strokeWidth}
			vectorEffect="non-scaling-stroke"
		/>
	);
}

function TracePath({
	d,
	traceWindow,
	segments,
	showOutline,
	segmentCap,
	strokeWidth,
}: TracePathProps) {
	const measurePathRef = useRef<SVGPathElement | null>(null);
	const [pathLengthPx, setPathLengthPx] = useState(1);

	const measurePathLength = useCallback(() => {
		const path = measurePathRef.current;
		if (!path) return;
		const ctm = path.getScreenCTM();
		const scale = ctm ? Math.hypot(ctm.a, ctm.b) : 1;
		const nextLength = path.getTotalLength() * scale;
		if (Number.isFinite(nextLength) && nextLength > 0) {
			setPathLengthPx(nextLength);
		}
	}, []);

	useEffect(() => {
		measurePathLength();
		window.addEventListener("resize", measurePathLength);
		return () => window.removeEventListener("resize", measurePathLength);
	}, [d, measurePathLength]);

	return (
		<>
			<path
				ref={measurePathRef}
				d={d}
				fill="none"
				className="text-text-subtlest"
				stroke={showOutline ? "currentColor" : "transparent"}
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeOpacity={0.45}
				strokeWidth={Math.max(1, strokeWidth * 0.8)}
				vectorEffect="non-scaling-stroke"
			/>
			{segments.map((segment) => (
				<TraceSegment
					key={segment.index}
					d={d}
					color={segment.color}
					index={segment.index}
					colorStopCount={segments.length}
					pathLengthPx={pathLengthPx}
					traceWindow={traceWindow}
					segmentCap={segmentCap}
					strokeWidth={strokeWidth}
				/>
			))}
		</>
	);
}

function getTraceWindow(
	latest: number,
	traceMode: SvgTraceConfig["traceMode"],
	traceLength: number,
): TraceWindow {
	const clampedTraceLength = clampTraceLength(traceLength);
	if (traceMode === "draw-eat") {
		return {
			start: Math.max(0, latest - 1),
			end: Math.min(1, latest),
		};
	}

	const start = latest * (1 - clampedTraceLength);
	return {
		start,
		end: start + clampedTraceLength,
	};
}

export default function SvgTracing({
	shape,
	config = DEFAULT_SVG_TRACE_CONFIG,
	playing = true,
	resetKey = 0,
	className,
}: SvgTracingProps) {
	const reducedMotion = usePrefersReducedMotion();
	const progress = useMotionValue(0);
	const [traceWindowState, setTraceWindowState] = useState<TraceWindow>({ start: 0, end: 0 });
	const colorStopCount = clampColorStopCount(config.colorStopCount);
	const duration = Math.max(0.2, config.duration);
	const traceLength = clampTraceLength(config.traceLength);
	const animationEnd = config.traceMode === "draw-eat" ? 2 : 1;
	const easing = useMemo(
		() => getSvgTraceEasing(config.easingId, config.customBezier),
		[config.customBezier, config.easingId],
	);

	const segments = useMemo(
		() =>
			Array.from({ length: colorStopCount }, (_, index) => ({
				index,
				color: SVG_TRACE_ROVO_COLORS[index % SVG_TRACE_ROVO_COLORS.length],
			})),
		[colorStopCount],
	);

	useEffect(() => {
		progress.set(0);
		setTraceWindowState({ start: 0, end: 0 });
	}, [progress, resetKey, shape.id]);

	useMotionValueEvent(progress, "change", (latest) => {
		setTraceWindowState(getTraceWindow(latest, config.traceMode, traceLength));
	});

	useEffect(() => {
		if (reducedMotion) {
			const latest = config.traceMode === "draw-eat" ? 1 : 0.18;
			progress.set(latest);
			setTraceWindowState(getTraceWindow(latest, config.traceMode, traceLength));
			return;
		}

		if (!playing) return;

		let stopped = false;
		let controls: ReturnType<typeof animate> | null = null;
		let completed = 0;
		const repeatCount = Math.max(1, Math.round(config.repeatCount));

		const run = () => {
			const current = progress.get() % animationEnd;
			progress.set(current);
			controls = animate(progress, animationEnd, {
				duration: Math.max(0.05, duration * (1 - current / animationEnd)),
				ease: easing,
				onComplete: () => {
					if (stopped) return;
					completed += 1;
					if (!config.loop && completed >= repeatCount) return;
					progress.set(0);
					run();
				},
			});
		};

		run();

		return () => {
			stopped = true;
			controls?.stop();
		};
	}, [
		animationEnd,
		easing,
		config.easingId,
		config.loop,
		config.repeatCount,
		config.traceMode,
		duration,
		playing,
		progress,
		reducedMotion,
		resetKey,
		shape.id,
		traceLength,
	]);

	return (
		<div
			className={cn(
				"relative flex min-h-[320px] w-full items-center justify-center overflow-hidden",
				className,
			)}
		>
			<svg
				viewBox={shape.viewBox}
				role="img"
				aria-label={`${shape.label} SVG tracing animation`}
				preserveAspectRatio="xMidYMid meet"
				className="relative z-10 h-[min(56svh,25rem)] w-[min(88%,36rem)] overflow-visible"
			>
				<g>
					{shape.paths.map((path, pathIndex) => (
						<TracePath
							key={`${pathIndex}-${path.d}`}
							d={path.d}
							traceWindow={traceWindowState}
							segments={segments}
							showOutline={config.showOutline}
							segmentCap={config.segmentCap}
							strokeWidth={config.strokeWidth}
						/>
					))}
				</g>
			</svg>
		</div>
	);
}
