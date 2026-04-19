"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface WidgetCardProps {
	children?: ReactNode;
	background?: ReactNode;
	overlay?: ReactNode;
	className?: string;
	style?: CSSProperties;
	radius?: number | string;
	hairlineColor?: string;
	dropShadow?: string;
	innerHighlight?: string;
	contrastTint?: string | null;
}

const DEFAULT_HAIRLINE = "rgba(255, 255, 255, 0.55)";
const DEFAULT_DROP_SHADOW = "0 24px 60px -28px rgba(0, 0, 0, 0.55)";
const DEFAULT_INNER_HIGHLIGHT =
	"inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 -1px 0 rgba(0, 0, 0, 0.18)";

/**
 * Pill-shaped widget card. Renders an absolute background slot (typically a
 * shader), an optional overlay (grids, screws), and a content slot.
 */
export function WidgetCard({
	children,
	background,
	overlay,
	className,
	style,
	radius = 36,
	hairlineColor = DEFAULT_HAIRLINE,
	dropShadow = DEFAULT_DROP_SHADOW,
	innerHighlight = DEFAULT_INNER_HIGHLIGHT,
	contrastTint,
}: WidgetCardProps) {
	const composedShadow = [
		dropShadow,
		`inset 0 0 0 1px ${hairlineColor}`,
		innerHighlight,
	]
		.filter(Boolean)
		.join(", ");

	return (
		<div
			className={cn("relative isolate overflow-hidden", className)}
			style={{
				borderRadius: radius,
				boxShadow: composedShadow,
				...style,
			}}
		>
			{background ? (
				<div className="pointer-events-none absolute inset-0 -z-10">
					{background}
				</div>
			) : null}
			{contrastTint ? (
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0"
					style={{ background: contrastTint, zIndex: 0 }}
				/>
			) : null}
			{overlay ? (
				<div className="pointer-events-none absolute inset-0 z-10">{overlay}</div>
			) : null}
			<div className="relative z-20 flex h-full w-full flex-col">
				{children}
			</div>
		</div>
	);
}

interface WidgetGridOverlayProps {
	color?: string;
	opacity?: number;
	cellSize?: number;
}

/**
 * Subtle pixel grid overlay used to give shader-backed cards a printed
 * "schematic" feel that matches the Framer reference.
 */
export function WidgetGridOverlay({
	color = "rgba(255, 255, 255, 0.18)",
	opacity = 0.6,
	cellSize = 16,
}: WidgetGridOverlayProps) {
	return (
		<div
			aria-hidden="true"
			className="absolute inset-0"
			style={{
				opacity,
				backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
				backgroundSize: `${cellSize}px ${cellSize}px`,
				maskImage:
					"radial-gradient(circle at 50% 35%, black 30%, transparent 90%)",
				WebkitMaskImage:
					"radial-gradient(circle at 50% 35%, black 30%, transparent 90%)",
			}}
		/>
	);
}

interface WidgetScrewDotsProps {
	color?: string;
	size?: number;
	inset?: number;
}

/**
 * Decorative corner screws used on the Framer reference cards.
 */
export function WidgetScrewDots({
	color = "rgba(255, 255, 255, 0.55)",
	size = 4,
	inset = 14,
}: WidgetScrewDotsProps) {
	const positions = [
		{ top: inset, left: inset },
		{ top: inset, right: inset },
		{ bottom: inset, left: inset },
		{ bottom: inset, right: inset },
	];
	return (
		<>
			{positions.map((position, index) => (
				<span
					key={index}
					aria-hidden="true"
					className="absolute rounded-full"
					style={{
						...position,
						width: size,
						height: size,
						background: color,
						boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.35)",
					}}
				/>
			))}
		</>
	);
}
