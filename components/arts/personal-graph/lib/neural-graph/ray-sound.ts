import type { PlayOptions, SoundDefinition } from "@web-kits/audio";
import type { NeuralPoint, NeuralViewport } from "./camera";
import type { NeuralRayHitTestResult } from "./interaction";
import type { NeuralGraphParams } from "./params";

export interface NeuralRaySoundSettings {
	cooldownMs: number;
	enabled: boolean;
	pitchSpread: number;
	volume: number;
}

export interface NeuralRaySoundTriggerState {
	lastNodeId: string | null;
	lastPlayedAt: number;
	wasOnRay: boolean;
}

export const DEFAULT_NEURAL_RAY_SOUND_SETTINGS: NeuralRaySoundSettings = {
	cooldownMs: 70,
	enabled: true,
	pitchSpread: 18,
	volume: 0.38,
};

export const INITIAL_NEURAL_RAY_SOUND_TRIGGER_STATE: NeuralRaySoundTriggerState = {
	lastNodeId: null,
	lastPlayedAt: Number.NEGATIVE_INFINITY,
	wasOnRay: false,
};

export const NEURAL_RAY_SOUND_DEFINITION: SoundDefinition = {
	source: {
		type: "sine",
		frequency: { start: 920, end: 1480 },
		fm: { ratio: 3.5, depth: 210 },
	},
	envelope: { attack: 0, decay: 0.048, sustain: 0, release: 0.012 },
	filter: { type: "highpass", frequency: 420, resonance: 0.7 },
	gain: 0.28,
};

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function normalize(value: number, min: number, max: number): number {
	if (max <= min) return 0;
	return clamp((value - min) / (max - min), 0, 1);
}

function hashUnit(value: string): number {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return hash / 0xffffffff;
}

export function clampNeuralRaySoundSettings(
	input: Partial<NeuralRaySoundSettings> = {},
): NeuralRaySoundSettings {
	return {
		cooldownMs: clamp(
			typeof input.cooldownMs === "number" ? input.cooldownMs : DEFAULT_NEURAL_RAY_SOUND_SETTINGS.cooldownMs,
			0,
			240,
		),
		enabled: typeof input.enabled === "boolean" ? input.enabled : DEFAULT_NEURAL_RAY_SOUND_SETTINGS.enabled,
		pitchSpread: clamp(
			typeof input.pitchSpread === "number" ? input.pitchSpread : DEFAULT_NEURAL_RAY_SOUND_SETTINGS.pitchSpread,
			0,
			36,
		),
		volume: clamp(
			typeof input.volume === "number" ? input.volume : DEFAULT_NEURAL_RAY_SOUND_SETTINGS.volume,
			0,
			1,
		),
	};
}

export function shouldTriggerNeuralRaySound({
	nodeId,
	now,
	settings,
	state,
}: {
	nodeId: string;
	now: number;
	settings: NeuralRaySoundSettings;
	state: NeuralRaySoundTriggerState;
}): boolean {
	if (!settings.enabled || settings.volume <= 0) return false;
	if (state.wasOnRay && state.lastNodeId === nodeId) return false;
	return now - state.lastPlayedAt >= settings.cooldownMs;
}

export function getNextNeuralRaySoundTriggerState({
	didPlay,
	nodeId,
	now,
	state,
}: {
	didPlay: boolean;
	nodeId: string | null;
	now: number;
	state: NeuralRaySoundTriggerState;
}): NeuralRaySoundTriggerState {
	if (!nodeId) {
		return {
			...state,
			lastNodeId: null,
			wasOnRay: false,
		};
	}

	return {
		lastNodeId: nodeId,
		lastPlayedAt: didPlay ? now : state.lastPlayedAt,
		wasOnRay: true,
	};
}

export function getNeuralRaySoundPlayOptions({
	hit,
	params,
	pointer,
	settings,
	viewport,
}: {
	hit: NeuralRayHitTestResult;
	params: NeuralGraphParams;
	pointer: NeuralPoint;
	settings: NeuralRaySoundSettings;
	viewport: NeuralViewport;
}): PlayOptions {
	const radiusMix = normalize(params.rayElasticRadius, 0, 220);
	const strengthMix = normalize(Math.abs(params.rayElasticStrength), 0, 80);
	const tensionMix = normalize(params.rayElasticTension, 60, 600);
	const dampingMix = normalize(params.rayElasticDamping, 6, 80);
	const hitThreshold = Math.max(10, params.rayWidth * 2 + 8);
	const distanceMix = clamp(hit.distance / hitThreshold, 0, 1);
	const progress = clamp(hit.progress, 0, 1);
	const nodeJitter = (hashUnit(hit.node.id) - 0.5) * Math.min(260, settings.pitchSpread * 18);
	const progressCents = (progress - 0.5) * settings.pitchSpread * 100;
	const springCents = (tensionMix - 0.5) * 420;
	const radiusCents = -radiusMix * 260;
	const detune = clamp(progressCents + springCents + radiusCents + nodeJitter, -2400, 2400);
	const velocity = clamp(0.24 + strengthMix * 0.46 + (1 - distanceMix) * 0.22 - radiusMix * 0.1, 0.08, 0.92);
	const playbackRate = clamp(0.86 + tensionMix * 0.24 + dampingMix * 0.18 - radiusMix * 0.1, 0.72, 1.32);
	const pan = clamp((pointer.x / Math.max(1, viewport.width)) * 2 - 1, -0.85, 0.85);
	const volume = clamp(settings.volume * (0.68 + strengthMix * 0.32 + (1 - distanceMix) * 0.24), 0, 1);

	return {
		detune,
		pan,
		playbackRate,
		velocity,
		volume,
	};
}
