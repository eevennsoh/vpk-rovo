"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";
import { token } from "@/lib/tokens";

import { ShaderColorListControl } from "./shader-color-controls";
import Bands from "./shaders/bands";

const DEFAULT_COLORS = [...ROVO_SHADER_COLOR_HEX];
const MAX_COLORS = 8;

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
				className="w-full aspect-video rounded-lg overflow-hidden border border-border"
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
				<ShaderColorListControl
					id="b-colors"
					label="Colors"
					value={colors}
					defaultValue={DEFAULT_COLORS}
					onChange={setColors}
					allowAddRemove
					maxColors={MAX_COLORS}
				/>
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
