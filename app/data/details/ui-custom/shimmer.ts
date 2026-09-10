import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SHIMMER_DETAIL: ComponentDetail = {
	demoLayout: { previewContentWidth: "full" },
	description:
		"An animated gradient sweep across text, for loading and in-progress states. Rendering is the `shimmer` utility from shadcn's Tailwind stylesheet — pure CSS with no Motion runtime — so every utility modifier (color, duration, spread, angle, once, reverse, disable) composes through `className`, including under variants like `md:` and `dark:`. Reduced motion is handled by the utility itself. For the per-character 3D wave, use Shimmer Wave.",
	usage: `import { Shimmer } from "@/components/ui-custom/shimmer";

<Shimmer>Thinking...</Shimmer>
<Shimmer as="span" duration={1}>Fast shimmer</Shimmer>
<Shimmer spread={4} className="text-lg">Wide spread shimmer</Shimmer>

// Utility modifiers compose through className
<Shimmer className="shimmer-color-blue-500/60">Generating response…</Shimmer>
<Shimmer className="shimmer-duration-1000">Generating response…</Shimmer>
<Shimmer className="shimmer-spread-24">Generating response…</Shimmer>
<Shimmer className="shimmer-angle-45">Generating response…</Shimmer>
<Shimmer className="shimmer-duration-1100 shimmer-once">Response generated.</Shimmer>
<Shimmer className="md:shimmer-none">Static from md up</Shimmer>

// The effect is a utility, so it also works without the component
<MarkerContent className="shimmer">Thinking…</MarkerContent>`,
	props: [
		{
			name: "children",
			type: "string",
			required: true,
			description: "The text content receiving the shimmer effect.",
		},
		{
			name: "as",
			type: "ElementType",
			default: '"p"',
			description: "HTML element or React component to render as.",
		},
		{
			name: "className",
			type: "string",
			description:
				"Additional CSS classes. Accepts the shimmer utility modifiers: shimmer-color-*, shimmer-duration-*, shimmer-spread-*, shimmer-angle-*, shimmer-once, shimmer-reverse, and shimmer-none.",
		},
		{
			name: "duration",
			type: "number",
			description:
				"Seconds for one sweep. Overrides the utility default (2s). Omit to leave shimmer-duration-* free to control it.",
		},
		{
			name: "spread",
			type: "number",
			description:
				"Highlight band width as a multiplier of text length (resolves to children.length * spread pixels). Overrides the utility default (3ch + 40px). Omit to leave shimmer-spread-* free to control it.",
		},
	],
	subComponents: [
		{
			name: "Shimmer",
			description:
				"Memoized polymorphic element carrying the shimmer utility class. Forwards remaining HTML attributes, so dir, role, and aria-* pass through.",
		},
	],
	examples: [
		{ title: "Custom duration", description: "Shimmer with varying animation speeds set through the duration prop: fast (1s), slow (3s), and very slow (5s).", demoSlug: "shimmer-demo-custom-duration" },
		{ title: "Custom spread", description: "Shimmer with narrow, wide, and extra wide gradient spread set through the spread prop.", demoSlug: "shimmer-demo-custom-spread" },
		{ title: "Color", description: "Custom highlight colors using a theme color with alpha and an arbitrary hex value.", demoSlug: "shimmer-demo-color" },
		{ title: "Duration utility", description: "Animation speed set through the shimmer-duration-* class in milliseconds.", demoSlug: "shimmer-demo-duration-utility" },
		{ title: "Spread utility", description: "Highlight band width set through shimmer-spread-* on the spacing scale and as an arbitrary length.", demoSlug: "shimmer-demo-spread-utility" },
		{ title: "Angle", description: "Tilt the highlight band with shimmer-angle-*.", demoSlug: "shimmer-demo-angle" },
		{ title: "Play once", description: "A single sweep with shimmer-once, useful for completion reveals.", demoSlug: "shimmer-demo-once" },
		{ title: "Disabling", description: "Turn the effect off with shimmer-none, outright or responsively.", demoSlug: "shimmer-demo-disabled" },
		{ title: "RTL", description: "The sweep reverses direction automatically under dir=\"rtl\".", demoSlug: "shimmer-demo-rtl" },
		{ title: "With Marker", description: "The utility class applied directly to another component's content, without the Shimmer wrapper.", demoSlug: "shimmer-demo-marker" },
		{ title: "Polymorphic", description: "Shimmer rendered as heading and span elements with different text sizes.", demoSlug: "shimmer-demo-heading" },
	],
};
