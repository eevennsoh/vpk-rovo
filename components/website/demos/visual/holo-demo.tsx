"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import Holo from "./shaders/holo";

export default function HoloDemo() {
	const [seed, setSeed] = useState(600);
	const [speed, setSpeed] = useState(0.5);
	const [scale, setScale] = useState(1);
	const [turbAmp, setTurbAmp] = useState(1);
	const [turbIter, setTurbIter] = useState(3);
	const [warp, setWarp] = useState(5);
	const [fringeFreq, setFringeFreq] = useState(0.3);
	const [iter, setIter] = useState(0);
	const [bandSpread, setBandSpread] = useState(1.2);
	const [bumpStrength, setBumpStrength] = useState(0);
	const [ambient, setAmbient] = useState(0.07);
	const [saturation, setSaturation] = useState(2.55);
	const [exposure, setExposure] = useState(9);

	const config = useMemo(
		() => ({
			seed,
			speed,
			scale,
			turbAmp,
			turbIter,
			warp,
			fringeFreq,
			iter,
			bandSpread,
			bumpStrength,
			ambient,
			saturation,
			exposure,
		}),
		[ambient, bandSpread, bumpStrength, exposure, fringeFreq, iter, saturation, scale, seed, speed, turbAmp, turbIter, warp],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="aspect-video w-full overflow-hidden rounded-lg bg-black"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Holo
					seed={seed}
					speed={speed}
					scale={scale}
					turbAmp={turbAmp}
					turbIter={turbIter}
					warp={warp}
					fringeFreq={fringeFreq}
					iter={iter}
					bandSpread={bandSpread}
					bumpStrength={bumpStrength}
					ambient={ambient}
					saturation={saturation}
					exposure={exposure}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<GUI.Control
					id="holo-seed"
					label="Seed"
					value={seed}
					defaultValue={600}
					min={0}
					max={1000}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="holo-speed"
					label="Speed"
					value={speed}
					defaultValue={0.5}
					min={0}
					max={2}
					step={0.01}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="holo-scale"
					label="Scale"
					value={scale}
					defaultValue={1}
					min={0.1}
					max={3}
					step={0.01}
					onChange={setScale}
				/>
				<GUI.Control
					id="holo-amplitude"
					label="Amplitude"
					value={turbAmp}
					defaultValue={1}
					min={0}
					max={2}
					step={0.01}
					onChange={setTurbAmp}
				/>
				<GUI.Control
					id="holo-definition"
					label="Definition"
					value={turbIter}
					defaultValue={3}
					min={2}
					max={8}
					step={1}
					onChange={setTurbIter}
				/>
				<GUI.Control
					id="holo-warp"
					label="Warp"
					value={warp}
					defaultValue={5}
					min={0}
					max={10}
					step={0.1}
					onChange={setWarp}
				/>
				<GUI.Control
					id="holo-fringe"
					label="Fringe"
					value={fringeFreq}
					defaultValue={0.3}
					min={0.05}
					max={2}
					step={0.01}
					onChange={setFringeFreq}
				/>
				<GUI.Control
					id="holo-iridescence"
					label="Iridescence"
					value={iter}
					defaultValue={0}
					min={0}
					max={10}
					step={0.01}
					onChange={setIter}
				/>
				<GUI.Control
					id="holo-hue-shift"
					label="Hue Shift"
					value={bandSpread}
					defaultValue={1.2}
					min={1}
					max={2}
					step={0.01}
					onChange={setBandSpread}
				/>
				<GUI.Control
					id="holo-highlights"
					label="Highlights"
					value={bumpStrength}
					defaultValue={0}
					min={0}
					max={0.1}
					step={0.01}
					onChange={setBumpStrength}
				/>
				<GUI.Control
					id="holo-ambient"
					label="Ambient"
					value={ambient}
					defaultValue={0.07}
					min={0}
					max={0.2}
					step={0.01}
					onChange={setAmbient}
				/>
				<GUI.Control
					id="holo-saturation"
					label="Saturation"
					value={saturation}
					defaultValue={2.55}
					min={0}
					max={3}
					step={0.01}
					onChange={setSaturation}
				/>
				<GUI.Control
					id="holo-exposure"
					label="Exposure"
					value={exposure}
					defaultValue={9}
					min={1}
					max={10}
					step={0.1}
					onChange={setExposure}
				/>
			</GUI.Panel>
		</div>
	);
}
