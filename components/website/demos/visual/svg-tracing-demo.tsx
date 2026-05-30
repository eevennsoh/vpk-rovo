"use client";

import { useMemo, useState } from "react";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import UploadIcon from "@atlaskit/icon/core/upload";

import SvgTracing from "@/components/visual/svg-tracing";
import {
	DEFAULT_SVG_SOURCE,
	DEFAULT_SVG_TRACE_CONFIG,
	SVG_TRACE_CAP_OPTIONS,
	SVG_TRACE_EASING_OPTIONS,
	SVG_TRACE_MODE_OPTIONS,
	SVG_TRACE_PRESETS,
	type SvgTraceConfig,
	type SvgTraceEasingId,
	type SvgTraceMode,
	type SvgTraceSegmentCap,
} from "@/components/visual/svg-tracing/data";
import {
	formatSvgTraceBezier,
	parseSvgTraceBezierInput,
	parseSvgTraceInput,
	type SvgTraceShape,
} from "@/components/visual/svg-tracing/lib";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GUI } from "@/components/utils/gui";
import { cn } from "@/lib/utils";

const PRESET_OPTIONS: readonly { value: string; label: string }[] = [
	...SVG_TRACE_PRESETS.map((preset) => ({ value: preset.id, label: preset.label })),
	{ value: "custom", label: "Custom" },
];

function shapeToSvgSource(shape: SvgTraceShape): string {
	const paths = shape.paths.map((path) => `\t<path d="${path.d}" />`).join("\n");
	return `<svg viewBox="${shape.viewBox}" xmlns="http://www.w3.org/2000/svg">\n${paths}\n</svg>`;
}

export default function SvgTracingDemo() {
	const initialShape = SVG_TRACE_PRESETS[0];
	const [shape, setShape] = useState<SvgTraceShape>(initialShape);
	const [presetId, setPresetId] = useState(initialShape.id);
	const [svgSource, setSvgSource] = useState(DEFAULT_SVG_SOURCE);
	const [pasteError, setPasteError] = useState<string | null>(null);
	const [playing, setPlaying] = useState(true);
	const [resetKey, setResetKey] = useState(0);
	const [duration, setDuration] = useState(DEFAULT_SVG_TRACE_CONFIG.duration);
	const [traceLength, setTraceLength] = useState(DEFAULT_SVG_TRACE_CONFIG.traceLength);
	const [strokeWidth, setStrokeWidth] = useState(DEFAULT_SVG_TRACE_CONFIG.strokeWidth);
	const [colorStopCount, setColorStopCount] = useState(DEFAULT_SVG_TRACE_CONFIG.colorStopCount);
	const [segmentCap, setSegmentCap] = useState<SvgTraceSegmentCap>(
		DEFAULT_SVG_TRACE_CONFIG.segmentCap,
	);
	const [easingId, setEasingId] = useState<SvgTraceEasingId>(
		DEFAULT_SVG_TRACE_CONFIG.easingId,
	);
	const [customBezierInput, setCustomBezierInput] = useState(
		formatSvgTraceBezier(DEFAULT_SVG_TRACE_CONFIG.customBezier),
	);
	const [traceMode, setTraceMode] = useState<SvgTraceMode>(
		DEFAULT_SVG_TRACE_CONFIG.traceMode,
	);
	const [loop, setLoop] = useState(DEFAULT_SVG_TRACE_CONFIG.loop);
	const [repeatCount, setRepeatCount] = useState(DEFAULT_SVG_TRACE_CONFIG.repeatCount);
	const [showOutline, setShowOutline] = useState(DEFAULT_SVG_TRACE_CONFIG.showOutline);
	const customBezierParse = useMemo(
		() => parseSvgTraceBezierInput(customBezierInput),
		[customBezierInput],
	);

	const config = useMemo<SvgTraceConfig>(
		() => ({
			duration,
			traceLength,
			strokeWidth,
			colorStopCount,
			segmentCap,
			easingId,
			customBezier: customBezierParse.ok
				? customBezierParse.value
				: DEFAULT_SVG_TRACE_CONFIG.customBezier,
			traceMode,
			loop,
			repeatCount,
			showOutline,
		}),
		[
			duration,
			traceLength,
			strokeWidth,
			colorStopCount,
			segmentCap,
			easingId,
			customBezierParse,
			traceMode,
			loop,
			repeatCount,
			showOutline,
		],
	);

	const applyPreset = (nextPresetId: string) => {
		setPresetId(nextPresetId);
		const nextShape = SVG_TRACE_PRESETS.find((preset) => preset.id === nextPresetId);
		if (!nextShape) return;
		setShape(nextShape);
		setSvgSource(shapeToSvgSource(nextShape));
		setPasteError(null);
		setPlaying(true);
		setResetKey((current) => current + 1);
	};

	const applyPastedSvg = () => {
		const parsed = parseSvgTraceInput(svgSource);
		if (!parsed.ok) {
			setPasteError(parsed.error);
			return;
		}

		setShape({
			...parsed.shape,
			id: `${parsed.shape.id}-${resetKey + 1}`,
		});
		setPresetId("custom");
		setPasteError(null);
		setPlaying(true);
		setResetKey((current) => current + 1);
	};

	const resetAnimation = () => {
		setPlaying(true);
		setResetKey((current) => current + 1);
	};

	return (
		<div className="flex w-full max-w-3xl flex-col gap-4">
			<div className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface">
				<SvgTracing
					shape={shape}
					config={config}
					playing={playing}
					resetKey={resetKey}
					className="min-h-[420px]"
				/>
			</div>

			<GUI.Panel
				title="SVG tracing controls"
				values={{ ...config, playing, presetId, viewBox: shape.viewBox }}
			>
				<GUI.Section title="Playback" borderTop={false}>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							variant="secondary"
							size="sm"
							aria-pressed={playing}
							onClick={() => setPlaying((current) => !current)}
						>
							{playing ? "Pause" : "Play"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={resetAnimation}
						>
							<RefreshIcon label="" size="small" />
							Replay
						</Button>
					</div>
					<div className="font-mono text-[11px] text-text-subtlest">
						{shape.label} / viewBox {shape.viewBox} / {shape.paths.length} path
						{shape.paths.length === 1 ? "" : "s"}
					</div>
				</GUI.Section>

				<GUI.Section title="Path">
					<GUI.Select
						id="svg-tracing-preset"
						label="Preset"
						value={presetId}
						options={PRESET_OPTIONS}
						onChange={applyPreset}
					/>
					<div className="space-y-2">
						<Label htmlFor="svg-tracing-source" className="text-xs font-medium text-text">
							SVG source
						</Label>
						<Textarea
							id="svg-tracing-source"
							value={svgSource}
							onChange={(event) => setSvgSource(event.currentTarget.value)}
							rows={7}
							isCompact
							isMonospaced
							spellCheck={false}
							className="max-h-48 min-h-32 resize-y text-[11px] leading-4"
						/>
						<div className="flex items-center justify-between gap-2">
							<p
								className={cn(
									"text-[12px] leading-4",
									pasteError ? "text-text-danger" : "text-text-subtlest",
								)}
							>
								{pasteError ?? "Extracts viewBox and path d attributes only."}
							</p>
							<Button type="button" size="sm" variant="secondary" onClick={applyPastedSvg}>
								<UploadIcon label="" size="small" />
								Apply
							</Button>
						</div>
					</div>
				</GUI.Section>

				<GUI.Section title="Animation">
					<GUI.Select
						id="svg-tracing-mode"
						label="Mode"
						value={traceMode}
						options={SVG_TRACE_MODE_OPTIONS}
						onChange={setTraceMode}
					/>
					<GUI.Control
						id="svg-tracing-duration"
						label="Duration"
						value={duration}
						defaultValue={DEFAULT_SVG_TRACE_CONFIG.duration}
						min={0.8}
						max={10}
						step={0.1}
						unit="s"
						onChange={setDuration}
					/>
					<GUI.Select
						id="svg-tracing-easing"
						label="Easing"
						value={easingId}
						options={SVG_TRACE_EASING_OPTIONS}
						stickyOptionValue="custom"
						onChange={setEasingId}
					/>
					{easingId === "custom" ? (
						<GUI.TextInput
							id="svg-tracing-custom-bezier"
							label="Custom bezier"
							value={customBezierInput}
							placeholder="0.64, 0, 0.78, 0"
							description={
								customBezierParse.ok
									? "Four cubic-bezier numbers. Use in Tailwind as ease-[cubic-bezier(0.64,0,0.78,0)]."
									: customBezierParse.error
							}
							onChange={setCustomBezierInput}
						/>
					) : null}
					<GUI.Control
						id="svg-tracing-trace-length"
						label="Trace length"
						description="Visible path window in window mode. Draw/eat mode grows to full length, then shrinks from the beginning."
						value={traceLength}
						defaultValue={DEFAULT_SVG_TRACE_CONFIG.traceLength}
						min={0.02}
						max={0.45}
						step={0.01}
						disabled={traceMode === "draw-eat"}
						onChange={setTraceLength}
					/>
					<GUI.Toggle
						id="svg-tracing-loop"
						label="Infinite loop"
						checked={loop}
						onChange={setLoop}
					/>
					<GUI.Control
						id="svg-tracing-repeat-count"
						label="Repeats"
						value={repeatCount}
						defaultValue={DEFAULT_SVG_TRACE_CONFIG.repeatCount}
						min={1}
						max={12}
						step={1}
						disabled={loop}
						onChange={setRepeatCount}
					/>
				</GUI.Section>

				<GUI.Section title="Appearance">
					<GUI.Control
						id="svg-tracing-color-stop-count"
						label="Color stops"
						value={colorStopCount}
						defaultValue={DEFAULT_SVG_TRACE_CONFIG.colorStopCount}
						min={1}
						max={12}
						step={1}
						onChange={setColorStopCount}
					/>
					<GUI.Control
						id="svg-tracing-stroke-width"
						label="Stroke"
						value={strokeWidth}
						defaultValue={DEFAULT_SVG_TRACE_CONFIG.strokeWidth}
						min={1}
						max={9}
						step={0.25}
						unit="px"
						onChange={setStrokeWidth}
					/>
					<GUI.Select
						id="svg-tracing-segment-cap"
						label="Segment cap"
						value={segmentCap}
						options={SVG_TRACE_CAP_OPTIONS}
						onChange={setSegmentCap}
					/>
					<GUI.Toggle
						id="svg-tracing-outline"
						label="Path outline"
						checked={showOutline}
						onChange={setShowOutline}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
