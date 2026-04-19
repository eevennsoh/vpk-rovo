"use client";

import { useEffect, useRef } from "react";
import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";

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
uniform vec4 u_colors[4];
uniform int u_colors_length;

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

vec3 getColor(int idx) {
	if (u_colors_length < 1) return vec3(0.0);
	int safeIdx = clamp(idx, 0, u_colors_length - 1);
	return u_colors[safeIdx].rgb;
}

vec3 toLinear(vec3 c) {
	return pow(c, vec3(2.2));
}

vec3 linearToOklab(vec3 c) {
	float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
	float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
	float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
	l = pow(max(l, 0.0), 1.0 / 3.0);
	m = pow(max(m, 0.0), 1.0 / 3.0);
	s = pow(max(s, 0.0), 1.0 / 3.0);
	return vec3(
		0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
	);
}

vec3 oklabToLinear(vec3 c) {
	float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
	float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
	float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
	l = l * l * l;
	m = m * m * m;
	s = s * s * s;
	return vec3(
		+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
	);
}

vec3 oklabToLch(vec3 lab) {
	return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 lchToOklab(vec3 lch) {
	return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
	vec3 lch0 = oklabToLch(lab0);
	vec3 lch1 = oklabToLch(lab1);
	if (lch0.y < 0.05) lch0.z = lch1.z;
	if (lch1.y < 0.05) lch1.z = lch0.z;
	float dh = lch1.z - lch0.z;
	if (dh > 3.14159265) dh -= 6.28318530;
	if (dh < -3.14159265) dh += 6.28318530;
	return lchToOklab(vec3(
		mix(lch0.x, lch1.x, t),
		mix(lch0.y, lch1.y, t),
		lch0.z + dh * t
	));
}

vec3 palette(float t) {
	if (u_colors_length < 1) return vec3(0.0);
	if (u_colors_length == 1) return getColor(0);
	float wrapped = fract(t);
	float scaled = wrapped * float(u_colors_length);
	int idx = int(floor(scaled)) % u_colors_length;
	int nextIdx = (idx + 1) % u_colors_length;
	float localT = fract(scaled);
	vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
	vec3 lab1 = linearToOklab(toLinear(getColor(nextIdx)));
	return oklabToLinear(mixLch(lab0, lab1, localT));
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
	colors?: readonly [string, string, string, string];
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
	colors = ROVO_SHADER_COLOR_HEX,
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

	function hexToRgb(hex: string): [number, number, number] {
		const value = hex.replace("#", "");
		return [
			parseInt(value.substring(0, 2), 16) / 255,
			parseInt(value.substring(2, 4), 16) / 255,
			parseInt(value.substring(4, 6), 16) / 255,
		];
	}

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

		const uResolution = gl.getUniformLocation(program, "u_resolution");
		const uTime = gl.getUniformLocation(program, "u_time");
		const uColorsLen = gl.getUniformLocation(program, "u_colors_length");

		gl.uniform1f(gl.getUniformLocation(program, "u_seed"), seed);
		gl.uniform1f(gl.getUniformLocation(program, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(program, "u_scale"), scale);
		gl.uniform1f(gl.getUniformLocation(program, "u_turbAmp"), turbAmp);
		gl.uniform1f(gl.getUniformLocation(program, "u_turbIter"), turbIter);
		gl.uniform1f(gl.getUniformLocation(program, "u_warp"), warp);
		gl.uniform1f(gl.getUniformLocation(program, "u_fringeFreq"), fringeFreq);
		gl.uniform1f(gl.getUniformLocation(program, "u_iter"), iter);
		gl.uniform1f(gl.getUniformLocation(program, "u_bandSpread"), bandSpread);
		gl.uniform1f(gl.getUniformLocation(program, "u_noise"), noise);
		gl.uniform1f(gl.getUniformLocation(program, "u_bumpStrength"), bumpStrength);
		gl.uniform1f(gl.getUniformLocation(program, "u_ambient"), ambient);
		gl.uniform1f(gl.getUniformLocation(program, "u_saturation"), saturation);
		gl.uniform1f(gl.getUniformLocation(program, "u_exposure"), exposure);
		gl.uniform1i(uColorsLen, colors.length);
		for (let i = 0; i < 4; i++) {
			const loc = gl.getUniformLocation(program, `u_colors[${i}]`);
			if (i < colors.length) {
				const [r, g, b] = hexToRgb(colors[i]);
				gl.uniform4f(loc, r, g, b, 1.0);
			} else {
				gl.uniform4f(loc, 0, 0, 0, 1.0);
			}
		}

		const start = performance.now();
		const render = () => {
			const dpr = window.devicePixelRatio || 1;
			const width = canvas.clientWidth * dpr;
			const height = canvas.clientHeight * dpr;

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}

			gl.uniform2f(uResolution, width, height);
			gl.uniform1f(uTime, (performance.now() - start) / 1000);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};

		animRef.current = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(animRef.current);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		};
	}, [ambient, bandSpread, bumpStrength, colors, exposure, fringeFreq, iter, noise, saturation, scale, seed, speed, turbAmp, turbIter, warp]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
