"use client";

import {
	motion,
	useMotionValue,
	useReducedMotion,
	useSpring,
} from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type {
	CSSProperties,
	KeyboardEvent,
	PointerEvent as ReactPointerEvent,
	ReactNode,
	Ref,
} from "react";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import LiquidGlass, { type LiquidGlassProps } from "./liquid-glass";

const DEFAULT_ELASTICITY = 0.35;
const DEFAULT_MAGNET_DISTANCE = 10;
const DEFAULT_HOVER_AREA = 24;
const DEFAULT_PRESS_SCALE = 0.92;
const BUTTON_RADIUS = 9999;
const MAGNET_SPRING = {
	stiffness: 900,
	damping: 50,
	mass: 0.5,
	restDelta: 0.001,
} as const;
const SCALE_SPRING = {
	stiffness: 700,
	damping: 36,
	mass: 0.32,
} as const;
const BUTTON_POINTER_SMOOTHING_REST_DELTA = 0.01;
export const LIQUID_GLASS_BUTTON_DEFAULT_GLASS_PROPS = {
	borderRadius: BUTTON_RADIUS,
	borderWidth: 0.05,
	brightness: 50,
	opacity: 0.9,
	blur: 4,
	backgroundOpacity: 0.18,
	saturation: 1,
	distortionScale: -40,
	dispersion: 4,
	borderColor: "var(--ds-border)",
	borderOpacity: 1,
	dropShadow: false,
} satisfies Partial<LiquidGlassProps>;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function roundCssNumber(value: number): number {
	return Math.round(value * 1000) / 1000;
}

function getShortestAngleDelta(from: number, to: number): number {
	return ((((to - from) % 360) + 540) % 360) - 180;
}

interface LiquidGlassButtonPointerState {
	angle: number;
	strength: number;
	x: number;
	y: number;
}

function getSmoothedButtonPointerState(
	current: LiquidGlassButtonPointerState,
	target: LiquidGlassButtonPointerState,
	amount: number,
): LiquidGlassButtonPointerState {
	return {
		angle: current.angle + getShortestAngleDelta(current.angle, target.angle) * amount,
		strength: current.strength + (target.strength - current.strength) * amount,
		x: current.x + (target.x - current.x) * amount,
		y: current.y + (target.y - current.y) * amount,
	};
}

function isButtonPointerStateSettled(
	current: LiquidGlassButtonPointerState,
	target: LiquidGlassButtonPointerState,
): boolean {
	return Math.abs(current.x - target.x) < BUTTON_POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(current.y - target.y) < BUTTON_POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(current.strength - target.strength) < BUTTON_POINTER_SMOOTHING_REST_DELTA
		&& Math.abs(getShortestAngleDelta(current.angle, target.angle)) < BUTTON_POINTER_SMOOTHING_REST_DELTA;
}

function getPointerStrength(
	x: number,
	y: number,
	width: number,
	height: number,
	hoverArea: number,
): number {
	if (hoverArea <= 0) {
		return x >= 0 && x <= width && y >= 0 && y <= height ? 1 : 0;
	}
	const edgeDistanceX = x < 0 ? -x : x > width ? x - width : 0;
	const edgeDistanceY = y < 0 ? -y : y > height ? y - height : 0;
	const edgeDistance = Math.hypot(edgeDistanceX, edgeDistanceY);
	return clamp(1 - edgeDistance / hoverArea, 0, 1);
}

function getPointerAngle(x: number, y: number, width: number, height: number): number {
	const dx = x - width / 2;
	const dy = y - height / 2;
	return roundCssNumber(90 + (Math.atan2(dy, dx) * 180) / Math.PI);
}

function setComposedButtonRef(ref: Ref<HTMLButtonElement> | undefined, node: HTMLButtonElement | null) {
	if (!ref) return;
	if (typeof ref === "function") {
		ref(node);
		return;
	}
	ref.current = node;
}

export interface LiquidGlassButtonProps
	extends HTMLMotionProps<"button"> {
	children?: ReactNode;
	glassProps?: Partial<LiquidGlassProps>;
	elasticity?: number;
	magnetDistance?: number;
	hoverArea?: number;
	pointerFill?: boolean;
	pressScale?: number;
}

export function LiquidGlassButton({
	children,
	className,
	ref: externalRef,
	style,
	type = "button",
	disabled = false,
	glassProps,
	elasticity = DEFAULT_ELASTICITY,
	magnetDistance = DEFAULT_MAGNET_DISTANCE,
	hoverArea = DEFAULT_HOVER_AREA,
	pointerFill = true,
	pressScale = DEFAULT_PRESS_SCALE,
	onBlur,
	onKeyDown,
	onKeyUp,
	onPointerDown,
	onPointerLeave,
	onPointerUp,
	onPointerCancel,
	...props
}: Readonly<LiquidGlassButtonProps>) {
	const shouldReduceMotion = useReducedMotion();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const pointerAnimationFrameRef = useRef<number | null>(null);
	const pointerCurrentRef = useRef<LiquidGlassButtonPointerState | null>(null);
	const pointerTargetRef = useRef<LiquidGlassButtonPointerState | null>(null);
	const composedButtonRef = useCallback((node: HTMLButtonElement | null) => {
		buttonRef.current = node;
		setComposedButtonRef(externalRef, node);
	}, [externalRef]);
	const magnetX = useMotionValue(0);
	const magnetY = useMotionValue(0);
	const elasticScaleX = useMotionValue(1);
	const elasticScaleY = useMotionValue(1);
	const springX = useSpring(magnetX, MAGNET_SPRING);
	const springY = useSpring(magnetY, MAGNET_SPRING);
	const springScaleX = useSpring(elasticScaleX, SCALE_SPRING);
	const springScaleY = useSpring(elasticScaleY, SCALE_SPRING);

	const {
		children: glassChildren,
		className: glassClassName,
		style: glassStyle,
		width: glassWidth,
		height: glassHeight,
		mouseContainer: glassMouseContainer = null,
		pointerActivationRadius: glassPointerActivationRadius,
		pointerInput: glassPointerInput = null,
		pointerLayers: glassPointerLayers,
		pointerSmoothing: glassPointerSmoothing,
		...restGlassProps
	} = glassProps ?? {};
	void glassChildren;

	const edgePointerTrackingEnabled = (
		glassPointerInput !== null
			|| (glassPointerLayers !== undefined && glassPointerLayers !== false)
	);
	const edgePointerActivationRadius = glassPointerActivationRadius ?? hoverArea;
	const edgePointerSmoothing = glassPointerSmoothing ?? 1;

	const resetMagnetMotion = useCallback(() => {
		magnetX.set(0);
		magnetY.set(0);
		elasticScaleX.set(1);
		elasticScaleY.set(1);
	}, [elasticScaleX, elasticScaleY, magnetX, magnetY]);

	const writeButtonPointerState = useCallback((state: LiquidGlassButtonPointerState) => {
		const button = buttonRef.current;
		if (!button) return;
		button.style.setProperty("--liquid-glass-button-pointer-x", `${roundCssNumber(state.x)}px`);
		button.style.setProperty("--liquid-glass-button-pointer-y", `${roundCssNumber(state.y)}px`);
		button.style.setProperty("--liquid-glass-button-strength", String(roundCssNumber(state.strength)));
		button.style.setProperty("--liquid-glass-button-angle", `${roundCssNumber(state.angle)}deg`);
	}, []);

	const scheduleButtonPointerState = useCallback((target: LiquidGlassButtonPointerState) => {
		const smoothingAmount = clamp(edgePointerSmoothing, 0.01, 1);
		pointerTargetRef.current = target;

		if (smoothingAmount >= 1) {
			if (pointerAnimationFrameRef.current !== null) {
				cancelAnimationFrame(pointerAnimationFrameRef.current);
				pointerAnimationFrameRef.current = null;
			}
			pointerCurrentRef.current = target;
			writeButtonPointerState(target);
			return;
		}

		if (!pointerCurrentRef.current) {
			pointerCurrentRef.current = target;
			writeButtonPointerState(target);
			return;
		}

		if (pointerAnimationFrameRef.current !== null) return;

		const animatePointer = () => {
			const current = pointerCurrentRef.current;
			const latestTarget = pointerTargetRef.current;
			if (!current || !latestTarget) {
				pointerAnimationFrameRef.current = null;
				return;
			}

			const next = getSmoothedButtonPointerState(current, latestTarget, smoothingAmount);
			const settled = isButtonPointerStateSettled(next, latestTarget);
			const resolvedNext = settled ? latestTarget : next;
			pointerCurrentRef.current = resolvedNext;
			writeButtonPointerState(resolvedNext);
			pointerAnimationFrameRef.current = settled
				? null
				: requestAnimationFrame(animatePointer);
		};

		pointerAnimationFrameRef.current = requestAnimationFrame(animatePointer);
	}, [edgePointerSmoothing, writeButtonPointerState]);

	const setButtonPointerInactive = useCallback(() => {
		const current = pointerCurrentRef.current ?? pointerTargetRef.current;
		if (!current) {
			const button = buttonRef.current;
			if (!button) return;
			button.style.setProperty("--liquid-glass-button-strength", "0");
			return;
		}
		scheduleButtonPointerState({ ...current, strength: 0 });
	}, [scheduleButtonPointerState]);

	const resetMotion = useCallback(() => {
		resetMagnetMotion();
		setButtonPointerInactive();
		const button = buttonRef.current;
		if (!button) return;
		button.style.setProperty("--liquid-glass-button-pressed", "0");
	}, [resetMagnetMotion, setButtonPointerInactive]);

	const updateLocalPointer = useCallback(
		(x: number, y: number, edgeActive: boolean, edgeActivationRadius: number) => {
			const button = buttonRef.current;
			if (!button) return;
			const rect = button.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;

			const angle = getPointerAngle(x, y, rect.width, rect.height);
			const edgeStrength = disabled || !edgeActive
				? 0
				: getPointerStrength(x, y, rect.width, rect.height, edgeActivationRadius);
			const magnetStrength = disabled
				? 0
				: getPointerStrength(x, y, rect.width, rect.height, hoverArea);
			scheduleButtonPointerState({
				angle,
				strength: edgeStrength,
				x,
				y,
			});

			if (disabled || shouldReduceMotion || magnetStrength <= 0) {
				resetMagnetMotion();
				return;
			}

			const normalizedX = clamp((x - rect.width / 2) / (rect.width / 2), -1, 1);
			const normalizedY = clamp((y - rect.height / 2) / (rect.height / 2), -1, 1);
			magnetX.set(normalizedX * magnetDistance * magnetStrength);
			magnetY.set(normalizedY * magnetDistance * magnetStrength);

			const stretchX = Math.abs(normalizedX) * elasticity;
			const stretchY = Math.abs(normalizedY) * elasticity;
			elasticScaleX.set(clamp(1 + stretchX * 0.14 - stretchY * 0.04, 0.92, 1.14));
			elasticScaleY.set(clamp(1 + stretchY * 0.12 - stretchX * 0.06, 0.92, 1.12));
		},
		[
			disabled,
			elasticScaleX,
			elasticScaleY,
			elasticity,
			hoverArea,
			magnetDistance,
			magnetX,
			magnetY,
			resetMagnetMotion,
			scheduleButtonPointerState,
			shouldReduceMotion,
		],
	);

	const updatePointer = useCallback(
		(clientX: number, clientY: number, edgeActive: boolean, edgeActivationRadius: number) => {
			const button = buttonRef.current;
			if (!button) return;
			const rect = button.getBoundingClientRect();
			updateLocalPointer(
				clientX - rect.left,
				clientY - rect.top,
				edgeActive,
				edgeActivationRadius,
			);
		},
		[updateLocalPointer],
	);

	const setPressed = useCallback((pressed: boolean) => {
		buttonRef.current?.style.setProperty(
			"--liquid-glass-button-pressed",
			pressed ? "1" : "0",
		);
	}, []);

	useEffect(() => {
		if (disabled) {
			resetMotion();
			return;
		}
		if (edgePointerTrackingEnabled) return;
		const handlePointerMove = (event: PointerEvent) => {
			updatePointer(event.clientX, event.clientY, true, hoverArea);
		};
		document.addEventListener("pointermove", handlePointerMove, { passive: true });
		return () => {
			document.removeEventListener("pointermove", handlePointerMove);
		};
	}, [disabled, edgePointerTrackingEnabled, hoverArea, resetMotion, updatePointer]);

	useEffect(() => {
		if (disabled || !edgePointerTrackingEnabled || !glassPointerInput) return;
		const active = glassPointerInput.active ?? true;
		if (glassPointerInput.kind === "local") {
			updateLocalPointer(
				glassPointerInput.x,
				glassPointerInput.y,
				active,
				edgePointerActivationRadius,
			);
		} else {
			updatePointer(
				glassPointerInput.x,
				glassPointerInput.y,
				active,
				edgePointerActivationRadius,
			);
		}
	}, [
		disabled,
		edgePointerActivationRadius,
		edgePointerTrackingEnabled,
		glassPointerInput,
		updateLocalPointer,
		updatePointer,
	]);

	useEffect(() => {
		if (disabled || !edgePointerTrackingEnabled || glassPointerInput) return;
		const target = glassMouseContainer?.current ?? buttonRef.current;
		if (!target) return;

		const handlePointerMove = (event: PointerEvent) => {
			updatePointer(event.clientX, event.clientY, true, edgePointerActivationRadius);
		};
		target.addEventListener("pointermove", handlePointerMove, { passive: true });
		target.addEventListener("pointerleave", setButtonPointerInactive);
		return () => {
			target.removeEventListener("pointermove", handlePointerMove);
			target.removeEventListener("pointerleave", setButtonPointerInactive);
		};
	}, [
		disabled,
		edgePointerActivationRadius,
		edgePointerTrackingEnabled,
		glassMouseContainer,
		glassPointerInput,
		setButtonPointerInactive,
		updatePointer,
	]);

	useEffect(() => {
		return () => {
			if (pointerAnimationFrameRef.current === null) return;
			cancelAnimationFrame(pointerAnimationFrameRef.current);
		};
	}, []);

	const motionStyle = {
		...style,
		x: springX,
		y: springY,
		scaleX: springScaleX,
		scaleY: springScaleY,
		"--liquid-glass-button-pointer-x": "50%",
		"--liquid-glass-button-pointer-y": "50%",
		"--liquid-glass-button-strength": "0",
		"--liquid-glass-button-pressed": "0",
		"--liquid-glass-button-angle": "135deg",
	};

	return (
		<motion.button
			ref={composedButtonRef}
			type={type}
			disabled={disabled}
			whileTap={disabled || shouldReduceMotion ? undefined : { scale: pressScale }}
			transition={MAGNET_SPRING}
			className={cn(
				"relative isolate inline-flex h-10 min-w-24 items-center justify-center overflow-hidden rounded-full border border-transparent px-4",
				"text-sm font-medium text-text outline-none transition-colors duration-normal ease-out",
				"whitespace-nowrap",
				"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3",
				"disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
				className,
			)}
			style={motionStyle}
			onBlur={(event) => {
				resetMotion();
				onBlur?.(event);
			}}
			onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
				if (event.key === " " || event.key === "Enter") {
					setPressed(true);
				}
				onKeyDown?.(event);
			}}
			onKeyUp={(event: KeyboardEvent<HTMLButtonElement>) => {
				if (event.key === " " || event.key === "Enter") {
					setPressed(false);
				}
				onKeyUp?.(event);
			}}
			onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
				setPressed(true);
				onPointerDown?.(event);
			}}
			onPointerLeave={(event: ReactPointerEvent<HTMLButtonElement>) => {
				if (edgePointerTrackingEnabled) {
					resetMagnetMotion();
				} else {
					resetMotion();
				}
				onPointerLeave?.(event);
			}}
			onPointerUp={(event: ReactPointerEvent<HTMLButtonElement>) => {
				setPressed(false);
				onPointerUp?.(event);
			}}
			onPointerCancel={(event: ReactPointerEvent<HTMLButtonElement>) => {
				resetMotion();
				onPointerCancel?.(event);
			}}
			{...props}
		>
			<LiquidGlass
				{...LIQUID_GLASS_BUTTON_DEFAULT_GLASS_PROPS}
				{...restGlassProps}
				mouseContainer={glassMouseContainer}
				pointerActivationRadius={glassPointerActivationRadius}
				pointerInput={glassPointerInput}
				pointerLayers={glassPointerLayers}
				pointerSmoothing={glassPointerSmoothing}
				width={glassWidth ?? "100%"}
				height={glassHeight ?? "100%"}
				className={cn("pointer-events-none absolute inset-0", glassClassName)}
				style={{
					borderRadius: BUTTON_RADIUS,
					zIndex: 0,
					...glassStyle,
				} as CSSProperties}
			/>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-fast ease-out"
				style={{
					background:
						"color-mix(in srgb, var(--ds-surface-overlay) 70%, transparent)",
					opacity:
						pointerFill
							? "calc(var(--liquid-glass-button-strength, 0) * 0.14 + var(--liquid-glass-button-pressed, 0) * 0.12)"
							: "calc(var(--liquid-glass-button-pressed, 0) * 0.12)",
					zIndex: 1,
				}}
			/>
			<span
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 rounded-[inherit]"
				style={{
					padding: 1.5,
					background:
						"linear-gradient(var(--liquid-glass-button-angle, 135deg), transparent 0%, color-mix(in srgb, var(--ds-surface-overlay) 52%, var(--ds-text-inverse) 48%) 42%, transparent 72%)",
					opacity:
						"calc(var(--liquid-glass-button-strength, 0) * 0.48 + var(--liquid-glass-button-pressed, 0) * 0.18)",
					transition: "opacity 160ms ease-out",
					WebkitMask:
						"linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
					WebkitMaskComposite: "xor",
					maskComposite: "exclude",
					zIndex: 2,
				}}
			/>
			<span className="relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap">
				{children}
			</span>
		</motion.button>
	);
}
