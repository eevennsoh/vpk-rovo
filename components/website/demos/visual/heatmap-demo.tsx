"use client";

import { useRef, useState } from "react";
import { useInView } from "motion/react";

import { GUI } from "@/components/utils/gui";
import Heatmap, {
	DEFAULT_HEATMAP_CONFIG,
	DEFAULT_HEATMAP_SHAPE_ID,
	HEATMAP_CONTROL_RANGES,
	HEATMAP_DEFAULT_HEAT_COLORS,
	HEATMAP_HEAT_COLOR_LABELS,
	HEATMAP_SHAPE_OPTIONS,
	normalizeHeatmapHeatColors,
	type HeatmapShapeId,
} from "@/components/visual/heatmap";
import { cn } from "@/lib/utils";

/**
 * Declared as a type alias rather than `HeatmapConfig & { shape }`: only aliases
 * of object types get an implicit index signature, which is what `GUI.Panel`
 * needs to accept this as its `values` record.
 */
type HeatmapDemoConfig = {
	colorBack: string;
	heatColors: string[];
	colorCount: number;
	contour: number;
	innerGlow: number;
	outerGlow: number;
	angle: number;
	noise: number;
	speed: number;
	shape: HeatmapShapeId;
};

const HEATMAP_DEMO_DEFAULTS: HeatmapDemoConfig = {
	...DEFAULT_HEATMAP_CONFIG,
	heatColors: normalizeHeatmapHeatColors(HEATMAP_DEFAULT_HEAT_COLORS),
	shape: DEFAULT_HEATMAP_SHAPE_ID,
};

/**
 * Shared preview frame so every example reads at the same size and radius.
 *
 * The shader is mounted only while the tile is on screen. Each instance holds a
 * live WebGL2 context, the examples on this page add up to well past Chrome's
 * ~16-context cap, and the shader library registers no `webglcontextrestored`
 * handler — so a force-lost tile stays blank for the rest of the page's life.
 * Unmounting off screen also lets `useShaderContextRelease` hand the context
 * back for the tiles that are actually visible.
 */
function HeatmapStage({
	caption,
	className,
	...heatmapProps
}: Readonly<Parameters<typeof Heatmap>[0] & { caption?: string }>) {
	const hostRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(hostRef, { amount: 0.2 });

	return (
		<div className="flex w-full flex-col gap-2">
			<div
				className={cn("aspect-square w-full overflow-hidden rounded-lg", className)}
				ref={hostRef}
				// Holds the tile's ground color while the shader is unmounted, so
				// scrolling past does not flash the page background.
				style={{ backgroundColor: heatmapProps.colorBack ?? DEFAULT_HEATMAP_CONFIG.colorBack }}
			>
				{isInView ? <Heatmap {...heatmapProps} /> : null}
			</div>
			{caption ? (
				<p className="text-center text-[11px] font-semibold uppercase tracking-wider text-text-subtlest">
					{caption}
				</p>
			) : null}
		</div>
	);
}

export default function HeatmapDemo() {
	const [config, setConfig] = useState<HeatmapDemoConfig>(HEATMAP_DEMO_DEFAULTS);

	const updateConfig = <K extends keyof HeatmapDemoConfig>(key: K, value: HeatmapDemoConfig[K]) => {
		setConfig((current) => ({ ...current, [key]: value }));
	};

	const updateHeatColor = (index: number, color: string) => {
		setConfig((current) => ({
			...current,
			heatColors: current.heatColors.map((slot, slotIndex) => (slotIndex === index ? color : slot)),
		}));
	};

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
			<div className="h-80 w-full overflow-hidden rounded-lg">
				<Heatmap
					angle={config.angle}
					colorBack={config.colorBack}
					colorCount={config.colorCount}
					colors={config.heatColors}
					contour={config.contour}
					innerGlow={config.innerGlow}
					noise={config.noise}
					outerGlow={config.outerGlow}
					shape={config.shape}
					speed={config.speed}
				/>
			</div>

			<GUI.Panel title="Heatmap controls" values={config}>
				<GUI.Section borderTop={false} title="Colors">
					<GUI.ColorInput
						defaultValue={DEFAULT_HEATMAP_CONFIG.colorBack}
						id="heatmap-background"
						label="Background"
						onChange={(colorBack) => updateConfig("colorBack", colorBack)}
						value={config.colorBack}
						valueKeys="colorBack"
					/>
					{config.heatColors.map((color, index) => (
						<GUI.ColorInput
							defaultValue={HEATMAP_DEFAULT_HEAT_COLORS[index]}
							disabled={index >= config.colorCount}
							id={`heatmap-heat-${index + 1}`}
							key={HEATMAP_HEAT_COLOR_LABELS[index]}
							label={HEATMAP_HEAT_COLOR_LABELS[index] ?? `Heat ${index + 1}`}
							onChange={(next) => updateHeatColor(index, next)}
							value={color}
						/>
					))}
					<GUI.Control
						defaultValue={DEFAULT_HEATMAP_CONFIG.colorCount}
						id="heatmap-colors"
						label="Colors"
						onChange={(colorCount) => updateConfig("colorCount", colorCount)}
						value={config.colorCount}
						valueKeys="colorCount"
						{...HEATMAP_CONTROL_RANGES.colorCount}
					/>
				</GUI.Section>

				<GUI.Section title="Heat">
					<GUI.Control
						defaultValue={DEFAULT_HEATMAP_CONFIG.contour}
						description="Heat intensity at the shape's edges."
						id="heatmap-contour"
						label="Contour"
						onChange={(contour) => updateConfig("contour", contour)}
						value={config.contour}
						valueKeys="contour"
						{...HEATMAP_CONTROL_RANGES.contour}
					/>
					<GUI.Control
						defaultValue={DEFAULT_HEATMAP_CONFIG.innerGlow}
						description="Size of the heated area inside the shape."
						id="heatmap-inner-glow"
						label="Inner glow"
						onChange={(innerGlow) => updateConfig("innerGlow", innerGlow)}
						value={config.innerGlow}
						valueKeys="innerGlow"
						{...HEATMAP_CONTROL_RANGES.innerGlow}
					/>
					<GUI.Control
						defaultValue={DEFAULT_HEATMAP_CONFIG.outerGlow}
						description="Size of the heated area outside the shape."
						id="heatmap-outer-glow"
						label="Outer glow"
						onChange={(outerGlow) => updateConfig("outerGlow", outerGlow)}
						value={config.outerGlow}
						valueKeys="outerGlow"
						{...HEATMAP_CONTROL_RANGES.outerGlow}
					/>
					<GUI.Control
						defaultValue={DEFAULT_HEATMAP_CONFIG.angle}
						description="Heat wave direction."
						id="heatmap-angle"
						label="Angle"
						onChange={(angle) => updateConfig("angle", angle)}
						unit="°"
						value={config.angle}
						valueKeys="angle"
						{...HEATMAP_CONTROL_RANGES.angle}
					/>
					<GUI.Control
						defaultValue={DEFAULT_HEATMAP_CONFIG.noise}
						description="Grain overlay across the whole graphic."
						id="heatmap-noise"
						label="Noise"
						onChange={(noise) => updateConfig("noise", noise)}
						value={config.noise}
						valueKeys="noise"
						{...HEATMAP_CONTROL_RANGES.noise}
					/>
					<GUI.Control
						defaultValue={DEFAULT_HEATMAP_CONFIG.speed}
						description="Animation speed multiplier. 0 freezes a single frame."
						id="heatmap-speed"
						label="Speed"
						onChange={(speed) => updateConfig("speed", speed)}
						value={config.speed}
						valueKeys="speed"
						{...HEATMAP_CONTROL_RANGES.speed}
					/>
				</GUI.Section>

				<GUI.Section title="Shape">
					<GUI.Select
						defaultValue={DEFAULT_HEATMAP_SHAPE_ID}
						description="The silhouette heat flows through."
						id="heatmap-shape"
						label="Shape"
						onChange={(shape) => updateConfig("shape", shape)}
						options={HEATMAP_SHAPE_OPTIONS}
						value={config.shape}
						valueKeys="shape"
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}

export function HeatmapDemoShapes() {
	return (
		<div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{HEATMAP_SHAPE_OPTIONS.map((option) => (
				<HeatmapStage caption={option.label} key={option.value} shape={option.value} />
			))}
		</div>
	);
}

export function HeatmapDemoColorRamp() {
	return (
		<div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{[1, 2, 3, 4].map((colorCount) => (
				<HeatmapStage
					caption={colorCount === 1 ? "1 color" : `${colorCount} colors`}
					colorCount={colorCount}
					key={colorCount}
				/>
			))}
		</div>
	);
}

export function HeatmapDemoGlowBalance() {
	return (
		<div className="grid w-full gap-3 sm:grid-cols-3">
			<HeatmapStage caption="Inner only" innerGlow={0.85} outerGlow={0} />
			<HeatmapStage caption="Balanced" innerGlow={0.5} outerGlow={0.35} />
			<HeatmapStage caption="Outer only" innerGlow={0} outerGlow={0.9} />
		</div>
	);
}

export function HeatmapDemoContourAndGrain() {
	return (
		<div className="grid w-full gap-3 sm:grid-cols-3">
			<HeatmapStage caption="Contour 0" contour={0} noise={0} />
			<HeatmapStage caption="Contour 1" contour={1} noise={0} />
			<HeatmapStage caption="Noise 0.8" contour={0.5} noise={0.8} />
		</div>
	);
}

export function HeatmapDemoAngle() {
	return (
		<div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{[0, 90, 180, 270].map((angle) => (
				<HeatmapStage angle={angle} caption={`${angle}°`} key={angle} shape="pill" />
			))}
		</div>
	);
}
