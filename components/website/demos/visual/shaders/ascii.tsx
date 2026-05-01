"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

export const ASCII_CHARSETS = {
	light: " .:-=+*#%@",
	dense: " .',:;!|({#@",
	blocks: " ░▒▓█",
	hatching: " ╱╲╳░▒",
	binary: "01",
} as const;

export const ASCII_DEFAULT_CHARACTERS = ASCII_CHARSETS.light;

const ASCII_ATLAS_TILE_SIZE = 64;

export const ASCII_BLEND_MODES = [
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

export const ASCII_CONTROL_BLEND_MODES = ["normal", "multiply", "screen", "overlay", "darken", "lighten"] as const;
export const ASCII_COMPOSITE_MODES = ["filter", "mask"] as const;
export const ASCII_MASK_SOURCES = ["luminance", "alpha", "red", "green", "blue"] as const;
export const ASCII_MASK_MODES = ["multiply", "stencil"] as const;
export const ASCII_FONT_WEIGHTS = ["thin", "regular", "bold"] as const;
export const ASCII_COLOR_MODES = ["source", "monochrome", "green-terminal"] as const;
export const ASCII_CONTROL_COLOR_MODES = ["source", "monochrome"] as const;
export const ASCII_COLOR_SOURCE_MODES = ["source", "luminance", "lightness", "red", "green", "blue"] as const;
export const ASCII_CHARACTER_MODES = ["signal", "sequence"] as const;
export const ASCII_SIGNAL_MODES = ["luminance", "lightness", "red", "green", "blue"] as const;
export const ASCII_TONE_MAPPING_MODES = ["none", "aces", "reinhard", "totos", "cinematic"] as const;
export const ASCII_DEFAULT_SOURCE_COLORS = ["#1868DB", "#FCA700", "#AF59E1", "#6A9A23"] as const;
export const ASCII_MAX_SOURCE_COLORS = 8;

export type AsciiBlendMode = (typeof ASCII_BLEND_MODES)[number];
export type AsciiCharset = keyof typeof ASCII_CHARSETS | "custom";
export type AsciiCharacterMode = (typeof ASCII_CHARACTER_MODES)[number];
export type AsciiColorMode = (typeof ASCII_COLOR_MODES)[number];
export type AsciiColorSourceMode = (typeof ASCII_COLOR_SOURCE_MODES)[number];
export type AsciiCompositeMode = (typeof ASCII_COMPOSITE_MODES)[number];
export type AsciiFontWeight = (typeof ASCII_FONT_WEIGHTS)[number];
export type AsciiMaskMode = (typeof ASCII_MASK_MODES)[number];
export type AsciiMaskSource = (typeof ASCII_MASK_SOURCES)[number];
export type AsciiSignalMode = (typeof ASCII_SIGNAL_MODES)[number];
export type AsciiSourceMode = "field" | "image";
export type AsciiToneMappingMode = (typeof ASCII_TONE_MAPPING_MODES)[number];

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
uniform sampler2D u_asciiAtlas;
uniform float u_sourceMode;
uniform float u_cellSize;
uniform float u_layerOpacity;
uniform float u_blendMode;
uniform float u_compositeMode;
uniform float u_hue;
uniform float u_saturation;
uniform float u_characterMode;
uniform float u_colorMode;
uniform float u_colorSourceMode;
uniform float u_directionBias;
uniform float u_glyphSignalMode;
uniform float u_colorSignalMode;
uniform float u_maskSource;
uniform float u_maskMode;
uniform float u_maskInvert;
uniform float u_toneMappingMode;
uniform float u_signalBlackPoint;
uniform float u_signalWhitePoint;
uniform float u_signalGamma;
uniform float u_presenceThreshold;
uniform float u_presenceSoftness;
uniform float u_shimmerAmount;
uniform float u_shimmerSpeed;
uniform float u_bloomEnabled;
uniform float u_bloomIntensity;
uniform float u_bloomThreshold;
uniform float u_bloomRadius;
uniform float u_bloomSoftness;
uniform float u_bgOpacity;
uniform float u_invert;
uniform float u_speed;
uniform float u_transparentBackground;
uniform float u_time;
uniform float u_atlasColumns;
uniform float u_atlasRows;
uniform float u_characterCount;
uniform int u_sourceColorCount;
uniform vec4 u_sourceColors[8];
uniform vec3 u_tintColor;
uniform vec3 u_backgroundColor;

vec3 getSourceColor(int index) {
	if (u_sourceColorCount < 1) return vec3(0.0);
	int safeIndex = clamp(index, 0, u_sourceColorCount - 1);
	return u_sourceColors[safeIndex].rgb;
}

vec3 palette(float t) {
	if (u_sourceColorCount < 1) return vec3(0.0);
	if (u_sourceColorCount < 2) return getSourceColor(0);
	float scaledT = clamp(t, 0.0, 1.0) * float(u_sourceColorCount - 1);
	int index = min(int(floor(scaledT)), u_sourceColorCount - 2);
	float localT = fract(scaledT);
	localT = localT * localT * (3.0 - 2.0 * localT);
	return mix(getSourceColor(index), getSourceColor(index + 1), localT);
}

float luma(vec3 color) {
	return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

vec3 sourceField(vec2 uv, float time) {
	vec2 p = uv * 2.0 - 1.0;
	p.x *= u_resolution.x / max(u_resolution.y, 1.0);

	float waveA = sin((p.x * 2.8 + p.y * 1.2) + time * 1.25);
	float waveB = sin(length(p + vec2(sin(time * 0.32), cos(time * 0.24)) * 0.32) * 8.0 - time * 1.6);
	float waveC = cos((p.x - p.y) * 4.4 - time * 0.9);
	float field = waveA * 0.36 + waveB * 0.42 + waveC * 0.22;
	field = field * 0.5 + 0.5;

	float vignette = smoothstep(1.45, 0.25, length(p));
	vec3 color = palette(field);
	color += vec3(0.16, 0.06, 0.24) * sin((uv.x + uv.y + time * 0.2) * 12.0);
	return clamp(color * (0.72 + vignette * 0.38), 0.0, 1.0);
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

vec3 acesTonemap(vec3 color) {
	float a = 2.51;
	float b = 0.03;
	float c = 2.43;
	float d = 0.59;
	float e = 0.14;
	return clamp((color * (a * color + b)) / (color * (c * color + d) + e), 0.0, 1.0);
}

vec3 reinhardTonemap(vec3 color) {
	return color / (color + vec3(1.0));
}

vec3 totosTonemap(vec3 color) {
	vec3 compressed = color * vec3(1.18, 1.04, 0.94) / (color * vec3(0.82, 0.9, 0.98) + vec3(0.78, 0.68, 0.6));
	float lum = luma(compressed);
	float shadowLift = smoothstep(0.0, 0.38, lum);
	float highlightRoll = smoothstep(0.42, 1.0, lum);
	float toneMix = smoothstep(0.16, 0.82, lum);
	vec3 cool = vec3(compressed.r * 0.82, compressed.g * 0.98 + shadowLift * 0.04, compressed.b * 1.24 + shadowLift * 0.08);
	vec3 warm = vec3(compressed.r * 1.14 + highlightRoll * 0.08, compressed.g * 1.03 + highlightRoll * 0.03, compressed.b * 0.84);
	vec3 splitToned = mix(cool, warm, toneMix);
	vec3 curved = vec3(pow(splitToned.r, 0.86), pow(splitToned.g, 0.95), pow(splitToned.b, 1.12));
	return clamp(mix(curved, vec3(lum), highlightRoll * 0.06), 0.0, 1.0);
}

vec3 cinematicTonemap(vec3 color) {
	return clamp(vec3(
		smoothstep(0.05, 0.95, color.r * 0.95 + 0.02),
		smoothstep(0.05, 0.95, color.g * 1.05),
		smoothstep(0.05, 0.95, color.b * 1.1)
	), 0.0, 1.0);
}

vec3 toneMap(vec3 color) {
	if (u_toneMappingMode < 0.5) return color;
	if (u_toneMappingMode < 1.5) return acesTonemap(color);
	if (u_toneMappingMode < 2.5) return reinhardTonemap(color);
	if (u_toneMappingMode < 3.5) return totosTonemap(color);
	return cinematicTonemap(color);
}

float signalValue(vec3 color, float mode) {
	if (mode < 0.5) return luma(color);
	if (mode < 1.5) return (color.r + color.g + color.b) / 3.0;
	if (mode < 2.5) return color.r;
	if (mode < 3.5) return color.g;
	return color.b;
}

float maskValue(vec3 color, float alpha) {
	if (u_maskSource < 0.5) return luma(color);
	if (u_maskSource < 1.5) return alpha;
	if (u_maskSource < 2.5) return color.r;
	if (u_maskSource < 3.5) return color.g;
	return color.b;
}

float shapedSignal(float rawSignal) {
	float signal = u_invert > 0.5 ? 1.0 - rawSignal : rawSignal;
	float signalRange = max(u_signalWhitePoint - u_signalBlackPoint, 0.001);
	float gammaExp = 1.0 / max(u_signalGamma, 0.1);
	return pow(clamp((signal - u_signalBlackPoint) / signalRange, 0.0, 1.0), gammaExp);
}

vec3 sourceColorFromMode(vec3 color, float mode) {
	if (mode < 0.5) return color;

	float signalMode = mode - 1.0;
	float signal = shapedSignal(signalValue(color, signalMode));

	if (mode < 2.5) return vec3(signal);
	if (mode < 3.5) return vec3(signal, 0.0, 0.0);
	if (mode < 4.5) return vec3(0.0, signal, 0.0);
	return vec3(0.0, 0.0, signal);
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
	vec2 pixelCoord = v_uv * u_resolution;
	float cellSize = max(u_cellSize * max(u_pixelRatio, 1.0), 1.0);
	vec2 cellCount = max(floor(u_resolution / cellSize), vec2(1.0));
	vec2 gridUV = v_uv * cellCount;
	vec2 cellID = floor(gridUV);
	vec2 cellUV = fract(gridUV);
	vec2 sampleUV = (cellID + 0.5) / cellCount;

	vec3 sourceColor = sampleSource(sampleUV);
	vec3 toneMapped = toneMap(sourceColor);
	float rawGlyphSignal = signalValue(toneMapped, u_glyphSignalMode);
	float rawColorSignal = signalValue(toneMapped, u_colorSignalMode);

	float glyphSignal = shapedSignal(rawGlyphSignal);
	float colorSignal = shapedSignal(rawColorSignal);

	vec2 uvOffset = vec2(cellSize / max(u_resolution.x, 1.0), cellSize / max(u_resolution.y, 1.0));
	float leftLuma = luma(sampleSource(clamp(sampleUV - vec2(uvOffset.x, 0.0), 0.0, 1.0)));
	float rightLuma = luma(sampleSource(clamp(sampleUV + vec2(uvOffset.x, 0.0), 0.0, 1.0)));
	float topLuma = luma(sampleSource(clamp(sampleUV - vec2(0.0, uvOffset.y), 0.0, 1.0)));
	float bottomLuma = luma(sampleSource(clamp(sampleUV + vec2(0.0, uvOffset.y), 0.0, 1.0)));
	float gradMag = clamp(length(vec2(rightLuma - leftLuma, bottomLuma - topLuma)), 0.0, 1.0);
	float biasedGlyphSignal = mix(glyphSignal, gradMag, clamp(u_directionBias, 0.0, 1.0));

	float characterCount = max(u_characterCount, 1.0);
	float signalCharacterIndex = min(floor(clamp(biasedGlyphSignal, 0.0, 1.0) * characterCount), characterCount - 1.0);
	float sequenceCharacterIndex = floor(mod(cellID.x + cellID.y * cellCount.x, characterCount));
	float characterIndex = u_characterMode > 0.5 ? sequenceCharacterIndex : signalCharacterIndex;
	vec2 atlasSize = vec2(max(u_atlasColumns, 1.0), max(u_atlasRows, 1.0));
	vec2 atlasCell = vec2(mod(characterIndex, atlasSize.x), floor(characterIndex / atlasSize.x));
	vec2 atlasUV = (atlasCell + vec2(cellUV.x, 1.0 - cellUV.y)) / atlasSize;
	float characterMask = texture(u_asciiAtlas, atlasUV).a;

	float halfSoft = max(u_presenceSoftness * 0.5, 0.001);
	float presenceMask = smoothstep(u_presenceThreshold - halfSoft, u_presenceThreshold + halfSoft, biasedGlyphSignal);
	float cellPhase = fract(sin(dot(cellID, vec2(12.9898, 78.233))) * 43758.5453);
	float shimmerWave = sin(u_time * u_shimmerSpeed * 0.3 + cellPhase * 6.2831);
	float shimmerOpacity = 1.0 - ((shimmerWave + 1.0) * 0.5 * clamp(u_shimmerAmount, 0.0, 1.0));
	float finalMask = characterMask * presenceMask * shimmerOpacity;

	vec3 monochromeColor = u_tintColor * colorSignal;
	vec3 greenTerminalColor = vec3(0.0, colorSignal, 0.0);
	vec3 sourceGlyphColor = sourceColorFromMode(toneMapped, u_colorSourceMode);
	vec3 glyphColor = u_colorMode < 0.5
		? sourceGlyphColor
		: (u_colorMode < 1.5 ? monochromeColor : greenTerminalColor);
	vec3 backgroundColor = u_colorMode < 0.5 ? mix(u_backgroundColor, sourceGlyphColor, u_bgOpacity) : u_backgroundColor;
	vec3 asciiColor = mix(backgroundColor, glyphColor, finalMask);

	float bloomThresholdRange = max(u_bloomSoftness * 0.5, 0.001);
	float bloomSignal = smoothstep(u_bloomThreshold - bloomThresholdRange, u_bloomThreshold + bloomThresholdRange, biasedGlyphSignal);
	float cellDistance = length(cellUV - 0.5);
	float bloomRadius = clamp(u_bloomRadius / 24.0, 0.0, 1.0);
	float cellGlow = 1.0 - smoothstep(max(0.04, 0.48 - bloomRadius * 0.42), 0.72, cellDistance);
	asciiColor += glyphColor * bloomSignal * finalMask * cellGlow * u_bloomIntensity * u_bloomEnabled;
	asciiColor = applyLayerAdjustments(clamp(asciiColor, 0.0, 1.0));

	vec3 blendedColor = blendColor(toneMapped, asciiColor, u_blendMode);
	vec3 filterColor = mix(toneMapped, blendedColor, clamp(u_layerOpacity, 0.0, 1.0));
	float rawMask = maskValue(asciiColor, finalMask);
	rawMask = u_maskInvert > 0.5 ? 1.0 - rawMask : rawMask;
	float maskStrength = mix(1.0, clamp(rawMask, 0.0, 1.0), clamp(u_layerOpacity, 0.0, 1.0));
	vec3 multiplyMaskColor = toneMapped * maskStrength;
	vec3 stencilMaskColor = toneMapped * step(0.5, maskStrength);
	vec3 maskColor = u_maskMode > 0.5 ? stencilMaskColor : multiplyMaskColor;
	vec3 finalColor = u_compositeMode > 0.5 ? maskColor : filterColor;
	float outputAlpha = u_transparentBackground > 0.5 ? clamp(finalMask * u_layerOpacity, 0.0, 1.0) : 1.0;
	vec3 outputColor = u_transparentBackground > 0.5 ? glyphColor : finalColor;

	fragColor = vec4(clamp(outputColor, 0.0, 1.0), outputAlpha);
}
`;

type AsciiAtlas = Readonly<{
	canvas: HTMLCanvasElement;
	columns: number;
	rows: number;
	characterCount: number;
}>;

type RGB = readonly [number, number, number];

function createAsciiAtlas(characters: string, fontWeight: AsciiFontWeight): AsciiAtlas {
	const glyphs = Array.from(characters.length > 0 ? characters : " ");
	const columns = Math.max(Math.ceil(Math.sqrt(glyphs.length)), 1);
	const rows = Math.max(Math.ceil(glyphs.length / columns), 1);
	const canvas = document.createElement("canvas");
	canvas.width = columns * ASCII_ATLAS_TILE_SIZE;
	canvas.height = rows * ASCII_ATLAS_TILE_SIZE;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		return { canvas, columns, rows, characterCount: glyphs.length };
	}

	const fontWeightMap: Record<AsciiFontWeight, string> = {
		bold: "700",
		regular: "400",
		thin: "100",
	};

	ctx.imageSmoothingEnabled = false;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#ffffff";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `${fontWeightMap[fontWeight]} ${Math.round(ASCII_ATLAS_TILE_SIZE * 0.78)}px "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace`;

	for (let index = 0; index < glyphs.length; index++) {
		const column = index % columns;
		const row = Math.floor(index / columns);
		ctx.fillText(
			glyphs[index] ?? "",
			column * ASCII_ATLAS_TILE_SIZE + ASCII_ATLAS_TILE_SIZE / 2,
			row * ASCII_ATLAS_TILE_SIZE + ASCII_ATLAS_TILE_SIZE / 2 + 1,
		);
	}

	return { canvas, columns, rows, characterCount: glyphs.length };
}

function rgbToCss(color: RGB): string {
	return `rgb(${Math.round(color[0] * 255)} ${Math.round(color[1] * 255)} ${Math.round(color[2] * 255)})`;
}

function createDefaultTexture(sourceColorValues: readonly RGB[]): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = 768;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;

	const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
	const stops = Math.max(sourceColorValues.length - 1, 1);
	sourceColorValues.forEach((color, index) => {
		gradient.addColorStop(index / stops, rgbToCss(color));
	});
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const marks = [
		{ x: 180, y: 120, radius: 96, color: "#FFFFFF", alpha: 0.34 },
		{ x: 520, y: 140, radius: 130, color: "#91FFCC", alpha: 0.42 },
		{ x: 380, y: 340, radius: 180, color: "#FF4040", alpha: 0.32 },
		{ x: 650, y: 420, radius: 90, color: "#00001A", alpha: 0.52 },
	];

	for (const mark of marks) {
		ctx.globalAlpha = mark.alpha;
		ctx.beginPath();
		ctx.arc(mark.x, mark.y, mark.radius, 0, Math.PI * 2);
		ctx.fillStyle = mark.color;
		ctx.fill();
	}

	ctx.globalAlpha = 1;
	ctx.fillStyle = "rgba(255, 255, 255, 0.62)";
	ctx.font = '700 136px "JetBrains Mono", Menlo, Consolas, monospace';
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.fillText("VPK", canvas.width / 2, canvas.height / 2 + 8);

	return canvas;
}

function resolveCssColorValue(value: string, depth = 0): string {
	const normalized = value.trim();
	if (depth > 6) return normalized;

	const variable = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/i.exec(normalized);
	if (!variable || typeof window === "undefined") return normalized;

	const tokenValue = window.getComputedStyle(document.documentElement).getPropertyValue(variable[1]).trim();
	if (tokenValue) return resolveCssColorValue(tokenValue, depth + 1);

	const fallback = variable[2]?.trim();
	return fallback ? resolveCssColorValue(fallback, depth + 1) : normalized;
}

function parseColor(value: string, fallback: RGB): RGB {
	const normalized = resolveCssColorValue(value);
	const short = /^#([0-9a-f]{3})$/i.exec(normalized);
	if (short) {
		return [
			parseInt(short[1][0] + short[1][0], 16) / 255,
			parseInt(short[1][1] + short[1][1], 16) / 255,
			parseInt(short[1][2] + short[1][2], 16) / 255,
		];
	}

	const full = /^#([0-9a-f]{6})$/i.exec(normalized);
	if (full) {
		return [
			parseInt(full[1].slice(0, 2), 16) / 255,
			parseInt(full[1].slice(2, 4), 16) / 255,
			parseInt(full[1].slice(4, 6), 16) / 255,
		];
	}

	const rgb = /^rgba?\(\s*([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*,\s*|\s+)([\d.]+)(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i.exec(normalized);
	if (!rgb) return fallback;

	return [
		Math.min(Number.parseFloat(rgb[1]) / 255, 1),
		Math.min(Number.parseFloat(rgb[2]) / 255, 1),
		Math.min(Number.parseFloat(rgb[3]) / 255, 1),
	];
}

function resolveSourceColorValues(sourceColors?: readonly string[]): readonly RGB[] {
	const colors = sourceColors?.slice(0, ASCII_MAX_SOURCE_COLORS) ?? [...ASCII_DEFAULT_SOURCE_COLORS];
	const safeColors = colors.length > 0 ? colors : [...ASCII_DEFAULT_SOURCE_COLORS];
	return safeColors.map((color, index) => {
		const fallbackColor = ASCII_DEFAULT_SOURCE_COLORS[index % ASCII_DEFAULT_SOURCE_COLORS.length] ?? ASCII_DEFAULT_SOURCE_COLORS[0];
		const fallback = parseColor(fallbackColor, [0, 0, 0]);
		return parseColor(color, fallback);
	});
}

function flattenSourceColorValues(colors: readonly RGB[]): Float32Array {
	const data = new Float32Array(ASCII_MAX_SOURCE_COLORS * 4);
	for (let index = 0; index < ASCII_MAX_SOURCE_COLORS; index += 1) {
		const color = colors[index] ?? colors[colors.length - 1] ?? [0, 0, 0];
		data[index * 4] = color[0];
		data[index * 4 + 1] = color[1];
		data[index * 4 + 2] = color[2];
		data[index * 4 + 3] = 1;
	}
	return data;
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

function resolveCharacters(charset: AsciiCharset, customChars: string, characters?: string): string {
	if (charset === "custom") {
		return customChars || characters || " ";
	}

	if (characters !== undefined) {
		return characters || " ";
	}

	return ASCII_CHARSETS[charset] ?? ASCII_DEFAULT_CHARACTERS;
}

export interface AsciiProps {
	className?: string;
	style?: CSSProperties;
	imageSrc?: string;
	sourceMode?: AsciiSourceMode;
	sourceColors?: readonly string[];
	opacity?: number;
	blendMode?: AsciiBlendMode;
	compositeMode?: AsciiCompositeMode;
	hue?: number;
	saturation?: number;
	cellSize?: number;
	charset?: AsciiCharset;
	characterMode?: AsciiCharacterMode;
	characters?: string;
	customChars?: string;
	fontWeight?: AsciiFontWeight;
	colorMode?: AsciiColorMode;
	colorSourceMode?: AsciiColorSourceMode;
	monoColor?: string;
	tint?: string;
	backgroundColor?: string;
	bgOpacity?: number;
	invert?: boolean;
	directionBias?: number;
	maskSource?: AsciiMaskSource;
	maskMode?: AsciiMaskMode;
	maskInvert?: boolean;
	toneMapping?: AsciiToneMappingMode;
	glyphSignalMode?: AsciiSignalMode;
	colorSignalMode?: AsciiSignalMode;
	signalBlackPoint?: number;
	signalWhitePoint?: number;
	signalGamma?: number;
	presenceThreshold?: number;
	presenceSoftness?: number;
	shimmerAmount?: number;
	shimmerSpeed?: number;
	bloomEnabled?: boolean;
	bloomIntensity?: number;
	bloomThreshold?: number;
	bloomRadius?: number;
	bloomSoftness?: number;
	speed?: number;
	transparentBackground?: boolean;
}

export default function Ascii({
	className,
	style,
	imageSrc,
	sourceMode = "field",
	sourceColors,
	opacity = 1,
	blendMode = "normal",
	compositeMode = "filter",
	hue = 0,
	saturation = 1,
	cellSize = 12,
	charset = "light",
	characterMode,
	characters,
	customChars = ASCII_DEFAULT_CHARACTERS,
	fontWeight = "regular",
	colorMode = "monochrome",
	colorSourceMode = "source",
	monoColor,
	tint,
	backgroundColor = "#000000",
	bgOpacity = 0,
	invert = false,
	directionBias = 0,
	maskSource = "luminance",
	maskMode = "multiply",
	maskInvert = false,
	toneMapping = "none",
	glyphSignalMode = "luminance",
	colorSignalMode = "luminance",
	signalBlackPoint = 0,
	signalWhitePoint = 1,
	signalGamma = 1,
	presenceThreshold = 0,
	presenceSoftness = 0,
	shimmerAmount = 0,
	shimmerSpeed = 1,
	bloomEnabled = false,
	bloomIntensity = 1.25,
	bloomThreshold = 0.6,
	bloomRadius = 6,
	bloomSoftness = 0.35,
	speed = 1,
	transparentBackground = false,
}: AsciiProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animRef = useRef<number>(0);
	const activeCharacters = useMemo(
		() => resolveCharacters(charset, customChars, characters),
		[characters, charset, customChars],
	);
	const resolvedCharacterMode = characterMode ?? "signal";
	const activeMonoColor = monoColor ?? tint ?? "#F5F5F0";
	const sourceColorValues = useMemo(() => resolveSourceColorValues(sourceColors), [sourceColors]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", {
			alpha: transparentBackground,
			antialias: false,
			premultipliedAlpha: !transparentBackground,
		});
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
		setTextureFromSource(gl, sourceTexture, createDefaultTexture(sourceColorValues));

		const atlas = createAsciiAtlas(activeCharacters, fontWeight);
		const atlasTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.uniform1i(gl.getUniformLocation(program, "u_asciiAtlas"), 1);
		setTextureFromSource(gl, atlasTexture, atlas.canvas);

		gl.uniform1f(gl.getUniformLocation(program, "u_sourceMode"), sourceMode === "image" ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_cellSize"), cellSize);
		gl.uniform1f(gl.getUniformLocation(program, "u_layerOpacity"), opacity);
		gl.uniform1f(gl.getUniformLocation(program, "u_blendMode"), enumIndex(ASCII_BLEND_MODES, blendMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_compositeMode"), enumIndex(ASCII_COMPOSITE_MODES, compositeMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_hue"), hue);
		gl.uniform1f(gl.getUniformLocation(program, "u_saturation"), saturation);
		gl.uniform1f(gl.getUniformLocation(program, "u_characterMode"), enumIndex(ASCII_CHARACTER_MODES, resolvedCharacterMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_colorMode"), enumIndex(ASCII_COLOR_MODES, colorMode, 1));
		gl.uniform1f(gl.getUniformLocation(program, "u_colorSourceMode"), enumIndex(ASCII_COLOR_SOURCE_MODES, colorSourceMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_directionBias"), directionBias);
		gl.uniform1f(gl.getUniformLocation(program, "u_glyphSignalMode"), enumIndex(ASCII_SIGNAL_MODES, glyphSignalMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_colorSignalMode"), enumIndex(ASCII_SIGNAL_MODES, colorSignalMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_maskSource"), enumIndex(ASCII_MASK_SOURCES, maskSource));
		gl.uniform1f(gl.getUniformLocation(program, "u_maskMode"), enumIndex(ASCII_MASK_MODES, maskMode));
		gl.uniform1f(gl.getUniformLocation(program, "u_maskInvert"), maskInvert ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_toneMappingMode"), enumIndex(ASCII_TONE_MAPPING_MODES, toneMapping));
		gl.uniform1f(gl.getUniformLocation(program, "u_signalBlackPoint"), signalBlackPoint);
		gl.uniform1f(gl.getUniformLocation(program, "u_signalWhitePoint"), signalWhitePoint);
		gl.uniform1f(gl.getUniformLocation(program, "u_signalGamma"), signalGamma);
		gl.uniform1f(gl.getUniformLocation(program, "u_presenceThreshold"), presenceThreshold);
		gl.uniform1f(gl.getUniformLocation(program, "u_presenceSoftness"), presenceSoftness);
		gl.uniform1f(gl.getUniformLocation(program, "u_shimmerAmount"), shimmerAmount);
		gl.uniform1f(gl.getUniformLocation(program, "u_shimmerSpeed"), shimmerSpeed);
		gl.uniform1f(gl.getUniformLocation(program, "u_bloomEnabled"), bloomEnabled ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_bloomIntensity"), bloomIntensity);
		gl.uniform1f(gl.getUniformLocation(program, "u_bloomThreshold"), bloomThreshold);
		gl.uniform1f(gl.getUniformLocation(program, "u_bloomRadius"), bloomRadius);
		gl.uniform1f(gl.getUniformLocation(program, "u_bloomSoftness"), bloomSoftness);
		gl.uniform1f(gl.getUniformLocation(program, "u_bgOpacity"), bgOpacity);
		gl.uniform1f(gl.getUniformLocation(program, "u_invert"), invert ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(program, "u_transparentBackground"), transparentBackground ? 1 : 0);
		gl.uniform1f(gl.getUniformLocation(program, "u_atlasColumns"), atlas.columns);
		gl.uniform1f(gl.getUniformLocation(program, "u_atlasRows"), atlas.rows);
		gl.uniform1f(gl.getUniformLocation(program, "u_characterCount"), atlas.characterCount);
		gl.uniform1i(gl.getUniformLocation(program, "u_sourceColorCount"), sourceColorValues.length);
		gl.uniform4fv(gl.getUniformLocation(program, "u_sourceColors[0]"), flattenSourceColorValues(sourceColorValues));

		const tintRGB = parseColor(activeMonoColor, [0.96, 0.96, 0.94]);
		const backgroundRGB = parseColor(backgroundColor, [0, 0, 0]);
		gl.uniform3f(gl.getUniformLocation(program, "u_tintColor"), tintRGB[0], tintRGB[1], tintRGB[2]);
		gl.uniform3f(gl.getUniformLocation(program, "u_backgroundColor"), backgroundRGB[0], backgroundRGB[1], backgroundRGB[2]);

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
			gl.deleteTexture(atlasTexture);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		};
	}, [
		activeCharacters,
		activeMonoColor,
		backgroundColor,
		blendMode,
		bloomEnabled,
		bloomIntensity,
		bloomRadius,
		bloomSoftness,
		bloomThreshold,
		bgOpacity,
		cellSize,
		colorMode,
		colorSourceMode,
		colorSignalMode,
		compositeMode,
		directionBias,
		fontWeight,
		glyphSignalMode,
		hue,
		imageSrc,
		invert,
		maskInvert,
		maskMode,
		maskSource,
		opacity,
		presenceSoftness,
		presenceThreshold,
		resolvedCharacterMode,
		saturation,
		shimmerAmount,
		shimmerSpeed,
		signalBlackPoint,
		signalGamma,
		signalWhitePoint,
		sourceColorValues,
		sourceMode,
		speed,
		transparentBackground,
		toneMapping,
	]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block", ...style }}
		/>
	);
}
