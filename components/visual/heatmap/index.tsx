"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "motion/react";
import { Suspense, useMemo, useRef, type CSSProperties, type Ref } from "react";

import { cn } from "@/lib/utils";

import { resolveHeatmapColors, resolveHeatmapConfig, type HeatmapConfig } from "./data";
import { DEFAULT_HEATMAP_SHAPE_ID, getHeatmapShape, type HeatmapShapeId } from "./shape";
import { useShaderContextRelease } from "./use-shader-context-release";

/**
 * `@paper-design/shaders-react` is ~700K of shader runtime. Keep it out of every
 * bundle that merely imports this module by loading it on demand, browser-only.
 */
const PaperHeatmap = dynamic(
	() => import("@paper-design/shaders-react").then((mod) => mod.Heatmap),
	{ ssr: false },
);

const SHADER_CLASS = "size-full";

export interface HeatmapProps {
	/** Scene background color. */
	colorBack?: string;
	/** Heat ramp slots, cold -> hot. Padded/trimmed to four slots. */
	colors?: readonly string[];
	/** How many leading ramp slots are active (1..4). */
	colorCount?: number;
	/** Heat intensity at the shape's edges (0..1). */
	contour?: number;
	/** Size of the heated area inside the shape (0..1). */
	innerGlow?: number;
	/** Size of the heated area outside the shape (0..1). */
	outerGlow?: number;
	/** Heat wave direction in degrees (0..360). */
	angle?: number;
	/** Grain overlay intensity (0..1). */
	noise?: number;
	/** Animation speed multiplier. `0` renders a single static frame. */
	speed?: number;
	/** Built-in silhouette the heat flows through. Ignored when `image` is set. */
	shape?: HeatmapShapeId;
	/** Custom silhouette: a SQUARE source, black shape on a transparent ground. */
	image?: string;
	/** How the square source is fitted into a non-square canvas. */
	fit?: "contain" | "cover";
	/** Shader zoom. */
	scale?: number;
	className?: string;
	style?: CSSProperties;
	ref?: Ref<HTMLDivElement>;
}

interface HeatmapShaderProps {
	config: HeatmapConfig;
	fit: "contain" | "cover";
	image: string;
	scale: number;
}

function HeatmapShader({ config, fit, image, scale }: Readonly<HeatmapShaderProps>) {
	const hostRef = useRef<HTMLDivElement>(null);
	const colors = useMemo(() => resolveHeatmapColors(config), [config]);

	// The library never loses its WebGL2 context on unmount, so it has to be handed
	// back explicitly (see the hook for the full reasoning).
	useShaderContextRelease(hostRef);

	return (
		<div className={SHADER_CLASS} ref={hostRef}>
			<PaperHeatmap
				angle={config.angle}
				className={SHADER_CLASS}
				colorBack={config.colorBack}
				colors={colors}
				contour={config.contour}
				fit={fit}
				height="100%"
				image={image}
				innerGlow={config.innerGlow}
				noise={config.noise}
				outerGlow={config.outerGlow}
				scale={scale}
				speed={config.speed}
				suspendWhenProcessingImage
				width="100%"
			/>
		</div>
	);
}

/**
 * Heatmap — a glowing gradient flowing through a shape: staggered soft waves
 * travelling through the shape's interior, an animated band sweeping the outer
 * glow, and heat mapped across a four-color ramp.
 *
 * Decorative only: `aria-hidden` and `pointer-events-none`, never focusable.
 * Under reduced motion the shader renders a single static frame rather than
 * disappearing, so the composition it belongs to is unchanged.
 */
export function Heatmap({
	colorBack,
	colors,
	colorCount,
	contour,
	innerGlow,
	outerGlow,
	angle,
	noise,
	speed,
	shape = DEFAULT_HEATMAP_SHAPE_ID,
	image,
	fit = "contain",
	scale = 1,
	className,
	style,
	ref,
}: Readonly<HeatmapProps>) {
	const shouldReduceMotion = useReducedMotion() ?? false;
	const config = useMemo(
		() =>
			resolveHeatmapConfig({
				colorBack,
				heatColors: colors,
				colorCount,
				contour,
				innerGlow,
				outerGlow,
				angle,
				noise,
				// A frozen frame keeps the graphic without animating it.
				speed: shouldReduceMotion ? 0 : speed,
			}),
		[angle, colorBack, colorCount, colors, contour, innerGlow, noise, outerGlow, shouldReduceMotion, speed],
	);
	const source = image ?? getHeatmapShape(shape);

	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none relative size-full overflow-hidden", className)}
			data-heatmap="true"
			inert
			ref={ref}
			style={style}
		>
			<Suspense fallback={null}>
				<HeatmapShader config={config} fit={fit} image={source} scale={scale} />
			</Suspense>
		</div>
	);
}

export {
	DEFAULT_HEATMAP_CONFIG,
	HEATMAP_CONTROL_RANGES,
	HEATMAP_DEFAULT_BACKGROUND,
	HEATMAP_DEFAULT_HEAT_COLORS,
	HEATMAP_HEAT_COLOR_LABELS,
	HEATMAP_MAX_COLORS,
	clampHeatmapConfig,
	normalizeHeatmapHeatColors,
	resolveHeatmapColors,
	resolveHeatmapConfig,
	type HeatmapConfig,
} from "./data";
export {
	DEFAULT_HEATMAP_SHAPE_ID,
	HEATMAP_SHAPE_OPTIONS,
	buildHeatmapShape,
	getHeatmapShape,
	heatmapShapeCacheSize,
	type HeatmapShapeId,
} from "./shape";

export default Heatmap;
