import type { NeuralGraphParams } from "./params";

export interface NeuralViewport {
	height: number;
	width: number;
}

export interface NeuralPoint {
	x: number;
	y: number;
}

export interface NeuralCamera {
	maxZoom: number;
	minZoom: number;
	x: number;
	y: number;
	zoom: number;
}

export const DEFAULT_NEURAL_CAMERA = {
	maxZoom: 3,
	minZoom: 0.42,
	x: 0,
	y: 0,
	zoom: 1,
} satisfies NeuralCamera;

export function clampZoom(camera: NeuralCamera, zoom: number) {
	return Math.min(camera.maxZoom, Math.max(camera.minZoom, zoom));
}

export function createNeuralCamera(input: Partial<NeuralCamera> = {}): NeuralCamera {
	const camera = { ...DEFAULT_NEURAL_CAMERA, ...input };
	return {
		...camera,
		zoom: clampZoom(camera, camera.zoom),
	};
}

export function getNeuralOrigin(viewport: NeuralViewport, params: NeuralGraphParams): NeuralPoint {
	return {
		x: viewport.width / 2 + params.originOffset,
		y: viewport.height * params.originY,
	};
}

export function worldToViewport(
	point: NeuralPoint,
	camera: NeuralCamera,
	viewport: NeuralViewport,
	params: NeuralGraphParams,
): NeuralPoint {
	const origin = getNeuralOrigin(viewport, params);
	return {
		x: origin.x + (point.x - camera.x) * camera.zoom,
		y: origin.y + (point.y - camera.y) * camera.zoom,
	};
}

export function viewportToWorld(
	point: NeuralPoint,
	camera: NeuralCamera,
	viewport: NeuralViewport,
	params: NeuralGraphParams,
): NeuralPoint {
	const origin = getNeuralOrigin(viewport, params);
	return {
		x: (point.x - origin.x) / camera.zoom + camera.x,
		y: (point.y - origin.y) / camera.zoom + camera.y,
	};
}

export function panNeuralCamera(camera: NeuralCamera, delta: NeuralPoint): NeuralCamera {
	return {
		...camera,
		x: camera.x - delta.x / camera.zoom,
		y: camera.y - delta.y / camera.zoom,
	};
}

export function zoomNeuralCameraAtPoint({
	camera,
	delta,
	params,
	pointer,
	viewport,
}: {
	camera: NeuralCamera;
	delta: number;
	params: NeuralGraphParams;
	pointer: NeuralPoint;
	viewport: NeuralViewport;
}): NeuralCamera {
	const before = viewportToWorld(pointer, camera, viewport, params);
	const zoomFactor = delta < 0 ? 1.12 : 0.88;
	const zoom = clampZoom(camera, camera.zoom * zoomFactor);
	const nextCamera = { ...camera, zoom };
	const after = viewportToWorld(pointer, nextCamera, viewport, params);

	return {
		...nextCamera,
		x: nextCamera.x + before.x - after.x,
		y: nextCamera.y + before.y - after.y,
	};
}

export function focusNeuralCameraOnPoint({
	camera,
	params,
	point,
	viewport,
	zoom = 1.16,
}: {
	camera: NeuralCamera;
	params: NeuralGraphParams;
	point: NeuralPoint;
	viewport: NeuralViewport;
	zoom?: number;
}): NeuralCamera {
	const nextZoom = clampZoom(camera, zoom);
	const targetViewportY = viewport.height * 0.48;
	const origin = getNeuralOrigin(viewport, params);

	return {
		...camera,
		x: point.x,
		y: point.y - (targetViewportY - origin.y) / nextZoom,
		zoom: nextZoom,
	};
}
