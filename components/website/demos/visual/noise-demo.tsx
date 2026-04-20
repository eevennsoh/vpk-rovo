"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import Noise, { BLEND_MODE_TYPES, type NoiseBlendMode } from "./shaders/noise";

const DEFAULT_OPACITY = 0.18;
const DEFAULT_GRAIN_SIZE = 140;
const DEFAULT_SEED = 7;
const DEFAULT_COLOR = "#292A2E";
const DEFAULT_BLEND_MODE: NoiseBlendMode = "soft-light";

export default function NoiseDemo() {
	const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
	const [grainSize, setGrainSize] = useState(DEFAULT_GRAIN_SIZE);
	const [seed, setSeed] = useState(DEFAULT_SEED);
	const [color, setColor] = useState(DEFAULT_COLOR);
	const [blendMode, setBlendMode] =
		useState<NoiseBlendMode>(DEFAULT_BLEND_MODE);

	const config = useMemo(
		() => ({ opacity, grainSize, seed, color, blendMode }),
		[blendMode, color, grainSize, opacity, seed],
	);

	return (
		<div
			className="flex w-full max-w-2xl flex-col"
			style={{ gap: token("space.400") }}
		>
			<div
				className="w-full overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<div
					className="relative w-full overflow-hidden bg-surface"
					style={{ height: 400 }}
				>
					<Noise
						className="absolute inset-0"
						opacity={opacity}
						grainSize={grainSize}
						seed={seed}
						color={color}
						blendMode={blendMode}
					/>
				</div>
			</div>

			<GUI.Panel title="Noise controls" values={config}>
				<GUI.Control
					id="noise-opacity"
					label="Opacity"
					description="Overall visibility of the overlay."
					value={opacity}
					defaultValue={DEFAULT_OPACITY}
					min={0}
					max={1}
					step={0.01}
					onChange={setOpacity}
				/>
				<GUI.Control
					id="noise-grain-size"
					label="Grain size"
					description="Size of the repeated texture tile."
					value={grainSize}
					defaultValue={DEFAULT_GRAIN_SIZE}
					min={24}
					max={320}
					step={1}
					unit="px"
					onChange={setGrainSize}
				/>
				<GUI.Control
					id="noise-seed"
					label="Seed"
					description="Changes the generated noise field."
					value={seed}
					defaultValue={DEFAULT_SEED}
					min={0}
					max={100}
					step={1}
					onChange={setSeed}
				/>
				<ShaderColorInput
					id="noise-color"
					label="Color"
					value={color}
					defaultValue={DEFAULT_COLOR}
					onChange={setColor}
				/>
				<GUI.Select
					id="noise-blend-mode"
					label="Blend"
					description="How the texture composites against the preview surface."
					value={blendMode}
					options={BLEND_MODE_TYPES}
					onChange={(next) => setBlendMode(next as NoiseBlendMode)}
				/>
			</GUI.Panel>
		</div>
	);
}
