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
uniform float u_quantize;
uniform float u_gridMode;
uniform float u_studFactor;
uniform float u_lightIntensity;
uniform float u_lightAngle;
uniform float u_enableQuantization;
uniform float u_colorLevels;
uniform float u_hueShift;

float random(vec2 st) {
	return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 rgbToHsv(vec3 c) {
	vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
	vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
	vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
	float d = q.x - min(q.w, q.y);
	float e = 1.0e-10;
	return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsvToRgb(vec3 c) {
	vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
	vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
	return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
	float aspect = u_resolution.x / u_resolution.y;

	ivec2 texSizeI = textureSize(u_texture, 0);
	vec2 texSize = vec2(texSizeI);
	float textureAspect = texSize.x / texSize.y;

	vec2 coverScale = vec2(1.0);
	vec2 coverOffset = vec2(0.0);

	if (aspect > textureAspect) {
		float scale = aspect / textureAspect;
		coverScale = vec2(1.0, 1.0 / scale);
		coverOffset = vec2(0.0, (1.0 - coverScale.y) * 0.5);
	} else {
		float scale = textureAspect / aspect;
		coverScale = vec2(1.0 / scale, 1.0);
		coverOffset = vec2((1.0 - coverScale.x) * 0.5, 0.0);
	}

	float cellsY = u_quantize;
	vec2 cellCount = vec2(cellsY * aspect, cellsY);
	vec2 gridUV = v_uv * cellCount;

	vec2 cellID;
	vec2 p;

	if (u_gridMode > 0.5) {
		float row = floor(gridUV.y);
		float xOffset = mod(row, 2.0) * 0.5;
		float col = floor(gridUV.x + xOffset);
		cellID = vec2(col, row);
		p = vec2(gridUV.x + xOffset - col, gridUV.y - row) - 0.5;
	} else {
		cellID = floor(gridUV);
		p = gridUV - cellID - 0.5;
	}

	vec2 texCoord;
	if (u_gridMode > 0.5) {
		float row = cellID.y;
		float xOffset = mod(row, 2.0) * 0.5;
		texCoord = vec2((cellID.x - xOffset + 0.5) / cellCount.x, (cellID.y + 0.5) / cellCount.y);
	} else {
		texCoord = (cellID + 0.5) / cellCount;
	}
	texCoord = texCoord * coverScale + coverOffset;
	texCoord.y = 1.0 - texCoord.y;

	vec2 texelCoordF = texCoord * texSize;
	ivec2 texel = ivec2(texelCoordF);
	texel = clamp(texel, ivec2(0), texSizeI - 1);

	vec4 sampled = texelFetch(u_texture, texel, 0);

	if (u_enableQuantization > 0.5 && u_colorLevels > 1.0) {
		float levels = u_colorLevels - 1.0;
		sampled.r = floor(sampled.r * levels + 0.5) / levels;
		sampled.g = floor(sampled.g * levels + 0.5) / levels;
		sampled.b = floor(sampled.b * levels + 0.5) / levels;
		sampled.rgb = clamp(sampled.rgb, 0.01, 0.95);
	}

	float hueShift = random(cellID) * u_hueShift;
	vec3 hsv = rgbToHsv(sampled.rgb);
	hsv.x += hueShift;
	sampled.rgb = hsvToRgb(hsv);

	vec4 col = vec4(sampled.rgb, sampled.a);

	float angle = u_lightAngle * 3.14159265 / 180.0;
	vec2 lightDir = vec2(cos(angle), sin(angle));

	float l = dot(p, p) * u_studFactor;
	float fw = fwidth(l);
	float studMask = smoothstep(0.3 + fw, 0.2 - fw, max(l, 0.45 - l));
	col *= 1.0 + studMask * tanh(dot(p, lightDir) * u_lightIntensity);

	float edgeStart = 0.47;
	vec2 ap = abs(p);
	float maxP = max(ap.x, ap.y);
	float edgeFw = fwidth(maxP);
	float edgeMask = smoothstep(edgeStart - edgeFw, edgeStart + edgeFw, maxP);
	col *= mix(1.0, 0.9, edgeMask);

	fragColor = vec4(col.rgb, 1.0);
}
`;

/** Generate a colorful gradient image as a default texture. */
function createDefaultTexture(): HTMLCanvasElement {
	const c = document.createElement("canvas");
	c.width = 512;
	c.height = 512;
	const ctx = c.getContext("2d")!;
	const grad = ctx.createLinearGradient(0, 0, 512, 512);
	grad.addColorStop(0, "#4AB7FF");
	grad.addColorStop(0.25, "#FF4040");
	grad.addColorStop(0.5, "#FFC680");
	grad.addColorStop(0.75, "#91FFCC");
	grad.addColorStop(1, "#2962FF");
	ctx.fillStyle = grad;
	ctx.fillRect(0, 0, 512, 512);
	// Add some circles for visual interest
	const colors = ["#FF5024", "#FFAE00", "#E29EFF", "#00001A", "#40BCFF"];
	for (let i = 0; i < 12; i++) {
		ctx.beginPath();
		ctx.arc(
			Math.sin(i * 1.7) * 180 + 256,
			Math.cos(i * 2.3) * 180 + 256,
			30 + i * 8,
			0,
			Math.PI * 2,
		);
		ctx.fillStyle = colors[i % colors.length];
		ctx.globalAlpha = 0.6;
		ctx.fill();
	}
	ctx.globalAlpha = 1;
	return c;
}

interface BlockifyProps {
	className?: string;
	imageSrc?: string;
	gridMode?: number;
	quantize?: number;
	studFactor?: number;
	lightIntensity?: number;
	lightAngle?: number;
	enableQuantization?: boolean;
	colorLevels?: number;
	hueShift?: number;
}

export default function Blockify({
	className,
	imageSrc,
	gridMode = 0,
	quantize = 16,
	studFactor = 3,
	lightIntensity = 1.4,
	lightAngle = 90,
	enableQuantization = false,
	colorLevels = 4,
	hueShift = 0,
}: BlockifyProps) {
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

		gl.uniform1f(gl.getUniformLocation(prog, "u_gridMode"), gridMode);
		gl.uniform1f(gl.getUniformLocation(prog, "u_quantize"), quantize);
		gl.uniform1f(gl.getUniformLocation(prog, "u_studFactor"), studFactor);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lightIntensity"), lightIntensity);
		gl.uniform1f(gl.getUniformLocation(prog, "u_lightAngle"), lightAngle);
		gl.uniform1f(gl.getUniformLocation(prog, "u_enableQuantization"), enableQuantization ? 1.0 : 0.0);
		gl.uniform1f(gl.getUniformLocation(prog, "u_colorLevels"), colorLevels);
		gl.uniform1f(gl.getUniformLocation(prog, "u_hueShift"), hueShift);

		// Create texture
		const tex = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.uniform1i(gl.getUniformLocation(prog, "u_texture"), 0);

		// Upload default texture first
		const defaultTex = createDefaultTexture();
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, defaultTex);

		// If an image src is provided, load and replace
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
	}, [imageSrc, gridMode, quantize, studFactor, lightIntensity, lightAngle, enableQuantization, colorLevels, hueShift]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}
