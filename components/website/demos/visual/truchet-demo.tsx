"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import ImageIcon from "@atlaskit/icon/core/image";

import { GUI } from "@/components/utils/gui";
import { Label } from "@/components/ui/label";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import Truchet from "./shaders/truchet";

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

const DEFAULT_BACKGROUND = "#FFFFFF";

export default function TruchetDemo() {
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined);
	const [cells, setCells] = useState(53);
	const [thickness, setThickness] = useState(0.05);
	const [invert, setInvert] = useState(true);
	const [background, setBackground] = useState(DEFAULT_BACKGROUND);

	const config = useMemo(
		() => ({ cells, thickness, invert, background }),
		[cells, thickness, invert, background],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full aspect-video rounded-lg overflow-hidden border border-border"
			>
				<Truchet
					imageSrc={imageSrc}
					cells={cells}
					thickness={thickness}
					invert={invert}
					background={background}
				/>
			</div>

			<GUI.Panel title="Shader controls" values={config}>
				<ImageUploadControl imageSrc={imageSrc} onChange={setImageSrc} />
				<GUI.Control
					id="tr-cells"
					label="Cells"
					value={cells}
					defaultValue={53}
					min={8}
					max={128}
					step={1}
					onChange={setCells}
				/>
				<GUI.Control
					id="tr-thickness"
					label="Thickness"
					value={thickness}
					defaultValue={0.05}
					min={0.05}
					max={0.5}
					step={0.01}
					onChange={setThickness}
				/>
				<GUI.Select
					id="tr-invert"
					label="Invert"
					value={invert ? "yes" : "no"}
					options={[
						{ value: "yes", label: "Yes" },
						{ value: "no", label: "No" },
					]}
					onChange={(v) => setInvert(v === "yes")}
				/>
				<ShaderColorInput
					id="tr-background"
					label="Background"
					value={background}
					defaultValue={DEFAULT_BACKGROUND}
					onChange={setBackground}
				/>
			</GUI.Panel>
		</div>
	);
}
