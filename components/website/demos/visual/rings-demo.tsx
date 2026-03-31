"use client";

import { useCallback, useMemo, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import AddIcon from "@atlaskit/icon/core/add";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import Rings from "./shaders/rings";

const DEFAULT_COLORS = ["#91FFCC", "#FFB938", "#FF4242"];
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

export default function RingsDemo() {
	const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
	const [seed, setSeed] = useState(47);
	const [speed, setSpeed] = useState(0.5);
	const [ephemeralAmp, setEphemeralAmp] = useState(0.12);
	const [lensScale, setLensScale] = useState(10);
	const [ringSpacing, setRingSpacing] = useState(1.5);
	const [ringRadius, setRingRadius] = useState(1);
	const [ringWarpStrength, setRingWarpStrength] = useState(4);
	const [ringDispersion, setRingDispersion] = useState(0.4);
	const [edgeDisp, setEdgeDisp] = useState(1.3);

	const config = useMemo(
		() => ({ colors, seed, speed, ephemeralAmp, lensScale, ringSpacing, ringRadius, ringWarpStrength, ringDispersion, edgeDisp }),
		[colors, seed, speed, ephemeralAmp, lensScale, ringSpacing, ringRadius, ringWarpStrength, ringDispersion, edgeDisp],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Rings
					colors={colors}
					seed={seed}
					speed={speed}
					ephemeralAmp={ephemeralAmp}
					lensScale={lensScale}
					ringSpacing={ringSpacing}
					ringRadius={ringRadius}
					ringWarpStrength={ringWarpStrength}
					ringDispersion={ringDispersion}
					edgeDisp={edgeDisp}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ColorArrayControl colors={colors} onChange={setColors} />
				<GUI.Control
					id="r-seed"
					label="Seed"
					value={seed}
					defaultValue={47}
					min={0}
					max={1000}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="r-speed"
					label="Speed"
					value={speed}
					defaultValue={0.5}
					min={0}
					max={2}
					step={0.01}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="r-ephemeral"
					label="Ephemeral"
					value={ephemeralAmp}
					defaultValue={0.12}
					min={0}
					max={0.5}
					step={0.01}
					onChange={setEphemeralAmp}
				/>
				<GUI.Control
					id="r-lensScale"
					label="Scale"
					value={lensScale}
					defaultValue={10}
					min={0.1}
					max={10}
					step={0.1}
					onChange={setLensScale}
				/>
				<GUI.Control
					id="r-spacing"
					label="Spacing"
					value={ringSpacing}
					defaultValue={1.5}
					min={0.1}
					max={5}
					step={0.1}
					onChange={setRingSpacing}
				/>
				<GUI.Control
					id="r-radius"
					label="Radius"
					value={ringRadius}
					defaultValue={1}
					min={0.1}
					max={2}
					step={0.01}
					onChange={setRingRadius}
				/>
				<GUI.Control
					id="r-warp"
					label="Warp"
					value={ringWarpStrength}
					defaultValue={4}
					min={0}
					max={5}
					step={0.1}
					onChange={setRingWarpStrength}
				/>
				<GUI.Control
					id="r-dispersion"
					label="Dispersion"
					value={ringDispersion}
					defaultValue={0.4}
					min={0}
					max={1}
					step={0.01}
					onChange={setRingDispersion}
				/>
				<GUI.Control
					id="r-edges"
					label="Edges"
					value={edgeDisp}
					defaultValue={1.3}
					min={0}
					max={5}
					step={0.1}
					onChange={setEdgeDisp}
				/>
			</GUI.Panel>
		</div>
	);
}
