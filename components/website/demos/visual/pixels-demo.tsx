"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import Pixels from "./shaders/pixels";

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

export default function PixelsDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [pixels, setPixels] = useState(28);
	const [stagger, setStagger] = useState(0);
	const [border, setBorder] = useState(0);
	const [aberration, setAberration] = useState(0);
	const [hueShift, setHueShift] = useState(0);

	const config = useMemo(
		() => ({ pixels, stagger, border, aberration, hueShift }),
		[pixels, stagger, border, aberration, hueShift],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden border border-border"
			>
				<Pixels
					imageSrc={imageSrc}
					pixels={pixels}
					stagger={stagger}
					border={border}
					aberration={aberration}
					hueShift={hueShift}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
				<GUI.Control
					id="px-pixels"
					label="Pixels"
					value={pixels}
					defaultValue={28}
					min={8}
					max={128}
					step={1}
					onChange={setPixels}
				/>
				<GUI.Control
					id="px-stagger"
					label="Stagger"
					value={stagger}
					defaultValue={0}
					min={0}
					max={1}
					step={0.01}
					onChange={setStagger}
				/>
				<GUI.Control
					id="px-border"
					label="Border"
					value={border}
					defaultValue={0}
					min={0}
					max={1}
					step={0.01}
					onChange={setBorder}
				/>
				<GUI.Control
					id="px-aberration"
					label="Aberration"
					value={aberration}
					defaultValue={0}
					min={0}
					max={20}
					step={0.5}
					onChange={setAberration}
				/>
				<GUI.Control
					id="px-hueShift"
					label="Hue Shift"
					value={hueShift}
					defaultValue={0}
					min={-1}
					max={1}
					step={0.01}
					onChange={setHueShift}
				/>
			</GUI.Panel>
		</div>
	);
}
