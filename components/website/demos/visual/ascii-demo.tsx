"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { ShaderColorInput, ShaderColorListControl } from "./shader-color-controls";
import { token } from "@/lib/tokens";

import Ascii, {
	ASCII_CHARSETS,
	ASCII_COMPOSITE_MODES,
	ASCII_CONTROL_BLEND_MODES,
	ASCII_CONTROL_COLOR_MODES,
	ASCII_COLOR_SOURCE_MODES,
	ASCII_DEFAULT_SOURCE_COLORS,
	ASCII_DEFAULT_CHARACTERS,
	ASCII_FONT_WEIGHTS,
	ASCII_MAX_SOURCE_COLORS,
	ASCII_MASK_MODES,
	ASCII_MASK_SOURCES,
	ASCII_SIGNAL_MODES,
	ASCII_TONE_MAPPING_MODES,
	type AsciiBlendMode,
	type AsciiCharset,
	type AsciiColorMode,
	type AsciiColorSourceMode,
	type AsciiCompositeMode,
	type AsciiFontWeight,
	type AsciiMaskMode,
	type AsciiMaskSource,
	type AsciiSignalMode,
	type AsciiSourceMode,
	type AsciiToneMappingMode,
} from "./shaders/ascii";

const SOURCE_MODE_OPTIONS = [
	{ value: "field", label: "Field" },
	{ value: "image", label: "Image" },
] as const;

function titleize(value: string): string {
	return value
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function optionsFromValues<const T extends readonly string[]>(values: T) {
	return values.map((value) => ({ value, label: titleize(value) }));
}

const BLEND_MODE_OPTIONS = optionsFromValues(ASCII_CONTROL_BLEND_MODES);
const COMPOSITE_MODE_OPTIONS = optionsFromValues(ASCII_COMPOSITE_MODES);
const CHARSET_OPTIONS = [
	...optionsFromValues(Object.keys(ASCII_CHARSETS) as Array<keyof typeof ASCII_CHARSETS>),
	{ value: "custom", label: "Custom" },
] as const;
const FONT_WEIGHT_OPTIONS = optionsFromValues(ASCII_FONT_WEIGHTS);
const COLOR_MODE_OPTIONS = optionsFromValues(ASCII_CONTROL_COLOR_MODES);
const COLOR_SOURCE_OPTIONS = optionsFromValues(ASCII_COLOR_SOURCE_MODES);
const MASK_SOURCE_OPTIONS = optionsFromValues(ASCII_MASK_SOURCES);
const MASK_MODE_OPTIONS = optionsFromValues(ASCII_MASK_MODES);
const SIGNAL_MODE_OPTIONS = optionsFromValues(ASCII_SIGNAL_MODES);
const TONE_MAPPING_OPTIONS = optionsFromValues(ASCII_TONE_MAPPING_MODES);

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

export default function AsciiDemo() {
	const [sourceMode, setSourceMode] = useState<AsciiSourceMode>("field");
	const [sourceColors, setSourceColors] = useState<string[]>([...ASCII_DEFAULT_SOURCE_COLORS]);
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [opacity, setOpacity] = useState(1);
	const [blendMode, setBlendMode] = useState<AsciiBlendMode>("normal");
	const [compositeMode, setCompositeMode] = useState<AsciiCompositeMode>("filter");
	const [hue, setHue] = useState(0);
	const [saturation, setSaturation] = useState(1);
	const [cellSize, setCellSize] = useState(12);
	const [charset, setCharset] = useState<AsciiCharset>("light");
	const [customChars, setCustomChars] = useState<string>(ASCII_DEFAULT_CHARACTERS);
	const [fontWeight, setFontWeight] = useState<AsciiFontWeight>("regular");
	const [colorMode, setColorMode] = useState<AsciiColorMode>("monochrome");
	const [colorSourceMode, setColorSourceMode] = useState<AsciiColorSourceMode>("source");
	const [monoColor, setMonoColor] = useState("#F5F5F0");
	const [backgroundColor, setBackgroundColor] = useState("#000000");
	const [invert, setInvert] = useState(false);
	const [directionBias, setDirectionBias] = useState(0);
	const [bgOpacity, setBgOpacity] = useState(0);
	const [maskSource, setMaskSource] = useState<AsciiMaskSource>("luminance");
	const [maskMode, setMaskMode] = useState<AsciiMaskMode>("multiply");
	const [maskInvert, setMaskInvert] = useState(false);
	const [toneMapping, setToneMapping] = useState<AsciiToneMappingMode>("none");
	const [glyphSignalMode, setGlyphSignalMode] = useState<AsciiSignalMode>("luminance");
	const [colorSignalMode, setColorSignalMode] = useState<AsciiSignalMode>("luminance");
	const [signalBlackPoint, setSignalBlackPoint] = useState(0);
	const [signalWhitePoint, setSignalWhitePoint] = useState(1);
	const [signalGamma, setSignalGamma] = useState(1);
	const [presenceThreshold, setPresenceThreshold] = useState(0);
	const [presenceSoftness, setPresenceSoftness] = useState(0);
	const [shimmerAmount, setShimmerAmount] = useState(0);
	const [shimmerSpeed, setShimmerSpeed] = useState(1);
	const [bloomEnabled, setBloomEnabled] = useState(false);
	const [bloomIntensity, setBloomIntensity] = useState(1.25);
	const [bloomThreshold, setBloomThreshold] = useState(0.6);
	const [bloomRadius, setBloomRadius] = useState(6);
	const [bloomSoftness, setBloomSoftness] = useState(0.35);
	const [speed, setSpeed] = useState(1);

	const config = useMemo(
		() => ({
			sourceMode,
			sourceColors,
			opacity,
			blendMode,
			compositeMode,
			hue,
			saturation,
			cellSize,
			charset,
			customChars,
			fontWeight,
			colorMode,
			colorSourceMode,
			monoColor,
			backgroundColor,
			invert,
			directionBias,
			bgOpacity,
			maskSource,
			maskMode,
			maskInvert,
			toneMapping,
			glyphSignalMode,
			colorSignalMode,
			signalBlackPoint,
			signalWhitePoint,
			signalGamma,
			presenceThreshold,
			presenceSoftness,
			shimmerAmount,
			shimmerSpeed,
			bloomEnabled,
			bloomIntensity,
			bloomThreshold,
			bloomRadius,
			bloomSoftness,
			speed,
		}),
		[
			backgroundColor,
			bgOpacity,
			blendMode,
			bloomEnabled,
			bloomIntensity,
			bloomRadius,
			bloomSoftness,
			bloomThreshold,
			cellSize,
			charset,
			colorMode,
			colorSourceMode,
			colorSignalMode,
			compositeMode,
			customChars,
			directionBias,
			fontWeight,
			glyphSignalMode,
			hue,
			invert,
			maskInvert,
			maskMode,
			maskSource,
			monoColor,
			opacity,
			presenceSoftness,
			presenceThreshold,
			saturation,
			shimmerAmount,
			shimmerSpeed,
			signalBlackPoint,
			signalGamma,
			signalWhitePoint,
			sourceColors,
			sourceMode,
			speed,
			toneMapping,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="aspect-video w-full overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Ascii
					sourceMode={sourceMode}
					sourceColors={sourceColors}
					imageSrc={imageSrc}
					opacity={opacity}
					blendMode={blendMode}
					compositeMode={compositeMode}
					hue={hue}
					saturation={saturation}
					cellSize={cellSize}
					charset={charset}
					customChars={customChars}
					fontWeight={fontWeight}
					colorMode={colorMode}
					colorSourceMode={colorSourceMode}
					monoColor={monoColor}
					backgroundColor={backgroundColor}
					invert={invert}
					directionBias={directionBias}
					bgOpacity={bgOpacity}
					maskSource={maskSource}
					maskMode={maskMode}
					maskInvert={maskInvert}
					toneMapping={toneMapping}
					glyphSignalMode={glyphSignalMode}
					colorSignalMode={colorSignalMode}
					signalBlackPoint={signalBlackPoint}
					signalWhitePoint={signalWhitePoint}
					signalGamma={signalGamma}
					presenceThreshold={presenceThreshold}
					presenceSoftness={presenceSoftness}
					shimmerAmount={shimmerAmount}
					shimmerSpeed={shimmerSpeed}
					bloomEnabled={bloomEnabled}
					bloomIntensity={bloomIntensity}
					bloomThreshold={bloomThreshold}
					bloomRadius={bloomRadius}
					bloomSoftness={bloomSoftness}
					speed={speed}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<div className="space-y-4">
					<GUI.Section title="Input" borderTop={false}>
						<GUI.Select
							id="ascii-sourceMode"
							label="Source"
							value={sourceMode}
							options={SOURCE_MODE_OPTIONS}
							onChange={setSourceMode}
						/>
						{sourceMode === "image" ? (
							<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
						) : null}
						{sourceMode === "field" ? (
							<>
								<GUI.Control
									id="ascii-speed"
									label="Source Speed"
									value={speed}
									defaultValue={1}
									min={0}
									max={3}
									step={0.05}
									onChange={setSpeed}
								/>
								<ShaderColorListControl
									id="ascii-sourceColors"
									label="Colors"
									value={sourceColors}
									defaultValue={ASCII_DEFAULT_SOURCE_COLORS}
									onChange={setSourceColors}
									allowAddRemove
									maxColors={ASCII_MAX_SOURCE_COLORS}
								/>
							</>
						) : null}
					</GUI.Section>

					<GUI.Section title="General">
						<GUI.Control
							id="ascii-opacity"
							label="Opacity"
							value={opacity}
							defaultValue={1}
							min={0}
							max={1}
							step={0.01}
							onChange={setOpacity}
						/>
						<GUI.Select
							id="ascii-blendMode"
							label="Blend"
							value={blendMode}
							options={BLEND_MODE_OPTIONS}
							onChange={(next) => setBlendMode(next as AsciiBlendMode)}
						/>
						<GUI.Select
							id="ascii-compositeMode"
							label="Mode"
							value={compositeMode}
							options={COMPOSITE_MODE_OPTIONS}
							onChange={(next) => setCompositeMode(next as AsciiCompositeMode)}
						/>
						{compositeMode === "mask" ? (
							<>
								<GUI.Select
									id="ascii-maskSource"
									label="Source"
									value={maskSource}
									options={MASK_SOURCE_OPTIONS}
									onChange={(next) => setMaskSource(next as AsciiMaskSource)}
								/>
								<GUI.Select
									id="ascii-maskMode"
									label="Mask Mode"
									value={maskMode}
									options={MASK_MODE_OPTIONS}
									onChange={(next) => setMaskMode(next as AsciiMaskMode)}
								/>
								<GUI.Toggle
									id="ascii-maskInvert"
									label="Mask Invert"
									checked={maskInvert}
									onChange={setMaskInvert}
								/>
							</>
						) : null}
						<GUI.Control
							id="ascii-hue"
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
							id="ascii-saturation"
							label="Saturation"
							value={saturation}
							defaultValue={1}
							min={0}
							max={2}
							step={0.01}
							onChange={setSaturation}
						/>
					</GUI.Section>

					<GUI.Section title="Settings">
						<GUI.Control
							id="ascii-cellSize"
							label="Cell Size"
							value={cellSize}
							defaultValue={12}
							min={4}
							max={48}
							step={1}
							onChange={setCellSize}
						/>
						<GUI.Select
							id="ascii-charset"
							label="Charset"
							value={charset}
							options={CHARSET_OPTIONS}
							onChange={(next) => setCharset(next as AsciiCharset)}
						/>
						{charset === "custom" ? (
							<GUI.TextInput
								id="ascii-customChars"
								label="Custom Chars"
								value={customChars}
								placeholder={ASCII_DEFAULT_CHARACTERS}
								onChange={setCustomChars}
							/>
						) : null}
						<GUI.Select
							id="ascii-fontWeight"
							label="Font Weight"
							value={fontWeight}
							options={FONT_WEIGHT_OPTIONS}
							onChange={(next) => setFontWeight(next as AsciiFontWeight)}
						/>
						<GUI.Select
							id="ascii-colorMode"
							label="Color Mode"
							value={colorMode}
							options={COLOR_MODE_OPTIONS}
							onChange={(next) => setColorMode(next as AsciiColorMode)}
						/>
						{colorMode === "source" ? (
							<GUI.Select
								id="ascii-colorSourceMode"
								label="Source Channel"
								value={colorSourceMode}
								options={COLOR_SOURCE_OPTIONS}
								onChange={(next) => setColorSourceMode(next as AsciiColorSourceMode)}
							/>
						) : null}
						{colorMode === "monochrome" ? (
							<ShaderColorInput
								id="ascii-monoColor"
								label="Tint"
								value={monoColor}
								defaultValue="#F5F5F0"
								onChange={setMonoColor}
							/>
						) : null}
						<ShaderColorInput
							id="ascii-backgroundColor"
							label="Background Color"
							value={backgroundColor}
							defaultValue="#000000"
							onChange={setBackgroundColor}
						/>
						<GUI.Toggle
							id="ascii-invert"
							label="Invert"
							checked={invert}
							onChange={setInvert}
						/>
						<GUI.Control
							id="ascii-directionBias"
							label="Direction Bias"
							value={directionBias}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setDirectionBias}
						/>
						{colorMode === "source" ? (
							<GUI.Control
								id="ascii-bgOpacity"
								label="Source Background"
								value={bgOpacity}
								defaultValue={0}
								min={0}
								max={1}
								step={0.01}
								onChange={setBgOpacity}
							/>
						) : null}
					</GUI.Section>

					<GUI.Section title="Signal">
						<GUI.Select
							id="ascii-toneMapping"
							label="Tone Mapping"
							value={toneMapping}
							options={TONE_MAPPING_OPTIONS}
							onChange={(next) => setToneMapping(next as AsciiToneMappingMode)}
						/>
						<GUI.Select
							id="ascii-glyphSignalMode"
							label="Glyph Signal"
							value={glyphSignalMode}
							options={SIGNAL_MODE_OPTIONS}
							onChange={(next) => setGlyphSignalMode(next as AsciiSignalMode)}
						/>
						{colorMode === "source" ? null : (
							<GUI.Select
								id="ascii-colorSignalMode"
								label="Color Signal"
								value={colorSignalMode}
								options={SIGNAL_MODE_OPTIONS}
								onChange={(next) => setColorSignalMode(next as AsciiSignalMode)}
							/>
						)}
						<GUI.Control
							id="ascii-blackPoint"
							label="Black Point"
							value={signalBlackPoint}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setSignalBlackPoint}
						/>
						<GUI.Control
							id="ascii-whitePoint"
							label="White Point"
							value={signalWhitePoint}
							defaultValue={1}
							min={0}
							max={1}
							step={0.01}
							onChange={setSignalWhitePoint}
						/>
						<GUI.Control
							id="ascii-gamma"
							label="Gamma"
							value={signalGamma}
							defaultValue={1}
							min={0.1}
							max={5}
							step={0.01}
							onChange={setSignalGamma}
						/>
					</GUI.Section>

					<GUI.Section title="Presence">
						<GUI.Control
							id="ascii-presenceThreshold"
							label="Threshold"
							value={presenceThreshold}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setPresenceThreshold}
						/>
						<GUI.Control
							id="ascii-presenceSoftness"
							label="Softness"
							value={presenceSoftness}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setPresenceSoftness}
						/>
					</GUI.Section>

					<GUI.Section title="Shimmer">
						<GUI.Control
							id="ascii-shimmerAmount"
							label="Amount"
							value={shimmerAmount}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setShimmerAmount}
						/>
						<GUI.Control
							id="ascii-shimmerSpeed"
							label="Speed"
							value={shimmerSpeed}
							defaultValue={1}
							min={0}
							max={10}
							step={0.1}
							onChange={setShimmerSpeed}
						/>
					</GUI.Section>

					<GUI.Section title="Bloom">
						<GUI.Toggle
							id="ascii-bloomEnabled"
							label="Bloom"
							checked={bloomEnabled}
							onChange={setBloomEnabled}
						/>
						{bloomEnabled ? (
							<>
								<GUI.Control
									id="ascii-bloomIntensity"
									label="Intensity"
									value={bloomIntensity}
									defaultValue={1.25}
									min={0}
									max={8}
									step={0.01}
									onChange={setBloomIntensity}
								/>
								<GUI.Control
									id="ascii-bloomThreshold"
									label="Threshold"
									value={bloomThreshold}
									defaultValue={0.6}
									min={0}
									max={1}
									step={0.01}
									onChange={setBloomThreshold}
								/>
								<GUI.Control
									id="ascii-bloomRadius"
									label="Radius"
									value={bloomRadius}
									defaultValue={6}
									min={0}
									max={24}
									step={0.25}
									onChange={setBloomRadius}
								/>
								<GUI.Control
									id="ascii-bloomSoftness"
									label="Softness"
									value={bloomSoftness}
									defaultValue={0.35}
									min={0}
									max={1}
									step={0.01}
									onChange={setBloomSoftness}
								/>
							</>
						) : null}
					</GUI.Section>
				</div>
			</GUI.Panel>
		</div>
	);
}
