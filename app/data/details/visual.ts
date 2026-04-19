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
			{ name: "blur", type: "number", default: "8", description: "Blur applied to the displacement map inner rect." },
			{ name: "displace", type: "number", default: "0", description: "Output Gaussian blur (stdDeviation) on the refracted result." },
			{ name: "backgroundOpacity", type: "number", default: "0", description: "Background frost opacity (0 = clear, 1 = fully frosted)." },
			{ name: "saturation", type: "number", default: "1", description: "Backdrop-filter saturation multiplier." },
			{ name: "distortionScale", type: "number", default: "-90", description: "Main displacement scale applied to all channels." },
			{ name: "dispersion", type: "number", default: "6", description: "Chromatic dispersion amount added to the distortion scale." },
			{ name: "borderOpacity", type: "number", default: "0.35", description: "Opacity of the inset hairline edge." },
			{ name: "borderColor", type: "string", default: "\"#000000\"", description: "Color of the inset hairline edge." },
			{ name: "className", type: "string", description: "Additional CSS class names." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles object." },
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
};
