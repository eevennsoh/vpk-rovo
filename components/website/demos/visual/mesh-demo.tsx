"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { ROVO_SHADER_TRIAD_HEX } from "@/lib/rovo-colors";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import Mesh from "./shaders/mesh";

const [DEFAULT_COLOR_A, DEFAULT_COLOR_B, DEFAULT_COLOR_C] = ROVO_SHADER_TRIAD_HEX;

export default function MeshDemo() {
	const [colorA, setColorA] = useState<string>(DEFAULT_COLOR_A);
	const [colorB, setColorB] = useState<string>(DEFAULT_COLOR_B);
	const [colorC, setColorC] = useState<string>(DEFAULT_COLOR_C);
	const [duration, setDuration] = useState(20);

	const config = useMemo(
		() => ({ colorA, colorB, colorC, duration }),
		[colorA, colorB, colorC, duration],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden border border-border"
			>
				<Mesh
					colorA={colorA}
					colorB={colorB}
					colorC={colorC}
					duration={duration}
				/>
			</div>

			<GUI.Panel title="SVG controls" values={config}>
				<ShaderColorInput
					id="m-colorA"
					label="Color A"
					value={colorA}
					defaultValue={DEFAULT_COLOR_A}
					onChange={setColorA}
				/>
				<ShaderColorInput
					id="m-colorB"
					label="Color B"
					value={colorB}
					defaultValue={DEFAULT_COLOR_B}
					onChange={setColorB}
				/>
				<ShaderColorInput
					id="m-colorC"
					label="Color C"
					value={colorC}
					defaultValue={DEFAULT_COLOR_C}
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
