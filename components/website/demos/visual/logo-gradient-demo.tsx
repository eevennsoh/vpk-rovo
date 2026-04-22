"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import {
	ShaderColorInput,
	ShaderColorListControl,
} from "./shader-color-controls";
import LogoGradient, {
	LOGO_GRADIENT_DEFAULT_BACKGROUND,
	LOGO_GRADIENT_DEFAULT_COLORS,
} from "./shaders/logo-gradient";

function ImageUploadControl({
	imageSrc,
	onChange,
}: {
	imageSrc: string | undefined;
	onChange: (next: string | undefined) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		(file: File) => {
			const url = URL.createObjectURL(file);
			onChange(url);
		},
		[onChange],
	);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Label className="text-xs font-medium text-text">Image</Label>
				<span className="text-[11px] text-text-subtlest">
					Uses the built-in logo when empty.
				</span>
			</div>
			<div className="flex items-center gap-2">
				{imageSrc ? (
					<Image
						src={imageSrc}
						alt="Source"
						width={36}
						height={36}
						unoptimized
						className="size-9 shrink-0 rounded border border-border object-cover"
					/>
				) : (
					<div className="flex size-9 shrink-0 items-center justify-center rounded border border-border bg-bg-neutral text-icon-subtle">
						<ImageIcon label="" size="small" />
					</div>
				)}
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="h-7 rounded border border-border bg-transparent px-3 text-xs text-text transition-colors hover:bg-bg-neutral"
				>
					{imageSrc ? "Change" : "Upload"}
				</button>
				{imageSrc ? (
					<button
						type="button"
						onClick={() => onChange(undefined)}
						className="flex size-7 shrink-0 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon"
					>
						<CrossIcon label="Clear" size="small" />
					</button>
				) : null}
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={(event) => {
						const file = event.target.files?.[0];
						if (file) handleFile(file);
						event.target.value = "";
					}}
				/>
			</div>
		</div>
	);
}

const DEFAULT_COLORS = [...LOGO_GRADIENT_DEFAULT_COLORS];

export default function LogoGradientDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
	const [colorBack, setColorBack] = useState(LOGO_GRADIENT_DEFAULT_BACKGROUND);
	const [seed, setSeed] = useState(6);
	const [speed, setSpeed] = useState(0.6);
	const [motionMode, setMotionMode] = useState<"0" | "1">("0");
	const [angle, setAngle] = useState(20);
	const [scale, setScale] = useState(1.2);
	const [turbAmp, setTurbAmp] = useState(0.21);
	const [turbFreq, setTurbFreq] = useState(1.15);
	const [turbIter, setTurbIter] = useState(7);
	const [waveFreq, setWaveFreq] = useState(2.4);
	const [bend, setBend] = useState(0.24);
	const [contour, setContour] = useState(0.8);

	const config = useMemo(
		() => ({
			colorBack,
			colors,
			seed,
			speed,
			motionMode: Number(motionMode),
			angle,
			scale,
			turbAmp,
			turbFreq,
			turbIter,
			waveFreq,
			bend,
			contour,
		}),
		[
			angle,
			bend,
			colorBack,
			colors,
			contour,
			motionMode,
			scale,
			seed,
			speed,
			turbAmp,
			turbFreq,
			turbIter,
			waveFreq,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="mx-auto aspect-[2/3] w-full max-w-sm overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<LogoGradient
					imageSrc={imageSrc}
					colors={colors}
					colorBack={colorBack}
					seed={seed}
					speed={speed}
					motionMode={Number(motionMode)}
					angle={angle}
					scale={scale}
					turbAmp={turbAmp}
					turbFreq={turbFreq}
					turbIter={turbIter}
					waveFreq={waveFreq}
					bend={bend}
					contour={contour}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
				<ShaderColorListControl
					id="logo-gradient-colors"
					label="Colors"
					value={colors}
					defaultValue={DEFAULT_COLORS}
					onChange={setColors}
					allowAddRemove
					maxColors={8}
				/>
				<ShaderColorInput
					id="logo-gradient-background"
					label="Background"
					value={colorBack}
					defaultValue={LOGO_GRADIENT_DEFAULT_BACKGROUND}
					onChange={setColorBack}
				/>
				<GUI.Control
					id="logo-gradient-seed"
					label="Seed"
					value={seed}
					defaultValue={6}
					min={0}
					max={1000}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="logo-gradient-speed"
					label="Speed"
					value={speed}
					defaultValue={0.6}
					min={0}
					max={2}
					step={0.01}
					onChange={setSpeed}
				/>
				<GUI.Select
					id="logo-gradient-motion"
					label="Motion"
					value={motionMode}
					options={[
						{ value: "0", label: "Random" },
						{ value: "1", label: "Directional" },
					]}
					onChange={(value) => setMotionMode(value as "0" | "1")}
				/>
				<GUI.Control
					id="logo-gradient-angle"
					label="Angle"
					value={angle}
					defaultValue={20}
					min={0}
					max={360}
					step={1}
					unit="deg"
					onChange={setAngle}
				/>
				<GUI.Control
					id="logo-gradient-scale"
					label="Scale"
					value={scale}
					defaultValue={1.2}
					min={0.1}
					max={2}
					step={0.01}
					onChange={setScale}
				/>
				<GUI.Control
					id="logo-gradient-amplitude"
					label="Amplitude"
					value={turbAmp}
					defaultValue={0.21}
					min={0}
					max={1}
					step={0.01}
					onChange={setTurbAmp}
				/>
				<GUI.Control
					id="logo-gradient-frequency"
					label="Frequency"
					value={turbFreq}
					defaultValue={1.15}
					min={0.1}
					max={2}
					step={0.01}
					onChange={setTurbFreq}
				/>
				<GUI.Control
					id="logo-gradient-definition"
					label="Definition"
					value={turbIter}
					defaultValue={7}
					min={3}
					max={8}
					step={1}
					onChange={setTurbIter}
				/>
				<GUI.Control
					id="logo-gradient-bands"
					label="Bands"
					value={waveFreq}
					defaultValue={2.4}
					min={0.1}
					max={5}
					step={0.1}
					onChange={setWaveFreq}
				/>
				<GUI.Control
					id="logo-gradient-bevel"
					label="Bevel"
					value={bend}
					defaultValue={0.24}
					min={0}
					max={1}
					step={0.01}
					onChange={setBend}
				/>
				<GUI.Control
					id="logo-gradient-contour"
					label="Contour"
					value={contour}
					defaultValue={0.8}
					min={0}
					max={1}
					step={0.1}
					onChange={setContour}
				/>
			</GUI.Panel>
		</div>
	);
}
