"use client";

import {
	animate,
	useMotionValue,
	useReducedMotion,
	useSpring,
	useTransform,
} from "motion/react";
import {
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import type {
	CSSProperties,
	KeyboardEvent,
	PointerEvent as ReactPointerEvent,
} from "react";

import type { LiquidGlassProps } from "@/components/website/demos/visual/shaders/liquid-glass";
import {
	formatCornerShapeSuperellipse,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
} from "@/components/website/demos/visual/shaders/squircle-shape";
import { ROVO_COLOR_SWATCHES } from "@/lib/rovo-colors";

interface SegmentRect {
	left: number;
	width: number;
}

interface GlassTabsOptionShape<TValue extends string> {
	value: TValue;
	label: string;
}

interface UseGlassTabsMotionProps<TValue extends string> {
	options: ReadonlyArray<GlassTabsOptionShape<TValue>>;
	value: TValue;
	onChange: (value: TValue) => void;
	onHover?: (value: TValue) => void;
	keyboardSelectionPulseKey: number;
}

const SQUIRCLE_BORDER_RADIUS = 9999;
const SQUIRCLE_CORNER_SHAPE = formatCornerShapeSuperellipse(
	SQUIRCLE_DEFAULT_SMOOTHNESS,
);

export const GLASS_TABS_SQUIRCLE_STYLE = {
	borderRadius: SQUIRCLE_BORDER_RADIUS,
	cornerShape: SQUIRCLE_CORNER_SHAPE,
} as CSSProperties & { cornerShape: string };

export const GLASS_TABS_SHELL_GLASS_PROPS: Partial<LiquidGlassProps> = {
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

export const GLASS_TABS_PILL_GLASS_PROPS: Partial<LiquidGlassProps> = {
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

export const GLASS_TABS_PILL_TINT_GRADIENT = `linear-gradient(90deg, ${ROVO_COLOR_SWATCHES[0].hex}38 0%, ${ROVO_COLOR_SWATCHES[1].hex}30 35%, ${ROVO_COLOR_SWATCHES[2].hex}30 70%, ${ROVO_COLOR_SWATCHES[3].hex}38 100%)`;

// Spring used for both the leading-edge dash and the trailing-edge
// settle of the rainbow committed pill. Tuned for a fast, near-
// critically-damped chase: damping ratio ≈ 0.85 (damping 30 /
// 2·√(stiffness·mass) = 30 / 2·√(700·0.32) ≈ 1.0) so the pill snaps
// to its target in ~120ms with a hint of give but no visible bounce.
// Two-stage commit (dash + settle) means total motion ≈ 200ms — fast
// enough to feel direct, slow enough to read the elastic stretch.
const SPRING = {
	type: "spring" as const,
	stiffness: 700,
	damping: 38,
	mass: 0.32,
};

// Keyboard-driven selection should read as a crisp tab step rather than
// a long elastic sweep, so we tighten both the spring and stretch budget.
const KEYBOARD_SPRING = {
	type: "spring" as const,
	stiffness: 900,
	damping: 42,
	mass: 0.28,
};

const MAX_STRETCH_PX = 16;
const PILL_STRETCH_RATIO = 0.18;
const KEYBOARD_MAX_STRETCH_PX = 8;
const KEYBOARD_STRETCH_RATIO = 0.06;
const MAX_SHELL_STRETCH_PX = 32;
const MAX_SHELL_THIN_RATIO = 0.14;
const EDGE_PILL_STRETCH_FOLLOW_RATIO = 0.94;

function getEdgeFollowerLeft(
	baseLeft: number,
	stretch: number,
	index: number | null,
): number {
	if (index === 0 && stretch < 0) {
		return baseLeft + stretch * EDGE_PILL_STRETCH_FOLLOW_RATIO;
	}
	return baseLeft;
}

function getEdgeFollowerWidth(
	baseWidth: number,
	stretch: number,
	index: number | null,
	lastIndex: number,
): number {
	if (index === 0 && stretch < 0) {
		return baseWidth + Math.abs(stretch) * EDGE_PILL_STRETCH_FOLLOW_RATIO;
	}
	if (index === lastIndex && stretch > 0) {
		return baseWidth + stretch * EDGE_PILL_STRETCH_FOLLOW_RATIO;
	}
	return baseWidth;
}

// Reverse-engineered from the "Magnetic Hover" component shipped on
// magnet.learnframer.site (chunk-ND35KM2X.mjs).
const MAGNET_PARENT_DISTANCE = 10;
const MAGNET_LABEL_DISTANCE = 6;
const MAGNET_HOVER_AREA = 24;
const MAGNET_LABEL_RATIO = MAGNET_LABEL_DISTANCE / MAGNET_PARENT_DISTANCE;
const MAGNET_SPRING = {
	damping: 50,
	stiffness: 900,
	mass: 0.5,
	restDelta: 0.001,
} as const;

export function getGlassTabsKeyboardIndex(
	key: string,
	index: number,
	optionsLength: number,
): number | null {
	const lastIndex = optionsLength - 1;
	if (lastIndex < 0) return null;

	switch (key) {
		case "ArrowRight":
		case "ArrowDown":
			return Math.min(index + 1, lastIndex);
		case "ArrowLeft":
		case "ArrowUp":
			return Math.max(index - 1, 0);
		case "Home":
			return 0;
		case "End":
			return lastIndex;
		default:
			return null;
	}
}

export function useGlassTabsMotion<TValue extends string>({
	options,
	value,
	onChange,
	onHover,
	keyboardSelectionPulseKey,
}: Readonly<UseGlassTabsMotionProps<TValue>>) {
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
	const lastIndex = options.length - 1;

	// Refs so useTransform callbacks can read current index without
	// stale closures (MotionValue-driven, runs every frame).
	const selectedIndexRef = useRef(selectedIndex);
	selectedIndexRef.current = selectedIndex;
	const hoveredIndexRef = useRef(hoveredIndex);
	hoveredIndexRef.current = hoveredIndex;
	// Mirror the latest measured segments so animation `onComplete`
	// callbacks (chained settles after the stretch overshoot) can read
	// the freshest layout values instead of the stale closure capture
	// from when the effect ran. Fixes the "rainbow pill stuck at the
	// stretched-out coordinates" bug that surfaces when fonts finish
	// loading or the container resizes mid-animation.
	const segmentsRef = useRef<SegmentRect[]>(segments);
	segmentsRef.current = segments;

	const pillLeft = useMotionValue(0);
	const pillWidth = useMotionValue(0);
	const hoverPillLeft = useMotionValue(0);
	const hoverPillWidth = useMotionValue(0);
	const hoverPillOpacity = useMotionValue(0);

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

	// The selection pill stretches in sync with the shell only when the
	// selected tab is at the edge — first tab stretches left with the
	// shell, last tab stretches right. Middle tabs stay put.
	const pillDisplayLeft = useTransform(() => {
		return getEdgeFollowerLeft(
			pillLeft.get(),
			shellStretch.get(),
			selectedIndexRef.current,
		);
	});
	const pillDisplayWidth = useTransform(() => {
		return getEdgeFollowerWidth(
			pillWidth.get(),
			shellStretch.get(),
			selectedIndexRef.current,
			lastIndex,
		);
	});

	const hoverPillDisplayLeft = useTransform(() => {
		return getEdgeFollowerLeft(
			hoverPillLeft.get(),
			shellStretch.get(),
			hoveredIndexRef.current,
		);
	});
	const hoverPillDisplayWidth = useTransform(() => {
		return getEdgeFollowerWidth(
			hoverPillWidth.get(),
			shellStretch.get(),
			hoveredIndexRef.current,
			lastIndex,
		);
	});

	const parentMagnetX = useMotionValue(0);
	const parentMagnetY = useMotionValue(0);
	const parentSpringX = useSpring(parentMagnetX, MAGNET_SPRING);
	const parentSpringY = useSpring(parentMagnetY, MAGNET_SPRING);
	const labelMagnetX = useTransform(
		parentSpringX,
		(nextValue) => nextValue * MAGNET_LABEL_RATIO,
	);
	const labelMagnetY = useTransform(
		parentSpringY,
		(nextValue) => nextValue * MAGNET_LABEL_RATIO,
	);

	const leftAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const widthAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const shellAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const hoverLeftAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const hoverWidthAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const hoverOpacityAnimRef = useRef<ReturnType<typeof animate> | null>(null);
	const selectionInputModeRef = useRef<"pointer" | "keyboard">("pointer");
	const previousKeyboardSelectionPulseKeyRef = useRef(
		keyboardSelectionPulseKey,
	);

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

	const measure = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;
		const containerRect = container.getBoundingClientRect();
		// Normalize screen-space rects against any ancestor scale
		// transform so the values match the container's layout space
		// (where CSS `left` and `width` operate).
		const scale =
			container.offsetWidth > 0
				? containerRect.width / container.offsetWidth
				: 1;
		const nextSegments: SegmentRect[] = buttonRefs.current.map((button) => {
			if (!button) return { left: 0, width: 0 };
			const rect = button.getBoundingClientRect();
			return {
				left: (rect.left - containerRect.left) / scale,
				width: rect.width / scale,
			};
		});
		setSegments(nextSegments);
	}, []);

	useLayoutEffect(() => {
		measure();
	}, [measure, options.length]);

	useEffect(() => {
		if (
			keyboardSelectionPulseKey === previousKeyboardSelectionPulseKeyRef.current
		) {
			return;
		}
		previousKeyboardSelectionPulseKeyRef.current = keyboardSelectionPulseKey;
		selectionInputModeRef.current = "keyboard";
	}, [keyboardSelectionPulseKey]);

	useEffect(() => {
		if (typeof ResizeObserver === "undefined") return;
		const container = containerRef.current;
		if (!container) return;
		const resizeObserver = new ResizeObserver(() => {
			measure();
		});
		resizeObserver.observe(container);
		buttonRefs.current.forEach((button) => {
			if (button) {
				resizeObserver.observe(button);
			}
		});
		// Re-measure after web fonts finish loading — DotGothic16 may
		// arrive after the initial layout measurement, shifting button
		// widths and invalidating the pill position.
		document.fonts.ready.then(() => measure());
		return () => resizeObserver.disconnect();
	}, [measure, options.length]);

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
		}
	}, [
		segments,
		selectedIndex,
		pillLeft,
		pillWidth,
		hoverPillLeft,
		hoverPillWidth,
	]);

	const previousSelectedIndexRef = useRef(selectedIndex);
	useEffect(() => {
		const target = segments[selectedIndex];
		if (!target || target.width <= 0) return;

		const previousIndex = previousSelectedIndexRef.current;
		previousSelectedIndexRef.current = selectedIndex;

		if (previousIndex === selectedIndex) {
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
			// Clear refs when the keyboard animation finishes so the
			// self-correcting effect can re-assert if segments change
			// after the animation settles.
			const keyboardOptions = {
				...motionSpring,
				onComplete: () => {
					leftAnimRef.current = null;
					widthAnimRef.current = null;
				},
			};
			leftAnimRef.current = animate(pillLeft, target.left, keyboardOptions);
			widthAnimRef.current = animate(pillWidth, target.width, keyboardOptions);
			return;
		}

		const targetLeft = target.left;
		const movingRight = selectedIndex > previousIndex;
		const stretch = Math.min(stretchCap, target.width * stretchRatio);
		const stretchedWidth = target.width + stretch;
		const stretchedLeft = movingRight ? targetLeft - stretch : targetLeft;

		leftAnimRef.current = animate(pillLeft, stretchedLeft, motionSpring);
		widthAnimRef.current = animate(pillWidth, stretchedWidth, {
			...motionSpring,
			onComplete: () => {
				// Re-read the freshest segments via ref instead of the
				// closure-captured `target` so a font-load or container
				// resize that fired during the stretch animation gets
				// reflected in the settle. Without this the pill could
				// settle to stale stretched-coordinates and visually
				// drift off the selected tab.
				const latest = segmentsRef.current[selectedIndexRef.current];
				if (!latest || latest.width <= 0) {
					// Mark the chain finished so the self-correcting
					// effect can take over on the next segments update.
					leftAnimRef.current = null;
					widthAnimRef.current = null;
					return;
				}
				// Clear refs when the settle finishes naturally so the
				// self-correcting effect (which checks `isAnimating`)
				// can re-assert if segments change after the settle.
				const settleOptions = {
					...motionSpring,
					onComplete: () => {
						leftAnimRef.current = null;
						widthAnimRef.current = null;
					},
				};
				leftAnimRef.current = animate(pillLeft, latest.left, settleOptions);
				widthAnimRef.current = animate(
					pillWidth,
					latest.width,
					settleOptions,
				);
			},
		});
	}, [
		keyboardSelectionPulseKey,
		segments,
		selectedIndex,
		pillLeft,
		pillWidth,
		shouldReduceMotion,
		stopAnims,
	]);

	// Self-correcting safety net: whenever segments change AND no
	// selection animation is currently in flight, re-assert the pill at
	// the latest measured position for the selected tab. This catches
	// edge cases where the chained stretch+settle was interrupted (e.g.
	// rapid clicks, parent re-render, font-load mid-animation) and the
	// pill ended up stranded at stretched-out coordinates instead of
	// converging on the target tab.
	useEffect(() => {
		const target = segments[selectedIndex];
		if (!target || target.width <= 0) return;
		const isAnimating =
			leftAnimRef.current !== null || widthAnimRef.current !== null;
		if (isAnimating) return;
		// Compare against current motion values to avoid no-op writes
		// (which would still trigger downstream subscribers).
		const epsilon = 0.5;
		if (
			Math.abs(pillLeft.get() - target.left) > epsilon ||
			Math.abs(pillWidth.get() - target.width) > epsilon
		) {
			pillLeft.set(target.left);
			pillWidth.set(target.width);
		}
	}, [segments, selectedIndex, pillLeft, pillWidth]);

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
			return;
		}

		if (shouldReduceMotion) {
			hoverPillOpacity.jump(0);
			return;
		}
		hoverOpacityAnimRef.current = animate(hoverPillOpacity, 0, {
			duration: 0.15,
		});
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

	useEffect(() => {
		if (shouldReduceMotion) {
			parentMagnetX.set(0);
			parentMagnetY.set(0);
			return;
		}
		if (typeof document === "undefined") return;

		const handleMove = (event: MouseEvent) => {
			const element = containerRef.current;
			if (!element) return;
			const rect = element.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;

			const inActivation =
				event.clientX >= rect.left - MAGNET_HOVER_AREA &&
				event.clientX <= rect.right + MAGNET_HOVER_AREA &&
				event.clientY >= rect.top - MAGNET_HOVER_AREA &&
				event.clientY <= rect.bottom + MAGNET_HOVER_AREA;

			if (inActivation) {
				const dx = event.clientX - (rect.left + rect.width / 2);
				const dy = event.clientY - (rect.top + rect.height / 2);
				parentMagnetX.set(
					(dx / (rect.width / 2)) * MAGNET_PARENT_DISTANCE,
				);
				parentMagnetY.set(
					(dy / (rect.height / 2)) * MAGNET_PARENT_DISTANCE,
				);
				return;
			}

			parentMagnetX.set(0);
			parentMagnetY.set(0);
		};

		document.addEventListener("mousemove", handleMove, { passive: true });
		return () => {
			document.removeEventListener("mousemove", handleMove);
			parentMagnetX.set(0);
			parentMagnetY.set(0);
		};
	}, [shouldReduceMotion, parentMagnetX, parentMagnetY]);

	useEffect(
		() => () => {
			stopAnims();
			stopHoverAnims();
		},
		[stopAnims, stopHoverAnims],
	);

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
				Math.min(
					MAX_SHELL_STRETCH_PX,
					Math.abs(ratio) * MAX_SHELL_STRETCH_PX,
				);
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
		(option: GlassTabsOptionShape<TValue>) => {
			if (option.value === value) return;
			onChange(option.value);
		},
		[onChange, value],
	);

	const focusIndex = useCallback((index: number) => {
		const button = buttonRefs.current[index];
		button?.focus();
	}, []);

	const handleOptionKeyDown = useCallback(
		(event: KeyboardEvent<HTMLButtonElement>, index: number) => {
			const nextIndex = getGlassTabsKeyboardIndex(
				event.key,
				index,
				options.length,
			);

			if (nextIndex == null) return;
			event.preventDefault();
			selectionInputModeRef.current = "keyboard";
			focusIndex(nextIndex);
			handleSelect(options[nextIndex]);
		},
		[focusIndex, handleSelect, options],
	);

	return {
		containerRef,
		groupId,
		handleContainerPointerMove,
		handleContainerPointerLeave: () => {
			setHoveredIndex(null);
			settleShell();
		},
		handleOptionClick: (option: GlassTabsOptionShape<TValue>) => {
			selectionInputModeRef.current = "pointer";
			handleSelect(option);
		},
		handleOptionKeyDown,
		handleOptionPointerEnter: (index: number) => {
			setHoveredIndex(index);
			if (onHover && index !== selectedIndex) {
				onHover(options[index].value);
			}
		},
		hoverPillLeft: hoverPillDisplayLeft,
		hoverPillOpacity,
		hoverPillWidth: hoverPillDisplayWidth,
		hoveredIndex,
		labelMagnetX,
		labelMagnetY,
		parentSpringX,
		parentSpringY,
		pillLeft: pillDisplayLeft,
		pillWidth: pillDisplayWidth,
		selectedIndex,
		setButtonRef: (index: number, node: HTMLButtonElement | null) => {
			buttonRefs.current[index] = node;
		},
		shellStretch,
		shellOffsetX,
		shellScaleY,
		shellWidth,
	};
}
