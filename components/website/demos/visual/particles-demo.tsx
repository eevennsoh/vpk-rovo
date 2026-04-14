"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import Particles from "./shaders/particles";

const DEFAULT_BACKGROUND_COLOR = "#000000";

export default function ParticlesDemo() {
	const [bgColor, setBgColor] = useState(DEFAULT_BACKGROUND_COLOR);
	const [warp, setWarp] = useState(false);
	const [randomize, setRandomize] = useState(true);
	const [speed, setSpeed] = useState(0.6);
	const [scale, setScale] = useState(1);
	const [brightness, setBrightness] = useState(0.8);
	const [glow, setGlow] = useState(0.5);
	const [blink, setBlink] = useState(false);

	const config = useMemo(
		() => ({ bgColor, warp, randomize, speed, scale, brightness, glow, blink }),
		[bgColor, warp, randomize, speed, scale, brightness, glow, blink],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Particles
					bgColor={bgColor}
					warp={warp}
					randomize={randomize}
					speed={speed}
					scale={scale}
					brightness={brightness}
					glow={glow}
					blink={blink}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ShaderColorInput
					id="p-background"
					label="Background"
					value={bgColor}
					defaultValue={DEFAULT_BACKGROUND_COLOR}
					onChange={setBgColor}
				/>
				<GUI.Select
					id="p-warp"
					label="Warp"
					value={warp ? "yes" : "no"}
					options={[
						{ value: "yes", label: "Yes" },
						{ value: "no", label: "No" },
					]}
					onChange={(v) => setWarp(v === "yes")}
				/>
				<GUI.Select
					id="p-randomize"
					label="Randomize"
					value={randomize ? "yes" : "no"}
					options={[
						{ value: "yes", label: "Yes" },
						{ value: "no", label: "No" },
					]}
					onChange={(v) => setRandomize(v === "yes")}
				/>
				<GUI.Control
					id="p-speed"
					label="Speed"
					value={speed}
					defaultValue={0.6}
					min={0}
					max={5}
					step={0.1}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="p-scale"
					label="Scale"
					value={scale}
					defaultValue={1}
					min={0.3}
					max={2}
					step={0.1}
					onChange={setScale}
				/>
				<GUI.Control
					id="p-brightness"
					label="Brightness"
					value={brightness}
					defaultValue={0.8}
					min={0.01}
					max={3}
					step={0.01}
					onChange={setBrightness}
				/>
				<GUI.Control
					id="p-glow"
					label="Size"
					value={glow}
					defaultValue={0.5}
					min={0}
					max={2}
					step={0.01}
					onChange={setGlow}
				/>
				<GUI.Select
					id="p-blink"
					label="Blink"
					value={blink ? "yes" : "no"}
					options={[
						{ value: "yes", label: "Yes" },
						{ value: "no", label: "No" },
					]}
					onChange={(v) => setBlink(v === "yes")}
				/>
			</GUI.Panel>
		</div>
	);
}
