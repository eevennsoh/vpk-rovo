"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { RGBAColor } from "./color-utils";

export type WaveformConfig = {
	timeSpeedIdle: number;
	timeSpeedActive: number;
	motionSpeedIdle: number;
	motionSpeedUser: number;
	motionSpeedAi: number;
	idleBaseAmplitude: number;
	idleBaseNoiseAmount: number;
	idleLiftAmount: number;
	idleCenterY: number;
	idleCenterSignalMul: number;
	idleThicknessSignalMul: number;
	idleWarpFreq: number;
	idleWarpSpeed: number;
	idleWarpAmount: number;
	idleNoiseGlowFreqX: number;
	idleNoiseGlowFreqY: number;
	idleNoiseGlowSpeed: number;
	idleNoiseGlowAmount: number;
	warpFreq: number;
	warpSpeed: number;
	warpAmount: number;
	noiseGlowFreqX: number;
	noiseGlowFreqY: number;
	noiseGlowSpeed: number;
	noiseGlowAmount: number;
	thicknessIdle: number;
	thicknessActive: number;
	thicknessSignalMul: number;
	signalSmoothRate: number;
	signalRiseMul: number;
	signalFallMul: number;
	signalDecay: number;
	colorLerpRate: number;
	stateModeLerpRate: number;
	activeFadeRate: number;
	disappearFadeRate: number;
	waveformWidthPercent: number;
	waveformHeightScale: number;
	edgeFadeLeft: number;
	edgeFadeRight: number;
	idleColor1: RGBAColor;
	idleColor2: RGBAColor;
	idleColor3: RGBAColor;
	idleColor4: RGBAColor;
	aiColor1: RGBAColor;
	aiColor2: RGBAColor;
	aiColor3: RGBAColor;
	aiColor4: RGBAColor;
	userColor1: RGBAColor;
	userColor2: RGBAColor;
	userColor3: RGBAColor;
	userColor4: RGBAColor;
};

export const DEFAULT_WAVEFORM_CONFIG: WaveformConfig = {
	timeSpeedIdle: 0.08,
	timeSpeedActive: 0.25,
	motionSpeedIdle: 1,
	motionSpeedUser: 1,
	motionSpeedAi: 1,
	idleBaseAmplitude: 0.05,
	idleBaseNoiseAmount: 0.03,
	idleLiftAmount: 0.05,
	idleCenterY: 0.4,
	idleCenterSignalMul: 0.2,
	idleThicknessSignalMul: 0.9,
	idleWarpFreq: 1.4,
	idleWarpSpeed: 0.3,
	idleWarpAmount: 0.06,
	idleNoiseGlowFreqX: 2.5,
	idleNoiseGlowFreqY: 2.0,
	idleNoiseGlowSpeed: 0.6,
	idleNoiseGlowAmount: 0.3,
	warpFreq: 1.4,
	warpSpeed: 0.3,
	warpAmount: 0.06,
	noiseGlowFreqX: 2.5,
	noiseGlowFreqY: 2.0,
	noiseGlowSpeed: 0.6,
	noiseGlowAmount: 0.3,
	thicknessIdle: 0.08,
	thicknessActive: 0.15,
	thicknessSignalMul: 0.9,
	signalSmoothRate: 0.012,
	signalRiseMul: 1.4,
	signalFallMul: 0.7,
	signalDecay: 0.97,
	colorLerpRate: 0.02,
	stateModeLerpRate: 0.02,
	activeFadeRate: 0.03,
	disappearFadeRate: 0.03,
	waveformWidthPercent: 100,
	waveformHeightScale: 1,
	edgeFadeLeft: 0.25,
	edgeFadeRight: 0.25,
	idleColor1: [0.70, 0.75, 0.80, 1],
	idleColor2: [0.75, 0.80, 0.85, 1],
	idleColor3: [0.80, 0.85, 0.90, 1],
	idleColor4: [0.75, 0.80, 0.85, 1],
	aiColor1: [0.09, 0.41, 0.86, 1],
	aiColor2: [0.69, 0.35, 0.88, 1],
	aiColor3: [0.99, 0.65, 0.00, 1],
	aiColor4: [0.42, 0.60, 0.14, 1],
	userColor1: [0.10, 0.60, 0.95, 1],
	userColor2: [0.05, 0.85, 0.85, 1],
	userColor3: [0.40, 0.45, 0.95, 1],
	userColor4: [0.20, 0.30, 0.90, 1],
};

type SmoothGradientWaveformProps = {
	active?: boolean;
	className?: string;
	colorMode?: "linear" | "organic";
	config?: WaveformConfig;
	organicDriftSpeed?: number;
	organicDriftRadius?: number;
	organicNoiseScale?: number;
	organicNoiseSpeed?: number;
	phase?: string;
	signal?: readonly number[];
	voiceState?: "idle" | "connecting" | "listening" | "speaking";
	generationState?: string;
	micStream?: MediaStream | null;
};

const vertexShaderSource = `
	attribute vec2 position;
	varying vec2 vUv;
	void main() {
		vUv = position * 0.5 + 0.5;
		gl_Position = vec4(position, 0.0, 1.0);
	}
`;

const fragmentShaderSource = `
	precision highp float;
	
	varying vec2 vUv;
	uniform float uTime;
	uniform float uActive;
	uniform sampler2D uSignal;
	uniform vec4 uColor1;
	uniform vec4 uColor2;
	uniform vec4 uColor3;
	uniform vec4 uColor4;
	uniform vec2 uResolution;
	uniform float uStateMode; // 0=idle, 1=user, 2=ai

	uniform float uTimeSpeedIdle;
	uniform float uTimeSpeedActive;
	uniform float uMotionSpeed;
	uniform float uIdleBaseAmplitude;
	uniform float uIdleBaseNoiseAmount;
	uniform float uIdleLiftAmount;
	uniform float uIdleCenterY;
	uniform float uIdleCenterSignalMul;
	uniform float uIdleThicknessSignalMul;
	uniform float uIdleWarpFreq;
	uniform float uIdleWarpSpeed;
	uniform float uIdleWarpAmount;
	uniform float uIdleNoiseGlowFreqX;
	uniform float uIdleNoiseGlowFreqY;
	uniform float uIdleNoiseGlowSpeed;
	uniform float uIdleNoiseGlowAmount;
	uniform float uWarpFreq;
	uniform float uWarpSpeed;
	uniform float uWarpAmount;
	uniform float uNoiseGlowFreqX;
	uniform float uNoiseGlowFreqY;
	uniform float uNoiseGlowSpeed;
	uniform float uNoiseGlowAmount;
	uniform float uThicknessIdle;
	uniform float uThicknessActive;
	uniform float uThicknessSignalMul;
	uniform float uWaveformHeightScale;
	uniform float uEdgeFadeLeft;
	uniform float uEdgeFadeRight;
	uniform float uColorMode; // 0=linear, 1=organic
	uniform float uOrganicDriftSpeed;
	uniform float uOrganicDriftRadius;
	uniform float uOrganicNoiseScale;
	uniform float uOrganicNoiseSpeed;

	// Simplex 2D noise
	vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
	float snoise(vec2 v){
		const vec4 C = vec4(0.211324865405187, 0.366025403784439,
				-0.577350269189626, 0.024390243902439);
		vec2 i  = floor(v + dot(v, C.yy) );
		vec2 x0 = v -   i + dot(i, C.xx);
		vec2 i1;
		i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;
		i = mod(i, 289.0);
		vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));
		vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
			dot(x12.zw,x12.zw)), 0.0);
		m = m*m ;
		m = m*m ;
		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;
		m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
		vec3 g;
		g.x  = a0.x  * x0.x  + h.x  * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
	}

	void main() {
		vec2 uv = gl_FragCoord.xy / uResolution.xy;
		
		// The waveform width fits exactly within the composer
		float waveformWidth = 0.95;
		float signalX = (uv.x - 0.5) / waveformWidth + 0.5;
		
		float stateBlend = smoothstep(0.0, 1.0, uStateMode);
		float time = uTime * uMotionSpeed * mix(uTimeSpeedIdle, uTimeSpeedActive, stateBlend);
		float warpFreq = mix(uIdleWarpFreq, uWarpFreq, stateBlend);
		float warpSpeed = mix(uIdleWarpSpeed, uWarpSpeed, stateBlend);
		float warpAmount = mix(uIdleWarpAmount, uWarpAmount, stateBlend);
		
		// Organic warping of the X coordinate so the bars feel like fluid
		float warpX = snoise(vec2(uv.x * warpFreq, time * warpSpeed)) * warpAmount * uActive;
		float sampleX = clamp(signalX + warpX, 0.0, 1.0);
		
		// Calculate distance from horizontal center (0.0 to 0.5)
		float distFromCenterX = abs(uv.x - 0.5);
		
		// Create a pyramid/tapered envelope: highest in the middle, fading down to the sides
		// We use a smoothstep to create a nice bell-like curve
		float pyramidEnvelope = smoothstep(0.5, 0.0, distFromCenterX);
		// Square it to make the falloff a bit steeper/more defined
		pyramidEnvelope *= pyramidEnvelope;
		
		// Read amplitude from the dynamic texture (1D array passed every frame)
		float sig = texture2D(uSignal, vec2(sampleX, 0.5)).a;
		
		float baseNoise = snoise(vec2(uv.x * 2.0, time * 0.35));
		float baseAmplitude = mix(uIdleBaseAmplitude, 0.05, stateBlend);
		float baseNoiseAmount = mix(uIdleBaseNoiseAmount, 0.03, stateBlend);
		float liftAmount = mix(uIdleLiftAmount, 0.05, stateBlend);
		float centerBaseY = mix(uIdleCenterY, 0.4, stateBlend);
		float centerSignalMul = mix(uIdleCenterSignalMul, 0.2, stateBlend);
		float thicknessBase = mix(uThicknessIdle, uThicknessActive, stateBlend);
		float thicknessSignalMul = mix(uIdleThicknessSignalMul, uThicknessSignalMul, stateBlend);

		float baseAmp = baseAmplitude + baseNoise * baseNoiseAmount;
		float amp = mix(baseAmp, max(baseAmp, sig), uActive) * pyramidEnvelope;
		amp += liftAmount * pyramidEnvelope * uActive;

		float displayedAmp = amp * uActive;
		float centerY = centerBaseY + displayedAmp * centerSignalMul;
		float distY = abs(uv.y - centerY);
		
		float thickness = max(
			(thicknessBase * uActive + displayedAmp * thicknessSignalMul) * uWaveformHeightScale,
			0.0001
		);
		
		// Gaussian core glow profile
		float glow = exp(- (distY * distY) / (thickness * thickness));

		// Liquid noise perturbation to make it wispy like flames/aurora
		float noiseGlowFreqX = mix(uIdleNoiseGlowFreqX, uNoiseGlowFreqX, stateBlend);
		float noiseGlowFreqY = mix(uIdleNoiseGlowFreqY, uNoiseGlowFreqY, stateBlend);
		float noiseGlowSpeed = mix(uIdleNoiseGlowSpeed, uNoiseGlowSpeed, stateBlend);
		float noiseGlowAmount = mix(uIdleNoiseGlowAmount, uNoiseGlowAmount, stateBlend);
		float noiseGlow = snoise(vec2(uv.x * noiseGlowFreqX, uv.y * noiseGlowFreqY - time * noiseGlowSpeed)) * noiseGlowAmount * displayedAmp;
		glow = clamp(glow + noiseGlow, 0.0, 1.0);

		vec4 color;

		if (uColorMode < 0.5) {
			// LINEAR mode — existing left-to-right gradient
			float cx = uv.x;
			if (cx < 0.33) {
				color = mix(uColor1, uColor2, smoothstep(0.0, 0.33, cx));
			} else if (cx < 0.66) {
				color = mix(uColor2, uColor3, smoothstep(0.33, 0.66, cx));
			} else {
				color = mix(uColor3, uColor4, smoothstep(0.66, 1.0, cx));
			}
		} else {
			// ORGANIC mode — virtual layers with drifting spatial offsets
			// Each color gets a 2D offset that drifts via sine/cosine
			float t = time * uOrganicDriftSpeed;
			float dr = uOrganicDriftRadius;

			// Spatial offsets per color (different frequencies for independence)
			vec2 off1 = vec2(sin(t * 0.7) * dr * 0.9, cos(t * 0.5) * dr * 0.3);
			vec2 off2 = vec2(cos(t * 0.9) * dr, sin(t * 0.6) * dr * 0.25);
			vec2 off3 = vec2(sin(t * 1.1 + 2.0) * dr * 1.1, cos(t * 0.8 + 1.0) * dr * 0.35);
			vec2 off4 = vec2(cos(t * 0.6 + 4.0) * dr * 0.8, sin(t * 0.7 + 3.0) * dr * 0.25);

			// Compute per-layer Gaussian glow at offset positions
			float dy1 = abs(uv.y - (centerY + off1.y));
			float dy2 = abs(uv.y - (centerY + off2.y));
			float dy3 = abs(uv.y - (centerY + off3.y));
			float dy4 = abs(uv.y - (centerY + off4.y));

			float g1 = exp(-(dy1 * dy1) / (thickness * thickness));
			float g2 = exp(-(dy2 * dy2) / (thickness * thickness));
			float g3 = exp(-(dy3 * dy3) / (thickness * thickness));
			float g4 = exp(-(dy4 * dy4) / (thickness * thickness));

			// Apply X-shifted noise per layer for variety
			float ns = uOrganicNoiseScale;
			float nsp = uOrganicNoiseSpeed;
			g1 *= smoothstep(-0.2, 0.5, snoise(vec2((uv.x + off1.x) * ns, time * nsp)));
			g2 *= smoothstep(-0.2, 0.5, snoise(vec2((uv.x + off2.x) * ns + 5.0, time * nsp * 1.17)));
			g3 *= smoothstep(-0.2, 0.5, snoise(vec2((uv.x + off3.x) * ns + 10.0, time * nsp * 0.93)));
			g4 *= smoothstep(-0.2, 0.5, snoise(vec2((uv.x + off4.x) * ns + 15.0, time * nsp * 1.07)));

			// Additive color accumulation (like real light mixing)
			color = uColor1 * g1 + uColor2 * g2 + uColor3 * g3 + uColor4 * g4;

			// Use combined glow for alpha
			glow = clamp(g1 + g2 + g3 + g4, 0.0, 1.0);
		}

		// Add intense white/hot core for high audio peaks (only when not idle)
		color.rgb += vec3(1.0, 0.9, 0.8) * smoothstep(0.7, 1.0, displayedAmp) * 0.5 * stateBlend;

		// Boost overall saturation and brightness based on state
		color.rgb *= mix(1.0, 1.1 + displayedAmp * 0.4, stateBlend);

		// Alpha calculation combining our glow and states
		float alpha = glow * uActive * color.a;
		
		// Independent horizontal fades let the waveform taper cleanly on both ends.
		float edgeFadeLeft = smoothstep(0.0, max(uEdgeFadeLeft, 0.001), uv.x);
		float edgeFadeRight = 1.0 - smoothstep(1.0 - max(uEdgeFadeRight, 0.001), 1.0, uv.x);
		alpha *= edgeFadeLeft * edgeFadeRight;
		
		// Ensure it fades out at the absolute bottom/top edges smoothly
		alpha *= smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.8, uv.y);
		
		gl_FragColor = vec4(color.rgb * alpha, alpha);
	}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type);
	if (!shader) return null;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

const DEFAULT_IDLE_PALETTE: Record<"c1" | "c2" | "c3" | "c4", RGBAColor> = {
	c1: [0.70, 0.75, 0.80, 1],
	c2: [0.75, 0.80, 0.85, 1],
	c3: [0.80, 0.85, 0.90, 1],
	c4: [0.75, 0.80, 0.85, 1],
};

function cloneColor(color: RGBAColor): RGBAColor {
	return [color[0], color[1], color[2], color[3]];
}

function lerpColor(cA: RGBAColor, cB: RGBAColor, t: number): RGBAColor {
	return [
		cA[0] + (cB[0] - cA[0]) * t,
		cA[1] + (cB[1] - cA[1]) * t,
		cA[2] + (cB[2] - cA[2]) * t,
		cA[3] + (cB[3] - cA[3]) * t,
	];
}

export function SmoothGradientWaveform({
	active = false,
	className,
	colorMode = "linear",
	config = DEFAULT_WAVEFORM_CONFIG,
	organicDriftSpeed = 0.4,
	organicDriftRadius = 0.2,
	organicNoiseScale = 2.0,
	organicNoiseSpeed = 0.3,
	signal = [],
	voiceState = "idle",
	generationState = "idle",
	micStream = null,
}: Readonly<SmoothGradientWaveformProps>) {
	const shouldReduceMotion = useReducedMotion();
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const glRef = useRef<WebGLRenderingContext | null>(null);
	const textureRef = useRef<WebGLTexture | null>(null);
	const programInfoRef = useRef<{
		program: WebGLProgram;
		locations: {
			position: number;
			uTime: WebGLUniformLocation | null;
			uActive: WebGLUniformLocation | null;
			uResolution: WebGLUniformLocation | null;
			uSignal: WebGLUniformLocation | null;
			uColor1: WebGLUniformLocation | null;
			uColor2: WebGLUniformLocation | null;
			uColor3: WebGLUniformLocation | null;
			uColor4: WebGLUniformLocation | null;
			uStateMode: WebGLUniformLocation | null;
			uTimeSpeedIdle: WebGLUniformLocation | null;
			uTimeSpeedActive: WebGLUniformLocation | null;
			uMotionSpeed: WebGLUniformLocation | null;
			uIdleBaseAmplitude: WebGLUniformLocation | null;
			uIdleBaseNoiseAmount: WebGLUniformLocation | null;
			uIdleLiftAmount: WebGLUniformLocation | null;
			uIdleCenterY: WebGLUniformLocation | null;
			uIdleCenterSignalMul: WebGLUniformLocation | null;
			uIdleThicknessSignalMul: WebGLUniformLocation | null;
			uIdleWarpFreq: WebGLUniformLocation | null;
			uIdleWarpSpeed: WebGLUniformLocation | null;
			uIdleWarpAmount: WebGLUniformLocation | null;
			uIdleNoiseGlowFreqX: WebGLUniformLocation | null;
			uIdleNoiseGlowFreqY: WebGLUniformLocation | null;
			uIdleNoiseGlowSpeed: WebGLUniformLocation | null;
			uIdleNoiseGlowAmount: WebGLUniformLocation | null;
			uWarpFreq: WebGLUniformLocation | null;
			uWarpSpeed: WebGLUniformLocation | null;
			uWarpAmount: WebGLUniformLocation | null;
			uNoiseGlowFreqX: WebGLUniformLocation | null;
			uNoiseGlowFreqY: WebGLUniformLocation | null;
			uNoiseGlowSpeed: WebGLUniformLocation | null;
			uNoiseGlowAmount: WebGLUniformLocation | null;
			uThicknessIdle: WebGLUniformLocation | null;
			uThicknessActive: WebGLUniformLocation | null;
			uThicknessSignalMul: WebGLUniformLocation | null;
			uWaveformHeightScale: WebGLUniformLocation | null;
			uEdgeFadeLeft: WebGLUniformLocation | null;
			uEdgeFadeRight: WebGLUniformLocation | null;
			uColorMode: WebGLUniformLocation | null;
			uOrganicDriftSpeed: WebGLUniformLocation | null;
			uOrganicDriftRadius: WebGLUniformLocation | null;
			uOrganicNoiseScale: WebGLUniformLocation | null;
			uOrganicNoiseSpeed: WebGLUniformLocation | null;
		};
	} | null>(null);

	const activeRef = useRef(active);
	const targetActiveRef = useRef(active ? 1 : 0);
	const currentActiveRef = useRef(active ? 1 : 0);
	
	const signalRef = useRef(signal);
	const voiceStateRef = useRef(voiceState);
	const generationStateRef = useRef(generationState);
	const configRef = useRef(config);
	const colorModeRef = useRef(colorMode);
	const organicDriftSpeedRef = useRef(organicDriftSpeed);
	const organicDriftRadiusRef = useRef(organicDriftRadius);
	const organicNoiseScaleRef = useRef(organicNoiseScale);
	const organicNoiseSpeedRef = useRef(organicNoiseSpeed);

	// Mic analyser state for user speaking
	const analyserContextRef = useRef<{
		audioCtx: AudioContext;
		analyser: AnalyserNode;
		dataArray: Uint8Array<ArrayBuffer>;
		source: MediaStreamAudioSourceNode;
	} | null>(null);

	// Smoothed signal buffer — interpolates toward raw signal slowly
	const smoothedSignalRef = useRef<Float32Array>(new Float32Array(32));

	// Colors state
	const currentColor1Ref = useRef<RGBAColor>(cloneColor(DEFAULT_IDLE_PALETTE.c1));
	const currentColor2Ref = useRef<RGBAColor>(cloneColor(DEFAULT_IDLE_PALETTE.c2));
	const currentColor3Ref = useRef<RGBAColor>(cloneColor(DEFAULT_IDLE_PALETTE.c3));
	const currentColor4Ref = useRef<RGBAColor>(cloneColor(DEFAULT_IDLE_PALETTE.c4));
	const currentStateModeRef = useRef(0.0);
	
	const renderFrameRef = useRef<((time: number) => void) | null>(null);
	
	useEffect(() => {
		configRef.current = config;
	}, [config]);

	useEffect(() => {
		colorModeRef.current = colorMode;
		organicDriftSpeedRef.current = organicDriftSpeed;
		organicDriftRadiusRef.current = organicDriftRadius;
		organicNoiseScaleRef.current = organicNoiseScale;
		organicNoiseSpeedRef.current = organicNoiseSpeed;
	}, [colorMode, organicDriftSpeed, organicDriftRadius, organicNoiseScale, organicNoiseSpeed]);

	useEffect(() => {
		signalRef.current = signal;
	}, [signal]);

	useEffect(() => {
		voiceStateRef.current = voiceState;
		generationStateRef.current = generationState;
	}, [voiceState, generationState]);
	
	useEffect(() => {
		activeRef.current = active;
		targetActiveRef.current = active ? 1 : 0;
		if (active) {
			containerRef.current?.setAttribute("data-visible", "");
			if (!animationFrameRef.current && renderFrameRef.current) {
				animationFrameRef.current = requestAnimationFrame(renderFrameRef.current);
			}
		} else {
			containerRef.current?.removeAttribute("data-visible");
		}
	}, [active]);

	// Initialize Audio Analyser for User Voice
	useEffect(() => {
		if (!micStream || voiceState !== "listening") {
			if (analyserContextRef.current) {
				const { audioCtx, analyser, source } = analyserContextRef.current;
				source.disconnect();
				analyser.disconnect();
				audioCtx.close().catch(() => {});
				analyserContextRef.current = null;
			}
			return;
		}

		const AudioContextConstructor =
			window.AudioContext ||
			(window as Window & typeof globalThis & {
				webkitAudioContext?: typeof AudioContext;
			}).webkitAudioContext;
		if (!AudioContextConstructor) {
			return;
		}

		const audioCtx = new AudioContextConstructor();
		const analyser = audioCtx.createAnalyser();
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = 0.88;
		const source = audioCtx.createMediaStreamSource(micStream);
		source.connect(analyser);

		analyserContextRef.current = {
			audioCtx,
			analyser,
			dataArray: new Uint8Array(analyser.frequencyBinCount),
			source,
		};

		return () => {
			source.disconnect();
			analyser.disconnect();
			audioCtx.close().catch(() => {});
			analyserContextRef.current = null;
		};
	}, [micStream, voiceState]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true });
		if (!gl) return;
		glRef.current = gl;

		const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
		const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

		if (!vertexShader || !fragmentShader) return;

		const program = gl.createProgram();
		if (!program) return;
		
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			return;
		}

		const locations = {
			position: gl.getAttribLocation(program, "position"),
			uTime: gl.getUniformLocation(program, "uTime"),
			uActive: gl.getUniformLocation(program, "uActive"),
			uResolution: gl.getUniformLocation(program, "uResolution"),
			uSignal: gl.getUniformLocation(program, "uSignal"),
			uColor1: gl.getUniformLocation(program, "uColor1"),
			uColor2: gl.getUniformLocation(program, "uColor2"),
			uColor3: gl.getUniformLocation(program, "uColor3"),
			uColor4: gl.getUniformLocation(program, "uColor4"),
			uStateMode: gl.getUniformLocation(program, "uStateMode"),
			uTimeSpeedIdle: gl.getUniformLocation(program, "uTimeSpeedIdle"),
			uTimeSpeedActive: gl.getUniformLocation(program, "uTimeSpeedActive"),
			uMotionSpeed: gl.getUniformLocation(program, "uMotionSpeed"),
			uIdleBaseAmplitude: gl.getUniformLocation(program, "uIdleBaseAmplitude"),
			uIdleBaseNoiseAmount: gl.getUniformLocation(program, "uIdleBaseNoiseAmount"),
			uIdleLiftAmount: gl.getUniformLocation(program, "uIdleLiftAmount"),
			uIdleCenterY: gl.getUniformLocation(program, "uIdleCenterY"),
			uIdleCenterSignalMul: gl.getUniformLocation(program, "uIdleCenterSignalMul"),
			uIdleThicknessSignalMul: gl.getUniformLocation(program, "uIdleThicknessSignalMul"),
			uIdleWarpFreq: gl.getUniformLocation(program, "uIdleWarpFreq"),
			uIdleWarpSpeed: gl.getUniformLocation(program, "uIdleWarpSpeed"),
			uIdleWarpAmount: gl.getUniformLocation(program, "uIdleWarpAmount"),
			uIdleNoiseGlowFreqX: gl.getUniformLocation(program, "uIdleNoiseGlowFreqX"),
			uIdleNoiseGlowFreqY: gl.getUniformLocation(program, "uIdleNoiseGlowFreqY"),
			uIdleNoiseGlowSpeed: gl.getUniformLocation(program, "uIdleNoiseGlowSpeed"),
			uIdleNoiseGlowAmount: gl.getUniformLocation(program, "uIdleNoiseGlowAmount"),
			uWarpFreq: gl.getUniformLocation(program, "uWarpFreq"),
			uWarpSpeed: gl.getUniformLocation(program, "uWarpSpeed"),
			uWarpAmount: gl.getUniformLocation(program, "uWarpAmount"),
			uNoiseGlowFreqX: gl.getUniformLocation(program, "uNoiseGlowFreqX"),
			uNoiseGlowFreqY: gl.getUniformLocation(program, "uNoiseGlowFreqY"),
			uNoiseGlowSpeed: gl.getUniformLocation(program, "uNoiseGlowSpeed"),
			uNoiseGlowAmount: gl.getUniformLocation(program, "uNoiseGlowAmount"),
			uThicknessIdle: gl.getUniformLocation(program, "uThicknessIdle"),
			uThicknessActive: gl.getUniformLocation(program, "uThicknessActive"),
			uThicknessSignalMul: gl.getUniformLocation(program, "uThicknessSignalMul"),
			uWaveformHeightScale: gl.getUniformLocation(program, "uWaveformHeightScale"),
			uEdgeFadeLeft: gl.getUniformLocation(program, "uEdgeFadeLeft"),
			uEdgeFadeRight: gl.getUniformLocation(program, "uEdgeFadeRight"),
			uColorMode: gl.getUniformLocation(program, "uColorMode"),
			uOrganicDriftSpeed: gl.getUniformLocation(program, "uOrganicDriftSpeed"),
			uOrganicDriftRadius: gl.getUniformLocation(program, "uOrganicDriftRadius"),
			uOrganicNoiseScale: gl.getUniformLocation(program, "uOrganicNoiseScale"),
			uOrganicNoiseSpeed: gl.getUniformLocation(program, "uOrganicNoiseSpeed"),
		};

		programInfoRef.current = { program, locations };

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		const positions = new Float32Array([
			-1.0, -1.0,
			 1.0, -1.0,
			-1.0,  1.0,
			-1.0,  1.0,
			 1.0, -1.0,
			 1.0,  1.0,
		]);
		gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

		// Setup signal texture
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		textureRef.current = texture;

		gl.useProgram(program);
		gl.uniform1i(locations.uSignal, 0);

		return () => {
			if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
			gl.deleteBuffer(positionBuffer);
			if (texture) gl.deleteTexture(texture);
		};
	}, []);

	useEffect(() => {
		if (!glRef.current || !programInfoRef.current) return;
		const gl = glRef.current;

		const startTime = performance.now();

		const render = (time: number) => {
			const pInfo = programInfoRef.current;
			if (!pInfo) return;
			const { program, locations } = pInfo;

			const container = containerRef.current;
			const canvas = canvasRef.current;
			if (!container || !canvas) return;

			const width = container.clientWidth;
			const height = container.clientHeight;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const displayWidth = Math.round(width * dpr);
			const displayHeight = Math.round(height * dpr);

			if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
				canvas.width = displayWidth;
				canvas.height = displayHeight;
				gl.viewport(0, 0, canvas.width, canvas.height);
			}

			gl.useProgram(program);
			gl.uniform2f(locations.uResolution, canvas.width, canvas.height);
			
			const elapsed = (time - startTime) * 0.001;
			gl.uniform1f(locations.uTime, shouldReduceMotion ? 0 : elapsed);

			// Use separate rates so appear/disappear can be tuned independently in the preview.
			const fadeRate =
				targetActiveRef.current > currentActiveRef.current
					? configRef.current.activeFadeRate
					: configRef.current.disappearFadeRate;
			currentActiveRef.current += (targetActiveRef.current - currentActiveRef.current) * fadeRate;
			gl.uniform1f(locations.uActive, currentActiveRef.current);

			const cfg = configRef.current;

			const dynamicPalettes = {
				idle: {
					c1: cloneColor(cfg.idleColor1),
					c2: cloneColor(cfg.idleColor2),
					c3: cloneColor(cfg.idleColor3),
					c4: cloneColor(cfg.idleColor4),
				},
				user: {
					c1: cloneColor(cfg.userColor1),
					c2: cloneColor(cfg.userColor2),
					c3: cloneColor(cfg.userColor3),
					c4: cloneColor(cfg.userColor4),
				},
				ai: {
					c1: cloneColor(cfg.aiColor1),
					c2: cloneColor(cfg.aiColor2),
					c3: cloneColor(cfg.aiColor3),
					c4: cloneColor(cfg.aiColor4),
				},
			};

			// Determine state phase
			let activeSignal: readonly number[] = [];
			let targetStateMode = 0.0;
			let targetColors = dynamicPalettes.idle;

			const vState = voiceStateRef.current;
			const gState = generationStateRef.current;

			if (vState === "speaking" || gState === "generating") {
				activeSignal = signalRef.current;
				targetStateMode = 2.0;
				targetColors = dynamicPalettes.ai;
			} else if (vState === "idle" && signalRef.current.length > 0) {
				activeSignal = signalRef.current;
				targetStateMode = 0.0;
				targetColors = dynamicPalettes.idle;
			} else if (vState === "listening") {
				if (analyserContextRef.current) {
					const { analyser, dataArray } = analyserContextRef.current;
					analyser.getByteFrequencyData(dataArray);

					const bandCount = 16;
					const binsPerBand = Math.floor(dataArray.length / bandCount);
					let sum = 0;
					const arr: number[] = [];
					for (let b = 0; b < bandCount; b++) {
						let bandSum = 0;
						for (let j = 0; j < binsPerBand; j++) {
							bandSum += dataArray[b * binsPerBand + j];
						}
						const val = (bandSum / binsPerBand) / 255;
						arr.push(val);
						sum += val;
					}

					const avg = sum / bandCount;
					if (avg > 0.05) {
						targetStateMode = 1.0;
						targetColors = dynamicPalettes.user;
					} else {
						targetStateMode = 0.0;
						targetColors = dynamicPalettes.idle;
					}
					activeSignal = arr;
				} else if (signalRef.current.length > 0) {
					activeSignal = signalRef.current;
					targetStateMode = 1.0;
					targetColors = dynamicPalettes.user;
				} else {
					targetStateMode = 0.0;
					targetColors = dynamicPalettes.idle;
				}
			}

			const motionSpeed =
				targetStateMode >= 2
					? cfg.motionSpeedAi
					: targetStateMode >= 1
						? cfg.motionSpeedUser
						: cfg.motionSpeedIdle;
			const scaledColorLerpRate = cfg.colorLerpRate * motionSpeed;
			const scaledStateModeLerpRate = cfg.stateModeLerpRate * motionSpeed;

			// Slow or freeze state transitions alongside the visible waveform motion.
			currentColor1Ref.current = lerpColor(currentColor1Ref.current, targetColors.c1, scaledColorLerpRate);
			currentColor2Ref.current = lerpColor(currentColor2Ref.current, targetColors.c2, scaledColorLerpRate);
			currentColor3Ref.current = lerpColor(currentColor3Ref.current, targetColors.c3, scaledColorLerpRate);
			currentColor4Ref.current = lerpColor(currentColor4Ref.current, targetColors.c4, scaledColorLerpRate);
			currentStateModeRef.current += (targetStateMode - currentStateModeRef.current) * scaledStateModeLerpRate;

			gl.uniform4f(locations.uColor1, currentColor1Ref.current[0], currentColor1Ref.current[1], currentColor1Ref.current[2], currentColor1Ref.current[3]);
			gl.uniform4f(locations.uColor2, currentColor2Ref.current[0], currentColor2Ref.current[1], currentColor2Ref.current[2], currentColor2Ref.current[3]);
			gl.uniform4f(locations.uColor3, currentColor3Ref.current[0], currentColor3Ref.current[1], currentColor3Ref.current[2], currentColor3Ref.current[3]);
			gl.uniform4f(locations.uColor4, currentColor4Ref.current[0], currentColor4Ref.current[1], currentColor4Ref.current[2], currentColor4Ref.current[3]);
			gl.uniform1f(locations.uStateMode, currentStateModeRef.current);

			gl.uniform1f(locations.uTimeSpeedIdle, cfg.timeSpeedIdle);
			gl.uniform1f(locations.uTimeSpeedActive, cfg.timeSpeedActive);
			gl.uniform1f(locations.uMotionSpeed, motionSpeed);
			gl.uniform1f(locations.uIdleBaseAmplitude, cfg.idleBaseAmplitude);
			gl.uniform1f(locations.uIdleBaseNoiseAmount, cfg.idleBaseNoiseAmount);
			gl.uniform1f(locations.uIdleLiftAmount, cfg.idleLiftAmount);
			gl.uniform1f(locations.uIdleCenterY, cfg.idleCenterY);
			gl.uniform1f(locations.uIdleCenterSignalMul, cfg.idleCenterSignalMul);
			gl.uniform1f(locations.uIdleThicknessSignalMul, cfg.idleThicknessSignalMul);
			gl.uniform1f(locations.uIdleWarpFreq, cfg.idleWarpFreq);
			gl.uniform1f(locations.uIdleWarpSpeed, cfg.idleWarpSpeed);
			gl.uniform1f(locations.uIdleWarpAmount, cfg.idleWarpAmount);
			gl.uniform1f(locations.uIdleNoiseGlowFreqX, cfg.idleNoiseGlowFreqX);
			gl.uniform1f(locations.uIdleNoiseGlowFreqY, cfg.idleNoiseGlowFreqY);
			gl.uniform1f(locations.uIdleNoiseGlowSpeed, cfg.idleNoiseGlowSpeed);
			gl.uniform1f(locations.uIdleNoiseGlowAmount, cfg.idleNoiseGlowAmount);
			gl.uniform1f(locations.uWarpFreq, cfg.warpFreq);
			gl.uniform1f(locations.uWarpSpeed, cfg.warpSpeed);
			gl.uniform1f(locations.uWarpAmount, cfg.warpAmount);
			gl.uniform1f(locations.uNoiseGlowFreqX, cfg.noiseGlowFreqX);
			gl.uniform1f(locations.uNoiseGlowFreqY, cfg.noiseGlowFreqY);
			gl.uniform1f(locations.uNoiseGlowSpeed, cfg.noiseGlowSpeed);
			gl.uniform1f(locations.uNoiseGlowAmount, cfg.noiseGlowAmount);
			gl.uniform1f(locations.uThicknessIdle, cfg.thicknessIdle);
			gl.uniform1f(locations.uThicknessActive, cfg.thicknessActive);
			gl.uniform1f(locations.uThicknessSignalMul, cfg.thicknessSignalMul);
			gl.uniform1f(locations.uWaveformHeightScale, cfg.waveformHeightScale);
			gl.uniform1f(locations.uEdgeFadeLeft, cfg.edgeFadeLeft);
			gl.uniform1f(locations.uEdgeFadeRight, cfg.edgeFadeRight);
			gl.uniform1f(locations.uColorMode, colorModeRef.current === "organic" ? 1.0 : 0.0);
			gl.uniform1f(locations.uOrganicDriftSpeed, organicDriftSpeedRef.current);
			gl.uniform1f(locations.uOrganicDriftRadius, organicDriftRadiusRef.current);
			gl.uniform1f(locations.uOrganicNoiseScale, organicNoiseScaleRef.current);
			gl.uniform1f(locations.uOrganicNoiseSpeed, organicNoiseSpeedRef.current);

			// Smoothly interpolate signal toward target — heavy dampening
			// so beats don't cause instant shape jumps.
			// On length change, resample from the old buffer instead of snapping.
			const smoothLerp = cfg.signalSmoothRate * motionSpeed;
			let smoothBuf = smoothedSignalRef.current;
			if (activeSignal.length > 0) {
				if (smoothBuf.length !== activeSignal.length) {
					const newBuf = new Float32Array(activeSignal.length);
					for (let i = 0; i < activeSignal.length; i++) {
						if (smoothBuf.length > 0) {
							const srcIdx = (i / activeSignal.length) * smoothBuf.length;
							const lo = Math.floor(srcIdx);
							const hi = Math.min(lo + 1, smoothBuf.length - 1);
							const frac = srcIdx - lo;
							newBuf[i] = smoothBuf[lo] * (1 - frac) + smoothBuf[hi] * frac;
						} else {
							newBuf[i] = 0;
						}
					}
					smoothedSignalRef.current = newBuf;
					smoothBuf = newBuf;
				}
				for (let i = 0; i < activeSignal.length; i++) {
					const target = activeSignal[i];
					const rate = target > smoothBuf[i] ? smoothLerp * cfg.signalRiseMul : smoothLerp * cfg.signalFallMul;
					smoothBuf[i] += (target - smoothBuf[i]) * rate;
				}
			} else {
				for (let i = 0; i < smoothBuf.length; i++) {
					smoothBuf[i] *= cfg.signalDecay;
				}
			}

			// Upload the smoothed signal to the texture
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, textureRef.current);

			const finalBuf = smoothedSignalRef.current;
			if (finalBuf.length > 0) {
				const arr = new Uint8Array(finalBuf.length);
				for (let i = 0; i < finalBuf.length; i++) {
					arr[i] = Math.min(255, Math.floor(finalBuf[i] * 255));
				}
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, finalBuf.length, 1, 0, gl.ALPHA, gl.UNSIGNED_BYTE, arr);
			} else {
				const arr = new Uint8Array([0, 0]);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, 2, 1, 0, gl.ALPHA, gl.UNSIGNED_BYTE, arr);
			}

			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			gl.enableVertexAttribArray(locations.position);
			gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
			
			// We use ONE blending because we premultiplied alpha in the shader
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

			gl.drawArrays(gl.TRIANGLES, 0, 6);

			if (currentActiveRef.current > 0.01 || targetActiveRef.current > 0) {
				animationFrameRef.current = requestAnimationFrame(render);
			} else {
				animationFrameRef.current = null;
			}
		};
		
		renderFrameRef.current = render;

		if (targetActiveRef.current > 0 || currentActiveRef.current > 0) {
			if (!animationFrameRef.current) {
				animationFrameRef.current = requestAnimationFrame(render);
			}
		}

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		};
	}, [shouldReduceMotion]); // Depend entirely on refs

	return (
		<div
			aria-hidden="true"
			className={cn(
				"pointer-events-none absolute bottom-[-8%] left-1/2 z-0 aspect-[4/1] w-[100%] -translate-x-1/2 overflow-visible opacity-0 transition-opacity duration-700 ease-out data-[visible]:opacity-100",
				className,
			)}
			data-slot="smooth-gradient-waveform"
			ref={containerRef}
			style={{
				width: `${config.waveformWidthPercent}%`,
			}}
		>
			<canvas
				aria-hidden="true"
				className="absolute inset-0 h-full w-full pointer-events-none"
				ref={canvasRef}
			/>
		</div>
	);
}
