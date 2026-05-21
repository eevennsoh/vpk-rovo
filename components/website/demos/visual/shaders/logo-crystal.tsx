"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import {
	buildLogoGradientHeightmapPixels,
	createLogoGradientHeightmapCanvas,
	LOGO_GRADIENT_DEFAULT_IMAGE_SRC,
} from "./logo-gradient-heightmap";

export const LOGO_CRYSTAL_DEFAULT_BACKGROUND = "#000000";

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
uniform sampler2D u_image_heightmap;
uniform sampler2D u_bgTexture;

uniform vec4 u_colorBack;
uniform float u_bgScale;
uniform float u_bgOffsetX;
uniform float u_bgOffsetY;
uniform float u_bgAngle;
uniform float u_bgWarp;
uniform float u_noiseSeed;
uniform float u_bgSpeed;
uniform float u_noiseScale;
uniform float u_bgSweep;
uniform float u_clipBackground;
uniform float u_falloff;
uniform float u_contour;
uniform float u_strength;
uniform float u_dispersion;
uniform float u_convex;
uniform float u_rimStrength;
uniform float u_borderStrength;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;

const float DEG2RAD = 0.01745329;
const float IOR_BASE = 1.5;
const vec3 BORDER_COLOR = vec3(1.0);

float hash21(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);

	float a = hash21(i);
	float b = hash21(i + vec2(1.0, 0.0));
	float c = hash21(i + vec2(0.0, 1.0));
	float d = hash21(i + vec2(1.0, 1.0));

	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
	float v = 0.0;
	float a = 0.5;
	mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
	for (int i = 0; i < 2; i++) {
		v += a * valueNoise(p);
		p = rot * p * 2.0;
		a *= 0.5;
	}
	return v;
}

float blurDepth3x3(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float radius) {
	vec2 r = radius * texel;
	float sum = 4.0 * textureGrad(u_image_heightmap, uv, dudx, dudy).r;
	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0, -r.y), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0,  r.y), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(-r.x, 0.0), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2( r.x, 0.0), dudx, dudy).r;
	sum += textureGrad(u_image_heightmap, uv + vec2(-r.x, -r.y), dudx, dudy).r;
	sum += textureGrad(u_image_heightmap, uv + vec2( r.x, -r.y), dudx, dudy).r;
	sum += textureGrad(u_image_heightmap, uv + vec2(-r.x,  r.y), dudx, dudy).r;
	sum += textureGrad(u_image_heightmap, uv + vec2( r.x,  r.y), dudx, dudy).r;
	return sum / 16.0;
}

vec2 heightGrad(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel) {
	float eps = 12.0;
	float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, 12.0);
	float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, 12.0);
	float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, 12.0);
	float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, 12.0);
	return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

void main() {
	vec2 res = u_resolution;
	vec2 fragCoord = gl_FragCoord.xy;

	vec2 screenUV = fragCoord / res;
	screenUV.y = 1.0 - screenUV.y;

	vec2 bgRes = vec2(textureSize(u_bgTexture, 0));
	vec2 bgRatio = res / bgRes;
	float bgMaxRatio = max(bgRatio.x, bgRatio.y);
	vec2 cover = bgRatio / bgMaxRatio;

	float scale = max(u_bgScale, 1.0);

	vec2 maxOff = max(vec2(0.0), 0.5 * (1.0 - cover / scale));
	vec2 offset = vec2(u_bgOffsetX, -u_bgOffsetY) * maxOff;

	vec2 centered = (screenUV - 0.5) * cover / scale - offset;

	float sweepPhase = mod(u_time * u_bgSweep * 0.02 * u_bgSpeed, 1.0) * 360.0;
	float rotAngle = (u_bgAngle + sweepPhase) * DEG2RAD;
	float cs = cos(rotAngle);
	float sn = sin(rotAngle);
	centered = mat2(cs, -sn, sn, cs) * centered;

	if (u_bgWarp > 0.001) {
		vec2 seedOffset = vec2(u_noiseSeed * 13.7, u_noiseSeed * 29.3);
		vec2 fbmCoord = centered * u_noiseScale + seedOffset;
		float t = mod(u_time, 3600.0) * u_bgSpeed;
		float fx = fbm(fbmCoord + vec2(t * 0.1, 0.0));
		float fy = fbm(fbmCoord + vec2(0.0, t * 0.13) + vec2(7.3, 11.7));
		centered += (vec2(fx, fy) - 0.5) * 0.04 * u_bgWarp;
	}

	vec2 bgUV = centered + 0.5;

	vec2 bgDudx = dFdx(bgUV);
	vec2 bgDudy = dFdy(bgUV);

	vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
	vec2 hmRes = vec2(textureSize(u_image_heightmap, 0));
	float imgAspect = hmRes.x / hmRes.y;
	float canvasAspect = res.x / res.y;

	if (canvasAspect > imgAspect) {
		uv.x = (uv.x - 0.5) * (canvasAspect / imgAspect) + 0.5;
	} else {
		uv.y = (uv.y - 0.5) * (imgAspect / canvasAspect) + 0.5;
	}

	float aaScale = max(1.0, 2.0 / u_pixelRatio);

	vec2 dudx = dFdx(uv);
	vec2 dudy = dFdy(uv);
	vec2 texel = 1.0 / hmRes;

	vec4 hm = textureGrad(u_image_heightmap, uv, dudx, dudy);
	float fw_b = fwidth(hm.b) / aaScale;
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
	opacity *= smoothstep(0.0, fwidth(edgeDist), edgeDist);

	bool clip = u_clipBackground > 0.5;

	if (opacity < 0.001) {
		vec3 outsideRGB;
		float outsideAlpha;
		if (clip) {
			outsideRGB = u_colorBack.rgb;
			outsideAlpha = u_colorBack.a;
		} else {
			outsideRGB = textureGrad(u_bgTexture, bgUV, bgDudx, bgDudy).rgb;
			outsideAlpha = 1.0;
		}
		fragColor = vec4(outsideRGB * outsideAlpha, outsideAlpha);
		return;
	}

	vec3 outsideRGB = clip ? u_colorBack.rgb : textureGrad(u_bgTexture, bgUV, bgDudx, bgDudy).rgb;
	float outsideAlpha = clip ? u_colorBack.a : 1.0;

	float depth = max(blurDepth3x3(uv, dudx, dudy, texel, 6.0), 0.001);

	vec2 grad = heightGrad(uv, dudx, dudy, texel);
	float gradMag = min(length(grad), 5.0);

	vec2 refractDir = gradMag > 0.001 ? grad : vec2(0.0);
	vec2 dispersionDir = gradMag > 0.001 ? grad / gradMag : vec2(0.0);

	float boundaryFade = smoothstep(0.0, 0.05, depth);

	float falloffNorm = clamp(u_falloff / 20.0, 0.0, 1.0);
	float lensExp = mix(0.3, 3.0, falloffNorm);
	float lens = pow(clamp(depth, 0.0, 1.0), lensExp);
	float edgeShape = (1.0 - lens) * boundaryFade;

	float outerSoft = smoothstep(0.0, mix(0.001, 0.5, 2.0), depth);
	edgeShape *= outerSoft;
	gradMag *= outerSoft;

	float contourMod = u_contour * 0.1 * boundaryFade;
	float dispersionGate = smoothstep(0.0, 0.5, gradMag * u_contour * 2.0) * boundaryFade;

	vec2 aspectComp = vec2(1.0 / canvasAspect, 1.0);
	float convexSign = u_convex > 0.5 ? 1.0 : -1.0;

	vec2 baseDelta = -convexSign * refractDir * edgeShape * contourMod * 2.0 * u_strength * aspectComp;

	vec3 refracted;
	if (u_dispersion <= 0.01) {
		refracted = textureGrad(u_bgTexture, bgUV + baseDelta, bgDudx, bgDudy).rgb;
	} else {
		vec3 wavelengths = vec3(0.65, 0.55, 0.45);
		float dispersionScaled = u_dispersion * 0.1;
		float iorMid = IOR_BASE + dispersionScaled / 0.3025;

		refracted = vec3(0.0);
		for (int c = 0; c < 3; c++) {
			float wl = wavelengths[c];
			float ior = IOR_BASE + dispersionScaled / (wl * wl);

			float channelOffset = (ior - iorMid) * 2.0 * dispersionGate * u_strength;
			vec2 sampleUV = bgUV + baseDelta + dispersionDir * channelOffset * aspectComp;

			refracted[c] = textureGrad(u_bgTexture, sampleUV, bgDudx, bgDudy)[c];
		}
	}

	float rim = smoothstep(0.2, 0.9, gradMag) * edgeShape;
	vec3 col = refracted * (1.0 + rim * u_rimStrength);

	float borderOuterFade = smoothstep(0.0, 0.15, depth);
	float innerIntensity = smoothstep(0.0, 0.6, depth);
	float borderBand = pow(1.0 - innerIntensity, 2.0) * borderOuterFade;

	vec2 outwardDir = gradMag > 0.001 ? -refractDir / gradMag : vec2(0.0);
	vec3 borderTint = textureGrad(u_bgTexture, bgUV + outwardDir * 0.05 * aspectComp, bgDudx, bgDudy).rgb;
	borderTint *= 4.0;
	col = mix(col, borderTint, borderBand * u_borderStrength);

	col *= u_brightness;
	col = (col - 0.5) * u_contrast + 0.5;
	float lum = dot(col, vec3(0.299, 0.587, 0.114));
	col = mix(vec3(lum), col, u_saturation);

	col = clamp(col, 0.0, 1.0);

	vec3 finalRGB = mix(outsideRGB, col, opacity);
	float finalA = mix(outsideAlpha, 1.0, opacity);
	fragColor = vec4(finalRGB * finalA / max(finalA, 0.0001), finalA);
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

function createDefaultBgCanvas(): HTMLCanvasElement | null {
	if (typeof document === "undefined") return null;
	const canvas = document.createElement("canvas");
	canvas.width = 512;
	canvas.height = 512;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;

	const gradient = ctx.createLinearGradient(0, 0, 512, 512);
	gradient.addColorStop(0, "#6F3AFF");
	gradient.addColorStop(0.35, "#FF4D9D");
	gradient.addColorStop(0.7, "#FFB547");
	gradient.addColorStop(1, "#3EE0FF");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 512, 512);

	ctx.globalCompositeOperation = "screen";
	for (let i = 0; i < 12; i++) {
		const x = (i * 137.5) % 512;
		const y = (i * 211.3) % 512;
		const r = 60 + (i % 4) * 25;
		const radial = ctx.createRadialGradient(x, y, 0, x, y, r);
		const hue = (i * 47) % 360;
		radial.addColorStop(0, `hsla(${hue}, 90%, 65%, 0.55)`);
		radial.addColorStop(1, "hsla(0, 0%, 0%, 0)");
		ctx.fillStyle = radial;
		ctx.fillRect(0, 0, 512, 512);
	}

	return canvas;
}

export interface LogoCrystalProps {
	className?: string;
	imageSrc?: string;
	bgTextureSrc?: string;
	colorBack?: string;
	bgScale?: number;
	bgOffsetX?: number;
	bgOffsetY?: number;
	bgAngle?: number;
	bgWarp?: number;
	noiseSeed?: number;
	bgSpeed?: number;
	noiseScale?: number;
	bgSweep?: number;
	clipBackground?: boolean;
	falloff?: number;
	contour?: number;
	strength?: number;
	dispersion?: number;
	convex?: boolean;
	rimStrength?: number;
	borderStrength?: number;
	brightness?: number;
	contrast?: number;
	saturation?: number;
}

export default function LogoCrystal({
	className,
	imageSrc,
	bgTextureSrc,
	colorBack = LOGO_CRYSTAL_DEFAULT_BACKGROUND,
	bgScale = 1.2,
	bgOffsetX = -0.2,
	bgOffsetY = 1,
	bgAngle = 0,
	bgWarp = 16,
	noiseSeed = 0,
	bgSpeed = 2,
	noiseScale = 0.5,
	bgSweep = 1,
	clipBackground = true,
	falloff = 3,
	contour = 0.5,
	strength = 0.3,
	dispersion = 0,
	convex = false,
	rimStrength = 2,
	borderStrength = 1,
	brightness = 1,
	contrast = 1,
	saturation = 1,
}: LogoCrystalProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>(0);

	const propsRef = useRef({
		colorBack,
		bgScale,
		bgOffsetX,
		bgOffsetY,
		bgAngle,
		bgWarp,
		noiseSeed,
		bgSpeed,
		noiseScale,
		bgSweep,
		clipBackground,
		falloff,
		contour,
		strength,
		dispersion,
		convex,
		rimStrength,
		borderStrength,
		brightness,
		contrast,
		saturation,
		imageSrc,
		bgTextureSrc,
	});

	useLayoutEffect(() => {
		propsRef.current = {
			colorBack,
			bgScale,
			bgOffsetX,
			bgOffsetY,
			bgAngle,
			bgWarp,
			noiseSeed,
			bgSpeed,
			noiseScale,
			bgSweep,
			clipBackground,
			falloff,
			contour,
			strength,
			dispersion,
			convex,
			rimStrength,
			borderStrength,
			brightness,
			contrast,
			saturation,
			imageSrc,
			bgTextureSrc,
		};
	});

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

		const u = {
			resolution: gl.getUniformLocation(program, "u_resolution"),
			time: gl.getUniformLocation(program, "u_time"),
			pixelRatio: gl.getUniformLocation(program, "u_pixelRatio"),
			heightmap: gl.getUniformLocation(program, "u_image_heightmap"),
			bgTexture: gl.getUniformLocation(program, "u_bgTexture"),
			colorBack: gl.getUniformLocation(program, "u_colorBack"),
			bgScale: gl.getUniformLocation(program, "u_bgScale"),
			bgOffsetX: gl.getUniformLocation(program, "u_bgOffsetX"),
			bgOffsetY: gl.getUniformLocation(program, "u_bgOffsetY"),
			bgAngle: gl.getUniformLocation(program, "u_bgAngle"),
			bgWarp: gl.getUniformLocation(program, "u_bgWarp"),
			noiseSeed: gl.getUniformLocation(program, "u_noiseSeed"),
			bgSpeed: gl.getUniformLocation(program, "u_bgSpeed"),
			noiseScale: gl.getUniformLocation(program, "u_noiseScale"),
			bgSweep: gl.getUniformLocation(program, "u_bgSweep"),
			clipBackground: gl.getUniformLocation(program, "u_clipBackground"),
			falloff: gl.getUniformLocation(program, "u_falloff"),
			contour: gl.getUniformLocation(program, "u_contour"),
			strength: gl.getUniformLocation(program, "u_strength"),
			dispersion: gl.getUniformLocation(program, "u_dispersion"),
			convex: gl.getUniformLocation(program, "u_convex"),
			rimStrength: gl.getUniformLocation(program, "u_rimStrength"),
			borderStrength: gl.getUniformLocation(program, "u_borderStrength"),
			brightness: gl.getUniformLocation(program, "u_brightness"),
			contrast: gl.getUniformLocation(program, "u_contrast"),
			saturation: gl.getUniformLocation(program, "u_saturation"),
		};

		const heightmapTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		if (u.heightmap) gl.uniform1i(u.heightmap, 0);

		const placeholderHeightmap = document.createElement("canvas");
		placeholderHeightmap.width = 1;
		placeholderHeightmap.height = 1;
		const placeholderContext = placeholderHeightmap.getContext("2d");
		if (placeholderContext) {
			const placeholderImage = placeholderContext.createImageData(1, 1);
			placeholderImage.data.set(
				buildLogoGradientHeightmapPixels(new Uint8Array([0]), 1, 1),
			);
			placeholderContext.putImageData(placeholderImage, 0, 0);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				placeholderHeightmap,
			);
		}

		const bgTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, bgTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		if (u.bgTexture) gl.uniform1i(u.bgTexture, 1);

		const defaultBg = createDefaultBgCanvas();
		if (defaultBg) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, defaultBg);
		}

		const uploadHeightmap = (source: HTMLCanvasElement | HTMLImageElement) => {
			const heightmap = createLogoGradientHeightmapCanvas(source);
			if (!heightmap) return;
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heightmap);
		};

		const uploadBgTexture = (source: HTMLImageElement) => {
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, bgTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
		};

		let cancelled = false;
		let currentHeightmapSrc: string | undefined = undefined;
		let currentBgTextureSrc: string | undefined = undefined;

		const loadHeightmap = (src: string) => {
			if (src === currentHeightmapSrc) return;
			currentHeightmapSrc = src;
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				if (cancelled || currentHeightmapSrc !== src) return;
				uploadHeightmap(img);
			};
			img.src = src;
		};

		const loadBgTexture = (src: string | undefined) => {
			if (src === currentBgTextureSrc) return;
			currentBgTextureSrc = src;
			if (!src) {
				const fallback = createDefaultBgCanvas();
				if (fallback) {
					gl.activeTexture(gl.TEXTURE1);
					gl.bindTexture(gl.TEXTURE_2D, bgTexture);
					gl.texImage2D(
						gl.TEXTURE_2D,
						0,
						gl.RGBA,
						gl.RGBA,
						gl.UNSIGNED_BYTE,
						fallback,
					);
				}
				return;
			}
			const img = new Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				if (cancelled || currentBgTextureSrc !== src) return;
				uploadBgTexture(img);
			};
			img.src = src;
		};

		loadHeightmap(propsRef.current.imageSrc ?? LOGO_GRADIENT_DEFAULT_IMAGE_SRC);
		loadBgTexture(propsRef.current.bgTextureSrc);

		const startTime = performance.now();
		const render = () => {
			if (cancelled) return;

			const p = propsRef.current;
			loadHeightmap(p.imageSrc ?? LOGO_GRADIENT_DEFAULT_IMAGE_SRC);
			loadBgTexture(p.bgTextureSrc);

			const pixelRatio = window.devicePixelRatio || 1;
			const width = Math.max(1, Math.round(canvas.clientWidth * pixelRatio));
			const height = Math.max(1, Math.round(canvas.clientHeight * pixelRatio));

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}

			if (u.resolution) gl.uniform2f(u.resolution, width, height);
			if (u.time) gl.uniform1f(u.time, (performance.now() - startTime) / 1000);
			if (u.pixelRatio) gl.uniform1f(u.pixelRatio, pixelRatio);

			if (u.bgScale) gl.uniform1f(u.bgScale, p.bgScale);
			if (u.bgOffsetX) gl.uniform1f(u.bgOffsetX, p.bgOffsetX);
			if (u.bgOffsetY) gl.uniform1f(u.bgOffsetY, p.bgOffsetY);
			if (u.bgAngle) gl.uniform1f(u.bgAngle, p.bgAngle);
			if (u.bgWarp) gl.uniform1f(u.bgWarp, p.bgWarp);
			if (u.noiseSeed) gl.uniform1f(u.noiseSeed, p.noiseSeed);
			if (u.bgSpeed) gl.uniform1f(u.bgSpeed, p.bgSpeed);
			if (u.noiseScale) gl.uniform1f(u.noiseScale, p.noiseScale);
			if (u.bgSweep) gl.uniform1f(u.bgSweep, p.bgSweep);
			if (u.clipBackground) gl.uniform1f(u.clipBackground, p.clipBackground ? 1 : 0);
			if (u.falloff) gl.uniform1f(u.falloff, p.falloff);
			if (u.contour) gl.uniform1f(u.contour, p.contour);
			if (u.strength) gl.uniform1f(u.strength, p.strength);
			if (u.dispersion) gl.uniform1f(u.dispersion, p.dispersion);
			if (u.convex) gl.uniform1f(u.convex, p.convex ? 1 : 0);
			if (u.rimStrength) gl.uniform1f(u.rimStrength, p.rimStrength);
			if (u.borderStrength) gl.uniform1f(u.borderStrength, p.borderStrength);
			if (u.brightness) gl.uniform1f(u.brightness, p.brightness);
			if (u.contrast) gl.uniform1f(u.contrast, p.contrast);
			if (u.saturation) gl.uniform1f(u.saturation, p.saturation);

			const [bgR, bgG, bgB, bgA] = hexToRgba(p.colorBack);
			if (u.colorBack) gl.uniform4f(u.colorBack, bgR, bgG, bgB, bgA);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animationFrameRef.current = requestAnimationFrame(render);
		};

		animationFrameRef.current = requestAnimationFrame(render);

		return () => {
			cancelled = true;
			cancelAnimationFrame(animationFrameRef.current);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ display: "block", height: "100%", width: "100%" }}
		/>
	);
}
