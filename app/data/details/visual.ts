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
	"graph": {
		description: "Reusable graph canvas harvested from the Personal Graph surface, with the same neural layout, pan, zoom, selection, theme, and editable parameter controls.",
		importStatement: `import Graph from "@/components/website/demos/visual/graph";`,
		usage: `<Graph />`,
		props: [
			{ name: "explorer", type: "VaultExplorer", description: "Optional graph data shaped like the Personal Graph explorer response. Defaults to the bundled visual sample graph." },
			{ name: "initialParams", type: "Partial<NeuralGraphParams>", default: "DEFAULT_NEURAL_GRAPH_PARAMS", description: "Initial values for speed, amplitude, frequency, octaves, structure, cone, and node style controls." },
			{ name: "initialSelectedNodeId", type: "string | null", default: "null", description: "Node id to focus when the component first renders." },
			{ name: "showControls", type: "boolean", default: "true", description: "Whether to render the VPK GUI controls under the canvas." },
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
		description: "Spectral chromatic aberration with radial, horizontal, vertical, and swirl modes, animated pulse, and configurable radius.",
	},
	"pattern": {
		description: "CSS background pattern generator with 20 pattern types, two-color palette, animation, and configurable scale.",
	},
	"noise": {
		description: "CSS-based tiling noise texture overlay with configurable opacity, grain size, and border radius.",
	},
};
