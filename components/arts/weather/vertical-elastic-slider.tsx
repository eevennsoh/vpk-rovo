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
import { cn } from "@/lib/utils";
import { useControllableState } from "@/hooks/use-controllable-state";

const CLICK_THRESHOLD = 3;
const DEAD_ZONE = 32;
const MAX_CURSOR_RANGE = 200;
const MAX_STRETCH = 8;

const HANDLE_BUFFER = 8;

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
				stiffness: 300,
				damping: 25,
				mass: 0.8,
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

			return (
				sign *
				MAX_STRETCH *
				Math.sqrt(Math.min(overflow / MAX_CURSOR_RANGE, 1))
			);
		},
		[],
	);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
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
		}
	}, []);

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

			const newValue = positionToValue(e.clientY);
			animRef.current?.stop();
			animRef.current = null;
			fillPercent.jump(percentFromValue(newValue));
			setValue(roundValue(newValue, step));
		},
		[
			isInteracting,
			positionToValue,
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
					visualDuration: 0.35,
					bounce: 0.15,
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
					"relative cursor-grab overflow-hidden outline-none active:cursor-grabbing",
					"bg-(--elastic-slider-bg)",
					keyboardFocusRing && "ring-2 ring-black/20 ring-offset-2",
					trackClassName,
				)}
				style={{
					width: "100%",
					height: rubberHeight,
					borderRadius: "var(--elastic-slider-radius)",
					y: rubberY,
					...(trackShape === "squircle" ? squircleTrackStyle : {}),
					...trackStyle,
				}}
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
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }}
				/>
				{/* Hash marks */}
				<div
					data-slot="vertical-elastic-slider-hash-marks"
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
				>
					{Array.from({ length: hashMarkCount }, (_, i) => (
						<div
							key={i}
							className={cn(
								"absolute left-1/2 h-px w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200",
								"bg-transparent group-data-[active=true]/elastic-slider:bg-(--elastic-slider-hash)",
							)}
							style={{ top: `${hashMarkPct(i)}%` }}
						/>
					))}
				</div>

				{/* Fill from bottom */}
				<motion.div
					data-slot="vertical-elastic-slider-fill"
					aria-hidden="true"
					className={cn(
						"pointer-events-none absolute inset-x-0 bottom-0 transition-colors",
						"bg-(--elastic-slider-fill) group-data-[active=true]/elastic-slider:bg-(--elastic-slider-fill-active)",
					)}
					style={{ height: fillHeight }}
				/>

				{/* Handle */}
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

				{/* Label at top */}
				{label ? (
					<span
						data-slot="vertical-elastic-slider-label"
						aria-hidden="true"
						className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-(--elastic-slider-label) transition-colors"
					>
						{label}
					</span>
				) : null}

				{/* Value at bottom */}
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
			</motion.div>
		</div>
	);
}
