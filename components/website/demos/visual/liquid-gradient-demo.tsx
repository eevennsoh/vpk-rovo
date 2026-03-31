"use client";

import { useCallback, useMemo, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import AddIcon from "@atlaskit/icon/core/add";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import LiquidGradient from "./shaders/liquid-gradient";

const DEFAULT_COLORS = ["#00001A", "#2962FF", "#40BCFF", "#FFB8B5", "#FFC14F"];
const MAX_COLORS = 8;

function ColorArrayControl({
	colors,
	onChange,
}: {
	colors: string[];
	onChange: (next: string[]) => void;
}) {
	const updateColor = useCallback(
		(index: number, value: string) => {
			const next = [...colors];
			next[index] = value;
			onChange(next);
		},
		[colors, onChange],
	);

	const removeColor = useCallback(
		(index: number) => {
			onChange(colors.filter((_, i) => i !== index));
		},
		[colors, onChange],
	);

	const addColor = useCallback(() => {
		if (colors.length < MAX_COLORS) {
			onChange([...colors, "#808080"]);
		}
	}, [colors, onChange]);

	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium text-text">Colors</Label>
			<div className="flex flex-col gap-1.5">
				{colors.map((color, i) => (
					<div key={i} className="flex items-center gap-2">
						<input
							type="color"
							value={color}
							onChange={(e) => updateColor(i, e.target.value)}
							className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
						/>
						<input
							type="text"
							value={color}
							onChange={(e) => updateColor(i, e.target.value)}
							className="h-7 flex-1 rounded border border-border bg-transparent px-2 font-mono text-xs text-text"
						/>
						{colors.length > 1 ? (
							<button
								type="button"
								onClick={() => removeColor(i)}
								className="flex size-7 shrink-0 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon"
							>
								<CrossIcon label="Remove" size="small" />
							</button>
						) : null}
					</div>
				))}
				{colors.length < MAX_COLORS ? (
					<button
						type="button"
						onClick={addColor}
						className="flex h-7 items-center gap-1.5 rounded px-1 text-xs text-text-subtle transition-colors hover:bg-bg-neutral hover:text-text"
					>
						<AddIcon label="" size="small" />
						<span>Add color</span>
					</button>
				) : null}
			</div>
		</div>
	);
}

export default function LiquidGradientDemo() {
	const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
	const [seed, setSeed] = useState(648);
	const [speed, setSpeed] = useState(0.3);
	const [loop, setLoop] = useState(0);
	const [scale, setScale] = useState(0.42);
	const [turbAmp, setTurbAmp] = useState(0.6);
	const [turbFreq, setTurbFreq] = useState(0.1);
	const [turbIter, setTurbIter] = useState(7);
	const [waveFreq, setWaveFreq] = useState(3.8);
	const [distBias, setDistBias] = useState(0);
	const [jellify, setJellify] = useState(false);
	const [ditherMode, setDitherMode] = useState<"0" | "1" | "2">("0");
	const [dither, setDither] = useState(0.05);
	const [exposure, setExposure] = useState(1.1);
	const [contrast, setContrast] = useState(1.1);
	const [saturation, setSaturation] = useState(1);

	const config = useMemo(
		() => ({ colors, seed, speed, loop, scale, turbAmp, turbFreq, turbIter, waveFreq, distBias, jellify, ditherMode: Number(ditherMode), dither, exposure, contrast, saturation }),
		[colors, seed, speed, loop, scale, turbAmp, turbFreq, turbIter, waveFreq, distBias, jellify, ditherMode, dither, exposure, contrast, saturation],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<LiquidGradient
					colors={colors}
					seed={seed}
					speed={speed}
					loop={loop}
					scale={scale}
					turbAmp={turbAmp}
					turbFreq={turbFreq}
					turbIter={turbIter}
					waveFreq={waveFreq}
					distBias={distBias}
					jellify={jellify}
					ditherMode={Number(ditherMode)}
					dither={dither}
					exposure={exposure}
					contrast={contrast}
					saturation={saturation}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ColorArrayControl colors={colors} onChange={setColors} />
				<GUI.Control
					id="lg-seed"
					label="Seed"
					value={seed}
					defaultValue={648}
					min={0}
					max={1000}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="lg-speed"
					label="Speed"
					value={speed}
					defaultValue={0.3}
					min={0}
					max={2}
					step={0.01}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="lg-loop"
					label="Loop"
					description="Loop duration in seconds. 0 = no loop."
					value={loop}
					defaultValue={0}
					min={0}
					max={60}
					step={0.5}
					unit="s"
					onChange={setLoop}
				/>
				<GUI.Control
					id="lg-scale"
					label="Scale"
					value={scale}
					defaultValue={0.42}
					min={0.1}
					max={2}
					step={0.01}
					onChange={setScale}
				/>
				<GUI.Control
					id="lg-turbAmp"
					label="Amplitude"
					value={turbAmp}
					defaultValue={0.6}
					min={0}
					max={1}
					step={0.01}
					onChange={setTurbAmp}
				/>
				<GUI.Control
					id="lg-turbFreq"
					label="Frequency"
					value={turbFreq}
					defaultValue={0.1}
					min={0.1}
					max={2}
					step={0.01}
					onChange={setTurbFreq}
				/>
				<GUI.Control
					id="lg-turbIter"
					label="Definition"
					value={turbIter}
					defaultValue={7}
					min={3}
					max={10}
					step={1}
					onChange={setTurbIter}
				/>
				<GUI.Control
					id="lg-waveFreq"
					label="Bands"
					value={waveFreq}
					defaultValue={3.8}
					min={0.1}
					max={5}
					step={0.1}
					onChange={setWaveFreq}
				/>
				<GUI.Select
					id="lg-ditherMode"
					label="Noise"
					value={ditherMode}
					options={[
						{ value: "0", label: "Off" },
						{ value: "1", label: "Smooth" },
						{ value: "2", label: "Grain" },
					]}
					onChange={setDitherMode}
				/>
				{Number(ditherMode) !== 0 ? (
					<GUI.Control
						id="lg-dither"
						label="Noise amount"
						value={dither}
						defaultValue={0.05}
						min={0}
						max={0.2}
						step={0.01}
						onChange={setDither}
					/>
				) : null}
				<GUI.Control
					id="lg-distBias"
					label="Bias"
					value={distBias}
					defaultValue={0}
					min={-1}
					max={1}
					step={0.1}
					onChange={setDistBias}
				/>
				<GUI.Toggle
					id="lg-jellify"
					label="Jellify"
					checked={jellify}
					onChange={setJellify}
				/>

				<GUI.Section title="Filters">
					<GUI.Control
						id="lg-exposure"
						label="Exposure"
						value={exposure}
						defaultValue={1.1}
						min={0.5}
						max={2}
						step={0.1}
						onChange={setExposure}
					/>
					<GUI.Control
						id="lg-contrast"
						label="Contrast"
						value={contrast}
						defaultValue={1.1}
						min={0.5}
						max={2}
						step={0.1}
						onChange={setContrast}
					/>
					<GUI.Control
						id="lg-saturation"
						label="Saturation"
						value={saturation}
						defaultValue={1}
						min={0}
						max={2}
						step={0.1}
						onChange={setSaturation}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
