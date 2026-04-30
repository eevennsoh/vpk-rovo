"use client";

import { useEffect, useRef, type CSSProperties } from "react";

export const DITHERING_BLEND_MODES = [
	"normal",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten",
	"color-dodge",
	"color-burn",
	"hard-light",
	"soft-light",
	"difference",
	"exclusion",
	"hue",
	"saturation",
	"color",
	"luminosity",
] as const;

export const DITHERING_COMPOSITE_MODES = ["filter", "mask"] as const;
export const DITHERING_PRESETS = ["custom", "gameboy"] as const;
export const DITHERING_ALGORITHMS = ["bayer-2x2", "bayer-4x4", "bayer-8x8", "noise"] as const;
export const DITHERING_COLOR_MODES = ["monochrome", "source", "duo-tone"] as const;

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
uniform float u_sourceMode;
uniform float u_speed;
uniform float u_time;
uniform float u_layerOpacity;
uniform float u_blendMode;
uniform float u_compositeMode;
uniform float u_hue;
uniform float u_saturation;
uniform float u_algorithm;
uniform float u_levels;
uniform float u_pixelSize;
uniform float u_spread;
uniform float u_dotScale;
uniform float u_animateDither;
uniform float u_ditherSpeed;
uniform float u_chromaticSplit;
uniform float u_colorMode;
uniform vec3 u_monoColor;
uniform vec3 u_shadowColor;
uniform vec3 u_highlightColor;

float luma(vec3 color) {
	return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

float bayer2(ivec2 coord) {
	int values[4] = int[4](0, 2, 3, 1);
	int x = coord.x % 2;
	int y = coord.y % 2;
	return float(values[y * 2 + x]) / 4.0;
}

float bayer4(ivec2 coord) {
	int values[16] = int[16](
		0, 8, 2, 10,
		12, 4, 14, 6,
		3, 11, 1, 9,
		15, 7, 13, 5
	);
	int x = coord.x % 4;
	int y = coord.y % 4;
	return float(values[y * 4 + x]) / 16.0;
}

float bayer8(ivec2 coord) {
	int values[64] = int[64](
		0, 32, 8, 40, 2, 34, 10, 42,
		48, 16, 56, 24, 50, 18, 58, 26,
		12, 44, 4, 36, 14, 46, 6, 38,
		60, 28, 52, 20, 62, 30, 54, 22,
		3, 35, 11, 43, 1, 33, 9, 41,
		51, 19, 59, 27, 49, 17, 57, 25,
		15, 47, 7, 39, 13, 45, 5, 37,
		63, 31, 55, 23, 61, 29, 53, 21
	);
	int x = coord.x % 8;
	int y = coord.y % 8;
	return float(values[y * 8 + x]) / 64.0;
}

float blueNoise(ivec2 coord) {
	float x = float(coord.x % 64);
	float y = float(coord.y % 64);
	float inner = fract(0.06711056 * x + 0.00583715 * y);
	return fract(52.9829189 * inner);
}

float matrixSizeForAlgorithm() {
	if (u_algorithm < 0.5) return 2.0;
	if (u_algorithm < 1.5) return 4.0;
	if (u_algorithm < 2.5) return 8.0;
	return 64.0;
}

float ditherValue(ivec2 coord) {
	if (u_algorithm < 0.5) return bayer2(coord);
	if (u_algorithm < 1.5) return bayer4(coord);
	if (u_algorithm < 2.5) return bayer8(coord);
	return blueNoise(coord);
}

vec3 palette(float t) {
	vec3 a = vec3(0.03, 0.04, 0.10);
	vec3 b = vec3(0.03, 0.26, 0.86);
	vec3 c = vec3(0.95, 0.66, 0.05);
	vec3 d = vec3(0.72, 0.32, 0.92);
	vec3 e = vec3(0.40, 0.84, 0.90);

	vec3 base = mix(a, b, smoothstep(0.0, 0.42, t));
	base = mix(base, c, smoothstep(0.24, 0.62, t));
	base = mix(base, d, smoothstep(0.54, 0.84, t));
	base = mix(base, e, smoothstep(0.78, 1.0, t));
	return base;
}

vec3 sourceField(vec2 uv, float time) {
	vec2 p = uv * 2.0 - 1.0;
	p.x *= u_resolution.x / max(u_resolution.y, 1.0);

	float waveA = sin((p.x * 2.7 + p.y * 1.35) + time * 1.2);
	float waveB = sin(length(p + vec2(sin(time * 0.3), cos(time * 0.24)) * 0.38) * 8.4 - time * 1.45);
	float waveC = cos((p.x - p.y) * 4.8 - time * 0.82);
	float field = waveA * 0.34 + waveB * 0.44 + waveC * 0.22;
	field = field * 0.5 + 0.5;

	float vignette = smoothstep(1.45, 0.18, length(p));
	vec3 color = palette(field);
	color += vec3(0.12, 0.03, 0.18) * sin((uv.x + uv.y + time * 0.18) * 13.0);
	return clamp(color * (0.72 + vignette * 0.42), 0.0, 1.0);
}

vec3 sampleCoverTexture(vec2 uv) {
	ivec2 texSizeI = textureSize(u_texture, 0);
	vec2 texSize = vec2(texSizeI);
	float aspect = u_resolution.x / max(u_resolution.y, 1.0);
	float textureAspect = texSize.x / max(texSize.y, 1.0);

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

	vec2 sampleUV = uv * coverScale + coverOffset;
	sampleUV.y = 1.0 - sampleUV.y;
	return texture(u_texture, clamp(sampleUV, vec2(0.0), vec2(1.0))).rgb;
}

vec3 sampleSource(vec2 uv) {
	return u_sourceMode > 0.5
		? sampleCoverTexture(uv)
		: sourceField(uv, u_time * u_speed);
}

float ditherThreshold(vec2 cellCoordinates, vec2 splitOffset) {
	float matrixSize = matrixSizeForAlgorithm();
	float animatedOffset = floor(u_time * u_ditherSpeed * matrixSize) * u_animateDither;
	ivec2 ditherCoord = ivec2(floor(cellCoordinates + vec2(animatedOffset) + splitOffset));
	return ditherValue(ditherCoord) - 0.5;
}

vec3 clipColor(vec3 color) {
	float lum = luma(color);
	float colorMin = min(color.r, min(color.g, color.b));
	float colorMax = max(color.r, max(color.g, color.b));
	if (colorMin < 0.0) {
		color = lum + ((color - lum) * lum) / max(lum - colorMin, 0.000001);
	}
	if (colorMax > 1.0) {
		color = lum + ((color - lum) * (1.0 - lum)) / max(colorMax - lum, 0.000001);
	}
	return color;
}

vec3 setLum(vec3 color, float lum) {
	return clipColor(color + (lum - luma(color)));
}

float sat(vec3 color) {
	return max(color.r, max(color.g, color.b)) - min(color.r, min(color.g, color.b));
}

vec3 setSat(vec3 color, float nextSat) {
	float colorMin = min(color.r, min(color.g, color.b));
	float colorMax = max(color.r, max(color.g, color.b));
	float delta = max(colorMax - colorMin, 0.000001);
	return clamp((color - colorMin) * nextSat / delta, 0.0, nextSat);
}

vec3 blendColor(vec3 base, vec3 blend, float mode) {
	if (mode < 0.5) return blend;
	if (mode < 1.5) return base * blend;
	if (mode < 2.5) return 1.0 - (1.0 - base) * (1.0 - blend);
	if (mode < 3.5) {
		vec3 dark = 2.0 * base * blend;
		vec3 light = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
		return mix(dark, light, step(vec3(0.5), base));
	}
	if (mode < 4.5) return min(base, blend);
	if (mode < 5.5) return max(base, blend);
	if (mode < 6.5) return clamp(base / max(1.0 - blend, 0.000001), 0.0, 1.0);
	if (mode < 7.5) return clamp(1.0 - (1.0 - base) / max(blend, 0.000001), 0.0, 1.0);
	if (mode < 8.5) {
		vec3 dark = 2.0 * base * blend;
		vec3 light = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
		return mix(dark, light, step(vec3(0.5), blend));
	}
	if (mode < 9.5) {
		vec3 dark = base - (1.0 - 2.0 * blend) * base * (1.0 - base);
		vec3 d = mix(((16.0 * base - 12.0) * base + 4.0) * base, sqrt(max(base, 0.0)), step(vec3(0.25), base));
		vec3 light = base + (2.0 * blend - 1.0) * (d - base);
		return mix(dark, light, step(vec3(0.5), blend));
	}
	if (mode < 10.5) return abs(base - blend);
	if (mode < 11.5) return base + blend - 2.0 * base * blend;
	if (mode < 12.5) return setLum(setSat(blend, sat(base)), luma(base));
	if (mode < 13.5) return setLum(setSat(base, sat(blend)), luma(base));
	if (mode < 14.5) return setLum(blend, luma(base));
	return setLum(base, luma(blend));
}

vec3 rotateHue(vec3 color, float angle) {
	float c = cos(angle);
	float s = sin(angle);
	mat3 hueRotation = mat3(
		0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
		0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.140, 0.072 - c * 0.072 - s * 0.283,
		0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072
	);
	return clamp(color * hueRotation, 0.0, 1.0);
}

vec3 applyLayerAdjustments(vec3 color) {
	vec3 saturated = mix(vec3(luma(color)), color, max(u_saturation, 0.0));
	return rotateHue(saturated, radians(u_hue));
}

void main() {
	vec2 fragCoord = v_uv * u_resolution;
	float pixelSize = max(u_pixelSize * max(u_pixelRatio, 1.0), 1.0);
	vec2 cellCoordinates = floor(fragCoord / pixelSize);
	vec2 sampleUV = ((cellCoordinates + 0.5) * pixelSize) / u_resolution;
	vec3 sourceColor = sampleSource(clamp(sampleUV, vec2(0.0), vec2(1.0)));

	float split = u_chromaticSplit > 0.5 ? 1.0 : 0.0;
	float thresholdR = ditherThreshold(cellCoordinates, vec2(0.0, 0.0));
	float thresholdG = ditherThreshold(cellCoordinates, vec2(split, 0.0));
	float thresholdB = ditherThreshold(cellCoordinates, vec2(0.0, split));

	float levelsMinusOne = max(u_levels - 1.0, 1.0);
	vec3 adjusted = sourceColor + vec3(thresholdR, thresholdG, thresholdB) * clamp(u_spread, 0.0, 1.0);
	vec3 quantized = clamp(floor(adjusted * levelsMinusOne + 0.5) / levelsMinusOne, vec3(0.0), vec3(1.0));
	float quantizedLuma = dot(quantized, vec3(0.2126, 0.7152, 0.0722));

	vec3 color = quantized;
	if (u_colorMode > 1.5) {
		color = mix(u_shadowColor, u_highlightColor, quantizedLuma);
	} else if (u_colorMode > 0.5) {
		color = vec3(quantizedLuma) * u_monoColor;
	}

	vec2 cellFrac = fract(fragCoord / pixelSize);
	vec2 centered = cellFrac - vec2(0.5);
	float dist = max(abs(centered.x), abs(centered.y));
	float halfSize = max(u_dotScale, 0.0) * 0.5;
	float mask = 1.0 - smoothstep(max(halfSize - 0.01, 0.0), halfSize, dist);

	vec3 ditherColor = applyLayerAdjustments(clamp(color * mask, 0.0, 1.0));
	vec3 blendedColor = blendColor(sourceColor, ditherColor, u_blendMode);
	vec3 filterColor = mix(sourceColor, blendedColor, clamp(u_layerOpacity, 0.0, 1.0));
	vec3 maskColor = sourceColor * mix(1.0, quantizedLuma * mask, clamp(u_layerOpacity, 0.0, 1.0));
	vec3 finalColor = u_compositeMode > 0.5 ? maskColor : filterColor;

	fragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
`;

type RGB = readonly [number, number, number];

export type DitheringSourceMode = "field" | "image";
export type DitheringPreset = (typeof DITHERING_PRESETS)[number];
export type DitheringAlgorithm = (typeof DITHERING_ALGORITHMS)[number];
export type DitheringColorMode = (typeof DITHERING_COLOR_MODES)[number];
export type DitheringBlendMode = (typeof DITHERING_BLEND_MODES)[number];
export type DitheringCompositeMode = (typeof DITHERING_COMPOSITE_MODES)[number];

export interface DitheringProps {
	className?: string;
	style?: CSSProperties;
	sourceMode?: DitheringSourceMode;
	imageSrc?: string;
	opacity?: number;
	blendMode?: DitheringBlendMode;
	compositeMode?: DitheringCompositeMode;
	hue?: number;
	saturation?: number;
	preset?: DitheringPreset;
	algorithm?: DitheringAlgorithm;
	levels?: number;
	pixelSize?: number;
	spread?: number;
	dotScale?: number;
	animateDither?: boolean;
	ditherSpeed?: number;
	chromaticSplit?: boolean;
	colorMode?: DitheringColorMode;
	monoColor?: string;
	shadowColor?: string;
	highlightColor?: string;
	speed?: number;
}

export type DitheringPresetDefaults = Partial<
	Pick<
		DitheringProps,
		| "algorithm"
		| "colorMode"
		| "highlightColor"
		| "levels"
		| "monoColor"
		| "pixelSize"
		| "shadowColor"
		| "spread"
	>
>;

export const DITHERING_PRESET_DEFAULTS = {
	gameboy: {
		algorithm: "bayer-2x2",
		colorMode: "duo-tone",
		highlightColor: "#9bbc0f",
		levels: 4,
		pixelSize: 3,
		shadowColor: "#0f380f",
		spread: 0.5,
	},
} as const satisfies Record<Exclude<DitheringPreset, "custom">, DitheringPresetDefaults>;

export function getDitheringPresetDefaults(preset: DitheringPreset): DitheringPresetDefaults {
	return preset === "gameboy" ? DITHERING_PRESET_DEFAULTS.gameboy : {};
}

function createDefaultTexture(): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = 768;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;

	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	gradient.addColorStop(0, "#05070F");
	gradient.addColorStop(0.2, "#1868DB");
	gradient.addColorStop(0.45, "#FCA700");
	gradient.addColorStop(0.7, "#AF59E1");
	gradient.addColorStop(1, "#66D9E8");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const marks = [
		{ x: 140, y: 116, radius: 92, color: "#FFFFFF", alpha: 0.3 },
		{ x: 514, y: 118, radius: 144, color: "#91FFCC", alpha: 0.38 },
		{ x: 382, y: 338, radius: 188, color: "#FF4040", alpha: 0.28 },
		{ x: 656, y: 420, radius: 92, color: "#00001A", alpha: 0.5 },
	];

	for (const mark of marks) {
		ctx.globalAlpha = mark.alpha;
		ctx.beginPath();
		ctx.arc(mark.x, mark.y, mark.radius, 0, Math.PI * 2);
		ctx.fillStyle = mark.color;
		ctx.fill();
	}

	ctx.globalAlpha = 1;
	ctx.fillStyle = "rgba(255, 255, 255, 0.64)";
	ctx.font = '700 136px "JetBrains Mono", Menlo, Consolas, monospace';
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("VPK", canvas.width / 2, canvas.height / 2 + 8);

	return canvas;
}

function parseHexColor(value: string, fallback: RGB): RGB {
	const normalized = value.trim();
	const short = /^#([0-9a-f]{3})$/i.exec(normalized);
	if (short) {
		return [
			parseInt(short[1][0] + short[1][0], 16) / 255,
			parseInt(short[1][1] + short[1][1], 16) / 255,
			parseInt(short[1][2] + short[1][2], 16) / 255,
		];
	}

	const full = /^#([0-9a-f]{6})$/i.exec(normalized);
	if (!full) return fallback;

	return [
		parseInt(full[1].slice(0, 2), 16) / 255,
		parseInt(full[1].slice(2, 4), 16) / 255,
		parseInt(full[1].slice(4, 6), 16) / 255,
	];
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
	const shader = gl.createShader(type);
	if (!shader) return null;

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}

	return shader;
}

function setTextureFromSource(
	gl: WebGL2RenderingContext,
	texture: WebGLTexture | null,
	source: TexImageSource,
) {
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
}

function enumIndex<const T extends readonly string[]>(values: T, value: T[number], fallback = 0): number {
	const index = values.indexOf(value);
	return index === -1 ? fallback : index;
}

function getAlgorithmValue(algorithm: DitheringAlgorithm): number {
	switch (algorithm) {
		case "bayer-2x2":
			return 0;
		case "bayer-8x8":
			return 2;
		case "noise":
			return 3;
		case "bayer-4x4":
		default:
			return 1;
	}
}

function getColorModeValue(colorMode: DitheringColorMode): number {
	switch (colorMode) {
		case "monochrome":
			return 1;
		case "duo-tone":
			return 2;
		case "source":
		default:
			return 0;
	}
}

export default function Dithering({
	className,
	style,
	sourceMode = "field",
	imageSrc,
	opacity = 1,
	blendMode = "normal",
	compositeMode = "filter",
	hue = 0,
	saturation = 1,
	preset = "custom",
	algorithm,
	levels,
	pixelSize,
	spread,
	dotScale = 1,
	animateDither = false,
	ditherSpeed = 1,
	chromaticSplit = false,
	colorMode,
	monoColor = "#f5f5f0",
	shadowColor,
	highlightColor,
	speed = 1,
}: DitheringProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);
	const presetDefaults = getDitheringPresetDefaults(preset);
	const effectiveAlgorithm = algorithm ?? presetDefaults.algorithm ?? "bayer-4x4";
	const effectiveLevels = levels ?? presetDefaults.levels ?? 4;
	const effectivePixelSize = pixelSize ?? presetDefaults.pixelSize ?? 1;
	const effectiveSpread = spread ?? presetDefaults.spread ?? 0.5;
	const effectiveColorMode = colorMode ?? presetDefaults.colorMode ?? "source";
	const effectiveShadowColor = shadowColor ?? presetDefaults.shadowColor ?? "#101010";
	const effectiveHighlightColor = highlightColor ?? presetDefaults.highlightColor ?? "#f5f2e8";

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
		if (!gl) return;

		const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
		if (!vertexShader || !fragmentShader) return;

		const program = gl.createProgram();
		if (!program) return;

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			return;
		}

		gl.useProgram(program);

		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

		const position = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

		const sourceTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
		setTextureFromSource(gl, sourceTexture, createDefaultTexture());

		gl.uniform1f(gl.getUniformLocation(program, "u_sourceMode"), sourceMode === "image" ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(program, "u_layerOpacity"), opacity);
		gl.uniform1f(gl.getUniformLocation(program, "u_blendMode"), enumIndex(DITHERING_BLEND_MODES, blendMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_compositeMode"), enumIndex(DITHERING_COMPOSITE_MODES, compositeMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_hue"), hue);
		gl.uniform1f(gl.getUniformLocation(program, "u_saturation"), saturation);
		gl.uniform1f(gl.getUniformLocation(program, "u_algorithm"), getAlgorithmValue(effectiveAlgorithm));
		gl.uniform1f(gl.getUniformLocation(program, "u_levels"), Math.max(2, effectiveLevels));
		gl.uniform1f(gl.getUniformLocation(program, "u_pixelSize"), Math.max(1, Math.round(effectivePixelSize)));
		gl.uniform1f(gl.getUniformLocation(program, "u_spread"), effectiveSpread);
		gl.uniform1f(gl.getUniformLocation(program, "u_dotScale"), dotScale);
		gl.uniform1f(gl.getUniformLocation(program, "u_animateDither"), animateDither ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_ditherSpeed"), ditherSpeed);
		gl.uniform1f(gl.getUniformLocation(program, "u_chromaticSplit"), chromaticSplit ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_colorMode"), getColorModeValue(effectiveColorMode));

		const monoRGB = parseHexColor(monoColor, [0.96, 0.96, 0.94]);
		const shadowRGB = parseHexColor(effectiveShadowColor, [0.06, 0.06, 0.06]);
		const highlightRGB = parseHexColor(effectiveHighlightColor, [0.96, 0.95, 0.91]);
		gl.uniform3f(gl.getUniformLocation(program, "u_monoColor"), monoRGB[0], monoRGB[1], monoRGB[2]);
		gl.uniform3f(gl.getUniformLocation(program, "u_shadowColor"), shadowRGB[0], shadowRGB[1], shadowRGB[2]);
		gl.uniform3f(gl.getUniformLocation(program, "u_highlightColor"), highlightRGB[0], highlightRGB[1], highlightRGB[2]);

		let disposed = false;
		if (imageSrc) {
			const image = new window.Image();
			image.crossOrigin = "anonymous";
			image.onload = () => {
				if (disposed) return;
				gl.activeTexture(gl.TEXTURE0);
				setTextureFromSource(gl, sourceTexture, image);
			};
			image.src = imageSrc;
		}

		const uResolution = gl.getUniformLocation(program, "u_resolution");
		const uPixelRatio = gl.getUniformLocation(program, "u_pixelRatio");
		const uTime = gl.getUniformLocation(program, "u_time");
		const render = (timeMs = 0) => {
			const dpr = window.devicePixelRatio || 1;
			const width = Math.max(Math.floor(canvas.clientWidth * dpr), 1);
			const height = Math.max(Math.floor(canvas.clientHeight * dpr), 1);

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}

			gl.uniform2f(uResolution, width, height);
			gl.uniform1f(uPixelRatio, dpr);
			gl.uniform1f(uTime, timeMs * 0.001);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animRef.current = requestAnimationFrame(render);
		};

		animRef.current = requestAnimationFrame(render);

		return () => {
			disposed = true;
			cancelAnimationFrame(animRef.current);
			gl.deleteTexture(sourceTexture);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		};
	}, [
		animateDither,
		blendMode,
		chromaticSplit,
		compositeMode,
		ditherSpeed,
		dotScale,
		effectiveAlgorithm,
		effectiveColorMode,
		effectiveHighlightColor,
		effectiveLevels,
		effectivePixelSize,
		effectiveShadowColor,
		effectiveSpread,
		hue,
		imageSrc,
		monoColor,
		opacity,
		saturation,
		sourceMode,
		speed,
	]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block", ...style }}
		/>
	);
}
