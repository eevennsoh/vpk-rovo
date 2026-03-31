"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import Mesh2 from "./shaders/mesh2";

function ColorControl({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (next: string) => void;
}) {
	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium text-text">{label}</Label>
			<div className="flex items-center gap-2">
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
				/>
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-7 flex-1 rounded border border-border bg-transparent px-2 font-mono text-xs text-text"
				/>
			</div>
		</div>
	);
}

export default function Mesh02Demo() {
	const [backgroundColor, setBackgroundColor] = useState("#000000");
	const [lineColor, setLineColor] = useState("#FFFFFF");
	const [lineWidth, setLineWidth] = useState(0.1);
	const [lineBlur, setLineBlur] = useState(2);
	const [seed, setSeed] = useState(200);
	const [speed, setSpeed] = useState(0.5);
	const [amplitude, setAmplitude] = useState(0.2);
	const [tilt, setTilt] = useState(-32);
	const [zoom, setZoom] = useState(0.35);
	const [cameraHeight, setCameraHeight] = useState(2);
	const [lightIntensity, setLightIntensity] = useState(3);

	const config = useMemo(
		() => ({ backgroundColor, lineColor, lineWidth, lineBlur, seed, speed, amplitude, tilt, zoom, cameraHeight, lightIntensity }),
		[backgroundColor, lineColor, lineWidth, lineBlur, seed, speed, amplitude, tilt, zoom, cameraHeight, lightIntensity],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Mesh2
					backgroundColor={backgroundColor}
					lineColor={lineColor}
					lineWidth={lineWidth}
					lineBlur={lineBlur}
					seed={seed}
					speed={speed}
					amplitude={amplitude}
					tilt={tilt}
					zoom={zoom}
					cameraHeight={cameraHeight}
					lightIntensity={lightIntensity}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ColorControl label="Fill" value={backgroundColor} onChange={setBackgroundColor} />
				<ColorControl label="Line Color" value={lineColor} onChange={setLineColor} />
				<GUI.Control
					id="m2-lineWidth"
					label="Line Width"
					value={lineWidth}
					defaultValue={0.1}
					min={0.1}
					max={4}
					step={0.1}
					onChange={setLineWidth}
				/>
				<GUI.Control
					id="m2-lineBlur"
					label="Line Blur"
					value={lineBlur}
					defaultValue={2}
					min={1}
					max={4}
					step={0.1}
					onChange={setLineBlur}
				/>
				<GUI.Control
					id="m2-seed"
					label="Seed"
					value={seed}
					defaultValue={200}
					min={0}
					max={1000}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="m2-speed"
					label="Speed"
					value={speed}
					defaultValue={0.5}
					min={0}
					max={5}
					step={0.1}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="m2-amplitude"
					label="Amplitude"
					value={amplitude}
					defaultValue={0.2}
					min={0}
					max={1}
					step={0.01}
					onChange={setAmplitude}
				/>
				<GUI.Control
					id="m2-tilt"
					label="Tilt"
					value={tilt}
					defaultValue={-32}
					min={-180}
					max={180}
					step={1}
					unit="deg"
					onChange={setTilt}
				/>
				<GUI.Control
					id="m2-zoom"
					label="Zoom"
					value={zoom}
					defaultValue={0.35}
					min={0.1}
					max={1}
					step={0.01}
					onChange={setZoom}
				/>
				<GUI.Control
					id="m2-height"
					label="Height"
					value={cameraHeight}
					defaultValue={2}
					min={0}
					max={3.5}
					step={0.1}
					onChange={setCameraHeight}
				/>
				<GUI.Control
					id="m2-brightness"
					label="Brightness"
					value={lightIntensity}
					defaultValue={3}
					min={0.1}
					max={10}
					step={0.1}
					onChange={setLightIntensity}
				/>
			</GUI.Panel>
		</div>
	);
}
