"use client";

import { useEffect, useRef } from "react";

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
uniform float u_ephemeralAmp;
uniform float u_lensScale;
uniform float u_lensSpacingX;
uniform float u_lensSpacingY;
uniform float u_lensRadius;
uniform float u_dispersionStrength;
uniform float u_edgeDisp;
uniform vec4 u_colors[8];
uniform int u_colors_length;

const int SAMPLES = 8;
const float EPHEMERAL_DRIP = 1.0;

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
uvec3 seed;
vec3 random3f() {
	seed = hash3(seed);
	return vec3(seed) / float(-1u);
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

vec3 getColor(int idx) {
	if (u_colors_length < 1) return vec3(0.0);
	int safeIdx = clamp(idx, 0, u_colors_length - 1);
	return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
	if (count < 1) return vec3(0.0);
	if (count < 2) return getColor(0);
	t = clamp(t, 0.0, 1.0) * float(count - 1);
	int idx = min(int(floor(t)), count - 2);
	float localT = fract(t);
	localT = localT * localT * (3.0 - 2.0 * localT);
	return mix(getColor(idx), getColor(idx + 1), localT);
}

float getGradientT(vec2 uv, float t, vec3 s1, vec3 s2) {
	float angle1 = s1.x * 6.28;
	float angle2 = s1.y * 6.28;
	vec2 dir1 = vec2(cos(angle1), sin(angle1));
	vec2 dir2 = vec2(cos(angle2), sin(angle2));
	float freq1 = 1.0 + s1.z * 2.0;
	float freq2 = 1.0 + s2.x * 1.5;
	float freq3 = 1.5 + s2.y * 2.0;
	float flow = dot(uv, dir1) + sin(dot(uv, dir2) * freq1 + t) * 0.3 + t * 0.2;
	float flow2 = dot(uv, dir2.yx) + cos(dot(uv, dir1.yx) * freq2 - t * 0.8) * 0.25;
	float gradT = sin(flow * 1.5) * 0.5 + 0.5;
	gradT += cos(flow2 * 1.2) * 1.3;
	gradT += sin(dot(uv, dir1 + dir2) * freq3 + t * 3.5) * 1.2;
	return smoothstep(0.0, 4.12, gradT);
}

void applyBandLens(vec2 pp, float radiusSq, float iorOffset, out vec2 warpedUV, out float edgeFactor) {
	vec2 ppLens = pp;
	float spacingX = max(u_lensSpacingX, 0.001);
	float spacingY = max(u_lensSpacingY, 0.001);
	ppLens.x = fract(pp.x / spacingX + 0.5) * spacingX - spacingX * 0.5;
	ppLens.y = fract(pp.y / spacingY + 0.5) * spacingY - spacingY * 0.5;
	float sp = radiusSq - ppLens.x * ppLens.x - ppLens.y * ppLens.y;
	float lensAmount = smoothstep(-0.1, 0.05, sp);
	float baseLens = sqrt(max(sp, -sp * 0.1) / 0.3);
	edgeFactor = (1.0 - smoothstep(0.0, radiusSq, sp)) * lensAmount;
	float warpAmount = mix(1.0, baseLens * (1.0 + iorOffset), lensAmount);
	warpedUV = pp;
	warpedUV.x += (ppLens.x * warpAmount - ppLens.x);
	warpedUV.y *= warpAmount;
}

void main() {
	vec2 fragCoord = v_uv * u_resolution;
	seed = uvec3(uvec2(fragCoord), uint(fract(u_time) * 1000.0));
	vec2 r = u_resolution;
	vec2 p = (fragCoord * 2.0 - r) / r.y;
	float t = u_time * u_speed;
	int colorCount = u_colors_length;
	if (colorCount < 1) {
		fragColor = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}
	vec3 seedOff1 = seedRandom(u_seed);
	vec3 seedOff2 = seedRandom(u_seed + 100.0);
	float dice = random3f().x;
	float radiusSq = u_lensRadius * u_lensRadius;
	vec3 iorOffsets = vec3(-1.0, 0.0, 1.0) * u_dispersionStrength;
	vec3 col = vec3(0.0);
	for (int i = 0; i < SAMPLES; i++) {
		float ephemeral = (float(i) + dice) / float(SAMPLES);
		float sqEph = ephemeral * ephemeral;
		vec2 pt = p;
		pt.x += u_ephemeralAmp * sqEph * sin(p.y * 2.0 + t);
		pt.y += u_ephemeralAmp * sqEph * cos(p.x * 1.5 - t) * 0.5;
		pt.y -= (1.0 - exp(-EPHEMERAL_DRIP * sqEph)) * abs(pt.y) * sign(pt.y) * 0.3;
		vec3 tint = smoothstep(1.0, 0.0, abs(3.0 * ephemeral - vec3(1.0, 1.5, 2.0)));
		vec3 gradTs = vec3(0.0);
		vec3 edgeFactors = vec3(0.0);
		for (int c = 0; c < 3; c++) {
			vec2 pp = pt * u_lensScale;
			vec2 warpedUV;
			float edgeFactor;
			applyBandLens(pp, radiusSq, iorOffsets[c], warpedUV, edgeFactor);
			vec2 gradUV = warpedUV / u_lensScale;
			gradTs[c] = getGradientT(gradUV, t * 0.8, seedOff1, seedOff2);
			edgeFactors[c] = edgeFactor;
		}
		vec3 convergentColor = paletteN(gradTs.g, colorCount);
		float edgeMix = max(max(edgeFactors.r, edgeFactors.g), edgeFactors.b);
		vec3 dispersedColor = vec3(
			paletteN(gradTs.r, colorCount).r,
			convergentColor.g,
			paletteN(gradTs.b, colorCount).b
		);
		vec3 finalColor = mix(convergentColor, dispersedColor, edgeMix * 2.0);
		vec3 rainbow = (gradTs - gradTs.g) * 3.0;
		finalColor += rainbow * edgeMix * u_edgeDisp;
		col += tint * finalColor * (3.0 / float(SAMPLES));
	}
	fragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	return [
		parseInt(h.substring(0, 2), 16) / 255,
		parseInt(h.substring(2, 4), 16) / 255,
		parseInt(h.substring(4, 6), 16) / 255,
	];
}

interface BandsProps {
	className?: string;
	colors?: string[];
	seed?: number;
	speed?: number;
	ephemeralAmp?: number;
	lensScale?: number;
	lensSpacingX?: number;
	lensSpacingY?: number;
	lensRadius?: number;
	dispersionStrength?: number;
	edgeDisp?: number;
}

export default function Bands({
	className,
	colors = ["#4AB7FF", "#FFC680", "#FF4040"],
	seed = 210,
	speed = 0.3,
	ephemeralAmp = 0,
	lensScale = 3.7,
	lensSpacingX = 1,
	lensSpacingY = 0.01,
	lensRadius = 0.58,
	dispersionStrength = 0.4,
	edgeDisp = 2,
}: BandsProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
		if (!gl) return;

		const compile = (type: number, src: string) => {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
				console.error(gl.getShaderInfoLog(s));
			}
			return s;
		};

		const prog = gl.createProgram()!;
		gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
		gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
		gl.linkProgram(prog);
		gl.useProgram(prog);

		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const aPos = gl.getAttribLocation(prog, "a_position");
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		const uRes = gl.getUniformLocation(prog, "u_resolution");
		const uTime = gl.getUniformLocation(prog, "u_time");
		const uColorsLen = gl.getUniformLocation(prog, "u_colors_length");

		gl.uniform1f(gl.getUniformLocation(prog, "u_seed"), seed);
		gl.uniform1f(gl.getUniformLocation(prog, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(prog, "u_ephemeralAmp"), ephemeralAmp);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lensScale"), lensScale);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lensSpacingX"), lensSpacingX);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lensSpacingY"), lensSpacingY);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lensRadius"), lensRadius);
		gl.uniform1f(gl.getUniformLocation(prog, "u_dispersionStrength"), dispersionStrength);
		gl.uniform1f(gl.getUniformLocation(prog, "u_edgeDisp"), edgeDisp);

		gl.uniform1i(uColorsLen, colors.length);
		for (let i = 0; i < 8; i++) {
			const loc = gl.getUniformLocation(prog, `u_colors[${i}]`);
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
			const w = canvas.clientWidth * dpr;
			const h = canvas.clientHeight * dpr;
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
				gl.viewport(0, 0, w, h);
			}
			gl.uniform2f(uRes, w, h);
			gl.uniform1f(uTime, (performance.now() - start) / 1000);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};
		animRef.current = requestAnimationFrame(render);

		return () => cancelAnimationFrame(animRef.current);
	}, [colors, seed, speed, ephemeralAmp, lensScale, lensSpacingX, lensSpacingY, lensRadius, dispersionStrength, edgeDisp]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
