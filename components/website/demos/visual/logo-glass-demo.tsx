"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import LogoGlass, { DEFAULT_LOGO_GLASS_IMAGE_SRC } from "./shaders/logo-glass";

type MotionModeOption = "free" | "melt";

const DEFAULT_BACKGROUND = "#000000";
const DEFAULT_COLOR_LOW = "#000000";
const DEFAULT_TINT = "#C9C9C9";
const DEFAULT_HIGHLIGHT = "#FFFFFF";
const DEFAULT_SHADOW = "#333333";
const DEFAULT_SEED = 55;
const DEFAULT_SPEED = 1.15;
const DEFAULT_SCALE = 0.19;
const DEFAULT_DIRECTION = 0;
const DEFAULT_OCTAVES = 3;
const DEFAULT_PERSISTENCE = 0.6;
const DEFAULT_LACUNARITY = 1.4;
const DEFAULT_WARP_DEPTH = 2;
const DEFAULT_WARP = 0.5;
const DEFAULT_IOR = 0.5;
const DEFAULT_DISPERSION = 0;
const DEFAULT_CONTOUR = 0.05;
const DEFAULT_BEVEL = 0;
const DEFAULT_SHAPE_CONTOUR = 0.7;
const DEFAULT_BEND = 0.65;
const DEFAULT_NOISE = 0;
const DEFAULT_LIGHTS = 0.7;
const DEFAULT_DETAILS = 6;
const DEFAULT_ANGLE = 200;
const DEFAULT_AMBIENT = 0;
const DEFAULT_BRIGHTNESS = 0.8;
const DEFAULT_CONTRAST = 2.8;
const DEFAULT_SATURATION = 1;

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
			onChange(URL.createObjectURL(file));
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
						alt="Logo source"
						width={36}
						height={36}
						unoptimized
						className="size-9 shrink-0 rounded border border-border bg-[#04070d] object-contain p-1"
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
						if (file) {
							handleFile(file);
						}
						event.target.value = "";
					}}
				/>
			</div>
		</div>
	);
}

function resolveMotionModeValue(option: MotionModeOption): 0 | 1 {
	return option === "melt" ? 1 : 0;
}

export default function LogoGlassDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(DEFAULT_LOGO_GLASS_IMAGE_SRC);
	const [colorBack, setColorBack] = useState(DEFAULT_BACKGROUND);
	const [colorA, setColorA] = useState(DEFAULT_COLOR_LOW);
	const [colorB, setColorB] = useState(DEFAULT_TINT);
	const [colorHighlight, setColorHighlight] = useState(DEFAULT_HIGHLIGHT);
	const [colorShadow, setColorShadow] = useState(DEFAULT_SHADOW);
	const [seed, setSeed] = useState(DEFAULT_SEED);
	const [speed, setSpeed] = useState(DEFAULT_SPEED);
	const [scale, setScale] = useState(DEFAULT_SCALE);
	const [motionMode, setMotionMode] = useState<MotionModeOption>("free");
	const [direction, setDirection] = useState(DEFAULT_DIRECTION);
	const [octaves, setOctaves] = useState(DEFAULT_OCTAVES);
	const [persistence, setPersistence] = useState(DEFAULT_PERSISTENCE);
	const [lacunarity, setLacunarity] = useState(DEFAULT_LACUNARITY);
	const [warpDepth, setWarpDepth] = useState(DEFAULT_WARP_DEPTH);
	const [warp, setWarp] = useState(DEFAULT_WARP);
	const [ior, setIor] = useState(DEFAULT_IOR);
	const [dispersion, setDispersion] = useState(DEFAULT_DISPERSION);
	const [contour, setContour] = useState(DEFAULT_CONTOUR);
	const [falloff, setFalloff] = useState(DEFAULT_BEVEL);
	const [shapeContour, setShapeContour] = useState(DEFAULT_SHAPE_CONTOUR);
	const [bend, setBend] = useState(DEFAULT_BEND);
	const [noise, setNoise] = useState(DEFAULT_NOISE);
	const [bumpStrength, setBumpStrength] = useState(DEFAULT_LIGHTS);
	const [bumpDist, setBumpDist] = useState(DEFAULT_DETAILS);
	const [lightAngle, setLightAngle] = useState(DEFAULT_ANGLE);
	const [ambient, setAmbient] = useState(DEFAULT_AMBIENT);
	const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
	const [contrast, setContrast] = useState(DEFAULT_CONTRAST);
	const [saturation, setSaturation] = useState(DEFAULT_SATURATION);

	const config = useMemo(
		() => ({
			imageSrc,
			colorBack,
			colorA,
			colorB,
			colorHighlight,
			colorShadow,
			seed,
			speed,
			scale,
			motionMode,
			direction,
			octaves,
			persistence,
			lacunarity,
			warpDepth,
			warp,
			ior,
			dispersion,
			contour,
			falloff,
			shapeContour,
			bend,
			noise,
			bumpStrength,
			bumpDist,
			lightAngle,
			ambient,
			brightness,
			contrast,
			saturation,
		}),
		[
			ambient,
			bend,
			brightness,
			bumpDist,
			bumpStrength,
			colorA,
			colorB,
			colorBack,
			colorHighlight,
			colorShadow,
			contrast,
			contour,
			direction,
			dispersion,
			falloff,
			imageSrc,
			ior,
			lacunarity,
			lightAngle,
			motionMode,
			noise,
			octaves,
			persistence,
			saturation,
			scale,
			seed,
			shapeContour,
			speed,
			warp,
			warpDepth,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="mx-auto aspect-square w-full max-w-[25rem] overflow-hidden bg-black"
			>
				<LogoGlass
					className="h-full w-full"
					imageSrc={imageSrc}
					colorBack={colorBack}
					colorA={colorA}
					colorB={colorB}
					colorHighlight={colorHighlight}
					colorShadow={colorShadow}
					seed={seed}
					speed={speed}
					scale={scale}
					motionMode={resolveMotionModeValue(motionMode)}
					direction={direction}
					octaves={octaves}
					persistence={persistence}
					lacunarity={lacunarity}
					warpDepth={warpDepth}
					warp={warp}
					ior={ior}
					dispersion={dispersion}
					contour={contour}
					falloff={falloff}
					shapeContour={shapeContour}
					bend={bend}
					noise={noise}
					bumpStrength={bumpStrength}
					bumpDist={bumpDist}
					lightAngle={lightAngle}
					ambient={ambient}
					brightness={brightness}
					contrast={contrast}
					saturation={saturation}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
				<ShaderColorInput
					id="lg-logo-background"
					label="Background"
					value={colorBack}
					defaultValue={DEFAULT_BACKGROUND}
					onChange={setColorBack}
				/>
				<ShaderColorInput
					id="lg-logo-low"
					label="Color Low"
					value={colorA}
					defaultValue={DEFAULT_COLOR_LOW}
					onChange={setColorA}
				/>
				<ShaderColorInput
					id="lg-logo-tint"
					label="Tint"
					value={colorB}
					defaultValue={DEFAULT_TINT}
					onChange={setColorB}
				/>
				<ShaderColorInput
					id="lg-logo-highlight"
					label="Highlight"
					value={colorHighlight}
					defaultValue={DEFAULT_HIGHLIGHT}
					onChange={setColorHighlight}
				/>
				<ShaderColorInput
					id="lg-logo-shadow"
					label="Shadow"
					value={colorShadow}
					defaultValue={DEFAULT_SHADOW}
					onChange={setColorShadow}
				/>
				<GUI.Control
					id="lg-logo-seed"
					label="Seed"
					value={seed}
					defaultValue={DEFAULT_SEED}
					min={0}
					max={100}
					step={1}
					onChange={setSeed}
				/>
				<GUI.Control
					id="lg-logo-speed"
					label="Speed"
					value={speed}
					defaultValue={DEFAULT_SPEED}
					min={0}
					max={2}
					step={0.01}
					onChange={setSpeed}
				/>
				<GUI.Control
					id="lg-logo-scale"
					label="Scale"
					value={scale}
					defaultValue={DEFAULT_SCALE}
					min={0.1}
					max={1}
					step={0.01}
					onChange={setScale}
				/>
				<GUI.Select
					id="lg-logo-motion"
					label="Motion"
					value={motionMode}
					options={[
						{ value: "free", label: "Free" },
						{ value: "melt", label: "Melt" },
					]}
					onChange={setMotionMode}
				/>
				<GUI.Control
					id="lg-logo-direction"
					label="Direction"
					description="Directional drift used by Melt motion."
					value={direction}
					defaultValue={DEFAULT_DIRECTION}
					min={0}
					max={360}
					step={1}
					unit="deg"
					onChange={setDirection}
				/>
				<GUI.Control
					id="lg-logo-octaves"
					label="Octaves"
					value={octaves}
					defaultValue={DEFAULT_OCTAVES}
					min={1}
					max={6}
					step={1}
					onChange={setOctaves}
				/>
				<GUI.Control
					id="lg-logo-persistence"
					label="Persistence"
					value={persistence}
					defaultValue={DEFAULT_PERSISTENCE}
					min={0}
					max={1}
					step={0.01}
					onChange={setPersistence}
				/>
				<GUI.Control
					id="lg-logo-lacunarity"
					label="Lacunarity"
					value={lacunarity}
					defaultValue={DEFAULT_LACUNARITY}
					min={1.2}
					max={3}
					step={0.1}
					onChange={setLacunarity}
				/>
				<GUI.Control
					id="lg-logo-warp-depth"
					label="Warp Depth"
					value={warpDepth}
					defaultValue={DEFAULT_WARP_DEPTH}
					min={1}
					max={2}
					step={1}
					onChange={setWarpDepth}
				/>

				<GUI.Section title="Glass">
					<GUI.Control
						id="lg-logo-warp"
						label="Lens Warp"
						value={warp}
						defaultValue={DEFAULT_WARP}
						min={0}
						max={1}
						step={0.01}
						onChange={setWarp}
					/>
					<GUI.Control
						id="lg-logo-ior"
						label="IOR"
						value={ior}
						defaultValue={DEFAULT_IOR}
						min={0}
						max={1}
						step={0.01}
						onChange={setIor}
					/>
					<GUI.Control
						id="lg-logo-dispersion"
						label="Dispersion"
						value={dispersion}
						defaultValue={DEFAULT_DISPERSION}
						min={0}
						max={2}
						step={0.01}
						onChange={setDispersion}
					/>
					<GUI.Control
						id="lg-logo-contour"
						label="Contour"
						value={contour}
						defaultValue={DEFAULT_CONTOUR}
						min={0}
						max={1}
						step={0.01}
						onChange={setContour}
					/>
					<GUI.Control
						id="lg-logo-bevel"
						label="Bevel"
						value={falloff}
						defaultValue={DEFAULT_BEVEL}
						min={0}
						max={20}
						step={0.01}
						onChange={setFalloff}
					/>
					<GUI.Control
						id="lg-logo-shape-contour"
						label="Shape Contour"
						value={shapeContour}
						defaultValue={DEFAULT_SHAPE_CONTOUR}
						min={0}
						max={1}
						step={0.01}
						onChange={setShapeContour}
					/>
					<GUI.Control
						id="lg-logo-bend"
						label="Bend"
						value={bend}
						defaultValue={DEFAULT_BEND}
						min={0}
						max={1}
						step={0.01}
						onChange={setBend}
					/>
					<GUI.Control
						id="lg-logo-noise"
						label="Noise"
						value={noise}
						defaultValue={DEFAULT_NOISE}
						min={0}
						max={0.5}
						step={0.01}
						onChange={setNoise}
					/>
				</GUI.Section>

				<GUI.Section title="Lighting">
					<GUI.Control
						id="lg-logo-lights"
						label="Lights"
						value={bumpStrength}
						defaultValue={DEFAULT_LIGHTS}
						min={0}
						max={1}
						step={0.01}
						onChange={setBumpStrength}
					/>
					<GUI.Control
						id="lg-logo-details"
						label="Details"
						value={bumpDist}
						defaultValue={DEFAULT_DETAILS}
						min={0.5}
						max={20}
						step={0.1}
						onChange={setBumpDist}
					/>
					<GUI.Control
						id="lg-logo-angle"
						label="Angle"
						value={lightAngle}
						defaultValue={DEFAULT_ANGLE}
						min={0}
						max={360}
						step={1}
						unit="deg"
						onChange={setLightAngle}
					/>
				</GUI.Section>

				<GUI.Section title="Filters">
					<GUI.Control
						id="lg-logo-ambient"
						label="Ambient"
						value={ambient}
						defaultValue={DEFAULT_AMBIENT}
						min={0}
						max={0.2}
						step={0.01}
						onChange={setAmbient}
					/>
					<GUI.Control
						id="lg-logo-brightness"
						label="Brightness"
						value={brightness}
						defaultValue={DEFAULT_BRIGHTNESS}
						min={0.1}
						max={2}
						step={0.01}
						onChange={setBrightness}
					/>
					<GUI.Control
						id="lg-logo-contrast"
						label="Contrast"
						value={contrast}
						defaultValue={DEFAULT_CONTRAST}
						min={0.5}
						max={4}
						step={0.01}
						onChange={setContrast}
					/>
					<GUI.Control
						id="lg-logo-saturation"
						label="Saturation"
						value={saturation}
						defaultValue={DEFAULT_SATURATION}
						min={0}
						max={4}
						step={0.01}
						onChange={setSaturation}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
