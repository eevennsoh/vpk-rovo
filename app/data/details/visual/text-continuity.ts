import type { ComponentDetail } from "@/app/data/component-detail-types";

export const TEXT_CONTINUITY_DETAIL: ComponentDetail = {
	description:
		"Fluid value transitions built on Lochie Axon's torph (https://torph.lochie.me, MIT) — a dependency-free morph that slides surviving characters to their new position while inserts and removals fade and scale. Its distinguishing behaviour is place-value matching for numbers: 1,204 → 1,318 rolls the hundreds and tens and leaves the thousands alone, and the currency symbols, separators and signs around them travel with the places they belong to, so a value re-reads as the same figure changing rather than a new string appearing. Pass cursorIndex to switch a field somebody is typing in from place matching to caret matching — inserting a digit shifts the column instead of renumbering it. torph owns its host element's subtree imperatively, so children are passed as a string rather than as elements; it honours prefers-reduced-motion itself. TextContinuityProvider supplies shared defaults (duration, easing preset or spring, scale, place-value numbers, debug, disabled) that per-callsite props override. The demo ports all 33 examples from torph.lochie.me/examples, restyled to ADS tokens.",
	importStatement: `import TextContinuity, { TextContinuityProvider } from "@/components/visual/text-continuity";
import { DEFAULT_CONFIG, SETTLE_SPRING } from "@/components/visual/text-continuity/data";`,
	usage: `<TextContinuity>{\`$\${total.toLocaleString("en")}\`}</TextContinuity>`,
	props: [
		{
			name: "children",
			type: "string",
			description:
				"The value to render. Changing it triggers the morph from the previous value. Newlines render as line breaks — torph's root is white-space: nowrap, so wrapping must be explicit (see wrap() in ./lib).",
		},
		{
			name: "duration",
			type: "number",
			default: "400",
			description: "Morph duration in ms, overriding the shared config. Ignored when the easing is a spring, which settles on its own physics.",
		},
		{
			name: "ease",
			type: "string | SpringEase",
			default: 'EASE_CURVES.signature',
			description:
				"A CSS easing string or spring parameters ({ stiffness, damping, mass, precision }), overriding the shared config. SETTLE_SPRING is the preset several examples reach for.",
		},
		{
			name: "cursorIndex",
			type: "number",
			default: "undefined",
			description:
				"Caret position. Switches a single-number value from place matching to caret matching — the right default for a field being typed in, where the character that changed is known and place value is not the point.",
		},
		{
			name: "locale",
			type: "Intl.LocalesArgument",
			default: '"en"',
			description: "Locale for text segmentation and numeric formatting. Instance configuration, not a live prop — changing it re-attaches the morph.",
		},
		{ name: "className", type: "string", default: "undefined", description: "Class applied to the morph's root element." },
		{ name: "style", type: "React.CSSProperties", default: "undefined", description: "Inline style applied to the morph's root element." },
		{ name: "as", type: "React.ElementType", default: '"span"', description: "Element the morph renders as." },
	],
};
