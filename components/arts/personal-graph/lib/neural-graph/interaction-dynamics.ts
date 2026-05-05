import type { NeuralPoint, NeuralViewport } from "./camera";

export interface NeuralGraphInteractionSettings {
	enabled: boolean;
	flowBoost: number;
	intensity: number;
	nodeSoundCooldownMs: number;
	nodeSoundEnabled: boolean;
	nodeSoundVolume: number;
	rayEmphasis: number;
}

export interface NeuralGraphInteractionState {
	activeNodeId: string | null;
	activeRayNodeId: string | null;
	flowBoost: number;
	intensity: number;
	pointer: NeuralPoint | null;
	rayDistance: number;
	rayEmphasis: number;
	rayProgress: number;
	velocity: number;
	velocityPxPerSecond: number;
}

export interface NeuralPointerVelocity {
	normalized: number;
	pxPerSecond: number;
}

export const DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS: NeuralGraphInteractionSettings = {
	enabled: true,
	flowBoost: 0.85,
	intensity: 0.9,
	nodeSoundCooldownMs: 95,
	nodeSoundEnabled: true,
	nodeSoundVolume: 0.7,
	rayEmphasis: 0.9,
};

export const EMPTY_NEURAL_GRAPH_INTERACTION_STATE: NeuralGraphInteractionState = {
	activeNodeId: null,
	activeRayNodeId: null,
	flowBoost: 0,
	intensity: 0,
	pointer: null,
	rayDistance: 0,
	rayEmphasis: 0,
	rayProgress: 0,
	velocity: 0,
	velocityPxPerSecond: 0,
};

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

export function clampNeuralGraphInteractionSettings(
	input: Partial<NeuralGraphInteractionSettings> = {},
): NeuralGraphInteractionSettings {
	return {
		enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.enabled,
		flowBoost: clamp(
			typeof input.flowBoost === "number" ? input.flowBoost : DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.flowBoost,
			0,
			1.5,
		),
		intensity: clamp(
			typeof input.intensity === "number" ? input.intensity : DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.intensity,
			0,
			1.5,
		),
		nodeSoundCooldownMs: clamp(
			typeof input.nodeSoundCooldownMs === "number" ? input.nodeSoundCooldownMs : DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.nodeSoundCooldownMs,
			0,
			240,
		),
		nodeSoundEnabled: typeof input.nodeSoundEnabled === "boolean" ? input.nodeSoundEnabled : DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.nodeSoundEnabled,
		nodeSoundVolume: clamp(
			typeof input.nodeSoundVolume === "number" ? input.nodeSoundVolume : DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.nodeSoundVolume,
			0,
			1,
		),
		rayEmphasis: clamp(
			typeof input.rayEmphasis === "number" ? input.rayEmphasis : DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.rayEmphasis,
			0,
			1.5,
		),
	};
}

export function getNeuralPointerVelocity({
	elapsedMs,
	from,
	to,
	viewport,
}: {
	elapsedMs: number;
	from: NeuralPoint | null;
	to: NeuralPoint;
	viewport: NeuralViewport;
}): NeuralPointerVelocity {
	if (!from || elapsedMs <= 0) {
		return { normalized: 0, pxPerSecond: 0 };
	}

	const distance = Math.hypot(to.x - from.x, to.y - from.y);
	const pxPerSecond = distance / (elapsedMs / 1000);
	const diagonal = Math.hypot(viewport.width, viewport.height);
	const normalizer = clamp(diagonal * 1.15, 640, 1600);
	return {
		normalized: clamp(pxPerSecond / normalizer, 0, 1),
		pxPerSecond,
	};
}

export function getNeuralInteractionTargetIntensity({
	hasHit,
	settings,
	velocity,
}: {
	hasHit: boolean;
	settings: NeuralGraphInteractionSettings;
	velocity: number;
}): number {
	if (!settings.enabled || settings.intensity <= 0) return 0;
	const normalizedVelocity = clamp(velocity, 0, 1);
	const hitBase = hasHit ? 0.28 : 0;
	const velocityWeight = hasHit ? 0.72 : 0.5;
	return clamp((hitBase + normalizedVelocity * velocityWeight) * settings.intensity, 0, 1.5);
}
