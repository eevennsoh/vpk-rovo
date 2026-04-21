"use client";

// Horizontal sibling of GlassSlider — a segmented "tab" control that
// reuses the LiquidGlass shell + Rovo brand-tint visual language so the
// selected segment reads as the slider's "progress fill". Adds an
// elastic stretch on selection: the pill stretches toward the new
// target before settling, mirroring the rubber-band feel of the
// vertical elastic slider.

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
	useId,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type {
	CSSProperties,
	KeyboardEvent,
	PointerEvent as ReactPointerEvent,
} from "react";

import LiquidGlass, {
	type LiquidGlassProps,
} from "@/components/website/demos/visual/shaders/liquid-glass";
import {
	formatCornerShapeSuperellipse,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
} from "@/components/website/demos/visual/shaders/squircle-shape";
import { ROVO_COLOR_SWATCHES } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";

// ── Visual constants ────────────────────────────────────────────────
// Squircle (superellipse) corner radius for the shell + pill. Mirrors
// GlassSlider's `squircleTrackStyle` so the two surfaces share the same
// continuous, iOS-style corner curve instead of a circular pill.
const SQUIRCLE_BORDER_RADIUS = 9999;
const SQUIRCLE_CORNER_SHAPE = formatCornerShapeSuperellipse(
	SQUIRCLE_DEFAULT_SMOOTHNESS,
);

// Mirror GlassSlider's shell defaults (squircle border, soft
// brightness + blur) but tuned slightly thinner since the horizontal
// chrome is short and dense with text.
const SHELL_GLASS_PROPS: Partial<LiquidGlassProps> = {
	borderRadius: SQUIRCLE_BORDER_RADIUS,
	borderWidth: 0,
	brightness: 50,
	opacity: 0.92,
	blur: 8,
	backgroundOpacity: 0.18,
	saturation: 1,
	distortionScale: -70,
	dispersion: 5,
	borderOpacity: 1,
	borderColor: "var(--ds-border)",
	dropShadow: false,
};

// Selection pill: a softer "inner lens" matching DEFAULT_FILL_GLASS_PROPS
// from glass-slider.tsx so the two surfaces feel like siblings.
const PILL_GLASS_PROPS: Partial<LiquidGlassProps> = {
	borderRadius: SQUIRCLE_BORDER_RADIUS,
	borderWidth: 0,
	brightness: 55,
	opacity: 0.85,
	blur: 6,
	backgroundOpacity: 0.18,
	saturation: 1.05,
	distortionScale: -60,
	dispersion: 4,
	borderOpacity: 0,
	dropShadow: false,
};

// Horizontal version of glass-slider.tsx's DEFAULT_FILL_TINT_GRADIENT
// (90deg → left-to-right). Same Rovo brand swatches, theme-agnostic
// hex values for visual parity in light + dark mode.
const PILL_TINT_GRADIENT = `linear-gradient(90deg, ${ROVO_COLOR_SWATCHES[0].hex}38 0%, ${ROVO_COLOR_SWATCHES[1].hex}30 35%, ${ROVO_COLOR_SWATCHES[2].hex}30 70%, ${ROVO_COLOR_SWATCHES[3].hex}38 100%)`;

// Spring used for both the leading-edge dash and the trailing-edge
// settle. Matches `animateFillTo` in glass-slider.tsx.
const SPRING = {
	type: "spring" as const,
	stiffness: 240,
	damping: 22,
	mass: 0.55,
};

// Keyboard-driven selection should read as a crisp tab step rather than
// a long elastic sweep, so we tighten both the spring and stretch budget.
const KEYBOARD_SPRING = {
	type: "spring" as const,
	stiffness: 360,
	damping: 30,
	mass: 0.42,
};

// Maximum extra stretch (in px) added to the pill while it's
// "reaching" toward its target during a commit. Capped so very long
// jumps (e.g. left-most → right-most) still feel tight.
const MAX_STRETCH_PX = 16;
const PILL_STRETCH_RATIO = 0.18;
const KEYBOARD_MAX_STRETCH_PX = 8;
const KEYBOARD_STRETCH_RATIO = 0.06;
const MAX_SHELL_STRETCH_PX = 18;
const MAX_SHELL_THIN_RATIO = 0.08;

interface SegmentRect {
	left: number;
	width: number;
}

export interface GlassSegmentedControlOption<TValue extends string> {
	value: TValue;
	label: string;
}

export interface GlassSegmentedControlProps<TValue extends string> {
	options: ReadonlyArray<GlassSegmentedControlOption<TValue>>;
	value: TValue;
	onChange: (value: TValue) => void;
	keyboardSelectionPulseKey?: number;
	"aria-label"?: string;
	className?: string;
	style?: CSSProperties;
}

export function GlassSegmentedControl<TValue extends string>({
	options,
	value,
	onChange,
	keyboardSelectionPulseKey = 0,
	"aria-label": ariaLabel,
	className,
	style,
}: GlassSegmentedControlProps<TValue>) {
	const shouldReduceMotion = useReducedMotion();
	const groupId = useId();

	const containerRef = useRef<HTMLDivElement>(null);
	const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const [segments, setSegments] = useState<SegmentRect[]>([]);
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

	const selectedIndex = Math.max(
		0,
		options.findIndex((option) => option.value === value),
	);

	// MotionValues drive the rainbow ("committed") pill's `left` and
	// `width` so the elastic stretch can be animated independently
	// per-edge without triggering React re-renders. The rainbow pill
	// ONLY tracks `selectedIndex` — hover does not move it.
	const pillLeft = useMotionValue(0);
	const pillWidth = useMotionValue(0);

	// MotionValues for the separate "hover ghost pill" — a softer
	// affordance that follows `hoveredIndex` and fades in only when
	// the cursor is over a non-selected option.
	const hoverPillLeft = useMotionValue(0);
	const hoverPillWidth = useMotionValue(0);
	const hoverPillOpacity = useMotionValue(0);

	// Cursor-driven shell stretch (slider-style "magnet"). Signed:
	// negative → cursor sits left of center, shell elongates left;
	// positive → cursor sits right of center, shell elongates right.
	const shellStretch = useMotionValue(0);
	const shellWidth = useTransform(
		shellStretch,
		(stretch) => `calc(100% + ${Math.abs(stretch)}px)`,
	);
	const shellOffsetX = useTransform(shellStretch, (stretch) =>
		stretch < 0 ? stretch : 0,
	);
	const shellScaleY = useTransform(shellStretch, (stretch) => {
		const ratio = Math.min(Math.abs(stretch) / MAX_SHELL_STRETCH_PX, 1);
		return 1 - ratio * MAX_SHELL_THIN_RATIO;
	});
	// Cancel handles for the two-stage stretch animation. We track
	// both so a rapid second commit can interrupt the first cleanly.
	const leftAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const widthAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const shellAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const hoverLeftAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const hoverWidthAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const hoverOpacityAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const selectionInputModeRef = useRef<"pointer" | "keyboard">("pointer");
	const previousKeyboardSelectionPulseKeyRef = useRef(keyboardSelectionPulseKey);

	const stopAnims = useCallback(() => {
		leftAnimRef.current?.stop();
		widthAnimRef.current?.stop();
		shellAnimRef.current?.stop();
		leftAnimRef.current = null;
		widthAnimRef.current = null;
		shellAnimRef.current = null;
	}, []);

	const stopHoverAnims = useCallback(() => {
		hoverLeftAnimRef.current?.stop();
		hoverWidthAnimRef.current?.stop();
		hoverOpacityAnimRef.current?.stop();
		hoverLeftAnimRef.current = null;
		hoverWidthAnimRef.current = null;
		hoverOpacityAnimRef.current = null;
	}, []);

	// Measure each segment's left + width relative to the container.
	// Re-runs on resize so the pill stays glued through layout shifts
	// (e.g. font load, container resize, theme switch).
	const measure = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;
		const containerRect = container.getBoundingClientRect();
		const next: SegmentRect[] = buttonRefs.current.map((btn) => {
			if (!btn) return { left: 0, width: 0 };
			const rect = btn.getBoundingClientRect();
			return {
				left: rect.left - containerRect.left,
				width: rect.width,
			};
		});
		setSegments(next);
	}, []);

	useLayoutEffect(() => {
		measure();
	}, [measure, options.length]);

	useEffect(() => {
		if (keyboardSelectionPulseKey === previousKeyboardSelectionPulseKeyRef.current) {
			return;
		}
		previousKeyboardSelectionPulseKeyRef.current = keyboardSelectionPulseKey;
		selectionInputModeRef.current = "keyboard";
	}, [keyboardSelectionPulseKey]);

	useEffect(() => {
		if (typeof ResizeObserver === "undefined") return;
		const container = containerRef.current;
		if (!container) return;
		const ro = new ResizeObserver(() => {
			measure();
		});
		ro.observe(container);
		buttonRefs.current.forEach((btn) => {
			if (btn) ro.observe(btn);
		});
		return () => ro.disconnect();
	}, [measure, options.length]);

	// Initial pill position: snap directly to the selected target
	// as soon as we have valid measurements, with no animation.
	const isFirstPositionRef = useRef(true);
	useLayoutEffect(() => {
		const target = segments[selectedIndex];
		if (!target || target.width <= 0) return;
		if (isFirstPositionRef.current) {
			pillLeft.jump(target.left);
			pillWidth.jump(target.width);
			hoverPillLeft.jump(target.left);
			hoverPillWidth.jump(target.width);
			isFirstPositionRef.current = false;
			return;
		}
	}, [
		segments,
		selectedIndex,
		pillLeft,
		pillWidth,
		hoverPillLeft,
		hoverPillWidth,
	]);

	// ── Elastic commit: the rainbow pill stretches toward the newly
	// SELECTED tab (not hovered), then settles. Hover does NOT move
	// the rainbow pill — only click / keyboard commit does.
	const previousSelectedIndexRef = useRef(selectedIndex);
	useEffect(() => {
		const target = segments[selectedIndex];
		if (!target || target.width <= 0) return;

		const previousIndex = previousSelectedIndexRef.current;
		previousSelectedIndexRef.current = selectedIndex;

		if (previousIndex === selectedIndex) {
			// No change in selection — still keep the pill aligned in
			// case `segments` shifted (e.g. responsive resize).
			pillLeft.set(target.left);
			pillWidth.set(target.width);
			return;
		}

		stopAnims();

		if (shouldReduceMotion) {
			pillLeft.jump(target.left);
			pillWidth.jump(target.width);
			return;
		}

		const isKeyboardSelection = selectionInputModeRef.current === "keyboard";
		selectionInputModeRef.current = "pointer";
		const motionSpring = isKeyboardSelection ? KEYBOARD_SPRING : SPRING;
		const stretchCap = isKeyboardSelection
			? KEYBOARD_MAX_STRETCH_PX
			: MAX_STRETCH_PX;
		const stretchRatio = isKeyboardSelection
			? KEYBOARD_STRETCH_RATIO
			: PILL_STRETCH_RATIO;

		if (isKeyboardSelection) {
			leftAnimRef.current = animate(pillLeft, target.left, motionSpring);
			widthAnimRef.current = animate(pillWidth, target.width, motionSpring);
			return;
		}

		const currentLeft = pillLeft.get();
		const currentWidth = pillWidth.get();
		const currentRight = currentLeft + currentWidth;
		const targetLeft = target.left;
		const targetRight = target.left + target.width;
		const movingRight = selectedIndex > previousIndex;

		// Compute the stretched intermediate so the pill visually
		// "reaches" toward the destination before snapping back to
		// the segment's natural width.
		const distance = movingRight
			? targetRight - currentRight
			: currentLeft - targetLeft;
		const stretch = Math.min(
			stretchCap,
			Math.max(0, distance * stretchRatio),
		);

		if (movingRight) {
			// Trailing (left) edge stays anchored; leading (right) edge
			// dashes past the target by `stretch`. Width therefore
			// grows from `currentRight - currentLeft` to
			// `(targetRight + stretch) - currentLeft`.
			const stretchedWidth = targetRight + stretch - currentLeft;
			widthAnimRef.current = animate(pillWidth, stretchedWidth, {
				...motionSpring,
				onComplete: () => {
					// Settle: snap left to target and contract width
					// back to natural.
					leftAnimRef.current = animate(pillLeft, targetLeft, motionSpring);
					widthAnimRef.current = animate(pillWidth, target.width, motionSpring);
				},
			});
		} else {
			// Moving left: leading (left) edge dashes past target by
			// `stretch`; trailing (right) edge stays anchored. We
			// animate `left` down, AND grow width to keep the right
			// edge fixed at `currentRight`.
			const stretchedLeft = Math.max(0, targetLeft - stretch);
			const stretchedWidth = currentRight - stretchedLeft;
			leftAnimRef.current = animate(pillLeft, stretchedLeft, {
				...motionSpring,
				onComplete: () => {
					// Settle: contract width back to natural by
					// pulling the right edge in.
					widthAnimRef.current = animate(pillWidth, target.width, motionSpring);
					// `left` is already at `stretchedLeft` ≤ targetLeft;
					// nudge it back up to the exact target.
					if (stretchedLeft !== targetLeft) {
						leftAnimRef.current = animate(pillLeft, targetLeft, motionSpring);
					}
				},
			});
			widthAnimRef.current = animate(pillWidth, stretchedWidth, motionSpring);
		}
	}, [
		keyboardSelectionPulseKey,
		segments,
		selectedIndex,
		pillLeft,
		pillWidth,
		shouldReduceMotion,
		stopAnims,
	]);

	// ── Hover ghost pill: tracks `hoveredIndex` independently of
	// `selectedIndex`. Fades in for non-selected hovered options;
	// fades out (or jumps back to the selected tab) otherwise.
	useEffect(() => {
		stopHoverAnims();
		const target =
			hoveredIndex !== null && hoveredIndex !== selectedIndex
				? segments[hoveredIndex]
				: null;

		if (target && target.width > 0) {
			if (shouldReduceMotion) {
				hoverPillLeft.jump(target.left);
				hoverPillWidth.jump(target.width);
				hoverPillOpacity.jump(1);
				return;
			}
			hoverLeftAnimRef.current = animate(hoverPillLeft, target.left, SPRING);
			hoverWidthAnimRef.current = animate(
				hoverPillWidth,
				target.width,
				SPRING,
			);
			hoverOpacityAnimRef.current = animate(hoverPillOpacity, 1, {
				duration: 0.15,
			});
		} else {
			if (shouldReduceMotion) {
				hoverPillOpacity.jump(0);
				return;
			}
			hoverOpacityAnimRef.current = animate(hoverPillOpacity, 0, {
				duration: 0.15,
			});
		}
	}, [
		hoveredIndex,
		selectedIndex,
		segments,
		hoverPillLeft,
		hoverPillWidth,
		hoverPillOpacity,
		shouldReduceMotion,
		stopHoverAnims,
	]);

	useEffect(
		() => () => {
			stopAnims();
			stopHoverAnims();
		},
		[stopAnims, stopHoverAnims],
	);

	// ── Cursor-driven elastic shell (GlassSlider "magnet" style).
	// Stretches the squircle shell horizontally based on how far the
	// cursor sits from the shell's center. Signed: negative pulls left,
	// positive pulls right.
	const handleContainerPointerMove = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (shouldReduceMotion) return;
			const container = containerRef.current;
			if (!container) return;
			const rect = container.getBoundingClientRect();
			if (rect.width <= 0) return;
			const center = rect.left + rect.width / 2;
			const dx = event.clientX - center;
			const half = rect.width / 2;
			const ratio = Math.max(-1, Math.min(1, dx / half));
			const stretch =
				Math.sign(ratio) *
				Math.min(MAX_SHELL_STRETCH_PX, Math.abs(ratio) * MAX_SHELL_STRETCH_PX);
			shellAnimRef.current?.stop();
			shellAnimRef.current = null;
			shellStretch.set(stretch);
		},
		[shellStretch, shouldReduceMotion],
	);

	const settleShell = useCallback(() => {
		shellAnimRef.current?.stop();
		if (shouldReduceMotion) {
			shellStretch.jump(0);
			return;
		}
		shellAnimRef.current = animate(shellStretch, 0, SPRING);
	}, [shellStretch, shouldReduceMotion]);

	const handleSelect = useCallback(
		(option: GlassSegmentedControlOption<TValue>) => {
			if (option.value === value) return;
			onChange(option.value);
		},
		[onChange, value],
	);

	const focusIndex = useCallback((index: number) => {
		const btn = buttonRefs.current[index];
		btn?.focus();
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>, index: number) => {
			let nextIndex: number | null = null;
			switch (event.key) {
				case "ArrowRight":
				case "ArrowDown":
					nextIndex = (index + 1) % options.length;
					break;
				case "ArrowLeft":
				case "ArrowUp":
					nextIndex = (index - 1 + options.length) % options.length;
					break;
				case "Home":
					nextIndex = 0;
					break;
				case "End":
					nextIndex = options.length - 1;
					break;
				default:
					return;
			}
			event.preventDefault();
			if (nextIndex == null) return;
			selectionInputModeRef.current = "keyboard";
			focusIndex(nextIndex);
			handleSelect(options[nextIndex]);
		},
		[focusIndex, handleSelect, options],
	);

	// Squircle (superellipse) corner shape — mirrors `squircleTrackStyle`
	// in glass-slider.tsx so the segmented control's shell + selection
	// pill share the slider's iOS-style continuous corner curve.
	const squircleStyle = useMemo(
		() =>
			({
				borderRadius: SQUIRCLE_BORDER_RADIUS,
				cornerShape: SQUIRCLE_CORNER_SHAPE,
			}) as CSSProperties & { cornerShape: string },
		[],
	);

	const containerStyle = useMemo<CSSProperties>(
		() => ({
			...style,
			...squircleStyle,
		}),
		[style, squircleStyle],
	);

	return (
		<div
			ref={containerRef}
			role="radiogroup"
			aria-label={ariaLabel}
			className={cn(
				"relative inline-flex items-center isolate p-1",
				className,
			)}
			style={containerStyle}
			onPointerMove={handleContainerPointerMove}
			onPointerLeave={() => {
				setHoveredIndex(null);
				settleShell();
			}}
		>
			{/* Liquid-glass shell — squircle container, cursor-driven stretch */}
			<motion.div
				aria-hidden="true"
				className="pointer-events-none absolute inset-y-0 left-0 -z-10"
				style={{
					width: shellWidth,
					x: shellOffsetX,
					scaleY: shellScaleY,
					...squircleStyle,
				}}
			>
				<LiquidGlass
					{...SHELL_GLASS_PROPS}
					width="100%"
					height="100%"
					className="pointer-events-none absolute inset-0"
					style={squircleStyle}
				/>
			</motion.div>

			{/* Hover ghost pill — soft affordance for the hovered tab */}
			<motion.div
				aria-hidden="true"
				className="pointer-events-none absolute top-1 bottom-1 z-0 overflow-hidden bg-surface-hovered"
				style={{
					left: hoverPillLeft,
					width: hoverPillWidth,
					opacity: hoverPillOpacity,
					...squircleStyle,
				}}
			/>

			{/* Selection pill ("progress fill") — committed state only */}
			<motion.div
				aria-hidden="true"
				className="pointer-events-none absolute top-1 bottom-1 z-0 overflow-hidden"
				style={{
					left: pillLeft,
					width: pillWidth,
					...squircleStyle,
				}}
			>
				<LiquidGlass
					{...PILL_GLASS_PROPS}
					width="100%"
					height="100%"
					className="pointer-events-none absolute inset-0"
					style={squircleStyle}
				/>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{
						backgroundImage: PILL_TINT_GRADIENT,
						...squircleStyle,
					}}
				/>
			</motion.div>

			{/* Segments */}
			{options.map((option, index) => {
				const isActive = option.value === value;
				const isHovered = hoveredIndex === index;
				return (
					<button
						key={option.value}
						ref={(node) => {
							buttonRefs.current[index] = node;
						}}
						id={`${groupId}-${option.value}`}
						type="button"
						role="radio"
						aria-checked={isActive}
						tabIndex={isActive ? 0 : -1}
						onClick={() => {
							selectionInputModeRef.current = "pointer";
							handleSelect(option);
						}}
						onPointerEnter={() => {
							setHoveredIndex(index);
						}}
						onKeyDown={(event) => handleKeyDown(event, index)}
						className={cn(
							"relative z-10 cursor-pointer px-2.5 py-1",
							"text-[11px] font-medium uppercase tracking-[0.2em]",
							"outline-none transition-colors duration-normal",
							"focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
							isActive || isHovered ? "text-text" : "text-text-subtle",
						)}
							style={{
								...squircleStyle,
								fontFamily: "'DotGothic16', sans-serif",
							}}
						>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

export default GlassSegmentedControl;
