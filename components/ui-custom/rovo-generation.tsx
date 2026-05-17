"use client";

import { animate, motion, useMotionValue, useReducedMotion, type Transition } from "motion/react";
import { useEffect, useRef } from "react";
import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

const ROVO_GENERATION_GRADIENT =
	"conic-gradient(from 90deg, #fca700 0deg 73deg, #6a9a23 73deg 168deg, #1868db 168deg 253deg, #af59e0 253deg 360deg)";

const LINEAR_EASE: [number, number, number, number] = [0, 0, 1, 1];
const ACTIVE_ROTATION_DURATION = 1.6;
const ACTIVE_STATE_TRANSITION_DURATION = 0.24;
const INACTIVE_STATE_TRANSITION_DURATION = 0.28;

export interface RovoGenerationRootProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
	/** Width and height of the generated tile in pixels. @default 100 */
	size?: number;
	/** Rounded corner radius in pixels. @default 12 */
	radius?: number;
	/** Enable the blurred conic rainbow glow during generation. @default false */
	glow?: boolean;
	/** Enable the conic rainbow border during generation. @default false */
	border?: boolean;
	/** Whether the tile is currently generating. When omitted, enabled effects render statically. */
	generating?: boolean;
	/** Animate the rainbow layers with Motion while generating. @default true */
	animated?: boolean;
	/** Duration of the generating state in seconds. @default 4 */
	duration?: number;
	/** Called after the generating duration elapses. */
	onGenerationComplete?: () => void;
	/** Rainbow border thickness in pixels. @default 1 */
	borderWidth?: number;
	/** Glow blur radius in pixels. @default 16 */
	glowBlur?: number;
	/** Glow opacity from 0 to 1. @default 0.35 */
	glowOpacity?: number;
	/** Additional classes applied to the root element. */
	className?: string;
	/** Inline styles merged onto the root element. */
	style?: CSSProperties;
	children?: ReactNode;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function RovoGenerationGradientLayer({
	active,
	animated,
	opacity,
	className,
	style,
}: Readonly<{
	active: boolean;
	animated: boolean;
	opacity: number;
	className?: string;
	style?: CSSProperties;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const shouldAnimateTransform = animated && !shouldReduceMotion;
	const shouldAnimate = active && shouldAnimateTransform;
	const rotate = useMotionValue(0);
	const fadeForwardControlsRef = useRef<ReturnType<typeof animate> | null>(null);
	const opacityTransition: Transition = {
		opacity: {
			duration: active ? ACTIVE_STATE_TRANSITION_DURATION : INACTIVE_STATE_TRANSITION_DURATION,
			ease: LINEAR_EASE,
		},
	};

	useEffect(() => {
		fadeForwardControlsRef.current?.stop();

		if (!shouldAnimate) return;

		let cancelled = false;

		async function loopRotation() {
			while (!cancelled) {
				await animate(rotate, rotate.get() + 360, {
					duration: ACTIVE_ROTATION_DURATION,
					ease: LINEAR_EASE,
				});

				if (!cancelled) {
					rotate.set(rotate.get() % 360);
				}
			}
		}

		void loopRotation();

		return () => {
			cancelled = true;
			rotate.stop();
			fadeForwardControlsRef.current?.stop();
			fadeForwardControlsRef.current = animate(
				rotate,
				rotate.get() + 360 * (INACTIVE_STATE_TRANSITION_DURATION / ACTIVE_ROTATION_DURATION),
				{
					duration: INACTIVE_STATE_TRANSITION_DURATION,
					ease: LINEAR_EASE,
				},
			);
		};
	}, [rotate, shouldAnimate]);

	return (
		<motion.div
			aria-hidden="true"
			animate={
				active
					? {
							opacity,
						}
					: {
							opacity: 0,
						}
			}
			className={cn("absolute", className)}
			initial={{ opacity: 0 }}
			style={{
				background: ROVO_GENERATION_GRADIENT,
				rotate,
				willChange: shouldAnimateTransform ? "transform" : undefined,
				...style,
			}}
			transition={opacityTransition}
		/>
	);
}

function RovoGenerationRoot({
	size = 100,
	radius = 12,
	glow = false,
	border = false,
	generating,
	animated = true,
	duration = 4,
	onGenerationComplete,
	borderWidth = 1,
	glowBlur = 16,
	glowOpacity = 0.35,
	className,
	style,
	children,
	...props
}: Readonly<RovoGenerationRootProps>) {
	const normalizedSize = Math.max(24, size);
	const normalizedRadius = Math.max(0, radius);
	const normalizedBorderWidth = clamp(borderWidth, 1, Math.max(1, normalizedSize / 4));
	const normalizedGlowBlur = Math.max(0, glowBlur);
	const normalizedGlowOpacity = clamp(glowOpacity, 0, 1);
	const normalizedDuration = Math.max(0.5, duration);
	const effectsActive = typeof generating === "boolean" ? generating : true;

	useEffect(() => {
		if (!generating || !onGenerationComplete) return;
		const timeoutId = window.setTimeout(onGenerationComplete, normalizedDuration * 1000);
		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [generating, normalizedDuration, onGenerationComplete]);

	return (
		<div
			data-rovo-generation="root"
			data-rovo-generation-border={border ? "true" : "false"}
			data-rovo-generation-generating={effectsActive ? "true" : "false"}
			data-rovo-generation-glow={glow ? "true" : "false"}
			{...props}
			className={cn(
				"relative isolate inline-flex shrink-0 items-center justify-center overflow-visible",
				className,
			)}
			style={{
				"--rovo-generation-size": `${normalizedSize}px`,
				"--rovo-generation-radius": `${normalizedRadius}px`,
				"--rovo-generation-border-width": `${normalizedBorderWidth}px`,
				"--rovo-generation-glow-blur": `${normalizedGlowBlur}px`,
				"--rovo-generation-glow-opacity": normalizedGlowOpacity,
				width: "var(--rovo-generation-size)",
				height: "var(--rovo-generation-size)",
				borderRadius: "var(--rovo-generation-radius)",
				...style,
			} as CSSProperties}
		>
			{glow ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[var(--rovo-generation-radius)]"
					style={{ filter: "blur(var(--rovo-generation-glow-blur))" }}
				>
					<RovoGenerationGradientLayer
						active={effectsActive}
						animated={animated}
						opacity={normalizedGlowOpacity}
						className="inset-0"
					/>
				</div>
			) : null}
			<div className="absolute inset-0 rounded-[var(--rovo-generation-radius)] border border-border bg-surface" />
			{border ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 overflow-hidden rounded-[var(--rovo-generation-radius)]"
				>
					<RovoGenerationGradientLayer
						active={effectsActive}
						animated={animated}
						opacity={1}
						className="left-1/2 top-1/2 aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2"
					/>
					<div className="absolute rounded-[calc(var(--rovo-generation-radius)-var(--rovo-generation-border-width))] bg-surface inset-[var(--rovo-generation-border-width)]" />
				</div>
			) : null}
			<div className="relative z-10 flex size-full items-center justify-center overflow-hidden rounded-[var(--rovo-generation-radius)]">
				{children}
			</div>
		</div>
	);
}

export const RovoGeneration = {
	/** Tile surface with optional animated rainbow glow and border. */
	Root: RovoGenerationRoot,
} as const;
