"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import ShadowOverlay, {
	SHADOW_OVERLAY_PRESET_IDS,
	type ShadowOverlaySizing,
	type ShadowOverlayType,
} from "./shadow-overlay";

const DEFAULT_TYPE: ShadowOverlayType = "preset";
const DEFAULT_PRESET_INDEX = 1;
const DEFAULT_SIZING: ShadowOverlaySizing = "fill";
const DEFAULT_COLOR = "#424240";
const DEFAULT_ANIMATION_ENABLED = true;
const DEFAULT_ANIMATION_SCALE = 50;
const DEFAULT_ANIMATION_SPEED = 30;
const DEFAULT_NOISE_ENABLED = false;
const DEFAULT_NOISE_OPACITY = 0.5;
const DEFAULT_NOISE_SCALE = 1;

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
				<Label className="text-xs font-medium text-text">Custom mask</Label>
				<span className="text-[11px] text-text-subtlest">
					Transparent PNG or SVG works best.
				</span>
			</div>
			<div className="flex items-center gap-2">
				{imageSrc ? (
					<Image
						src={imageSrc}
						alt="Custom shadow mask"
						width={36}
						height={36}
						unoptimized
						className="size-9 shrink-0 rounded border border-border bg-bg-neutral object-cover"
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

function clampColorByte(value: number): number {
	return Math.max(0, Math.min(255, Math.round(value)));
}

function toHexChannel(value: number): string {
	return clampColorByte(value).toString(16).padStart(2, "0");
}

function resolvePickerColor(value: string): string {
	const normalized = value.trim();
	if (/^#[0-9a-f]{6}$/i.test(normalized)) {
		return normalized;
	}

	const rgbMatch = normalized.match(
		/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)/i,
	);
	if (rgbMatch) {
		return `#${toHexChannel(Number(rgbMatch[1]))}${toHexChannel(Number(rgbMatch[2]))}${toHexChannel(Number(rgbMatch[3]))}`;
	}

	return "#000000";
}

function CssColorInput({
	id,
	label,
	value,
	onChange,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (next: string) => void;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={`${id}-text`} className="text-xs font-medium text-text">
				{label}
			</Label>
			<div className="flex items-center gap-2">
				<input
					id={`${id}-picker`}
					type="color"
					aria-label={`Choose ${label.toLowerCase()}`}
					value={resolvePickerColor(value)}
					onInput={(event) => onChange(event.currentTarget.value)}
					onChange={(event) => onChange(event.currentTarget.value)}
					className="size-7 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
				/>
				<Input
					id={`${id}-text`}
					type="text"
					value={value}
					onChange={(event) => onChange(event.currentTarget.value)}
					isCompact
					isMonospaced
					className="h-7 flex-1 text-xs"
				/>
			</div>
		</div>
	);
}

export default function ShadowOverlayDemo() {
	const [type, setType] = useState<ShadowOverlayType>(DEFAULT_TYPE);
	const [presetIndex, setPresetIndex] = useState(DEFAULT_PRESET_INDEX);
	const [customImageSrc, setCustomImageSrc] = useState<string | undefined>(undefined);
	const [sizing, setSizing] = useState<ShadowOverlaySizing>(DEFAULT_SIZING);
	const [color, setColor] = useState(DEFAULT_COLOR);
	const [animationEnabled, setAnimationEnabled] = useState(DEFAULT_ANIMATION_ENABLED);
	const [animationScale, setAnimationScale] = useState(DEFAULT_ANIMATION_SCALE);
	const [animationSpeed, setAnimationSpeed] = useState(DEFAULT_ANIMATION_SPEED);
	const [noiseEnabled, setNoiseEnabled] = useState(DEFAULT_NOISE_ENABLED);
	const [noiseOpacity, setNoiseOpacity] = useState(DEFAULT_NOISE_OPACITY);
	const [noiseScale, setNoiseScale] = useState(DEFAULT_NOISE_SCALE);

	const config = useMemo(
		() => ({
			type,
			presetIndex,
			sizing,
			color,
			animation: {
				enabled: animationEnabled,
				scale: animationScale,
				speed: animationSpeed,
			},
			noise: {
				enabled: noiseEnabled,
				opacity: noiseOpacity,
				scale: noiseScale,
			},
		}),
		[
			animationEnabled,
			animationScale,
			animationSpeed,
			color,
			noiseEnabled,
			noiseOpacity,
			noiseScale,
			presetIndex,
			sizing,
			type,
		],
	);

	return (
			<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
				<div
					className="relative overflow-hidden rounded-lg border border-border bg-surface"
					style={{
						boxShadow: token("elevation.shadow.raised"),
					}}
				>
					<div
						className="relative min-h-[28rem] overflow-hidden rounded-lg"
						style={{
							height: "min(72vh, 560px)",
							backgroundColor: "#ffffff",
					}}
				>
					<ShadowOverlay
						className="pointer-events-none absolute inset-0"
						type={type}
						presetIndex={presetIndex}
						customImageSrc={customImageSrc}
						customImageAlt="Custom shadow overlay"
						sizing={sizing}
						color={color}
						animation={{
							enabled: animationEnabled,
							scale: animationScale,
							speed: animationSpeed,
						}}
						noise={{
							enabled: noiseEnabled,
							opacity: noiseOpacity,
							scale: noiseScale,
						}}
					/>
				</div>
			</div>

			<GUI.Panel title="Overlay controls" values={config}>
				<div className="space-y-4">
					<GUI.Select
						id="shadow-overlay-type"
						label="Source"
						value={type}
						options={[
							{ value: "preset", label: "Preset" },
							{ value: "custom", label: "Custom" },
						]}
						onChange={setType}
					/>
					{type === "preset" ? (
						<GUI.Control
							id="shadow-overlay-preset"
							label="Preset"
							value={presetIndex}
							defaultValue={DEFAULT_PRESET_INDEX}
							min={1}
							max={SHADOW_OVERLAY_PRESET_IDS.length}
							step={1}
							onChange={setPresetIndex}
						/>
					) : (
						<ImageUploadControl
							imageSrc={customImageSrc}
							onChange={setCustomImageSrc}
						/>
					)}
					<GUI.Select
						id="shadow-overlay-sizing"
						label="Sizing"
						value={sizing}
						options={[
							{ value: "fill", label: "Fill" },
							{ value: "stretch", label: "Stretch" },
						]}
						onChange={setSizing}
					/>
					<CssColorInput
						id="shadow-overlay-color"
						label="Color"
						value={color}
						onChange={setColor}
					/>
					<GUI.Section title="Animation">
						<GUI.Toggle
							id="shadow-overlay-animation-enabled"
							label="Enabled"
							checked={animationEnabled}
							onChange={setAnimationEnabled}
						/>
						<GUI.Control
							id="shadow-overlay-animation-scale"
							label="Scale"
							value={animationScale}
							defaultValue={DEFAULT_ANIMATION_SCALE}
							min={1}
							max={100}
							step={1}
							onChange={setAnimationScale}
						/>
						<GUI.Control
							id="shadow-overlay-animation-speed"
							label="Speed"
							value={animationSpeed}
							defaultValue={DEFAULT_ANIMATION_SPEED}
							min={1}
							max={100}
							step={1}
							onChange={setAnimationSpeed}
						/>
					</GUI.Section>
					<GUI.Section title="Noise">
						<GUI.Toggle
							id="shadow-overlay-noise-enabled"
							label="Enabled"
							checked={noiseEnabled}
							onChange={setNoiseEnabled}
						/>
						<GUI.Control
							id="shadow-overlay-noise-opacity"
							label="Opacity"
							value={noiseOpacity}
							defaultValue={DEFAULT_NOISE_OPACITY}
							min={0}
							max={1}
							step={0.01}
							onChange={setNoiseOpacity}
						/>
						<GUI.Control
							id="shadow-overlay-noise-scale"
							label="Scale"
							value={noiseScale}
							defaultValue={DEFAULT_NOISE_SCALE}
							min={0.2}
							max={2}
							step={0.1}
							onChange={setNoiseScale}
						/>
					</GUI.Section>
				</div>
			</GUI.Panel>
		</div>
	);
}
