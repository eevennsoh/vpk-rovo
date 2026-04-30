"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import ChromaticAberration from "./shaders/chromatic-aberration";

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
					onChange={(e) => {
						const file = e.target.files?.[0];
						if (file) handleFile(file);
						e.target.value = "";
					}}
				/>
			</div>
		</div>
	);
}

export default function ChromaticAberrationDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [mode, setMode] = useState<"0" | "1" | "2" | "3">("3");
	const [radius, setRadius] = useState(60);
	const [pulse, setPulse] = useState(30);
	const [speed, setSpeed] = useState(0);
	const [swirl, setSwirl] = useState(3);
	const [swirlSpeed, setSwirlSpeed] = useState(0);

	const config = useMemo(
		() => ({ mode: Number(mode), radius, pulse, speed, swirl, swirlSpeed }),
		[mode, radius, pulse, speed, swirl, swirlSpeed],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="aspect-video w-full overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<ChromaticAberration
					imageSrc={imageSrc}
					mode={Number(mode)}
					radius={radius}
					pulse={pulse}
					speed={speed}
					swirl={swirl}
					swirlSpeed={swirlSpeed}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
				<GUI.Select
					id="ca-mode"
					label="Mode"
					value={mode}
					options={[
						{ value: "0", label: "Radial" },
						{ value: "1", label: "Horizontal" },
						{ value: "2", label: "Vertical" },
						{ value: "3", label: "Swirl" },
					]}
					onChange={setMode}
				/>
				<GUI.Control
					id="ca-radius"
					label="Radius"
					value={radius}
					defaultValue={60}
					min={0}
					max={120}
					step={0.5}
					onChange={setRadius}
				/>
				<GUI.Control
					id="ca-pulse"
					label="Pulse"
					value={pulse}
					defaultValue={30}
					min={0}
					max={60}
					step={0.5}
					onChange={setPulse}
				/>
				<GUI.Control
					id="ca-speed"
					label="Speed"
					value={speed}
					defaultValue={0}
					min={0}
					max={5}
					step={0.1}
					onChange={setSpeed}
				/>
				{mode === "3" ? (
					<>
						<GUI.Control
							id="ca-swirl"
							label="Swirl"
							value={swirl}
							defaultValue={3}
							min={0}
							max={10}
							step={0.1}
							onChange={setSwirl}
						/>
						<GUI.Control
							id="ca-swirlSpeed"
							label="Swirl Speed"
							value={swirlSpeed}
							defaultValue={0}
							min={0}
							max={2}
							step={0.01}
							onChange={setSwirlSpeed}
						/>
					</>
				) : null}
			</GUI.Panel>
		</div>
	);
}
