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
const DEFAULT_BUTTON_GLASS_PROPS: Partial<LiquidGlassProps> = {
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
};

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function roundCssNumber(value: number): number {
	return Math.round(value * 1000) / 1000;
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

	const resetMotion = useCallback(() => {
		magnetX.set(0);
		magnetY.set(0);
		elasticScaleX.set(1);
		elasticScaleY.set(1);
		const button = buttonRef.current;
		if (!button) return;
		button.style.setProperty("--liquid-glass-button-strength", "0");
		button.style.setProperty("--liquid-glass-button-pressed", "0");
	}, [elasticScaleX, elasticScaleY, magnetX, magnetY]);

	const updatePointer = useCallback(
		(clientX: number, clientY: number) => {
			const button = buttonRef.current;
			if (!button) return;
			const rect = button.getBoundingClientRect();
			if (rect.width <= 0 || rect.height <= 0) return;

			const x = clientX - rect.left;
			const y = clientY - rect.top;
			const strength = disabled
				? 0
				: getPointerStrength(x, y, rect.width, rect.height, hoverArea);
			button.style.setProperty("--liquid-glass-button-pointer-x", `${roundCssNumber(x)}px`);
			button.style.setProperty("--liquid-glass-button-pointer-y", `${roundCssNumber(y)}px`);
			button.style.setProperty("--liquid-glass-button-strength", String(roundCssNumber(strength)));
			button.style.setProperty("--liquid-glass-button-angle", `${getPointerAngle(x, y, rect.width, rect.height)}deg`);

			if (disabled || shouldReduceMotion || strength <= 0) {
				magnetX.set(0);
				magnetY.set(0);
				elasticScaleX.set(1);
				elasticScaleY.set(1);
				return;
			}

			const normalizedX = clamp((x - rect.width / 2) / (rect.width / 2), -1, 1);
			const normalizedY = clamp((y - rect.height / 2) / (rect.height / 2), -1, 1);
			magnetX.set(normalizedX * magnetDistance * strength);
			magnetY.set(normalizedY * magnetDistance * strength);

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
			shouldReduceMotion,
		],
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
		const handlePointerMove = (event: PointerEvent) => {
			updatePointer(event.clientX, event.clientY);
		};
		document.addEventListener("pointermove", handlePointerMove, { passive: true });
		return () => {
			document.removeEventListener("pointermove", handlePointerMove);
		};
	}, [disabled, resetMotion, updatePointer]);

	const {
		children: glassChildren,
		className: glassClassName,
		style: glassStyle,
		width: glassWidth,
		height: glassHeight,
		...restGlassProps
	} = glassProps ?? {};
	void glassChildren;

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
				resetMotion();
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
				{...DEFAULT_BUTTON_GLASS_PROPS}
				{...restGlassProps}
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
						"calc(var(--liquid-glass-button-strength, 0) * 0.14 + var(--liquid-glass-button-pressed, 0) * 0.12)",
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
