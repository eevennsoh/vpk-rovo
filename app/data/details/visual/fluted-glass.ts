import type { ComponentDetail } from "@/app/data/component-detail-types";

export const FLUTED_GLASS_DETAIL: ComponentDetail = {
		description: "VPK fluted glass refraction with bars, waves, zigzag, or seigaiha shapes, chromatic dispersion, blur, frost, and uploaded image support.",
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
	};
