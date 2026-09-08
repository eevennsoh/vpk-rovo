"use client";

import { useState } from "react";

import {
	Scrolling,
	type ScrollingDepth,
	type ScrollingEntranceOrigin,
	type ScrollingStackOrder,
} from "@/components/visual/scrolling";
import { SCROLLING_VIEWPORT_PX } from "@/components/visual/scrolling/data";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

// Mirrors the component's own default so the docs, the reset button and the
// first paint can never disagree.
const DEFAULT_VIEWPORT_HEIGHT = SCROLLING_VIEWPORT_PX;

const ENTRANCE_ORIGIN_OPTIONS: readonly { value: ScrollingEntranceOrigin; label: string }[] = [
	{ label: "Centre", value: "centre" },
	{ label: "Top", value: "top" },
	{ label: "Bottom", value: "bottom" },
];

const STACK_ORDER_OPTIONS: readonly { value: ScrollingStackOrder; label: string }[] = [
	{ label: "Last on top", value: "last-on-top" },
	{ label: "First on top", value: "first-on-top" },
];

const DEPTH_OPTIONS: readonly { value: ScrollingDepth; label: string }[] = [
	{ label: "None", value: "none" },
	{ label: "Bottom", value: "bottom" },
	{ label: "Both", value: "both" },
];

export default function ScrollingDemo() {
	const [viewportHeight, setViewportHeight] = useState(DEFAULT_VIEWPORT_HEIGHT);
	const [wheel, setWheel] = useState(true);
	const [entranceOrigin, setEntranceOrigin] = useState<ScrollingEntranceOrigin>("bottom");
	const [stackOrder, setStackOrder] = useState<ScrollingStackOrder>("first-on-top");
	const [depth, setDepth] = useState<ScrollingDepth>("bottom");
	const [replayKey, setReplayKey] = useState(0);

	return (
		<div
			className="mx-auto flex w-full flex-col items-center"
			style={{
				gap: token("space.300"),
				maxWidth: `calc(${token("space.600")} * 7)`,
			}}
		>
			<Scrolling
				key={replayKey}
				className="w-full"
				depth={depth}
				entranceOrigin={entranceOrigin}
				stackOrder={stackOrder}
				viewportHeight={viewportHeight}
				wheel={wheel}
			/>

			<GUI.Panel
				title="Scrolling controls"
				values={{ depth, entranceOrigin, stackOrder, viewportHeight, wheel }}
				onPlay={() => setReplayKey((current) => current + 1)}
			>
				<GUI.Section title="Viewport" borderTop={false}>
					<GUI.Control
						id="scrolling-viewport-height"
						label="Viewport height"
						description="Height of the clipped scroll area. The stacked deck is anchored inside it before the cards unfurl. Above ~540px the Ticker clones cards to fill the scrollport, which is where the first card's Tab stops can only reach the edge fade."
						value={viewportHeight}
						defaultValue={DEFAULT_VIEWPORT_HEIGHT}
						min={280}
						max={720}
						step={20}
						unit="px"
						onChange={setViewportHeight}
					/>
				</GUI.Section>

				<GUI.Section title="Entrance">
					<GUI.SegmentedControl
						id="scrolling-entrance-origin"
						label="Grow from"
						description="Where the stacked deck sits before it unfurls. Centre opens symmetrically, Top deals downward, Bottom deals upward. Hit Replay to watch it again."
						value={entranceOrigin}
						options={ENTRANCE_ORIGIN_OPTIONS}
						onChange={setEntranceOrigin}
					/>
					<GUI.SegmentedControl
						id="scrolling-stack-order"
						label="Stacking order"
						description="Which card paints on top wherever cards overlap — most visible on the collapsed deck and in the depth tail."
						value={stackOrder}
						options={STACK_ORDER_OPTIONS}
						onChange={setStackOrder}
					/>
				</GUI.Section>

				<GUI.Section title="Depth">
					<GUI.SegmentedControl
						id="scrolling-depth"
						label="Scale and tuck"
						description="Cards approaching an edge shrink and slide under their neighbours into a deck instead of being clipped. Scroll to the bottom to see it."
						value={depth}
						options={DEPTH_OPTIONS}
						onChange={setDepth}
					/>
				</GUI.Section>

				<GUI.Section title="Input">
					<GUI.Toggle
						id="scrolling-wheel"
						label="Wheel and trackpad"
						description="Maps deltaY 1:1 onto the scroll offset once the list is engaged — click it, tap it, or focus it first. Escape, a press outside, or moving the pointer away hands scrolling back to the page. Turn off to disable wheel scrolling entirely."
						checked={wheel}
						onChange={setWheel}
					/>
					<div className="text-[11px] text-text-subtlest">
						Drag the list to throw it — momentum decays to rest and the loop keeps
						feeding cards in from the edge you drag away from. On a touch screen the
						first swipe still belongs to the page; tap once, then drag.
					</div>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
