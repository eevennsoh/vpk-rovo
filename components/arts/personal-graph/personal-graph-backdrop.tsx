"use client";

import Ascii from "@/components/website/demos/visual/shaders/ascii";
import PatternTile, { type PatternStrokeOptions } from "@/components/website/demos/visual/pattern-tile";
import WaveGradient from "@/components/website/demos/visual/shaders/wave-gradient";
import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";

type PersonalGraphBackdropProps = React.ComponentProps<"div">;

const PERSONAL_GRAPH_SURFACE_COLOR = "var(--ds-surface)";
const PERSONAL_GRAPH_ASCII_COLOR = "var(--ds-text-subtle)";
const PERSONAL_GRAPH_GRID_STROKE = {
	style: "dashed",
	dash: 3,
	gap: 6,
	dashOffset: 0,
	lineCap: "butt",
	lineJoin: "miter",
	miterLimit: 4,
} satisfies PatternStrokeOptions;
const PERSONAL_GRAPH_GRID_FADE_STYLE = {
	WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 54%, rgba(0, 0, 0, 0.55) 64%, transparent 76%, transparent 100%)",
	maskImage: "linear-gradient(to bottom, #000 0%, #000 54%, rgba(0, 0, 0, 0.55) 64%, transparent 76%, transparent 100%)",
} satisfies React.CSSProperties;
const PERSONAL_GRAPH_SHADER_GRID_FADE_STYLE = {
	WebkitMaskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0.12) 30%, transparent 62%, transparent 100%)",
	maskImage: "linear-gradient(to bottom, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0.12) 30%, transparent 62%, transparent 100%)",
} satisfies React.CSSProperties;

const PERSONAL_GRAPH_SHADER_COLORS: [string, string, string, string] = [
	"#1868DB",
	"#FCA700",
	"#AF59E1",
	"#6A9A23",
];
const PERSONAL_GRAPH_WAVE_COLORS: [string, string, string, string] = [
	PERSONAL_GRAPH_SURFACE_COLOR,
	PERSONAL_GRAPH_SURFACE_COLOR,
	PERSONAL_GRAPH_SURFACE_COLOR,
	PERSONAL_GRAPH_SURFACE_COLOR,
];

function PersonalGraphAsciiBackdrop() {
	const { actualTheme } = useTheme();

	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-x-0 bottom-0 h-[34svh] min-h-[280px] max-h-[380px] overflow-hidden"
			data-personal-graph-editor-backdrop="ascii-shader"
			style={{
				WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.66) 18%, #000 42%, #000 100%)",
				maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.66) 18%, #000 42%, #000 100%)",
			}}
		>
			<WaveGradient
				className="absolute inset-0 opacity-55 mix-blend-multiply"
				colors={PERSONAL_GRAPH_WAVE_COLORS}
				key={`personal-graph-wave-${actualTheme}`}
				seed={31}
				speed={1.1}
				freqX={0.85}
				freqY={5.4}
				angle={104}
				amplitude={1.45}
				softness={1.55}
				blend={0.58}
			/>
			<Ascii
				key={`personal-graph-ascii-${actualTheme}`}
				sourceMode="field"
				sourceColors={PERSONAL_GRAPH_SHADER_COLORS}
				opacity={0.78}
				blendMode="normal"
				compositeMode="mask"
				hue={0}
				saturation={1}
				cellSize={12}
				charset="custom"
				customChars=" .:-=+*#%@ROVO"
				fontWeight="regular"
				className="absolute inset-0 opacity-90 mix-blend-multiply"
				colorMode="monochrome"
				monoColor={PERSONAL_GRAPH_ASCII_COLOR}
				backgroundColor={PERSONAL_GRAPH_SURFACE_COLOR}
				invert={false}
				directionBias={0}
				bgOpacity={0}
				maskSource="luminance"
				maskMode="multiply"
				maskInvert={false}
				toneMapping="none"
				glyphSignalMode="luminance"
				colorSignalMode="luminance"
				signalBlackPoint={0.1}
				signalWhitePoint={0.88}
				signalGamma={0.92}
				presenceThreshold={0.56}
				presenceSoftness={0.34}
				shimmerAmount={0}
				shimmerSpeed={1}
				bloomEnabled={false}
				bloomIntensity={1.25}
				bloomThreshold={0.6}
				bloomRadius={6}
				bloomSoftness={0.35}
				speed={1}
				transparentBackground
			/>
			<div
				className="absolute inset-0"
				data-personal-graph-editor-backdrop="ascii-grid-overlay"
				style={PERSONAL_GRAPH_SHADER_GRID_FADE_STYLE}
			>
				<PatternTile
					className="text-neutral-100"
					patternType="grid"
					front="currentColor"
					back="transparent"
					scale={48}
					stroke={PERSONAL_GRAPH_GRID_STROKE}
					opacity={0.34}
					blendMode="normal"
					fill="tile"
					position="center"
					shouldAnimate={false}
					direction="left"
					diagonal
					duration={5}
				/>
			</div>
		</div>
	);
}

export function PersonalGraphBackdrop({
	className,
	...props
}: Readonly<PersonalGraphBackdropProps>) {
	return (
		<div
			aria-hidden="true"
			className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-surface", className)}
			data-personal-graph-editor-backdrop="light-grid"
			{...props}
		>
			<div className="absolute inset-0" style={PERSONAL_GRAPH_GRID_FADE_STYLE}>
				<PatternTile
					className="text-neutral-100"
					patternType="grid"
					front="currentColor"
					back="transparent"
					scale={48}
					stroke={PERSONAL_GRAPH_GRID_STROKE}
					opacity={1}
					blendMode="normal"
					fill="tile"
					position="center"
					shouldAnimate={false}
					direction="left"
					diagonal
					duration={5}
				/>
			</div>
			<div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-surface via-surface/90 to-transparent" />
			<PersonalGraphAsciiBackdrop />
		</div>
	);
}
