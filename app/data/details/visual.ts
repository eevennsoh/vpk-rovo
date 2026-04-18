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
		description: "A Framer-style liquid glass shell built with an SVG displacement filter, translucent fill, and masked diagonal border sheen. Sized externally and tuned for tall editorial pills by default.",
		importStatement: `import LiquidGlass from "@/components/website/demos/visual/shaders/liquid-glass";`,
		usage: `<div className="relative h-[607px] w-[188px]">
	<LiquidGlass className="size-full" />
</div>

<div className="relative h-80 w-56">
	<LiquidGlass
		className="size-full"
		fillOpacity={0.14}
		displacementScale={-150}
		blur={5.2}
	>
		<div className="flex h-full items-end p-5 text-sm text-text">
			Content stays crisp above the distortion layer.
		</div>
	</LiquidGlass>
</div>`,
		props: [
			{ name: "className", type: "string", description: "Applies external sizing and layout classes. Size the component from the outside in v1." },
			{ name: "children", type: "React.ReactNode", description: "Optional foreground content rendered above the glass layer." },
			{ name: "radius", type: "number", default: "81", description: "Corner radius in pixels. The SVG map is regenerated to match the rendered box." },
			{ name: "fillColor", type: "string", default: "\"#ffffff\"", description: "Base tint color mixed into the translucent glass surface." },
			{ name: "fillOpacity", type: "number", default: "0.1", description: "Frost opacity of the glass fill (0 = clear, 1 = fully frosted)." },
			{ name: "displacementScale", type: "number", default: "-133", description: "Base scale of the liquid displacement map applied through the SVG filter." },
			{ name: "blur", type: "number", default: "4.15", description: "Final Gaussian blur radius applied to the refracted RGB channels." },
			{ name: "lightness", type: "number", default: "88", description: "Lightness (0–100) of the inner displacement map fill controlling refraction intensity." },
			{ name: "alpha", type: "number", default: "0.9", description: "Alpha (0–1) of the inner displacement map fill controlling refraction blending." },
			{ name: "dispersion", type: "number", default: "0", description: "Chromatic dispersion amount added to the displacement scale." },
			{ name: "mapBlur", type: "number", default: "5", description: "CSS blur applied to the inner displacement map rect for softer refraction edges." },
			{ name: "mapInset", type: "number", default: "0.05", description: "Inset ratio (0–0.5) for the inner displacement map rect." },
			{ name: "borderOpacity", type: "number", default: "0.7", description: "Opacity of the diagonal masked border highlight." },
			{ name: "borderAngle", type: "number", default: "315", description: "Angle, in degrees, for the diagonal border sheen gradient." },
			{ name: "borderColor", type: "string", default: "\"#171717\"", description: "Color of the diagonal border sheen gradient." },
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
