"use client";

import { useMemo, useState } from "react";

import TextEffects from "@/components/visual/text-effects";
import {
	configForEffect,
	DEFAULT_CONFIG,
	EFFECT_OPTIONS,
	TEXT_EFFECTS,
	type EffectId,
	type TextEffectConfig,
} from "@/components/visual/text-effects/data";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

type SplitOption = "char" | "word" | "line";

const SPLIT_OPTIONS: readonly { value: SplitOption; label: string }[] = [
	{ value: "char", label: "Character" },
	{ value: "word", label: "Word" },
	{ value: "line", label: "Line" },
];

export default function TextEffectsDemo() {
	const [effect, setEffect] = useState<EffectId>(DEFAULT_CONFIG.effect);
	const [splitBy, setSplitBy] = useState<SplitOption>(DEFAULT_CONFIG.splitBy as SplitOption);
	const [durationMs, setDurationMs] = useState(DEFAULT_CONFIG.durationMs);
	const [staggerMs, setStaggerMs] = useState(DEFAULT_CONFIG.staggerMs);
	const [autoLoop, setAutoLoop] = useState(DEFAULT_CONFIG.autoLoop);
	const [loopDelay, setLoopDelay] = useState(DEFAULT_CONFIG.loopDelay);

	const spec = TEXT_EFFECTS[effect];
	const isWhole = spec.target === "whole";

	// Selecting an effect seeds its native duration, stagger, and split so the
	// controls start from the skill's specced values, then stay tweakable.
	const applyEffect = (value: EffectId) => {
		const next = configForEffect(value);
		setEffect(value);
		setDurationMs(next.durationMs);
		setStaggerMs(next.staggerMs);
		if (next.splitBy !== "whole") setSplitBy(next.splitBy);
		setAutoLoop(next.autoLoop);
		setLoopDelay(next.loopDelay);
	};

	const config = useMemo<TextEffectConfig>(
		() => ({ effect, splitBy, durationMs, staggerMs, autoLoop, loopDelay }),
		[effect, splitBy, durationMs, staggerMs, autoLoop, loopDelay],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="relative overflow-hidden border border-border"
				style={{ borderRadius: 28 }}
			>
				<div
					className="relative flex w-full items-center justify-center overflow-hidden px-8 py-12"
					style={{ minHeight: 360 }}
				>
					<TextEffects config={config} />
				</div>
			</div>

			<GUI.Panel title="Text effect controls" values={config}>
				<GUI.Section title="Effect" borderTop={false}>
					<GUI.Select
						id="te-effect"
						label="Effect"
						description={spec.description}
						value={effect}
						options={EFFECT_OPTIONS}
						onChange={applyEffect}
					/>
				</GUI.Section>

				<GUI.Section title="Animation">
					{isWhole ? null : (
						<GUI.Select
							id="te-split"
							label="Split by"
							description="Animate each character, word, or line as a separate unit."
							value={splitBy}
							options={SPLIT_OPTIONS}
							onChange={setSplitBy}
						/>
					)}
					<GUI.Control
						id="te-duration"
						label="Duration"
						description="How long one unit takes to settle."
						value={durationMs}
						min={100}
						max={1600}
						step={10}
						unit="ms"
						onChange={setDurationMs}
					/>
					<GUI.Control
						id="te-stagger"
						label="Stagger"
						description="Delay step between consecutive units."
						value={staggerMs}
						min={0}
						max={160}
						step={1}
						unit="ms"
						disabled={isWhole}
						onChange={setStaggerMs}
					/>
					<GUI.Toggle id="te-auto-loop" label="Auto-loop" checked={autoLoop} onChange={setAutoLoop} />
					<GUI.Control
						id="te-loop-delay"
						label="Loop delay"
						value={loopDelay}
						min={0.25}
						max={4}
						step={0.25}
						unit="s"
						disabled={!autoLoop}
						onChange={setLoopDelay}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
