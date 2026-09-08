import type { ComponentDetail } from "@/app/data/component-detail-types";

export const SCROLLING_DETAIL: ComponentDetail = {
		description: "Vertical, infinitely looping scroller of agent-session cards built on the motion-plus Ticker. Cards enter once from a perfectly stacked deck and unfurl into an evenly spaced list in a single shared spring — no per-card stagger — then stay draggable with real pointer inertia, so a throw decays naturally and the loop keeps feeding cards in from whichever edge you drag away from. The deck can be anchored to the centre, the top or the bottom of the viewport, so the list grows symmetrically, downward or upward, and the paint order can be flipped so either the first or the last card sits on top wherever cards overlap — that order follows each card's live position in the loop rather than its index, so it stays correct across the wrap. Cards approaching an edge gradually scale down and tuck under their neighbours into a deck rather than being clipped; the tuck is held back until the entrance's fade has finished, so no more than two properties are ever animating at once. Because the loop never reaches an end, it never hands the scroll axis back to the page on its own, so wheel, trackpad and touch scrolling all stay with the page until you engage the list by clicking, tapping or focusing it — Escape, a press outside, or moving the pointer away hands it back. Once engaged the wheel maps 1:1 onto the same offset so the OS supplies its own momentum instead of stacking a second glide on top, and touch drags the list; touch devices get a short hint while the list is disengaged. Tab steps through each card's actions and the list solves for the exact ticker offset that brings the focused control clear of the edge fade; a mouse press is left alone, so clicking an action near an edge never scrolls it out from under the pointer. Each card is a single-item AgentSession at its natural density, which makes every list item both first and last child and therefore a fully rounded detached card. Honours prefers-reduced-motion by rendering the list already laid out, and by replacing the inertia throw with a dead stop so a flick can never sweep the viewport — drag itself and the loop stay fully intact.",
		importStatement: `import { Scrolling } from "@/components/visual/scrolling";`,
		usage: `<Scrolling viewportHeight={480} />

// Deal the deck downward from the top edge, paint the first
// card above its neighbours, and tuck cards away at both ends.
<Scrolling
	entranceOrigin="top"
	stackOrder="first-on-top"
	depth="both"
/>

// Or drive it with your own agent-session fixtures and disable
// the wheel listener when the page owns vertical scrolling.
<Scrolling
	items={AGENT_SESSION_ITEMS}
	viewportHeight={420}
	wheel={false}
	className="w-full"
/>`,
		props: [
			{ name: "items", type: "readonly AgentSessionItem[]", default: "SCROLLING_ITEMS", description: "Agent-session fixtures rendered into the loop, one detached card per entry. The Ticker clones the list to fill the viewport, so supply enough entries that a repeat is not obvious — the bundled default ships eight." },
			{ name: "viewportHeight", type: "number", default: "480", description: "Height of the clipped scroll viewport in pixels. The entrance, the depth tail and the focus reveal all measure against this height. Keep it under the window height — the Ticker clamps its measurement to the viewport. Above roughly 540px the Ticker starts cloning items to fill the scrollport, and because its clones only ever reproject forward the very first card's actions can no longer be scrolled fully clear of the edge fade; they park flush against an edge instead. Every other Tab stop is unaffected." },
			{ name: "entranceOrigin", type: `"centre" | "top" | "bottom"`, default: `"bottom"`, description: "Where the collapsed deck sits before it unfurls, and therefore which way the list grows. \"centre\" stacks at the middle and opens symmetrically; \"top\" stacks flush with the top edge and deals downward; \"bottom\" stacks flush with the bottom edge and deals upward. The anchor accounts for each card's own height, so the collapsed deck is always fully visible rather than half-clipped by the edge. Whichever copies of the cards are standing in the scrollport take part, so the unfurl looks the same at every viewport height even once the Ticker is cloning." },
			{ name: "stackOrder", type: `"last-on-top" | "first-on-top"`, default: `"first-on-top"`, description: "Which card paints above its neighbours wherever cards overlap — most visible on the collapsed entrance deck and in the depth tail. \"last-on-top\" matches the browser's own DOM paint order; \"first-on-top\" mirrors it exactly so the top of the list stays in front. Either way the ladder is derived from each card's live position in the loop, not from its index, so the order does not invert at the point where the loop wraps." },
			{ name: "depth", type: `"none" | "bottom" | "both"`, default: `"bottom"`, description: "Gradual scale-and-tuck for cards approaching a scrollport edge, so they slide under their neighbours into a deck instead of simply being clipped. Both the shrink and the tuck ramp quadratically, so the effect stays imperceptible until a card is genuinely tucking away, and it is held back until the entrance has finished unfurling. Because the tuck rescales a card as it moves, keyboard focus on a card inside the bottom zone can settle a few pixels into the edge fade; \"none\" is exact." },
			{ name: "wheel", type: "boolean", default: "true", description: "Attaches a non-passive wheel listener once the list is engaged — clicked, tapped, or given keyboard focus — translating deltaY 1:1 onto the scroll offset and calling preventDefault. A reader who is only scrolling past keeps their page scroll, and Escape or moving the pointer away hands it back. Turn it off when the surrounding page should own wheel scrolling entirely; touch engagement and drag are unaffected." },
			{ name: "className", type: "string", description: "Class names applied to the outer labelled region wrapping the scroll viewport." },
		],
	};
