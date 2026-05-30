"use client";

import { useMemo, useState } from "react";

import VisualTracing from "@/components/visual/visual-tracing";
import {
	DEFAULT_CONFIG,
	SPREAD_DEFAULTS,
	TRACING_PRESETS,
	type TracingConfig,
	type TracingMode,
} from "@/components/visual/visual-tracing/data";
import { Label } from "@/components/ui/label";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";
import { ROVO_COLOR_SWATCHES, ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";

const MODE_OPTIONS: readonly { value: TracingMode; label: string }[] = [
	{ value: "line", label: "Line" },
	{ value: "sweep", label: "Sweep" },
	{ value: "vertical", label: "Vertical" },
];

function spreadRangeForMode(mode: TracingMode) {
	return mode === "vertical"
		? { min: 0.5, max: 15, step: 0.5, unit: "lh" }
		: { min: 1, max: 60, step: 1, unit: "ch" };
}

type RovoColorPickerProps = Readonly<{
	value: readonly string[];
	onChange: (next: string[]) => void;
}>;

/** Toggle the four Rovo brand hues on/off (at least one stays selected). */
function RovoColorPicker({ value, onChange }: RovoColorPickerProps) {
	const toggle = (hex: string) => {
		const isSelected = value.includes(hex);
		if (isSelected && value.length === 1) return; // keep at least one color
		// Rebuild from canonical Rovo order so the blend stays consistent.
		onChange(
			ROVO_SHADER_COLOR_HEX.filter((candidate) =>
				candidate === hex ? !isSelected : value.includes(candidate),
			),
		);
	};

	return (
		<div className="space-y-2">
			<Label className="text-xs font-medium text-text">Colors</Label>
			<div className="flex items-center gap-2">
				{ROVO_COLOR_SWATCHES.map((swatch) => {
					const selected = value.includes(swatch.hex);
					return (
						<button
							key={swatch.hex}
							type="button"
							aria-pressed={selected}
							aria-label={`${swatch.label}${selected ? " (selected)" : ""}`}
							title={swatch.label}
							onClick={() => toggle(swatch.hex)}
							style={{ background: swatch.hex }}
							className={cn(
								"size-8 rounded-full border-2 transition-all",
								selected
									? "border-text shadow-sm"
									: "border-transparent opacity-40 hover:opacity-100",
							)}
						/>
					);
				})}
			</div>
			<p className="text-[12px] leading-4 text-text-subtlest">
				Select one Rovo color for a solid trace, or several to blend them into one gradient.
			</p>
		</div>
	);
}

export default function VisualTracingDemo() {
	const [preset, setPreset] = useState("rovo-spectrum");
	const [mode, setMode] = useState<TracingMode>(DEFAULT_CONFIG.mode);
	const [cps, setCps] = useState(DEFAULT_CONFIG.cps);
	const [textAlpha, setTextAlpha] = useState(DEFAULT_CONFIG.textAlpha);
	const [angle, setAngle] = useState(DEFAULT_CONFIG.angle);
	const [offset, setOffset] = useState(DEFAULT_CONFIG.offset);
	const [spread, setSpread] = useState(DEFAULT_CONFIG.spread);
	const [colors, setColors] = useState<readonly string[]>(DEFAULT_CONFIG.colors);
	const [autoLoop, setAutoLoop] = useState(DEFAULT_CONFIG.autoLoop);
	const [loopDelay, setLoopDelay] = useState(DEFAULT_CONFIG.loopDelay);

	// Spread units differ by mode (ch vs lh); reset to a sensible default when
	// crossing the vertical boundary so the band stays usable.
	const changeMode = (next: TracingMode) => {
		if ((next === "vertical") !== (mode === "vertical")) {
			setSpread(SPREAD_DEFAULTS[next]);
		}
		setMode(next);
	};

	const applyPreset = (value: string) => {
		const next = TRACING_PRESETS.find((entry) => entry.value === value);
		if (!next) return;
		setPreset(value);
		setMode(next.config.mode);
		setCps(next.config.cps);
		setTextAlpha(next.config.textAlpha);
		setAngle(next.config.angle);
		setOffset(next.config.offset);
		setSpread(next.config.spread);
		setColors(next.config.colors);
		setAutoLoop(next.config.autoLoop);
		setLoopDelay(next.config.loopDelay);
	};

	const config = useMemo<TracingConfig>(
		() => ({ mode, cps, textAlpha, angle, offset, spread, colors, autoLoop, loopDelay }),
		[mode, cps, textAlpha, angle, offset, spread, colors, autoLoop, loopDelay],
	);

	const spreadRange = spreadRangeForMode(mode);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="relative overflow-hidden border border-border"
				style={{ borderRadius: 28 }}
			>
				<div
					className="relative flex w-full items-center justify-center overflow-hidden px-8 py-12"
					style={{ minHeight: 360 }}
				>
					<VisualTracing config={config} />
				</div>
			</div>

			<GUI.Panel title="Tracing controls" values={config}>
				<GUI.Section title="Preset" borderTop={false}>
					<GUI.Select
						id="vt-preset"
						label="Preset"
						value={preset}
						options={TRACING_PRESETS.map((entry) => ({
							value: entry.value,
							label: entry.label,
						}))}
						onChange={applyPreset}
					/>
				</GUI.Section>

				<GUI.Section title="Animation">
					<GUI.Select
						id="vt-mode"
						label="Mode"
						description="Line traces along each line; sweep crosses the block diagonally; vertical pours top to bottom."
						value={mode}
						options={MODE_OPTIONS}
						onChange={changeMode}
					/>
					<GUI.Control
						id="vt-cps"
						label="Speed"
						description="Characters per second — longer text traces for proportionally longer."
						value={cps}
						defaultValue={DEFAULT_CONFIG.cps}
						min={5}
						max={300}
						step={1}
						unit="cps"
						onChange={setCps}
					/>
					<GUI.Control
						id="vt-angle"
						label="Angle"
						description="Gradient tilt, applied in sweep mode only."
						value={angle}
						defaultValue={DEFAULT_CONFIG.angle}
						min={-45}
						max={45}
						step={1}
						unit="°"
						disabled={mode !== "sweep"}
						onChange={setAngle}
					/>
					<GUI.Toggle
						id="vt-auto-loop"
						label="Auto-loop"
						checked={autoLoop}
						onChange={setAutoLoop}
					/>
					<GUI.Control
						id="vt-loop-delay"
						label="Loop delay"
						value={loopDelay}
						defaultValue={DEFAULT_CONFIG.loopDelay}
						min={0.25}
						max={4}
						step={0.25}
						unit="s"
						disabled={!autoLoop}
						onChange={setLoopDelay}
					/>
				</GUI.Section>

				<GUI.Section title="Appearance">
					<RovoColorPicker value={colors} onChange={setColors} />
					<GUI.Control
						id="vt-spread"
						label="Spread"
						description="Width of the lit band."
						value={spread}
						min={spreadRange.min}
						max={spreadRange.max}
						step={spreadRange.step}
						unit={spreadRange.unit}
						onChange={setSpread}
					/>
					<GUI.Control
						id="vt-text-alpha"
						label="Text alpha"
						description="Opacity of the unlit base text."
						value={textAlpha}
						defaultValue={DEFAULT_CONFIG.textAlpha}
						min={0}
						max={1}
						step={0.01}
						onChange={setTextAlpha}
					/>
					<GUI.Control
						id="vt-offset"
						label="Offset"
						description="Edge-clearing offset, in the active spread unit."
						value={offset}
						defaultValue={DEFAULT_CONFIG.offset}
						min={0}
						max={60}
						step={1}
						onChange={setOffset}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
