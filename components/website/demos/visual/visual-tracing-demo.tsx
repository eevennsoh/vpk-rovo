"use client";

import { useMemo, useState } from "react";
import AddIcon from "@atlaskit/icon/core/add";
import CrossIcon from "@atlaskit/icon/core/cross";

import VisualTracing from "@/components/visual/visual-tracing";
import {
	DEFAULT_CONFIG,
	TRACING_PRESETS,
	type ColorStop,
	type TracingConfig,
	type TracingMode,
} from "@/components/visual/visual-tracing/data";
import { Label } from "@/components/ui/label";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";
import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";

import { ShaderColorInput } from "./shader-color-controls";

const MODE_OPTIONS: readonly { value: TracingMode; label: string }[] = [
	{ value: "line", label: "Line" },
	{ value: "sweep", label: "Sweep" },
	{ value: "vertical", label: "Vertical" },
];

const MAX_STOPS = 4;

type SpreadRange = Readonly<{ min: number; max: number; step: number }>;

function spreadRangeForMode(mode: TracingMode): SpreadRange {
	return mode === "vertical"
		? { min: 0.5, max: 15, step: 0.5 }
		: { min: 1, max: 60, step: 1 };
}

type StopsEditorProps = Readonly<{
	stops: readonly ColorStop[];
	mode: TracingMode;
	onChange: (next: ColorStop[]) => void;
}>;

function StopsEditor({ stops, mode, onChange }: StopsEditorProps) {
	const range = spreadRangeForMode(mode);
	const canAdd = stops.length < MAX_STOPS;
	const canRemove = stops.length > 1;

	const updateStop = (index: number, patch: Partial<ColorStop>) => {
		onChange(stops.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)));
	};

	return (
		<div className="space-y-3">
			{stops.map((stop, index) => (
				<div
					key={`stop-${index}`}
					className="space-y-3 rounded-md border border-border p-3"
				>
					<div className="flex items-center justify-between">
						<Label className="text-[11px] font-semibold uppercase tracking-wider text-text-subtlest">
							Stop {index + 1}
						</Label>
						{canRemove ? (
							<button
								type="button"
								aria-label={`Remove stop ${index + 1}`}
								onClick={() => onChange(stops.filter((_, i) => i !== index))}
								className="flex size-7 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon"
							>
								<CrossIcon label="" size="small" />
							</button>
						) : null}
					</div>
					<ShaderColorInput
						id={`vt-stop-color-${index}`}
						label="Color"
						value={stop.color}
						onChange={(color) => updateStop(index, { color })}
					/>
					<GUI.Control
						id={`vt-stop-spread-${index}`}
						label="Spread"
						value={stop.spread}
						min={range.min}
						max={range.max}
						step={range.step}
						unit={mode === "vertical" ? "lh" : "ch"}
						onChange={(spread) => updateStop(index, { spread })}
					/>
				</div>
			))}
			{canAdd ? (
				<button
					type="button"
					onClick={() =>
						onChange([
							...stops,
							{
								color: ROVO_SHADER_COLOR_HEX[stops.length % ROVO_SHADER_COLOR_HEX.length],
								spread: range.min === 0.5 ? 2 : 16,
							},
						])
					}
					className="flex h-8 items-center gap-1.5 rounded px-1 text-xs text-text-subtle transition-colors hover:bg-bg-neutral hover:text-text"
				>
					<AddIcon label="" size="small" />
					<span>Add stop</span>
				</button>
			) : null}
		</div>
	);
}

export default function VisualTracingDemo() {
	const [preset, setPreset] = useState("default");
	const [mode, setMode] = useState<TracingMode>(DEFAULT_CONFIG.mode);
	const [cps, setCps] = useState(DEFAULT_CONFIG.cps);
	const [textAlpha, setTextAlpha] = useState(DEFAULT_CONFIG.textAlpha);
	const [angle, setAngle] = useState(DEFAULT_CONFIG.angle);
	const [offset, setOffset] = useState(DEFAULT_CONFIG.offset);
	const [stops, setStops] = useState<readonly ColorStop[]>(DEFAULT_CONFIG.stops);
	const [autoLoop, setAutoLoop] = useState(DEFAULT_CONFIG.autoLoop);
	const [loopDelay, setLoopDelay] = useState(DEFAULT_CONFIG.loopDelay);

	const applyPreset = (value: string) => {
		const next = TRACING_PRESETS.find((entry) => entry.value === value);
		if (!next) return;
		setPreset(value);
		setMode(next.config.mode);
		setCps(next.config.cps);
		setTextAlpha(next.config.textAlpha);
		setAngle(next.config.angle);
		setOffset(next.config.offset);
		setStops(next.config.stops);
		setAutoLoop(next.config.autoLoop);
		setLoopDelay(next.config.loopDelay);
	};

	const config = useMemo<TracingConfig>(
		() => ({ mode, cps, textAlpha, angle, offset, stops, autoLoop, loopDelay }),
		[mode, cps, textAlpha, angle, offset, stops, autoLoop, loopDelay],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="relative overflow-hidden border border-border"
				style={{ borderRadius: 28, boxShadow: token("elevation.shadow.raised") }}
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
						description="Direction the light travels across the text."
						value={mode}
						options={MODE_OPTIONS}
						onChange={setMode}
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

				<GUI.Section title="Colors">
					<StopsEditor stops={stops} mode={mode} onChange={setStops} />
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
