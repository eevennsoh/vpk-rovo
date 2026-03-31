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
