export type NeuralGraphNodeShape = "circle" | "square";

export interface NeuralGraphParams {
	amplitude: number;
	coneAngle: number;
	depthZ: number;
	frequency: number;
	maxVisibleNodes: number;
	nodeColor: string;
	nodeShape: NeuralGraphNodeShape;
	nodeSize: number;
	octaves: number;
	originOffset: number;
	originY: number;
	perspective: number;
	radiusMax: number;
	radiusMin: number;
	speed: number;
	spread: number;
	tiltX: number;
	tiltZ: number;
}

export interface NeuralGraphParamDefinition {
	key: keyof NeuralGraphParams;
	label: string;
	max: number;
	min: number;
	step: number;
}

export interface NeuralGraphParamSection {
	id: string;
	label: string;
	params: NeuralGraphParamDefinition[];
}

export const DEFAULT_NEURAL_GRAPH_PARAMS: NeuralGraphParams = {
	amplitude: 0.15,
	coneAngle: 75,
	depthZ: 30,
	frequency: 1.5,
	maxVisibleNodes: 86,
	nodeColor: "#6b5ce7",
	nodeShape: "circle",
	nodeSize: 2.5,
	octaves: 3,
	originOffset: 0,
	originY: 1.05,
	perspective: 1000,
	radiusMax: 100,
	radiusMin: 50,
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
			{ key: "speed", label: "Speed", max: 3, min: 0, step: 0.1 },
			{ key: "amplitude", label: "Amplitude", max: 0.5, min: 0, step: 0.01 },
			{ key: "frequency", label: "Frequency", max: 5, min: 0.5, step: 0.1 },
			{ key: "octaves", label: "Octaves", max: 4, min: 1, step: 1 },
		],
	},
	{
		id: "structure",
		label: "Structure",
		params: [
			{ key: "spread", label: "Spread", max: 800, min: 100, step: 10 },
			{ key: "perspective", label: "Perspective", max: 2000, min: 200, step: 50 },
			{ key: "originY", label: "Origin Y", max: 1.5, min: 0.5, step: 0.05 },
			{ key: "originOffset", label: "Origin Offset", max: 200, min: -200, step: 10 },
		],
	},
	{
		id: "cone",
		label: "Cone",
		params: [
			{ key: "coneAngle", label: "Cone Angle", max: 180, min: 5, step: 1 },
			{ key: "tiltX", label: "Tilt X", max: 90, min: -90, step: 1 },
			{ key: "tiltZ", label: "Tilt Z", max: 90, min: -90, step: 1 },
			{ key: "radiusMin", label: "Radius Min %", max: 100, min: 0, step: 1 },
			{ key: "radiusMax", label: "Radius Max %", max: 100, min: 0, step: 1 },
			{ key: "depthZ", label: "Depth (Z)", max: 100, min: 0, step: 1 },
		],
	},
	{
		id: "nodes",
		label: "Nodes",
		params: [
			{ key: "maxVisibleNodes", label: "Count", max: 200, min: 10, step: 1 },
			{ key: "nodeSize", label: "Size", max: 8, min: 0.5, step: 0.5 },
		],
	},
];

const PARAM_DEFINITIONS = new Map<keyof NeuralGraphParams, NeuralGraphParamDefinition>(
	NEURAL_GRAPH_PARAM_SECTIONS.flatMap((section) => section.params).map((definition) => [
		definition.key,
		definition,
	]),
);

const STORAGE_KEY = "personal-graph-neural-params";

export function clamp(value: number, min: number, max: number) {
	if (!Number.isFinite(value)) return min;
	if (max < min) return min;
	return Math.min(max, Math.max(min, value));
}

function clampToStep(value: number, definition: NeuralGraphParamDefinition) {
	const clamped = clamp(value, definition.min, definition.max);
	const step = definition.step || 1;
	return Number((Math.round((clamped - definition.min) / step) * step + definition.min).toFixed(4));
}

function isNodeShape(value: unknown): value is NeuralGraphNodeShape {
	return value === "circle" || value === "square";
}

function isHexColor(value: unknown): value is string {
	return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

export function clampNeuralGraphParams(input: Partial<NeuralGraphParams> = {}): NeuralGraphParams {
	const next = { ...DEFAULT_NEURAL_GRAPH_PARAMS, ...input };
	const clamped: NeuralGraphParams = { ...DEFAULT_NEURAL_GRAPH_PARAMS };

	for (const [key, definition] of PARAM_DEFINITIONS) {
		const value = next[key];
		if (typeof value === "number") {
			(clamped as Record<keyof NeuralGraphParams, unknown>)[key] = clampToStep(value, definition);
		}
	}

	if (clamped.radiusMin > clamped.radiusMax) {
		clamped.radiusMin = clamped.radiusMax;
	}

	clamped.nodeShape = isNodeShape(next.nodeShape) ? next.nodeShape : DEFAULT_NEURAL_GRAPH_PARAMS.nodeShape;
	clamped.nodeColor = isHexColor(next.nodeColor) ? next.nodeColor : DEFAULT_NEURAL_GRAPH_PARAMS.nodeColor;

	return clamped;
}

export function createDefaultNeuralGraphParams(nodeCount = DEFAULT_NEURAL_GRAPH_PARAMS.maxVisibleNodes) {
	return clampNeuralGraphParams({
		maxVisibleNodes: clamp(nodeCount || DEFAULT_NEURAL_GRAPH_PARAMS.maxVisibleNodes, 10, 200),
	});
}

export function loadStoredNeuralGraphParams(): NeuralGraphParams {
	if (typeof window === "undefined") {
		return DEFAULT_NEURAL_GRAPH_PARAMS;
	}

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_NEURAL_GRAPH_PARAMS;
		return clampNeuralGraphParams(JSON.parse(raw));
	} catch {
		return DEFAULT_NEURAL_GRAPH_PARAMS;
	}
}

export function saveStoredNeuralGraphParams(params: NeuralGraphParams) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clampNeuralGraphParams(params)));
}
