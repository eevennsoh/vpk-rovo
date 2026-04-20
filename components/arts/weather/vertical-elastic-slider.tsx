"use client";

// Vertical port of chanhdai's Elastic Slider (https://chanhdai.com/components/elastic-slider)
// Original: @ncdai — horizontal slider with rubber-band drag & magnetic snap.
// This version flips to vertical: drag up = increase, fill grows from bottom.

import {
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from "motion/react";
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { CSSProperties } from "react";

import {
	formatCornerShapeSuperellipse,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
} from "@/components/website/demos/visual/shaders/squircle-shape";
import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
import { cn } from "@/lib/utils";
import { useControllableState } from "@/hooks/use-controllable-state";

const CLICK_THRESHOLD = 3;
const DEAD_ZONE = 16;
const MAX_CURSOR_RANGE = 200;
const MAX_STRETCH = 24;

const HANDLE_BUFFER = 8;
const DEFAULT_GLASS_SHELL_PROPS: Partial<LiquidGlassProps> = {
	borderRadius: 9999,
	borderWidth: 0.05,
	brightness: 50,
	opacity: 0.93,
	blur: 8,
	backgroundOpacity: 0.2,
	saturation: 1,
	distortionScale: -90,
	dispersion: 6,
	borderOpacity: 0.35,
};

function clamp(v: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(hi, v));
}

function roundValue(val: number, step: number): number {
	const raw = Math.round(val / step) * step;
	const s = step.toString();
	const dot = s.indexOf(".");
	const decimals = dot === -1 ? 0 : s.length - dot - 1;
	return parseFloat(raw.toFixed(decimals));
}

export interface VerticalElasticSliderProps {
	label?: string;
	value?: number;
	defaultValue?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	formatValue?: (value: number) => string;
	className?: string;
	trackClassName?: string;
	trackStyle?: CSSProperties;
	trackShape?: "squircle" | "none";
	shell?: "none" | "liquid-glass";
	shellProps?: Partial<LiquidGlassProps>;
	/**
	 * Optional labels (one per hash-mark tick, ordered low→high).
	 * When provided, the corresponding hash marks and their labels are
	 * always visible (independent of hover/interaction state).
	 */
	tickLabels?: ReadonlyArray<string>;
	"aria-label"?: string;
}

export function VerticalElasticSlider({
	label,
	value: valueProp,
	defaultValue,
	onValueChange,
	min = 0,
	max = 1,
	step = 1,
	formatValue,
	className,
	trackClassName,
	trackStyle,
	trackShape = "squircle",
	shell = "none",
	shellProps,
	tickLabels,
	"aria-label": ariaLabel,
}: VerticalElasticSliderProps) {
	const [value = min, setValue] = useControllableState({
		prop: valueProp,
		defaultProp: defaultValue ?? min,
		onChange: onValueChange,
	});

	const shouldReduceMotion = useReducedMotion();

	const wrapperRef = useRef<HTMLDivElement>(null);
	const trackRef = useRef<HTMLDivElement>(null);
	const squircleTrackStyle = useMemo(
		() =>
			({
				borderRadius: 9999,
				cornerShape: formatCornerShapeSuperellipse(SQUIRCLE_DEFAULT_SMOOTHNESS),
			}) as CSSProperties & { cornerShape: string },
		[],
	);

	const [isInteracting, setIsInteracting] = useState(false);
	const [, setIsDragging] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [keyboardFocusRing, setKeyboardFocusRing] = useState(false);

	const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
	const pendingPointerFocusRef = useRef(false);
	const isClickRef = useRef(true);
	const animRef = useRef<ReturnType<typeof animate> | null>(null);
	const wrapperRectRef = useRef<DOMRect | null>(null);
	const scaleRef = useRef(1);
	// Captured at pointerdown so drag can advance from the original handle
	// position by *delta* rather than jumping to wherever the cursor is.
	const valueAtPointerDownRef = useRef(0);
	const trackHeightAtPointerDownRef = useRef(0);

	// Tracks which tick row the cursor is currently over (for label hover
	// styling). `null` when not hovering any tick.
	const [hoveredTickIndex, setHoveredTickIndex] = useState<number | null>(null);

	// Percentage: 0 = min (bottom), 100 = max (top)
	const percentage = ((value - min) / (max - min)) * 100;
	const isActive = isInteracting || isHovered;

	const fillPercent = useMotionValue(percentage);
	// Fill grows from bottom
	const fillHeight = useTransform(fillPercent, (pct) => `${pct}%`);
	// Handle positioned from bottom
	const handleBottom = useTransform(
		fillPercent,
		(pct) => `max(4px, calc(${pct}% - 8px))`,
	);

	// Rubber band: stretches track height and shifts it down when overshoot at top
	const rubberStretch = useMotionValue(0);
	const rubberHeight = useTransform(
		rubberStretch,
		(s) => `calc(100% + ${Math.abs(s)}px)`,
	);
	const rubberY = useTransform(rubberStretch, (s) => (s > 0 ? 0 : s));

	useEffect(() => {
		if (!isInteracting && !animRef.current) {
			fillPercent.jump(percentage);
		}
	}, [percentage, isInteracting, fillPercent]);

	// Convert clientY to a value. Up = higher value.
	const positionToValue = useCallback(
		(clientY: number) => {
			const rect = wrapperRectRef.current;
			if (!rect) return min;

			const sceneY = (clientY - rect.top) / scaleRef.current;
			const nativeHeight = wrapperRef.current?.offsetHeight ?? rect.height;
			// Invert: top of track = max, bottom = min
			const percent = 1 - clamp(sceneY / nativeHeight, 0, 1);

			return clamp(min + percent * (max - min), min, max);
		},
		[min, max],
	);

	const percentFromValue = useCallback(
		(v: number) => ((v - min) / (max - min)) * 100,
		[min, max],
	);

	const animateFillTo = useCallback(
		(targetPercent: number) => {
			animRef.current?.stop();

			if (shouldReduceMotion) {
				fillPercent.jump(targetPercent);
				animRef.current = null;
				return;
			}

			animRef.current = animate(fillPercent, targetPercent, {
				type: "spring",
				stiffness: 180,
				damping: 12,
				mass: 0.6,
				onComplete: () => {
					animRef.current = null;
				},
			});
		},
		[fillPercent, shouldReduceMotion],
	);

	const computeRubberStretch = useCallback(
		(clientY: number, sign: number) => {
			const rect = wrapperRectRef.current;
			if (!rect) return 0;

			// sign < 0 = past top (increase), sign > 0 = past bottom (decrease)
			const distancePast =
				sign < 0 ? rect.top - clientY : clientY - rect.bottom;
			const overflow = Math.max(0, distancePast - DEAD_ZONE);

			// Steeper rubber-band curve (cube root) ramps up faster than sqrt at small overflow,
			// matching the bouncier feel of reactbits.dev/elastic-slider.
			const ratio = Math.min(overflow / MAX_CURSOR_RANGE, 1);
			return sign * MAX_STRETCH * Math.cbrt(ratio);
		},
		[],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			e.preventDefault();
			(e.target as HTMLElement).setPointerCapture(e.pointerId);

			pointerDownPos.current = { x: e.clientX, y: e.clientY };
			isClickRef.current = true;
			setIsInteracting(true);
			pendingPointerFocusRef.current = true;
			setKeyboardFocusRing(false);
			trackRef.current?.focus({ preventScroll: true });
			requestAnimationFrame(() => {
				pendingPointerFocusRef.current = false;
			});

			const wrapper = wrapperRef.current;
			if (wrapper) {
				const rect = wrapper.getBoundingClientRect();
				wrapperRectRef.current = rect;
				scaleRef.current = rect.height / wrapper.offsetHeight;
				// Native (unscaled) height — drag deltas are in scene-space
				// pixels, matching positionToValue's coordinate handling.
				trackHeightAtPointerDownRef.current = wrapper.offsetHeight;
			}
			valueAtPointerDownRef.current = value;
		},
		[value],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isInteracting || !pointerDownPos.current) return;

			const dx = e.clientX - pointerDownPos.current.x;
			const dy = e.clientY - pointerDownPos.current.y;

			if (isClickRef.current && Math.hypot(dx, dy) > CLICK_THRESHOLD) {
				isClickRef.current = false;
				setIsDragging(true);
			}

			if (isClickRef.current) return;

			const rect = wrapperRectRef.current;
			if (rect && !shouldReduceMotion) {
				if (e.clientY < rect.top) {
					rubberStretch.jump(computeRubberStretch(e.clientY, -1));
				} else if (e.clientY > rect.bottom) {
					rubberStretch.jump(computeRubberStretch(e.clientY, 1));
				} else {
					rubberStretch.jump(0);
				}
			}

			// Drag uses *delta* from the press-down position so the handle
			// stays put on press-down and tracks the cursor relatively (no
			// jump-to-cursor). Click-snap is handled in handlePointerUp.
			const trackHeight = trackHeightAtPointerDownRef.current;
			const range = max - min;
			const valueDelta =
				trackHeight > 0
					? -(dy / scaleRef.current / trackHeight) * range
					: 0;
			const newValue = clamp(
				valueAtPointerDownRef.current + valueDelta,
				min,
				max,
			);
			animRef.current?.stop();
			animRef.current = null;
			fillPercent.jump(percentFromValue(newValue));
			setValue(roundValue(newValue, step));
		},
		[
			isInteracting,
			min,
			max,
			percentFromValue,
			setValue,
			step,
			fillPercent,
			rubberStretch,
			computeRubberStretch,
			shouldReduceMotion,
		],
	);

	const handlePointerUp = useCallback(
		(e: React.PointerEvent) => {
			if (!isInteracting) return;

			if (isClickRef.current) {
				const rawValue = positionToValue(e.clientY);
				const snapped = clamp(
					min + Math.round((rawValue - min) / step) * step,
					min,
					max,
				);
				animateFillTo(percentFromValue(snapped));
				setValue(roundValue(snapped, step));
			}

			if (!shouldReduceMotion && rubberStretch.get() !== 0) {
				animate(rubberStretch, 0, {
					type: "spring",
					visualDuration: 0.6,
					bounce: 0.5,
				});
			}

			setIsInteracting(false);
			setIsDragging(false);
			pointerDownPos.current = null;
		},
		[
			isInteracting,
			positionToValue,
			percentFromValue,
			setValue,
			step,
			min,
			max,
			animateFillTo,
			rubberStretch,
			shouldReduceMotion,
		],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const bigStep = step * 10;
			let newValue: number | null = null;

			switch (e.key) {
				case "ArrowUp":
				case "ArrowRight":
					newValue = clamp(value + (e.shiftKey ? bigStep : step), min, max);
					break;
				case "ArrowDown":
				case "ArrowLeft":
					newValue = clamp(value - (e.shiftKey ? bigStep : step), min, max);
					break;
				case "Home":
					newValue = min;
					break;
				case "End":
					newValue = max;
					break;
				default:
					return;
			}

			e.preventDefault();
			setKeyboardFocusRing(true);
			const rounded = roundValue(newValue, step);
			animateFillTo(percentFromValue(rounded));
			setValue(rounded);
		},
		[value, min, max, step, percentFromValue, animateFillTo, setValue],
	);

	const handleFocus = useCallback(() => {
		if (!pendingPointerFocusRef.current) {
			setKeyboardFocusRing(true);
		}
	}, []);

	const handleBlur = useCallback(() => {
		setKeyboardFocusRing(false);
	}, []);

	// Hash marks (discrete steps)
	const discreteSteps = (max - min) / step;
	const hashMarkCount =
		discreteSteps <= 20 ? discreteSteps + 1 : Math.min(11, discreteSteps + 1);
	const hashMarkPct = (i: number) =>
		((hashMarkCount - 1 - i) / (hashMarkCount - 1)) * 100;

	// Index of the currently-selected tick (used to hide the redundant dot
	// behind the handle and to highlight the active label).
	const selectedIndex = clamp(
		Math.round((value - min) / step),
		0,
		hashMarkCount - 1,
	);

	// Snap directly to a tick (used by the per-tick hit-area buttons). Skips
	// the drag/rubber-band path entirely and animates the fill.
	const handleTickActivate = useCallback(
		(i: number) => {
			const target = clamp(min + i * step, min, max);
			animateFillTo(percentFromValue(target));
			setValue(roundValue(target, step));
		},
		[min, max, step, animateFillTo, percentFromValue, setValue],
	);

	// Handle opacity based on overlap with label/value
	const [handleOpacity, setHandleOpacity] = useState(1);
	useLayoutEffect(() => {
		if (!wrapperRef.current || !trackRef.current) return;
		const trackHeight = wrapperRef.current.offsetHeight;
		const handlePos = (percentage / 100) * trackHeight;
		const nearTop = handlePos < HANDLE_BUFFER + 24;
		const nearBottom = handlePos > trackHeight - HANDLE_BUFFER - 24;
		setHandleOpacity(nearTop || nearBottom ? 0.3 : 1);
	}, [percentage]);

	const displayValue = formatValue
		? formatValue(value)
		: value.toFixed(
				step.toString().indexOf(".") === -1
					? 0
					: step.toString().length - step.toString().indexOf(".") - 1,
			);
	const trackMotionStyle = {
		width: "100%",
		height: rubberHeight,
		y: rubberY,
		transformOrigin: "center center",
	};
	const trackSurfaceStyle = {
		borderRadius: "var(--elastic-slider-radius)",
		...(trackShape === "squircle" ? squircleTrackStyle : {}),
		...trackStyle,
	};
	const glassShellStyle = {
		position: "absolute",
		inset: 0,
		...(trackShape === "squircle" ? squircleTrackStyle : {}),
		...trackStyle,
		...shellProps?.style,
	} satisfies CSSProperties;
	const trackChrome = (
		<>
			{shell === "none" ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }}
				/>
			) : null}
			<div
				data-slot="vertical-elastic-slider-hash-marks"
				aria-hidden="true"
				className="pointer-events-none absolute inset-0"
			>
				{Array.from({ length: hashMarkCount }, (_, i) => {
					// `hashMarkPct` places `i = 0` at top:100% (the BOTTOM of the
					// track) and `i = hashMarkCount - 1` at top:0% (the TOP of the
					// track). Slider values run min→max bottom→top, and tickLabels
					// are passed low→high, so the label for tick `i` is just
					// `tickLabels[i]`.
					const tickLabel = tickLabels?.[i];
					// The topmost tick (`i === hashMarkCount - 1`, sitting at
					// top:0%) places its label *below* the tick so it doesn't get
					// clipped by the top of the track. All others render *above*
					// the tick.
					const isTopTick = i === hashMarkCount - 1;
					// When a label is supplied for this tick, the tick mark and its
					// label are always visible. Otherwise the tick keeps the
					// default behavior of only appearing on hover/interaction.
					const hasLabel = Boolean(tickLabel);
					const isSelected = i === selectedIndex;
					const isHoveredTick = i === hoveredTickIndex;
					// Selected tick's dot is suppressed because the wide handle
					// bar already occupies that vertical position — rendering both
					// produces the "two stacked marks" artifact.
					const showDot = !isSelected;
					return (
						<div
							key={i}
							data-selected={isSelected || undefined}
							className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
							style={{ top: `${hashMarkPct(i)}%` }}
						>
							{showDot ? (
								<div
									className={cn(
										"h-px w-4 rounded-full transition-colors duration-200",
										hasLabel
											? "bg-(--elastic-slider-hash)"
											: "bg-transparent group-data-[active=true]/elastic-slider:bg-(--elastic-slider-hash)",
									)}
								/>
							) : (
								// Reserve the same vertical footprint so the label
								// position doesn't shift when selection changes.
								<div className="h-px w-4" />
							)}
							{tickLabel ? (
								<span
									data-slot="vertical-elastic-slider-tick-label"
									className={cn(
										"pointer-events-none absolute left-1/2 -translate-x-1/2",
										isTopTick ? "top-full mt-1" : "bottom-full mb-1",
										"font-mono text-[9px] font-medium uppercase tracking-[0.15em] transition-colors duration-150",
										"whitespace-nowrap",
										isSelected || isHoveredTick
											? "text-(--elastic-slider-focus)"
											: "text-(--elastic-slider-label)",
									)}
								>
									{tickLabel}
								</span>
							) : null}
						</div>
					);
				})}
			</div>

			{/* Per-tick hit areas. Each row spans the full track width and snaps
			    to its city on click. Pointer events are scoped to the buttons
			    only so the rest of the track can still initiate drag. */}
			{tickLabels ? (
				<div
					data-slot="vertical-elastic-slider-tick-hit-areas"
					className="pointer-events-none absolute inset-0"
				>
					{Array.from({ length: hashMarkCount }, (_, i) => {
						const tickLabel = tickLabels[i];
						if (!tickLabel) return null;
						const rowHeightPct = 100 / hashMarkCount;
						const centerPct = hashMarkPct(i);
						const topPct = clamp(
							centerPct - rowHeightPct / 2,
							0,
							100 - rowHeightPct,
						);
						return (
							<button
								key={i}
								type="button"
								tabIndex={-1}
								aria-label={`Select ${tickLabel}`}
								className="pointer-events-auto absolute left-0 right-0 cursor-pointer bg-transparent outline-none"
								style={{
									top: `${topPct}%`,
									height: `${rowHeightPct}%`,
								}}
								onPointerEnter={() => setHoveredTickIndex(i)}
								onPointerLeave={() =>
									setHoveredTickIndex((prev) => (prev === i ? null : prev))
								}
								onPointerDown={(e) => {
									// Don't let the track start a drag when the user
									// is clicking a tick row.
									e.stopPropagation();
								}}
								onClick={(e) => {
									e.stopPropagation();
									handleTickActivate(i);
								}}
							/>
						);
					})}
				</div>
			) : null}

			<motion.div
				data-slot="vertical-elastic-slider-fill"
				aria-hidden="true"
				className={cn(
					"pointer-events-none absolute inset-x-0 bottom-0 transition-colors",
					"bg-(--elastic-slider-fill) group-data-[active=true]/elastic-slider:bg-(--elastic-slider-fill-active)",
				)}
				style={{ height: fillHeight }}
			/>

			<motion.div
				data-slot="vertical-elastic-slider-handle"
				aria-hidden="true"
				className="pointer-events-none absolute left-1/2 h-1 w-5 rounded-full bg-(--elastic-slider-handle)"
				style={{ bottom: handleBottom, x: "-50%" }}
				animate={{
					opacity: handleOpacity,
					scaleY: isActive ? 1 : 0.25,
					scaleX: isActive ? 1 : 1,
				}}
				transition={
					shouldReduceMotion
						? { duration: 0 }
						: {
								scaleY: {
									type: "spring",
									visualDuration: 0.25,
									bounce: 0.15,
								},
								opacity: { duration: 0.15 },
							}
				}
			/>

			{label ? (
				<span
					data-slot="vertical-elastic-slider-label"
					aria-hidden="true"
					className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-(--elastic-slider-label) transition-colors"
				>
					{label}
				</span>
			) : null}

			{/* When tickLabels are supplied, every tick already shows its own
			    label, so the floating value badge becomes a redundant duplicate
			    (e.g. "SYD" rendered twice at the bottom). Hide it in that case. */}
			{tickLabels ? null : (
				<span
					data-slot="vertical-elastic-slider-value"
					aria-hidden="true"
					className={cn(
						"pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-center font-mono text-[10px] font-medium transition-colors",
						"text-(--elastic-slider-label) group-data-[active=true]/elastic-slider:text-(--elastic-slider-focus)",
					)}
				>
					{displayValue}
				</span>
			)}

			{/* Squircle-shaped focus ring. Rendered inside the track so it
			    inherits the parent's squircle clip via `cornerShape`. The
			    border traces the squircle exactly (unlike Tailwind's `ring`
			    which traces the rectangular bounding box). */}
			{keyboardFocusRing && trackShape === "squircle" ? (
				<div
					aria-hidden="true"
					data-slot="vertical-elastic-slider-focus-ring"
					className="pointer-events-none absolute inset-0 border-2 border-black/20"
					style={trackSurfaceStyle}
				/>
			) : null}
		</>
	);

	return (
		<div
			ref={wrapperRef}
			data-slot="vertical-elastic-slider"
			data-active={isActive}
			className={cn(
				"group/elastic-slider relative flex w-full touch-none select-none flex-col items-center",
				className,
			)}
			style={
				{
					"--elastic-slider-height": "100%",
					"--elastic-slider-radius": "9999px",
					"--elastic-slider-bg": "rgba(0,0,0,0.06)",
					"--elastic-slider-fill": "rgba(0,0,0,0.08)",
					"--elastic-slider-fill-active": "rgba(0,0,0,0.14)",
					"--elastic-slider-hash": "rgba(0,0,0,0.12)",
					"--elastic-slider-handle": "rgba(0,0,0,0.55)",
					"--elastic-slider-label": "rgba(0,0,0,0.5)",
					"--elastic-slider-focus": "rgba(0,0,0,0.8)",
				} as React.CSSProperties
			}
			>
			<motion.div
				ref={trackRef}
				data-slot="vertical-elastic-slider-track"
				role="slider"
				tabIndex={0}
				aria-label={ariaLabel ?? label ?? "Slider"}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={value}
				aria-valuetext={displayValue}
				aria-orientation="vertical"
				className={cn(
					"relative cursor-grab outline-none active:cursor-grabbing",
					shell === "none" && "overflow-hidden bg-(--elastic-slider-bg)",
					shell === "none" && trackClassName,
					// Pill shapes use Tailwind's ring (border-radius is rounded so
					// the ring itself rounds correctly). The squircle case uses a
					// dedicated overlay sibling instead — see below.
					keyboardFocusRing &&
						trackShape !== "squircle" &&
						"ring-2 ring-black/20 ring-offset-2",
				)}
				style={shell === "none" ? { ...trackMotionStyle, ...trackSurfaceStyle } : trackMotionStyle}
				animate={{
					scale: isActive ? 1.04 : 1,
				}}
				transition={
					shouldReduceMotion
						? { duration: 0 }
						: {
								scale: {
									type: "spring",
									stiffness: 260,
									damping: 18,
									mass: 0.6,
								},
							}
				}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerUp}
				onKeyDown={handleKeyDown}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{shell === "liquid-glass" ? (
					<>
						<LiquidGlass
							{...DEFAULT_GLASS_SHELL_PROPS}
							{...shellProps}
							width="100%"
							height="100%"
							className={cn(
								"pointer-events-none absolute inset-0",
								shellProps?.className,
							)}
							style={glassShellStyle}
						/>
						<div
							data-slot="vertical-elastic-slider-track-surface"
							className={cn(
								"absolute inset-0 overflow-hidden",
								trackClassName,
							)}
							style={trackSurfaceStyle}
						>
							{trackChrome}
						</div>
					</>
				) : (
					<>
						{trackChrome}
					</>
				)}
			</motion.div>
		</div>
	);
}
