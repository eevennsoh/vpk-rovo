"use client";

import { useState } from "react";

import {
	DROPZONE_TUNING_DEFAULTS,
	DropzoneEffect,
	type DropzoneTuning,
} from "@/components/visual/dropzone-effect";
import { GUI } from "@/components/utils/gui";

/**
 * Every control is a live uniform or a cheap rebuild, so the panel doubles as
 * the art-direction surface: the shipped defaults are the measured ones, and
 * anything you dial here you can pass straight back in as `tuning`.
 */
const CONTROLS: readonly {
	key: keyof DropzoneTuning;
	label: string;
	description: string;
	min: number;
	max: number;
	step: number;
	unit?: string;
}[] = [
	{
		key: "density",
		label: "Density",
		description: "Multiplier on the automatic sticker count.",
		min: 0.3,
		max: 2,
		step: 0.05,
		unit: "x",
	},
	{
		key: "speed",
		label: "Speed",
		description: "Multiplier on the river's pace.",
		min: 0.2,
		max: 2.5,
		step: 0.05,
		unit: "x",
	},
	{
		key: "orbScale",
		label: "Orb size",
		description: "Multiplier on the orb radius.",
		min: 0.5,
		max: 2,
		step: 0.05,
		unit: "x",
	},
	{
		key: "catchLight",
		label: "Catch light",
		description: "How hard the orb lights a sticker as it goes in.",
		min: 0,
		max: 6,
		step: 0.1,
	},
	{
		key: "filmScale",
		label: "Iridescence",
		description: "Holographic film thickness. Higher packs tighter rainbow bands.",
		min: 0,
		max: 8,
		step: 0.1,
	},
	{
		key: "dome",
		label: "Dome",
		description: "How hard the die-cut's baked height bends the surface normal.",
		min: 0,
		max: 6,
		step: 0.1,
	},
	{
		key: "exposure",
		label: "Exposure",
		description: "Scene exposure before tone mapping.",
		min: 0.3,
		max: 2.5,
		step: 0.05,
	},
	{
		key: "bloom",
		label: "Bloom",
		description: "Multiplier on the bright-pass bloom.",
		min: 0,
		max: 3,
		step: 0.05,
		unit: "x",
	},
	{
		key: "defocus",
		label: "Near defocus",
		description: "Circle of confusion for near stickers. Far ones always stay crisp.",
		min: 0,
		max: 22,
		step: 0.5,
		unit: "px",
	},
	{
		key: "grain",
		label: "Grain",
		description: "Multiplier on the film grain that breaks up banding in the black.",
		min: 0,
		max: 3,
		step: 0.05,
		unit: "x",
	},
];


export default function DropzoneEffectDemo() {
	const [tuning, setTuning] = useState<DropzoneTuning>(DROPZONE_TUNING_DEFAULTS);
	const [paused, setPaused] = useState(false);

	const set = (key: keyof DropzoneTuning) => (next: number) =>
		setTuning((previous) => ({ ...previous, [key]: next }));

	return (
		<div className="flex w-full flex-col items-center gap-6">
			<div className="relative aspect-[16/10] w-full max-w-5xl overflow-hidden rounded-2xl bg-black">
				<DropzoneEffect paused={paused} tuning={tuning} />
			</div>

			<div className="w-full max-w-5xl">
				<GUI.Panel title="Dropzone effect" values={{ ...tuning, paused }}>
					<GUI.Toggle
						id="dropzone-paused"
						label="Paused"
						description="Freezes the river on its current frame."
						checked={paused}
						onChange={setPaused}
					/>
					{CONTROLS.map((control) => (
						<GUI.Control
							key={control.key}
							id={`dropzone-${control.key}`}
							label={control.label}
							description={control.description}
							value={tuning[control.key]}
							defaultValue={DROPZONE_TUNING_DEFAULTS[control.key]}
							min={control.min}
							max={control.max}
							step={control.step}
							unit={control.unit}
							onChange={set(control.key)}
						/>
					))}
					</GUI.Panel>
			</div>
		</div>
	);
}
