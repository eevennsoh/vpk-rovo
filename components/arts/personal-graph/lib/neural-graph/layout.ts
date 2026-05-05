import type { NeuralPoint, NeuralViewport } from "./camera";
import type { NeuralGraphInteractionState } from "./interaction-dynamics";
import type { NeuralGraphParams } from "./params";
import {
	getSelectedNeighborhood,
	getVisibleGraphEdges,
	getVisibleGraphNodes,
	type NeuralGraphEdge,
	type NeuralGraphNode,
	type NeuralGraphStore,
} from "./store";

export interface NeuralLayoutNode extends NeuralPoint {
	alpha: number;
	baseSize: number;
	depthScale: number;
	id: string;
	node: NeuralGraphNode;
	phase: number;
	z: number;
}

export interface NeuralLayoutEdge {
	edge: NeuralGraphEdge;
	id: string;
	source: NeuralLayoutNode;
	target: NeuralLayoutNode;
}

export interface NeuralGraphLayout {
	edges: NeuralLayoutEdge[];
	nodes: NeuralLayoutNode[];
	nodesById: Map<string, NeuralLayoutNode>;
	origin: NeuralPoint;
	viewport: NeuralViewport;
}

const DEG_TO_RAD = Math.PI / 180;
const RELAXATION_ITERATIONS = 18;

function lerp(start: number, end: number, progress: number) {
	return start + (end - start) * progress;
}

function clampFocusProgress(value = 0) {
	if (!Number.isFinite(value)) return 0;
	return Math.min(1, Math.max(0, value));
}

function clampInteractionProgress(interaction: NeuralGraphInteractionState | null | undefined, reduceMotion: boolean) {
	if (reduceMotion || !interaction) return 0;
	return Math.min(1.5, Math.max(0, interaction.intensity)) * Math.max(0, interaction.flowBoost);
}

function hashString(value: string) {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function unitHash(value: string, salt: string) {
	return hashString(`${salt}:${value}`) / 0xffffffff;
}

function signedHash(value: string, salt: string) {
	return unitHash(value, salt) * 2 - 1;
}

function waveNoise(
	node: NeuralGraphNode,
	params: NeuralGraphParams,
	time: number,
	reduceMotion: boolean,
	interaction?: NeuralGraphInteractionState | null,
) {
	if (reduceMotion || params.amplitude <= 0 || params.speed <= 0) return { x: 0, y: 0 };

	const interactionProgress = clampInteractionProgress(interaction, reduceMotion);
	const velocity = Math.max(0, interaction?.velocity ?? 0);
	const speed = params.speed * (1 + interactionProgress * (0.42 + velocity * 0.3));
	const amplitude = params.amplitude * (1 + interactionProgress * 0.32);
	let x = 0;
	let y = 0;
	let weight = 1;
	let frequency = params.frequency;

	for (let octave = 0; octave < params.octaves; octave += 1) {
		const phase = unitHash(node.id, `phase-${octave}`) * Math.PI * 2;
		const tick = time * speed * frequency + phase;
		x += Math.cos(tick) * weight;
		y += Math.sin(tick * 0.84 + phase) * weight;
		weight *= 0.5;
		frequency *= 1.72;
	}

	const scale = params.spread * amplitude * 0.1;
	return { x: x * scale, y: y * scale };
}

function createInitialNode(
	node: NeuralGraphNode,
	index: number,
	total: number,
	params: NeuralGraphParams,
	time: number,
	reduceMotion: boolean,
	viewport: NeuralViewport,
	interaction?: NeuralGraphInteractionState | null,
): NeuralLayoutNode {
	const t = total <= 1 ? 0.5 : index / (total - 1);
	const interactionProgress = clampInteractionProgress(interaction, reduceMotion);
	const velocity = Math.max(0, interaction?.velocity ?? 0);
	const pointerX = interaction?.pointer ? interaction.pointer.x / Math.max(1, viewport.width) - 0.5 : 0;
	const pointerY = interaction?.pointer ? interaction.pointer.y / Math.max(1, viewport.height) - 0.5 : 0;
	const breath = Math.sin(time * (1.2 + velocity * 1.6) + unitHash(node.id, "breath") * Math.PI * 2)
		* interactionProgress
		* 0.02;
	const effectiveSpread = params.spread * (1 + interactionProgress * 0.045 + breath);
	const coneAngle = params.coneAngle * (1 + interactionProgress * 0.05) * DEG_TO_RAD;
	const angleJitter = signedHash(node.id, "angle") * coneAngle * 0.08;
	const angle = -Math.PI / 2 + (t - 0.5) * coneAngle + angleJitter + params.tiltZ * DEG_TO_RAD * 0.1 + pointerX * interactionProgress * 0.075;
	const radiusRange = Math.max(0, params.radiusMax - params.radiusMin) / 100;
	const radiusMin = params.radiusMin / 100;
	const radius = effectiveSpread * (radiusMin + unitHash(node.id, "radius") * radiusRange);
	const z = signedHash(node.id, "depth") * params.depthZ;
	const depthScale = params.perspective / Math.max(1, params.perspective + z);
	const tiltOffset = Math.sin(params.tiltX * DEG_TO_RAD) * z * 0.4 + pointerY * interactionProgress * params.spread * 0.012;
	const flow = waveNoise(node, params, time, reduceMotion, interaction);

	return {
		alpha: 1,
		baseSize: Math.max(3, params.nodeSize + Math.sqrt(Math.max(1, node.degree)) * 0.85),
		depthScale,
		id: node.id,
		node,
		phase: unitHash(node.id, "phase"),
		x: Math.cos(angle) * radius * depthScale + flow.x,
		y: Math.sin(angle) * radius * depthScale + tiltOffset + flow.y,
		z,
	};
}

function relaxLayout(
	nodes: NeuralLayoutNode[],
	edges: NeuralGraphEdge[],
	params: NeuralGraphParams,
	interaction?: NeuralGraphInteractionState | null,
	reduceMotion = false,
) {
	if (nodes.length < 2) return;

	const interactionProgress = clampInteractionProgress(interaction, reduceMotion);
	const indexById = new Map(nodes.map((node, index) => [node.id, index]));
	const velocity = nodes.map(() => ({ x: 0, y: 0 }));
	const restById = new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
	const attraction = 0.0038;
	const repulsion = params.spread * (1 + interactionProgress * 0.06) * 0.028;
	const gravity = 0.018;

	for (let iteration = 0; iteration < RELAXATION_ITERATIONS; iteration += 1) {
		for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
			for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
				const left = nodes[leftIndex];
				const right = nodes[rightIndex];
				const dx = left.x - right.x;
				const dy = left.y - right.y;
				const distanceSq = Math.max(36, dx * dx + dy * dy);
				const force = (repulsion * left.node.mass * right.node.mass) / distanceSq;
				velocity[leftIndex].x += dx * force;
				velocity[leftIndex].y += dy * force;
				velocity[rightIndex].x -= dx * force;
				velocity[rightIndex].y -= dy * force;
			}
		}

		for (const edge of edges) {
			const sourceIndex = indexById.get(edge.source);
			const targetIndex = indexById.get(edge.target);
			if (sourceIndex === undefined || targetIndex === undefined) continue;
			const source = nodes[sourceIndex];
			const target = nodes[targetIndex];
			const dx = target.x - source.x;
			const dy = target.y - source.y;
			velocity[sourceIndex].x += dx * attraction * edge.weight;
			velocity[sourceIndex].y += dy * attraction * edge.weight;
			velocity[targetIndex].x -= dx * attraction * edge.weight;
			velocity[targetIndex].y -= dy * attraction * edge.weight;
		}

		for (let index = 0; index < nodes.length; index += 1) {
			const node = nodes[index];
			const rest = restById.get(node.id) ?? { x: 0, y: 0 };
			velocity[index].x += (rest.x - node.x) * gravity;
			velocity[index].y += (rest.y - node.y) * gravity;
			node.x += velocity[index].x;
			node.y += velocity[index].y;
			velocity[index].x *= 0.52;
			velocity[index].y *= 0.52;
		}
	}
}

function applySelectionFocusLayout({
	focusProgress,
	nodes,
	params,
	selectedNodeId,
	store,
}: {
	focusProgress?: number;
	nodes: NeuralLayoutNode[];
	params: NeuralGraphParams;
	selectedNodeId: string | null;
	store: NeuralGraphStore;
}) {
	const progress = clampFocusProgress(focusProgress);
	if (!selectedNodeId || progress <= 0) return;

	const selectedNode = nodes.find((node) => node.id === selectedNodeId);
	if (!selectedNode) return;

	const selectedAnchor = { x: selectedNode.x, y: selectedNode.y };
	const visibleNodeIds = new Set(nodes.map((node) => node.id));
	const focusNeighbors = getSelectedNeighborhood(store, selectedNodeId, nodes.length)
		.filter(({ node }) => visibleNodeIds.has(node.id));
	const neighborOrder = new Map(focusNeighbors.map(({ node }, index) => [node.id, index]));
	const linkedCount = Math.max(1, focusNeighbors.length);
	const ringRadiusX = params.spread * 0.34;
	const ringRadiusY = params.spread * 0.24;
	const maxArc = Math.PI * 0.9;
	const angleStep = linkedCount <= 1 ? 0 : maxArc / (linkedCount - 1);
	const startAngle = -Math.PI / 2 - angleStep * (linkedCount - 1) * 0.5;
	const focusBlend = progress * 0.86;
	const retreatBlend = progress * 0.92;

	for (const node of nodes) {
		if (node.id === selectedNodeId) {
			continue;
		}

		const order = neighborOrder.get(node.id);
		if (order !== undefined) {
			const angle = startAngle + angleStep * order;
			const targetX = selectedAnchor.x + Math.cos(angle) * ringRadiusX;
			const targetY = selectedAnchor.y + Math.sin(angle) * ringRadiusY;
			node.x = lerp(node.x, targetX, focusBlend);
			node.y = lerp(node.y, targetY, focusBlend);
			continue;
		}

		const dx = node.x - selectedAnchor.x;
		const dy = node.y - selectedAnchor.y;
		const distance = Math.hypot(dx, dy);
		const fallbackX = signedHash(node.id, "focus-away-x");
		const fallbackY = signedHash(node.id, "focus-away-y");
		const unitX = distance > 1 ? dx / distance : fallbackX;
		const unitY = distance > 1 ? dy / distance : fallbackY;
		const push = params.spread * (0.44 + unitHash(node.id, "focus-away") * 0.28);
		const targetX = node.x + unitX * push;
		const targetY = node.y + unitY * push * 0.7;
		node.x = lerp(node.x, targetX, retreatBlend);
		node.y = lerp(node.y, targetY, retreatBlend);
	}
}

function createLayoutEdges(edges: NeuralGraphEdge[], nodesById: Map<string, NeuralLayoutNode>) {
	const layoutEdges: NeuralLayoutEdge[] = [];

	for (const edge of edges) {
		const source = nodesById.get(edge.source);
		const target = nodesById.get(edge.target);
		if (!source || !target) {
			continue;
		}

		layoutEdges.push({ edge, id: edge.id, source, target });
	}

	return layoutEdges;
}

export function computeNeuralGraphLayout({
	focusProgress = 0,
	interaction = null,
	params,
	reduceMotion = false,
	selectedNodeId,
	store,
	time = 0,
	viewport,
}: {
	focusProgress?: number;
	interaction?: NeuralGraphInteractionState | null;
	params: NeuralGraphParams;
	reduceMotion?: boolean;
	selectedNodeId: string | null;
	store: NeuralGraphStore;
	time?: number;
	viewport: NeuralViewport;
}): NeuralGraphLayout {
	const visibleNodes = getVisibleGraphNodes(store, selectedNodeId, params.maxVisibleNodes);
	const visibleEdges = getVisibleGraphEdges(store, visibleNodes);
	const layoutNodes = visibleNodes.map((node, index) =>
		createInitialNode(node, index, visibleNodes.length, params, time, reduceMotion, viewport, interaction),
	);

	relaxLayout(layoutNodes, visibleEdges, params, interaction, reduceMotion);
	applySelectionFocusLayout({
		focusProgress,
		nodes: layoutNodes,
		params,
		selectedNodeId,
		store,
	});

	const nodesById = new Map(layoutNodes.map((node) => [node.id, node]));
	const layoutEdges = createLayoutEdges(visibleEdges, nodesById);

	return {
		edges: layoutEdges,
		nodes: layoutNodes,
		nodesById,
		origin: { x: 0, y: 0 },
		viewport,
	};
}
