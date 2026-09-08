"use client";

/**
 * The Text Continuity gallery — every example from https://torph.lochie.me/examples,
 * in upstream's hand-ordered sequence, over a panel that retunes the shared morph.
 */

import { useMemo, useState } from "react";

import { TextContinuityProvider } from "@/components/visual/text-continuity";
import {
	DEFAULT_CONFIG,
	EASE_OPTIONS,
	EXAMPLES,
	SETTLE_SPRING,
	type EasePreset,
	type TextContinuityConfig,
} from "@/components/visual/text-continuity/data";
import { EXAMPLE_COMPONENTS } from "@/components/visual/text-continuity/examples";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

const EASE_LABELS: Readonly<Record<EasePreset, string>> = {
	signature: "Signature",
	overshoot: "Overshoot",
	linear: "Linear",
	spring: "Spring",
};

const EASE_SELECT_OPTIONS = EASE_OPTIONS.map((value) => ({ value, label: EASE_LABELS[value] }));

export default function TextContinuityDemo() {
	const [duration, setDuration] = useState(DEFAULT_CONFIG.duration);
	const [ease, setEase] = useState<EasePreset>(DEFAULT_CONFIG.ease);
	const [stiffness, setStiffness] = useState(SETTLE_SPRING.stiffness ?? 150);
	const [damping, setDamping] = useState(SETTLE_SPRING.damping ?? 19);
	const [scale, setScale] = useState(DEFAULT_CONFIG.scale);
	const [numbers, setNumbers] = useState(DEFAULT_CONFIG.numbers);
	const [debug, setDebug] = useState(DEFAULT_CONFIG.debug);
	const [disabled, setDisabled] = useState(DEFAULT_CONFIG.disabled);

	const isSpring = ease === "spring";

	const config = useMemo<TextContinuityConfig>(
		() => ({
			duration,
			ease,
			spring: { ...SETTLE_SPRING, stiffness, damping },
			scale,
			numbers,
			debug,
			disabled,
		}),
		[duration, ease, stiffness, damping, scale, numbers, debug, disabled],
	);

	return (
		<div className="flex w-full max-w-5xl flex-col" style={{ gap: token("space.400") }}>
			<TextContinuityProvider config={config}>
				<div className="grid grid-cols-[repeat(auto-fill,minmax(19rem,1fr))]" style={{ gap: token("space.200") }}>
					{EXAMPLES.map((example) => {
						const Example = EXAMPLE_COMPONENTS[example.id];
						return (
							<figure
								key={example.id}
								className="m-0 flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
							>
								<div className="flex min-h-56 flex-1 items-center justify-center overflow-hidden p-5">
									<Example />
								</div>

								<figcaption
									className="flex flex-col gap-0.5 border-t border-border px-4 py-3"
									style={{ background: token("elevation.surface.sunken") }}
								>
									<span className="text-sm font-semibold text-text">{example.label}</span>
									<span className="text-xs leading-snug text-text-subtlest">{example.blurb}</span>
								</figcaption>
							</figure>
						);
					})}
				</div>
			</TextContinuityProvider>

			<GUI.Panel
				title="Text continuity controls"
				values={{
					duration: isSpring ? "spring" : duration,
					ease,
					...(isSpring ? { stiffness, damping } : {}),
					scale,
					numbers,
					debug,
					disabled,
				}}
			>
				<GUI.Select
					id="text-continuity-ease"
					label="Easing"
					description="Signature is torph's own curve. Spring settles on its own physics and ignores duration."
					value={ease}
					defaultValue={DEFAULT_CONFIG.ease}
					options={EASE_SELECT_OPTIONS}
					onChange={setEase}
					valueKeys="ease"
				/>

				<GUI.Control
					id="text-continuity-duration"
					label="Duration"
					description={isSpring ? "Ignored while the easing is a spring." : "How long one morph takes."}
					value={duration}
					defaultValue={DEFAULT_CONFIG.duration}
					min={80}
					max={1200}
					step={20}
					unit="ms"
					disabled={isSpring}
					onChange={setDuration}
					valueKeys="duration"
				/>

				{isSpring ? (
					<>
						<GUI.Control
							id="text-continuity-stiffness"
							label="Stiffness"
							value={stiffness}
							defaultValue={SETTLE_SPRING.stiffness ?? 150}
							min={20}
							max={400}
							step={5}
							onChange={setStiffness}
							valueKeys="stiffness"
						/>
						<GUI.Control
							id="text-continuity-damping"
							label="Damping"
							value={damping}
							defaultValue={SETTLE_SPRING.damping ?? 19}
							min={4}
							max={60}
							step={1}
							onChange={setDamping}
							valueKeys="damping"
						/>
					</>
				) : null}

				<GUI.Toggle
					id="text-continuity-numbers"
					label="Place-value numbers"
					description="Off falls back to character matching, so 1,204 → 1,318 reflows every digit instead of rolling two."
					checked={numbers}
					onChange={setNumbers}
					valueKeys="numbers"
				/>

				<GUI.Toggle
					id="text-continuity-scale"
					label="Scale on exit"
					description="Shrink segments as they leave, rather than fading them at full size."
					checked={scale}
					onChange={setScale}
					valueKeys="scale"
				/>

				<GUI.Toggle
					id="text-continuity-debug"
					label="Debug boxes"
					description="Outline each matched segment. Toggling re-attaches every morph, so values snap once."
					checked={debug}
					onChange={setDebug}
					valueKeys="debug"
				/>

				<GUI.Toggle
					id="text-continuity-disabled"
					label="Disable morphing"
					description="Swap values outright — the baseline every example is measured against."
					checked={disabled}
					onChange={setDisabled}
					valueKeys="disabled"
				/>
			</GUI.Panel>
		</div>
	);
}
