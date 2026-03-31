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
uniform float u_pixelRatio;
uniform sampler2D u_texture;
uniform float u_mode;
uniform float u_radius;
uniform float u_pulse;
uniform float u_speed;
uniform float u_swirl;
uniform float u_swirlSpeed;

vec4 spectrum(float p) {
	return 2.6 * vec4(
		smoothstep(0.54, 0.24, p),
		smoothstep(0.38, 0.0, abs(p - 0.5)),
		smoothstep(0.47, 0.82, p),
		1.0
	);
}

void main() {
	float realTime = u_time - 250.;
	float cssResX = u_resolution.x / u_pixelRatio;
	float cssResY = u_resolution.y / u_pixelRatio;
	float aspect = cssResX / cssResY;

	ivec2 texSizeI = textureSize(u_texture, 0);
	vec2 texSize = vec2(texSizeI);
	float textureAspect = texSize.x / texSize.y;

	vec2 coverScale = vec2(1.0);
	vec2 coverOffset = vec2(0.0);
	if (aspect > textureAspect) {
		float s = aspect / textureAspect;
		coverScale = vec2(1.0, 1.0 / s);
		coverOffset = vec2(0.0, (1.0 - coverScale.y) * 0.5);
	} else {
		float s = textureAspect / aspect;
		coverScale = vec2(1.0 / s, 1.0);
		coverOffset = vec2((1.0 - coverScale.x) * 0.5, 0.0);
	}

	vec2 centered = v_uv * 2.0 - 1.0;
	float maxDim = max(aspect, 1.0);
	vec2 p_aspect = centered * vec2(aspect, 1.0) / maxDim;

	float swirlVal = u_swirl * cos(realTime * u_swirlSpeed);

	vec2 dir;
	float mode = u_mode;
	if (mode < 0.5) {
		dir = p_aspect;
	} else if (mode < 1.5) {
		dir = vec2(p_aspect.x, 0.0);
	} else if (mode < 2.5) {
		dir = vec2(0.0, p_aspect.y);
	} else {
		float dist = length(p_aspect);
		float angle = atan(p_aspect.y, p_aspect.x) + dist * swirlVal;
		dir = vec2(cos(angle), sin(angle)) * dist;
	}

	float r = u_radius + u_pulse * cos(realTime * u_speed);
	float maxRes = 1600.;

	const float k = 0.03;
	vec4 col = vec4(0.0);
	for (float i = 0.0; i < 1.0; i += k) {
		vec2 sUV = v_uv + dir * i * r / maxRes;
		sUV = sUV * coverScale + coverOffset;
		sUV.y = 1.0 - sUV.y;
		col += texture(u_texture, sUV) * spectrum(i);
	}

	fragColor = vec4(col.rgb * k, 1.0);
}
`;

function createDefaultTexture(): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 512;
	const ctx = c.getContext("2d")!;
	const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 350);
	grad.addColorStop(0, "#FFFFFF");
	grad.addColorStop(0.3, "#FFD93D");
	grad.addColorStop(0.5, "#FF6B6B");
	grad.addColorStop(0.7, "#6C5CE7");
	grad.addColorStop(1, "#000000");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 512, 512);
	ctx.font = "bold 120px sans-serif";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillStyle = "#FFFFFF";
	ctx.fillText("ABC", 256, 256);
	return c;
}

interface ChromaticAberrationProps {
	className?: string;
	imageSrc?: string;
	mode?: number;
	radius?: number;
	pulse?: number;
	speed?: number;
	swirl?: number;
	swirlSpeed?: number;
}

export default function ChromaticAberration({
	className,
	imageSrc,
	mode = 3,
	radius = 60,
	pulse = 30,
	speed = 0,
	swirl = 3,
	swirlSpeed = 0,
}: ChromaticAberrationProps) {
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

		gl.uniform1f(gl.getUniformLocation(prog, "u_mode"), mode);
		gl.uniform1f(gl.getUniformLocation(prog, "u_radius"), radius);
		gl.uniform1f(gl.getUniformLocation(prog, "u_pulse"), pulse);
		gl.uniform1f(gl.getUniformLocation(prog, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(prog, "u_swirl"), swirl);
		gl.uniform1f(gl.getUniformLocation(prog, "u_swirlSpeed"), swirlSpeed);

		const tex = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.uniform1i(gl.getUniformLocation(prog, "u_texture"), 0);

		const defaultTex = createDefaultTexture();
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, defaultTex);

		if (imageSrc) {
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
			};
			img.src = imageSrc;
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
			gl.uniform1f(gl.getUniformLocation(prog, "u_pixelRatio"), dpr);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};
		animRef.current = requestAnimationFrame(render);

		return () => cancelAnimationFrame(animRef.current);
	}, [imageSrc, mode, radius, pulse, speed, swirl, swirlSpeed]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
