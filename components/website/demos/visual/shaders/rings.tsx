"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";

const DEFAULT_RINGS_COLORS = [...ROVO_SHADER_COLOR_HEX];

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
uniform float u_ringSpacing;
uniform float u_ringRadius;
uniform float u_ringWarpStrength;
uniform float u_ringDispersion;
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

float getGradientT(vec2 uv, float t, vec2 dir1, vec2 dir2, vec3 freqs, vec2 dir3) {
	vec2 suv = uv;
	float flow = dot(suv, dir1) + sin(dot(suv, dir2) * freqs.x + t) * 0.3 + t * 0.2;
	float flow2 = dot(suv, dir2.yx) + cos(dot(suv, dir1.yx) * freqs.y - t * 0.8) * 0.25;
	float gradT = sin(flow * 1.5) * 0.5 + 0.5;
	gradT += cos(flow2 * 1.2) * 1.3;
	gradT += sin(dot(suv, dir3) * freqs.z + t * 3.5) * 1.2;
	return smoothstep(0.0, 4.12, gradT);
}

void applyRingLens(vec2 pp, vec2 fragCoord, vec2 r, float iorOffset, out vec2 warpedUV, out float edgeFactor) {
	float radiusSq = u_ringRadius * u_ringRadius;
	vec2 lensUV = (fragCoord - vec2(r.x * 0.5, 0.0)) / r.y * u_lensScale;
	float dist = length(lensUV);
	float fw = fwidth(dist / u_ringSpacing) * u_ringSpacing;
	float ringDist = mod(dist, u_ringSpacing) / u_ringSpacing;
	float ringShifted = ringDist - 0.5;
	float localR = ringShifted * 2.0;
	float sp = radiusSq - localR * localR;
	float edgeSdf = abs(localR) - u_ringRadius;
	float edgeAA = smoothstep(fw, -fw, edgeSdf);
	float lensAmount = smoothstep(0., 0.3, sp);
	edgeFactor = (1.0 - smoothstep(0.0, radiusSq, sp)) * lensAmount * edgeAA;
	vec2 dir = lensUV / max(dist, 0.001);
	warpedUV = pp;
	if (sp > 0.0) {
		float lens = sqrt(sp) / max(u_ringRadius, 0.001);
		float baseWarp = mix(1.0, u_ringWarpStrength, lens);
		float warpAmount = baseWarp * (1.0 + iorOffset);
		float ringCenter = (floor(dist / u_ringSpacing) + 0.5) * u_ringSpacing;
		vec2 offset = pp - dir * ringCenter;
		warpedUV = dir * ringCenter + offset * warpAmount;
	}
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
	float angle1 = seedOff1.x * 6.28;
	float angle2 = seedOff1.y * 6.28;
	vec2 dir1 = vec2(cos(angle1), sin(angle1));
	vec2 dir2 = vec2(cos(angle2), sin(angle2));
	vec2 dir3 = dir1 + dir2;
	vec3 freqs = vec3(
		1.0 + seedOff1.z * 2.0,
		1.0 + seedOff2.x * 1.5,
		1.5 + seedOff2.y * 2.0
	);
	float dice = random3f().x;
	vec3 ringIorOffsets = vec3(-1.0, 0.0, 1.0) * u_ringDispersion;
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
			applyRingLens(pp, fragCoord, r, ringIorOffsets[c], warpedUV, edgeFactor);
			vec2 gradUV = warpedUV / u_lensScale;
			gradTs[c] = getGradientT(gradUV, t * 0.8, dir1, dir2, freqs, dir3);
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

interface RingsProps {
	className?: string;
	colors?: string[];
	seed?: number;
	speed?: number;
	ephemeralAmp?: number;
	lensScale?: number;
	ringSpacing?: number;
	ringRadius?: number;
	ringWarpStrength?: number;
	ringDispersion?: number;
	edgeDisp?: number;
}

export default function Rings({
	className,
	colors = DEFAULT_RINGS_COLORS,
	seed = 47,
	speed = 0.5,
	ephemeralAmp = 0.12,
	lensScale = 10,
	ringSpacing = 1.5,
	ringRadius = 1,
	ringWarpStrength = 4,
	ringDispersion = 0.4,
	edgeDisp = 1.3,
}: RingsProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);
	const colorsKey = colors.join("|");
	const reduced = useReducedMotion();
	const [inView, setInView] = useState(false);
	const [tabVisible, setTabVisible] = useState(
		typeof document === "undefined" ? true : document.visibilityState === "visible",
	);

	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: "200px" },
		);
		io.observe(el);
		const onVis = () => setTabVisible(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", onVis);
		return () => {
			io.disconnect();
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);

	const shouldAnimate = !reduced && inView && tabVisible;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (!shouldAnimate) return;

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
		gl.uniform1f(gl.getUniformLocation(prog, "u_ringSpacing"), ringSpacing);
		gl.uniform1f(gl.getUniformLocation(prog, "u_ringRadius"), ringRadius);
		gl.uniform1f(gl.getUniformLocation(prog, "u_ringWarpStrength"), ringWarpStrength);
		gl.uniform1f(gl.getUniformLocation(prog, "u_ringDispersion"), ringDispersion);
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
	}, [colors, colorsKey, seed, speed, ephemeralAmp, lensScale, ringSpacing, ringRadius, ringWarpStrength, ringDispersion, edgeDisp, shouldAnimate]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
