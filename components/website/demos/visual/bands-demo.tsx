"use client";

import { useCallback, useMemo, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import AddIcon from "@atlaskit/icon/core/add";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import Bands from "./shaders/bands";

const DEFAULT_COLORS = ["#4AB7FF", "#FFC680", "#FF4040"];
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

export default function BandsDemo() {
	const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
	const [seed, setSeed] = useState(210);
	const [speed, setSpeed] = useState(0.3);
	const [ephemeralAmp, setEphemeralAmp] = useState(0);
	const [lensScale, setLensScale] = useState(3.7);
	const [lensSpacingX, setLensSpacingX] = useState(1);
	const [lensRadius, setLensRadius] = useState(0.58);
	const [dispersionStrength, setDispersionStrength] = useState(0.4);
	const [edgeDisp, setEdgeDisp] = useState(2);

	const config = useMemo(
		() => ({ colors, seed, speed, ephemeralAmp, lensScale, lensSpacingX, lensRadius, dispersionStrength, edgeDisp }),
		[colors, seed, speed, ephemeralAmp, lensScale, lensSpacingX, lensRadius, dispersionStrength, edgeDisp],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Bands
					colors={colors}
					seed={seed}
					speed={speed}
					ephemeralAmp={ephemeralAmp}
					lensScale={lensScale}
					lensSpacingX={lensSpacingX}
					lensRadius={lensRadius}
					dispersionStrength={dispersionStrength}
					edgeDisp={edgeDisp}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ColorArrayControl colors={colors} onChange={setColors} />
				<GUI.Control
					id="b-seed"
					label="Seed"
					value={seed}
					defaultValue={210}
					min={0}
					max={1000}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="b-speed"
					label="Speed"
					value={speed}
					defaultValue={0.3}
					min={0}
					max={2}
					step={0.01}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="b-ephemeral"
					label="Ephemeral"
					value={ephemeralAmp}
					defaultValue={0}
					min={0}
					max={0.5}
					step={0.01}
					onChange={setEphemeralAmp}
				/>
				<GUI.Control
					id="b-lensScale"
					label="Scale"
					value={lensScale}
					defaultValue={3.7}
					min={0.1}
					max={10}
					step={0.1}
					onChange={setLensScale}
				/>
				<GUI.Control
					id="b-spacingX"
					label="Spacing"
					value={lensSpacingX}
					defaultValue={1}
					min={0.01}
					max={5}
					step={0.01}
					onChange={setLensSpacingX}
				/>
				<GUI.Control
					id="b-radius"
					label="Radius"
					value={lensRadius}
					defaultValue={0.58}
					min={0.1}
					max={2}
					step={0.01}
					onChange={setLensRadius}
				/>
				<GUI.Control
					id="b-dispersion"
					label="Dispersion"
					value={dispersionStrength}
					defaultValue={0.4}
					min={0}
					max={1}
					step={0.01}
					onChange={setDispersionStrength}
				/>
				<GUI.Control
					id="b-edges"
					label="Edges"
					value={edgeDisp}
					defaultValue={2}
					min={0}
					max={5}
					step={0.1}
					onChange={setEdgeDisp}
				/>
			</GUI.Panel>
		</div>
	);
}
