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
uniform sampler2D u_texture;
uniform float u_cells;
uniform float u_thickness;
uniform float u_invert;
uniform float u_reverseSymbols;
uniform float u_colorMode;
uniform vec4 u_foreground;
uniform vec4 u_background;

float arcSDF(vec2 p, vec2 center) {
	return abs(length(p - center) - 1.0);
}

float tileSDF(vec2 p, float luma, float th) {
	vec2 c = p * 2.0 - 1.0;
	float d = 1e9;
	float idx = clamp(floor(luma * 4.0), 0.0, 3.0);

	if (u_reverseSymbols > 0.5) idx = 3.0 - idx;

	if (idx < 0.5) {
		d = min(d, length(c - vec2(1, 1)) - th);
		d = min(d, length(c - vec2(-1, 1)) - th);
		d = min(d, length(c - vec2(1, -1)) - th);
		d = min(d, length(c - vec2(-1, -1)) - th);
	} else if (idx < 1.5) {
		d = arcSDF(c, vec2(1, 1)) - th;
	} else if (idx < 2.5) {
		d = min(d, arcSDF(c, vec2(1, 1)) - th);
		d = min(d, arcSDF(c, vec2(-1, -1)) - th);
	} else {
		d = min(d, arcSDF(c, vec2(1, 1)) - th);
		d = min(d, arcSDF(c, vec2(-1, 1)) - th);
		d = min(d, arcSDF(c, vec2(1, -1)) - th);
		d = min(d, arcSDF(c, vec2(-1, -1)) - th);
		d = min(d, length(c) - th);
	}

	return d;
}

void main() {
	float aspect = u_resolution.x / u_resolution.y;

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

	float cellsY = u_cells;
	vec2 cellCount = vec2(cellsY * aspect, cellsY);

	vec2 gridUV = v_uv * cellCount;
	vec2 cellID = floor(gridUV);
	vec2 cellUV = fract(gridUV);

	float h = fract(sin(dot(cellID, vec2(127.1, 311.7))) * 43758.5453);
	float rot = floor(h * 4.0);
	for (float i = 0.0; i < 4.0; i++) {
		if (i >= rot) break;
		vec2 tmp = cellUV;
		cellUV = vec2(1.0 - tmp.y, tmp.x);
	}

	vec2 texCoord = (cellID + 0.5) / cellCount;
	texCoord = texCoord * coverScale + coverOffset;
	texCoord.y = 1.0 - texCoord.y;
	texCoord = clamp(texCoord, vec2(0.0), vec2(1.0));

	ivec2 texel = clamp(ivec2(texCoord * texSize), ivec2(0), texSizeI - 1);
	vec4 sampled = texelFetch(u_texture, texel, 0);

	float luma = dot(sampled.rgb, vec3(0.2126, 0.7152, 0.0722));
	if (u_invert > 0.5) luma = 1.0 - luma;

	float d = tileSDF(cellUV, luma, u_thickness);

	float aa = 2.0 / u_resolution.y * cellsY;
	float mask = smoothstep(aa, -aa, d);

	vec3 bg = u_background.rgb;
	vec3 fg;
	if (u_colorMode < 0.5) {
		fg = sampled.rgb;
	} else {
		fg = u_foreground.rgb;
	}

	vec3 col;
	if (luma < 0.2) {
		col = fg;
	} else if (luma < 0.75) {
		col = mix(fg, bg, mask);
	} else if (luma < 0.99) {
		col = mix(fg, bg, mask);
	} else {
		col = fg;
	}

	fragColor = vec4(col, 1.0);
}
`;

function createDefaultTexture(): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 512;
	const ctx = c.getContext("2d")!;
	// Warm radial gradient for good truchet contrast
	const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 360);
	grad.addColorStop(0, "#FFE0A0");
	grad.addColorStop(0.3, "#FF6030");
	grad.addColorStop(0.6, "#A020F0");
	grad.addColorStop(1, "#001040");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 512, 512);
	return c;
}

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	return [
		parseInt(h.substring(0, 2), 16) / 255,
		parseInt(h.substring(2, 4), 16) / 255,
		parseInt(h.substring(4, 6), 16) / 255,
	];
}

interface TruchetProps {
	className?: string;
	imageSrc?: string;
	cells?: number;
	thickness?: number;
	invert?: boolean;
	reverseSymbols?: boolean;
	colorMode?: number;
	foreground?: string;
	background?: string;
}

export default function Truchet({
	className,
	imageSrc,
	cells = 53,
	thickness = 0.05,
	invert = true,
	reverseSymbols = false,
	colorMode = 0,
	foreground = "#004FEE",
	background = "#FFFFFF",
}: TruchetProps) {
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

		gl.uniform1f(gl.getUniformLocation(prog, "u_cells"), cells);
		gl.uniform1f(gl.getUniformLocation(prog, "u_thickness"), thickness);
		gl.uniform1f(gl.getUniformLocation(prog, "u_invert"), invert ? 1.0 : 0.0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_reverseSymbols"), reverseSymbols ? 1.0 : 0.0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_colorMode"), colorMode);

		const [fgR, fgG, fgB] = hexToRgb(foreground);
		gl.uniform4f(gl.getUniformLocation(prog, "u_foreground"), fgR, fgG, fgB, 1.0);
		const [bgR, bgG, bgB] = hexToRgb(background);
		gl.uniform4f(gl.getUniformLocation(prog, "u_background"), bgR, bgG, bgB, 1.0);

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
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};
		animRef.current = requestAnimationFrame(render);

		return () => cancelAnimationFrame(animRef.current);
	}, [imageSrc, cells, thickness, invert, reverseSymbols, colorMode, foreground, background]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
