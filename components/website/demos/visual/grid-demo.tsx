"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import Grid, { type GridVariant } from "./shaders/grid";

const DEFAULT_VARIANT: GridVariant = "Desktop";
const DEFAULT_GAP = 20;
const DEFAULT_PADDING = 20;
const DEFAULT_BORDER_RADIUS = 20;
const DEFAULT_TILE_HEIGHT = 500;

const VARIANT_OPTIONS = [
	{ value: "Desktop", label: "Desktop" },
	{ value: "Tablet", label: "Tablet" },
	{ value: "Phone", label: "Phone" },
] as const;

export default function GridDemo() {
	const [variant, setVariant] = useState<GridVariant>(DEFAULT_VARIANT);
	const [gap, setGap] = useState(DEFAULT_GAP);
	const [padding, setPadding] = useState(DEFAULT_PADDING);
	const [borderRadius, setBorderRadius] = useState(DEFAULT_BORDER_RADIUS);
	const [tileHeight, setTileHeight] = useState(DEFAULT_TILE_HEIGHT);

	const config = useMemo(
		() => ({ variant, gap, padding, borderRadius, tileHeight }),
		[variant, gap, padding, borderRadius, tileHeight],
	);

	return (
		<div className="flex flex-col w-full max-w-2xl" style={{ gap: token("space.400") }}>
			<div
				className="w-full overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<Grid
					variant={variant}
					gap={gap}
					padding={padding}
					borderRadius={borderRadius}
					tileHeight={tileHeight}
				/>
			</div>

			<GUI.Panel title="Grid controls" values={config}>
				<GUI.Select
					id="grid-variant"
					label="Variant"
					description="Layout breakpoint that controls the column count."
					value={variant}
					options={VARIANT_OPTIONS}
					onChange={(next) => setVariant(next as GridVariant)}
				/>
				<GUI.Control
					id="grid-gap"
					label="Gap"
					description="Spacing between grid tiles."
					value={gap}
					defaultValue={DEFAULT_GAP}
					min={0}
					max={80}
					step={1}
					unit="px"
					onChange={setGap}
				/>
				<GUI.Control
					id="grid-padding"
					label="Padding"
					description="Inner padding around the grid container."
					value={padding}
					defaultValue={DEFAULT_PADDING}
					min={0}
					max={80}
					step={1}
					unit="px"
					onChange={setPadding}
				/>
				<GUI.Control
					id="grid-border-radius"
					label="Border radius"
					description="Corner radius applied to each tile."
					value={borderRadius}
					defaultValue={DEFAULT_BORDER_RADIUS}
					min={0}
					max={64}
					step={1}
					unit="px"
					onChange={setBorderRadius}
				/>
				<GUI.Control
					id="grid-tile-height"
					label="Tile height"
					description="Height of each tile in the grid."
					value={tileHeight}
					defaultValue={DEFAULT_TILE_HEIGHT}
					min={100}
					max={800}
					step={10}
					unit="px"
					onChange={setTileHeight}
				/>
			</GUI.Panel>
		</div>
	);
}
