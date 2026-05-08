"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import { GUI, useGUIValueKeys } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";

import Scribbles, {
	SCRIBBLES_DEFAULT_AMOUNT,
	SCRIBBLES_DEFAULT_BASE_FREQUENCY,
	SCRIBBLES_DEFAULT_INTERVAL_MS,
	SCRIBBLES_DEFAULT_NUM_OCTAVES,
	SCRIBBLES_DEFAULT_SCALE,
	SCRIBBLES_DEFAULT_SEED,
} from "./scribbles";
import {
	DEFAULT_SCRIBBLES_SVG_SOURCE,
	isScribblesSvgFile,
	type ScribblesSvgSource,
} from "./scribbles-source";

function formatFrequency(value: number): string {
	return value.toFixed(3);
}

interface ScribblesSourceImageProps {
	source: ScribblesSvgSource;
}

function ScribblesSourceImage({ source }: Readonly<ScribblesSourceImageProps>) {
	return (
		<Image
			src={source.src}
			alt="Scribbles source"
			width={320}
			height={320}
			unoptimized
			className="h-auto w-full max-w-[18rem] object-contain"
		/>
	);
}

interface ScribblesSvgUploadControlProps {
	source: ScribblesSvgSource;
	onUpload: (file: File) => void;
	onReset: () => void;
}

function ScribblesSvgUploadControl({
	source,
	onUpload,
	onReset,
}: Readonly<ScribblesSvgUploadControlProps>) {
	useGUIValueKeys("source");
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium text-text">SVG</Label>
			<div className="flex items-center gap-2">
				<div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-bg-neutral">
					<Image
						src={source.src}
						alt=""
						width={36}
						height={36}
						unoptimized
						className="size-9 object-contain"
					/>
				</div>
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="h-7 rounded border border-border bg-transparent px-3 text-xs text-text transition-colors hover:bg-bg-neutral"
				>
					{source.uploaded ? "Change" : "Upload SVG"}
				</button>
				{source.uploaded ? (
					<button
						type="button"
						aria-label="Reset to default SVG"
						onClick={onReset}
						className="flex size-7 shrink-0 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon"
					>
						<CrossIcon label="Reset to default SVG" size="small" />
					</button>
				) : null}
				<input
					ref={inputRef}
					type="file"
					accept="image/svg+xml,.svg"
					className="hidden"
					onChange={(event) => {
						const file = event.currentTarget.files?.[0];
						if (file) onUpload(file);
						event.currentTarget.value = "";
					}}
				/>
			</div>
		</div>
	);
}

interface ScribblesPreviewTileProps {
	label: string;
	value: string;
	children: React.ReactNode;
	className?: string;
}

function ScribblesPreviewTile({ label, value, children, className }: ScribblesPreviewTileProps) {
	return (
		<div
			className={cn(
				"flex min-h-72 flex-col rounded-lg border border-border bg-surface-raised p-4",
				className,
			)}
			style={{ boxShadow: token("elevation.shadow.raised") }}
		>
			<div className="flex items-baseline justify-between gap-3 font-mono text-xs">
				<span className="text-text-subtle">{label}</span>
				<span className="shrink-0 text-text-subtlest">{value}</span>
			</div>
			<div className="mt-4 flex min-h-56 flex-1 items-center justify-center overflow-hidden rounded-md bg-surface px-6 py-8">
				{children}
			</div>
		</div>
	);
}

export default function ScribblesDemo() {
	const [scale, setScale] = useState(SCRIBBLES_DEFAULT_SCALE);
	const [baseFrequency, setBaseFrequency] = useState(SCRIBBLES_DEFAULT_BASE_FREQUENCY);
	const [numOctaves, setNumOctaves] = useState(SCRIBBLES_DEFAULT_NUM_OCTAVES);
	const [seed, setSeed] = useState(SCRIBBLES_DEFAULT_SEED);
	const [amount, setAmount] = useState(SCRIBBLES_DEFAULT_AMOUNT);
	const [intervalMs, setIntervalMs] = useState(SCRIBBLES_DEFAULT_INTERVAL_MS);
	const [animationPlaying, setAnimationPlaying] = useState(true);
	const [svgSource, setSvgSource] = useState<ScribblesSvgSource>(DEFAULT_SCRIBBLES_SVG_SOURCE);
	const uploadedSvgUrlRef = useRef<string | null>(null);

	const resetSvgSource = useCallback(() => {
		if (uploadedSvgUrlRef.current) {
			URL.revokeObjectURL(uploadedSvgUrlRef.current);
			uploadedSvgUrlRef.current = null;
		}
		setSvgSource(DEFAULT_SCRIBBLES_SVG_SOURCE);
	}, []);

	const uploadSvgSource = useCallback((file: File) => {
		if (!isScribblesSvgFile(file)) return;
		const url = URL.createObjectURL(file);
		if (uploadedSvgUrlRef.current) {
			URL.revokeObjectURL(uploadedSvgUrlRef.current);
		}
		uploadedSvgUrlRef.current = url;
		setSvgSource({
			src: url,
			name: file.name || "uploaded.svg",
			uploaded: true,
		});
	}, []);

	useEffect(() => {
		return () => {
			if (uploadedSvgUrlRef.current) {
				URL.revokeObjectURL(uploadedSvgUrlRef.current);
			}
		};
	}, []);

	const config = useMemo(
		() => ({
			source: svgSource.name,
			scale,
			baseFrequency,
			numOctaves,
			seed,
			animation: {
				enabled: animationPlaying,
				intervalMs,
				amount,
			},
		}),
		[amount, animationPlaying, baseFrequency, intervalMs, numOctaves, scale, seed, svgSource.name],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<ScribblesPreviewTile
				label="line boil"
				value={`${formatFrequency(baseFrequency)} / ${scale}px`}
			>
				<Scribbles
					scale={scale}
					baseFrequency={baseFrequency}
					numOctaves={numOctaves}
					seed={seed}
					animation={{
						enabled: animationPlaying,
						intervalMs,
						amount,
					}}
					className="flex w-full items-center justify-center"
				>
					<ScribblesSourceImage source={svgSource} />
				</Scribbles>
			</ScribblesPreviewTile>

			<GUI.Panel title="Scribbles controls" values={config}>
				<GUI.Section title="Source" borderTop={false}>
					<ScribblesSvgUploadControl
						source={svgSource}
						onUpload={uploadSvgSource}
						onReset={resetSvgSource}
					/>
				</GUI.Section>
				<GUI.Section title="Filter">
					<GUI.Control
						id="scribbles-scale"
						label="scale"
						value={scale}
						defaultValue={SCRIBBLES_DEFAULT_SCALE}
						min={0}
						max={48}
						step={1}
						onChange={setScale}
					/>
					<GUI.Control
						id="scribbles-base-frequency"
						label="base frequency"
						value={baseFrequency}
						defaultValue={SCRIBBLES_DEFAULT_BASE_FREQUENCY}
						min={0.001}
						max={0.08}
						step={0.001}
						onChange={setBaseFrequency}
					/>
					<GUI.Control
						id="scribbles-num-octaves"
						label="octaves"
						value={numOctaves}
						defaultValue={SCRIBBLES_DEFAULT_NUM_OCTAVES}
						min={1}
						max={5}
						step={1}
						onChange={setNumOctaves}
					/>
					<GUI.Control
						id="scribbles-seed"
						label="seed"
						value={seed}
						defaultValue={SCRIBBLES_DEFAULT_SEED}
						min={1}
						max={24}
						step={1}
						onChange={setSeed}
					/>
				</GUI.Section>
				<GUI.Section title="Animation">
					<GUI.Toggle
						id="scribbles-animation-playing"
						label="play"
						checked={animationPlaying}
						onChange={setAnimationPlaying}
					/>
					<GUI.Control
						id="scribbles-animation-amount"
						label="amount"
						value={amount}
						defaultValue={SCRIBBLES_DEFAULT_AMOUNT}
						min={0}
						max={1}
						step={0.01}
						onChange={setAmount}
					/>
					<GUI.Control
						id="scribbles-animation-interval"
						label="frame interval"
						value={intervalMs}
						defaultValue={SCRIBBLES_DEFAULT_INTERVAL_MS}
						min={50}
						max={500}
						step={10}
						unit="ms"
						onChange={setIntervalMs}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
