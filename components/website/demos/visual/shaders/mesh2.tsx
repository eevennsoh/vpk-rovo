"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

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
uniform float u_pixelRatio;
uniform float u_seed;
uniform float u_speed;
uniform float u_amplitude;
uniform float u_tilt;
uniform float u_zoom;
uniform float u_cameraHeight;
uniform float u_lightIntensity;
uniform float u_lineWidth;
uniform float u_lineBlur;
uniform vec4 u_backgroundColor;
uniform vec4 u_lineColor;

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

void main() {
	vec2 r = u_resolution;
	vec2 I = gl_FragCoord.xy;
	float t = u_time * u_speed;
	vec3 w, p;
	vec4 o = vec4(0.0);

	vec3 seedA = seedRandom(u_seed);
	vec3 seedB = seedRandom(u_seed + 100.0);

	float seedAngle = seedA.x * 6.2831;
	mat2 seedRot = mat2(cos(seedAngle), -sin(seedAngle), sin(seedAngle), cos(seedAngle));

	vec3 seedPhase = seedB * 6.2831;

	float a = radians(u_tilt);
	mat3 rot = mat3(
		1.0, 0.0, 0.0,
		0.0, cos(a), sin(a),
		0.0, -sin(a), cos(a)
	);

	float z = 0.0;
	float d = 0.1;

	vec4 offset = vec4(0.0);

	for (float i = 0.0; i < 30.0; i++) {
		vec3 rd = (vec3(I, 0.0) * 2.0 - r.xyy) / r.y * u_zoom;
		p = z * (rot * rd) + vec3(1.0, u_cameraHeight, 1.0);
		w = p;

		vec3 nw = w;
		nw.xz = seedRot * nw.xz;

		float f;
		for (f = 2.0; f <= 3.0; f++)
			nw += sin(nw.zxy * f + t + seedPhase) / f;

		w = mix(p, nw, 1.0);

		d = 0.1 * (p.y + 3.0);
		z += d;

		vec4 surface = mix(p, w, u_amplitude).y + offset;
		vec4 fw = max(fwidth(surface), 0.0001);
		vec4 pixelDist = abs(surface) / fw;
		float lw = u_lineWidth * u_pixelRatio;
		vec4 acc = smoothstep(lw + u_lineBlur, lw, pixelDist) * u_lightIntensity * d;
		o += acc;
	}

	vec4 raw = tanh(o);

	if (u_backgroundColor.a > 0.0) {
		float lineAlpha = raw.a * u_lineColor.a;
		vec3 col = mix(u_backgroundColor.rgb, u_lineColor.rgb, lineAlpha);
		fragColor = vec4(col, u_backgroundColor.a);
	} else {
		fragColor = vec4(raw.rgb * u_lineColor.rgb, raw.a * u_lineColor.a);
	}
}
`;

function hexToRgba(hex: string): [number, number, number, number] {
	const h = hex.replace("#", "");
	return [
		parseInt(h.substring(0, 2), 16) / 255,
		parseInt(h.substring(2, 4), 16) / 255,
		parseInt(h.substring(4, 6), 16) / 255,
		1.0,
	];
}

interface Mesh2Props {
	className?: string;
	backgroundColor?: string;
	lineColor?: string;
	lineWidth?: number;
	lineBlur?: number;
	seed?: number;
	speed?: number;
	amplitude?: number;
	tilt?: number;
	zoom?: number;
	cameraHeight?: number;
	lightIntensity?: number;
}

export default function Mesh2({
	className,
	backgroundColor = "#000000",
	lineColor = "#FFFFFF",
	lineWidth = 0.1,
	lineBlur = 2,
	seed = 200,
	speed = 0.5,
	amplitude = 0.2,
	tilt = -32,
	zoom = 0.35,
	cameraHeight = 2,
	lightIntensity = 3,
}: Mesh2Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);
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

		gl.uniform1f(gl.getUniformLocation(prog, "u_seed"), seed);
		gl.uniform1f(gl.getUniformLocation(prog, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(prog, "u_amplitude"), amplitude);
		gl.uniform1f(gl.getUniformLocation(prog, "u_tilt"), tilt);
		gl.uniform1f(gl.getUniformLocation(prog, "u_zoom"), zoom);
		gl.uniform1f(gl.getUniformLocation(prog, "u_cameraHeight"), cameraHeight);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lightIntensity"), lightIntensity);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lineWidth"), lineWidth);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lineBlur"), lineBlur);

		const [bgR, bgG, bgB, bgA] = hexToRgba(backgroundColor);
		gl.uniform4f(gl.getUniformLocation(prog, "u_backgroundColor"), bgR, bgG, bgB, bgA);
		const [lcR, lcG, lcB, lcA] = hexToRgba(lineColor);
		gl.uniform4f(gl.getUniformLocation(prog, "u_lineColor"), lcR, lcG, lcB, lcA);

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
			gl.uniform1f(gl.getUniformLocation(prog, "u_pixelRatio"), dpr);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};
		animRef.current = requestAnimationFrame(render);

		return () => cancelAnimationFrame(animRef.current);
	}, [backgroundColor, lineColor, lineWidth, lineBlur, seed, speed, amplitude, tilt, zoom, cameraHeight, lightIntensity, shouldAnimate]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
