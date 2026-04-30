"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import Dithering, {
	DITHERING_ALGORITHMS,
	DITHERING_BLEND_MODES,
	DITHERING_COLOR_MODES,
	DITHERING_COMPOSITE_MODES,
	DITHERING_PRESETS,
	getDitheringPresetDefaults,
	type DitheringAlgorithm,
	type DitheringBlendMode,
	type DitheringColorMode,
	type DitheringCompositeMode,
	type DitheringPreset,
	type DitheringSourceMode,
} from "./shaders/dithering";

const SOURCE_MODE_OPTIONS = [
	{ value: "field", label: "Field" },
	{ value: "image", label: "Image" },
] as const;

const PRESET_LABELS: Record<DitheringPreset, string> = {
	custom: "Custom",
	gameboy: "Game Boy",
};

const ALGORITHM_LABELS: Record<DitheringAlgorithm, string> = {
	"bayer-2x2": "Bayer 2x2",
	"bayer-4x4": "Bayer 4x4",
	"bayer-8x8": "Bayer 8x8",
	noise: "Noise",
};

const COLOR_MODE_LABELS: Record<DitheringColorMode, string> = {
	monochrome: "Monochrome",
	source: "Source Color",
	"duo-tone": "Duo Tone",
};

const BLEND_MODE_OPTIONS = DITHERING_BLEND_MODES.map((mode) => ({
	value: mode,
	label: mode
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" "),
}));

const COMPOSITE_MODE_OPTIONS = DITHERING_COMPOSITE_MODES.map((mode) => ({
	value: mode,
	label: mode.charAt(0).toUpperCase() + mode.slice(1),
}));
const PRESET_OPTIONS = DITHERING_PRESETS.map((preset) => ({ value: preset, label: PRESET_LABELS[preset] }));
const ALGORITHM_OPTIONS = DITHERING_ALGORITHMS.map((algorithm) => ({
	value: algorithm,
	label: ALGORITHM_LABELS[algorithm],
}));
const COLOR_MODE_OPTIONS = DITHERING_COLOR_MODES.map((mode) => ({
	value: mode,
	label: COLOR_MODE_LABELS[mode],
}));

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
						const file = event.currentTarget.files?.[0];
						if (file) handleFile(file);
						event.currentTarget.value = "";
					}}
				/>
			</div>
		</div>
	);
}

export default function DitheringDemo() {
	const [sourceMode, setSourceMode] = useState<DitheringSourceMode>("field");
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [opacity, setOpacity] = useState(1);
	const [blendMode, setBlendMode] = useState<DitheringBlendMode>("normal");
	const [compositeMode, setCompositeMode] = useState<DitheringCompositeMode>("filter");
	const [hue, setHue] = useState(0);
	const [saturation, setSaturation] = useState(1);
	const [preset, setPreset] = useState<DitheringPreset>("custom");
	const [algorithm, setAlgorithm] = useState<DitheringAlgorithm>("bayer-4x4");
	const [levels, setLevels] = useState(4);
	const [pixelSize, setPixelSize] = useState(1);
	const [spread, setSpread] = useState(0.5);
	const [dotScale, setDotScale] = useState(1);
	const [animateDither, setAnimateDither] = useState(false);
	const [ditherSpeed, setDitherSpeed] = useState(1);
	const [chromaticSplit, setChromaticSplit] = useState(false);
	const [colorMode, setColorMode] = useState<DitheringColorMode>("source");
	const [monoColor, setMonoColor] = useState("#f5f5f0");
	const [shadowColor, setShadowColor] = useState("#101010");
	const [highlightColor, setHighlightColor] = useState("#f5f2e8");
	const [speed, setSpeed] = useState(1);

	const handlePresetChange = useCallback((next: DitheringPreset) => {
		setPreset(next);

		const defaults = getDitheringPresetDefaults(next);
		if (defaults.algorithm) setAlgorithm(defaults.algorithm);
		if (defaults.colorMode) setColorMode(defaults.colorMode);
		if (typeof defaults.levels === "number") setLevels(defaults.levels);
		if (typeof defaults.pixelSize === "number") setPixelSize(defaults.pixelSize);
		if (typeof defaults.spread === "number") setSpread(defaults.spread);
		if (defaults.monoColor) setMonoColor(defaults.monoColor);
		if (defaults.shadowColor) setShadowColor(defaults.shadowColor);
		if (defaults.highlightColor) setHighlightColor(defaults.highlightColor);
	}, []);

	const config = useMemo(
		() => ({
			sourceMode,
			opacity,
			blendMode,
			compositeMode,
			hue,
			saturation,
			preset,
			algorithm,
			levels,
			pixelSize,
			spread,
			dotScale,
			animateDither,
			ditherSpeed,
			chromaticSplit,
			colorMode,
			monoColor,
			shadowColor,
			highlightColor,
			speed,
		}),
		[
			algorithm,
			animateDither,
			blendMode,
			chromaticSplit,
			colorMode,
			compositeMode,
			ditherSpeed,
			dotScale,
			highlightColor,
			hue,
			levels,
			monoColor,
			opacity,
			pixelSize,
			preset,
			saturation,
			shadowColor,
			sourceMode,
			speed,
			spread,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="aspect-video w-full overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Dithering
					sourceMode={sourceMode}
					imageSrc={imageSrc}
					opacity={opacity}
					blendMode={blendMode}
					compositeMode={compositeMode}
					hue={hue}
					saturation={saturation}
					preset={preset}
					algorithm={algorithm}
					levels={levels}
					pixelSize={pixelSize}
					spread={spread}
					dotScale={dotScale}
					animateDither={animateDither}
					ditherSpeed={ditherSpeed}
					chromaticSplit={chromaticSplit}
					colorMode={colorMode}
					monoColor={monoColor}
					shadowColor={shadowColor}
					highlightColor={highlightColor}
					speed={speed}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<div className="space-y-4">
					<GUI.Section title="Source" borderTop={false}>
						<GUI.Select
							id="dithering-sourceMode"
							label="Source"
							value={sourceMode}
							options={SOURCE_MODE_OPTIONS}
							onChange={setSourceMode}
						/>
						{sourceMode === "image" ? (
							<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
						) : (
							<GUI.Control
								id="dithering-speed"
								label="Source Speed"
								value={speed}
								defaultValue={1}
								min={0}
								max={3}
								step={0.05}
								onChange={setSpeed}
							/>
						)}
					</GUI.Section>

					<GUI.Section title="General">
						<GUI.Control
							id="dithering-opacity"
							label="Opacity"
							value={opacity}
							defaultValue={1}
							min={0}
							max={1}
							step={0.01}
							onChange={setOpacity}
						/>
						<GUI.Select
							id="dithering-blendMode"
							label="Blend"
							value={blendMode}
							options={BLEND_MODE_OPTIONS}
							onChange={(next) => setBlendMode(next as DitheringBlendMode)}
						/>
						<GUI.Select
							id="dithering-compositeMode"
							label="Mode"
							value={compositeMode}
							options={COMPOSITE_MODE_OPTIONS}
							onChange={(next) => setCompositeMode(next as DitheringCompositeMode)}
						/>
						<GUI.Control
							id="dithering-hue"
							label="Hue"
							value={hue}
							defaultValue={0}
							min={-180}
							max={180}
							step={1}
							unit="deg"
							onChange={setHue}
						/>
						<GUI.Control
							id="dithering-saturation"
							label="Saturation"
							value={saturation}
							defaultValue={1}
							min={0}
							max={2}
							step={0.01}
							onChange={setSaturation}
						/>
					</GUI.Section>

					<GUI.Section title="Pattern">
						<GUI.Select
							id="dithering-preset"
							label="Preset"
							value={preset}
							options={PRESET_OPTIONS}
							onChange={(next) => handlePresetChange(next as DitheringPreset)}
						/>
						<GUI.Select
							id="dithering-algorithm"
							label="Algorithm"
							value={algorithm}
							options={ALGORITHM_OPTIONS}
							onChange={(next) => setAlgorithm(next as DitheringAlgorithm)}
						/>
						<GUI.Control
							id="dithering-pixelSize"
							label="Pixel Size"
							value={pixelSize}
							defaultValue={1}
							min={1}
							max={24}
							step={1}
							onChange={setPixelSize}
						/>
						<GUI.Control
							id="dithering-spread"
							label="Strength"
							value={spread}
							defaultValue={0.5}
							min={0}
							max={1}
							step={0.01}
							onChange={setSpread}
						/>
					</GUI.Section>

					<GUI.Section title="Color">
						<GUI.Select
							id="dithering-colorMode"
							label="Color Mode"
							value={colorMode}
							options={COLOR_MODE_OPTIONS}
							onChange={(next) => setColorMode(next as DitheringColorMode)}
						/>
						<GUI.Control
							id="dithering-levels"
							label="Levels"
							value={levels}
							defaultValue={4}
							min={2}
							max={16}
							step={1}
							onChange={setLevels}
						/>
						{colorMode === "monochrome" ? (
							<ShaderColorInput
								id="dithering-monoColor"
								label="Color"
								value={monoColor}
								defaultValue="#f5f5f0"
								onChange={setMonoColor}
							/>
						) : null}
						{colorMode === "duo-tone" ? (
							<>
								<ShaderColorInput
									id="dithering-shadowColor"
									label="Shadow"
									value={shadowColor}
									defaultValue="#101010"
									onChange={setShadowColor}
								/>
								<ShaderColorInput
									id="dithering-highlightColor"
									label="Highlight"
									value={highlightColor}
									defaultValue="#f5f2e8"
									onChange={setHighlightColor}
								/>
							</>
						) : null}
					</GUI.Section>

					<GUI.Section title="Effects">
						<GUI.Control
							id="dithering-dotScale"
							label="Dot Scale"
							value={dotScale}
							defaultValue={1}
							min={0.1}
							max={1}
							step={0.1}
							onChange={setDotScale}
						/>
						<GUI.Toggle
							id="dithering-animateDither"
							label="Animate Dither"
							checked={animateDither}
							onChange={setAnimateDither}
						/>
						{animateDither ? (
							<GUI.Control
								id="dithering-ditherSpeed"
								label="Dither Speed"
								value={ditherSpeed}
								defaultValue={1}
								min={0}
								max={3}
								step={0.5}
								onChange={setDitherSpeed}
							/>
						) : null}
						<GUI.Toggle
							id="dithering-chromaticSplit"
							label="Chromatic Split"
							checked={chromaticSplit}
							onChange={setChromaticSplit}
						/>
					</GUI.Section>
				</div>
			</GUI.Panel>
		</div>
	);
}
