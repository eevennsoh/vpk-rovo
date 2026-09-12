import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BORDER_BEAM_DETAIL: ComponentDetail = {
		description: "Animated traveling and breathing border glow adapted from Jakubantalik/border-beam. It wraps any opaque surface, auto-detects the first child's border radius, renders decorative beam layers with pointer-events disabled, pauses pulse animation offscreen, and supports rotate, line, pulse-inner, and pulse-outside presets. Every preview below follows the page's light/dark theme.",
		importStatement: `import BorderBeam, {
	BORDER_BEAM_DEFAULTS,
	type BorderBeamProps,
} from "@/components/visual/border-beam";`,
		usage: `<BorderBeam
	size="pulse-outside"
	colorVariant="colorful"
	theme="dark"
	strength={0.7}
>
	<div className="rounded-2xl border bg-surface p-4">Content</div>
</BorderBeam>`,
		demoLayout: {
			previewContentWidth: "full",
			previewHeight: "fit",
			examplesContentWidth: "full",
		},
		examples: [
			{ title: "Rotate large card", description: "Full-border traveling beam around a large rounded surface.", demoSlug: "border-beam-demo-rotate-large" },
			{ title: "Rotate small button", description: "Compact rotating beam on a small circular surface.", demoSlug: "border-beam-demo-rotate-small" },
			{ title: "Line search", description: "Bottom-only line beam moving across a rounded pill surface.", demoSlug: "border-beam-demo-line-search" },
			{ title: "Pulse inner working card", description: "Contained breathing border glow on a card surface.", demoSlug: "border-beam-demo-pulse-inner-working" },
			{ title: "Pulse pill", description: "Contained pulse around a compact pill surface.", demoSlug: "border-beam-demo-pulse-pill" },
			{ title: "Pulse outside", description: "Outward-blooming halo around an opaque surface.", demoSlug: "border-beam-demo-pulse-outside" },
			{ title: "Mono pulse search", description: "Grayscale pulse on a rounded pill surface.", demoSlug: "border-beam-demo-mono-pulse-search" },
			{ title: "Compact gallery", description: "Ocean, sunset, and colorful variants in a dense grid.", demoSlug: "border-beam-demo-compact-gallery" },
			{ title: "Play / pause", description: "Toggle the active prop to fade the beam in and out with its built-in transitions.", demoSlug: "border-beam-demo-play-pause" },
			{ title: "Strength ladder", description: "The same beam at strength 0.35, 0.65, and 1 to show intensity scaling.", demoSlug: "border-beam-demo-strength-ladder" },
			{ title: "Reflection", description: "Two pulse-outside surfaces placed close together so their outward halos bleed into the gap and glow onto each other.", demoSlug: "border-beam-demo-reflection" },
		],
		props: [
			{ name: "children", type: "React.ReactNode", description: "Opaque wrapped content. `pulse-outside` renders its core behind the child, so transparent children show the inner glow through the surface." },
			{ name: "size", type: `"sm" | "md" | "line" | "pulse-outside" | "pulse-inner"`, default: `"md"`, description: "Effect preset. `sm`, `md`, and `line` are rotating/traveling beams; pulse presets breathe without rotation." },
			{ name: "colorVariant", type: `"colorful" | "mono" | "ocean" | "sunset"`, default: `"colorful"`, description: "Beam palette. `mono` forces static colors; other palettes can hue-shift." },
			{ name: "theme", type: `"dark" | "light" | "auto"`, default: `"dark"`, description: "Color tuning for dark or light backgrounds. `auto` follows `prefers-color-scheme`." },
			{ name: "staticColors", type: "boolean", default: "false", description: "Disables hue-shift animation. The `mono` palette always behaves as static." },
			{ name: "duration", type: "number", default: "1.96 / 3.1 / 2.3", description: "Animation cycle duration in seconds for rotate, line, and pulse presets respectively." },
			{ name: "active", type: "boolean", default: "true", description: "Turns the effect on or off with the upstream fade-in/fade-out transition." },
			{ name: "borderRadius", type: "number", description: "Optional explicit radius in pixels. When omitted, the component reads the first child's computed top-left radius and falls back to the preset." },
			{ name: "brightness", type: "number", default: "1.3", description: "Glow brightness multiplier. Pulse presets have tuned defaults per size and theme." },
			{ name: "saturation", type: "number", default: "theme preset", description: "Glow saturation multiplier from the selected size/theme preset unless explicitly overridden." },
			{ name: "hueRange", type: "number", default: "30", description: "Hue rotation range in degrees. The line preset clamps this internally to 13 degrees." },
			{ name: "strength", type: "number", default: "1", description: "Overall beam, glow, and bloom intensity from 0 to 1. Does not affect child opacity." },
			{ name: "className", type: "string", description: "Class names applied to the beam wrapper." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles merged onto the beam wrapper. The component owns `--beam-strength` and pulse scale CSS variables." },
			{ name: "ref", type: "React.Ref<HTMLDivElement>", description: "Ref for the beam wrapper, using the repo's React 19 ref-as-prop convention." },
			{ name: "onActivate", type: "() => void", description: "Called when the fade-in animation completes." },
			{ name: "onDeactivate", type: "() => void", description: "Called when the fade-out animation completes." },
		],
	};
