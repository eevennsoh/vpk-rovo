import { normalizeNeuralGraphColorValue } from "./colors";

export type NeuralGraphNodeShape = "circle" | "square";
export type NeuralGraphLayoutShape = "cone" | "radialCluster";

export interface NeuralGraphParams {
	amplitude: number;
	colorConcept: string;
	colorEntity: string;
	colorRaw: string;
	colorSource: string;
	colorSynthesis: string;
	coneAngle: number;
	depthZ: number;
	edgeColor: string;
	edgeHoverColor: string;
	edgeOpacity: number;
	edgeOpacityActive: number;
	edgeSelectedColor: string;
	edgeWidth: number;
	frequency: number;
	glowIntensity: number;
	glowSize: number;
	hoverScale: number;
	labelMetaSize: number;
	labelSize: number;
	layoutShape: NeuralGraphLayoutShape;
	maxVisibleNodes: number;
	nodeColor: string;
	nodeHoverColor: string;
	nodeOpacity: number;
	nodeOpacityFocused: number;
	nodeOpacityRelated: number;
	nodeSelectedColor: string;
	nodeRadius: number;
	nodeShape: NeuralGraphNodeShape;
	nodeSize: number;
	octaves: number;
	originMarkerColor: string;
	originMarkerSize: number;
	originOffset: number;
	originY: number;
	perspective: number;
	radiusMax: number;
	radiusMin: number;
	rayColor: string;
	rayElasticDamping: number;
	rayElasticRadius: number;
	rayElasticStrength: number;
	rayElasticTension: number;
	rayOpacity: number;
	rayOriginY: number;
	rayWidth: number;
	radialArcAngle: number;
	radialDepthCurve: number;
	selectedScale: number;
	showEdges: boolean;
	showLabels: boolean;
	showOriginMarker: boolean;
	showRays: boolean;
	showSignals: boolean;
	signalColor: string;
	signalFrequency: number;
	signalGlowEnabled: boolean;
	signalLength: number;
	signalOpacity: number;
	signalWidth: number;
	speed: number;
	spread: number;
	tiltX: number;
	tiltZ: number;
}

export const NEURAL_GRAPH_KIND_COLOR_PARAM_KEYS = [
	"colorConcept",
	"colorEntity",
	"colorRaw",
	"colorSource",
	"colorSynthesis",
] as const satisfies ReadonlyArray<keyof NeuralGraphParams>;

export const NEURAL_GRAPH_NODE_COLOR_PARAM_KEYS = [
	"nodeColor",
	"nodeHoverColor",
	"nodeSelectedColor",
] as const satisfies ReadonlyArray<keyof NeuralGraphParams>;

export const NEURAL_GRAPH_EDGE_COLOR_PARAM_KEYS = [
	"edgeColor",
	"edgeHoverColor",
	"edgeSelectedColor",
] as const satisfies ReadonlyArray<keyof NeuralGraphParams>;

export const NEURAL_GRAPH_ORIGIN_COLOR_PARAM_KEYS = [
	"originMarkerColor",
] as const satisfies ReadonlyArray<keyof NeuralGraphParams>;

export const NEURAL_GRAPH_SIGNAL_COLOR_PARAM_KEYS = [
	"signalColor",
] as const satisfies ReadonlyArray<keyof NeuralGraphParams>;

export type NeuralGraphNumberKey = {
	[K in keyof NeuralGraphParams]: NeuralGraphParams[K] extends number ? K : never;
}[keyof NeuralGraphParams];

export type NeuralGraphBooleanKey = {
	[K in keyof NeuralGraphParams]: NeuralGraphParams[K] extends boolean ? K : never;
}[keyof NeuralGraphParams];

export type NeuralGraphColorKey =
	| (typeof NEURAL_GRAPH_KIND_COLOR_PARAM_KEYS)[number]
	| (typeof NEURAL_GRAPH_NODE_COLOR_PARAM_KEYS)[number]
	| (typeof NEURAL_GRAPH_EDGE_COLOR_PARAM_KEYS)[number]
	| (typeof NEURAL_GRAPH_ORIGIN_COLOR_PARAM_KEYS)[number]
	| (typeof NEURAL_GRAPH_SIGNAL_COLOR_PARAM_KEYS)[number]
	| "rayColor";

const NEURAL_GRAPH_COLOR_PARAM_KEYS = [
	"rayColor",
	...NEURAL_GRAPH_ORIGIN_COLOR_PARAM_KEYS,
	...NEURAL_GRAPH_SIGNAL_COLOR_PARAM_KEYS,
	...NEURAL_GRAPH_KIND_COLOR_PARAM_KEYS,
	...NEURAL_GRAPH_NODE_COLOR_PARAM_KEYS,
	...NEURAL_GRAPH_EDGE_COLOR_PARAM_KEYS,
] as const satisfies ReadonlyArray<NeuralGraphColorKey>;

export interface NeuralGraphNumberParamDefinition {
	kind: "number";
	key: NeuralGraphNumberKey;
	label: string;
	max: number;
	min: number;
	step: number;
	unit?: string;
}

export interface NeuralGraphBooleanParamDefinition {
	kind: "boolean";
	key: NeuralGraphBooleanKey;
	label: string;
}

export interface NeuralGraphColorParamDefinition {
	kind: "color";
	key: NeuralGraphColorKey;
	label: string;
	description?: string;
}

export type NeuralGraphParamDefinition =
	| NeuralGraphNumberParamDefinition
	| NeuralGraphBooleanParamDefinition
	| NeuralGraphColorParamDefinition;

export interface NeuralGraphParamSection {
	id: string;
	label: string;
	params: NeuralGraphParamDefinition[];
}

export const DEFAULT_NEURAL_GRAPH_PARAMS: NeuralGraphParams = {
	amplitude: 0.15,
	colorConcept: "var(--ds-icon-accent-orange)",
	colorEntity: "var(--ds-icon-accent-lime)",
	colorRaw: "var(--ds-icon-accent-gray)",
	colorSource: "var(--ds-icon-accent-blue)",
	colorSynthesis: "var(--ds-icon-accent-purple)",
	coneAngle: 75,
	depthZ: 30,
	edgeColor: "var(--ds-icon-accent-gray)",
	edgeHoverColor: "var(--ds-icon-accent-blue)",
	edgeOpacity: 0.36,
	edgeOpacityActive: 0.76,
	edgeSelectedColor: "var(--ds-icon-accent-purple)",
	edgeWidth: 2,
	frequency: 1.1,
	glowIntensity: 0.28,
	glowSize: 4.2,
	hoverScale: 1.42,
	labelMetaSize: 10,
	labelSize: 13,
	layoutShape: "cone",
	maxVisibleNodes: 86,
	nodeColor: "var(--ds-icon)",
	nodeHoverColor: "var(--ds-icon-accent-orange)",
	nodeOpacity: 0.82,
	nodeOpacityFocused: 0.14,
	nodeOpacityRelated: 0.9,
	nodeSelectedColor: "var(--ds-icon-accent-purple)",
	nodeRadius: 2,
	nodeShape: "circle",
	nodeSize: 2.5,
	octaves: 3,
	originMarkerColor: "var(--ds-icon)",
	originMarkerSize: 12,
	originOffset: 0,
	originY: 1.05,
	perspective: 1000,
	radiusMax: 100,
	radiusMin: 50,
	rayColor: "var(--ds-icon-accent-purple)",
	rayElasticDamping: 34,
	rayElasticRadius: 96,
	rayElasticStrength: 20,
	rayElasticTension: 180,
	rayOpacity: 0.02,
	rayOriginY: 1.05,
	rayWidth: 2,
	radialArcAngle: 240,
	radialDepthCurve: 0.85,
	selectedScale: 1.85,
	showEdges: true,
	showLabels: true,
	showOriginMarker: true,
	showRays: true,
	showSignals: true,
	signalColor: "var(--ds-icon-accent-purple)",
	signalFrequency: 1,
	signalGlowEnabled: false,
	signalLength: 0.22,
	signalOpacity: 1,
	signalWidth: 3.5,
	speed: 0.8,
	spread: 520,
	tiltX: 0,
	tiltZ: 0,
};

export const NEURAL_GRAPH_PARAM_SECTIONS: NeuralGraphParamSection[] = [
	{
		id: "flow",
		label: "Flow",
		params: [
			{ kind: "number", key: "speed", label: "Speed", max: 3, min: 0, step: 0.1 },
			{ kind: "number", key: "amplitude", label: "Amplitude", max: 0.5, min: 0, step: 0.01 },
			{ kind: "number", key: "frequency", label: "Frequency", max: 5, min: 0.5, step: 0.1 },
			{ kind: "number", key: "octaves", label: "Octaves", max: 4, min: 1, step: 1 },
		],
	},
	{
		id: "structure",
		label: "Structure",
		params: [
			{ kind: "number", key: "spread", label: "Spread", max: 800, min: 100, step: 10 },
			{ kind: "number", key: "perspective", label: "Perspective", max: 2000, min: 200, step: 50 },
			{ kind: "number", key: "originY", label: "Origin Y", max: 1.5, min: 0.5, step: 0.05 },
			{ kind: "number", key: "originOffset", label: "Origin Offset", max: 200, min: -200, step: 10 },
		],
	},
	{
		id: "radial",
		label: "Radial",
		params: [
			{ kind: "number", key: "radialArcAngle", label: "Arc Angle", max: 360, min: 60, step: 1 },
			{ kind: "number", key: "radialDepthCurve", label: "Depth Curve", max: 1.5, min: 0.35, step: 0.05 },
		],
	},
	{
		id: "cone",
		label: "Cone",
		params: [
			{ kind: "number", key: "coneAngle", label: "Cone Angle", max: 180, min: 5, step: 1 },
			{ kind: "number", key: "tiltX", label: "Tilt X", max: 90, min: -90, step: 1 },
			{ kind: "number", key: "tiltZ", label: "Tilt Z", max: 90, min: -90, step: 1 },
			{ kind: "number", key: "radiusMin", label: "Radius Min %", max: 100, min: 0, step: 1 },
			{ kind: "number", key: "radiusMax", label: "Radius Max %", max: 100, min: 0, step: 1 },
			{ kind: "number", key: "depthZ", label: "Depth (Z)", max: 100, min: 0, step: 1 },
		],
	},
	{
		id: "nodes",
		label: "Nodes",
		params: [
			{ kind: "number", key: "maxVisibleNodes", label: "Count", max: 200, min: 10, step: 1 },
			{ kind: "number", key: "nodeSize", label: "Size", max: 8, min: 0.5, step: 0.5 },
			{ kind: "number", key: "nodeRadius", label: "Radius", max: 16, min: 0, step: 1, unit: "px" },
		],
	},
	{
		id: "edges",
		label: "Edges",
		params: [
			{ kind: "boolean", key: "showEdges", label: "Show edges" },
			{ kind: "color", key: "edgeColor", label: "Default color", description: "Connector color when no node is hovered or selected" },
			{ kind: "color", key: "edgeHoverColor", label: "Hover color", description: "Connector color for links touching the hovered node" },
			{ kind: "color", key: "edgeSelectedColor", label: "Selected color", description: "Connector color for links touching the selected node" },
			{ kind: "number", key: "edgeOpacity", label: "Idle opacity", max: 1, min: 0, step: 0.02 },
			{ kind: "number", key: "edgeOpacityActive", label: "Active opacity", max: 1, min: 0, step: 0.02 },
			{ kind: "number", key: "edgeWidth", label: "Width", max: 6, min: 0.5, step: 0.5 },
		],
	},
	{
		id: "signals",
		label: "Signals",
		params: [
			{ kind: "boolean", key: "showSignals", label: "Show signals" },
			{ kind: "boolean", key: "signalGlowEnabled", label: "Glow" },
			{ kind: "color", key: "signalColor", label: "Color", description: "Tint of the momentary node-to-node signal streaks" },
			{ kind: "number", key: "signalOpacity", label: "Opacity", max: 1, min: 0, step: 0.02 },
			{ kind: "number", key: "signalWidth", label: "Width", max: 10, min: 0.5, step: 0.5 },
			{ kind: "number", key: "signalFrequency", label: "Frequency", max: 4, min: 0, step: 0.1 },
			{ kind: "number", key: "signalLength", label: "Length", max: 0.6, min: 0.05, step: 0.01 },
		],
	},
	{
		id: "rays",
		label: "Rays",
		params: [
			{ kind: "boolean", key: "showRays", label: "Show rays" },
			{ kind: "boolean", key: "showOriginMarker", label: "Show origin node" },
			{ kind: "color", key: "rayColor", label: "Color", description: "Tint of the fan strokes radiating from the tail" },
			{ kind: "number", key: "rayOriginY", label: "Tail Y", max: 1.5, min: 0.5, step: 0.05 },
			{ kind: "number", key: "rayOpacity", label: "Opacity", max: 1, min: 0, step: 0.02 },
			{ kind: "number", key: "rayWidth", label: "Width", max: 6, min: 0.5, step: 0.5 },
			{ kind: "number", key: "rayElasticStrength", label: "Elastic strength", max: 80, min: 0, step: 1, unit: "px" },
			{ kind: "number", key: "rayElasticRadius", label: "Elastic radius", max: 220, min: 0, step: 2, unit: "px" },
			{ kind: "number", key: "rayElasticTension", label: "Elastic tension", max: 600, min: 60, step: 10 },
			{ kind: "number", key: "rayElasticDamping", label: "Elastic damping", max: 80, min: 6, step: 1 },
			{ kind: "number", key: "originMarkerSize", label: "Origin size", max: 32, min: 4, step: 1 },
			{ kind: "color", key: "originMarkerColor", label: "Origin color", description: "Fill color for the graph origin node" },
		],
	},
	{
		id: "hover",
		label: "Hover & selection",
		params: [
			{ kind: "number", key: "hoverScale", label: "Hover scale", max: 4, min: 1, step: 0.05 },
			{ kind: "number", key: "selectedScale", label: "Selected scale", max: 5, min: 1, step: 0.05 },
			{ kind: "number", key: "glowSize", label: "Glow size", max: 10, min: 1, step: 0.1 },
			{ kind: "number", key: "glowIntensity", label: "Glow intensity", max: 1, min: 0, step: 0.02 },
		],
	},
	{
		id: "nodeOpacity",
		label: "Node opacity",
		params: [
			{ kind: "number", key: "nodeOpacity", label: "Idle", max: 1, min: 0, step: 0.02 },
			{ kind: "number", key: "nodeOpacityRelated", label: "Related (when focused)", max: 1, min: 0, step: 0.02 },
			{ kind: "number", key: "nodeOpacityFocused", label: "Faded (when focused)", max: 1, min: 0, step: 0.02 },
		],
	},
	{
		id: "labels",
		label: "Labels",
		params: [
			{ kind: "boolean", key: "showLabels", label: "Show labels" },
			{ kind: "number", key: "labelSize", label: "Title size", max: 24, min: 8, step: 1 },
			{ kind: "number", key: "labelMetaSize", label: "Meta size", max: 18, min: 6, step: 1 },
		],
	},
];

const NUMBER_PARAM_DEFINITIONS = new Map<NeuralGraphNumberKey, NeuralGraphNumberParamDefinition>(
	NEURAL_GRAPH_PARAM_SECTIONS.flatMap((section) => section.params)
		.filter((definition): definition is NeuralGraphNumberParamDefinition => definition.kind === "number")
		.map((definition) => [definition.key, definition]),
);

const BOOLEAN_PARAM_KEYS = new Set<NeuralGraphBooleanKey>(
	NEURAL_GRAPH_PARAM_SECTIONS.flatMap((section) => section.params)
		.filter((definition): definition is NeuralGraphBooleanParamDefinition => definition.kind === "boolean")
		.map((definition) => definition.key),
);

export function clamp(value: number, min: number, max: number) {
	if (!Number.isFinite(value)) return min;
	if (max < min) return min;
	return Math.min(max, Math.max(min, value));
}

function clampToStep(value: number, definition: NeuralGraphNumberParamDefinition) {
	const clamped = clamp(value, definition.min, definition.max);
	const step = definition.step || 1;
	return Number((Math.round((clamped - definition.min) / step) * step + definition.min).toFixed(4));
}

function isNodeShape(value: unknown): value is NeuralGraphNodeShape {
	return value === "circle" || value === "square";
}

function isLayoutShape(value: unknown): value is NeuralGraphLayoutShape {
	return value === "cone" || value === "radialCluster";
}

export function clampNeuralGraphParams(input: Partial<NeuralGraphParams> = {}): NeuralGraphParams {
	const next = { ...DEFAULT_NEURAL_GRAPH_PARAMS, ...input };
	const clamped: NeuralGraphParams = { ...DEFAULT_NEURAL_GRAPH_PARAMS };

	for (const [key, definition] of NUMBER_PARAM_DEFINITIONS) {
		const value = next[key];
		if (typeof value === "number") {
			clamped[key] = clampToStep(value, definition);
		}
	}

	for (const key of BOOLEAN_PARAM_KEYS) {
		const value = next[key];
		clamped[key] = typeof value === "boolean" ? value : DEFAULT_NEURAL_GRAPH_PARAMS[key];
	}

	if (clamped.radiusMin > clamped.radiusMax) {
		clamped.radiusMin = clamped.radiusMax;
	}

	clamped.nodeShape = isNodeShape(next.nodeShape) ? next.nodeShape : DEFAULT_NEURAL_GRAPH_PARAMS.nodeShape;
	clamped.layoutShape = isLayoutShape(next.layoutShape) ? next.layoutShape : DEFAULT_NEURAL_GRAPH_PARAMS.layoutShape;
	for (const key of NEURAL_GRAPH_COLOR_PARAM_KEYS) {
		const value = next[key];
		clamped[key] = normalizeNeuralGraphColorValue(value, DEFAULT_NEURAL_GRAPH_PARAMS[key]);
	}

	return clamped;
}

export function createDefaultNeuralGraphParams(nodeCount = DEFAULT_NEURAL_GRAPH_PARAMS.maxVisibleNodes) {
	return clampNeuralGraphParams({
		maxVisibleNodes: clamp(nodeCount || DEFAULT_NEURAL_GRAPH_PARAMS.maxVisibleNodes, 10, 200),
	});
}

export function shouldAnimateNeuralGraph(params: NeuralGraphParams, reduceMotion = false) {
	const shouldAnimateLayout = params.amplitude > 0 && params.speed > 0;
	const shouldAnimateSignals = params.showEdges && params.showSignals && params.signalFrequency > 0 && params.signalOpacity > 0;
	return !reduceMotion && (shouldAnimateLayout || shouldAnimateSignals);
}
