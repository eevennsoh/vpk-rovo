import type { ComponentDetail } from "@/app/data/component-detail-types";

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
	"particles": {
		description: "PCG hash-based WebGL particle field with configurable layers, glow, blink, and optional warp tunnel mode.",
	},
	"wave-gradient": {
		description: "Noise-driven WebGL gradient with seed-dependent wave warping, 4-color blending, and smoothstep masking.",
	},
	"liquid-gradient": {
		description: "OkLCH color space gradient with turbulence, dither modes, and post-processing filters. Up to 8 palette colors.",
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
		description: "Fluted glass refraction with bars, waves, zigzag, or seigaiha shapes, chromatic dispersion, blur, and frost.",
	},
	"liquid-glass": {
		description: "Apple-style liquid glass surface with real-time SVG displacement distortion, chromatic dispersion, a crisp hairline edge with inner specular highlights, a soft drop shadow, and backdrop-filter refraction.",
		importStatement: `import LiquidGlass from "@/components/website/demos/visual/shaders/liquid-glass";`,
		usage: `<LiquidGlass width={200} height={400} borderRadius={50} />

<LiquidGlass
	width={300}
	height={200}
	borderRadius={30}
	distortionScale={-120}
	dispersion={10}
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
			{ name: "dispersion", type: "number", default: "6", description: "Offsets the red and blue channels around the base scale for chromatic separation." },
			{ name: "borderOpacity", type: "number", default: "0.35", description: "Opacity of the inset hairline edge." },
			{ name: "borderColor", type: "string", default: "\"#000000\"", description: "Color of the inset hairline edge." },
			{ name: "className", type: "string", description: "Additional CSS class names." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles object." },
		],
	},
	"glass-tabs": {
		description: "Shared liquid-glass segmented control extracted from the weather theme switcher. Uses the same elastic committed pill, hover ghost pill, and magnetic hover label drift as the weather scene.",
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
		description: "The vertical liquid-glass slider used by the weather demo (CityRailEditor + inner GlassSlider). Renders the exact same component the /weather page uses, including the same city list, liquid-glass shell, and rainbow tick.",
		importStatement: `import { GlassSlider, DEFAULT_FILL_GLASS_PROPS, DEFAULT_FILL_TINT_GRADIENT } from "@/components/arts/weather/glass-slider";\nimport { CityRailEditor } from "@/components/arts/weather/city-popover";`,
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
			{ name: "cities", type: "ReadonlyArray<LockscreenLocation>", description: "Live city list (use the `useCities` hook for the same data source the weather page uses)." },
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
		description: "Spectral chromatic aberration with radial, horizontal, vertical, and swirl modes, animated pulse, and configurable radius.",
	},
	"pattern": {
		description: "CSS background pattern generator with 20 pattern types, two-color palette, animation, and configurable scale.",
	},
	"noise": {
		description: "CSS-based tiling noise texture overlay with configurable opacity, grain size, and border radius.",
	},
};
