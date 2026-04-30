"use client";

import type { NeuralGraphParams, NeuralGraphNodeShape } from "./lib/neural-graph/params";
import { NEURAL_GRAPH_PARAM_SECTIONS, clampNeuralGraphParams } from "./lib/neural-graph/params";

interface PersonalGraphNeuralControlsProps {
	onChange: (params: NeuralGraphParams) => void;
	params: NeuralGraphParams;
}

function formatParamValue(value: number) {
	return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function PersonalGraphNeuralControls({
	onChange,
	params,
}: Readonly<PersonalGraphNeuralControlsProps>) {
	function updateParam(key: keyof NeuralGraphParams, value: number | string) {
		onChange(clampNeuralGraphParams({ ...params, [key]: value }));
	}

	function updateShape(shape: NeuralGraphNodeShape) {
		onChange(clampNeuralGraphParams({ ...params, nodeShape: shape }));
	}

	return (
		<div className="space-y-5">
			<div className="flex items-center justify-between gap-3">
				<h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-subtle">Parameters</h2>
				<span className="text-[10px] text-text-subtle">local preset</span>
			</div>

			{NEURAL_GRAPH_PARAM_SECTIONS.map((section) => (
				<section className="space-y-3 border-t border-border pt-4" key={section.id}>
					<h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-subtle">{section.label}</h3>
					{section.params.map((definition) => {
						const value = params[definition.key];
						if (typeof value !== "number") return null;

						return (
							<label className="block space-y-2" key={definition.key}>
								<span className="flex items-center justify-between gap-3 text-xs">
									<span className="font-medium text-text">{definition.label}</span>
									<span className="text-text-subtle">{formatParamValue(value)}</span>
								</span>
								<input
									aria-label={definition.label}
									className="h-2 w-full accent-purple-500"
									max={definition.max}
									min={definition.min}
									onChange={(event) => updateParam(definition.key, Number(event.target.value))}
									step={definition.step}
									type="range"
									value={value}
								/>
							</label>
						);
					})}
				</section>
			))}

			<section className="space-y-3 border-t border-border pt-4">
				<h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-subtle">Node Style</h3>
				<label className="block space-y-2">
					<span className="flex items-center justify-between gap-3 text-xs">
						<span className="font-medium text-text">Color</span>
						<span className="font-mono text-text-subtle">{params.nodeColor}</span>
					</span>
					<div className="flex items-center gap-2">
						<input
							aria-label="Node color"
							className="h-8 w-10 rounded border border-border bg-surface"
							onChange={(event) => updateParam("nodeColor", event.target.value)}
							type="color"
							value={params.nodeColor}
						/>
						<input
							aria-label="Node color hex"
							className="h-8 min-w-0 flex-1 rounded border border-border bg-surface px-2 font-mono text-xs text-text"
							onChange={(event) => updateParam("nodeColor", event.target.value)}
							value={params.nodeColor}
						/>
					</div>
				</label>
				<div className="grid grid-cols-2 gap-2" role="group" aria-label="Node shape">
					{(["circle", "square"] as const).map((shape) => (
						<button
							className={
								params.nodeShape === shape
									? "rounded border border-border-selected bg-bg-selected px-3 py-2 text-xs font-medium text-text-selected"
									: "rounded border border-border bg-surface px-3 py-2 text-xs font-medium text-text-subtle hover:bg-surface-hover"
							}
							key={shape}
							onClick={() => updateShape(shape)}
							type="button"
						>
							{shape}
						</button>
					))}
				</div>
			</section>
		</div>
	);
}
