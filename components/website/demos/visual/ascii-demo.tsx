"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";
import VideoPlayIcon from "@atlaskit/icon/core/video-play";
import VideoStopIcon from "@atlaskit/icon/core/video-stop";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { ShaderColorInput, ShaderColorListControl } from "./shader-color-controls";
import { token } from "@/lib/tokens";

import Ascii, {
	ASCII_ANIMATION_STYLES,
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
	type AsciiAnimationStyle,
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

const ANIMATION_STYLE_OPTIONS = [
	{ value: "wave", label: "Wave" },
	{ value: "cascade-left-right", label: "Cascade Left -> Right" },
	{ value: "cascade-right-left", label: "Cascade Right -> Left" },
	{ value: "cascade-top-bottom", label: "Cascade Top -> Bottom" },
	{ value: "reveal", label: "Reveal" },
	{ value: "pulse", label: "Pulse" },
] satisfies ReadonlyArray<{ value: (typeof ASCII_ANIMATION_STYLES)[number]; label: string }>;

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
const DEFAULT_PREVIEW_ASPECT_RATIO = "16 / 9";
const IMAGE_BACKGROUND_OPACITY = 0.61;
const IMAGE_BACKGROUND_BLUR_RADIUS = 60;
const DEFAULT_ANIMATION_SPEED_SECONDS = 4.3;
const DEFAULT_ANIMATION_INTENSITY = 0.83;
const DEFAULT_ANIMATION_RANDOMNESS = 0.5;
const DEFAULT_COLOR_OVERLAY_OPACITY = 0.3;
const DEFAULT_VIGNETTE_INTENSITY = 0.5;
const DEFAULT_SCAN_LINES_INTENSITY = 0.4;
const DEFAULT_CRT_CURVATURE_INTENSITY = 0.3;
const DEFAULT_CHROMATIC_OFFSET = 3;
const DEFAULT_BLOOM_INTENSITY = 0.4;
const DEFAULT_BLOOM_THRESHOLD = 0.6;
const DEFAULT_BLOOM_RADIUS = 6;
const DEFAULT_BLOOM_SOFTNESS = 0.35;
const DEFAULT_CHARACTER_BLOOM_INTENSITY = 0.6;
const DEFAULT_CHARACTER_CHROMATIC_OFFSET = 3;
const DEFAULT_FILM_GRAIN_INTENSITY = 0.3;
const DEFAULT_GLITCH_INTENSITY = 0.2;
const DEFAULT_RGB_SPLIT_OFFSET = 2;
const DEFAULT_BLUR_RADIUS = 2;
const DEFAULT_PIXELATE_SIZE = 4;
const DEFAULT_HALFTONE_SIZE = 4;
const DEFAULT_FILM_DUST_DENSITY = 0.2;
const COLOR_OVERLAY_BLEND_OPTIONS = [
	{ value: "multiply", label: "Multiply" },
	{ value: "overlay", label: "Overlay" },
	{ value: "screen", label: "Screen" },
	{ value: "color", label: "Color" },
	{ value: "hue", label: "Hue" },
	{ value: "saturation", label: "Saturation" },
	{ value: "luminosity", label: "Luminosity" },
	{ value: "soft-light", label: "Soft Light" },
	{ value: "hard-light", label: "Hard Light" },
	{ value: "color-burn", label: "Color Burn" },
	{ value: "color-dodge", label: "Color Dodge" },
] satisfies ReadonlyArray<{ value: AsciiBlendMode; label: string }>;

function animationDurationToCycleSpeed(durationSeconds: number, characterCount: number): number {
	return characterCount / Math.max(durationSeconds, 0.1);
}

interface UploadedImage {
	src: string;
	width: number;
	height: number;
}

function loadUploadedImageDimensions(src: string): Promise<Pick<UploadedImage, "width" | "height">> {
	return new Promise((resolve, reject) => {
		const image = new window.Image();
		image.onload = () => {
			resolve({
				width: Math.max(image.naturalWidth, 1),
				height: Math.max(image.naturalHeight, 1),
			});
		};
		image.onerror = () => reject(new Error("Unable to read uploaded image dimensions."));
		image.src = src;
	});
}

function getPreviewAspectRatio(image: UploadedImage | undefined): string {
	return image ? `${image.width} / ${image.height}` : DEFAULT_PREVIEW_ASPECT_RATIO;
}

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
	image,
	onChange,
}: {
	image: UploadedImage | undefined;
	onChange: (next: UploadedImage | undefined) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		async (file: File) => {
			const src = URL.createObjectURL(file);
			try {
				const dimensions = await loadUploadedImageDimensions(src);
				onChange({ src, ...dimensions });
			} catch {
				URL.revokeObjectURL(src);
				onChange(undefined);
			}
		},
		[onChange],
	);

	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium text-text">Image</Label>
			<div className="flex items-center gap-2">
				{image ? (
					<Image
						src={image.src}
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
					{image ? "Change" : "Upload"}
				</button>
				{image ? (
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
						if (file) void handleFile(file);
						event.currentTarget.value = "";
					}}
				/>
			</div>
		</div>
	);
}

function AnimationPlaybackControl({
	playing,
	onChange,
}: {
	playing: boolean;
	onChange: (next: boolean) => void;
}) {
	const options = [
		{ value: true, label: "Play", icon: VideoPlayIcon },
		{ value: false, label: "Stop", icon: VideoStopIcon },
	] as const;

	return (
		<div className="space-y-1.5">
			<Label className="text-xs font-medium text-text">Playback</Label>
			<div
				role="group"
				aria-label="Playback"
				className="inline-flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-md bg-bg-neutral p-0.5"
			>
				{options.map((option) => {
					const Icon = option.icon;
					const selected = playing === option.value;
					return (
						<button
							key={option.label}
							type="button"
							aria-pressed={selected}
							onClick={() => onChange(option.value)}
							className={`flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
								selected
									? "bg-surface text-text shadow-sm"
									: "text-text-subtle hover:text-text"
							}`}
						>
							<Icon label="" size="small" />
							{option.label}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export default function AsciiDemo() {
	const [sourceMode, setSourceMode] = useState<AsciiSourceMode>("field");
	const [sourceColors, setSourceColors] = useState<string[]>([...ASCII_DEFAULT_SOURCE_COLORS]);
	const [uploadedImage, setUploadedImage] = useState<UploadedImage | undefined>(undefined);
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
	const [animationPlaying, setAnimationPlaying] = useState(true);
	const [animationStyle, setAnimationStyle] = useState<AsciiAnimationStyle>("wave");
	const [animationSpeedSeconds, setAnimationSpeedSeconds] = useState(DEFAULT_ANIMATION_SPEED_SECONDS);
	const [animationIntensity, setAnimationIntensity] = useState(DEFAULT_ANIMATION_INTENSITY);
	const [animationRandomness, setAnimationRandomness] = useState(DEFAULT_ANIMATION_RANDOMNESS);
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
	const [bloomIntensity, setBloomIntensity] = useState(DEFAULT_BLOOM_INTENSITY);
	const [colorOverlay, setColorOverlay] = useState(false);
	const [colorOverlayColor, setColorOverlayColor] = useState("#F5F5F0");
	const [colorOverlayOpacity, setColorOverlayOpacity] = useState(DEFAULT_COLOR_OVERLAY_OPACITY);
	const [colorOverlayBlendMode, setColorOverlayBlendMode] = useState<AsciiBlendMode>("multiply");
	const [vignette, setVignette] = useState(false);
	const [vignetteIntensity, setVignetteIntensity] = useState(DEFAULT_VIGNETTE_INTENSITY);
	const [scanLines, setScanLines] = useState(false);
	const [scanLinesIntensity, setScanLinesIntensity] = useState(DEFAULT_SCAN_LINES_INTENSITY);
	const [crtCurvature, setCrtCurvature] = useState(false);
	const [crtCurvatureIntensity, setCrtCurvatureIntensity] = useState(DEFAULT_CRT_CURVATURE_INTENSITY);
	const [chromatic, setChromatic] = useState(false);
	const [chromaticOffset, setChromaticOffset] = useState(DEFAULT_CHROMATIC_OFFSET);
	const [characterBloom, setCharacterBloom] = useState(false);
	const [characterBloomIntensity, setCharacterBloomIntensity] = useState(DEFAULT_CHARACTER_BLOOM_INTENSITY);
	const [characterChromatic, setCharacterChromatic] = useState(false);
	const [characterChromaticOffset, setCharacterChromaticOffset] = useState(DEFAULT_CHARACTER_CHROMATIC_OFFSET);
	const [filmGrain, setFilmGrain] = useState(false);
	const [filmGrainIntensity, setFilmGrainIntensity] = useState(DEFAULT_FILM_GRAIN_INTENSITY);
	const [glitch, setGlitch] = useState(false);
	const [glitchIntensity, setGlitchIntensity] = useState(DEFAULT_GLITCH_INTENSITY);
	const [rgbSplit, setRgbSplit] = useState(false);
	const [rgbSplitOffset, setRgbSplitOffset] = useState(DEFAULT_RGB_SPLIT_OFFSET);
	const [blur, setBlur] = useState(false);
	const [blurRadius, setBlurRadius] = useState(DEFAULT_BLUR_RADIUS);
	const [pixelate, setPixelate] = useState(false);
	const [pixelateSize, setPixelateSize] = useState(DEFAULT_PIXELATE_SIZE);
	const [halftone, setHalftone] = useState(false);
	const [halftoneSize, setHalftoneSize] = useState(DEFAULT_HALFTONE_SIZE);
	const [filmDust, setFilmDust] = useState(false);
	const [filmDustDensity, setFilmDustDensity] = useState(DEFAULT_FILM_DUST_DENSITY);
	const [speed, setSpeed] = useState(1);
	const uploadedImageSrc = uploadedImage?.src;
	const previousUploadedImageSrcRef = useRef<string | undefined>(undefined);
	const activeCharsetCharacters = charsetCharacters[charset] ?? ASCII_DEFAULT_CHARACTERS;
	const resolvedCharacterCycleSpeed = animationDurationToCycleSpeed(animationSpeedSeconds, activeCharsetCharacters.length);
	const previewAspectRatio = getPreviewAspectRatio(uploadedImage);

	useEffect(() => {
		return () => {
			const previousSrc = previousUploadedImageSrcRef.current;
			if (previousSrc) {
				URL.revokeObjectURL(previousSrc);
			}
		};
	}, []);

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
		(next: UploadedImage | undefined) => {
			const previousSrc = previousUploadedImageSrcRef.current;
			if (previousSrc && previousSrc !== next?.src) {
				URL.revokeObjectURL(previousSrc);
			}
			previousUploadedImageSrcRef.current = next?.src;
			setUploadedImage(next);
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
			previewAspectRatio,
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
			animationPlaying,
			animationStyle,
			animationSpeedSeconds,
			animationIntensity,
			animationRandomness,
			characterCycleSpeed: resolvedCharacterCycleSpeed,
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
			bloomThreshold: DEFAULT_BLOOM_THRESHOLD,
			bloomRadius: DEFAULT_BLOOM_RADIUS,
			bloomSoftness: DEFAULT_BLOOM_SOFTNESS,
			colorOverlay,
			colorOverlayColor,
			colorOverlayOpacity,
			colorOverlayBlendMode,
			vignette,
			vignetteIntensity,
			scanLines,
			scanLinesIntensity,
			crtCurvature,
			crtCurvatureIntensity,
			chromatic,
			chromaticOffset,
			characterBloom,
			characterBloomIntensity,
			characterChromatic,
			characterChromaticOffset,
			filmGrain,
			filmGrainIntensity,
			glitch,
			glitchIntensity,
			rgbSplit,
			rgbSplitOffset,
			blur,
			blurRadius,
			pixelate,
			pixelateSize,
			halftone,
			halftoneSize,
			filmDust,
			filmDustDensity,
			speed,
		}),
		[
			activeCharsetCharacters,
			animatedCharacters,
			animationIntensity,
			animationPlaying,
			animationRandomness,
			animationSpeedSeconds,
			animationStyle,
			backgroundBlurRadius,
			backgroundColor,
			backgroundMode,
			backgroundOpacity,
			bgOpacity,
			blendMode,
			blur,
			blurRadius,
			bloomEnabled,
			bloomIntensity,
			brightness,
			resolvedCharacterCycleSpeed,
			characterBloom,
			characterBloomIntensity,
			characterChromatic,
			characterChromaticOffset,
			characterOpacity,
			charset,
			chromatic,
			chromaticOffset,
			colorOverlay,
			colorOverlayBlendMode,
			colorOverlayColor,
			colorOverlayOpacity,
			colorMode,
			colorSourceMode,
			colorSignalMode,
			compositeMode,
			contrast,
			crtCurvature,
			crtCurvatureIntensity,
			charsetCharacters.custom,
			coverage,
			density,
			dotGridOverlay,
			edgeEmphasis,
			filmGrain,
			filmGrainIntensity,
			filmDust,
			filmDustDensity,
			fontWeight,
			glitch,
			glitchIntensity,
			glyphSignalMode,
			halftone,
			halftoneSize,
			hue,
			invert,
			maskInvert,
			maskMode,
			maskSource,
			monoColor,
			opacity,
			presenceSoftness,
			pixelate,
			pixelateSize,
			randomizeCharacters,
			randomSeed,
			rgbSplit,
			rgbSplitOffset,
			saturation,
			scanLines,
			scanLinesIntensity,
			shimmerAmount,
			shimmerSpeed,
			signalBlackPoint,
			signalGamma,
			signalWhitePoint,
			sourceColors,
			sourceMode,
			previewAspectRatio,
			speed,
			toneMapping,
			vignette,
			vignetteIntensity,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="w-full overflow-hidden rounded-lg"
				style={{ aspectRatio: previewAspectRatio, boxShadow: token("elevation.shadow.raised") }}
			>
				<Ascii
					sourceMode={sourceMode}
					sourceColors={sourceColors}
					imageSrc={uploadedImageSrc}
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
					animationPlaying={animationPlaying}
					animationStyle={animationStyle}
					animationIntensity={animationIntensity}
					animationRandomness={animationRandomness}
					characterCycleSpeed={resolvedCharacterCycleSpeed}
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
					bloomThreshold={DEFAULT_BLOOM_THRESHOLD}
					bloomRadius={DEFAULT_BLOOM_RADIUS}
					bloomSoftness={DEFAULT_BLOOM_SOFTNESS}
					colorOverlay={colorOverlay ? colorOverlayOpacity : 0}
					colorOverlayColor={colorOverlayColor}
					colorOverlayBlendMode={colorOverlayBlendMode}
					vignette={vignette ? vignetteIntensity : 0}
					scanLines={scanLines ? scanLinesIntensity : 0}
					crtCurvature={crtCurvature ? crtCurvatureIntensity : 0}
					chromatic={chromatic}
					chromaticOffset={chromaticOffset}
					characterBloom={characterBloom ? characterBloomIntensity : 0}
					characterChromatic={characterChromatic}
					characterChromaticOffset={characterChromaticOffset}
					filmGrain={filmGrain ? filmGrainIntensity : 0}
					glitch={glitch ? glitchIntensity : 0}
					rgbSplit={rgbSplit}
					rgbSplitOffset={rgbSplitOffset}
					blur={blur}
					blurRadius={blurRadius}
					pixelate={pixelate}
					pixelateSize={pixelateSize}
					halftone={halftone}
					halftoneSize={halftoneSize}
					filmDust={filmDust ? filmDustDensity : 0}
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
							<ImageUploadControl image={uploadedImage} onChange={handleImageChange} />
						) : null}
						{sourceMode === "field" ? (
							<ShaderColorListControl
								id="ascii-sourceColors"
								label="Colors"
								value={sourceColors}
								defaultValue={ASCII_DEFAULT_SOURCE_COLORS}
								onChange={setSourceColors}
								allowAddRemove
								maxColors={ASCII_MAX_SOURCE_COLORS}
							/>
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

					<GUI.Section title="Animation">
						<GUI.Toggle
							id="ascii-animatedCharacters"
							label="Animated ASCII"
							checked={animatedCharacters}
							onChange={setAnimatedCharacters}
						/>
						<AnimationPlaybackControl
							playing={animationPlaying}
							onChange={setAnimationPlaying}
						/>
						<GUI.Select
							id="ascii-animationStyle"
							label="Animation Style"
							value={animationStyle}
							options={ANIMATION_STYLE_OPTIONS}
							onChange={(next) => {
								setAnimationStyle(next as AsciiAnimationStyle);
								setAnimatedCharacters(true);
							}}
						/>
						<GUI.Control
							id="ascii-animationSpeedSeconds"
							label="Speed"
							value={animationSpeedSeconds}
							defaultValue={DEFAULT_ANIMATION_SPEED_SECONDS}
							min={0.5}
							max={10}
							step={0.1}
							unit="s"
							onChange={(next) => {
								setAnimationSpeedSeconds(next);
								setAnimatedCharacters(true);
							}}
						/>
						<PercentControl
							id="ascii-animationIntensity"
							label="Intensity"
							value={animationIntensity}
							defaultValue={DEFAULT_ANIMATION_INTENSITY}
							min={0}
							max={1}
							step={0.01}
							onChange={(next) => {
								setAnimationIntensity(next);
								setAnimatedCharacters(true);
							}}
						/>
						<PercentControl
							id="ascii-animationRandomness"
							label="Randomness"
							value={animationRandomness}
							defaultValue={DEFAULT_ANIMATION_RANDOMNESS}
							min={0}
							max={1}
							step={0.01}
							onChange={(next) => {
								setAnimationRandomness(next);
								setAnimatedCharacters(true);
							}}
						/>
						{sourceMode === "field" ? (
							<GUI.Control
								id="ascii-sourceSpeed"
								label="Source Speed"
								value={speed}
								defaultValue={1}
								min={0}
								max={3}
								step={0.05}
								onChange={setSpeed}
							/>
						) : null}
						<GUI.Control
							id="ascii-shimmerAmount"
							label="Shimmer Amount"
							value={shimmerAmount}
							defaultValue={0}
							min={0}
							max={1}
							step={0.01}
							onChange={setShimmerAmount}
						/>
						{shimmerAmount > 0 ? (
							<GUI.Control
								id="ascii-shimmerSpeed"
								label="Shimmer Speed"
								value={shimmerSpeed}
								defaultValue={1}
								min={0}
								max={10}
								step={0.1}
								onChange={setShimmerSpeed}
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

					<GUI.Section title="Post-Processing">
						<GUI.Toggle
							id="ascii-colorOverlay"
							label="Color Overlay"
							checked={colorOverlay}
							onChange={setColorOverlay}
						/>
						{colorOverlay ? (
							<>
								<ShaderColorInput
									id="ascii-colorOverlayColor"
									label="Color"
									value={colorOverlayColor}
									defaultValue="#F5F5F0"
									onChange={setColorOverlayColor}
								/>
								<PercentControl
									id="ascii-colorOverlayOpacity"
									label="Opacity"
									value={colorOverlayOpacity}
									defaultValue={DEFAULT_COLOR_OVERLAY_OPACITY}
									min={0}
									max={1}
									step={0.01}
									onChange={setColorOverlayOpacity}
								/>
								<GUI.Select
									id="ascii-colorOverlayBlendMode"
									label="Blend"
									value={colorOverlayBlendMode}
									options={COLOR_OVERLAY_BLEND_OPTIONS}
									onChange={(next) => setColorOverlayBlendMode(next as AsciiBlendMode)}
								/>
							</>
						) : null}
						<GUI.Toggle
							id="ascii-vignette"
							label="Vignette"
							checked={vignette}
							onChange={setVignette}
						/>
						{vignette ? (
							<PercentControl
								id="ascii-vignetteIntensity"
								label="Intensity"
								value={vignetteIntensity}
								defaultValue={DEFAULT_VIGNETTE_INTENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setVignetteIntensity}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-scanLines"
							label="Scan Lines"
							checked={scanLines}
							onChange={setScanLines}
						/>
						{scanLines ? (
							<PercentControl
								id="ascii-scanLinesIntensity"
								label="Intensity"
								value={scanLinesIntensity}
								defaultValue={DEFAULT_SCAN_LINES_INTENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setScanLinesIntensity}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-crtCurvature"
							label="CRT Curvature"
							checked={crtCurvature}
							onChange={setCrtCurvature}
						/>
						{crtCurvature ? (
							<PercentControl
								id="ascii-crtCurvatureIntensity"
								label="Intensity"
								value={crtCurvatureIntensity}
								defaultValue={DEFAULT_CRT_CURVATURE_INTENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setCrtCurvatureIntensity}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-chromatic"
							label="Chromatic"
							checked={chromatic}
							onChange={setChromatic}
						/>
						{chromatic ? (
							<GUI.Control
								id="ascii-chromaticOffset"
								label="RGB Offset"
								value={chromaticOffset}
								defaultValue={DEFAULT_CHROMATIC_OFFSET}
								min={1}
								max={20}
								step={1}
								onChange={setChromaticOffset}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-bloomEnabled"
							label="Bloom"
							checked={bloomEnabled}
							onChange={setBloomEnabled}
						/>
						{bloomEnabled ? (
							<PercentControl
								id="ascii-bloomIntensity"
								label="Intensity"
								value={bloomIntensity}
								defaultValue={DEFAULT_BLOOM_INTENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setBloomIntensity}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-characterBloom"
							label="Character Bloom"
							checked={characterBloom}
							onChange={setCharacterBloom}
						/>
						{characterBloom ? (
							<PercentControl
								id="ascii-characterBloomIntensity"
								label="Intensity"
								value={characterBloomIntensity}
								defaultValue={DEFAULT_CHARACTER_BLOOM_INTENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setCharacterBloomIntensity}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-characterChromatic"
							label="Character Chromatic"
							checked={characterChromatic}
							onChange={setCharacterChromatic}
						/>
						{characterChromatic ? (
							<GUI.Control
								id="ascii-characterChromaticOffset"
								label="RGB Offset"
								value={characterChromaticOffset}
								defaultValue={DEFAULT_CHARACTER_CHROMATIC_OFFSET}
								min={1}
								max={20}
								step={1}
								onChange={setCharacterChromaticOffset}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-filmGrain"
							label="Film Grain"
							checked={filmGrain}
							onChange={setFilmGrain}
						/>
						{filmGrain ? (
							<PercentControl
								id="ascii-filmGrainIntensity"
								label="Intensity"
								value={filmGrainIntensity}
								defaultValue={DEFAULT_FILM_GRAIN_INTENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setFilmGrainIntensity}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-glitch"
							label="Glitch"
							checked={glitch}
							onChange={setGlitch}
						/>
						{glitch ? (
							<PercentControl
								id="ascii-glitchIntensity"
								label="Intensity"
								value={glitchIntensity}
								defaultValue={DEFAULT_GLITCH_INTENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setGlitchIntensity}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-rgbSplit"
							label="RGB Split"
							checked={rgbSplit}
							onChange={setRgbSplit}
						/>
						{rgbSplit ? (
							<GUI.Control
								id="ascii-rgbSplitOffset"
								label="RGB Offset"
								value={rgbSplitOffset}
								defaultValue={DEFAULT_RGB_SPLIT_OFFSET}
								min={1}
								max={20}
								step={1}
								onChange={setRgbSplitOffset}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-blur"
							label="Blur"
							checked={blur}
							onChange={setBlur}
						/>
						{blur ? (
							<GUI.Control
								id="ascii-blurRadius"
								label="Radius"
								value={blurRadius}
								defaultValue={DEFAULT_BLUR_RADIUS}
								min={1}
								max={20}
								step={1}
								onChange={setBlurRadius}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-pixelate"
							label="Pixelate"
							checked={pixelate}
							onChange={setPixelate}
						/>
						{pixelate ? (
							<GUI.Control
								id="ascii-pixelateSize"
								label="Size"
								value={pixelateSize}
								defaultValue={DEFAULT_PIXELATE_SIZE}
								min={2}
								max={30}
								step={1}
								onChange={setPixelateSize}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-halftone"
							label="Halftone"
							checked={halftone}
							onChange={setHalftone}
						/>
						{halftone ? (
							<GUI.Control
								id="ascii-halftoneSize"
								label="Size"
								value={halftoneSize}
								defaultValue={DEFAULT_HALFTONE_SIZE}
								min={2}
								max={20}
								step={1}
								onChange={setHalftoneSize}
							/>
						) : null}
						<GUI.Toggle
							id="ascii-filmDust"
							label="Film Dust"
							checked={filmDust}
							onChange={setFilmDust}
						/>
						{filmDust ? (
							<PercentControl
								id="ascii-filmDustDensity"
								label="Density"
								value={filmDustDensity}
								defaultValue={DEFAULT_FILM_DUST_DENSITY}
								min={0}
								max={1}
								step={0.01}
								onChange={setFilmDustDensity}
							/>
						) : null}
					</GUI.Section>
				</div>
			</GUI.Panel>
		</div>
	);
}
