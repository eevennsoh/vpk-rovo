"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import Mesh from "./shaders/mesh";

export default function MeshDemo() {
	const [colorA, setColorA] = useState("#ff0000");
	const [colorB, setColorB] = useState("#00ff00");
	const [colorC, setColorC] = useState("#0000ff");
	const [duration, setDuration] = useState(20);

	const config = useMemo(
		() => ({ colorA, colorB, colorC, duration }),
		[colorA, colorB, colorC, duration],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Mesh
					colorA={colorA}
					colorB={colorB}
					colorC={colorC}
					duration={duration}
				/>
			</div>

			<GUI.Panel title="SVG controls" values={config}>
				<GUI.TextInput
					id="m-colorA"
					label="Color A"
					value={colorA}
					onChange={setColorA}
				/>
				<GUI.TextInput
					id="m-colorB"
					label="Color B"
					value={colorB}
					onChange={setColorB}
				/>
				<GUI.TextInput
					id="m-colorC"
					label="Color C"
					value={colorC}
					onChange={setColorC}
				/>
				<GUI.Control
					id="m-duration"
					label="Duration"
					description="Animation cycle duration."
					value={duration}
					defaultValue={20}
					min={1}
					max={60}
					step={1}
					unit="s"
					onChange={setDuration}
				/>
			</GUI.Panel>
		</div>
	);
}
