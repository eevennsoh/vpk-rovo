"use client";

import { useCallback, useMemo, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import CrossIcon from "@atlaskit/icon/core/cross";
import UndoIcon from "@atlaskit/icon/core/undo";
import { PersonalGraphNeuralCanvas } from "@/components/arts/personal-graph/personal-graph-neural-canvas";
import {
	NEURAL_GRAPH_COLOR_TOKEN_OPTIONS,
	getNeuralGraphColorTokenOption,
} from "@/components/arts/personal-graph/lib/neural-graph/colors";
import {
	DEFAULT_NEURAL_GRAPH_PARAMS,
	NEURAL_GRAPH_PARAM_SECTIONS,
	clampNeuralGraphParams,
	type NeuralGraphColorKey,
	type NeuralGraphParams,
	type NeuralGraphNodeShape,
} from "@/components/arts/personal-graph/lib/neural-graph/params";
import type { NeuralGraphThemeMode } from "@/components/arts/personal-graph/lib/neural-graph/renderer";
import type {
	VaultEdgeKind,
	VaultExplorer,
	VaultNode,
	VaultNodeKind,
} from "@/components/arts/personal-graph/lib/personal-graph-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { GUI, useGUIValueKeys } from "@/components/utils/gui";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

interface GraphProps extends Omit<ComponentProps<"div">, "children"> {
	background?: "default" | "transparent";
	explorer?: VaultExplorer | null;
	initialParams?: Partial<NeuralGraphParams>;
	initialSelectedNodeId?: string | null;
	isLoading?: boolean;
	onParamsChange?: (params: NeuralGraphParams) => void;
	onSelectedNodeIdChange?: (nodeId: string | null) => void;
	params?: NeuralGraphParams;
	rayOriginBottomOffset?: number;
	selectedNodeId?: string | null;
	showSelectionOverlay?: boolean;
	showControls?: boolean;
	themeMode?: NeuralGraphThemeMode;
	variant?: "demo" | "fill";
}

interface GraphNodeDefinition {
	bodyPreview: string;
	color: string;
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

const ROVO_GRAPH_COLORS = {
	blue: "var(--ds-icon-accent-blue)",
	default: "var(--ds-icon)",
	gray: "var(--ds-icon-accent-gray)",
	lime: "var(--ds-icon-accent-lime)",
	orange: "var(--ds-icon-accent-orange)",
	purple: "var(--ds-icon-accent-purple)",
	surface: "var(--ds-surface)",
} as const;

export const ROVO_GRAPH_DEFAULT_PARAMS: NeuralGraphParams = clampNeuralGraphParams({
	...DEFAULT_NEURAL_GRAPH_PARAMS,
	amplitude: 0.2,
	colorConcept: ROVO_GRAPH_COLORS.orange,
	colorEntity: ROVO_GRAPH_COLORS.lime,
	colorRaw: ROVO_GRAPH_COLORS.gray,
	colorSource: ROVO_GRAPH_COLORS.blue,
	colorSynthesis: ROVO_GRAPH_COLORS.purple,
	coneAngle: 92,
	depthZ: 42,
	edgeColor: ROVO_GRAPH_COLORS.gray,
	edgeHoverColor: ROVO_GRAPH_COLORS.gray,
	edgeOpacity: 0.2,
	edgeOpacityActive: 1,
	edgeSelectedColor: ROVO_GRAPH_COLORS.gray,
	edgeWidth: 2,
	frequency: 1.2,
	glowIntensity: 0,
	glowSize: 1,
	hoverScale: 1.5,
	labelMetaSize: 10,
	labelSize: 13,
	maxVisibleNodes: 96,
	nodeColor: ROVO_GRAPH_COLORS.default,
	nodeOpacity: 1,
	nodeOpacityFocused: 1,
	nodeOpacityRelated: 1,
	nodeRadius: 0,
	nodeShape: "square",
	nodeSize: 8,
	octaves: 3,
	originMarkerColor: ROVO_GRAPH_COLORS.default,
	originMarkerSize: 12,
	originOffset: 0,
	originY: 0.8,
	perspective: 1000,
	radiusMax: 100,
	radiusMin: 60,
	rayColor: ROVO_GRAPH_COLORS.gray,
	rayElasticDamping: 24,
	rayElasticRadius: 96,
	rayElasticStrength: 26,
	rayElasticTension: 220,
	rayOpacity: 0.02,
	rayOriginY: 1,
	rayWidth: 2,
	selectedScale: 1.5,
	showEdges: true,
	showLabels: true,
	showOriginMarker: true,
	showRays: true,
	showSignals: true,
	signalColor: ROVO_GRAPH_COLORS.default,
	signalFrequency: 0.5,
	signalGlowEnabled: false,
	signalLength: 0.5,
	signalOpacity: 1,
	signalWidth: 1,
	speed: 0.7,
	spread: 600,
	tiltX: -4,
	tiltZ: -6,
});

const NODE_SHAPE_OPTIONS = [
	{ value: "circle", label: "Circle" },
	{ value: "square", label: "Square" },
] as const satisfies ReadonlyArray<{ value: NeuralGraphNodeShape; label: string }>;

const GENERATED_AT = "2026-04-30T00:00:00.000Z";

const GRAPH_NODE_DEFINITIONS: GraphNodeDefinition[] = [
	{
		bodyPreview: "Signals from projects, pages, decisions, and people stitched into one living business map.",
		color: ROVO_GRAPH_COLORS.default,
		id: "teamwork-graph",
		kind: "synthesis",
		relativePath: "rovo/teamwork-graph.md",
		title: "Teamwork Graph",
	},
	{
		bodyPreview: "Natural-language answers grounded in the work graph rather than a detached chat history.",
		color: ROVO_GRAPH_COLORS.default,
		id: "rovo-chat",
		kind: "concept",
		relativePath: "rovo/chat.md",
		title: "Rovo Chat",
	},
	{
		bodyPreview: "A way to find the right artifact, owner, or decision across connected work systems.",
		color: ROVO_GRAPH_COLORS.default,
		id: "rovo-search",
		kind: "concept",
		relativePath: "rovo/search.md",
		title: "Rovo Search",
	},
	{
		bodyPreview: "Automated assistants that can inspect context, take action, and hand work back clearly.",
		color: ROVO_GRAPH_COLORS.default,
		id: "rovo-agents",
		kind: "concept",
		relativePath: "rovo/agents.md",
		title: "Rovo Agents",
	},
	{
		bodyPreview: "Issue state, ownership, sprint shape, and blockers feeding the graph as operational signal.",
		color: ROVO_GRAPH_COLORS.default,
		id: "jira-work",
		kind: "source",
		relativePath: "sources/jira-work.md",
		title: "Jira work",
	},
	{
		bodyPreview: "Plans, briefs, retros, and decisions that give the graph long-form team memory.",
		color: ROVO_GRAPH_COLORS.default,
		id: "confluence-pages",
		kind: "source",
		relativePath: "sources/confluence-pages.md",
		title: "Confluence pages",
	},
	{
		bodyPreview: "Shared outcomes that help Rovo understand why the work matters, not just what changed.",
		color: ROVO_GRAPH_COLORS.default,
		id: "project-goals",
		kind: "entity",
		relativePath: "work/project-goals.md",
		title: "Project goals",
	},
	{
		bodyPreview: "The people, owners, reviewers, and experts connected to each work artifact.",
		color: ROVO_GRAPH_COLORS.default,
		id: "team-owners",
		kind: "entity",
		relativePath: "work/team-owners.md",
		title: "Team owners",
	},
	{
		bodyPreview: "Recorded tradeoffs that let follow-up answers explain the path, not just the final result.",
		color: ROVO_GRAPH_COLORS.default,
		id: "decisions",
		kind: "concept",
		relativePath: "knowledge/decisions.md",
		title: "Decisions",
	},
	{
		bodyPreview: "Documents and discussion distilled into reusable context cards for quick recall.",
		color: ROVO_GRAPH_COLORS.default,
		id: "knowledge-cards",
		kind: "synthesis",
		relativePath: "knowledge/cards.md",
		title: "Knowledge cards",
	},
	{
		bodyPreview: "Customer notes, support themes, and requests that connect external need to internal work.",
		color: ROVO_GRAPH_COLORS.default,
		id: "customer-insights",
		kind: "raw",
		relativePath: "raw/customer-insights.md",
		title: "Customer insights",
	},
	{
		bodyPreview: "Near-real-time team discussion that helps identify emerging questions and unresolved blockers.",
		color: ROVO_GRAPH_COLORS.default,
		id: "team-signals",
		kind: "source",
		relativePath: "sources/team-signals.md",
		title: "Team signals",
	},
	{
		bodyPreview: "Milestones, risk, ownership, and launch readiness tied back to decisions and active work.",
		color: ROVO_GRAPH_COLORS.default,
		id: "release-plan",
		kind: "entity",
		relativePath: "work/release-plan.md",
		title: "Release plan",
	},
	{
		bodyPreview: "Signals from status pages, tickets, and postmortems connected to active remediation work.",
		color: ROVO_GRAPH_COLORS.default,
		id: "incident-context",
		kind: "raw",
		relativePath: "raw/incident-context.md",
		title: "Incident context",
	},
	{
		bodyPreview: "Reusable playbooks that connect prior decisions to the next best operational step.",
		color: ROVO_GRAPH_COLORS.default,
		id: "playbooks",
		kind: "synthesis",
		relativePath: "knowledge/playbooks.md",
		title: "Playbooks",
	},
	{
		bodyPreview: "A visible trail showing which sources shaped the answer and what should be checked next.",
		color: ROVO_GRAPH_COLORS.default,
		id: "grounded-response",
		kind: "concept",
		relativePath: "rovo/grounded-response.md",
		title: "Grounded response",
	},
];

const GRAPH_EDGE_DEFINITIONS: GraphEdgeDefinition[] = [
	{ label: "grounds", source: "teamwork-graph", target: "rovo-chat" },
	{ label: "grounds", source: "teamwork-graph", target: "rovo-search" },
	{ label: "guides", source: "teamwork-graph", target: "rovo-agents" },
	{ label: "indexes", source: "jira-work", target: "teamwork-graph" },
	{ label: "indexes", source: "confluence-pages", target: "teamwork-graph" },
	{ label: "aligns", source: "project-goals", target: "jira-work" },
	{ label: "owns", source: "team-owners", target: "jira-work" },
	{ label: "records", source: "decisions", target: "confluence-pages" },
	{ label: "summarizes", source: "knowledge-cards", target: "confluence-pages" },
	{ label: "answers", source: "knowledge-cards", target: "rovo-chat" },
	{ label: "finds", source: "rovo-search", target: "knowledge-cards" },
	{ label: "acts", source: "rovo-agents", target: "playbooks" },
	{ label: "prepares", source: "release-plan", target: "project-goals" },
	{ label: "informs", source: "customer-insights", target: "project-goals", kind: "frontmatter_source" },
	{ label: "raises", source: "team-signals", target: "decisions" },
	{ label: "explains", source: "incident-context", target: "playbooks", kind: "frontmatter_source" },
	{ label: "cites", source: "grounded-response", target: "teamwork-graph" },
	{ label: "cites", source: "grounded-response", target: "decisions" },
	{ label: "routes", source: "rovo-agents", target: "team-owners" },
	{ label: "checks", source: "release-plan", target: "incident-context" },
];

const GRAPH_NODE_MARKER_CLASSES: Record<VaultNodeKind, string> = {
	concept: "rotate-45 rounded-[2px]",
	entity: "rounded-full",
	raw: "rounded-[2px]",
	source: "rounded-full",
	synthesis: "rotate-45 rounded-[2px]",
};

const GRAPH_KIND_COLORS: Record<VaultNodeKind, string> = {
	concept: ROVO_GRAPH_COLORS.default,
	entity: ROVO_GRAPH_COLORS.default,
	raw: ROVO_GRAPH_COLORS.default,
	source: ROVO_GRAPH_COLORS.default,
	synthesis: ROVO_GRAPH_COLORS.default,
};

const GRAPH_STAGE_STYLE = {
	backgroundColor: ROVO_GRAPH_COLORS.surface,
	boxShadow: token("elevation.shadow.raised"),
} satisfies CSSProperties;

const GRAPH_DETAILS_PANEL_STYLE = {
	backgroundColor: "color-mix(in srgb, var(--ds-surface-overlay) 94%, transparent)",
	boxShadow: token("elevation.shadow.overlay"),
	color: "var(--ds-text)",
} satisfies CSSProperties;

function GraphNodeMarker({
	className,
	kind,
}: Readonly<{
	className?: string;
	kind: VaultNodeKind;
}>) {
	return (
		<span
			aria-hidden="true"
			className={cn("inline-block size-2.5 shrink-0", GRAPH_NODE_MARKER_CLASSES[kind], className)}
			style={{ backgroundColor: GRAPH_KIND_COLORS[kind] }}
		/>
	);
}

function getSelectedGraphNode(explorer: VaultExplorer | null, selectedNodeId: string | null) {
	if (!explorer || !selectedNodeId) return null;
	return explorer.nodes.find((node) => node.id === selectedNodeId) ?? null;
}

function getRelatedGraphNodes(explorer: VaultExplorer | null, node: VaultNode | null) {
	if (!explorer || !node) return [];
	const nodesById = new Map(explorer.nodes.map((candidate) => [candidate.id, candidate]));
	const relatedNodes = new Map<string, VaultNode>();

	for (const edge of explorer.edges) {
		const relatedId = edge.source === node.id ? edge.target : edge.target === node.id ? edge.source : null;
		const relatedNode = relatedId ? nodesById.get(relatedId) : null;
		if (relatedNode) {
			relatedNodes.set(relatedNode.id, relatedNode);
		}
	}

	return [...relatedNodes.values()].slice(0, 3);
}

function GraphDetailsPanel({
	explorer,
	node,
	onClose,
	onSelectNode,
}: Readonly<{
	explorer: VaultExplorer | null;
	node: VaultNode;
	onClose: () => void;
	onSelectNode: (nodeId: string) => void;
}>) {
	const relatedNodes = getRelatedGraphNodes(explorer, node);

	return (
		<aside
			aria-label="Graph node details"
			className="absolute right-4 top-4 z-20 w-[min(300px,calc(100%-32px))] rounded-md border p-4 backdrop-blur"
			style={GRAPH_DETAILS_PANEL_STYLE}
		>
			<div className="mb-4 flex items-start justify-between gap-3">
				<h2 className="line-clamp-2 text-sm font-semibold leading-5">{node.title}</h2>
				<Button
					aria-label="Close graph details"
					className="size-7 shrink-0 rounded-[2px] text-neutral-800 hover:bg-neutral-100"
					onClick={onClose}
					size="icon-sm"
					variant="ghost"
				>
					<CrossIcon label="" />
				</Button>
			</div>
			<div className="grid gap-3 border-b border-neutral-950/15 pb-4 text-sm">
				<div className="flex items-center justify-between gap-3">
					<span className="text-neutral-600">Kind</span>
					<span className="flex items-center gap-2 font-medium">
						<GraphNodeMarker kind={node.kind} />
						{node.kind.replaceAll("_", " ")}
					</span>
				</div>
				<div className="flex items-center justify-between gap-3">
					<span className="text-neutral-600">Links</span>
					<span className="font-medium">{node.connectionCount}</span>
				</div>
			</div>
			<div className="border-b border-neutral-950/15 py-4">
				<div className="mb-2 text-sm text-neutral-600">Excerpt</div>
				<p className="line-clamp-4 text-sm leading-6 text-neutral-800">{node.bodyPreview || node.relativePath}</p>
			</div>
			{relatedNodes.length > 0 ? (
				<div className="pt-4">
					<div className="mb-2 text-sm text-neutral-600">Related pages</div>
					<div className="space-y-2">
						{relatedNodes.map((relatedNode) => (
							<button
								className="flex w-full items-center justify-between gap-3 rounded-[2px] border border-neutral-950/15 px-3 py-2 text-left text-sm text-neutral-950 transition-colors duration-normal ease-out hover:bg-neutral-100"
								key={relatedNode.id}
								onClick={() => onSelectNode(relatedNode.id)}
								style={{ backgroundColor: ROVO_GRAPH_COLORS.surface }}
								type="button"
							>
								<span className="flex min-w-0 items-center gap-2">
									<GraphNodeMarker kind={relatedNode.kind} />
									<span className="truncate">{relatedNode.title}</span>
								</span>
								<ChevronRightIcon label="" />
							</button>
						))}
					</div>
				</div>
			) : null}
		</aside>
	);
}

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
			frontmatter: { graphColor: node.color, visual: "graph" },
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
	defaultParams: NeuralGraphParams;
	onChange: (params: NeuralGraphParams) => void;
	params: NeuralGraphParams;
}

interface GraphColorTokenControlProps {
	defaultValue: string;
	description?: string;
	id: string;
	label: string;
	onChange: (nextColor: string) => void;
	value: string;
	valueKey: NeuralGraphColorKey;
}

function getComparableGraphColorValue(value: string): string {
	return getNeuralGraphColorTokenOption(value)?.value ?? value.trim().toLowerCase();
}

function GraphColorTokenControl({
	defaultValue,
	description,
	id,
	label,
	onChange,
	value,
	valueKey,
}: Readonly<GraphColorTokenControlProps>) {
	useGUIValueKeys(valueKey);
	const selectedOption = getNeuralGraphColorTokenOption(value)
		?? getNeuralGraphColorTokenOption(defaultValue)
		?? NEURAL_GRAPH_COLOR_TOKEN_OPTIONS[0];
	const defaultOption = getNeuralGraphColorTokenOption(defaultValue);
	const isDefault = getComparableGraphColorValue(value) === getComparableGraphColorValue(defaultValue);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Label htmlFor={`${id}-select`} className="text-xs font-medium text-text">
					{label}
				</Label>
				<div className="ml-auto">
					<button
						type="button"
						aria-label={`Reset ${label}`}
						disabled={isDefault}
						onClick={() => onChange(defaultValue)}
						className="flex size-7 shrink-0 items-center justify-center rounded text-icon-subtle transition-colors hover:bg-bg-neutral hover:text-icon disabled:pointer-events-none disabled:opacity-0"
					>
						<UndoIcon label="" size="small" />
					</button>
				</div>
			</div>
			<Select
				value={selectedOption.value}
				onValueChange={(nextValue) => {
					if (typeof nextValue === "string") {
						onChange(nextValue);
					}
				}}
			>
				<SelectTrigger
					id={`${id}-select`}
					size="sm"
					className="w-full min-w-0"
				>
					<SelectValue className="min-w-0">
						<span className="flex min-w-0 items-center gap-2">
							<span
								aria-hidden="true"
								className="size-3 shrink-0 rounded-full border border-border"
								style={{ backgroundColor: selectedOption.value }}
							/>
							<span className="truncate">{selectedOption.label}</span>
						</span>
					</SelectValue>
				</SelectTrigger>
				<SelectContent align="start" className="min-w-64">
					<SelectGroup>
						{NEURAL_GRAPH_COLOR_TOKEN_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								<span
									aria-hidden="true"
									className="size-3 shrink-0 self-center rounded-full border border-border"
									style={{ backgroundColor: option.value }}
								/>
								<span className="flex min-w-0 flex-col">
									<span className="truncate">{option.label}</span>
									<span className="truncate font-mono text-[11px] text-text-subtlest">
										{option.token}
									</span>
								</span>
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
			<div className="space-y-1">
				{description ? (
					<p className="text-[12px] leading-4 text-text-subtlest">
						{description}
					</p>
				) : null}
				<p className="font-mono text-[11px] leading-4 text-text-subtlest">
					{selectedOption.token} · {selectedOption.lightHex}
					{defaultOption && defaultOption.value !== selectedOption.value ? ` · default ${defaultOption.token}` : ""}
				</p>
			</div>
		</div>
	);
}

function GraphControls({ defaultParams, onChange, params }: Readonly<GraphControlsProps>) {
	function updateParam(key: keyof NeuralGraphParams, value: number | string | boolean) {
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
						if (definition.kind === "boolean") {
							const value = params[definition.key];
							return (
								<GUI.Toggle
									checked={value}
									id={`graph-${definition.key}`}
									key={definition.key}
									label={definition.label}
									onChange={(nextValue) => updateParam(definition.key, nextValue)}
								/>
							);
						}

						if (definition.kind === "color") {
							const value = params[definition.key];
							const defaultValue = defaultParams[definition.key];
							return (
								<GraphColorTokenControl
									id={`graph-${definition.key}`}
									key={definition.key}
									label={definition.label}
									description={definition.description}
									value={value}
									defaultValue={defaultValue}
									valueKey={definition.key}
									onChange={(nextColor) => updateParam(definition.key, nextColor)}
								/>
							);
						}

						const value = params[definition.key];
						const defaultValue = defaultParams[definition.key];
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
								unit={definition.unit}
								value={value}
							/>
						);
					})}
				</GUI.Section>
			))}

			<GUI.Section borderTop title="Node type colors">
				<GraphColorTokenControl
					id="graph-color-synthesis"
					label="Synthesis"
					description="Distilled outputs (graph, knowledge cards, playbooks)"
					value={params.colorSynthesis}
					defaultValue={defaultParams.colorSynthesis}
					valueKey="colorSynthesis"
					onChange={(nextColor) => updateParam("colorSynthesis", nextColor)}
				/>
				<GraphColorTokenControl
					id="graph-color-concept"
					label="Concept"
					description="Ideas and abstractions (chat, search, decisions)"
					value={params.colorConcept}
					defaultValue={defaultParams.colorConcept}
					valueKey="colorConcept"
					onChange={(nextColor) => updateParam("colorConcept", nextColor)}
				/>
				<GraphColorTokenControl
					id="graph-color-source"
					label="Source"
					description="External feeders (Jira, Confluence, signals)"
					value={params.colorSource}
					defaultValue={defaultParams.colorSource}
					valueKey="colorSource"
					onChange={(nextColor) => updateParam("colorSource", nextColor)}
				/>
				<GraphColorTokenControl
					id="graph-color-entity"
					label="Entity"
					description="Owners, goals, and named things"
					value={params.colorEntity}
					defaultValue={defaultParams.colorEntity}
					valueKey="colorEntity"
					onChange={(nextColor) => updateParam("colorEntity", nextColor)}
				/>
				<GraphColorTokenControl
					id="graph-color-raw"
					label="Raw"
					description="Unprocessed material (insights, incidents)"
					value={params.colorRaw}
					defaultValue={defaultParams.colorRaw}
					valueKey="colorRaw"
					onChange={(nextColor) => updateParam("colorRaw", nextColor)}
				/>
				<GraphColorTokenControl
					id="graph-node-color"
					label="Idle"
					description="Default node fill before hover or selection reveals type colors"
					value={params.nodeColor}
					defaultValue={defaultParams.nodeColor}
					valueKey="nodeColor"
					onChange={(nextColor) => updateParam("nodeColor", nextColor)}
				/>
			</GUI.Section>

			<GUI.Section borderTop title="Node style">
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
	background = "transparent",
	className,
	explorer = VISUAL_GRAPH_EXPLORER,
	initialParams = ROVO_GRAPH_DEFAULT_PARAMS,
	initialSelectedNodeId = null,
	isLoading = false,
	onParamsChange,
	onSelectedNodeIdChange,
	params: controlledParams,
	rayOriginBottomOffset,
	selectedNodeId: controlledSelectedNodeId,
	showSelectionOverlay = false,
	showControls = true,
	style,
	themeMode,
	variant = "demo",
	...props
}: Readonly<GraphProps>) {
	const initialParamsRef = useRef(initialParams);
	const initialSelectedNodeIdRef = useRef(initialSelectedNodeId);
	const defaultParams = useMemo(() => clampNeuralGraphParams(initialParamsRef.current), []);
	const [uncontrolledParams, setUncontrolledParams] = useState<NeuralGraphParams>(() => defaultParams);
	const [uncontrolledSelectedNodeId, setUncontrolledSelectedNodeId] = useState<string | null>(initialSelectedNodeIdRef.current);
	const isFillVariant = variant === "fill";
	const hasTransparentBackground = background === "transparent";
	const fillVariantBackgroundClass = hasTransparentBackground ? "bg-transparent" : "bg-surface";
	const previewBackgroundClass = isFillVariant ? fillVariantBackgroundClass : null;
	const canvasThemeMode = themeMode ?? (!isFillVariant && hasTransparentBackground ? "light" : undefined);
	const isParamsControlled = controlledParams !== undefined;
	const isSelectionControlled = controlledSelectedNodeId !== undefined;
	const rawParams = controlledParams ?? uncontrolledParams;
	const params = useMemo(() => clampNeuralGraphParams(rawParams), [rawParams]);
	const selectedNodeId = isSelectionControlled ? controlledSelectedNodeId ?? null : uncontrolledSelectedNodeId;
	const selectedNode = useMemo(() => getSelectedGraphNode(explorer, selectedNodeId), [explorer, selectedNodeId]);

	const handleClearSelection = useCallback(() => {
		if (!isSelectionControlled) {
			setUncontrolledSelectedNodeId(null);
		}
		onSelectedNodeIdChange?.(null);
	}, [isSelectionControlled, onSelectedNodeIdChange]);
	const handleSelectNode = useCallback((nodeId: string) => {
		if (!isSelectionControlled) {
			setUncontrolledSelectedNodeId(nodeId);
		}
		onSelectedNodeIdChange?.(nodeId);
	}, [isSelectionControlled, onSelectedNodeIdChange]);
	const handleParamsChange = useCallback((nextParams: NeuralGraphParams) => {
		const clampedParams = clampNeuralGraphParams(nextParams);
		if (!isParamsControlled) {
			setUncontrolledParams(clampedParams);
		}
		onParamsChange?.(clampedParams);
	}, [isParamsControlled, onParamsChange]);

	return (
		<div
			className={cn(
				isFillVariant ? "flex h-full w-full flex-col" : "mx-auto flex w-full max-w-4xl flex-col",
				className,
			)}
			data-visual-graph="true"
			style={{ gap: token("space.400"), ...style }}
			{...props}
		>
			<div
				className={cn(
					isFillVariant
						? "min-h-0 flex-1 overflow-hidden"
						: "relative w-full overflow-hidden rounded-lg border border-border",
					previewBackgroundClass,
				)}
				style={isFillVariant ? undefined : GRAPH_STAGE_STYLE}
			>
				<div
					className={cn(
						isFillVariant
							? "h-full min-h-0 overflow-hidden"
							: "relative h-[min(70svh,560px)] min-h-[440px] overflow-hidden",
						isFillVariant ? fillVariantBackgroundClass : null,
					)}
				>
					<div className="relative z-10 h-full">
						<PersonalGraphNeuralCanvas
							background={background}
							explorer={explorer}
							isLoading={isLoading}
							onClearSelection={handleClearSelection}
							onSelectNode={handleSelectNode}
							params={params}
							rayOriginBottomOffset={rayOriginBottomOffset}
							selectedNodeId={selectedNodeId}
							showSelectionOverlay={showSelectionOverlay}
							themeMode={canvasThemeMode}
						/>
					</div>
				</div>
				{selectedNode && !isFillVariant && !showSelectionOverlay ? (
					<GraphDetailsPanel
						explorer={explorer}
						node={selectedNode}
						onClose={handleClearSelection}
						onSelectNode={handleSelectNode}
					/>
				) : null}
			</div>

			{showControls ? (
				<GraphControls defaultParams={defaultParams} onChange={handleParamsChange} params={params} />
			) : null}
		</div>
	);
}
