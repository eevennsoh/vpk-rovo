import type { ComponentDetail } from "@/app/data/component-detail-types";

export const LIQUID_METAL_DETAIL: ComponentDetail = {
		description: "Liquid metal wrapper vendored from Jakub Antalik's metal-fx. It paints an animated shared WebGL metal shader into a rounded host ring, with chromatic, silver, and gold presets, dark/light theme tuning, optional glow, and dark-mode proximity reflections for supplied target refs.",
		importStatement: `import LiquidMetal, {
	DEFAULT_LIQUID_METAL_CONFIG,
	type MetalFxProps,
} from "@/components/visual/liquid-metal";`,
		usage: `<LiquidMetal
	variant="button"
	preset="chromatic"
	theme="auto"
	strength={1}
	borderRadius={999}
>
	<button type="button" className="rounded-full px-5 py-2">
		Liquid Metal
	</button>
</LiquidMetal>`,
		examples: [
			{ title: "Pill host", description: "A static pill host. The material follows the page-level preset — metal-fx renders every visible instance from one shared GL canvas.", demoSlug: "liquid-metal-demo-chromatic-pill" },
			{ title: "Pulsing pill host", description: "The same pill host with the pulse treatment.", demoSlug: "liquid-metal-demo-silver-pill" },
			{ title: "Circle send button", description: "The upstream circle variant on an icon button.", demoSlug: "liquid-metal-demo-gold-send" },
			{ title: "Proximity reflection", description: "A metal pill sitting close to a few neighboring surfaces wired as reflectionTargets.", demoSlug: "liquid-metal-demo-chat-reflection" },
		],
		props: [
			{ name: "children", type: "React.ReactNode", description: "Single wrapped host element or node measured by metal-fx for the painted ring." },
			{ name: "variant", type: `"button" | "circle"`, default: `"button"`, description: "Upstream geometry variant. Button uses the pill baseline; circle uses compact circular ring tuning." },
			{ name: "preset", type: `"chromatic" | "silver" | "gold"`, default: `"chromatic"`, description: "Bundled upstream material palette." },
			{ name: "theme", type: `"auto" | "dark" | "light"`, default: `"auto"`, description: "Theme tuning. Auto follows prefers-color-scheme; dark and light pin a mode." },
			{ name: "strength", type: "number", default: "1", description: "Rendered alpha multiplier for the shader bitmap and glow." },
			{ name: "paused", type: "boolean", default: "false", description: "Freezes this instance's visible canvas while preserving the last painted frame." },
			{ name: "borderRadius", type: "number", description: "Optional explicit CSS-pixel corner radius. When omitted, metal-fx reads the wrapped host radius." },
			{ name: "normalizeHostStyles", type: "boolean", default: "true", description: "Removes host chrome that would visually clash with the metal ring while preserving inner content." },
			{ name: "reflectionTargets", type: "ReadonlyArray<React.RefObject<HTMLElement | null>>", description: "Adjacent target refs that receive dark-mode proximity reflections." },
			{ name: "disableGlow", type: "boolean", default: "false", description: "Disables the wandering halo overlay while keeping the shader ring." },
			{ name: "shaderScale", type: "number", description: "Optional shader sampling scale override." },
			{ name: "ringCssPx", type: "number", description: "Optional ring thickness override in CSS pixels." },
			{ name: "scale", type: "number", default: "1", description: "Master multiplier for shader, ring, glow, and reflection absolute-pixel constants." },
			{ name: "className", type: "string", description: "Class names forwarded to the metal-fx wrapper element." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles forwarded to the metal-fx wrapper element." },
			{ name: "ref", type: "React.Ref<HTMLDivElement>", description: "Ref forwarded to the metal-fx wrapper div." },
		],
	};
