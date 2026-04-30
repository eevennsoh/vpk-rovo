import type { NeuralPoint, NeuralViewport } from "./camera";
import type { NeuralGraphParams } from "./params";
import {
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

function waveNoise(node: NeuralGraphNode, params: NeuralGraphParams, time: number, reduceMotion: boolean) {
	if (reduceMotion || params.amplitude <= 0 || params.speed <= 0) return { x: 0, y: 0 };

	let x = 0;
	let y = 0;
	let weight = 1;
	let frequency = params.frequency;

	for (let octave = 0; octave < params.octaves; octave += 1) {
		const phase = unitHash(node.id, `phase-${octave}`) * Math.PI * 2;
		const tick = time * params.speed * frequency + phase;
		x += Math.cos(tick) * weight;
		y += Math.sin(tick * 0.84 + phase) * weight;
		weight *= 0.5;
		frequency *= 1.72;
	}

	const scale = params.spread * params.amplitude * 0.1;
	return { x: x * scale, y: y * scale };
}

function createInitialNode(
	node: NeuralGraphNode,
	index: number,
	total: number,
	params: NeuralGraphParams,
	time: number,
	reduceMotion: boolean,
): NeuralLayoutNode {
	const t = total <= 1 ? 0.5 : index / (total - 1);
	const coneAngle = params.coneAngle * DEG_TO_RAD;
	const angleJitter = signedHash(node.id, "angle") * coneAngle * 0.08;
	const angle = -Math.PI / 2 + (t - 0.5) * coneAngle + angleJitter + params.tiltZ * DEG_TO_RAD * 0.1;
	const radiusRange = Math.max(0, params.radiusMax - params.radiusMin) / 100;
	const radiusMin = params.radiusMin / 100;
	const radius = params.spread * (radiusMin + unitHash(node.id, "radius") * radiusRange);
	const z = signedHash(node.id, "depth") * params.depthZ;
	const depthScale = params.perspective / Math.max(1, params.perspective + z);
	const tiltOffset = Math.sin(params.tiltX * DEG_TO_RAD) * z * 0.4;
	const flow = waveNoise(node, params, time, reduceMotion);

	return {
		alpha: node.missing || node.dangling ? 0.64 : 1,
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

function relaxLayout(nodes: NeuralLayoutNode[], edges: NeuralGraphEdge[], params: NeuralGraphParams) {
	if (nodes.length < 2) return;

	const indexById = new Map(nodes.map((node, index) => [node.id, index]));
	const velocity = nodes.map(() => ({ x: 0, y: 0 }));
	const restById = new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
	const attraction = 0.0038;
	const repulsion = params.spread * 0.028;
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

export function computeNeuralGraphLayout({
	params,
	reduceMotion = false,
	selectedNodeId,
	store,
	time = 0,
	viewport,
}: {
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
		createInitialNode(node, index, visibleNodes.length, params, time, reduceMotion),
	);

	relaxLayout(layoutNodes, visibleEdges, params);

	const nodesById = new Map(layoutNodes.map((node) => [node.id, node]));
	const layoutEdges = visibleEdges.flatMap((edge) => {
		const source = nodesById.get(edge.source);
		const target = nodesById.get(edge.target);
		if (!source || !target) return [];
		return [{ edge, id: edge.id, source, target }];
	});

	return {
		edges: layoutEdges,
		nodes: layoutNodes,
		nodesById,
		origin: { x: 0, y: 0 },
		viewport,
	};
}
