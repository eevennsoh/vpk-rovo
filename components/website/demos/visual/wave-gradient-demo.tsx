"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import { ShaderColorListControl } from "./shader-color-controls";
import WaveGradient from "./shaders/wave-gradient";

const DEFAULT_COLORS: [string, string, string, string] = ["#FFC2A8", "#FF5024", "#FFAE00", "#E29EFF"];

export default function WaveGradientDemo() {
	const [colors, setColors] = useState<[string, string, string, string]>(DEFAULT_COLORS);
	const [seed, setSeed] = useState(26);
	const [speed, setSpeed] = useState(1.8);
	const [freqX, setFreqX] = useState(0.9);
	const [freqY, setFreqY] = useState(6);
	const [angle, setAngle] = useState(105);
	const [amplitude, setAmplitude] = useState(1.6);
	const [softness, setSoftness] = useState(1.4);
	const [blend, setBlend] = useState(0.5);

	const config = useMemo(
		() => ({ colors, seed, speed, freqX, freqY, angle, amplitude, softness, blend }),
		[colors, seed, speed, freqX, freqY, angle, amplitude, softness, blend],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<WaveGradient
					colors={colors}
					seed={seed}
					speed={speed}
					freqX={freqX}
					freqY={freqY}
					angle={angle}
					amplitude={amplitude}
					softness={softness}
					blend={blend}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ShaderColorListControl
					id="wg-colors"
					label="Colors"
					value={colors}
					defaultValue={DEFAULT_COLORS}
					onChange={(next) => setColors(next as [string, string, string, string])}
				/>
				<GUI.Control
					id="wg-seed"
					label="Seed"
					value={seed}
					defaultValue={26}
					min={0}
					max={100}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="wg-speed"
					label="Speed"
					value={speed}
					defaultValue={1.8}
					min={0}
					max={3}
					step={0.01}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="wg-freqX"
					label="Freq X"
					value={freqX}
					defaultValue={0.9}
					min={0.1}
					max={6}
					step={0.1}
					onChange={setFreqX}
				/>
				<GUI.Control
					id="wg-freqY"
					label="Freq Y"
					value={freqY}
					defaultValue={6}
					min={0.1}
					max={6}
					step={0.1}
					onChange={setFreqY}
				/>
				<GUI.Control
					id="wg-angle"
					label="Angle"
					value={angle}
					defaultValue={105}
					min={-180}
					max={180}
					step={1}
					unit="deg"
					onChange={setAngle}
				/>
				<GUI.Control
					id="wg-amplitude"
					label="Amplitude"
					value={amplitude}
					defaultValue={1.6}
					min={0.5}
					max={3}
					step={0.01}
					onChange={setAmplitude}
				/>
				<GUI.Control
					id="wg-softness"
					label="Softness"
					value={softness}
					defaultValue={1.4}
					min={0.01}
					max={2}
					step={0.01}
					onChange={setSoftness}
				/>
				<GUI.Control
					id="wg-blend"
					label="Blend"
					value={blend}
					defaultValue={0.5}
					min={0}
					max={1}
					step={0.01}
					onChange={setBlend}
				/>
			</GUI.Panel>
		</div>
	);
}
