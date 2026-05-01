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
	ASCII_BACKGROUND_MODES,
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
	type AsciiBackgroundMode,
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
const BACKGROUND_MODE_OPTIONS = [
	{ value: "blurred-image", label: "Blurred Image" },
	{ value: "solid-black", label: "Solid Black" },
	{ value: "original-image", label: "Original Image" },
	{ value: "transparent", label: "None (Transparent)" },
] satisfies ReadonlyArray<{ value: (typeof ASCII_BACKGROUND_MODES)[number]; label: string }>;
const DEFAULT_CHARSET_VALUES: Record<AsciiCharset, string> = {
	...ASCII_CHARSETS,
	custom: ASCII_DEFAULT_CHARACTERS,
};
const DEFAULT_DENSITY = 0.82;
const IMAGE_BACKGROUND_OPACITY = 0.61;
const IMAGE_BACKGROUND_BLUR_RADIUS = 60;

function PercentControl({
	id,
	label,
	value,
	defaultValue,
	min = 0,
	max = 1,
	step = 0.01,
	onChange,
}: {
	id: string;
	label: string;
	value: number;
	defaultValue: number;
	min?: number;
	max?: number;
	step?: number;
	onChange: (next: number) => void;
}) {
	return (
		<GUI.Control
			id={id}
			label={label}
			value={value * 100}
			defaultValue={defaultValue * 100}
			min={min * 100}
			max={max * 100}
			step={step * 100}
			unit="%"
			onChange={(next) => onChange(next / 100)}
		/>
	);
}

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
	const [brightness, setBrightness] = useState(0);
	const [contrast, setContrast] = useState(1);
	const [density, setDensity] = useState(DEFAULT_DENSITY);
	const [charset, setCharset] = useState<AsciiCharset>("light");
	const [charsetCharacters, setCharsetCharacters] = useState<Record<AsciiCharset, string>>(DEFAULT_CHARSET_VALUES);
	const [characterOpacity, setCharacterOpacity] = useState(1);
	const [randomizeCharacters, setRandomizeCharacters] = useState(0);
	const [randomSeed, setRandomSeed] = useState(0);
	const [animatedCharacters, setAnimatedCharacters] = useState(false);
	const [characterCycleSpeed, setCharacterCycleSpeed] = useState(8);
	const [dotGridOverlay, setDotGridOverlay] = useState(0);
	const [fontWeight, setFontWeight] = useState<AsciiFontWeight>("regular");
	const [colorMode, setColorMode] = useState<AsciiColorMode>("monochrome");
	const [colorSourceMode, setColorSourceMode] = useState<AsciiColorSourceMode>("source");
	const [monoColor, setMonoColor] = useState("#F5F5F0");
	const [backgroundColor, setBackgroundColor] = useState("#000000");
	const [backgroundMode, setBackgroundMode] = useState<AsciiBackgroundMode>("solid-black");
	const [backgroundOpacity, setBackgroundOpacity] = useState(IMAGE_BACKGROUND_OPACITY);
	const [backgroundBlurRadius, setBackgroundBlurRadius] = useState(IMAGE_BACKGROUND_BLUR_RADIUS);
	const [invert, setInvert] = useState(false);
	const [edgeEmphasis, setEdgeEmphasis] = useState(0);
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
	const [coverage, setCoverage] = useState(1);
	const [presenceSoftness, setPresenceSoftness] = useState(0);
	const [shimmerAmount, setShimmerAmount] = useState(0);
	const [shimmerSpeed, setShimmerSpeed] = useState(1);
	const [bloomEnabled, setBloomEnabled] = useState(false);
	const [bloomIntensity, setBloomIntensity] = useState(1.25);
	const [bloomThreshold, setBloomThreshold] = useState(0.6);
	const [bloomRadius, setBloomRadius] = useState(6);
	const [bloomSoftness, setBloomSoftness] = useState(0.35);
	const [colorOverlay, setColorOverlay] = useState(false);
	const [colorOverlayColor, setColorOverlayColor] = useState("#F5F5F0");
	const [vignette, setVignette] = useState(false);
	const [scanLines, setScanLines] = useState(false);
	const [crtCurvature, setCrtCurvature] = useState(false);
	const [chromatic, setChromatic] = useState(false);
	const [characterBloom, setCharacterBloom] = useState(false);
	const [characterChromatic, setCharacterChromatic] = useState(false);
	const [filmGrain, setFilmGrain] = useState(false);
	const [glitch, setGlitch] = useState(false);
	const [rgbSplit, setRgbSplit] = useState(false);
	const [blur, setBlur] = useState(false);
	const [pixelate, setPixelate] = useState(false);
	const [halftone, setHalftone] = useState(false);
	const [filmDust, setFilmDust] = useState(false);
	const [speed, setSpeed] = useState(1);
	const activeCharsetCharacters = charsetCharacters[charset] ?? ASCII_DEFAULT_CHARACTERS;

	const setActiveCharsetCharacters = useCallback(
		(next: string) => {
			setCharsetCharacters((prev) => ({
				...prev,
				[charset]: next,
			}));
		},
		[charset],
	);

	const applyImageBackgroundDefaults = useCallback(() => {
		setBackgroundMode("blurred-image");
		setBackgroundOpacity(IMAGE_BACKGROUND_OPACITY);
		setBackgroundBlurRadius(IMAGE_BACKGROUND_BLUR_RADIUS);
	}, []);

	const handleSourceModeChange = useCallback(
		(next: AsciiSourceMode) => {
			setSourceMode(next);
			if (next === "image") {
				applyImageBackgroundDefaults();
				return;
			}
			setBackgroundMode("solid-black");
		},
		[applyImageBackgroundDefaults],
	);

	const handleImageChange = useCallback(
		(next: string | undefined) => {
			setImageSrc(next);
			if (next) {
				setSourceMode("image");
				applyImageBackgroundDefaults();
				return;
			}
			setBackgroundMode("solid-black");
		},
		[applyImageBackgroundDefaults],
	);

	const config = useMemo(
		() => ({
			sourceMode,
			sourceColors,
			opacity,
			blendMode,
			compositeMode,
			hue,
			saturation,
			brightness,
			contrast,
			density,
			charset,
			characters: activeCharsetCharacters,
			customChars: charsetCharacters.custom,
			characterOpacity,
			randomizeCharacters,
			randomSeed,
			animatedCharacters,
			characterCycleSpeed,
			dotGridOverlay,
			fontWeight,
			colorMode,
			colorSourceMode,
			monoColor,
			backgroundColor,
			backgroundMode,
			backgroundOpacity,
			backgroundBlurRadius,
			invert,
			edgeEmphasis,
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
			coverage,
			presenceSoftness,
			shimmerAmount,
			shimmerSpeed,
			bloomEnabled,
			bloomIntensity,
			bloomThreshold,
			bloomRadius,
			bloomSoftness,
			colorOverlay,
			colorOverlayColor,
			vignette,
			scanLines,
			crtCurvature,
			chromatic,
			characterBloom,
			characterChromatic,
			filmGrain,
			glitch,
			rgbSplit,
			blur,
			pixelate,
			halftone,
			filmDust,
			speed,
		}),
		[
			activeCharsetCharacters,
			animatedCharacters,
			backgroundBlurRadius,
			backgroundColor,
			backgroundMode,
			backgroundOpacity,
			bgOpacity,
			blendMode,
			blur,
			bloomEnabled,
			bloomIntensity,
			bloomRadius,
			bloomSoftness,
			bloomThreshold,
			brightness,
			characterCycleSpeed,
			characterBloom,
			characterChromatic,
			characterOpacity,
			charset,
			chromatic,
			colorOverlay,
			colorOverlayColor,
			colorMode,
			colorSourceMode,
			colorSignalMode,
			compositeMode,
			contrast,
			crtCurvature,
			charsetCharacters.custom,
			coverage,
			density,
			dotGridOverlay,
			edgeEmphasis,
			filmGrain,
			filmDust,
			fontWeight,
			glitch,
			glyphSignalMode,
			halftone,
			hue,
			invert,
			maskInvert,
			maskMode,
			maskSource,
			monoColor,
			opacity,
			presenceSoftness,
			pixelate,
			randomizeCharacters,
			randomSeed,
			rgbSplit,
			saturation,
			scanLines,
			shimmerAmount,
			shimmerSpeed,
			signalBlackPoint,
			signalGamma,
			signalWhitePoint,
			sourceColors,
			sourceMode,
			speed,
			toneMapping,
			vignette,
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
					brightness={brightness}
					contrast={contrast}
					density={density}
					charset={charset}
					characters={activeCharsetCharacters}
					customChars={charsetCharacters.custom}
					characterOpacity={characterOpacity}
					randomizeCharacters={randomizeCharacters}
					randomSeed={randomSeed}
					animatedCharacters={animatedCharacters}
					characterCycleSpeed={characterCycleSpeed}
					dotGridOverlay={dotGridOverlay}
					fontWeight={fontWeight}
					colorMode={colorMode}
					colorSourceMode={colorSourceMode}
					monoColor={monoColor}
					backgroundColor={backgroundColor}
					backgroundMode={backgroundMode}
					backgroundOpacity={backgroundOpacity}
					backgroundBlurRadius={backgroundBlurRadius}
					invert={invert}
					edgeEmphasis={edgeEmphasis}
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
					coverage={coverage}
					presenceSoftness={presenceSoftness}
					shimmerAmount={shimmerAmount}
					shimmerSpeed={shimmerSpeed}
					bloomEnabled={bloomEnabled}
					bloomIntensity={bloomIntensity}
					bloomThreshold={bloomThreshold}
					bloomRadius={bloomRadius}
					bloomSoftness={bloomSoftness}
					colorOverlay={colorOverlay}
					colorOverlayColor={colorOverlayColor}
					vignette={vignette}
					scanLines={scanLines}
					crtCurvature={crtCurvature}
					chromatic={chromatic}
					characterBloom={characterBloom}
					characterChromatic={characterChromatic}
					filmGrain={filmGrain}
					glitch={glitch}
					rgbSplit={rgbSplit}
					blur={blur}
					pixelate={pixelate}
					halftone={halftone}
					filmDust={filmDust}
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
							onChange={handleSourceModeChange}
						/>
						{sourceMode === "image" ? (
							<ImageUploadControl imageSrc={imageSrc} onChange={handleImageChange} />
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
						<PercentControl
							id="ascii-brightness"
							label="Brightness"
							value={brightness}
							defaultValue={0}
							min={-1}
							max={1}
							step={0.01}
							onChange={setBrightness}
						/>
						<PercentControl
							id="ascii-contrast"
							label="Contrast"
							value={contrast}
							defaultValue={1}
							min={0}
							max={3}
							step={0.01}
							onChange={setContrast}
						/>
					</GUI.Section>

					<GUI.Section title="Settings">
						<PercentControl
							id="ascii-density"
							label="Density"
							value={density}
							defaultValue={DEFAULT_DENSITY}
							min={0}
							max={1}
							step={0.01}
							onChange={setDensity}
						/>
						<GUI.Select
							id="ascii-charset"
							label="Charset"
							value={charset}
							options={CHARSET_OPTIONS}
							onChange={(next) => setCharset(next as AsciiCharset)}
						/>
						<GUI.TextInput
							id="ascii-characters"
							label="Characters"
							value={activeCharsetCharacters}
							placeholder={ASCII_DEFAULT_CHARACTERS}
							onChange={setActiveCharsetCharacters}
						/>
						<GUI.Select
							id="ascii-fontWeight"
							label="Font Weight"
							value={fontWeight}
							options={FONT_WEIGHT_OPTIONS}
							onChange={(next) => setFontWeight(next as AsciiFontWeight)}
						/>
						<GUI.Control
							id="ascii-characterOpacity"
							label="Character Opacity"
							value={characterOpacity}
							defaultValue={1}
							min={0}
							max={1}
							step={0.01}
							onChange={setCharacterOpacity}
						/>
						<GUI.Control
							id="ascii-dotGridOverlay"
							label="Dot Grid Overlay"
							value={dotGridOverlay}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setDotGridOverlay}
						/>
						<GUI.Control
							id="ascii-randomizeCharacters"
							label="Randomize Characters"
							value={randomizeCharacters}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setRandomizeCharacters}
						/>
						{randomizeCharacters > 0 ? (
							<GUI.Control
								id="ascii-randomSeed"
								label="Random Seed"
								value={randomSeed}
								defaultValue={0}
								min={0}
								max={100}
								step={1}
								onChange={setRandomSeed}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-animatedCharacters"
							label="Animated ASCII"
							checked={animatedCharacters}
							onChange={setAnimatedCharacters}
						/>
						{animatedCharacters ? (
							<GUI.Control
								id="ascii-characterCycleSpeed"
								label="Cycle Speed"
								value={characterCycleSpeed}
								defaultValue={8}
								min={0}
								max={24}
								step={0.25}
								onChange={setCharacterCycleSpeed}
							/>
						) : null}
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
						<GUI.Select
							id="ascii-backgroundMode"
							label="Background Mode"
							value={backgroundMode}
							options={BACKGROUND_MODE_OPTIONS}
							onChange={(next) => setBackgroundMode(next as AsciiBackgroundMode)}
						/>
						{backgroundMode === "blurred-image" || backgroundMode === "original-image" ? (
							<GUI.Control
								id="ascii-backgroundOpacity"
								label="Background Opacity"
								value={backgroundOpacity}
								defaultValue={IMAGE_BACKGROUND_OPACITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setBackgroundOpacity}
							/>
						) : null}
						{backgroundMode === "blurred-image" ? (
							<GUI.Control
								id="ascii-backgroundBlurRadius"
								label="Blur Radius"
								value={backgroundBlurRadius}
								defaultValue={IMAGE_BACKGROUND_BLUR_RADIUS}
								min={0}
								max={100}
								step={1}
								onChange={setBackgroundBlurRadius}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-invert"
							label="Invert"
							checked={invert}
							onChange={setInvert}
						/>
						<PercentControl
							id="ascii-edgeEmphasis"
							label="Edge Emphasis"
							value={edgeEmphasis}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setEdgeEmphasis}
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
						<PercentControl
							id="ascii-coverage"
							label="Coverage"
							value={coverage}
							defaultValue={1}
							min={0}
							max={1}
							step={0.01}
							onChange={setCoverage}
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

					<GUI.Section title="Post-Processing">
						<GUI.Toggle
							id="ascii-colorOverlay"
							label="Color Overlay"
							checked={colorOverlay}
							onChange={setColorOverlay}
						/>
						{colorOverlay ? (
							<ShaderColorInput
								id="ascii-colorOverlayColor"
								label="Overlay Color"
								value={colorOverlayColor}
								defaultValue="#F5F5F0"
								onChange={setColorOverlayColor}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-vignette"
							label="Vignette"
							checked={vignette}
							onChange={setVignette}
						/>
						<GUI.Toggle
							id="ascii-scanLines"
							label="Scan Lines"
							checked={scanLines}
							onChange={setScanLines}
						/>
						<GUI.Toggle
							id="ascii-crtCurvature"
							label="CRT Curvature"
							checked={crtCurvature}
							onChange={setCrtCurvature}
						/>
						<GUI.Toggle
							id="ascii-chromatic"
							label="Chromatic"
							checked={chromatic}
							onChange={setChromatic}
						/>
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
						<GUI.Toggle
							id="ascii-characterBloom"
							label="Character Bloom"
							checked={characterBloom}
							onChange={setCharacterBloom}
						/>
						<GUI.Toggle
							id="ascii-characterChromatic"
							label="Character Chromatic"
							checked={characterChromatic}
							onChange={setCharacterChromatic}
						/>
						<GUI.Toggle
							id="ascii-filmGrain"
							label="Film Grain"
							checked={filmGrain}
							onChange={setFilmGrain}
						/>
						<GUI.Toggle
							id="ascii-glitch"
							label="Glitch"
							checked={glitch}
							onChange={setGlitch}
						/>
						<GUI.Toggle
							id="ascii-rgbSplit"
							label="RGB Split"
							checked={rgbSplit}
							onChange={setRgbSplit}
						/>
						<GUI.Toggle
							id="ascii-blur"
							label="Blur"
							checked={blur}
							onChange={setBlur}
						/>
						<GUI.Toggle
							id="ascii-pixelate"
							label="Pixelate"
							checked={pixelate}
							onChange={setPixelate}
						/>
						<GUI.Toggle
							id="ascii-halftone"
							label="Halftone"
							checked={halftone}
							onChange={setHalftone}
						/>
						<GUI.Toggle
							id="ascii-filmDust"
							label="Film Dust"
							checked={filmDust}
							onChange={setFilmDust}
						/>
					</GUI.Section>
				</div>
			</GUI.Panel>
		</div>
	);
}
