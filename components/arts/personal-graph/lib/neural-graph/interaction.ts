import { getNeuralOrigin, worldToViewport, type NeuralCamera, type NeuralPoint, type NeuralViewport } from "./camera";
import type { NeuralGraphLayout, NeuralLayoutNode } from "./layout";
import type { NeuralGraphParams } from "./params";

export interface NeuralHitTestResult {
	distance: number;
	node: NeuralLayoutNode;
}

export interface NeuralRayHitTestResult extends NeuralHitTestResult {
	point: NeuralPoint;
	progress: number;
}

export interface NeuralRayCurve {
	sourceControl: NeuralPoint;
	targetControl: NeuralPoint;
	origin: NeuralPoint;
	target: NeuralPoint;
}

export interface NeuralPointerState {
	dragged: boolean;
	isPanning: boolean;
	last: NeuralPoint | null;
	pointer: NeuralPoint | null;
}

const RAY_HIT_TEST_SEGMENTS = 28;

function getEdgeTerminalDirection(
	source: NeuralPoint,
	target: NeuralPoint,
) {
	const dx = target.x - source.x;
	const dy = target.y - source.y;
	if (Math.abs(dy) >= Math.abs(dx)) {
		return { x: 0, y: dy >= 0 ? 1 : -1 };
	}
	return { x: dx >= 0 ? 1 : -1, y: 0 };
}

export function getOrganicRayCurve(origin: NeuralPoint, target: NeuralPoint): NeuralRayCurve {
	const dx = target.x - origin.x;
	const dy = target.y - origin.y;
	const distance = Math.max(1, Math.hypot(dx, dy));
	const sourceDirection = { x: 0, y: dy >= 0 ? 1 : -1 };
	const targetDirection = getEdgeTerminalDirection(origin, target);
	const sourceHandleDistance = Math.min(220, Math.max(58, distance * 0.38));
	const targetHandleDistance = Math.min(180, Math.max(42, distance * 0.28));

	return {
		origin,
		sourceControl: {
			x: origin.x + sourceDirection.x * sourceHandleDistance,
			y: origin.y + sourceDirection.y * sourceHandleDistance,
		},
		target,
		targetControl: {
			x: target.x - targetDirection.x * targetHandleDistance,
			y: target.y - targetDirection.y * targetHandleDistance,
		},
	};
}

export function getCubicBezierPoint(curve: NeuralRayCurve, progress: number): NeuralPoint {
	const t = Math.min(1, Math.max(0, progress));
	const inverse = 1 - t;
	const inverseSquared = inverse * inverse;
	const progressSquared = t * t;

	return {
		x:
			inverseSquared * inverse * curve.origin.x
			+ 3 * inverseSquared * t * curve.sourceControl.x
			+ 3 * inverse * progressSquared * curve.targetControl.x
			+ progressSquared * t * curve.target.x,
		y:
			inverseSquared * inverse * curve.origin.y
			+ 3 * inverseSquared * t * curve.sourceControl.y
			+ 3 * inverse * progressSquared * curve.targetControl.y
			+ progressSquared * t * curve.target.y,
	};
}

function distanceToSegment(point: NeuralPoint, start: NeuralPoint, end: NeuralPoint) {
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const lengthSquared = dx * dx + dy * dy;
	if (lengthSquared === 0) {
		return {
			distance: Math.hypot(point.x - start.x, point.y - start.y),
			progress: 0,
			point: start,
		};
	}

	const rawProgress = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
	const progress = Math.min(1, Math.max(0, rawProgress));
	const closest = {
		x: start.x + dx * progress,
		y: start.y + dy * progress,
	};

	return {
		distance: Math.hypot(point.x - closest.x, point.y - closest.y),
		progress,
		point: closest,
	};
}

export function getClosestPointOnOrganicRay(curve: NeuralRayCurve, point: NeuralPoint) {
	let best = {
		distance: Number.POSITIVE_INFINITY,
		point: curve.origin,
		progress: 0,
	};
	let previous = curve.origin;

	for (let segment = 1; segment <= RAY_HIT_TEST_SEGMENTS; segment += 1) {
		const endProgress = segment / RAY_HIT_TEST_SEGMENTS;
		const next = getCubicBezierPoint(curve, endProgress);
		const candidate = distanceToSegment(point, previous, next);
		if (candidate.distance < best.distance) {
			const segmentStartProgress = (segment - 1) / RAY_HIT_TEST_SEGMENTS;
			best = {
				distance: candidate.distance,
				point: candidate.point,
				progress: segmentStartProgress + candidate.progress / RAY_HIT_TEST_SEGMENTS,
			};
		}
		previous = next;
	}

	return best;
}

function getRayOrigin(viewport: NeuralViewport, params: NeuralGraphParams, rayOriginY?: number) {
	return {
		...getNeuralOrigin(viewport, params),
		y: rayOriginY ?? viewport.height * params.rayOriginY,
	};
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

export function hitTestNeuralRay({
	camera,
	layout,
	params,
	point,
	rayOriginY,
	viewport,
}: {
	camera: NeuralCamera;
	layout: NeuralGraphLayout;
	params: NeuralGraphParams;
	point: NeuralPoint;
	rayOriginY?: number;
	viewport: NeuralViewport;
}): NeuralRayHitTestResult | null {
	if (!params.showRays || params.rayElasticRadius <= 0 || params.rayElasticStrength <= 0) return null;
	const origin = getRayOrigin(viewport, params, rayOriginY);
	const threshold = Math.max(10, params.rayWidth * 2 + 8);
	let best: NeuralRayHitTestResult | null = null;

	for (const node of layout.nodes) {
		const target = worldToViewport(node, camera, viewport, params);
		const curve = getOrganicRayCurve(origin, target);
		const candidate = getClosestPointOnOrganicRay(curve, point);
		if (candidate.distance > threshold) continue;
		if (!best || candidate.distance < best.distance) {
			best = {
				distance: candidate.distance,
				node,
				point: candidate.point,
				progress: candidate.progress,
			};
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
