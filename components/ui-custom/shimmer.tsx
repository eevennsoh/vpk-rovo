"use client";

import type { MotionProps, Transition } from "motion/react";
import type { CSSProperties, ElementType, JSX } from "react";

import { resolveWaveHighlightColor } from "@/components/ui-custom/lib/shimmer-colors";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { memo, useMemo } from "react";

type MotionHTMLProps = MotionProps & Record<string, unknown>;

// Cache motion components at module level to avoid creating during render
const motionComponentCache = new Map<
  keyof JSX.IntrinsicElements,
  React.ComponentType<MotionHTMLProps>
>();

const getMotionComponent = (element: keyof JSX.IntrinsicElements) => {
  let component = motionComponentCache.get(element);
  if (!component) {
    component = motion.create(element);
    motionComponentCache.set(element, component);
  }
  return component;
};

const WAVE_REPEAT_DELAY_FACTOR = 0.05;
const DEFAULT_SHIMMER_DURATION = 2;
const DEFAULT_SHIMMER_SPREAD = 2;
const DEFAULT_WAVE_DURATION = 1;
const DEFAULT_WAVE_SPREAD = 1;
const DEFAULT_WAVE_Z_DISTANCE = 10;
const DEFAULT_WAVE_X_DISTANCE = 2;
const DEFAULT_WAVE_Y_DISTANCE = -2;
const DEFAULT_WAVE_SCALE_DISTANCE = 1.1;
const DEFAULT_WAVE_ROTATE_Y_DISTANCE = 10;
const DEFAULT_WAVE_HIGHLIGHT_OPACITY = 0.88;

export interface TextShimmerProps {
	children: string;
	as?: ElementType;
	className?: string;
	duration?: number;
	spread?: number;
	wave?: boolean;
	zDistance?: number;
	xDistance?: number;
	yDistance?: number;
	scaleDistance?: number;
	rotateYDistance?: number;
	transition?: Transition;
	baseColor?: string;
	baseGradientColor?: string | readonly string[];
}

const ShimmerComponent = ({
	children,
	as: Component = "p",
	className,
	duration,
	spread,
	wave = false,
	zDistance = DEFAULT_WAVE_Z_DISTANCE,
	xDistance = DEFAULT_WAVE_X_DISTANCE,
	yDistance = DEFAULT_WAVE_Y_DISTANCE,
	scaleDistance = DEFAULT_WAVE_SCALE_DISTANCE,
	rotateYDistance = DEFAULT_WAVE_ROTATE_Y_DISTANCE,
	transition,
	baseColor,
	baseGradientColor,
}: TextShimmerProps) => {
	const MotionComponent = getMotionComponent(
		Component as keyof JSX.IntrinsicElements
	);
	const shouldReduceMotion = useReducedMotion();
	const isWaveEnabled = wave && !shouldReduceMotion && children.length > 0;
	const resolvedDuration =
		duration ?? (isWaveEnabled ? DEFAULT_WAVE_DURATION : DEFAULT_SHIMMER_DURATION);
	const resolvedSpread =
		spread ?? (isWaveEnabled ? DEFAULT_WAVE_SPREAD : DEFAULT_SHIMMER_SPREAD);
	const dynamicSpread = useMemo(
		() => (children?.length ?? 0) * resolvedSpread,
		[children, resolvedSpread]
	);
	const characters = useMemo(
		() => (isWaveEnabled ? children.split("") : []),
		[children, isWaveEnabled]
	);
	const repeatDelay = useMemo(
		() =>
			(characters.length * WAVE_REPEAT_DELAY_FACTOR) /
			Math.max(resolvedSpread, 1),
		[characters.length, resolvedSpread]
	);
	const resolvedBaseColor = baseColor ?? "var(--color-muted-foreground)";
	const resolvedBaseGradientColor = useMemo(
		() =>
			characters.map((_, index) =>
				resolveWaveHighlightColor(baseGradientColor, index, characters.length)
			),
		[baseGradientColor, characters]
	);

	if (isWaveEnabled) {
		return (
			<MotionComponent
				className={cn(
					"relative inline-block overflow-visible [perspective:500px]",
					className,
					"overflow-visible"
				)}
				style={
					{
						"--base-color": resolvedBaseColor,
						"--base-gradient-color": resolveWaveHighlightColor(
							baseGradientColor,
							0,
							Math.max(characters.length, 1)
						),
					} as CSSProperties
				}
			>
				<span className="inline-flex items-baseline whitespace-pre [transform-style:preserve-3d]">
					{characters.map((character, index) => {
						const delay =
							(index * resolvedDuration * (1 / Math.max(resolvedSpread, 1))) /
							Math.max(characters.length, 1);
						const renderedCharacter = character === " " ? "\u00A0" : character;
						if (character === " ") {
							return (
								<span
									key={`${character}-${index}`}
									className="inline-block whitespace-pre [color:var(--base-color)]"
								>
									{renderedCharacter}
								</span>
							);
						}
						const waveTransition = {
							delay,
							duration: resolvedDuration,
							ease: "easeInOut",
							repeat: Number.POSITIVE_INFINITY,
							repeatDelay,
							...transition,
						} satisfies Transition;

							return (
								<motion.span
									key={`${character}-${index}`}
									animate={{
										rotateY: [0, rotateYDistance, 0],
										scale: [1, scaleDistance, 1],
										translateX: [0, xDistance, 0],
										translateY: [0, yDistance, 0],
										translateZ: [0, zDistance, 0],
									}}
									className="relative inline-block whitespace-pre transform-gpu [backface-visibility:hidden] [transform-origin:50%_100%] [transform-style:preserve-3d] [will-change:transform]"
								initial={{
									rotateY: 0,
									scale: 1,
									translateX: 0,
									translateY: 0,
									translateZ: 0,
								}}
								transition={waveTransition}
							>
								<span className="[color:var(--base-color)]">
									{renderedCharacter}
								</span>
								<motion.span
									aria-hidden="true"
									animate={{ opacity: [0, DEFAULT_WAVE_HIGHLIGHT_OPACITY, 0] }}
									className="pointer-events-none absolute inset-0 whitespace-pre"
									initial={{
										opacity: 0,
									}}
									style={{
										color:
											resolvedBaseGradientColor[index] ??
											"var(--base-gradient-color)",
									}}
									transition={waveTransition}
								>
									{renderedCharacter}
								</motion.span>
							</motion.span>
						);
					})}
				</span>
			</MotionComponent>
		);
	}

	if (shouldReduceMotion) {
		return (
			<MotionComponent
				className={cn("relative inline-block [color:var(--color-muted-foreground)]", className)}
			>
				{children}
			</MotionComponent>
		);
	}

	return (
		<MotionComponent
			animate={{ backgroundPosition: "0% center" }}
			className={cn(
				"relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
				"[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--color-background),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
				className
			)}
			initial={{ backgroundPosition: "100% center" }}
			style={
				{
					"--spread": `${dynamicSpread}px`,
					backgroundImage:
						"var(--bg), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))",
				} as CSSProperties
			}
			transition={{
				duration: resolvedDuration,
				ease: "linear",
				repeat: Number.POSITIVE_INFINITY,
			}}
		>
			{children}
		</MotionComponent>
	);
};

export const Shimmer = memo(ShimmerComponent);
