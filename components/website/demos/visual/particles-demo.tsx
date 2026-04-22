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
	const [warpDirection, setWarpDirection] = useState<0 | 1>(0);
	const [tunnelRadius, setTunnelRadius] = useState(2);
	const [fadeRadius, setFadeRadius] = useState(1.2);
	const [randomize, setRandomize] = useState(true);
	const [speed, setSpeed] = useState(0.6);
	const [scale, setScale] = useState(1);
	const [layers, setLayers] = useState(30);
	const [brightness, setBrightness] = useState(0.8);
	const [glow, setGlow] = useState(0.5);
	const [blur, setBlur] = useState(0);
	const [starSize, setStarSize] = useState(0.01);
	const [direction, setDirection] = useState(90);
	const [blink, setBlink] = useState(false);
	const [customColor, setCustomColor] = useState(false);
	const [colorR, setColorR] = useState(1);
	const [colorG, setColorG] = useState(2);
	const [colorB, setColorB] = useState(3);

	const config = useMemo(
		() => ({
			bgColor,
			warp,
			warpDirection,
			tunnelRadius,
			fadeRadius,
			randomize,
			speed,
			scale,
			layers,
			brightness,
			glow,
			blur,
			starSize,
			direction,
			blink,
			customColor,
			colorR,
			colorG,
			colorB,
		}),
		[
			bgColor,
			warp,
			warpDirection,
			tunnelRadius,
			fadeRadius,
			randomize,
			speed,
			scale,
			layers,
			brightness,
			glow,
			blur,
			starSize,
			direction,
			blink,
			customColor,
			colorR,
			colorG,
			colorB,
		],
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
					warpDirection={warpDirection}
					tunnelRadius={tunnelRadius}
					fadeRadius={fadeRadius}
					randomize={randomize}
					speed={speed}
					scale={scale}
					layers={layers}
					brightness={brightness}
					glow={glow}
					blur={blur}
					starSize={starSize}
					direction={direction}
					blink={blink}
					customColor={customColor}
					colorR={colorR}
					colorG={colorG}
					colorB={colorB}
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
				<GUI.Toggle
					id="p-custom-color"
					label="Custom color"
					checked={customColor}
					onChange={setCustomColor}
				/>
				{customColor ? (
					<>
						<GUI.Control
							id="p-color-r"
							label="Red phase"
							value={colorR}
							defaultValue={1}
							min={0}
							max={6}
							step={0.1}
							onChange={setColorR}
						/>
						<GUI.Control
							id="p-color-g"
							label="Green phase"
							value={colorG}
							defaultValue={2}
							min={0}
							max={6}
							step={0.1}
							onChange={setColorG}
						/>
						<GUI.Control
							id="p-color-b"
							label="Blue phase"
							value={colorB}
							defaultValue={3}
							min={0}
							max={6}
							step={0.1}
							onChange={setColorB}
						/>
					</>
				) : null}
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
					id="p-layers"
					label="Layers"
					value={layers}
					defaultValue={30}
					min={0}
					max={60}
					step={1}
					onChange={setLayers}
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
					label="Glow"
					value={glow}
					defaultValue={0.5}
					min={0}
					max={2}
					step={0.01}
					onChange={setGlow}
				/>
				<GUI.Control
					id="p-blur"
					label="Blur"
					value={blur}
					defaultValue={0}
					min={0}
					max={1}
					step={0.01}
					onChange={setBlur}
				/>
				<GUI.Control
					id="p-star-size"
					label="Star size"
					value={starSize}
					defaultValue={0.01}
					min={0}
					max={0.05}
					step={0.001}
					onChange={setStarSize}
				/>
				<GUI.Control
					id="p-direction"
					label="Direction"
					value={direction}
					defaultValue={90}
					min={0}
					max={360}
					step={1}
					onChange={setDirection}
				/>
				<GUI.Toggle
					id="p-randomize"
					label="Randomize"
					checked={randomize}
					onChange={setRandomize}
				/>
				<GUI.Toggle
					id="p-blink"
					label="Blink"
					checked={blink}
					onChange={setBlink}
				/>
				<GUI.Toggle
					id="p-warp"
					label="Warp"
					checked={warp}
					onChange={setWarp}
				/>
				{warp ? (
					<>
						<GUI.Select
							id="p-warp-direction"
							label="Warp direction"
							value={warpDirection === 0 ? "out" : "in"}
							options={[
								{ value: "out", label: "Outward" },
								{ value: "in", label: "Inward" },
							]}
							onChange={(v) => setWarpDirection(v === "in" ? 1 : 0)}
						/>
						<GUI.Control
							id="p-tunnel-radius"
							label="Tunnel radius"
							value={tunnelRadius}
							defaultValue={2}
							min={0.2}
							max={6}
							step={0.1}
							onChange={setTunnelRadius}
						/>
						<GUI.Control
							id="p-fade-radius"
							label="Fade radius"
							value={fadeRadius}
							defaultValue={1.2}
							min={0}
							max={3}
							step={0.05}
							onChange={setFadeRadius}
						/>
					</>
				) : null}
			</GUI.Panel>
		</div>
	);
}
