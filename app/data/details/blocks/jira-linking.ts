import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_LINKING_DETAIL: ComponentDetail = {
	description:
		"A decorative linking effect for dragging agent sessions into Jira work items. Fuse uses the original WebGL2 metaball field; Glow reproduces the Jira board's lift, shrink, fade, contextual card glow, and backdrop pulse using the lead avatar's accent colour. The host owns the gesture; this component only draws.",
	importStatement: `import {
	JiraLinking,
	resolveJiraLinkingNearness,
	type JiraLinkingIdentity,
	type JiraLinkingTarget,
} from "@/components/blocks/jira-linking";`,
	usage: `<JiraLinking
	variant="fuse"
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
				title: "Fuse",
				description:
					"The original shader variant. Compare linking into a work item with a running agent session and one with no session yet. The metaball field necks the travelling chip into the selected card, then the drop flies each session into its agent session row.",
			demoSlug: "jira-linking-fuse",
		},
		{
				title: "Glow",
				description:
					"Compare linking into a work item with a running agent session and one with no session yet. The dragged session lifts, accelerates into the selected card while shrinking and fading, then the surface glows and a pulse in the lead avatar's accent colour travels through its backdrop. This card-level acknowledgement replaces the session-row flash.",
			demoSlug: "jira-linking-glow",
		},
	],
	props: [
		{
			name: "variant",
			type: '"fuse" | "glow"',
			default: '"fuse"',
			description:
					"Visual treatment for the link. Fuse uses the metaball shader; Glow uses the contextual card glow and depth-like lift, shrink, and fade drop from the Jira board reference.",
		},
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
					"Subjects being linked. Fuse uses the first two to tint the field (`JIRA_LINKING_MAX_TINT_SUBJECTS`); Glow uses the lead identity's tint for its halo and backdrop pulse. Keep referentially stable per gesture.",
		},
		{
			name: "release",
			type: "JiraLinkingRelease | null",
			required: true,
			description:
				"Set on drop to run the 400ms Fuse (`{ id, target }`) or animate subjects into the landing (`{ id, target, fromTarget, drop }`). Glow uses `fromTarget` for the full receiving-card backdrop and `target` for the landing point. Bump `id` to restart.",
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
