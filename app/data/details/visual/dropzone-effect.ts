import type { ComponentDetail } from "@/app/data/component-detail-types";

export const DROPZONE_EFFECT_DETAIL: ComponentDetail = {
	description:
		"A continuous diagonal river of holographic die-cut stickers tumbling out of a starfield and being swallowed by a small glass orb. Rendered in three.js with instanced quads and custom shaders: the artwork is rasterised at runtime from vector paths into colour and surface atlases — no image assets are fetched or bundled — the surface normal is differentiated from a baked dome height so a flat die-cut lights like a domed object, and thin-film interference shifts the foil's hue with view angle. The orb is a real light in the shading, so a sticker catches its glow on the way in. Decorative and aria-hidden: it takes no pointer input, pauses when scrolled out of view or when the tab is hidden, and renders a single composed still under Reduce Motion.",
	// `visual` can never get the borderless full-page docs shell —
	// `shouldUseFullPagePreview` is hardcoded to projects/blocks — so "full"
	// stretches the demo across the standard inset shell, and
	// /preview/visual/dropzone-effect stays the true full-bleed surface.
	demoLayout: { previewContentWidth: "full" },
	importStatement: `import { DropzoneEffect } from "@/components/visual/dropzone-effect";`,
	usage: `<div className="relative h-dvh w-full bg-black">
	<DropzoneEffect />
</div>`,
	props: [
		{
			name: "className",
			type: "string",
			description:
				"Class names merged onto the full-bleed wrapper, which fills its nearest positioned ancestor.",
		},
		{
			name: "paused",
			type: "boolean",
			default: "false",
			description:
				"Freezes the river on its current frame and drops the render loop to on-demand. The last frame stays on screen.",
		},
		{
			name: "tuning",
			type: "Partial<DropzoneTuning>",
			description:
				"Live overrides for density, speed, orb size, catch light, iridescence, dome, exposure, bloom, near defocus and grain. Anything omitted keeps its measured default; see DROPZONE_TUNING_DEFAULTS.",
		},
	],
};
