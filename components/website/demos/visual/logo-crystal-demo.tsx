"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import LogoCrystal, { LOGO_CRYSTAL_DEFAULT_BACKGROUND } from "./shaders/logo-crystal";

function ImageUploadControl({
	label,
	hint,
	imageSrc,
	onChange,
}: {
	label: string;
	hint: string;
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
				<Label className="text-xs font-medium text-text">{label}</Label>
				<span className="text-[11px] text-text-subtlest">{hint}</span>
			</div>
			<div className="flex items-center gap-2">
				{imageSrc ? (
					<Image
						src={imageSrc}
						alt={label}
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

const DEMO_DEFAULTS = {
	colorBack: LOGO_CRYSTAL_DEFAULT_BACKGROUND,
	bgScale: 1.2,
	bgOffsetX: -0.2,
	bgOffsetY: 1,
	bgAngle: 0,
	bgWarp: 16,
	noiseSeed: 0,
	bgSpeed: 2,
	noiseScale: 0.5,
	bgSweep: 1,
	clipBackground: true,
	falloff: 3,
	contour: 0.5,
	strength: 0.3,
	dispersion: 0,
	convex: false,
	rimStrength: 2,
	borderStrength: 1,
	brightness: 1,
	contrast: 1,
	saturation: 1,
} as const;

export default function LogoCrystalDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [bgTextureSrc, setBgTextureSrc] = useState<string | undefined>(undefined);
	const [colorBack, setColorBack] = useState<string>(DEMO_DEFAULTS.colorBack);
	const [bgScale, setBgScale] = useState<number>(DEMO_DEFAULTS.bgScale);
	const [bgOffsetX, setBgOffsetX] = useState<number>(DEMO_DEFAULTS.bgOffsetX);
	const [bgOffsetY, setBgOffsetY] = useState<number>(DEMO_DEFAULTS.bgOffsetY);
	const [bgAngle, setBgAngle] = useState<number>(DEMO_DEFAULTS.bgAngle);
	const [bgWarp, setBgWarp] = useState<number>(DEMO_DEFAULTS.bgWarp);
	const [noiseSeed, setNoiseSeed] = useState<number>(DEMO_DEFAULTS.noiseSeed);
	const [bgSpeed, setBgSpeed] = useState<number>(DEMO_DEFAULTS.bgSpeed);
	const [noiseScale, setNoiseScale] = useState<number>(DEMO_DEFAULTS.noiseScale);
	const [bgSweep, setBgSweep] = useState<number>(DEMO_DEFAULTS.bgSweep);
	const [clipBackground, setClipBackground] = useState<boolean>(
		DEMO_DEFAULTS.clipBackground,
	);
	const [falloff, setFalloff] = useState<number>(DEMO_DEFAULTS.falloff);
	const [contour, setContour] = useState<number>(DEMO_DEFAULTS.contour);
	const [strength, setStrength] = useState<number>(DEMO_DEFAULTS.strength);
	const [dispersion, setDispersion] = useState<number>(DEMO_DEFAULTS.dispersion);
	const [convex, setConvex] = useState<boolean>(DEMO_DEFAULTS.convex);
	const [rimStrength, setRimStrength] = useState<number>(DEMO_DEFAULTS.rimStrength);
	const [borderStrength, setBorderStrength] = useState<number>(
		DEMO_DEFAULTS.borderStrength,
	);
	const [brightness, setBrightness] = useState<number>(DEMO_DEFAULTS.brightness);
	const [contrast, setContrast] = useState<number>(DEMO_DEFAULTS.contrast);
	const [saturation, setSaturation] = useState<number>(DEMO_DEFAULTS.saturation);

	const config = useMemo(
		() => ({
			colorBack,
			bgScale,
			bgOffsetX,
			bgOffsetY,
			bgAngle,
			bgWarp,
			noiseSeed,
			bgSpeed,
			noiseScale,
			bgSweep,
			clipBackground,
			falloff,
			contour,
			strength,
			dispersion,
			convex,
			rimStrength,
			borderStrength,
			brightness,
			contrast,
			saturation,
		}),
		[
			bgAngle,
			bgOffsetX,
			bgOffsetY,
			bgScale,
			bgSpeed,
			bgSweep,
			bgWarp,
			borderStrength,
			brightness,
			clipBackground,
			colorBack,
			contour,
			contrast,
			convex,
			dispersion,
			falloff,
			noiseScale,
			noiseSeed,
			rimStrength,
			saturation,
			strength,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div className="mx-auto aspect-square w-full max-w-[25rem] overflow-hidden bg-black">
				<LogoCrystal
					imageSrc={imageSrc}
					bgTextureSrc={bgTextureSrc}
					colorBack={colorBack}
					bgScale={bgScale}
					bgOffsetX={bgOffsetX}
					bgOffsetY={bgOffsetY}
					bgAngle={bgAngle}
					bgWarp={bgWarp}
					noiseSeed={noiseSeed}
					bgSpeed={bgSpeed}
					noiseScale={noiseScale}
					bgSweep={bgSweep}
					clipBackground={clipBackground}
					falloff={falloff}
					contour={contour}
					strength={strength}
					dispersion={dispersion}
					convex={convex}
					rimStrength={rimStrength}
					borderStrength={borderStrength}
					brightness={brightness}
					contrast={contrast}
					saturation={saturation}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl
					label="Logo"
					hint="Uses the Framer Path.svg asset when empty."
					imageSrc={imageSrc}
					onChange={setImageSrc}
				/>
				<ImageUploadControl
					label="Image"
					hint="Background texture refracted through the logo."
					imageSrc={bgTextureSrc}
					onChange={setBgTextureSrc}
				/>
				<ShaderColorInput
					id="logo-crystal-background"
					label="Background"
					value={colorBack}
					defaultValue={DEMO_DEFAULTS.colorBack}
					onChange={setColorBack}
				/>
				<GUI.Toggle
					id="logo-crystal-clip-background"
					label="Clip background"
					checked={clipBackground}
					onChange={setClipBackground}
				/>
				<GUI.Control
					id="logo-crystal-bg-scale"
					label="Scale"
					value={bgScale}
					defaultValue={DEMO_DEFAULTS.bgScale}
					min={1}
					max={5}
					step={0.01}
					onChange={setBgScale}
				/>
				<GUI.Control
					id="logo-crystal-bg-offset-x"
					label="Offset X"
					value={bgOffsetX}
					defaultValue={DEMO_DEFAULTS.bgOffsetX}
					min={-1}
					max={1}
					step={0.01}
					onChange={setBgOffsetX}
				/>
				<GUI.Control
					id="logo-crystal-bg-offset-y"
					label="Offset Y"
					value={bgOffsetY}
					defaultValue={DEMO_DEFAULTS.bgOffsetY}
					min={-1}
					max={1}
					step={0.01}
					onChange={setBgOffsetY}
				/>
				<GUI.Control
					id="logo-crystal-bg-angle"
					label="Angle"
					value={bgAngle}
					defaultValue={DEMO_DEFAULTS.bgAngle}
					min={0}
					max={360}
					step={1}
					unit="deg"
					onChange={setBgAngle}
				/>

				<GUI.Section title="Distort">
					<GUI.Control
						id="logo-crystal-bg-warp"
						label="Amount"
						value={bgWarp}
						defaultValue={DEMO_DEFAULTS.bgWarp}
						min={0}
						max={20}
						step={0.5}
						onChange={setBgWarp}
					/>
					<GUI.Control
						id="logo-crystal-noise-seed"
						label="Seed"
						value={noiseSeed}
						defaultValue={DEMO_DEFAULTS.noiseSeed}
						min={0}
						max={100}
						step={1}
						onChange={setNoiseSeed}
					/>
					<GUI.Control
						id="logo-crystal-bg-speed"
						label="Speed"
						value={bgSpeed}
						defaultValue={DEMO_DEFAULTS.bgSpeed}
						min={0}
						max={3}
						step={0.1}
						onChange={setBgSpeed}
					/>
					<GUI.Control
						id="logo-crystal-noise-scale"
						label="Scale"
						value={noiseScale}
						defaultValue={DEMO_DEFAULTS.noiseScale}
						min={0.5}
						max={12}
						step={0.1}
						onChange={setNoiseScale}
					/>
					<GUI.Control
						id="logo-crystal-bg-sweep"
						label="Sweep"
						value={bgSweep}
						defaultValue={DEMO_DEFAULTS.bgSweep}
						min={-1}
						max={1}
						step={0.1}
						onChange={setBgSweep}
					/>
				</GUI.Section>

				<GUI.Section title="Glass">
					<GUI.Control
						id="logo-crystal-falloff"
						label="Bevel"
						value={falloff}
						defaultValue={DEMO_DEFAULTS.falloff}
						min={0}
						max={20}
						step={0.1}
						onChange={setFalloff}
					/>
					<GUI.Control
						id="logo-crystal-contour"
						label="Contour"
						value={contour}
						defaultValue={DEMO_DEFAULTS.contour}
						min={0}
						max={1}
						step={0.01}
						onChange={setContour}
					/>
					<GUI.Control
						id="logo-crystal-strength"
						label="Refraction"
						value={strength}
						defaultValue={DEMO_DEFAULTS.strength}
						min={0}
						max={8}
						step={0.01}
						onChange={setStrength}
					/>
					<GUI.Control
						id="logo-crystal-dispersion"
						label="Dispersion"
						value={dispersion}
						defaultValue={DEMO_DEFAULTS.dispersion}
						min={0}
						max={1}
						step={0.01}
						onChange={setDispersion}
					/>
					<GUI.Toggle
						id="logo-crystal-convex"
						label="Convex"
						checked={convex}
						onChange={setConvex}
					/>
					<GUI.Control
						id="logo-crystal-rim"
						label="Rim"
						value={rimStrength}
						defaultValue={DEMO_DEFAULTS.rimStrength}
						min={0}
						max={4}
						step={0.01}
						onChange={setRimStrength}
					/>
					<GUI.Control
						id="logo-crystal-border"
						label="Outline"
						value={borderStrength}
						defaultValue={DEMO_DEFAULTS.borderStrength}
						min={0}
						max={1}
						step={0.01}
						onChange={setBorderStrength}
					/>
				</GUI.Section>

				<GUI.Section title="Filters">
					<GUI.Control
						id="logo-crystal-brightness"
						label="Brightness"
						value={brightness}
						defaultValue={DEMO_DEFAULTS.brightness}
						min={0.5}
						max={2}
						step={0.01}
						onChange={setBrightness}
					/>
					<GUI.Control
						id="logo-crystal-contrast"
						label="Contrast"
						value={contrast}
						defaultValue={DEMO_DEFAULTS.contrast}
						min={0}
						max={3}
						step={0.01}
						onChange={setContrast}
					/>
					<GUI.Control
						id="logo-crystal-saturation"
						label="Saturation"
						value={saturation}
						defaultValue={DEMO_DEFAULTS.saturation}
						min={0}
						max={3}
						step={0.01}
						onChange={setSaturation}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
