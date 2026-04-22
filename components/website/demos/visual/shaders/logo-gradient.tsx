"use client";

import { useEffect, useRef } from "react";

const MAX_COLORS = 8;
const MAX_TEXTURE_DIMENSION = 1024;

export const LOGO_GRADIENT_DEFAULT_COLORS = [
	"#000000",
	"#0051FF",
	"#0DAAFF",
	"#BDE4FF",
] as const;

export const LOGO_GRADIENT_DEFAULT_BACKGROUND = "#000000";

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
uniform sampler2D u_heightmap;
uniform vec4 u_colorBack;
uniform vec4 u_colors[8];
uniform int u_colors_length;
uniform float u_seed;
uniform float u_speed;
uniform float u_motionMode;
uniform float u_angle;
uniform float u_scale;
uniform float u_turbAmp;
uniform float u_turbFreq;
uniform float u_turbIter;
uniform float u_waveFreq;
uniform float u_bend;
uniform float u_contour;

const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

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

vec3 toLinear(vec3 c) {
	return pow(c, vec3(2.2));
}

vec3 toSrgb(vec3 c) {
	return pow(clamp(c, 0.0, 1.0), vec3(0.4545));
}

vec3 linearToOklab(vec3 c) {
	float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
	float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
	float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

	l = pow(max(l, 0.0), 1.0 / 3.0);
	m = pow(max(m, 0.0), 1.0 / 3.0);
	s = pow(max(s, 0.0), 1.0 / 3.0);

	return vec3(
		0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
	);
}

vec3 oklabToLinear(vec3 c) {
	float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
	float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
	float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

	l = l * l * l;
	m = m * m * m;
	s = s * s * s;

	return vec3(
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
	);
}

vec3 oklabToLch(vec3 lab) {
	return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 lchToOklab(vec3 lch) {
	return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
	vec3 lch0 = oklabToLch(lab0);
	vec3 lch1 = oklabToLch(lab1);

	if (lch0.y < 0.05) lch0.z = lch1.z;
	if (lch1.y < 0.05) lch1.z = lch0.z;

	float dh = lch1.z - lch0.z;
	if (dh > 3.14159265) dh -= 6.28318530;
	if (dh < -3.14159265) dh += 6.28318530;

	return lchToOklab(vec3(
		mix(lch0.x, lch1.x, t),
		mix(lch0.y, lch1.y, t),
		lch0.z + dh * t
	));
}

vec3 getColor(int idx) {
	if (u_colors_length < 1) return vec3(0.0);
	int safeIdx = clamp(idx, 0, u_colors_length - 1);
	return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
	if (count < 1) return vec3(0.0);
	if (count < 2) return toLinear(getColor(0));

	float segmentSize = 1.0 / float(count - 1);
	t = clamp(t, 0.0, 1.0);
	int idx = min(int(floor(t / segmentSize)), count - 2);
	float localT = clamp((t - float(idx) * segmentSize) / segmentSize, 0.0, 1.0);

	vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
	vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));

	return oklabToLinear(mixLch(lab0, lab1, localT));
}

vec3 softGamutMap(vec3 linearRgb) {
	float maxC = max(linearRgb.r, max(linearRgb.g, linearRgb.b));
	float minC = min(linearRgb.r, min(linearRgb.g, linearRgb.b));

	if (minC >= 0.0 && maxC <= 1.0) return linearRgb;

	vec3 lab = linearToOklab(max(linearRgb, 0.0));
	float L = clamp(lab.x, 0.0, 1.0);
	float C = length(lab.yz);
	float h = atan(lab.z, lab.y);

	float maxChroma = 0.4 * (1.0 - pow(abs(2.0 * L - 1.0), 2.0));

	if (C > maxChroma * 0.7) {
		float knee = maxChroma * 0.7;
		C = knee + (maxChroma - knee) * tanh((C - knee) / (maxChroma - knee + 0.001));
	}

	return clamp(oklabToLinear(vec3(L, C * cos(h), C * sin(h))), 0.0, 1.0);
}

float blurDepth3x3(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float radius) {
	vec2 r = radius * texel;

	float sum = 4.0 * textureGrad(u_heightmap, uv, dudx, dudy).r;

	sum += 2.0 * textureGrad(u_heightmap, uv + vec2(0.0, -r.y), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_heightmap, uv + vec2(0.0, r.y), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_heightmap, uv + vec2(-r.x, 0.0), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_heightmap, uv + vec2(r.x, 0.0), dudx, dudy).r;

	sum += textureGrad(u_heightmap, uv + vec2(-r.x, -r.y), dudx, dudy).r;
	sum += textureGrad(u_heightmap, uv + vec2(r.x, -r.y), dudx, dudy).r;
	sum += textureGrad(u_heightmap, uv + vec2(-r.x, r.y), dudx, dudy).r;
	sum += textureGrad(u_heightmap, uv + vec2(r.x, r.y), dudx, dudy).r;

	return sum / 16.0;
}

vec2 heightGrad(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float blurRadius) {
	float eps = 4.0;
	float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
	float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
	float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
	float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
	return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

void main() {
	vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
	vec2 texSize = vec2(textureSize(u_heightmap, 0));
	float imgAspect = texSize.x / texSize.y;
	float canvasAspect = u_resolution.x / u_resolution.y;

	if (canvasAspect > imgAspect) {
		uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
	} else {
		uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
	}

	float aaScale = max(1.0, 2.0 / u_pixelRatio);

	vec2 dudx = dFdx(uv);
	vec2 dudy = dFdy(uv);

	vec4 hm = textureGrad(u_heightmap, uv, dudx, dudy);
	float fw_b = 0.5 * fwidth(hm.b) * aaScale;
	float hardMask = smoothstep(0.5 - fw_b, 0.5 + fw_b, hm.b);
	float opacity = hardMask * (1.0 - hm.g);

	float edgeDist;
	if (canvasAspect > imgAspect) {
		edgeDist = min(uv.x, 1.0 - uv.x);
	} else if (canvasAspect < imgAspect) {
		edgeDist = min(uv.y, 1.0 - uv.y);
	} else {
		edgeDist = 1.0;
	}
	opacity *= smoothstep(0.0, 1.0 * fwidth(edgeDist), edgeDist);

	if (opacity < 0.001) {
		fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
		return;
	}

	vec2 texel = 1.0 / texSize;
	int colorCount = u_colors_length;

	if (colorCount < 1) {
		fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
		return;
	}

	float rawDepth = blurDepth3x3(uv, dudx, dudy, texel, 6.0);
	float depth = max(rawDepth, 0.001);

	vec2 grad = heightGrad(uv, dudx, dudy, texel, 6.0);
	float gradMag = min(length(grad), 5.0);
	vec2 gradDir = gradMag > 0.001 ? normalize(grad) : vec2(0.0);
	vec2 contourDir = vec2(-gradDir.y, gradDir.x);

	float t = mod(u_time * u_speed, 3600.0);
	float isDirectional = step(0.5, u_motionMode);

	vec3 seedOffset = seedRandom(u_seed);
	vec3 seedOffset2 = seedRandom(u_seed + 100.0);
	float seedAngle = u_seed * GOLDEN_ANGLE;
	vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;

	vec2 p = (uv - 0.5) * 2.0;
	p.x *= imgAspect;

	float cs = cos(seedAngle);
	float sn = sin(seedAngle);
	p = mat2(cs, -sn, sn, cs) * p;

	float ang = u_angle * 3.14159 / 180.0;
	float cosA = cos(ang);
	float sinA = sin(ang);
	p = vec2(p.x * cosA - p.y * sinA, p.x * sinA + p.y * cosA);

	float tTurb = t * mix(1.0, 0.4, isDirectional);
	vec2 directionalOffset = vec2(1.0, 0.0) * t * 0.4 * isDirectional;

	float edgeProximity = 1.0 - smoothstep(0.0, 0.8, depth);
	float coordScale = max(0.4, 0.1 + depth * 1.0);
	p *= coordScale;

	p += contourDir * edgeProximity * u_bend * 2.0;
	p -= gradDir * edgeProximity * u_bend * 0.5;
	p *= max(0.5, mix(1.0, 0.4 + 0.6 * smoothstep(0.0, 0.5, depth), u_contour));

	int turbIter = int(u_turbIter);
	float freq = 1.0 / max(u_turbFreq, 0.01);

	vec2 q = p * u_scale + directionalOffset;
	float a = seedPhase.x;
	float d = seedPhase.y;

	for (int j = 2; j < 10; j++) {
		if (j >= turbIter) break;
		float fj = float(j);
		q += u_turbAmp * sin(length(q) / freq * fj + tTurb + vec2(a, d) + seedOffset.xy * fj) / fj;
		a += cos(fj + d * 1.2 + q.x * 2.0 - tTurb + seedOffset2.z);
		d += sin(fj * q.y + a + seedOffset.z + tTurb + seedOffset2.y);
	}

	float base = length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + seedOffset.x;
	float val = 0.5 + 0.125 * sin(base + 1.0) + 0.25 * sin(base + 4.0) + 0.125 * sin(base + 9.0);
	val = clamp((val - 0.3) / 0.4, 0.0, 1.0);

	float innerIntensity = smoothstep(0.0, 0.4, depth);
	float contourHeat = (1.0 - innerIntensity) * u_contour;
	val = mix(val, val * innerIntensity + contourHeat, 0.5 + 0.5 * u_contour);

	vec3 col = paletteN(val, colorCount);
	col = softGamutMap(col);
	col = toSrgb(col);

	col *= opacity;
	vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
	col = col + bgColor * (1.0 - opacity);
	float finalAlpha = opacity + u_colorBack.a * (1.0 - opacity);

	fragColor = vec4(col, finalAlpha);
}
`;

function normalizeHex(value: string): string {
	const trimmed = value.trim();
	if (/^#([0-9a-f]{3}|[0-9a-f]{4})$/i.test(trimmed)) {
		return `#${trimmed
			.slice(1)
			.split("")
			.map((char) => `${char}${char}`)
			.join("")}`;
	}

	if (/^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(trimmed)) {
		return trimmed;
	}

	return "#000000";
}

function hexToRgba(hex: string): [number, number, number, number] {
	const normalized = normalizeHex(hex).slice(1);

	if (normalized.length === 8) {
		return [
			parseInt(normalized.slice(0, 2), 16) / 255,
			parseInt(normalized.slice(2, 4), 16) / 255,
			parseInt(normalized.slice(4, 6), 16) / 255,
			parseInt(normalized.slice(6, 8), 16) / 255,
		];
	}

	return [
		parseInt(normalized.slice(0, 2), 16) / 255,
		parseInt(normalized.slice(2, 4), 16) / 255,
		parseInt(normalized.slice(4, 6), 16) / 255,
		1,
	];
}

function fillRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
) {
	const r = Math.min(radius, width / 2, height / 2);
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + width - r, y);
	ctx.arcTo(x + width, y, x + width, y + r, r);
	ctx.lineTo(x + width, y + height - r);
	ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
	ctx.lineTo(x + r, y + height);
	ctx.arcTo(x, y + height, x, y + height - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
	ctx.fill();
}

function createDefaultLogoSource(): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = 320;
	canvas.height = 480;

	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#ffffff";
	ctx.translate(canvas.width / 2, canvas.height / 2);
	ctx.rotate((-12 * Math.PI) / 180);

	const bars = [
		{ x: -118, y: -176, width: 58, height: 352 },
		{ x: -42, y: -138, width: 58, height: 276 },
		{ x: 34, y: -100, width: 58, height: 200 },
		{ x: 110, y: -62, width: 58, height: 124 },
	];

	for (const bar of bars) {
		fillRoundedRect(ctx, bar.x, bar.y, bar.width, bar.height, 26);
	}

	return canvas;
}

function getSourceSize(source: HTMLCanvasElement | HTMLImageElement) {
	if (source instanceof HTMLImageElement) {
		return {
			width: source.naturalWidth || source.width,
			height: source.naturalHeight || source.height,
		};
	}

	return {
		width: source.width,
		height: source.height,
	};
}

function createHeightmapTexture(source: HTMLCanvasElement | HTMLImageElement) {
	const { width: sourceWidth, height: sourceHeight } = getSourceSize(source);
	const scale = Math.min(1, MAX_TEXTURE_DIMENSION / Math.max(sourceWidth, sourceHeight));
	const width = Math.max(1, Math.round(sourceWidth * scale));
	const height = Math.max(1, Math.round(sourceHeight * scale));

	const sourceCanvas = document.createElement("canvas");
	sourceCanvas.width = width;
	sourceCanvas.height = height;

	const sourceContext = sourceCanvas.getContext("2d");
	if (!sourceContext) return sourceCanvas;

	sourceContext.clearRect(0, 0, width, height);
	sourceContext.drawImage(source, 0, 0, width, height);

	const sourceImage = sourceContext.getImageData(0, 0, width, height);
	const pixels = sourceImage.data;

	let transparentPixelCount = 0;
	for (let index = 3; index < pixels.length; index += 4) {
		if (pixels[index] < 250) {
			transparentPixelCount += 1;
		}
	}

	const useLuminanceMask = transparentPixelCount === 0;

	const maskCanvas = document.createElement("canvas");
	maskCanvas.width = width;
	maskCanvas.height = height;

	const maskContext = maskCanvas.getContext("2d");
	if (!maskContext) return sourceCanvas;

	const maskImage = maskContext.createImageData(width, height);

	for (let index = 0; index < pixels.length; index += 4) {
		const alpha = pixels[index + 3] / 255;
		const luminance =
			(0.2126 * pixels[index] + 0.7152 * pixels[index + 1] + 0.0722 * pixels[index + 2]) / 255;
		const maskValue = useLuminanceMask
			? Math.max(0, Math.min(1, (0.9 - luminance) / 0.9))
			: alpha;
		const maskByte = Math.round(maskValue * 255);

		maskImage.data[index] = 255;
		maskImage.data[index + 1] = 255;
		maskImage.data[index + 2] = 255;
		maskImage.data[index + 3] = maskByte;
	}

	maskContext.putImageData(maskImage, 0, 0);

	const blurCanvas = document.createElement("canvas");
	blurCanvas.width = width;
	blurCanvas.height = height;

	const blurContext = blurCanvas.getContext("2d");
	if (!blurContext) return maskCanvas;

	blurContext.clearRect(0, 0, width, height);
	blurContext.filter = `blur(${Math.max(10, Math.round(Math.min(width, height) * 0.04))}px)`;
	blurContext.drawImage(maskCanvas, 0, 0);
	blurContext.filter = "none";

	const blurredImage = blurContext.getImageData(0, 0, width, height);

	const heightmapCanvas = document.createElement("canvas");
	heightmapCanvas.width = width;
	heightmapCanvas.height = height;

	const heightmapContext = heightmapCanvas.getContext("2d");
	if (!heightmapContext) return maskCanvas;

	const heightmap = heightmapContext.createImageData(width, height);

	for (let index = 0; index < blurredImage.data.length; index += 4) {
		const depthByte = blurredImage.data[index + 3];
		const maskByte = maskImage.data[index + 3];

		heightmap.data[index] = depthByte;
		heightmap.data[index + 1] = 0;
		heightmap.data[index + 2] = maskByte;
		heightmap.data[index + 3] = 255;
	}

	heightmapContext.putImageData(heightmap, 0, 0);
	return heightmapCanvas;
}

function getPalette(colors?: readonly string[]) {
	const palette = (colors ?? LOGO_GRADIENT_DEFAULT_COLORS).slice(0, MAX_COLORS);
	return palette.length > 0 ? palette : [...LOGO_GRADIENT_DEFAULT_COLORS];
}

function buildUniformColorData(colors: readonly string[]) {
	const data = new Float32Array(MAX_COLORS * 4);
	const palette = colors.slice(0, MAX_COLORS);

	for (let index = 0; index < MAX_COLORS; index += 1) {
		const color = palette[index] ?? palette[palette.length - 1] ?? LOGO_GRADIENT_DEFAULT_COLORS[0];
		const [red, green, blue, alpha] = hexToRgba(color);
		const offset = index * 4;
		data[offset] = red;
		data[offset + 1] = green;
		data[offset + 2] = blue;
		data[offset + 3] = alpha;
	}

	return data;
}

export interface LogoGradientProps {
	className?: string;
	imageSrc?: string;
	colors?: readonly string[];
	colorBack?: string;
	seed?: number;
	speed?: number;
	motionMode?: number;
	angle?: number;
	scale?: number;
	turbAmp?: number;
	turbFreq?: number;
	turbIter?: number;
	waveFreq?: number;
	bend?: number;
	contour?: number;
}

export default function LogoGradient({
	className,
	imageSrc,
	colors = LOGO_GRADIENT_DEFAULT_COLORS,
	colorBack = LOGO_GRADIENT_DEFAULT_BACKGROUND,
	seed = 6,
	speed = 0.6,
	motionMode = 0,
	angle = 20,
	scale = 1.2,
	turbAmp = 0.21,
	turbFreq = 1.15,
	turbIter = 7,
	waveFreq = 2.4,
	bend = 0.24,
	contour = 0.8,
}: LogoGradientProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>(0);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const gl = canvas.getContext("webgl2", {
			alpha: true,
			antialias: false,
			premultipliedAlpha: false,
		});
		if (!gl) return;

		const compileShader = (type: number, source: string) => {
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
		};

		const vertexShader = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
		const fragmentShader = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
		if (!vertexShader || !fragmentShader) return;

		const program = gl.createProgram();
		if (!program) return;

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return;
		}

		gl.useProgram(program);

		const buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
			gl.STATIC_DRAW,
		);

		const positionLocation = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

		const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
		const timeLocation = gl.getUniformLocation(program, "u_time");
		const pixelRatioLocation = gl.getUniformLocation(program, "u_pixelRatio");
		const colorBackLocation = gl.getUniformLocation(program, "u_colorBack");
		const colorsLocation = gl.getUniformLocation(program, "u_colors[0]");
		const colorsLengthLocation = gl.getUniformLocation(program, "u_colors_length");
		const heightmapLocation = gl.getUniformLocation(program, "u_heightmap");

		gl.uniform1f(gl.getUniformLocation(program, "u_seed"), seed);
		gl.uniform1f(gl.getUniformLocation(program, "u_speed"), speed);
		gl.uniform1f(gl.getUniformLocation(program, "u_motionMode"), motionMode);
		gl.uniform1f(gl.getUniformLocation(program, "u_angle"), angle);
		gl.uniform1f(gl.getUniformLocation(program, "u_scale"), scale);
		gl.uniform1f(gl.getUniformLocation(program, "u_turbAmp"), turbAmp);
		gl.uniform1f(gl.getUniformLocation(program, "u_turbFreq"), turbFreq);
		gl.uniform1f(gl.getUniformLocation(program, "u_turbIter"), turbIter);
		gl.uniform1f(gl.getUniformLocation(program, "u_waveFreq"), waveFreq);
		gl.uniform1f(gl.getUniformLocation(program, "u_bend"), bend);
		gl.uniform1f(gl.getUniformLocation(program, "u_contour"), contour);

		const [backgroundRed, backgroundGreen, backgroundBlue, backgroundAlpha] = hexToRgba(colorBack);
		if (colorBackLocation) {
			gl.uniform4f(
				colorBackLocation,
				backgroundRed,
				backgroundGreen,
				backgroundBlue,
				backgroundAlpha,
			);
		}

		const palette = getPalette(colors);
		if (colorsLocation) {
			gl.uniform4fv(colorsLocation, buildUniformColorData(palette));
		}

		if (colorsLengthLocation) {
			gl.uniform1i(colorsLengthLocation, palette.length);
		}

		const heightmapTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

		if (heightmapLocation) {
			gl.uniform1i(heightmapLocation, 0);
		}

		const uploadHeightmap = (source: HTMLCanvasElement | HTMLImageElement) => {
			const heightmap = createHeightmapTexture(source);
			gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				heightmap,
			);
		};

		uploadHeightmap(createDefaultLogoSource());

		let cancelled = false;
		if (imageSrc) {
			const image = new Image();
			image.crossOrigin = "anonymous";
			image.onload = () => {
				if (cancelled) return;
				uploadHeightmap(image);
			};
			image.src = imageSrc;
		}

		const startTime = performance.now();
		const render = () => {
			const pixelRatio = window.devicePixelRatio || 1;
			const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
			const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}

			if (resolutionLocation) {
				gl.uniform2f(resolutionLocation, width, height);
			}

			if (timeLocation) {
				gl.uniform1f(timeLocation, (performance.now() - startTime) / 1000);
			}

			if (pixelRatioLocation) {
				gl.uniform1f(pixelRatioLocation, pixelRatio);
			}

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animationFrameRef.current = requestAnimationFrame(render);
		};

		animationFrameRef.current = requestAnimationFrame(render);

		return () => {
			cancelled = true;
			cancelAnimationFrame(animationFrameRef.current);
		};
	}, [
		angle,
		bend,
		colorBack,
		colors,
		contour,
		imageSrc,
		motionMode,
		scale,
		seed,
		speed,
		turbAmp,
		turbFreq,
		turbIter,
		waveFreq,
	]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ display: "block", height: "100%", width: "100%" }}
		/>
	);
}
