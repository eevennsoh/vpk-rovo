import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_LINKING_DETAIL: ComponentDetail = {
	description:
		"A WebGL2 metaball field that fuses a travelling element into the thing it is being linked to. The two silhouettes neck together through a signed-distance smooth union as they close, subject colours blend in OKLab across the neck, and on release they collapse into the target with velocity-driven chromatic dispersion. The host owns the gesture; this only draws.",
	importStatement: `import {
	JiraLinking,
	resolveJiraLinkingNearness,
	type JiraLinkingIdentity,
	type JiraLinkingTarget,
} from "@/components/blocks/jira-linking";`,
	usage: `<JiraLinking
	sourceSelector="[data-drag-chip]"
	target={{ anchor: { x: 240, y: 372 }, height: 144, radius: 10, width: 272 }}
	nearness={resolveJiraLinkingNearness(distanceToCard)}
	identities={[{ id: "claude", tint: [0.85, 0.47, 0.34] }]}
	release={dropped ? { id: releaseId, target } : null}
	onFuseSettled={clearRelease}
/>`,
	demoLayout: {
		previewContentWidth: "full",
		previewHeight: "fit",
		examplesContentWidth: "full",
	},
	examples: [
		{
			title: "Drag to link",
			description:
				"Drag one session onto the work item, or Command-click to mark several and drag them together. The chin bleeds in with proximity, and the drop flies each session into the card's agent session row — then the chin row sweeps.",
			demoSlug: "jira-linking-drag-to-link",
		},
		{
			title: "Multi-subject colour melt",
			description:
				"Command-click two or three sessions, then drag them onto the card. Only the first two tint the field — a pair makes a legible gradient across the neck, where three or more average out in OKLab into a muddy neutral. On drop they fly into the card's agent session row one after another, the same stagger as the create well.",
			demoSlug: "jira-linking-colour-melt",
		},
	],
	props: [
		{
			name: "sourceSelector",
			type: "string",
			required: true,
			description:
				"CSS selector for the travelling element, re-measured every frame. A selector rather than a ref because the source is usually a portal the host mounts and unmounts mid-gesture. Resolved against the whole document, so it must be unique per instance — two effects sharing one attribute both measure the first match.",
		},
		{
			name: "target",
			type: "JiraLinkingTarget | null",
			required: true,
			description:
				"Where the field is pulling: `{ anchor: { x, y }, width }` in client coordinates. Null when nothing is targeted.",
		},
		{
			name: "nearness",
			type: "number",
			required: true,
			description:
				"0-1 closeness of source to target. Drives field alpha and how wide the neck reaches. Use `resolveJiraLinkingNearness(distance)` for the house smoothstep ramp.",
		},
		{
			name: "identities",
			type: "readonly JiraLinkingIdentity[] | null",
			required: true,
			description:
				"Subjects that melt together. Only the first two tint the field (`JIRA_LINKING_MAX_TINT_SUBJECTS`) — more than that averages into a muddy neutral. Keep referentially stable per gesture; the texture atlas rebuilds when the array identity changes.",
		},
		{
			name: "release",
			type: "JiraLinkingRelease | null",
			required: true,
			description:
				"Set on drop to run the 400ms fuse (`{ id, target }`) or to fly subjects into the landing (`{ id, target, drop }`). `drop.playback` defaults to `stagger` — one chip per subject, delayed by 70ms, matching the create well. For a card attach, `target` is the agent session row at the bottom, not the card centre. Bump `id` to restart.",
		},
		{
			name: "onFuseSettled",
			type: "() => void",
			description: "Fires once the fuse has collapsed, or once every drop flight has landed, so the host can clear its release state.",
		},
		{
			name: "surfaceVariable",
			type: "string",
			default: '"--color-bg-accent-gray-subtlest"',
			description:
				"Theme variable both blobs are tinted from. The default is the neutral attach material, which reads against a white card; a white tint would make the goo invisible on the surface it necks across.",
		},
		{
			name: "zIndex",
			type: "number",
			default: "290",
			description: "Stacking order of the portal layer. Keep it below the host's drag layer so the travelling label stays readable.",
		},
	],
	subComponents: [
		{
			name: "JiraLinkingIdentity",
			description:
				"One subject's identity. Colour is the primary channel and the image is opportunistic — most hosts identify a subject with a brand logo component rather than an image URL.",
			props: [
				{ name: "id", type: "string", required: true, description: "Stable subject id." },
				{ name: "imageSrc", type: "string", description: "Same-origin image drawn into the texture atlas." },
				{ name: "tint", type: "readonly [number, number, number]", description: "Explicit 0-1 sRGB tint. Highest precedence." },
				{ name: "tintVariable", type: "string", description: "Theme variable to read the tint from, e.g. `--color-purple-500`. Lets a host keep its own identity palette." },
				{ name: "tintSeed", type: "string", description: "Hashed instead of `id` when identity and colour should differ." },
			],
		},
	],
};
