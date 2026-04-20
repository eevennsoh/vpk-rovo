"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import Noise, { type NoiseBlendMode } from "./shaders/noise";

const DEFAULT_OPACITY = 0.18;
const DEFAULT_GRAIN_SIZE = 140;
const DEFAULT_BORDER_RADIUS = 28;
const DEFAULT_SEED = 7;
const DEFAULT_COLOR = "#101214";
const DEFAULT_BLEND_MODE: NoiseBlendMode = "multiply";

const BLEND_MODE_OPTIONS: Array<{ value: NoiseBlendMode; label: string }> = [
	{ value: "multiply", label: "Multiply" },
	{ value: "soft-light", label: "Soft Light" },
	{ value: "overlay", label: "Overlay" },
	{ value: "screen", label: "Screen" },
];

export default function NoiseDemo() {
	const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
	const [grainSize, setGrainSize] = useState(DEFAULT_GRAIN_SIZE);
	const [borderRadius, setBorderRadius] = useState(DEFAULT_BORDER_RADIUS);
	const [seed, setSeed] = useState(DEFAULT_SEED);
	const [color, setColor] = useState(DEFAULT_COLOR);
	const [blendMode, setBlendMode] =
		useState<NoiseBlendMode>(DEFAULT_BLEND_MODE);

	const config = useMemo(
		() => ({ opacity, grainSize, borderRadius, seed, color, blendMode }),
		[blendMode, borderRadius, color, grainSize, opacity, seed],
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
					className="relative w-full overflow-hidden border border-black/8"
					style={{
						height: 400,
						borderRadius,
						background:
							"linear-gradient(135deg, #fff5cf 0%, #dff2ff 44%, #ffd7ef 100%)",
					}}
				>
					<div
						className="absolute -left-10 top-10 h-48 w-48 rounded-full blur-3xl"
						style={{ background: "rgba(255, 121, 103, 0.52)" }}
					/>
					<div
						className="absolute bottom-0 right-0 h-56 w-56 rounded-full blur-3xl"
						style={{ background: "rgba(93, 122, 255, 0.42)" }}
					/>
					<div
						className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
						style={{ background: "rgba(255, 255, 255, 0.68)" }}
					/>

					<Noise
						className="absolute inset-0"
						opacity={opacity}
						grainSize={grainSize}
						borderRadius={borderRadius}
						seed={seed}
						color={color}
						blendMode={blendMode}
					/>

					<div className="relative z-10 flex h-full flex-col justify-between p-8">
						<div className="max-w-sm">
							<p className="text-[11px] font-medium uppercase tracking-[0.28em] text-black/45">
								Visual / Noise
							</p>
							<h3 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-black/90">
								CSS tiling grain overlay
							</h3>
							<p className="mt-3 text-sm leading-6 text-black/60">
								Standalone noise texture for layering over gradients, glass,
								or flat color fields.
							</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="rounded-[24px] border border-black/10 bg-white/50 p-4 backdrop-blur-sm">
								<p className="text-[10px] font-medium uppercase tracking-[0.24em] text-black/40">
									Opacity
								</p>
								<p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black/85">
									{opacity.toFixed(2)}
								</p>
							</div>
							<div className="rounded-[24px] border border-black/10 bg-white/50 p-4 backdrop-blur-sm">
								<p className="text-[10px] font-medium uppercase tracking-[0.24em] text-black/40">
									Grain
								</p>
								<p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-black/85">
									{grainSize}px
								</p>
							</div>
						</div>
					</div>
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
					id="noise-radius"
					label="Border radius"
					description="Corner radius applied to the overlay preview."
					value={borderRadius}
					defaultValue={DEFAULT_BORDER_RADIUS}
					min={0}
					max={80}
					step={1}
					unit="px"
					onChange={setBorderRadius}
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
					label="Blend mode"
					description="How the texture composites against the preview surface."
					value={blendMode}
					options={BLEND_MODE_OPTIONS}
					onChange={(next) => setBlendMode(next as NoiseBlendMode)}
				/>
			</GUI.Panel>
		</div>
	);
}
