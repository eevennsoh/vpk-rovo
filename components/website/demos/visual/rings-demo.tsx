"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";
import { token } from "@/lib/tokens";

import { ShaderColorListControl } from "./shader-color-controls";
import Rings from "./shaders/rings";

const DEFAULT_COLORS = [...ROVO_SHADER_COLOR_HEX];
const MAX_COLORS = 8;

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
				className="w-full aspect-video rounded-lg overflow-hidden border border-border"
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
				<ShaderColorListControl
					id="r-colors"
					label="Colors"
					value={colors}
					defaultValue={DEFAULT_COLORS}
					onChange={setColors}
					allowAddRemove
					maxColors={MAX_COLORS}
				/>
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
