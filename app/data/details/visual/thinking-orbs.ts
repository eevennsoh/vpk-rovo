import type { ComponentDetail } from "@/app/data/component-detail-types";

export const THINKING_ORBS_DETAIL: ComponentDetail = {
	description:
		"Dotted canvas indicators for AI and agent activity. The nine hand-tuned states, two size presets, theme detection, and render lifecycle come from Jakub Antalik's MIT-licensed thinking-orbs package (pinned, not forked). VPK adds two pointer effects built on its public engine API: dot gravity, where the dots bend toward the cursor, and cursor gravity, where the pointer bends toward the orb.",
	importStatement: `import {
	ThinkingOrb,
	type ThinkingOrbProps,
} from "@/components/visual/thinking-orbs";`,
	usage: `<ThinkingOrb state="listening" size={64} speed={1.25} />`,
	demoLayout: {
		previewContentWidth: "full",
		previewHeight: "fit",
		examplesContentWidth: "full",
	},
	adsLinks: [
		{ label: "Original demo", url: "https://orbs.jakubantalik.com/" },
		{
			label: "Source and MIT license",
			url: "https://github.com/JakubAntalik/thinking-orbs",
		},
	],
	examples: [
		{
			title: "Working",
			description: "Particles travel along several tilted orbital paths.",
			demoSlug: "thinking-orbs-demo-working",
		},
		{
			title: "Searching",
			description: "A scan meridian sweeps across a dotted globe.",
			demoSlug: "thinking-orbs-demo-searching",
		},
		{
			title: "Solving",
			description: "Dotted bands scramble and click back into alignment.",
			demoSlug: "thinking-orbs-demo-solving",
		},
		{
			title: "Listening",
			description: "A waveform rolls through the orb's latitude rings.",
			demoSlug: "thinking-orbs-demo-listening",
		},
		{
			title: "Connecting",
			description:
				"A constellation wires itself together while packets run along its edges.",
			demoSlug: "thinking-orbs-demo-connecting",
		},
		{
			title: "Weaving",
			description: "Three dotted strands plait around the sphere.",
			demoSlug: "thinking-orbs-demo-weaving",
		},
		{
			title: "Composing",
			description: "An undulating multi-band sash wraps around the orb.",
			demoSlug: "thinking-orbs-demo-composing",
		},
		{
			title: "Breathing",
			description: "A face-on dotted ring slowly expands and contracts.",
			demoSlug: "thinking-orbs-demo-breathing",
		},
		{
			title: "Shaping",
			description:
				"A dotted outline morphs between a circle, triangle, and square.",
			demoSlug: "thinking-orbs-demo-shaping",
		},
	],
	props: [
		{
			name: "state",
			type: '"working" | "searching" | "solving" | "listening" | "connecting" | "weaving" | "composing" | "breathing" | "shaping"',
			default: '"working"',
			description:
				"Selects one of the nine hand-tuned agent activity animations.",
		},
		{
			name: "size",
			type: "64 | 20",
			default: "64",
			description:
				"Selects the large or inline preset. Dot count, dot size, and speed are tuned independently for each size.",
		},
		{
			name: "theme",
			type: '"auto" | "dark" | "light"',
			default: '"auto"',
			description:
				"Uses light ink on dark surfaces or dark ink on light surfaces. Auto follows an ancestor theme marker or the OS preference.",
		},
		{
			name: "speed",
			type: "number",
			default: "1",
			description:
				"Multiplier applied to the state's tuned base animation speed.",
		},
		{
			name: "paused",
			type: "boolean",
			default: "false",
			description: "Freezes the orb while preserving its current visual state.",
		},
		{
			name: "gravity",
			type: "boolean | OrbGravity",
			default: "false",
			description:
				"Opt-in cursor gravity. Dots bend toward the pointer with an inverse-square falloff and ease back when it leaves. Pass true for size-derived defaults, or an object to tune radius, pull, and swell. Inert under reduced motion and while paused.",
		},
		{
			name: "cursorGravity",
			type: "boolean | Partial<CursorGravityTuning>",
			default: "false",
			description:
				"The inverse of gravity: the pointer bends toward the orb. Swaps the native cursor for a drawn replica whose tip stays pinned while its body leans, trails, and blurs toward the nearest orb. One replica is shared page-wide by every orb that opts in, so tuning is global and reach is the only per-orb value. Requires a fine pointer; inert under reduced motion, and restores the native cursor if it ever fails.",
		},
		{
			name: "aria-label",
			type: "string",
			description: "Overrides the built-in state-specific accessible label.",
		},
		{
			name: "className / style",
			type: "string / React.CSSProperties",
			description:
				"Standard canvas styling props. Remaining canvas attributes and data attributes are forwarded.",
		},
	],
};
