"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import LogoSpectrum, {
	LOGO_SPECTRUM_DEFAULT_BACKGROUND,
	LOGO_SPECTRUM_DEFAULT_BASE_COLOR,
} from "./shaders/logo-spectrum";

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
					Uses the Framer Path.svg asset when empty.
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

const DEMO_DEFAULTS = {
	colorBack: LOGO_SPECTRUM_DEFAULT_BACKGROUND,
	baseColor: LOGO_SPECTRUM_DEFAULT_BASE_COLOR,
	speed: 0.3,
	offset: 0.21,
	angle: 225,
	sweepSpeed: 0,
	glow: 0.7,
	bend: 0.34,
	edge: 1,
	contour: 1,
	density: 0.08,
	viscosity: 0.5,
	deflection: 3,
	distort: false,
	noiseAmount: 0.5,
	distortSpeed: 1,
	noiseScale: 1.5,
	dispersion: 0,
	lineFade: 0,
	grain: 0,
	ambient: 0,
	saturation: 1.2,
	exposure: 1.4,
} as const;

export default function LogoSpectrumDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [colorBack, setColorBack] = useState<string>(DEMO_DEFAULTS.colorBack);
	const [baseColor, setBaseColor] = useState<string>(DEMO_DEFAULTS.baseColor);
	const [speed, setSpeed] = useState<number>(DEMO_DEFAULTS.speed);
	const [offset, setOffset] = useState<number>(DEMO_DEFAULTS.offset);
	const [angle, setAngle] = useState<number>(DEMO_DEFAULTS.angle);
	const [sweepSpeed, setSweepSpeed] = useState<number>(DEMO_DEFAULTS.sweepSpeed);
	const [glow, setGlow] = useState<number>(DEMO_DEFAULTS.glow);
	const [bend, setBend] = useState<number>(DEMO_DEFAULTS.bend);
	const [edge, setEdge] = useState<number>(DEMO_DEFAULTS.edge);
	const [contour, setContour] = useState<number>(DEMO_DEFAULTS.contour);
	const [density, setDensity] = useState<number>(DEMO_DEFAULTS.density);
	const [viscosity, setViscosity] = useState<number>(DEMO_DEFAULTS.viscosity);
	const [deflection, setDeflection] = useState<number>(DEMO_DEFAULTS.deflection);
	const [distort, setDistort] = useState<boolean>(DEMO_DEFAULTS.distort);
	const [noiseAmount, setNoiseAmount] = useState<number>(DEMO_DEFAULTS.noiseAmount);
	const [distortSpeed, setDistortSpeed] = useState<number>(DEMO_DEFAULTS.distortSpeed);
	const [noiseScale, setNoiseScale] = useState<number>(DEMO_DEFAULTS.noiseScale);
	const [dispersion, setDispersion] = useState<number>(DEMO_DEFAULTS.dispersion);
	const [lineFade, setLineFade] = useState<number>(DEMO_DEFAULTS.lineFade);
	const [grain, setGrain] = useState<number>(DEMO_DEFAULTS.grain);
	const [ambient, setAmbient] = useState<number>(DEMO_DEFAULTS.ambient);
	const [saturation, setSaturation] = useState<number>(DEMO_DEFAULTS.saturation);
	const [exposure, setExposure] = useState<number>(DEMO_DEFAULTS.exposure);

	const config = useMemo(
		() => ({
			colorBack,
			baseColor,
			speed,
			offset,
			angle,
			sweepSpeed,
			glow,
			bend,
			edge,
			contour,
			density,
			viscosity,
			deflection,
			distort,
			noiseAmount,
			distortSpeed,
			noiseScale,
			dispersion,
			lineFade,
			grain,
			ambient,
			saturation,
			exposure,
		}),
		[
			ambient,
			angle,
			baseColor,
			bend,
			colorBack,
			contour,
			deflection,
			density,
			dispersion,
			distort,
			distortSpeed,
			edge,
			exposure,
			glow,
			grain,
			lineFade,
			noiseAmount,
			noiseScale,
			offset,
			saturation,
			speed,
			sweepSpeed,
			viscosity,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div className="mx-auto aspect-square w-full max-w-[25rem] overflow-hidden bg-black">
				<LogoSpectrum
					imageSrc={imageSrc}
					colorBack={colorBack}
					baseColor={baseColor}
					speed={speed}
					offset={offset}
					angle={angle}
					sweepSpeed={sweepSpeed}
					glow={glow}
					bend={bend}
					edge={edge}
					contour={contour}
					density={density}
					viscosity={viscosity}
					deflection={deflection}
					distort={distort}
					noiseAmount={noiseAmount}
					distortSpeed={distortSpeed}
					noiseScale={noiseScale}
					dispersion={dispersion}
					lineFade={lineFade}
					grain={grain}
					ambient={ambient}
					saturation={saturation}
					exposure={exposure}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
				<ShaderColorInput
					id="logo-spectrum-background"
					label="Background"
					value={colorBack}
					defaultValue={DEMO_DEFAULTS.colorBack}
					onChange={setColorBack}
				/>
				<ShaderColorInput
					id="logo-spectrum-surface"
					label="Surface"
					value={baseColor}
					defaultValue={DEMO_DEFAULTS.baseColor}
					onChange={setBaseColor}
				/>
				<GUI.Control
					id="logo-spectrum-speed"
					label="Speed"
					value={speed}
					defaultValue={DEMO_DEFAULTS.speed}
					min={0}
					max={2}
					step={0.1}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="logo-spectrum-offset"
					label="Offset"
					value={offset}
					defaultValue={DEMO_DEFAULTS.offset}
					min={0}
					max={1}
					step={0.01}
					onChange={setOffset}
				/>
				<GUI.Control
					id="logo-spectrum-angle"
					label="Angle"
					value={angle}
					defaultValue={DEMO_DEFAULTS.angle}
					min={0}
					max={360}
					step={1}
					unit="deg"
					onChange={setAngle}
				/>
				<GUI.Control
					id="logo-spectrum-sweep"
					label="Sweep"
					value={sweepSpeed}
					defaultValue={DEMO_DEFAULTS.sweepSpeed}
					min={-1}
					max={1}
					step={0.1}
					onChange={setSweepSpeed}
				/>
				<GUI.Control
					id="logo-spectrum-glow"
					label="Glow"
					value={glow}
					defaultValue={DEMO_DEFAULTS.glow}
					min={0}
					max={2}
					step={0.01}
					onChange={setGlow}
				/>
				<GUI.Control
					id="logo-spectrum-density"
					label="Density"
					value={density}
					defaultValue={DEMO_DEFAULTS.density}
					min={0.01}
					max={0.2}
					step={0.01}
					onChange={setDensity}
				/>
				<GUI.Control
					id="logo-spectrum-viscosity"
					label="Viscosity"
					value={viscosity}
					defaultValue={DEMO_DEFAULTS.viscosity}
					min={0}
					max={2}
					step={0.01}
					onChange={setViscosity}
				/>
				<GUI.Control
					id="logo-spectrum-deflection"
					label="Deflection"
					value={deflection}
					defaultValue={DEMO_DEFAULTS.deflection}
					min={0}
					max={3}
					step={0.05}
					onChange={setDeflection}
				/>

				<GUI.Section title="Shape">
					<GUI.Control
						id="logo-spectrum-bevel"
						label="Bevel"
						value={bend}
						defaultValue={DEMO_DEFAULTS.bend}
						min={0}
						max={1}
						step={0.01}
						onChange={setBend}
					/>
					<GUI.Control
						id="logo-spectrum-edge"
						label="Edge"
						value={edge}
						defaultValue={DEMO_DEFAULTS.edge}
						min={0}
						max={1}
						step={0.01}
						onChange={setEdge}
					/>
					<GUI.Control
						id="logo-spectrum-contour"
						label="Contour"
						value={contour}
						defaultValue={DEMO_DEFAULTS.contour}
						min={0}
						max={3}
						step={0.01}
						onChange={setContour}
					/>
				</GUI.Section>

				<GUI.Section title="Distort">
					<GUI.Toggle
						id="logo-spectrum-distort"
						label="Enable distort"
						checked={distort}
						onChange={setDistort}
					/>
					<GUI.Control
						id="logo-spectrum-distort-amount"
						label="Amount"
						value={noiseAmount}
						defaultValue={DEMO_DEFAULTS.noiseAmount}
						min={0}
						max={4}
						step={0.1}
						onChange={setNoiseAmount}
					/>
					<GUI.Control
						id="logo-spectrum-distort-speed"
						label="Speed"
						value={distortSpeed}
						defaultValue={DEMO_DEFAULTS.distortSpeed}
						min={0}
						max={2}
						step={0.1}
						onChange={setDistortSpeed}
					/>
					<GUI.Control
						id="logo-spectrum-distort-scale"
						label="Scale"
						value={noiseScale}
						defaultValue={DEMO_DEFAULTS.noiseScale}
						min={0.1}
						max={8}
						step={0.1}
						onChange={setNoiseScale}
					/>
					<GUI.Control
						id="logo-spectrum-dispersion"
						label="Ephemeral"
						value={dispersion}
						defaultValue={DEMO_DEFAULTS.dispersion}
						min={0}
						max={1}
						step={0.01}
						onChange={setDispersion}
					/>
				</GUI.Section>

				<GUI.Section title="Filters">
					<GUI.Control
						id="logo-spectrum-line-fade"
						label="Line fade"
						value={lineFade}
						defaultValue={DEMO_DEFAULTS.lineFade}
						min={0}
						max={1}
						step={0.01}
						onChange={setLineFade}
					/>
					<GUI.Control
						id="logo-spectrum-grain"
						label="Grain"
						value={grain}
						defaultValue={DEMO_DEFAULTS.grain}
						min={0}
						max={1}
						step={0.01}
						onChange={setGrain}
					/>
					<GUI.Control
						id="logo-spectrum-ambient"
						label="Ambient"
						value={ambient}
						defaultValue={DEMO_DEFAULTS.ambient}
						min={0}
						max={0.2}
						step={0.01}
						onChange={setAmbient}
					/>
					<GUI.Control
						id="logo-spectrum-saturation"
						label="Saturation"
						value={saturation}
						defaultValue={DEMO_DEFAULTS.saturation}
						min={0}
						max={3}
						step={0.01}
						onChange={setSaturation}
					/>
					<GUI.Control
						id="logo-spectrum-exposure"
						label="Exposure"
						value={exposure}
						defaultValue={DEMO_DEFAULTS.exposure}
						min={0.2}
						max={4}
						step={0.05}
						onChange={setExposure}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
