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
uniform float u_pixelRatio;
uniform sampler2D u_texture;
uniform float u_pixels;
uniform float u_stagger;
uniform float u_border;
uniform float u_aberration;
uniform float u_hueShift;

void main() {
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

	float cellsY = u_pixels;
	vec2 cellCount = vec2(cellsY * aspect, cellsY);
	vec2 coord = v_uv * cellCount;
	vec2 normalizedSize = 1.0 / cellCount;

	float colStagger = mod(floor(coord.x), 2.0) * u_stagger;
	vec2 subcoord = coord * vec2(3.0, 1.0);
	float subIdx = mod(floor(subcoord.x), 3.0);
	float subStagger = subIdx * u_stagger;

	vec2 offsetUV = v_uv;
	offsetUV.y += (colStagger + subStagger) * normalizedSize.y;
	vec2 cellCenter = normalizedSize * (floor(offsetUV / normalizedSize) + 0.5);

	float ca = u_aberration * normalizedSize.x;

	vec2 sampleR = (cellCenter + vec2(-ca, 0.0)) * coverScale + coverOffset;
	vec2 sampleG = cellCenter * coverScale + coverOffset;
	vec2 sampleB = (cellCenter + vec2(ca, 0.0)) * coverScale + coverOffset;

	sampleR.y = 1.0 - sampleR.y;
	sampleG.y = 1.0 - sampleG.y;
	sampleB.y = 1.0 - sampleB.y;

	sampleR = clamp(sampleR, vec2(0.0), vec2(1.0));
	sampleG = clamp(sampleG, vec2(0.0), vec2(1.0));
	sampleB = clamp(sampleB, vec2(0.0), vec2(1.0));

	vec4 colR = texelFetch(u_texture, clamp(ivec2(sampleR * texSize), ivec2(0), texSizeI - 1), 0);
	vec4 colG = texelFetch(u_texture, clamp(ivec2(sampleG * texSize), ivec2(0), texSizeI - 1), 0);
	vec4 colB = texelFetch(u_texture, clamp(ivec2(sampleB * texSize), ivec2(0), texSizeI - 1), 0);

	float h = u_hueShift;
	vec3 k = vec3(0.57735);

	float cR = cos(-h), sR = sin(-h);
	mat3 hueRotR = mat3(
		cR + k.x*k.x*(1.0-cR), k.x*k.y*(1.0-cR) - k.z*sR, k.x*k.z*(1.0-cR) + k.y*sR,
		k.y*k.x*(1.0-cR) + k.z*sR, cR + k.y*k.y*(1.0-cR), k.y*k.z*(1.0-cR) - k.x*sR,
		k.z*k.x*(1.0-cR) - k.y*sR, k.z*k.y*(1.0-cR) + k.x*sR, cR + k.z*k.z*(1.0-cR)
	);
	float cB = cos(h), sB = sin(h);
	mat3 hueRotB = mat3(
		cB + k.x*k.x*(1.0-cB), k.x*k.y*(1.0-cB) - k.z*sB, k.x*k.z*(1.0-cB) + k.y*sB,
		k.y*k.x*(1.0-cB) + k.z*sB, cB + k.y*k.y*(1.0-cB), k.y*k.z*(1.0-cB) - k.x*sB,
		k.z*k.x*(1.0-cB) - k.y*sB, k.z*k.y*(1.0-cB) + k.x*sB, cB + k.z*k.z*(1.0-cB)
	);

	colR.rgb = hueRotR * colR.rgb;
	colB.rgb = hueRotB * colB.rgb;

	vec3 color = vec3(colR.r, colG.g, colB.b);

	float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
	vec2 cellOffset = vec2(0.0, colStagger + subStagger);
	vec2 subCellUV = fract(subcoord + cellOffset) * 2.0 - 1.0;
	float borderAmount = u_border - luma * 0.25;
	vec2 border = 1.0 - subCellUV * subCellUV * borderAmount;
	float mask = border.x * border.y;

	float pixelsPerCell = cssResY / cellsY * u_pixelRatio * 2.;
	float aaRange = smoothstep(2.0, 8.0, pixelsPerCell) * 0.95;
	float maskStrength = smoothstep(0.0, aaRange, mask);

	color *= maskStrength;

	fragColor = vec4(color, 1.0);
}
`;

/** Generate a colorful default texture. */
function createDefaultTexture(): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 512;
	const ctx = c.getContext("2d")!;
	const grad = ctx.createLinearGradient(0, 0, 512, 512);
	grad.addColorStop(0, "#2962FF");
	grad.addColorStop(0.3, "#FF4040");
	grad.addColorStop(0.6, "#FFC680");
	grad.addColorStop(1, "#91FFCC");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 512, 512);
	const colors = ["#FF5024", "#FFAE00", "#E29EFF", "#4AB7FF", "#00001A"];
	for (let i = 0; i < 15; i++) {
		ctx.beginPath();
		ctx.arc(
			Math.sin(i * 2.1) * 200 + 256,
			Math.cos(i * 1.7) * 200 + 256,
			20 + i * 6,
			0,
			Math.PI * 2,
		);
		ctx.fillStyle = colors[i % colors.length];
		ctx.globalAlpha = 0.7;
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	return c;
}

interface PixelsProps {
	className?: string;
	imageSrc?: string;
	pixels?: number;
	stagger?: number;
	border?: number;
	aberration?: number;
	hueShift?: number;
}

export default function Pixels({
	className,
	imageSrc,
	pixels = 28,
	stagger = 0,
	border = 0,
	aberration = 0,
	hueShift = 0,
}: PixelsProps) {
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

		gl.uniform1f(gl.getUniformLocation(prog, "u_pixels"), pixels);
		gl.uniform1f(gl.getUniformLocation(prog, "u_stagger"), stagger);
		gl.uniform1f(gl.getUniformLocation(prog, "u_border"), border);
		gl.uniform1f(gl.getUniformLocation(prog, "u_aberration"), aberration);
		gl.uniform1f(gl.getUniformLocation(prog, "u_hueShift"), hueShift);

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
			gl.uniform1f(gl.getUniformLocation(prog, "u_pixelRatio"), dpr);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};
		animRef.current = requestAnimationFrame(render);

		return () => cancelAnimationFrame(animRef.current);
	}, [imageSrc, pixels, stagger, border, aberration, hueShift]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
