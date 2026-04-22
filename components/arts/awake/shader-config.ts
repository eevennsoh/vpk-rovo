import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";

// Subsets of each shader's prop surface — only the knobs we randomize.
// Kept local so this module doesn't depend on shader internals.

export interface TimeShaderParams {
	seed: number;
	speed: number;
	// Always 0 → shader animates indefinitely. Non-zero values make the
	// LiquidGradient loop back to its start time and would freeze the clock
	// backdrop on a cycle, so we pin this and never randomize it.
	loop: 0;
	scale: number;
	turbAmp: number;
	turbFreq: number;
	turbIter: number;
	waveFreq: number;
	exposure: number;
	contrast: number;
	saturation: number;
}

interface HumidityShaderParams {
	seed: number;
	speed: number;
	ephemeralAmp: number;
	lensScale: number;
	lensSpacingX: number;
	lensSpacingY: number;
	lensRadius: number;
	dispersionStrength: number;
	edgeDisp: number;
}

interface TemperatureShaderParams {
	seed: number;
	speed: number;
	freqX: number;
	freqY: number;
	angle: number;
	amplitude: number;
	softness: number;
	blend: number;
}

export interface ShaderConfig {
	colors: string[];
	colorsTuple: [string, string, string, string];
	time: TimeShaderParams;
	humidity: HumidityShaderParams;
	temperature: TemperatureShaderParams;
}

// Stable singleton references. Passed by reference to shaders so their
// useEffect dep arrays (which include `colors`) don't see a new array on
// every render — otherwise the WebGL program reinitializes each frame and
// the `performance.now()` start time resets, causing a visible snapback in
// the animation.
const BRAND_COLORS: string[] = [...ROVO_SHADER_COLOR_HEX];
const BRAND_COLORS_TUPLE: [string, string, string, string] = [
	ROVO_SHADER_COLOR_HEX[0],
	ROVO_SHADER_COLOR_HEX[1],
	ROVO_SHADER_COLOR_HEX[2],
	ROVO_SHADER_COLOR_HEX[3],
];

// Base values around which each roll jitters. These match the look that
// was previously hardcoded at the shader call sites; they're the centers
// of the random distribution, not a "default" that's ever shown as-is.
const BASE = {
	time: {
		speed: 0.3,
		scale: 0.42,
		turbAmp: 0.6,
		turbFreq: 0.1,
		turbIter: 7,
		waveFreq: 3.8,
		exposure: 1.1,
		contrast: 1.1,
		saturation: 1,
	},
	humidity: {
		speed: 0.3,
		lensScale: 3.7,
		lensSpacingX: 1,
		lensSpacingY: 0.01,
		lensRadius: 0.58,
		dispersionStrength: 0.4,
		edgeDisp: 2,
	},
	temperature: {
		speed: 2.85,
		freqX: 0.9,
		freqY: 6,
		angle: 105,
		amplitude: 1.6,
		softness: 1.4,
		blend: 0.5,
	},
};

// Symmetric jitter around `base`: returns base * (1 ± amount).
function jitterPct(base: number, amount: number): number {
	return base * (1 + (Math.random() * 2 - 1) * amount);
}

// Absolute jitter: base ± delta.
function jitterAbs(base: number, delta: number): number {
	return base + (Math.random() * 2 - 1) * delta;
}

function clamp(n: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, n));
}

// Produce a fresh random config. Non-deterministic by design — each call
// yields a new look. The palette stays fixed to the Rovo brand 4.
export function getRandomShaderConfig(): ShaderConfig {
	return {
		colors: BRAND_COLORS,
		colorsTuple: BRAND_COLORS_TUPLE,
		time: {
			seed: Math.floor(Math.random() * 10000),
			speed: clamp(jitterPct(BASE.time.speed, 0.5), 0.12, 0.6),
			loop: 0,
			scale: clamp(jitterPct(BASE.time.scale, 0.35), 0.25, 0.65),
			turbAmp: clamp(jitterPct(BASE.time.turbAmp, 0.4), 0.3, 1),
			turbFreq: clamp(jitterPct(BASE.time.turbFreq, 0.5), 0.05, 0.2),
			turbIter: BASE.time.turbIter,
			waveFreq: clamp(jitterPct(BASE.time.waveFreq, 0.35), 2, 6),
			exposure: clamp(jitterPct(BASE.time.exposure, 0.15), 0.85, 1.35),
			contrast: clamp(jitterPct(BASE.time.contrast, 0.15), 0.85, 1.35),
			saturation: clamp(jitterPct(BASE.time.saturation, 0.12), 0.8, 1.2),
		},
		humidity: {
			seed: Math.floor(Math.random() * 10000),
			speed: clamp(jitterPct(BASE.humidity.speed, 0.6), 0.1, 0.7),
			ephemeralAmp: clamp(Math.random() * 0.08, 0, 0.08),
			lensScale: clamp(jitterPct(BASE.humidity.lensScale, 0.25), 2.6, 4.8),
			lensSpacingX: clamp(jitterPct(BASE.humidity.lensSpacingX, 0.3), 0.7, 1.4),
			lensSpacingY: BASE.humidity.lensSpacingY,
			lensRadius: clamp(jitterPct(BASE.humidity.lensRadius, 0.2), 0.45, 0.72),
			dispersionStrength: clamp(jitterPct(BASE.humidity.dispersionStrength, 0.4), 0.2, 0.65),
			edgeDisp: clamp(jitterPct(BASE.humidity.edgeDisp, 0.35), 1.2, 2.8),
		},
		temperature: {
			seed: Math.floor(Math.random() * 10000),
			speed: clamp(jitterPct(BASE.temperature.speed, 0.45), 1.4, 4),
			freqX: clamp(jitterPct(BASE.temperature.freqX, 0.4), 0.4, 1.6),
			freqY: clamp(jitterPct(BASE.temperature.freqY, 0.35), 3.5, 8.5),
			angle: jitterAbs(BASE.temperature.angle, 60),
			amplitude: clamp(jitterPct(BASE.temperature.amplitude, 0.3), 1, 2.4),
			softness: clamp(jitterPct(BASE.temperature.softness, 0.25), 0.9, 2),
			blend: clamp(jitterPct(BASE.temperature.blend, 0.3), 0.3, 0.75),
		},
	};
}
