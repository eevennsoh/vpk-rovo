"use client";
import type { CSSProperties, ReactNode } from "react";

import {
	formatCornerShapeSuperellipse,
	SQUIRCLE_DEFAULT_SMOOTHNESS,
} from "@/components/website/demos/visual/shaders/squircle-shape";
import Pattern, {
	type PatternBlendMode,
} from "@/components/website/demos/visual/shaders/pattern";
import { cn } from "@/lib/utils";

interface WidgetCardProps {
	children?: ReactNode;
	background?: ReactNode;
	overlay?: ReactNode;
	className?: string;
	style?: CSSProperties;
	radius?: number | string;
	contrastTint?: string | null;
}

const SQUIRCLE_SHELL_STYLE = {
	borderRadius: 9999,
	cornerShape: formatCornerShapeSuperellipse(SQUIRCLE_DEFAULT_SMOOTHNESS),
} as CSSProperties & { cornerShape: string };

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
	contrastTint,
}: WidgetCardProps) {
	const width =
		typeof style?.width === "number" ? style.width : 240;
	const height =
		typeof style?.height === "number" ? style.height : 240;
	const restStyle = { ...(style ?? {}) };
	delete restStyle.width;
	delete restStyle.height;

	return (
		<div
			className={cn("relative isolate overflow-hidden", className)}
			style={{
				width,
				height,
				...SQUIRCLE_SHELL_STYLE,
				...restStyle,
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
	blendMode?: PatternBlendMode;
}

/**
 * Subtle pixel grid overlay used to give shader-backed cards a printed
 * "schematic" feel that matches the Framer reference. Backed by the shared
 * Pattern component (`patternType="grid"`) so the visual stays in sync with
 * the pattern catalog, with a radial mask focusing the grid near the top of
 * the card.
 */
export function WidgetGridOverlay({
	color = "color-mix(in srgb, var(--ds-text) 16%, transparent)",
	opacity = 0.6,
	cellSize = 16,
	blendMode = "multiply",
}: WidgetGridOverlayProps) {
	return (
		<div
			aria-hidden="true"
			className="absolute inset-0"
			style={{
				opacity,
			}}
		>
			<Pattern
				patternType="grid"
				front={color}
				back="transparent"
				scale={cellSize}
				blendMode={blendMode}
				fill="tile"
			/>
		</div>
	);
}

interface WidgetScrewDotsProps {
	color?: string;
	size?: number;
	inset?: number;
	insetX?: number;
	insetY?: number;
	/**
	 * Optional `box-shadow` applied to each dot. Used to create a debossed
	 * (pressed-in) effect by combining an inset top shadow with an outer
	 * bottom highlight.
	 */
	boxShadow?: string;
}

/**
 * Decorative corner dots used on the shader cards.
 */
export function WidgetScrewDots({
	color = "var(--ds-text)",
	size = 10,
	inset = 28,
	insetX,
	insetY,
	boxShadow,
}: WidgetScrewDotsProps) {
	const resolvedInsetX = insetX ?? inset;
	const resolvedInsetY = insetY ?? inset;
	const positions = [
		{ top: resolvedInsetY, left: resolvedInsetX },
		{ top: resolvedInsetY, right: resolvedInsetX },
		{ bottom: resolvedInsetY, left: resolvedInsetX },
		{ bottom: resolvedInsetY, right: resolvedInsetX },
	];
	return (
		<>
			{positions.map((position) => (
				<span
					key={`${position.top ?? "auto"}-${position.right ?? "auto"}-${position.bottom ?? "auto"}-${position.left ?? "auto"}`}
					aria-hidden="true"
					className="absolute rounded-full"
					style={{
						...position,
						width: size,
						height: size,
						background: color,
						boxShadow,
					}}
				/>
			))}
		</>
	);
}
