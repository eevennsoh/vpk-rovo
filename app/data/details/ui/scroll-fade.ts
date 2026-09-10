import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SCROLL_FADE_DETAIL: ComponentDetail = {
	description:
		"Fades the edges of a scroll container so cut-off content reads as continuing rather than ending. The fade is driven by a scroll-progress timeline in CSS — an edge stays crisp when there is nothing past it and fades in as content scrolls under it, with no scroll listeners and no JavaScript. Because it masks content instead of overlaying a color, it works on any background.",
	usage: `import { ScrollFade } from "@/components/ui/scroll-fade";

// A keyboard-scrollable region needs a role that supports naming —
// aria-label alone on a plain div is prohibited. And mask-image clips
// the focus ring, so keep the ring on an unmasked wrapper.
<div className="overflow-hidden rounded-lg border has-[:focus-visible]:ring-2">
  <ScrollFade
    tabIndex={0}
    role="group"
    aria-label="Changelog"
    className="h-48 focus-visible:outline-none"
  >
    {items}
  </ScrollFade>
</div>

// Horizontal, mirrors under dir="rtl"
<ScrollFade axis="x">{tags}</ScrollFade>

// Bottom edge only, deeper fade, snappier ramp
<ScrollFade edge="end" size={12} reveal={4}>{items}</ScrollFade>

// Caveat: the mask clips every descendant too, so a button or link
// sitting in the faded band renders semi-transparent along with its
// focus ring. For interactive content, keep the fade shallow enough
// that no row can sit fully inside it, or fade only the far edge.`,
	props: [
		{
			name: "axis",
			type: '"y" | "x"',
			default: '"y"',
			description:
				"Scroll direction the fade tracks. Sets the matching overflow, since the faded element must itself be the scroll container.",
		},
		{
			name: "edge",
			type: '"both" | "start" | "end"',
			default: '"both"',
			description:
				"Which edge fades. Logical, so on the x axis it mirrors under dir=\"rtl\".",
		},
		{
			name: "size",
			type: "number | string",
			default: "min(12%, 40px)",
			description:
				"Fade depth. A number is spacing steps (size={12} is 48px); a string is any CSS length or percentage. Keep it under half the container's scroll-axis length — two fades deeper than that meet in the middle and collapse the opaque band, washing the whole element out.",
		},
		{
			name: "reveal",
			type: "number | string",
			default: "96px",
			description:
				"Scroll distance the fade eases in over. Lower values snap the fade in sooner.",
		},
		{
			name: "render",
			type: "React.ReactElement",
			description:
				"Render an element of your own instead of a div, so an existing scroller can be faded in place.",
		},
	],
	examples: [
		{
			title: "Default",
			description:
				"Both edges on the vertical axis. The top stays crisp at rest and sharpens again at the end.",
			demoSlug: "scroll-fade-demo-default",
		},
		{
			title: "Horizontal",
			description: "axis=\"x\" fades the inline edges and mirrors in RTL.",
			demoSlug: "scroll-fade-demo-horizontal",
		},
		{
			title: "Single edge",
			description:
				"edge=\"end\" hints at more content below without softening the top; edge=\"start\" does the reverse.",
			demoSlug: "scroll-fade-demo-single-edge",
		},
		{
			title: "Fade size",
			description:
				"size sets how deep the fade cuts. Defaults to 12% of the container, capped at 40px.",
			demoSlug: "scroll-fade-demo-size",
		},
		{
			title: "Reveal distance",
			description:
				"reveal sets how much scrolling the fade eases in over — the difference between a ramp and a snap.",
			demoSlug: "scroll-fade-demo-reveal",
		},
		{
			title: "Custom element",
			description:
				"render fades a scroller you already have instead of nesting another div inside it.",
			demoSlug: "scroll-fade-demo-render",
		},
	],
};
