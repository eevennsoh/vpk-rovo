"use client";

import TextEffects from "@/components/visual/text-effects";
import {
	configForEffect,
	type TextEffectConfig,
} from "@/components/visual/text-effects/data";
import TextMorphing from "@/components/visual/text-morphing";
import type { TextMorphConfig } from "@/components/visual/text-morphing/data";

import { AGENT_SESSION_DECK_END_SPACE_PX } from "./deck/deck-model";

const END_STATE_TEXT_EFFECT = {
	...configForEffect("per-word-crossfade"),
	autoLoop: false,
	durationMs: 600, // duration-slowest — scroll-triggered reveal
	staggerMs: 150, // duration-normal — per-word delay
} satisfies TextEffectConfig;

const END_STATE_COUNT_MORPH = {
	animation: "smooth",
	autoSize: false,
	driftX: 0,
	driftY: 0,
	initial: true,
	stagger: 0.04,
	trend: 0,
	variant: "number",
} satisfies TextMorphConfig;

export function AgentSessionColumnEndState({
	count,
	visible,
}: Readonly<{
	count: number;
	visible: boolean;
}>) {
	return (
		<div
			className="flex shrink-0 items-center justify-center px-4 text-center"
			style={{ minHeight: AGENT_SESSION_DECK_END_SPACE_PX }}
		>
			{visible ? (
				<div className="flex flex-col items-center gap-1">
					<p className="text-sm font-medium text-text">
						<TextEffects
							config={END_STATE_TEXT_EFFECT}
							presentation="inline"
							text="Nice work"
						/>
					</p>
					<p className="text-xs text-text-subtle">
						<span aria-hidden="true">
							<TextMorphing
								className="font-medium tabular-nums text-text"
								config={END_STATE_COUNT_MORPH}
								text={String(count)}
							/>
						</span>
						<span className="sr-only">{count}</span>{" "}
						<TextEffects
							config={END_STATE_TEXT_EFFECT}
							presentation="inline"
							text="sessions now accounted for."
						/>
					</p>
				</div>
			) : null}
		</div>
	);
}
