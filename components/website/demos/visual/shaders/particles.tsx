"use client";

import { useEffect, useRef } from "react";

const VERTEX_SHADER = `#version 300 es
precision highp float;
in vec2 a_position;
void main() {
	gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_speed;
uniform float u_scale;
uniform float u_layer;
uniform float u_brightness;
uniform float u_glow;
uniform float u_starSize;
uniform float u_direction;
uniform float u_blink;
uniform float u_randomize;
uniform float u_customColor;
uniform float u_colorR;
uniform float u_colorG;
uniform float u_colorB;
uniform float u_warp;
uniform float u_warpDirection;
uniform float u_tunnelRadius;
uniform float u_fadeRadius;
uniform float u_blur;
uniform vec4 u_bgColor;

uint pcg(uint v) {
	uint state = v * 747796405u + 2891336453u;
	uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
	return (word >> 22u) ^ word;
}

float hash1(float p) {
	return float(pcg(floatBitsToUint(p))) / float(0xFFFFFFFFu);
}

void main() {
	vec4 O = vec4(0.);
	vec2 r = u_resolution;
	vec2 I = gl_FragCoord.xy;
	vec2 uv = (I + I - r) / r.y;
	uv /= u_scale;
	float d = length(uv);
	float t = u_time * u_speed;

	float rad = u_direction * 3.14159265 / 180.;
	vec2 dir = vec2(cos(rad), sin(rad));

	float sharpness = mix(0.3, 2.0, u_glow);
	float softness = 1.0 + u_blur * 6.0;
	float blurBoost = 1.0 + u_blur * 3.0;

	vec4 colOffset = u_customColor > .5
		? vec4(u_colorR, u_colorG, u_colorB, 0.)
		: vec4(3., 3., 3., 0.);

	float iterations = 20. + u_layer;

	for (float i = 20.; i++ < iterations;) {
		vec2 q;
		float fade, blink, light, clamper;

		if (u_warp > .5) {
			vec2 p = vec2(atan(uv.x, uv.y), 1. / (d * u_tunnelRadius + .001));
			q = p * 6e1 / i;
			float warpD = u_warpDirection > 0.5 ? -1.0 : 1.0;
			q.y += warpD * t;
			q += cos(i * vec2(9, 7));
			fade = smoothstep(0., u_fadeRadius, d);
			blink = 1.;
			light = u_brightness * 1.8e-4;
			clamper = u_starSize;
		} else {
			q = uv * 4e1 / i + cos(i * vec2(9, 7));

			if (u_randomize > .5) {
				float angle = hash1(i * 123.456) * 6.28318;
				vec2 rdir = vec2(cos(angle), sin(angle));
				q += rdir * t * .3;
			} else {
				q += dir * t * .3;
			}

			fade = 1.;

			if (u_blink > .5) {
				blink = sin(t * (1. + fract(i * .737) * 4.) + i * 3.14) * .5 + .5;
				blink = blink * .3 + .3;
			} else {
				blink = .3;
			}

			light = u_brightness * 3e-4;
			clamper = u_starSize;
		}

		float dist = max(length(sin(q * 3.)), clamper * softness);
		dist = pow(dist, sharpness);
		O += (i * cos(i + colOffset) + i) * light * blink * fade * blurBoost / dist;
	}

	O = tanh(O * O);
	float a = u_bgColor.a;
	fragColor = vec4((u_bgColor.rgb * a + O.rgb), clamp(a + O.r + O.g + O.b, 0., 1.));
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

interface ParticlesProps {
	className?: string;
	bgColor?: string;
	speed?: number;
	scale?: number;
	layers?: number;
	brightness?: number;
	glow?: number;
	blur?: number;
	starSize?: number;
	direction?: number;
	blink?: boolean;
	randomize?: boolean;
	warp?: boolean;
	warpDirection?: 0 | 1;
	tunnelRadius?: number;
	fadeRadius?: number;
	customColor?: boolean;
	colorR?: number;
	colorG?: number;
	colorB?: number;
}

export default function Particles({
	className,
	bgColor = "#000000",
	speed = 0.6,
	scale = 1,
	layers = 30,
	brightness = 0.8,
	glow = 0.5,
	blur = 0,
	starSize = 0.01,
	direction = 90,
	blink = false,
	randomize = true,
	warp = false,
	warpDirection = 0,
	tunnelRadius = 2,
	fadeRadius = 1.2,
	customColor = false,
	colorR = 1,
	colorG = 2,
	colorB = 3,
}: ParticlesProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: false });
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

		gl.uniform1f(gl.getUniformLocation(prog, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(prog, "u_scale"), scale);
		gl.uniform1f(gl.getUniformLocation(prog, "u_layer"), layers);
		gl.uniform1f(gl.getUniformLocation(prog, "u_brightness"), brightness);
		gl.uniform1f(gl.getUniformLocation(prog, "u_glow"), glow);
		gl.uniform1f(gl.getUniformLocation(prog, "u_starSize"), starSize);
		gl.uniform1f(gl.getUniformLocation(prog, "u_direction"), direction);
		gl.uniform1f(gl.getUniformLocation(prog, "u_blink"), blink ? 1.0 : 0.0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_randomize"), randomize ? 1.0 : 0.0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_customColor"), customColor ? 1.0 : 0.0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_colorR"), colorR);
		gl.uniform1f(gl.getUniformLocation(prog, "u_colorG"), colorG);
		gl.uniform1f(gl.getUniformLocation(prog, "u_colorB"), colorB);
		gl.uniform1f(gl.getUniformLocation(prog, "u_warp"), warp ? 1.0 : 0.0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_warpDirection"), warpDirection);
		gl.uniform1f(gl.getUniformLocation(prog, "u_tunnelRadius"), tunnelRadius);
		gl.uniform1f(gl.getUniformLocation(prog, "u_fadeRadius"), fadeRadius);
		gl.uniform1f(gl.getUniformLocation(prog, "u_blur"), blur);

		const [bgR, bgG, bgB, bgA] = hexToRgba(bgColor);
		gl.uniform4f(gl.getUniformLocation(prog, "u_bgColor"), bgR, bgG, bgB, bgA);

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
	}, [bgColor, speed, scale, layers, brightness, glow, blur, starSize, direction, blink, randomize, warp, warpDirection, tunnelRadius, fadeRadius, customColor, colorR, colorG, colorB]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
