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

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_seed;
uniform float u_waveSpeed;
uniform float u_waveFreqX;
uniform float u_waveFreqY;
uniform float u_waveAngle;
uniform float u_waveAmplitude;
uniform float u_maskSoftness;
uniform float u_blendAmount;
uniform vec4 u_colors[4];
uniform int u_colors_length;

#define S(a,b,t) smoothstep(a,b,t)

mat2 Rot(float a) {
	float s = sin(a), c = cos(a);
	return mat2(c, -s, s, c);
}

vec2 hash(vec2 p) {
	float s = u_seed;
	vec2 k1 = vec2(2127.1 + s * 13.37, 81.17 + s * 7.31);
	vec2 k2 = vec2(1269.5 + s * 11.13, 283.37 + s * 5.79);
	p = vec2(dot(p, k1), dot(p, k2));
	return fract(sin(p) * (43758.5453 + s * 1.618));
}

float noise(in vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	float n = mix(
		mix(dot(-1.0 + 2.0 * hash(i), f),
			dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
		mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
			dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
		u.y
	);
	return 0.5 + 0.5 * n;
}

vec3 getColor(int idx) {
	if (u_colors_length < 1) return vec3(0.0);
	int safeIdx = clamp(idx, 0, u_colors_length - 1);
	return u_colors[safeIdx].rgb;
}

float seedF(float base) {
	return base * (1.0 + 0.5 * sin(u_seed * 3.17 + base));
}

vec2 warpUV(vec2 uv) {
	float t = u_time * u_waveSpeed;
	float angleOffset = sin(u_seed * 2.73) * 30.0;
	mat2 dirRot = Rot(radians(u_waveAngle + angleOffset));
	vec2 ruv = dirRot * uv;
	float fxMod = seedF(u_waveFreqX);
	float fyMod = seedF(u_waveFreqY);
	float phaseX = fract(sin(u_seed * 7.19) * 437.58) * 6.2832;
	float phaseY = fract(cos(u_seed * 3.41) * 291.37) * 6.2832;
	float harmonic = sin(u_seed * 1.23) * 0.5;
	float a = fyMod * ruv.y - sin(ruv.x * fxMod + ruv.y - t + phaseX);
	a += harmonic * sin(ruv.x * fxMod * 2.0 + ruv.y * 0.5 + t * 0.7 + phaseY);
	a = smoothstep(
		cos(a) * u_maskSoftness,
		sin(a) * u_maskSoftness + 3.,
		cos(a - fyMod * ruv.y) - sin(a - fxMod * ruv.x)
	);
	a *= u_waveAmplitude;
	uv = cos(a) * uv + sin(a) * vec2(-uv.y, uv.x);
	return uv;
}

void main() {
	vec2 fragCoord = v_uv * u_resolution;
	vec2 uv = fragCoord / u_resolution.xy;
	float ratio = u_resolution.x / u_resolution.y;
	float t = u_time * u_waveSpeed;
	vec2 tuv = uv - 0.5;
	vec2 seedShift = vec2(sin(u_seed * 4.37), cos(u_seed * 5.91)) * 100.0;
	float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) + seedShift);
	tuv.y *= 1.0 / ratio;
	tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
	tuv.y *= ratio;
	vec2 uv2 = (fragCoord * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0;
	float preRotAngle = fract(sin(u_seed * 5.63) * 173.29) * 6.2832;
	uv2 *= Rot(preRotAngle);
	vec2 warped = warpUV(uv2) * 0.5 + 0.5;
	vec2 blendUV = mix(tuv, warped - 0.5, u_blendAmount);
	float layerRot1 = -5.0 + sin(u_seed * 1.83) * 20.0;
	float layerRot2 = 10.0 + cos(u_seed * 2.47) * 20.0;
	vec3 c0 = getColor(0);
	vec3 c1 = getColor(1);
	vec3 c2 = getColor(2);
	vec3 c3 = getColor(3);
	vec3 layer1 = mix(c0, c2, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot1))).x));
	vec3 layer2 = mix(c3, c1, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot2))).x));
	vec3 col = mix(layer1, layer2, S(0.3, -0.3, blendUV.y));
	col = mix(col, col * col + 0.5 * sqrt(col), 0.3);
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

interface WaveGradientProps {
	className?: string;
	colors?: [string, string, string, string];
	seed?: number;
	speed?: number;
	freqX?: number;
	freqY?: number;
	angle?: number;
	amplitude?: number;
	softness?: number;
	blend?: number;
}

export default function WaveGradient({
	className,
	colors = ["#FFC2A8", "#FF5024", "#FFAE00", "#E29EFF"],
	seed = 26,
	speed = 2.85,
	freqX = 0.9,
	freqY = 6,
	angle = 105,
	amplitude = 1.6,
	softness = 1.4,
	blend = 0.5,
}: WaveGradientProps) {
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
		const uSeed = gl.getUniformLocation(prog, "u_seed");
		const uSpeed = gl.getUniformLocation(prog, "u_waveSpeed");
		const uFreqX = gl.getUniformLocation(prog, "u_waveFreqX");
		const uFreqY = gl.getUniformLocation(prog, "u_waveFreqY");
		const uAngle = gl.getUniformLocation(prog, "u_waveAngle");
		const uAmp = gl.getUniformLocation(prog, "u_waveAmplitude");
		const uSoft = gl.getUniformLocation(prog, "u_maskSoftness");
		const uBlend = gl.getUniformLocation(prog, "u_blendAmount");
		const uColorsLen = gl.getUniformLocation(prog, "u_colors_length");

		const colorLocs = colors.map((_, i) => gl.getUniformLocation(prog, `u_colors[${i}]`));

		gl.uniform1f(uSeed, seed);
		gl.uniform1f(uSpeed, speed);
		gl.uniform1f(uFreqX, freqX);
		gl.uniform1f(uFreqY, freqY);
		gl.uniform1f(uAngle, angle);
		gl.uniform1f(uAmp, amplitude);
		gl.uniform1f(uSoft, softness);
		gl.uniform1f(uBlend, blend);
		gl.uniform1i(uColorsLen, colors.length);
		colors.forEach((c, i) => {
			const [r, g, b] = hexToRgb(c);
			gl.uniform4f(colorLocs[i], r, g, b, 1.0);
		});

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
	}, [colors, seed, speed, freqX, freqY, angle, amplitude, softness, blend]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
