import { worldToViewport, type NeuralCamera, type NeuralPoint, type NeuralViewport } from "./camera";
import type { NeuralGraphLayout, NeuralLayoutNode } from "./layout";
import type { NeuralGraphParams } from "./params";

export interface NeuralHitTestResult {
	distance: number;
	node: NeuralLayoutNode;
}

export interface NeuralPointerState {
	dragged: boolean;
	isPanning: boolean;
	last: NeuralPoint | null;
	pointer: NeuralPoint | null;
}

export function createNeuralPointerState(): NeuralPointerState {
	return {
		dragged: false,
		isPanning: false,
		last: null,
		pointer: null,
	};
}

export function getNodeViewportRadius(node: NeuralLayoutNode, camera: NeuralCamera, params: NeuralGraphParams) {
	return Math.max(5, node.baseSize * params.nodeSize * node.depthScale * camera.zoom);
}

export function hitTestNeuralNode({
	camera,
	layout,
	params,
	point,
	viewport,
}: {
	camera: NeuralCamera;
	layout: NeuralGraphLayout;
	params: NeuralGraphParams;
	point: NeuralPoint;
	viewport: NeuralViewport;
}): NeuralHitTestResult | null {
	let best: NeuralHitTestResult | null = null;

	for (const node of layout.nodes) {
		const screen = worldToViewport(node, camera, viewport, params);
		const radius = getNodeViewportRadius(node, camera, params) + 8;
		const distance = Math.hypot(point.x - screen.x, point.y - screen.y);
		if (distance > radius) continue;
		if (!best || distance < best.distance) {
			best = { distance, node };
		}
	}

	return best;
}

export function getCursorForInteraction(pointer: NeuralPointerState, hoverNodeId: string | null) {
	if (pointer.isPanning) return "grabbing";
	if (hoverNodeId) return "pointer";
	return "grab";
}

export function isMeaningfulDrag(start: NeuralPoint, end: NeuralPoint) {
	return Math.hypot(start.x - end.x, start.y - end.y) > 4;
}
