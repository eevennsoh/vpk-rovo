"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";

import Melt from "./melt";

const DEFAULT_SCALE_ONLY = 0;
const DEFAULT_FREQUENCY_SCALE = 20;
const DEFAULT_FREQUENCY_X = 0.012;
const DEFAULT_FREQUENCY_Y = 0.035;
const DEFAULT_ANIMATION_SCALE_FROM = 0;
const DEFAULT_ANIMATION_SCALE_TO = 40;
const DEFAULT_ANIMATION_FREQUENCY_X_FROM = 0.005;
const DEFAULT_ANIMATION_FREQUENCY_X_TO = 0.012;
const DEFAULT_ANIMATION_FREQUENCY_Y_FROM = 0.02;
const DEFAULT_ANIMATION_FREQUENCY_Y_TO = 0.035;
const DEFAULT_IMAGE_SCALE = 12;
const DEFAULT_TEXT_SCALE = 6;

const MELT_IMAGE_SRC = "/ambient/atlassian/pictorial/clouds/primary/blue.png";
const MELT_IMAGE_WIDTH = 3841;
const MELT_IMAGE_HEIGHT = 2161;

function formatScale(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatFrequency(value: number): string {
	return value.toFixed(3);
}

function MeltGlyph({ className }: Readonly<{ className?: string }>) {
	return (
		<svg
			viewBox="0 0 96 96"
			fill="none"
			overflow="visible"
			className={cn("size-28 text-text", className)}
		>
			<path
				d="M18 50C18 36.7452 28.7452 26 42 26H54C67.2548 26 78 36.7452 78 50V56C78 69.2548 67.2548 80 54 80H42C28.7452 80 18 69.2548 18 56V50Z"
				stroke="currentColor"
				strokeWidth="3"
			/>
			<path
				d="M32 51C32 48.7909 33.7909 47 36 47C38.2091 47 40 48.7909 40 51V56C40 58.2091 38.2091 60 36 60C33.7909 60 32 58.2091 32 56V51Z"
				fill="currentColor"
			/>
			<path
				d="M56 51C56 48.7909 57.7909 47 60 47C62.2091 47 64 48.7909 64 51V56C64 58.2091 62.2091 60 60 60C57.7909 60 56 58.2091 56 56V51Z"
				fill="currentColor"
			/>
			<path
				d="M48 26V13"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<circle cx="48" cy="12" r="6" fill="currentColor" />
			<path
				d="M18 48H11C7.68629 48 5 50.6863 5 54C5 57.3137 7.68629 60 11 60H18"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
			<path
				d="M78 48H85C88.3137 48 91 50.6863 91 54C91 57.3137 88.3137 60 85 60H78"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}

type MeltPreviewTileProps = Readonly<{
	label: string;
	value: string;
	children: React.ReactNode;
	className?: string;
}>;

function MeltPreviewTile({ label, value, children, className }: MeltPreviewTileProps) {
	return (
		<div
			className={cn(
				"flex min-h-56 flex-col rounded-lg border border-border bg-surface-raised p-4",
				className,
			)}
			style={{ boxShadow: token("elevation.shadow.raised") }}
		>
			<div className="flex items-baseline justify-between gap-3 font-mono text-xs">
				<span className="text-text-subtle">{label}</span>
				<span className="shrink-0 text-text-subtlest">{value}</span>
			</div>
			<div className="mt-4 flex min-h-40 flex-1 items-center justify-center overflow-hidden rounded-md bg-surface">
				{children}
			</div>
		</div>
	);
}

export default function MeltDemo() {
	const [scaleOnly, setScaleOnly] = useState(DEFAULT_SCALE_ONLY);
	const [frequencyScale, setFrequencyScale] = useState(DEFAULT_FREQUENCY_SCALE);
	const [frequencyX, setFrequencyX] = useState(DEFAULT_FREQUENCY_X);
	const [frequencyY, setFrequencyY] = useState(DEFAULT_FREQUENCY_Y);
	const [animationScaleFrom, setAnimationScaleFrom] = useState(DEFAULT_ANIMATION_SCALE_FROM);
	const [animationScaleTo, setAnimationScaleTo] = useState(DEFAULT_ANIMATION_SCALE_TO);
	const [animationFrequencyXFrom, setAnimationFrequencyXFrom] = useState(DEFAULT_ANIMATION_FREQUENCY_X_FROM);
	const [animationFrequencyXTo, setAnimationFrequencyXTo] = useState(DEFAULT_ANIMATION_FREQUENCY_X_TO);
	const [animationFrequencyYFrom, setAnimationFrequencyYFrom] = useState(DEFAULT_ANIMATION_FREQUENCY_Y_FROM);
	const [animationFrequencyYTo, setAnimationFrequencyYTo] = useState(DEFAULT_ANIMATION_FREQUENCY_Y_TO);
	const [imageScale, setImageScale] = useState(DEFAULT_IMAGE_SCALE);
	const [textScale, setTextScale] = useState(DEFAULT_TEXT_SCALE);

	const config = useMemo(
		() => ({
			scale: scaleOnly,
			frequency: {
				scale: frequencyScale,
				x: frequencyX,
				y: frequencyY,
			},
			animation: {
				scaleFrom: animationScaleFrom,
				scaleTo: animationScaleTo,
				frequencyXFrom: animationFrequencyXFrom,
				frequencyXTo: animationFrequencyXTo,
				frequencyYFrom: animationFrequencyYFrom,
				frequencyYTo: animationFrequencyYTo,
			},
			image: {
				scale: imageScale,
			},
			text: {
				scale: textScale,
			},
		}),
		[
			animationFrequencyXFrom,
			animationFrequencyXTo,
			animationFrequencyYFrom,
			animationFrequencyYTo,
			animationScaleFrom,
			animationScaleTo,
			frequencyScale,
			frequencyX,
			frequencyY,
			imageScale,
			scaleOnly,
			textScale,
		],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div className="grid w-full gap-3 sm:grid-cols-2">
				<MeltPreviewTile label="scale" value={formatScale(scaleOnly)}>
					<Melt scale={scaleOnly} className="flex items-center justify-center">
						<MeltGlyph />
					</Melt>
				</MeltPreviewTile>

				<MeltPreviewTile
					label="frequency"
					value={`${formatFrequency(frequencyX)} ${formatFrequency(frequencyY)}`}
				>
					<Melt
						scale={frequencyScale}
						frequencyX={frequencyX}
						frequencyY={frequencyY}
						className="flex items-center justify-center"
					>
						<MeltGlyph />
					</Melt>
				</MeltPreviewTile>

				<MeltPreviewTile
					label="animation"
					value={`${formatScale(animationScaleFrom)} to ${formatScale(animationScaleTo)}`}
				>
					<Melt
						scale={animationScaleFrom}
						frequencyX={animationFrequencyXFrom}
						frequencyY={animationFrequencyYFrom}
						animation={{
							enabled: true,
							duration: 5,
							scaleFrom: animationScaleFrom,
							scaleTo: animationScaleTo,
							frequencyXFrom: animationFrequencyXFrom,
							frequencyXTo: animationFrequencyXTo,
							frequencyYFrom: animationFrequencyYFrom,
							frequencyYTo: animationFrequencyYTo,
						}}
						className="flex items-center justify-center"
					>
						<MeltGlyph />
					</Melt>
				</MeltPreviewTile>

				<MeltPreviewTile label="image" value={formatScale(imageScale)}>
					<Melt
						scale={imageScale}
						className="block h-full w-full"
					>
						<Image
							src={MELT_IMAGE_SRC}
							alt=""
							width={MELT_IMAGE_WIDTH}
							height={MELT_IMAGE_HEIGHT}
							className="h-full w-full object-cover"
						/>
					</Melt>
				</MeltPreviewTile>

				<MeltPreviewTile
					label="text"
					value={formatScale(textScale)}
					className="sm:col-span-2"
				>
					<Melt
						scale={textScale}
						className="max-w-full px-4 text-center"
					>
						<p className="select-text text-4xl font-semibold leading-none tracking-normal text-text sm:text-5xl">
							Selectable
						</p>
						<p className="mt-3 select-text text-sm text-text-subtle">
							Letters under pressure.
						</p>
					</Melt>
				</MeltPreviewTile>
			</div>

			<GUI.Panel title="Melt controls" values={config}>
				<GUI.Section title="Scale" borderTop={false}>
					<GUI.Control
						id="melt-scale-only"
						label="scale"
						value={scaleOnly}
						defaultValue={DEFAULT_SCALE_ONLY}
						min={0}
						max={80}
						step={1}
						onChange={setScaleOnly}
					/>
				</GUI.Section>
				<GUI.Section title="Frequencies">
					<GUI.Control
						id="melt-frequency-scale"
						label="scale"
						value={frequencyScale}
						defaultValue={DEFAULT_FREQUENCY_SCALE}
						min={0}
						max={80}
						step={1}
						onChange={setFrequencyScale}
					/>
					<GUI.Control
						id="melt-frequency-x"
						label="frequency X"
						value={frequencyX}
						defaultValue={DEFAULT_FREQUENCY_X}
						min={0.001}
						max={0.1}
						step={0.001}
						onChange={setFrequencyX}
					/>
					<GUI.Control
						id="melt-frequency-y"
						label="frequency Y"
						value={frequencyY}
						defaultValue={DEFAULT_FREQUENCY_Y}
						min={0.001}
						max={0.1}
						step={0.001}
						onChange={setFrequencyY}
					/>
				</GUI.Section>
				<GUI.Section title="Animation">
					<GUI.Control
						id="melt-animation-scale-from"
						label="scale from"
						value={animationScaleFrom}
						defaultValue={DEFAULT_ANIMATION_SCALE_FROM}
						min={0}
						max={80}
						step={1}
						onChange={setAnimationScaleFrom}
					/>
					<GUI.Control
						id="melt-animation-scale-to"
						label="scale to"
						value={animationScaleTo}
						defaultValue={DEFAULT_ANIMATION_SCALE_TO}
						min={0}
						max={80}
						step={1}
						onChange={setAnimationScaleTo}
					/>
					<GUI.Control
						id="melt-animation-frequency-x-from"
						label="frequency X from"
						value={animationFrequencyXFrom}
						defaultValue={DEFAULT_ANIMATION_FREQUENCY_X_FROM}
						min={0.001}
						max={0.1}
						step={0.001}
						onChange={setAnimationFrequencyXFrom}
					/>
					<GUI.Control
						id="melt-animation-frequency-x-to"
						label="frequency X to"
						value={animationFrequencyXTo}
						defaultValue={DEFAULT_ANIMATION_FREQUENCY_X_TO}
						min={0.001}
						max={0.1}
						step={0.001}
						onChange={setAnimationFrequencyXTo}
					/>
					<GUI.Control
						id="melt-animation-frequency-y-from"
						label="frequency Y from"
						value={animationFrequencyYFrom}
						defaultValue={DEFAULT_ANIMATION_FREQUENCY_Y_FROM}
						min={0.001}
						max={0.1}
						step={0.001}
						onChange={setAnimationFrequencyYFrom}
					/>
					<GUI.Control
						id="melt-animation-frequency-y-to"
						label="frequency Y to"
						value={animationFrequencyYTo}
						defaultValue={DEFAULT_ANIMATION_FREQUENCY_Y_TO}
						min={0.001}
						max={0.1}
						step={0.001}
						onChange={setAnimationFrequencyYTo}
					/>
				</GUI.Section>
				<GUI.Section title="Image">
					<GUI.Control
						id="melt-image-scale"
						label="scale"
						value={imageScale}
						defaultValue={DEFAULT_IMAGE_SCALE}
						min={0}
						max={60}
						step={1}
						onChange={setImageScale}
					/>
				</GUI.Section>
				<GUI.Section title="Text">
					<GUI.Control
						id="melt-text-scale"
						label="scale"
						value={textScale}
						defaultValue={DEFAULT_TEXT_SCALE}
						min={0}
						max={20}
						step={0.5}
						onChange={setTextScale}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
