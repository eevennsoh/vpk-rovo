import type { ComponentDetail } from "@/app/data/component-detail-types";

export const HEATMAP_DETAIL: ComponentDetail = {
		description: "A glowing gradient of colors flowing through a shape: staggered soft waves travel through the shape's interior, an animated band sweeps the outer glow, and heat is mapped across a four-color ramp. Built on the Paper Shaders heatmap, with the parameter set of the reference effect — background, four heat colors plus an active-color count, contour, inner glow, outer glow, angle, noise, and speed. The shader runtime is loaded on demand and browser-only, and each built-in silhouette is generated and cached at module scope so remounting never re-pays the source blur. The surface is decorative: `aria-hidden`, `pointer-events-none`, and `inert`. Under reduced motion it renders a single static frame instead of disappearing.",
		importStatement: `import Heatmap, {
	DEFAULT_HEATMAP_CONFIG,
	HEATMAP_DEFAULT_HEAT_COLORS,
	type HeatmapShapeId,
} from "@/components/visual/heatmap";`,
		usage: `<div className="h-80 w-full overflow-hidden rounded-lg">
	<Heatmap
		angle={0}
		colorBack="#05020D"
		colorCount={4}
		colors={["#260D59", "#D92659", "#FF8C26", "#FFF2BF"]}
		contour={0.5}
		innerGlow={0.5}
		noise={0.25}
		outerGlow={0.35}
		shape="circle"
		speed={1}
	/>
</div>`,
		demoLayout: {
			previewContentWidth: "full",
			previewHeight: "fit",
			examplesContentWidth: "full",
		},
		examples: [
			{ title: "Shapes", description: "The same heat settings flowing through each built-in silhouette.", demoSlug: "heatmap-demo-shapes" },
			{ title: "Color ramp", description: "The active-color count from 1 to 4, showing how the ramp collapses toward the cold end.", demoSlug: "heatmap-demo-color-ramp" },
			{ title: "Glow balance", description: "Inner glow only, the balanced default, and outer glow only.", demoSlug: "heatmap-demo-glow-balance" },
			{ title: "Contour and grain", description: "Edge heat at 0 and 1, then the grain overlay pushed to 0.8.", demoSlug: "heatmap-demo-contour-and-grain" },
			{ title: "Angle", description: "Heat wave direction at 0, 90, 180, and 270 degrees.", demoSlug: "heatmap-demo-angle" },
		],
		props: [
			{ name: "colorBack", type: "string", default: `"#05020D"`, description: "Scene background color, painted under every heat stop." },
			{ name: "colors", type: "readonly string[]", default: `["#260D59", "#D92659", "#FF8C26", "#FFF2BF"]`, description: "Heat ramp slots, cold to hot. Padded or trimmed to exactly four slots, so `colors[n]` stays addressable by slot index and lowering `colorCount` never loses a tuned color." },
			{ name: "colorCount", type: "number", default: "4", description: "How many leading ramp slots reach the shader (1 to 4). Maps to the shader's own active-color count." },
			{ name: "contour", type: "number", default: "0.5", description: "Heat intensity at the shape's edges, 0 to 1." },
			{ name: "innerGlow", type: "number", default: "0.5", description: "Size of the heated area inside the shape, 0 to 1." },
			{ name: "outerGlow", type: "number", default: "0.35", description: "Size of the heated area outside the shape, 0 to 1." },
			{ name: "angle", type: "number", default: "0", description: "Heat wave direction in degrees, 0 to 360." },
			{ name: "noise", type: "number", default: "0.25", description: "Grain overlay intensity across the whole graphic, 0 to 1." },
			{ name: "speed", type: "number", default: "1", description: "Animation speed multiplier. `0` renders a single static frame and stops the animation loop — which is also what reduced motion forces." },
			{ name: "shape", type: `"circle" | "square" | "ring" | "pill"`, default: `"circle"`, description: "Built-in silhouette the heat flows through. Ignored when `image` is set." },
			{ name: "image", type: "string", description: "Custom silhouette source: a SQUARE image, black shape on a transparent ground. A non-square source renders the shape at the wrong height, because the library un-pads with a fixed factor that is only correct on the long axis." },
			{ name: "fit", type: `"contain" | "cover"`, default: `"contain"`, description: "How the square source is fitted into a non-square canvas. `cover` crops to a slice through the shape; use it for full-bleed backgrounds." },
			{ name: "scale", type: "number", default: "1", description: "Shader zoom." },
			{ name: "className", type: "string", description: "Class names merged onto the host. The component owns `relative size-full overflow-hidden pointer-events-none`." },
			{ name: "style", type: "React.CSSProperties", description: "Inline styles for the host element." },
			{ name: "ref", type: "React.Ref<HTMLDivElement>", description: "Ref for the host element, using the repo's React 19 ref-as-prop convention." },
		],
	};
