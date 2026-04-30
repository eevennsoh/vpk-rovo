"use client";

import { useCallback, useState, type ComponentProps } from "react";
import { PersonalGraphNeuralCanvas } from "@/components/arts/personal-graph/personal-graph-neural-canvas";
import {
	DEFAULT_NEURAL_GRAPH_PARAMS,
	NEURAL_GRAPH_PARAM_SECTIONS,
	clampNeuralGraphParams,
	type NeuralGraphParams,
	type NeuralGraphNodeShape,
} from "@/components/arts/personal-graph/lib/neural-graph/params";
import type {
	VaultEdgeKind,
	VaultExplorer,
	VaultNodeKind,
} from "@/components/arts/personal-graph/lib/personal-graph-types";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface GraphProps extends Omit<ComponentProps<"div">, "children"> {
	explorer?: VaultExplorer;
	initialParams?: Partial<NeuralGraphParams>;
	initialSelectedNodeId?: string | null;
	showControls?: boolean;
}

interface GraphNodeDefinition {
	bodyPreview: string;
	id: string;
	kind: VaultNodeKind;
	relativePath: string;
	title: string;
}

interface GraphEdgeDefinition {
	kind?: VaultEdgeKind;
	label: string;
	source: string;
	target: string;
}

const NODE_SHAPE_OPTIONS = [
	{ value: "circle", label: "Circle" },
	{ value: "square", label: "Square" },
] as const satisfies ReadonlyArray<{ value: NeuralGraphNodeShape; label: string }>;

const GENERATED_AT = "2026-04-30T00:00:00.000Z";

const GRAPH_NODE_DEFINITIONS: GraphNodeDefinition[] = [
	{
		bodyPreview: "A reusable canvas renderer with pan, zoom, selection, and animated depth.",
		id: "graph-canvas",
		kind: "concept",
		relativePath: "visual/graph/canvas.md",
		title: "Graph canvas",
	},
	{
		bodyPreview: "The editable set of flow, structure, cone, and node controls.",
		id: "graph-parameters",
		kind: "concept",
		relativePath: "visual/graph/parameters.md",
		title: "Graph parameters",
	},
	{
		bodyPreview: "Graph data shaped like Personal Graph vault nodes and relationships.",
		id: "vault-explorer",
		kind: "source",
		relativePath: "personal-graph/vault-explorer.md",
		title: "Vault explorer",
	},
	{
		bodyPreview: "Wiki pages, raw captures, synthesized notes, and entities in one graph.",
		id: "personal-graph",
		kind: "synthesis",
		relativePath: "personal-graph/index.md",
		title: "Personal Graph",
	},
	{
		bodyPreview: "Canvas drawing paths, labels, rays, node shapes, and active edges.",
		id: "renderer",
		kind: "concept",
		relativePath: "visual/graph/renderer.md",
		title: "Renderer",
	},
	{
		bodyPreview: "Stable node placement with relaxation, repulsion, perspective, and motion.",
		id: "layout",
		kind: "concept",
		relativePath: "visual/graph/layout.md",
		title: "Layout",
	},
	{
		bodyPreview: "World-to-viewport transforms that keep zoom and focus interactions predictable.",
		id: "camera",
		kind: "concept",
		relativePath: "visual/graph/camera.md",
		title: "Camera",
	},
	{
		bodyPreview: "Hit testing, drag thresholds, wheel zoom, and node selection behavior.",
		id: "interaction",
		kind: "concept",
		relativePath: "visual/graph/interaction.md",
		title: "Interaction",
	},
	{
		bodyPreview: "Light and dark palette switching through the app theme wrapper.",
		id: "theme",
		kind: "entity",
		relativePath: "visual/graph/theme.md",
		title: "Theme",
	},
	{
		bodyPreview: "Reader notes and backlinks that become graph edges.",
		id: "wiki-links",
		kind: "source",
		relativePath: "vault/wiki-links.md",
		title: "Wiki links",
	},
	{
		bodyPreview: "Captured source material before it is summarized into wiki pages.",
		id: "raw-sources",
		kind: "raw",
		relativePath: "raw/sources.md",
		title: "Raw sources",
	},
	{
		bodyPreview: "QMD search and summary results that add context around selected nodes.",
		id: "qmd-summaries",
		kind: "entity",
		relativePath: "personal-graph/qmd-summaries.md",
		title: "QMD summaries",
	},
	{
		bodyPreview: "Source capture, ingestion, and refresh controls around the graph.",
		id: "capture-flow",
		kind: "entity",
		relativePath: "personal-graph/capture-flow.md",
		title: "Capture flow",
	},
	{
		bodyPreview: "Screen-reader fallback content for the same nodes and edges.",
		id: "accessibility",
		kind: "concept",
		relativePath: "visual/graph/accessibility.md",
		title: "Accessibility",
	},
];

const GRAPH_EDGE_DEFINITIONS: GraphEdgeDefinition[] = [
	{ label: "renders", source: "personal-graph", target: "graph-canvas" },
	{ label: "uses", source: "graph-canvas", target: "renderer" },
	{ label: "projects", source: "graph-canvas", target: "layout" },
	{ label: "frames", source: "graph-canvas", target: "camera" },
	{ label: "handles", source: "graph-canvas", target: "interaction" },
	{ label: "tunes", source: "graph-parameters", target: "layout" },
	{ label: "styles", source: "graph-parameters", target: "renderer" },
	{ label: "colors", source: "theme", target: "renderer", kind: "frontmatter_source" },
	{ label: "feeds", source: "vault-explorer", target: "personal-graph" },
	{ label: "links", source: "wiki-links", target: "vault-explorer" },
	{ label: "captures", source: "raw-sources", target: "capture-flow" },
	{ label: "summarizes", source: "capture-flow", target: "qmd-summaries" },
	{ label: "enriches", source: "qmd-summaries", target: "personal-graph" },
	{ label: "describes", source: "accessibility", target: "personal-graph" },
	{ label: "focuses", source: "interaction", target: "camera" },
	{ label: "selects", source: "interaction", target: "graph-parameters" },
];

function countConnections(nodeId: string) {
	return GRAPH_EDGE_DEFINITIONS.filter((edge) => edge.source === nodeId || edge.target === nodeId).length;
}

function buildVisualGraphExplorer(): VaultExplorer {
	const nodes = GRAPH_NODE_DEFINITIONS.map((node) => {
		const connectionCount = countConnections(node.id);
		const wikiLinks = GRAPH_EDGE_DEFINITIONS
			.filter((edge) => edge.source === node.id)
			.map((edge) => edge.target);

		return {
			bodyPreview: node.bodyPreview,
			connectionCount,
			dangling: false,
			frontmatter: { visual: "graph" },
			id: node.id,
			kind: node.kind,
			label: node.title,
			missing: false,
			path: null,
			relativePath: node.relativePath,
			size: Math.max(1, connectionCount),
			slug: node.id,
			title: node.title,
			updatedAt: GENERATED_AT,
			wikiLinks,
		};
	});
	const edges = GRAPH_EDGE_DEFINITIONS.map((edge, index) => {
		const kind = edge.kind ?? "wiki_link";
		return {
			id: `graph-edge-${index + 1}`,
			kind,
			label: edge.label,
			metadata: { visual: "graph" },
			relationKinds: [kind],
			source: edge.source,
			target: edge.target,
		};
	});

	return {
		edges,
		generatedAt: GENERATED_AT,
		nodes,
		stats: {
			danglingCount: 0,
			edgeCount: edges.length,
			nodeCount: nodes.length,
			rawCount: nodes.filter((node) => node.kind === "raw").length,
			wikiCount: nodes.filter((node) => node.kind !== "raw").length,
		},
	};
}

export const VISUAL_GRAPH_EXPLORER = buildVisualGraphExplorer();

interface GraphControlsProps {
	onChange: (params: NeuralGraphParams) => void;
	params: NeuralGraphParams;
}

function GraphControls({ onChange, params }: Readonly<GraphControlsProps>) {
	function updateParam(key: keyof NeuralGraphParams, value: number | string) {
		onChange(clampNeuralGraphParams({ ...params, [key]: value }));
	}

	return (
		<GUI.Panel title="Graph controls" values={{ ...params }}>
			{NEURAL_GRAPH_PARAM_SECTIONS.map((section, sectionIndex) => (
				<GUI.Section
					borderTop={sectionIndex > 0}
					key={section.id}
					title={section.label}
				>
					{section.params.map((definition) => {
						const value = params[definition.key];
						const defaultValue = DEFAULT_NEURAL_GRAPH_PARAMS[definition.key];
						if (typeof value !== "number" || typeof defaultValue !== "number") {
							return null;
						}

						return (
							<GUI.Control
								defaultValue={defaultValue}
								id={`graph-${definition.key}`}
								key={definition.key}
								label={definition.label}
								max={definition.max}
								min={definition.min}
								onChange={(nextValue) => updateParam(definition.key, nextValue)}
								step={definition.step}
								value={value}
							/>
						);
					})}
				</GUI.Section>
			))}

			<GUI.Section title="Node style">
				<GUI.TextInput
					id="graph-node-color"
					label="Node color"
					value={params.nodeColor}
					onChange={(nextColor) => updateParam("nodeColor", nextColor)}
				/>
				<GUI.Select
					id="graph-node-shape"
					label="Node shape"
					value={params.nodeShape}
					options={NODE_SHAPE_OPTIONS}
					onChange={(nextShape) => updateParam("nodeShape", nextShape)}
				/>
			</GUI.Section>
		</GUI.Panel>
	);
}

export default function Graph({
	className,
	explorer = VISUAL_GRAPH_EXPLORER,
	initialParams = DEFAULT_NEURAL_GRAPH_PARAMS,
	initialSelectedNodeId = null,
	showControls = true,
	style,
	...props
}: Readonly<GraphProps>) {
	const [params, setParams] = useState<NeuralGraphParams>(() => clampNeuralGraphParams(initialParams));
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId);

	const handleClearSelection = useCallback(() => {
		setSelectedNodeId(null);
	}, []);
	const handleSelectNode = useCallback((nodeId: string) => {
		setSelectedNodeId(nodeId);
	}, []);
	const handleParamsChange = useCallback((nextParams: NeuralGraphParams) => {
		setParams(clampNeuralGraphParams(nextParams));
	}, []);

	return (
		<div
			className={cn(
				"flex w-full max-w-2xl flex-col",
				className,
			)}
			data-visual-graph="true"
			style={{ gap: token("space.400"), ...style }}
			{...props}
		>
			<div
				className="w-full overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<div className="h-[min(70svh,520px)] min-h-[420px] overflow-hidden bg-surface">
					<PersonalGraphNeuralCanvas
						explorer={explorer}
						isLoading={false}
						onClearSelection={handleClearSelection}
						onSelectNode={handleSelectNode}
						params={params}
						selectedNodeId={selectedNodeId}
					/>
				</div>
			</div>

			{showControls ? (
				<GraphControls onChange={handleParamsChange} params={params} />
			) : null}
		</div>
	);
}
