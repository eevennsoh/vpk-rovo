"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import Blockify from "./shaders/blockify";

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
			<Label className="text-xs font-medium text-text">Image</Label>
			<div className="flex items-center gap-2">
				{imageSrc ? (
					<img
						src={imageSrc}
						alt="Source"
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
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) handleFile(file);
						e.target.value = "";
					}}
				/>
			</div>
		</div>
	);
}

export default function BlockifyDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [gridMode, setGridMode] = useState<"0" | "1">("0");
	const [quantize, setQuantize] = useState(16);
	const [studFactor, setStudFactor] = useState(3);
	const [lightIntensity, setLightIntensity] = useState(1.4);
	const [lightAngle, setLightAngle] = useState(90);
	const [enableQuantization, setEnableQuantization] = useState(false);
	const [colorLevels, setColorLevels] = useState(4);
	const [hueShift, setHueShift] = useState(0);

	const config = useMemo(
		() => ({ gridMode: Number(gridMode), quantize, studFactor, lightIntensity, lightAngle, enableQuantization, colorLevels, hueShift }),
		[gridMode, quantize, studFactor, lightIntensity, lightAngle, enableQuantization, colorLevels, hueShift],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Blockify
					imageSrc={imageSrc}
					gridMode={Number(gridMode)}
					quantize={quantize}
					studFactor={studFactor}
					lightIntensity={lightIntensity}
					lightAngle={lightAngle}
					enableQuantization={enableQuantization}
					colorLevels={colorLevels}
					hueShift={hueShift}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
				<GUI.Select
					id="bf-grid"
					label="Grid"
					value={gridMode}
					options={[
						{ value: "0", label: "Square" },
						{ value: "1", label: "Hex" },
					]}
					onChange={setGridMode}
				/>
				<GUI.Control
					id="bf-tiles"
					label="Tiles"
					value={quantize}
					defaultValue={16}
					min={8}
					max={64}
					step={1}
					onChange={setQuantize}
				/>
				<GUI.Control
					id="bf-rounding"
					label="Rounding"
					value={studFactor}
					defaultValue={3}
					min={0}
					max={4}
					step={0.01}
					onChange={setStudFactor}
				/>
				<GUI.Control
					id="bf-light"
					label="Light"
					value={lightIntensity}
					defaultValue={1.4}
					min={0.5}
					max={2}
					step={0.1}
					onChange={setLightIntensity}
				/>
				<GUI.Control
					id="bf-lightAngle"
					label="Light Angle"
					value={lightAngle}
					defaultValue={90}
					min={0}
					max={360}
					step={15}
					unit="deg"
					onChange={setLightAngle}
				/>

				<GUI.Section title="Filters">
					<GUI.Toggle
						id="bf-posterize"
						label="Posterize"
						checked={enableQuantization}
						onChange={setEnableQuantization}
					/>
					{enableQuantization ? (
						<GUI.Control
							id="bf-colors"
							label="Colors"
							value={colorLevels}
							defaultValue={4}
							min={2}
							max={16}
							step={1}
							onChange={setColorLevels}
						/>
					) : null}
					<GUI.Control
						id="bf-hueShift"
						label="Hue Shift"
						value={hueShift}
						defaultValue={0}
						min={0}
						max={0.1}
						step={0.005}
						onChange={setHueShift}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
