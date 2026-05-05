import type { ComponentDetail } from "@/app/data/component-detail-types";
import {
	SHADER_LAB_RUNTIME_LAYER_TYPES,
	type ShaderLabRuntimeEffectType,
	type ShaderLabRuntimeLayerType,
	createShaderLabEffectPropDocs,
	getShaderLabEffectDescription,
	getShaderLabEffectImportStatement,
	getShaderLabEffectUsage,
} from "@/components/website/demos/visual/shader-lab-effect-definitions";

const SHADER_LAB_V2_EFFECT_TYPES = new Set<ShaderLabRuntimeEffectType>([
	"chromatic-aberration",
	"fluted-glass",
]);

function isShaderLabV2EffectType(layerType: ShaderLabRuntimeLayerType): layerType is ShaderLabRuntimeEffectType {
	return SHADER_LAB_V2_EFFECT_TYPES.has(layerType as ShaderLabRuntimeEffectType);
}

function createShaderLabLayerDetail(layerType: ShaderLabRuntimeLayerType): ComponentDetail {
	return {
		description: getShaderLabEffectDescription(layerType),
		importStatement: getShaderLabEffectImportStatement(),
		usage: getShaderLabEffectUsage(layerType),
		props: createShaderLabEffectPropDocs(layerType),
	};
}

const SHADER_LAB_LAYER_DETAILS = Object.fromEntries(
	SHADER_LAB_RUNTIME_LAYER_TYPES
		.filter((layerType) => !isShaderLabV2EffectType(layerType))
		.map((layerType) => [layerType, createShaderLabLayerDetail(layerType)]),
) as Record<string, ComponentDetail>;

const SHADER_LAB_V2_EFFECT_DETAILS = Object.fromEntries(
	Array.from(SHADER_LAB_V2_EFFECT_TYPES).map((effectType) => [
		`${effectType}-v2`,
		createShaderLabLayerDetail(effectType),
	]),
) as Record<string, ComponentDetail>;

export const VISUAL_DETAILS: Record<string, ComponentDetail> = {
	"typography": {
		description: "ADS font heading and body tokens with size, weight, and line-height. Includes Tailwind text-size utilities and composite font shorthand tokens.",
	},
	"color": {
		description: "Semantic color tokens for text, icon, background, border, and surface. Mapped from ADS design tokens to shadcn and Tailwind utility classes.",
	},
	"shadow": {
		description: "Elevation shadow tokens for raised, overflow, and overlay surfaces. Applied via the token() function or Tailwind shadow utilities.",
	},
	"shadow-overlay": {
		description: "Framer-derived masked shadow overlay with 32 preset alpha masks, custom image support, optional SVG turbulence animation, and tiled noise texture.",
		importStatement: `import ShadowOverlay from "@/components/website/demos/visual/shadow-overlay";`,
		usage: `<ShadowOverlay
	presetIndex={1}
	color="#424240"
	animation={{ enabled: true, scale: 50, speed: 30 }}
	noise={{ enabled: false, opacity: 0.5, scale: 1 }}
/>`,
		props: [
			{ name: "type", type: `"preset" | "custom"`, default: `"preset"`, description: "Selects a bundled Framer preset mask or a custom mask image URL." },
			{ name: "presetIndex", type: "number", default: "1", description: "One-indexed preset selector. Values clamp to the 32 bundled Framer mask IDs." },
			{ name: "customImageSrc", type: "string", description: "Image URL used when `type` is `custom`. Transparent PNG or SVG masks work best." },
			{ name: "customImageAlt", type: "string", description: "Optional accessible label for a custom image mask." },
			{ name: "sizing", type: `"fill" | "stretch"`, default: `"fill"`, description: "`fill` maps to CSS mask cover; `stretch` maps to 100% x 100%." },
			{ name: "color", type: "string", default: `"#424240"`, description: "CSS color painted through the selected mask." },
			{ name: "animation", type: "{ enabled?: boolean; scale?: number; speed?: number }", default: "{ enabled: true, scale: 50, speed: 30 }", description: "Controls the SVG turbulence displacement pass. Disabled automatically for reduced-motion users." },
			{ name: "noise", type: "{ enabled?: boolean; opacity?: number; scale?: number }", default: "{ enabled: false, opacity: 0.5, scale: 1 }", description: "Adds the Framer tiled grain texture over the masked shadow." },
			{ name: "className", type: "string", description: "Additional classes applied to the root overlay." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the root overlay." },
		],
	},
	"melt": {
		description: "SVG-filter melt effect that combines fractal-noise feTurbulence with feDisplacementMap, then applies the warped result to any target through the CSS filter property.",
		importStatement: `import Melt from "@/components/website/demos/visual/melt";`,
		usage: `<Melt
	scale={20}
	frequencyX={0.012}
	frequencyY={0.035}
>
	<div>Selectable text, an image, or an SVG target</div>
</Melt>`,
		props: [
			{ name: "children", type: "React.ReactNode", description: "Target pixels to warp. The filter works on SVG, image, text, and regular DOM content." },
			{ name: "scale", type: "number", default: "20", description: "feDisplacementMap scale. Controls the maximum number of pixels each sampled point can move." },
			{ name: "frequencyX", type: "number", default: "0.012", description: "Horizontal feTurbulence baseFrequency value." },
			{ name: "frequencyY", type: "number", default: "0.035", description: "Vertical feTurbulence baseFrequency value." },
			{ name: "numOctaves", type: "number", default: "3", description: "Number of fractal-noise octaves used by feTurbulence." },
			{ name: "seed", type: "number", default: "4", description: "feTurbulence seed used to stabilize the noise map." },
			{ name: "animation", type: "{ enabled?: boolean; duration?: number; scaleFrom?: number; scaleTo?: number; frequencyXFrom?: number; frequencyXTo?: number; frequencyYFrom?: number; frequencyYTo?: number }", description: "Optional SVG attribute animation. The demo mirrors the reference 5s loop between from and to values." },
			{ name: "filterId", type: "string", description: "Optional explicit SVG filter id. By default the component generates a stable React id." },
			{ name: "className", type: "string", description: "Class names applied to the filtered target wrapper." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the filtered target wrapper. The component owns the CSS filter property." },
		],
	},
	"scramble-text": {
		description: "Official Motion+ ScrambleText component. Letter-by-letter scramble that cycles random characters before each character settles on its target. The demo uses the exact charset, word lists, and stagger values from the official motion.dev examples (Normal, Hover, Stagger from center) plus a Playground tile with live GUI controls for every prop. The motion.dev reference charset is `!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▀▄■□▪▫●○◆◇◈◊※†‡` — punctuation + Unicode block-drawing chars for a glitchy texture.",
		importStatement: `import { ScrambleText } from "motion-plus/react";
import { stagger } from "motion/react";`,
		usage: `// Normal — plays once on mount
<ScrambleText duration={1}>Scramble text</ScrambleText>

// Hover — perpetual scramble while active
<span onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
	<ScrambleText active={hovered} duration={Infinity}>Hover me!</ScrambleText>
</span>

// Stagger from center
<ScrambleText duration={1} delay={stagger(0.05, { from: "center" })}>
	Stagger from center
</ScrambleText>`,
		props: [
			{ name: "children", type: "string", description: "The text content to scramble. Spaces pass through unchanged." },
			{ name: "as", type: "ElementType", default: '"span"', description: "The HTML element or component to render as. Polymorphic — pass any tag name or component." },
			{ name: "active", type: "boolean", default: "true", description: "Whether the scramble animation is active. When true, characters scramble according to delay/duration. When false, characters reveal with stagger offsets preserved." },
			{ name: "delay", type: "number | StaggerFunction", default: "0", description: "Delay before each character starts scrambling, in seconds. Pass a stagger function (e.g. stagger(0.1, { from: 'center' })) for per-character delays." },
			{ name: "duration", type: "number | StaggerFunction", default: "1", description: "How long each character stays scrambled before revealing, in seconds. Pass Infinity to keep scrambling until active becomes false." },
			{ name: "interval", type: "number", default: "0.05", description: "Seconds between random character switches while scrambling." },
			{ name: "chars", type: "string | string[]", default: '"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"', description: "Characters to use for scrambling. String of characters, or an array of strings for emoji support." },
			{ name: "onComplete", type: "() => void", description: "Callback fired when all characters have been revealed." },
			{ name: "className", type: "string", description: "Custom className applied to the wrapper element." },
			{ name: "style", type: "CSSProperties", description: "Custom inline styles." },
		],
	},
	"graph": {
		description: "Rovo-styled Teamwork Graph canvas with neural layout, pan, zoom, selection, theme, and editable parameter controls.",
		importStatement: `import Graph from "@/components/website/demos/visual/graph";`,
		usage: `<Graph />`,
		props: [
			{ name: "explorer", type: "VaultExplorer", description: "Optional graph data shaped like the Personal Graph explorer response. Defaults to the bundled visual sample graph." },
			{ name: "background", type: '"default" | "transparent"', default: '"transparent"', description: "Canvas background mode. Transparent embeds skip the built-in surface fill." },
			{ name: "initialParams", type: "Partial<NeuralGraphParams>", default: "ROVO_GRAPH_DEFAULT_PARAMS", description: "Initial values for flow, structure, cone, icon-token node type colors, edge color states, signal streaks, ray elasticity, origin node, hover, label, and node style controls." },
			{ name: "initialSelectedNodeId", type: "string | null", default: "null", description: "Node id to focus when the component first renders." },
			{ name: "interactionSettings", type: "Partial<NeuralGraphInteractionSettings>", description: "Optional cursor-driven motion, ray emphasis, and node-hover sound settings for embeds that hide the demo controls." },
			{ name: "isLoading", type: "boolean", default: "false", description: "Marks the graph as loading while preserving the canvas contract." },
			{ name: "params", type: "NeuralGraphParams", description: "Controlled render parameters for live embeds. Pair with onParamsChange when controls are shown." },
			{ name: "onParamsChange", type: "(params: NeuralGraphParams) => void", description: "Receives clamped parameter updates from the GUI controls." },
			{ name: "rayOriginBottomOffset", type: "number", description: "Optional pixel offset from the bottom edge for embed surfaces that need to pin the ray origin to surrounding chrome." },
			{ name: "raySoundSettings", type: "Partial<NeuralRaySoundSettings>", description: "Optional ray pluck sound settings for embeds that hide the demo controls but still want hover audio." },
			{ name: "selectedNodeId", type: "string | null", description: "Controlled selected node id for embed surfaces." },
			{ name: "onSelectedNodeIdChange", type: "(nodeId: string | null) => void", description: "Receives selection updates from canvas pointer and detail panel interactions." },
			{ name: "showControls", type: "boolean", default: "true", description: "Whether to render the VPK GUI controls under the canvas." },
			{ name: "showSelectionOverlay", type: "boolean", default: "false", description: "Whether the canvas renders its embedded selection overlay instead of the demo detail panel." },
			{ name: "themeMode", type: 'NeuralGraphThemeMode', description: "Optional renderer theme override for embedded backgrounds." },
			{ name: "variant", type: '"demo" | "fill"', default: '"demo"', description: "Demo constrains the component for the registry page; fill stretches it for live Personal Graph embeds." },
			{ name: "className", type: "string", description: "Optional classes merged onto the Graph wrapper." },
		],
	},
	"squircle": {
		description: "Framer-aligned squircle surface that uses native CSS corner-shape when supported, with an SVG superellipse fallback for unsupported browsers.",
		importStatement: `import Squircle from "@/components/website/demos/visual/shaders/squircle";`,
		usage: `<Squircle
	width={240}
	height={240}
	smoothness={100}
	strokeWidth={1.5}
	strokeColor="rgb(255 255 255 / 0.4)"
/>`,
		props: [
			{ name: "children", type: "React.ReactNode", description: "Optional content centered inside the squircle." },
			{ name: "width", type: "number", default: "240", description: "Rendered width in pixels." },
			{ name: "height", type: "number", default: "240", description: "Rendered height in pixels." },
			{ name: "smoothness", type: "number", default: "100", description: "Superellipse smoothing amount from 0 to 100. The default matches Framer's `superellipse(2)` card shape." },
			{ name: "strokeWidth", type: "number", default: "1.5", description: "Inside stroke width in pixels. Set to 0 to disable it." },
			{ name: "strokeColor", type: "string", default: `"rgb(255 255 255 / 0.4)"`, description: "Stroke color string, including optional alpha." },
			{ name: "fillColor", type: "string", default: `"token(color.background.neutral)"`, description: "Background fill color for the squircle surface." },
			{ name: "className", type: "string", description: "Additional class names applied to the squircle host element." },
			{ name: "contentClassName", type: "string", description: "Class names applied to the inner content wrapper." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the squircle host element." },
		],
	},
	"ascii": {
		description: "Shader Lab-style ASCII post-process pass that maps image or procedural luminance into a generated glyph atlas, with ASCII Magic-inspired background, intensity, animation, and single-pass post-processing controls.",
		importStatement: `import Ascii from "@/components/website/demos/visual/shaders/ascii";`,
		usage: `<Ascii
	density={0.82}
	coverage={1}
	backgroundMode="blurred-image"
	backgroundBlurRadius={60}
	backgroundOpacity={0.61}
	charset="light"
	colorMode="monochrome"
	monoColor="#F5F5F0"
	animatedCharacters={false}
	animationStyle="wave"
	animationIntensity={0.83}
	animationRandomness={0.5}
/>`,
		props: [
			{ name: "sourceMode", type: `"field" | "image"`, default: `"field"`, description: "VPK demo source selector. Shader Lab uses this pass over the composited input texture." },
			{ name: "sourceColors", type: "readonly string[]", default: `["#1868DB", "#FCA700", "#AF59E1", "#6A9A23"]`, description: "Editable procedural field palette used when `sourceMode` is `field`; supports up to 8 colors." },
			{ name: "imageSrc", type: "string", description: "Optional image URL used when `sourceMode` is `image`. When omitted, image mode starts from an empty source rather than a bundled demo texture." },
			{ name: "opacity", type: "number", default: "1", description: "Layer opacity used when compositing the ASCII output over the source." },
			{ name: "blendMode", type: `"normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"`, default: `"normal"`, description: "Shader Lab layer blend mode." },
			{ name: "compositeMode", type: `"filter" | "mask"`, default: `"filter"`, description: "Whether the pass filters the source or behaves like a luminance mask." },
			{ name: "maskSource", type: `"luminance" | "alpha" | "red" | "green" | "blue"`, default: `"luminance"`, description: "Source channel used when `compositeMode` is `mask`." },
			{ name: "maskMode", type: `"multiply" | "stencil"`, default: `"multiply"`, description: "Mask compositing behavior used when `compositeMode` is `mask`." },
			{ name: "maskInvert", type: "boolean", default: "false", description: "Inverts the layer mask when `compositeMode` is `mask`." },
			{ name: "hue", type: "number", default: "0", description: "Layer hue rotation in degrees." },
			{ name: "saturation", type: "number", default: "1", description: "Layer saturation multiplier." },
			{ name: "brightness", type: "number", default: "0", description: "Normalized brightness offset. The demo displays this as a percentage control." },
			{ name: "contrast", type: "number", default: "1", description: "Normalized contrast multiplier. The demo displays this as a percentage control." },
			{ name: "density", type: "number", description: "ASCII Magic-style density control from 0 to 1. Maps inversely to `cellSize` when `cellSize` is not provided." },
			{ name: "cellSize", type: "number", default: "12", description: "ASCII cell size in CSS pixels." },
			{ name: "charset", type: `"light" | "dense" | "binary" | "blocks" | "hatching" | "custom"`, default: `"light"`, description: "Built-in glyph ramp used for luminance mapping." },
			{ name: "characterMode", type: `"signal" | "sequence"`, default: `"signal"`, description: "Controls whether glyphs are selected from the source signal or looped through the full character string by grid position." },
			{ name: "characters", type: "string", default: `" .:-=+*#%@"`, description: "Optional direct glyph ramp override. In the demo this is editable for every charset preset." },
			{ name: "customChars", type: "string", default: `" .:-=+*#%@"`, description: "Glyph string used when `charset` is `custom`; custom strings still map from the source signal by default." },
			{ name: "fontWeight", type: `"thin" | "regular" | "bold"`, default: `"regular"`, description: "Font weight used when generating the glyph atlas." },
			{ name: "colorMode", type: `"source" | "monochrome" | "green-terminal"`, default: `"monochrome"`, description: "Determines whether glyphs use source color, tint-scaled monochrome, or terminal green. The demo exposes the website controls: source and monochrome." },
			{ name: "colorSourceMode", type: `"source" | "luminance" | "lightness" | "red" | "green" | "blue"`, default: `"source"`, description: "Color source used when `colorMode` is `source`. `source` keeps full RGB; channel options isolate the selected signal." },
			{ name: "monoColor", type: "string", default: `"#F5F5F0"`, description: "Monochrome tint color. Matches Shader Lab's `monoColor` parameter." },
			{ name: "tint", type: "string", default: `"#F5F5F0"`, description: "Backward-compatible alias for `monoColor`." },
			{ name: "backgroundColor", type: "string", default: `"#000000"`, description: "Background color used outside glyph strokes in every color mode." },
			{ name: "backgroundMode", type: `"blurred-image" | "solid-black" | "original-image" | "transparent"`, default: `"solid-black"`, description: "Background treatment behind uploaded or procedural ASCII. Legacy local values `solid`, `source`, and `blurred-source` still resolve to the new modes." },
			{ name: "backgroundOpacity", type: "number", default: "1", description: "Opacity for original-image and blurred-image background treatments. The demo applies 0.61 when image mode is selected." },
			{ name: "backgroundBlurRadius", type: "number", default: "60", description: "Single-pass blur sampling radius for `backgroundMode=\"blurred-image\"`." },
			{ name: "bgOpacity", type: "number", default: "0", description: "Blends source color into the background when `colorMode` is `source`." },
			{ name: "invert", type: "boolean", default: "false", description: "Inverts the luminance ramp before choosing glyphs." },
			{ name: "coverage", type: "number", description: "ASCII Magic-style coverage control from 0 to 1. Maps inversely to `presenceThreshold` when no explicit threshold is provided." },
			{ name: "edgeEmphasis", type: "number", description: "ASCII Magic-style edge emphasis control. Aliases the lower-level `directionBias` behavior by blending tone-based glyph selection toward local edge gradients." },
			{ name: "directionBias", type: "number", default: "0", description: "Blends glyph selection from tone signal toward edge-gradient magnitude." },
			{ name: "toneMapping", type: `"none" | "aces" | "reinhard" | "totos" | "cinematic"`, default: `"none"`, description: "Tone mapping applied before glyph and color signal extraction." },
			{ name: "glyphSignalMode", type: `"luminance" | "lightness" | "red" | "green" | "blue"`, default: `"luminance"`, description: "Source channel used for glyph selection." },
			{ name: "colorSignalMode", type: `"luminance" | "lightness" | "red" | "green" | "blue"`, default: `"luminance"`, description: "Source channel used to scale glyph color in monochrome and green-terminal modes." },
			{ name: "signalBlackPoint", type: "number", default: "0", description: "Lower remap point for glyph and color signals." },
			{ name: "signalWhitePoint", type: "number", default: "1", description: "Upper remap point for glyph and color signals." },
			{ name: "signalGamma", type: "number", default: "1", description: "Gamma exponent used in signal remapping." },
			{ name: "presenceThreshold", type: "number", default: "0", description: "Threshold below which glyphs fade out." },
			{ name: "presenceSoftness", type: "number", default: "0", description: "Soft transition width around the presence threshold." },
			{ name: "animatedCharacters", type: "boolean", default: "false", description: "Cycles glyph selection over time for both procedural and uploaded image sources while keeping uploaded images static." },
			{ name: "animationPlaying", type: "boolean", default: "true", description: "Global play/stop control for time-driven ASCII animation, procedural field motion, shimmer, grain, and temporal post effects." },
			{ name: "animationStyle", type: `"wave" | "cascade-left-right" | "cascade-right-left" | "cascade-top-bottom" | "reveal" | "pulse"`, default: `"wave"`, description: "ASCII Magic-style animation phase pattern for animated glyph cycling." },
			{ name: "animationIntensity", type: "number", default: "0.83", description: "Controls how strongly the selected animation style shapes glyph cycling and reveal or pulse masking." },
			{ name: "animationRandomness", type: "number", default: "0.5", description: "Adds per-cell random phase variation to animated glyph cycling and pulse timing." },
			{ name: "characterCycleSpeed", type: "number", default: "8", description: "Glyph cycle speed used when `animatedCharacters` is enabled." },
			{ name: "characterOpacity", type: "number", default: "1", description: "ASCII glyph opacity multiplier." },
			{ name: "randomizeCharacters", type: "number", default: "0", description: "Per-cell random glyph replacement amount." },
			{ name: "dotGridOverlay", type: "number", default: "0", description: "Adds a subtle dot-grid accent over each ASCII cell." },
			{ name: "shimmerAmount", type: "number", default: "0", description: "Per-cell temporal opacity shimmer amount." },
			{ name: "shimmerSpeed", type: "number", default: "1", description: "Per-cell shimmer speed." },
			{ name: "bloomEnabled", type: "boolean", default: "false", description: "Adds a local bloom-style glow to bright ASCII cells." },
			{ name: "bloomIntensity", type: "number", default: "1.25", description: "Bloom glow strength." },
			{ name: "bloomThreshold", type: "number", default: "0.6", description: "Signal threshold for bloom contribution." },
			{ name: "bloomRadius", type: "number", default: "6", description: "Approximate glow radius, normalized against the Shader Lab 0-24 radius range." },
			{ name: "bloomSoftness", type: "number", default: "0.35", description: "Soft transition around the bloom threshold." },
			{ name: "colorOverlay", type: "boolean | number", default: "false", description: "Single-pass post-process color overlay toggle or strength." },
			{ name: "colorOverlayColor", type: "string", default: `"#F5F5F0"`, description: "Overlay color used when `colorOverlay` is enabled." },
			{ name: "colorOverlayBlendMode", type: `"normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"`, default: `"multiply"`, description: "Blend function for the post-process color overlay. The demo exposes the ASCII Magic overlay blend list." },
			{ name: "vignette", type: "boolean | number", default: "0", description: "Single-pass vignette toggle or strength." },
			{ name: "scanLines", type: "boolean | number", default: "0", description: "Single-pass scan-line toggle or strength." },
			{ name: "crtCurvature", type: "boolean | number", default: "false", description: "Applies a lightweight CRT barrel-curve and edge falloff approximation." },
			{ name: "chromatic", type: "boolean | number", default: "false", description: "Radially splits the rendered ASCII red, green, and blue channels." },
			{ name: "chromaticOffset", type: "number", default: "3", description: "Chromatic red/blue channel offset in pixels, matching the ASCII Magic 1-20 slider range." },
			{ name: "characterBloom", type: "boolean | number", default: "false", description: "Adds glyph-local glow independent of the broader bloom controls." },
			{ name: "characterChromatic", type: "boolean | number", default: "false", description: "Horizontally splits RGB channels only across glyph pixels, leaving the background treatment untouched." },
			{ name: "characterChromaticOffset", type: "number", default: "3", description: "Character channel offset in the ASCII Magic 1-20 slider range." },
			{ name: "filmGrain", type: "boolean | number", default: "0", description: "Adds animated grain in the final post-process pass." },
			{ name: "glitch", type: "boolean | number", default: "false", description: "Adds temporal scan-band and channel displacement glitches." },
			{ name: "rgbSplit", type: "boolean | number", default: "false", description: "Adds stronger horizontal RGB splitting to the full rendered ASCII output, including source/background contribution. `chromaticAberration` remains as a backwards-compatible alias." },
			{ name: "rgbSplitOffset", type: "number", default: "2", description: "RGB split channel offset in pixels, matching the ASCII Magic 1-20 slider range." },
			{ name: "blur", type: "boolean | number", default: "false", description: "Mixes in a single-pass blur of the rendered ASCII output." },
			{ name: "blurRadius", type: "number", default: "2", description: "Post-process blur radius in the ASCII Magic 1-20 slider range." },
			{ name: "pixelate", type: "boolean | number", default: "false", description: "Mixes in a block-sampled version of the rendered ASCII output." },
			{ name: "pixelateSize", type: "number", default: "4", description: "Pixel block size in the ASCII Magic 2-30 slider range." },
			{ name: "halftone", type: "boolean | number", default: "false", description: "Adds a rotated halftone dot mask over the final color." },
			{ name: "halftoneSize", type: "number", default: "4", description: "Halftone cell size in the ASCII Magic 2-20 slider range." },
			{ name: "filmDust", type: "boolean | number", default: "false", description: "Adds held-frame film dirt, sparse dust flecks, and fine scratches in the final post-process pass. Numeric values control artifact density." },
			{ name: "speed", type: "number", default: "1", description: "Animation speed for the procedural field source." },
			{ name: "className", type: "string", description: "Optional classes applied to the canvas." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the canvas." },
		],
	},
	"dithering": {
		description: "Shader Lab-style ordered dithering pass that quantizes a procedural field or uploaded image through Bayer 2x2, Bayer 4x4, Bayer 8x8, or blue-noise thresholds, with the same preset, color, effect, layer blend, and mask controls exposed by the editor.",
		importStatement: `import Dithering from "@/components/website/demos/visual/shaders/dithering";`,
		usage: `<Dithering
	preset="custom"
	algorithm="bayer-4x4"
	levels={4}
	pixelSize={1}
	spread={0.5}
	colorMode="source"
/>`,
		props: [
			{ name: "sourceMode", type: `"field" | "image"`, default: `"field"`, description: "VPK demo source selector. Shader Lab uses this pass over the composited input texture." },
			{ name: "imageSrc", type: "string", description: "Optional image URL used when `sourceMode` is `image`. When omitted, the shader uses a bundled default texture." },
			{ name: "opacity", type: "number", default: "1", description: "Layer opacity used when compositing the dithering output over the source." },
			{ name: "blendMode", type: `"normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"`, default: `"normal"`, description: "Shader Lab layer blend mode." },
			{ name: "compositeMode", type: `"filter" | "mask"`, default: `"filter"`, description: "Whether the pass filters the source or behaves like a luminance mask." },
			{ name: "hue", type: "number", default: "0", description: "Layer hue rotation in degrees." },
			{ name: "saturation", type: "number", default: "1", description: "Layer saturation multiplier." },
			{ name: "preset", type: `"custom" | "gameboy"`, default: `"custom"`, description: "Shader Lab dithering preset selector. `gameboy` applies the editor's Game Boy defaults unless explicit props override them." },
			{ name: "algorithm", type: `"bayer-2x2" | "bayer-4x4" | "bayer-8x8" | "noise"`, default: `"bayer-4x4"`, description: "Threshold pattern used for quantization." },
			{ name: "levels", type: "number", default: "4", description: "Number of color quantization levels. Values are clamped to at least 2." },
			{ name: "pixelSize", type: "number", default: "1", description: "Logical dither cell size in CSS pixels. Values are rounded and clamped to at least 1." },
			{ name: "spread", type: "number", default: "0.5", description: "Shader Lab's Strength control. Applies threshold spread before quantization." },
			{ name: "dotScale", type: "number", default: "1", description: "Square dot mask scale inside each dither cell." },
			{ name: "animateDither", type: "boolean", default: "false", description: "Animates the threshold pattern over time." },
			{ name: "ditherSpeed", type: "number", default: "1", description: "Pattern animation speed when `animateDither` is enabled." },
			{ name: "chromaticSplit", type: "boolean", default: "false", description: "Offsets green and blue threshold samples for a chromatic dither split." },
			{ name: "colorMode", type: `"source" | "monochrome" | "duo-tone"`, default: `"source"`, description: "`source` keeps quantized source colors, `monochrome` tints luminance with `monoColor`, and `duo-tone` maps luminance between shadow/highlight colors." },
			{ name: "monoColor", type: "string", default: `"#f5f5f0"`, description: "Hex tint used when `colorMode` is `monochrome`." },
			{ name: "shadowColor", type: "string", default: `"#101010"`, description: "Low-luminance hex color used when `colorMode` is `duo-tone`." },
			{ name: "highlightColor", type: "string", default: `"#f5f2e8"`, description: "High-luminance hex color used when `colorMode` is `duo-tone`." },
			{ name: "speed", type: "number", default: "1", description: "Animation speed for the procedural field source." },
			{ name: "className", type: "string", description: "Optional classes applied to the canvas." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the canvas." },
		],
	},
	"particles": {
		description: "PCG hash-based WebGL particle field with configurable layers, glow, blink, and optional warp tunnel mode.",
	},
	"wave-gradient": {
		description: "Noise-driven WebGL gradient with seed-dependent wave warping, 4-color blending, and smoothstep masking.",
	},
	"liquid-gradient": {
		description: "OkLCH color space gradient with turbulence, dither modes, and post-processing filters. Up to 8 palette colors.",
	},
	"logo-gradient": {
		description: "Framer-derived logo shader that bends an alpha-driven heightmap silhouette into an animated multicolor gradient. Supports uploaded logo masks, up to 8 palette stops, directional or random motion, and contour/bevel tuning.",
		importStatement: `import LogoGradient from "@/components/website/demos/visual/shaders/logo-gradient";`,
		usage: `<LogoGradient
	colors={["#000000", "#0051FF", "#0DAAFF", "#BDE4FF"]}
	colorBack="#000000"
	motionMode={0}
	scale={1.2}
/>`,
		props: [
			{ name: "imageSrc", type: "string", description: "Optional uploaded logo or mask image. Transparent SVG/PNG gives the cleanest silhouette; when omitted the component uses Framer's default Path.svg asset." },
			{ name: "colors", type: "string[]", default: `["#000000", "#0051FF", "#0DAAFF", "#BDE4FF"]`, description: "Gradient palette stops. Supports 1-8 colors and interpolates between them in Oklch." },
			{ name: "colorBack", type: "string", default: `"#000000"`, description: "Background color behind and around the logo silhouette." },
			{ name: "seed", type: "number", default: "6", description: "Seed used to rotate and phase the turbulence pattern." },
			{ name: "speed", type: "number", default: "0.6", description: "Animation speed multiplier." },
			{ name: "motionMode", type: "0 | 1", default: "0", description: "Motion style: `0` = Random, `1` = Directional." },
			{ name: "angle", type: "number", default: "20", description: "Gradient flow angle in degrees." },
			{ name: "scale", type: "number", default: "1.2", description: "Overall gradient scale inside the silhouette." },
			{ name: "turbAmp", type: "number", default: "0.21", description: "Turbulence amplitude." },
			{ name: "turbFreq", type: "number", default: "1.15", description: "Turbulence frequency." },
			{ name: "turbIter", type: "number", default: "7", description: "Turbulence iteration count / definition." },
			{ name: "waveFreq", type: "number", default: "2.4", description: "Band density inside the logo." },
			{ name: "bend", type: "number", default: "0.24", description: "Contour-following bevel amount around the silhouette edge." },
			{ name: "contour", type: "number", default: "0.8", description: "How strongly the gradient hugs the underlying contour." },
			{ name: "className", type: "string", description: "Optional class names applied to the root canvas." },
		],
	},
	"bands": {
		description: "Dispersion bands with chromatic aberration lens, configurable spacing, radius, and edge rainbow effects.",
	},
	"rings": {
		description: "Concentric dispersion rings with chromatic aberration, warp distortion, and edge rainbow effects.",
	},
	"blockify": {
		description: "Lego-style image pixelation with studs, square or hex grid, posterization, and per-brick hue shift.",
	},
	"pixels": {
		description: "Sub-pixel RGB decomposition with stagger, bevel borders, chromatic aberration, and hue rotation.",
	},
	"truchet": {
		description: "Truchet tile pattern driven by image luminance with arc SDFs, random rotation, and sampled or solid color modes.",
	},
	"fluted-glass": {
		description: "VPK-rovo fluted glass refraction with bars, waves, zigzag, or seigaiha shapes, chromatic dispersion, blur, frost, and uploaded image support.",
		importStatement: `import FlutedGlass from "@/components/website/demos/visual/shaders/fluted-glass";`,
		usage: `<FlutedGlass
	lensMode={0}
	fluteShape={0}
	fluteCount={16}
	distortion={0.11}
	dispersion={1.54}
/>`,
		props: [
			{ name: "className", type: "string", description: "Optional class names applied to the canvas." },
			{ name: "imageSrc", type: "string", description: "Optional source image URL. When omitted, the shader uses its generated demo texture." },
			{ name: "lensMode", type: "0 | 1", default: "0", description: "Lens shape: 0 uses curved flutes, 1 uses cosine flutes." },
			{ name: "fluteShape", type: "0 | 1 | 2 | 3", default: "0", description: "Flute layout: 0 bars, 1 waves, 2 zigzag, 3 seigaiha." },
			{ name: "shapeFrequency", type: "number", default: "1", description: "Frequency for wave, zigzag, and seigaiha shape variation." },
			{ name: "fluteCount", type: "number", default: "16", description: "Number of visible flutes across the surface." },
			{ name: "flutePower", type: "number", default: "1.4", description: "Curvature exponent used by curved lens mode." },
			{ name: "distortion", type: "number", default: "0.11", description: "Base refraction offset applied through the flute normals." },
			{ name: "dispersion", type: "number", default: "1.54", description: "Chromatic separation multiplier for the red and blue channels." },
			{ name: "blurSize", type: "number", default: "0", description: "Blur sample radius applied to the refracted image." },
			{ name: "frostAmount", type: "number", default: "0", description: "Noise-driven frost offset mixed into each blur sample." },
		],
	},
	"liquid-glass": {
		description: "Apple-style liquid glass surface with real-time SVG displacement distortion, chromatic dispersion, a crisp hairline edge with inner specular highlights, a soft drop shadow, and backdrop-filter refraction.",
		importStatement: `import LiquidGlass from "@/components/website/demos/visual/shaders/liquid-glass";`,
		usage: `<LiquidGlass width={200} height={400} borderRadius={50} />

<LiquidGlass
	width={300}
	height={200}
	borderRadius={30}
	distortionScale={-180}
	redOffset={50}
	greenOffset={-1}
	blueOffset={-19}
	yChannel="G"
	backgroundOpacity={0.1}
>
	<p className="text-sm text-text">Content inside the glass</p>
</LiquidGlass>`,
		props: [
			{ name: "children", type: "React.ReactNode", description: "Content displayed inside the glass surface." },
			{ name: "width", type: "number | string", default: "200", description: "Width of the glass surface (pixels or CSS value)." },
			{ name: "height", type: "number | string", default: "400", description: "Height of the glass surface (pixels or CSS value)." },
			{ name: "borderRadius", type: "number", default: "50", description: "Corner radius in pixels." },
			{ name: "borderWidth", type: "number", default: "0.05", description: "Border width factor for the displacement map inset." },
			{ name: "brightness", type: "number", default: "50", description: "Brightness percentage (0–100) for the displacement map." },
			{ name: "opacity", type: "number", default: "0.93", description: "Opacity of the displacement map inner fill." },
			{ name: "blur", type: "number", default: "8", description: "Softens the displacement map inner transition in output pixels." },
			{ name: "displace", type: "number", default: "0", description: "Output Gaussian blur (stdDeviation) on the refracted result." },
			{ name: "backgroundOpacity", type: "number", default: "0", description: "Background frost opacity (0 = clear, 1 = fully frosted)." },
			{ name: "saturation", type: "number", default: "1", description: "Backdrop-filter saturation multiplier." },
			{ name: "distortionScale", type: "number", default: "-90", description: "Base displacement scale applied to the center channel." },
			{ name: "dispersion", type: "number", default: "6", description: "Legacy VPK uniform boost added to every channel before per-channel offsets. Set to 0 for ReactBits scale parity." },
			{ name: "redOffset", type: "number", default: "0", description: "ReactBits-compatible red channel displacement offset added to the base scale." },
			{ name: "greenOffset", type: "number", default: "0", description: "ReactBits-compatible green channel displacement offset added to the base scale." },
			{ name: "blueOffset", type: "number", default: "0", description: "ReactBits-compatible blue channel displacement offset added to the base scale." },
			{ name: "xChannel", type: `"R" | "G" | "B"`, default: `"R"`, description: "Displacement-map channel selector for the x axis." },
			{ name: "yChannel", type: `"R" | "G" | "B"`, default: `"B"`, description: "Displacement-map channel selector for the y axis. Use \"G\" to match ReactBits GlassSurface." },
			{ name: "borderOpacity", type: "number", default: "0.35", description: "Opacity of the inset hairline edge." },
			{ name: "borderColor", type: "string", default: "\"#000000\"", description: "Color of the inset hairline edge." },
			{ name: "className", type: "string", description: "Additional CSS class names." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles object." },
		],
	},
	"logo-glass": {
		description: "Framer-derived logo refraction shader that turns an alpha-driven logo heightmap into animated glass with domain-warped dispersion, contour bending, directional melt motion, and exposed lighting/filter controls.",
		importStatement: `import LogoGlass from "@/components/website/demos/visual/shaders/logo-glass";`,
		usage: `<LogoGlass className="h-[320px] w-full" />

<LogoGlass
	className="h-[320px] w-full"
	imageSrc="/website/logo-gradient-path.svg"
	colorBack="#04070d"
	colorB="#d8e0ff"
	motionMode={1}
	speed={1.15}
	warp={0.5}
	dispersion={0.35}
/>`,
		props: [
			{ name: "className", type: "string", description: "Canvas sizing classes. The shader fills the full width and height of its host." },
			{ name: "imageSrc", type: "string", default: "\"/website/logo-gradient-path.svg\"", description: "Logo or heightmap image URL. Transparent SVG/PNG logos work best; when omitted the component uses Framer's default Path.svg asset and derives the heightmap through the Framer-style alpha pipeline." },
			{ name: "colorBack", type: "string", default: "\"#000000\"", description: "Background color rendered behind the glass logo." },
			{ name: "colorA", type: "string", default: "\"#000000\"", description: "Low-end tint for the glass refraction result." },
			{ name: "colorB", type: "string", default: "\"#C9C9C9\"", description: "High-end tint blended into the refracted glass." },
			{ name: "colorHighlight", type: "string", default: "\"#FFFFFF\"", description: "Highlight color used by the specular lighting pass." },
			{ name: "colorShadow", type: "string", default: "\"#333333\"", description: "Shadow color used by the internal lighting pass." },
			{ name: "seed", type: "number", default: "55", description: "Noise seed used for the animated warp field." },
			{ name: "speed", type: "number", default: "1.15", description: "Animation speed multiplier." },
			{ name: "scale", type: "number", default: "0.19", description: "Spatial frequency of the domain-warped noise field." },
			{ name: "motionMode", type: "0 | 1", default: "0", description: "Motion mode enum. `0` = Free, `1` = Melt." },
			{ name: "direction", type: "number", default: "0", description: "Directional drift angle in degrees for Melt motion." },
			{ name: "octaves", type: "number", default: "3", description: "FBM octave count for the warp field." },
			{ name: "persistence", type: "number", default: "0.6", description: "Amplitude falloff per octave in the FBM stack." },
			{ name: "lacunarity", type: "number", default: "1.4", description: "Frequency multiplier per octave in the FBM stack." },
			{ name: "warpDepth", type: "number", default: "2", description: "Number of domain-warp stages. `1` keeps a shallower field, `2` adds the second warp pass." },
			{ name: "warp", type: "number", default: "0.5", description: "Lens warp intensity applied within the glass silhouette." },
			{ name: "ior", type: "number", default: "0.5", description: "Index-of-refraction blend that scales the dispersion lensing." },
			{ name: "dispersion", type: "number", default: "0", description: "Chromatic separation intensity." },
			{ name: "contour", type: "number", default: "0.05", description: "Gradient-sensitive contour shaping along logo edges." },
			{ name: "falloff", type: "number", default: "0", description: "Bevel falloff amount used to reshape the lens exponent." },
			{ name: "shapeContour", type: "number", default: "0.7", description: "How strongly the logo silhouette influences the internal noise distribution." },
			{ name: "bend", type: "number", default: "0.65", description: "Contour-aware coordinate bend applied near the logo edge." },
			{ name: "noise", type: "number", default: "0", description: "Per-pixel grain mixed into the dispersion field." },
			{ name: "bumpStrength", type: "number", default: "0.7", description: "Lighting intensity for highlights and shadows." },
			{ name: "bumpDist", type: "number", default: "6", description: "Detail sampling distance used by the bump-lighting gradient." },
			{ name: "lightAngle", type: "number", default: "200", description: "Lighting angle in degrees." },
			{ name: "ambient", type: "number", default: "0", description: "Ambient lift added after tinting." },
			{ name: "brightness", type: "number", default: "0.8", description: "Post-lighting brightness multiplier." },
			{ name: "contrast", type: "number", default: "2.8", description: "Post-lighting contrast adjustment." },
			{ name: "saturation", type: "number", default: "1", description: "Post-lighting saturation adjustment." },
		],
	},
	"glass-tabs": {
		description: "Shared liquid-glass segmented control extracted from the Awake theme switcher. Uses the same elastic committed pill, hover ghost pill, and magnetic hover label drift as the Awake scene.",
		importStatement: `import { GlassTabs } from "@/components/ui/glass-tabs";`,
		usage: `const options = [
	{ value: "location", label: "Location" },
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

type ThemeMode = (typeof options)[number]["value"];

const [value, setValue] = React.useState<ThemeMode>("location");

<GlassTabs
	aria-label="Theme"
	options={options}
	value={value}
	onChange={setValue}
/>`,
		props: [
			{ name: "options", type: "ReadonlyArray<{ value: string; label: string }>", description: "Controlled list of tabs to render. Each option provides the string value and visible label." },
			{ name: "value", type: "string", description: "Currently selected option value." },
			{ name: "onChange", type: "(value: string) => void", description: "Called when the user commits a different tab via pointer or keyboard." },
			{ name: "keyboardSelectionPulseKey", type: "number", description: "Optional external pulse used when parent-level keyboard shortcuts change `value`, so the pill uses the tighter keyboard animation path." },
			{ name: "aria-label", type: "string", description: "Accessible name applied to the radiogroup wrapper." },
			{ name: "className", type: "string", description: "Additional class names merged onto the outer glass shell." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the outer glass shell." },
		],
	},
	"glass-slider": {
		description: "The vertical liquid-glass slider used by the Awake demo (CityRailEditor + inner GlassSlider). Renders the exact same component the /awake page uses, including the same city list, liquid-glass shell, and rainbow tick.",
		importStatement: `import { GlassSlider, DEFAULT_FILL_GLASS_PROPS, DEFAULT_FILL_TINT_GRADIENT } from "@/components/arts/awake/glass-slider";\nimport { CityRailEditor } from "@/components/arts/awake/city-popover";`,
		usage: `<CityRailEditor
	cities={cities}
	selectedIndex={selectedIndex}
	setSelectedIndex={setSelectedIndex}
	addCity={addCity}
	width={194}
	height={440}
	fillGlassProps={{
		distortionScale: -60,
		dispersion: 4,
		blur: 6,
		backgroundOpacity: 0.18,
	}}
	fillTintGradient={DEFAULT_FILL_TINT_GRADIENT}
/>`,
		props: [
			{ name: "cities", type: "ReadonlyArray<LockscreenLocation>", description: "Live city list (use the `useCities` hook for the same data source the Awake page uses)." },
			{ name: "selectedIndex", type: "number", description: "Currently selected city index (controlled)." },
			{ name: "setSelectedIndex", type: "(index: number) => void", description: "Setter called on hover-preview, drag, click, or keyboard navigation." },
			{ name: "addCity", type: "(city: LockscreenLocation) => void", description: "Append a city to the rail when the user adds one from the editor popover." },
			{ name: "width", type: "number", default: "150", description: "Outer width in pixels. CityRailEditor subtracts a 24px TRACK_INSET internally to derive the visible rail width." },
			{ name: "height", type: "number", default: "380", description: "Outer height in pixels." },
			{ name: "fillGlassProps", type: "Partial<LiquidGlassProps>", description: "Override the LiquidGlass props applied to the progress fill (distortion, dispersion, blur, etc.). Forwarded verbatim to the inner GlassSlider." },
			{ name: "fillTintGradient", type: "string", description: "CSS gradient string layered over the glass fill. Defaults to DEFAULT_FILL_TINT_GRADIENT (Rovo brand-color vertical gradient). Pass undefined to disable." },
			{ name: "fillTintBlendMode", type: "CSSProperties[\"mixBlendMode\"]", description: "How the tint composites with the refracted glass." },
			{ name: "fillMeniscusHeightPx", type: "number", description: "Height of the curved cap on top of the progress fill, in pixels. 0 = flat." },
			{ name: "fillMeniscusCurve", type: "number", description: "Curvature of the meniscus cap, 0 = flat (no cap), 1 = full half-ellipse." },
			{ name: "fillMeniscusHeightPxActive", type: "number", description: "Cap height when the slider is hovered or interacted with — springs from rest to this value." },
			{ name: "fillMeniscusCurveActive", type: "number", description: "Cap curvature (0–1) when hovered/interacted — springs from rest to this value." },
		],
	},
	"holo": {
		description: "Iridescent holographic gradient with seeded turbulence, spectral band cycling, exposure shaping, and optional highlight tuning.",
	},
	"mesh": {
		description: "SVG animated mesh gradient with 3-color palette, rotating linear gradients, and fractal noise blending.",
	},
	"mesh-02": {
		description: "3D wireframe mesh with raymarched grid lines, seed-driven wave deformation, tilt camera, and configurable line style.",
	},
	"chromatic-aberration": {
		description: "VPK-rovo chromatic aberration shader with radial, horizontal, vertical, and swirl modes, uploaded image support, animated pulse, and swirl controls.",
		importStatement: `import ChromaticAberration from "@/components/website/demos/visual/shaders/chromatic-aberration";`,
		usage: `<ChromaticAberration
	mode={3}
	radius={60}
	pulse={30}
	swirl={3}
/>`,
		props: [
			{ name: "imageSrc", type: "string", description: "Optional source image URL. When omitted, the shader uses its generated demo source." },
			{ name: "mode", type: "0 | 1 | 2 | 3", default: "3", description: "Aberration mode: 0 radial, 1 horizontal, 2 vertical, 3 swirl." },
			{ name: "radius", type: "number", default: "60", description: "Channel split radius." },
			{ name: "pulse", type: "number", default: "30", description: "Animated pulse amount." },
			{ name: "speed", type: "number", default: "0", description: "Pulse animation speed." },
			{ name: "swirl", type: "number", default: "3", description: "Swirl strength when mode is 3." },
			{ name: "swirlSpeed", type: "number", default: "0", description: "Swirl animation speed when mode is 3." },
		],
	},
	"pattern-tile": {
		description: "VPK-rovo CSS background pattern tile generator with 21 pattern types, two-color palette, blend/fill controls, grid stroke customization, and optional tile animation.",
		importStatement: `import PatternTile from "@/components/website/demos/visual/pattern-tile";`,
		usage: `<PatternTile
	patternType="grid"
	front="#FFFFFF"
	back="#22DDDD"
	scale={10}
	stroke={{ style: "dashed", width: 1, dash: 6, gap: 6 }}
	fill="tile"
/>`,
		props: [
			{ name: "patternType", type: `"grid" | "wave-lines" | "clouds" | "wiggle" | "groovy" | "plus" | "circles" | "rectangles" | "lines" | "lines-vertical" | "diagonal" | "diagonal-two" | "blocks" | "wave" | "zigzag" | "polka" | "rhombus" | "stars" | "stars-two" | "paper" | "crosses"`, default: `"wave-lines"`, description: "Pattern preset used to build the CSS background image." },
			{ name: "front", type: "string", default: `"#FFFFFF"`, description: "Foreground pattern color." },
			{ name: "back", type: "string", default: `"#22DDDD"`, description: "Background color. Can be `transparent`." },
			{ name: "scale", type: "number", default: "10", description: "Size multiplier for the generated pattern tiles." },
			{ name: "stroke", type: `{ style?: "solid" | "dashed"; width?: number; dash?: number; gap?: number; dashArray?: string; dashOffset?: number; lineCap?: "butt" | "round" | "square"; lineJoin?: "miter" | "round" | "bevel"; miterLimit?: number }`, description: "Optional grid stroke settings. When `patternType=\"grid\"`, customizes solid or dashed stroke rendering; `dashArray` accepts CSS stroke-dasharray values and overrides `dash`/`gap`." },
			{ name: "radius", type: "number", default: "0", description: "Border radius applied to the pattern surface." },
			{ name: "opacity", type: "number", default: "1", description: "Overall pattern opacity." },
			{ name: "blendMode", type: `"normal" | "darken" | "multiply" | "color-burn" | "lighten" | "screen" | "plus-lighter" | "color-dodge" | "overlay" | "soft-light" | "hard-light" | "difference" | "exclusion" | "hue" | "saturation" | "color" | "luminosity"`, default: `"normal"`, description: "CSS background blend mode. `normal` lets pattern-specific defaults apply." },
			{ name: "fill", type: `"fill" | "fit" | "stretch" | "tile"`, default: `"tile"`, description: "How the generated background image fills the container." },
			{ name: "position", type: `"top-left" | "top-center" | "top-right" | "left" | "center" | "right" | "bottom-left" | "bottom-center" | "bottom-right"`, default: `"center"`, description: "Background position for non-tile fills." },
			{ name: "shouldAnimate", type: "boolean", default: "false", description: "Enables looping background-position animation for animatable tiled patterns." },
			{ name: "direction", type: `"left" | "right" | "top" | "bottom"`, default: `"left"`, description: "Scroll direction for non-wiggle animated patterns." },
			{ name: "diagonal", type: "boolean", default: "true", description: "Diagonal direction toggle for wiggle animation." },
			{ name: "duration", type: "number", default: "5", description: "Animation loop duration in seconds." },
			{ name: "className", type: "string", description: "Optional class names applied to the pattern surface." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the pattern surface." },
		],
	},
	"noise": {
		description: "CSS-based tiling noise texture overlay with configurable opacity, grain size, and border radius.",
	},
	...SHADER_LAB_LAYER_DETAILS,
	...SHADER_LAB_V2_EFFECT_DETAILS,
};
