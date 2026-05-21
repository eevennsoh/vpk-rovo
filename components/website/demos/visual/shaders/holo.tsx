"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 v_uv;
void main() {
	v_uv = a_position * 0.5 + 0.5;
	gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform float u_speed;
uniform float u_scale;
uniform float u_turbAmp;
uniform float u_turbIter;
uniform float u_warp;
uniform float u_fringeFreq;
uniform float u_iter;
uniform float u_bandSpread;
uniform float u_noise;
uniform float u_bumpStrength;
uniform float u_ambient;
uniform float u_saturation;
uniform float u_exposure;

const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

uvec3 hash3(uvec3 v) {
	v = v * 1664525u + 1013904223u;
	v.x += v.y * v.z;
	v.y += v.z * v.x;
	v.z += v.x * v.y;
	v ^= v >> 16u;
	v.x += v.y * v.z;
	v.y += v.z * v.x;
	v.z += v.x * v.y;
	return v;
}

vec3 seedRandom(float seedVal) {
	uvec3 s = uvec3(
		floatBitsToUint(seedVal),
		floatBitsToUint(seedVal * 1.5 + 7.31),
		floatBitsToUint(seedVal * 2.7 + 13.37)
	);
	s = hash3(s);
	return vec3(s) / float(0xFFFFFFFFu);
}

vec2 computeWarp(vec2 q, float t, vec2 seedPhase, vec3 seedOffset, vec3 seedOffset2) {
	float a = seedPhase.x;
	float d = seedPhase.y;
	int turbIter = int(u_turbIter);
	for (int j = 1; j < 8; j++) {
		if (j >= turbIter) break;
		float fj = float(j);
		q -= u_turbAmp * sin(dot(sin(q), cos(q)) * fj + t + a * u_warp) / fj;
		a += sin(fj + q.y * 0.9 + q.x * 2.0 - t + d * 0.7 + seedOffset.z);
		d += cos(fj * q.x * 0.5 + a * 0.3 + seedOffset2.z);
	}
	return q;
}

float fringe(vec2 q, float t) {
	return sin(
		q.y / max(u_fringeFreq, 0.01) +
		q.y * cos(q.x / 0.2 + cos(q.x / 0.3) + t * 3.0)
	);
}

vec3 palette(float t) {
	vec3 a = vec3(0.5, 0.5, 0.5);
	vec3 b = vec3(0.5, 0.5, 0.5);
	vec3 c = vec3(1.0, 1.0, 1.0);
	vec3 d = vec3(0.00, 0.33, 0.67);
	return a + b * cos(TAU * (c * t + d));
}

void main() {
	vec2 fragCoord = v_uv * u_resolution;
	vec2 p = (fragCoord + fragCoord - u_resolution) / u_resolution.y;
	float t = u_time * u_speed * 0.4;

	vec3 seedOffset = seedRandom(u_seed);
	vec3 seedOffset2 = seedRandom(u_seed + 100.0);
	vec3 seedOffset3 = seedRandom(u_seed + 200.0);
	float seedAngle = u_seed * GOLDEN_ANGLE;
	vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;
	vec2 seedShift = (seedOffset3.xy - 0.5) * 6.0;

	float cs = cos(seedAngle);
	float sn = sin(seedAngle);
	p = mat2(cs, -sn, sn, cs) * p;

	float n = fract(sin(dot(fragCoord, vec2(12.9898, 78.233))) * 43758.5453);

	vec2 q = computeWarp(p * u_scale + seedShift, t, seedPhase, seedOffset, seedOffset2);
	vec2 q2 = computeWarp((p - 0.01) * u_scale + seedShift, t, seedPhase, seedOffset, seedOffset2);

	float f = fringe(q, t);
	float f2 = fringe(q2, t);

	float bump = max(f2 - f, 0.0) / 0.02 * 0.7071;
	float bump2 = max(f - f2, 0.0) / 0.02 * 0.7071;
	bump2 = bump2 * bump2 + pow(bump2, 2.0) * 0.05;

	vec3 col = vec3(0.0);
	float iter = max(1.0, 10.0 - u_iter * 0.88);

	for (float i = 0.0; i < 6.0; i++) {
		float eph = i / iter;
		float holo = sin(
			q.y / max(u_fringeFreq, 0.01) +
			q.y * cos(q.x / 0.2 + cos(q.x / 0.3) + t * 3.0) +
			i * u_bandSpread +
			seedOffset.z * TAU +
			n * u_noise
		);

		float v = 0.4 + 0.6 * holo;
		vec3 spectrum = palette(eph + holo * 0.3);
		col += spectrum * v * 0.15;
	}

	float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
	col = mix(vec3(luma), col, u_saturation);
	col *= vec3(bump, (bump + bump2) * 0.05, bump2) * u_bumpStrength + 0.5;
	col += u_ambient;
	col = vec3(tanh(col * u_exposure));

	fragColor = vec4(col, 1.0);
}
`;

export interface HoloProps {
	className?: string;
	seed?: number;
	speed?: number;
	scale?: number;
	turbAmp?: number;
	turbIter?: number;
	warp?: number;
	fringeFreq?: number;
	iter?: number;
	bandSpread?: number;
	noise?: number;
	bumpStrength?: number;
	ambient?: number;
	saturation?: number;
	exposure?: number;
}

export default function Holo({
	className,
	seed = 600,
	speed = 0.5,
	scale = 1,
	turbAmp = 1,
	turbIter = 3,
	warp = 5,
	fringeFreq = 0.3,
	iter = 0,
	bandSpread = 1.2,
	noise = 0,
	bumpStrength = 0,
	ambient = 0.07,
	saturation = 2.55,
	exposure = 9,
}: HoloProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);

	const propsRef = useRef({
		seed,
		speed,
		scale,
		turbAmp,
		turbIter,
		warp,
		fringeFreq,
		iter,
		bandSpread,
		noise,
		bumpStrength,
		ambient,
		saturation,
		exposure,
	});

	useLayoutEffect(() => {
		propsRef.current = {
			seed,
			speed,
			scale,
			turbAmp,
			turbIter,
			warp,
			fringeFreq,
			iter,
			bandSpread,
			noise,
			bumpStrength,
			ambient,
			saturation,
			exposure,
		};
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
		if (!gl) return;

		const compile = (type: number, src: string) => {
			const shader = gl.createShader(type);
			if (!shader) return null;
			gl.shaderSource(shader, src);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(shader));
				gl.deleteShader(shader);
				return null;
			}
			return shader;
		};

		const vertexShader = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragmentShader = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
		if (!vertexShader || !fragmentShader) return;

		const program = gl.createProgram();
		if (!program) return;
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return;
		}
		gl.useProgram(program);

		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

		const position = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

		const u = {
			resolution: gl.getUniformLocation(program, "u_resolution"),
			time: gl.getUniformLocation(program, "u_time"),
			seed: gl.getUniformLocation(program, "u_seed"),
			speed: gl.getUniformLocation(program, "u_speed"),
			scale: gl.getUniformLocation(program, "u_scale"),
			turbAmp: gl.getUniformLocation(program, "u_turbAmp"),
			turbIter: gl.getUniformLocation(program, "u_turbIter"),
			warp: gl.getUniformLocation(program, "u_warp"),
			fringeFreq: gl.getUniformLocation(program, "u_fringeFreq"),
			iter: gl.getUniformLocation(program, "u_iter"),
			bandSpread: gl.getUniformLocation(program, "u_bandSpread"),
			noise: gl.getUniformLocation(program, "u_noise"),
			bumpStrength: gl.getUniformLocation(program, "u_bumpStrength"),
			ambient: gl.getUniformLocation(program, "u_ambient"),
			saturation: gl.getUniformLocation(program, "u_saturation"),
			exposure: gl.getUniformLocation(program, "u_exposure"),
		};

		let cancelled = false;
		const start = performance.now();
		const render = () => {
			if (cancelled) return;
			const p = propsRef.current;

			const dpr = window.devicePixelRatio || 1;
			const width = canvas.clientWidth * dpr;
			const height = canvas.clientHeight * dpr;

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}

			if (u.resolution) gl.uniform2f(u.resolution, width, height);
			if (u.time) gl.uniform1f(u.time, (performance.now() - start) / 1000);

			if (u.seed) gl.uniform1f(u.seed, p.seed);
			if (u.speed) gl.uniform1f(u.speed, p.speed);
			if (u.scale) gl.uniform1f(u.scale, p.scale);
			if (u.turbAmp) gl.uniform1f(u.turbAmp, p.turbAmp);
			if (u.turbIter) gl.uniform1f(u.turbIter, p.turbIter);
			if (u.warp) gl.uniform1f(u.warp, p.warp);
			if (u.fringeFreq) gl.uniform1f(u.fringeFreq, p.fringeFreq);
			if (u.iter) gl.uniform1f(u.iter, p.iter);
			if (u.bandSpread) gl.uniform1f(u.bandSpread, p.bandSpread);
			if (u.noise) gl.uniform1f(u.noise, p.noise);
			if (u.bumpStrength) gl.uniform1f(u.bumpStrength, p.bumpStrength);
			if (u.ambient) gl.uniform1f(u.ambient, p.ambient);
			if (u.saturation) gl.uniform1f(u.saturation, p.saturation);
			if (u.exposure) gl.uniform1f(u.exposure, p.exposure);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};

		animRef.current = requestAnimationFrame(render);

		return () => {
			cancelled = true;
			cancelAnimationFrame(animRef.current);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
