"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import {
	buildLogoGradientHeightmapPixels,
	createLogoGradientHeightmapCanvas,
	LOGO_GRADIENT_DEFAULT_IMAGE_SRC,
} from "./logo-gradient-heightmap";

const DEFAULT_LOGO_GLASS_IMAGE_SRC = LOGO_GRADIENT_DEFAULT_IMAGE_SRC;

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
precision highp sampler2D;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_pixelRatio;
uniform sampler2D u_image_heightmap;
uniform vec4 u_colorBack;
uniform vec4 u_colorA;
uniform vec4 u_colorB;
uniform vec4 u_colorHighlight;
uniform vec4 u_colorShadow;
uniform float u_seed;
uniform float u_speed;
uniform float u_scale;
uniform float u_motionMode;
uniform float u_direction;
uniform float u_octaves;
uniform float u_persistence;
uniform float u_lacunarity;
uniform float u_warpDepth;
uniform float u_warp;
uniform float u_ior;
uniform float u_dispersion;
uniform float u_contour;
uniform float u_falloff;
uniform float u_shapeContour;
uniform float u_bend;
uniform float u_noise;
uniform float u_bumpStrength;
uniform float u_bumpDist;
uniform float u_lightAngle;
uniform float u_ambient;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;

uint pcg(uint s) {
	s = s * 747796405u + 2891336453u;
	s = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
	return s ^ (s >> 22u);
}

float hashVal(vec2 p) {
	uvec2 q = uvec2(floatBitsToUint(p.x), floatBitsToUint(p.y));
	return float(pcg(q.x ^ pcg(q.y))) / float(0xFFFFFFFFu);
}

float valueNoise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	float a = hashVal(i);
	float b = hashVal(i + vec2(1.0, 0.0));
	float c = hashVal(i + vec2(0.0, 1.0));
	float d = hashVal(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p, float lac, int oct, float pers) {
	float v = 0.0;
	float a = 0.5;
	mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
	for (int i = 0; i < 6; i++) {
		if (i >= oct) {
			break;
		}
		v += a * valueNoise(p);
		p = rot * p * lac;
		a *= pers;
	}
	return v;
}

float warpedField(
	vec2 p,
	float t,
	float lac,
	int oct,
	float pers,
	float warpDepth,
	float mode,
	float dir,
	float seed
) {
	uint s = uint(seed);
	float sx = float(pcg(s)) / float(0xFFFFFFFFu);
	float sy = float(pcg(s + 73u)) / float(0xFFFFFFFFu);
	p += (vec2(sx, sy) - 0.5) * 200.0;

	if (mode < 0.5) {
		vec2 drift = vec2(t * 0.4, -t * 0.3);
		vec2 q = vec2(
			fbm(p + drift, lac, oct, pers),
			fbm(p + vec2(5.2, 1.3) + drift.yx, lac, oct, pers)
		);
		if (warpDepth < 1.5) {
			return fbm(p + q * 4.0, lac, oct, pers);
		}
		vec2 r = vec2(
			fbm(p + q * 4.0 + vec2(1.7, 9.2) + drift * 0.7, lac, oct, pers),
			fbm(p + q * 4.0 + vec2(8.3, 2.8) - drift * 0.5, lac, oct, pers)
		);
		return fbm(p + r * 4.0, lac, oct, pers);
	}

	if (mode < 1.5) {
		float a = dir * 3.14159 / 180.0;
		p += vec2(cos(a), sin(a)) * t * 0.6;
	} else {
		float ang = atan(p.y, p.x);
		float rad = length(p);
		p += vec2(cos(ang + t * 0.5), sin(ang + t * 0.5)) * rad * 0.4;
	}

	vec2 drift = vec2(t * 0.15, -t * 0.2);
	vec2 q = vec2(
		fbm(p + drift, lac, oct, pers),
		fbm(p + vec2(5.2, 1.3) + drift.yx, lac, oct, pers)
	);
	if (warpDepth < 1.5) {
		return fbm(p + q * 4.0, lac, oct, pers);
	}
	vec2 r = vec2(
		fbm(p + q * 4.0 + vec2(1.7, 9.2) + drift * 0.7, lac, oct, pers),
		fbm(p + q * 4.0 + vec2(8.3, 2.8) - drift * 0.5, lac, oct, pers)
	);
	return fbm(p + r * 4.0, lac, oct, pers);
}

float blurDepth3x3(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float radius) {
	vec2 r = radius * texel;

	float sum = 4.0 * textureGrad(u_image_heightmap, uv, dudx, dudy).r;

	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0, -r.y), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(0.0, r.y), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(-r.x, 0.0), dudx, dudy).r;
	sum += 2.0 * textureGrad(u_image_heightmap, uv + vec2(r.x, 0.0), dudx, dudy).r;

	sum += textureGrad(u_image_heightmap, uv + vec2(-r.x, -r.y), dudx, dudy).r;
	sum += textureGrad(u_image_heightmap, uv + vec2(r.x, -r.y), dudx, dudy).r;
	sum += textureGrad(u_image_heightmap, uv + vec2(-r.x, r.y), dudx, dudy).r;
	sum += textureGrad(u_image_heightmap, uv + vec2(r.x, r.y), dudx, dudy).r;

	return sum / 16.0;
}

vec2 heightGrad(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel) {
	float eps = 4.0;
	float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, 4.0);
	float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, 4.0);
	float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, 4.0);
	float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, 4.0);
	return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

void main() {
	vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
	vec2 texSize = vec2(textureSize(u_image_heightmap, 0));
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
	opacity *= smoothstep(0.0, 1.0 * fwidth(edgeDist), edgeDist);

	if (opacity < 0.001) {
		fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
		return;
	}

	vec2 texel = 1.0 / texSize;
	float t = mod(u_time * u_speed, 3600.0);

	float lac = u_lacunarity;
	int oct = int(u_octaves);
	float pers = u_persistence;
	float warpD = u_warpDepth;
	float mode = u_motionMode;
	float dir = u_direction;
	float seed = u_seed;

	float depth = max(blurDepth3x3(uv, dudx, dudy, texel, 6.0), 0.001);
	vec2 grad = heightGrad(uv, dudx, dudy, texel);
	float gradMag = min(length(grad), 5.0);
	vec2 gradDir = gradMag > 0.001 ? normalize(grad) : vec2(0.0);
	vec2 contourDir = vec2(-gradDir.y, gradDir.x);

	float boundaryFade = smoothstep(0.0, 0.05, depth);

	float falloffNorm = clamp(u_falloff / 20.0, 0.0, 1.0);
	float lensExp = mix(0.3, 3.0, falloffNorm);
	float lens = pow(clamp(depth, 0.0, 1.0), lensExp);
	float glass = smoothstep(0.0, 0.05, depth) * lens;

	float edgeShape = (1.0 - lens) * boundaryFade;
	float edgeFactor = smoothstep(0.0, 0.5, gradMag * u_contour * 2.0) * glass * boundaryFade;
	float contourMod = u_contour * boundaryFade;

	float lightAng = u_lightAngle * 3.14159 / 180.0;
	vec2 lightDir = vec2(cos(lightAng), sin(lightAng));

	vec2 p = (uv - 0.5) * 2.0;
	p.x *= imgAspect;
	p.y = -p.y;

	float edgeProximity = 1.0 - smoothstep(0.0, 0.8, depth);
	float innerIntensity = smoothstep(0.0, 0.4, depth);

	p += contourDir * edgeProximity * u_bend * 2.0;
	p -= gradDir * edgeProximity * u_bend * 0.5;
	p *= max(0.5, mix(1.0, 0.4 + 0.6 * smoothstep(0.0, 0.5, depth), u_shapeContour));

	float warpMix = glass * u_warp;
	float baseLens = sqrt(max(glass, 0.001) / 0.3);

	float iorBase = mix(1.2, 2.5, u_ior);
	float dispCoeff = u_dispersion * 0.2;
	float dispIntensity = u_dispersion * 3.0;
	vec3 wavelengths = vec3(0.65, 0.55, 0.45);

	float ns = u_scale * 3.0;

	vec2 noiseCoord = v_uv * u_resolution;
	uint grainHash = pcg(uint(noiseCoord.x) * 1933u ^ uint(noiseCoord.y) * 7919u);
	float grain = 1.0 + (float(grainHash) / float(0xFFFFFFFFu) - 0.5) * u_noise;

	vec3 vDispersed = vec3(0.0);

	for (int c = 0; c < 3; c++) {
		vec2 pp = p;

		float wl = wavelengths[c];
		float ior = iorBase + dispCoeff / (wl * wl);
		float iorMid = iorBase + dispCoeff / 0.3025;

		float lensScale = mix(1.0, ior / iorMid, edgeFactor);

		pp = mix(pp, pp * baseLens * lensScale, warpMix);
		pp *= max(0.35, 0.1 + (1.1 - edgeShape) * (1.0 - 0.5 * edgeShape));
		pp -= gradDir * edgeShape * contourMod * 2.0;
		pp *= max(0.5, mix(1.0, 1.0 - edgeShape, smoothstep(0.5, 1.0, contourMod)));

		vDispersed[c] = warpedField(pp * ns, t, lac, oct, pers, warpD, mode, dir, seed) * grain;
	}

	float contourHeat = (1.0 - innerIntensity) * u_shapeContour;
	for (int c = 0; c < 3; c++) {
		vDispersed[c] = mix(
			vDispersed[c],
			vDispersed[c] * innerIntensity + contourHeat,
			0.5 + 0.5 * u_shapeContour
		);
	}

	vec2 ppRef = p;
	ppRef = mix(ppRef, ppRef * baseLens, warpMix);
	ppRef *= max(0.35, 0.1 + (1.1 - edgeShape) * (1.0 - 0.5 * edgeShape));
	ppRef -= gradDir * edgeShape * contourMod * 2.0;
	ppRef *= max(0.5, mix(1.0, 1.0 - edgeShape, smoothstep(0.5, 1.0, contourMod)));

	float n = vDispersed.g;

	float eps = 0.8 / u_bumpDist;
	float nR = warpedField((ppRef + vec2(eps, 0.0)) * ns, t, lac, oct, pers, warpD, mode, dir, seed);
	float nU = warpedField((ppRef + vec2(0.0, eps)) * ns, t, lac, oct, pers, warpD, mode, dir, seed);
	vec2 fieldGrad = vec2(nR - n, nU - n) / eps;

	float diffuse = dot(fieldGrad, lightDir);
	float highlight = max(diffuse, 0.0);
	float shadow = max(-diffuse, 0.0);
	highlight = highlight * highlight * 0.15 + pow(highlight, 4.0) * 0.05;
	shadow = shadow * shadow * 0.1 + pow(shadow, 4.0) * 0.03;

	float nLift = mix(0.3, 1.0, n);
	float nSq = nLift * nLift;
	vec3 chromaDiff = vDispersed - n;

	vec3 hiCol = u_colorHighlight.rgb;
	vec3 shCol = u_colorShadow.rgb;

	float bumpFade = smoothstep(0.0, 1.0, depth);
	vec3 col = nSq * (
		hiCol * highlight * u_bumpStrength * bumpFade +
		shCol * shadow * u_bumpStrength * bumpFade +
		0.5
	);

	col += chromaDiff * dispIntensity * edgeFactor * 0.5;

	vec3 tintLo = u_colorA.rgb;
	vec3 tintHi = u_colorB.rgb;
	col = mix(tintLo, tintHi, col);

	col += u_ambient;
	col *= 2.0 * u_brightness;
	col = sqrt(max(col, 0.0));
	col = (col - 0.5) * u_contrast + 0.5;
	float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
	col = mix(vec3(lum), col, u_saturation);
	col = clamp(col, 0.0, 1.0);

	col *= opacity;
	vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
	col = col + bgColor * (1.0 - opacity);
	float finalAlpha = opacity + u_colorBack.a * (1.0 - opacity);

	fragColor = vec4(col, finalAlpha);
}
`;

function hexToRgba(color: string): [number, number, number, number] {
	const normalized = color.trim();
	if (/^#[0-9a-f]{3}$/i.test(normalized)) {
		const [r, g, b] = normalized.slice(1).split("");
		return [
			parseInt(`${r}${r}`, 16) / 255,
			parseInt(`${g}${g}`, 16) / 255,
			parseInt(`${b}${b}`, 16) / 255,
			1,
		];
	}
	if (/^#[0-9a-f]{4}$/i.test(normalized)) {
		const [r, g, b, a] = normalized.slice(1).split("");
		return [
			parseInt(`${r}${r}`, 16) / 255,
			parseInt(`${g}${g}`, 16) / 255,
			parseInt(`${b}${b}`, 16) / 255,
			parseInt(`${a}${a}`, 16) / 255,
		];
	}
	if (/^#[0-9a-f]{6}$/i.test(normalized)) {
		return [
			parseInt(normalized.slice(1, 3), 16) / 255,
			parseInt(normalized.slice(3, 5), 16) / 255,
			parseInt(normalized.slice(5, 7), 16) / 255,
			1,
		];
	}
	if (/^#[0-9a-f]{8}$/i.test(normalized)) {
		return [
			parseInt(normalized.slice(1, 3), 16) / 255,
			parseInt(normalized.slice(3, 5), 16) / 255,
			parseInt(normalized.slice(5, 7), 16) / 255,
			parseInt(normalized.slice(7, 9), 16) / 255,
		];
	}
	return [0, 0, 0, 1];
}

export interface LogoGlassProps {
	className?: string;
	imageSrc?: string;
	colorBack?: string;
	colorA?: string;
	colorB?: string;
	colorHighlight?: string;
	colorShadow?: string;
	seed?: number;
	speed?: number;
	scale?: number;
	motionMode?: 0 | 1;
	direction?: number;
	octaves?: number;
	persistence?: number;
	lacunarity?: number;
	warpDepth?: number;
	warp?: number;
	ior?: number;
	dispersion?: number;
	contour?: number;
	falloff?: number;
	shapeContour?: number;
	bend?: number;
	noise?: number;
	bumpStrength?: number;
	bumpDist?: number;
	lightAngle?: number;
	ambient?: number;
	brightness?: number;
	contrast?: number;
	saturation?: number;
}

export default function LogoGlass({
	className,
	imageSrc = DEFAULT_LOGO_GLASS_IMAGE_SRC,
	colorBack = "#000000",
	colorA = "#000000",
	colorB = "#C9C9C9",
	colorHighlight = "#FFFFFF",
	colorShadow = "#333333",
	seed = 55,
	speed = 1.15,
	scale = 0.19,
	motionMode = 0,
	direction = 0,
	octaves = 3,
	persistence = 0.6,
	lacunarity = 1.4,
	warpDepth = 2,
	warp = 0.5,
	ior = 0.5,
	dispersion = 0,
	contour = 0.05,
	falloff = 0,
	shapeContour = 0.7,
	bend = 0.65,
	noise = 0,
	bumpStrength = 0.7,
	bumpDist = 6,
	lightAngle = 200,
	ambient = 0,
	brightness = 0.8,
	contrast = 2.8,
	saturation = 1,
}: LogoGlassProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>(0);

	const propsRef = useRef({
		imageSrc,
		colorBack,
		colorA,
		colorB,
		colorHighlight,
		colorShadow,
		seed,
		speed,
		scale,
		motionMode,
		direction,
		octaves,
		persistence,
		lacunarity,
		warpDepth,
		warp,
		ior,
		dispersion,
		contour,
		falloff,
		shapeContour,
		bend,
		noise,
		bumpStrength,
		bumpDist,
		lightAngle,
		ambient,
		brightness,
		contrast,
		saturation,
	});

	useLayoutEffect(() => {
		propsRef.current = {
			imageSrc,
			colorBack,
			colorA,
			colorB,
			colorHighlight,
			colorShadow,
			seed,
			speed,
			scale,
			motionMode,
			direction,
			octaves,
			persistence,
			lacunarity,
			warpDepth,
			warp,
			ior,
			dispersion,
			contour,
			falloff,
			shapeContour,
			bend,
			noise,
			bumpStrength,
			bumpDist,
			lightAngle,
			ambient,
			brightness,
			contrast,
			saturation,
		};
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}

		const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
		if (!gl) {
			return;
		}

		const compileShader = (type: number, source: string) => {
			const shader = gl.createShader(type);
			if (!shader) {
				return null;
			}

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
		if (!vertexShader || !fragmentShader) {
			return;
		}

		const program = gl.createProgram();
		if (!program) {
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
			return;
		}

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
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

		const position = gl.getAttribLocation(program, "a_position");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

		const u = {
			resolution: gl.getUniformLocation(program, "u_resolution"),
			time: gl.getUniformLocation(program, "u_time"),
			pixelRatio: gl.getUniformLocation(program, "u_pixelRatio"),
			heightmap: gl.getUniformLocation(program, "u_image_heightmap"),
			colorBack: gl.getUniformLocation(program, "u_colorBack"),
			colorA: gl.getUniformLocation(program, "u_colorA"),
			colorB: gl.getUniformLocation(program, "u_colorB"),
			colorHighlight: gl.getUniformLocation(program, "u_colorHighlight"),
			colorShadow: gl.getUniformLocation(program, "u_colorShadow"),
			seed: gl.getUniformLocation(program, "u_seed"),
			speed: gl.getUniformLocation(program, "u_speed"),
			scale: gl.getUniformLocation(program, "u_scale"),
			motionMode: gl.getUniformLocation(program, "u_motionMode"),
			direction: gl.getUniformLocation(program, "u_direction"),
			octaves: gl.getUniformLocation(program, "u_octaves"),
			persistence: gl.getUniformLocation(program, "u_persistence"),
			lacunarity: gl.getUniformLocation(program, "u_lacunarity"),
			warpDepth: gl.getUniformLocation(program, "u_warpDepth"),
			warp: gl.getUniformLocation(program, "u_warp"),
			ior: gl.getUniformLocation(program, "u_ior"),
			dispersion: gl.getUniformLocation(program, "u_dispersion"),
			contour: gl.getUniformLocation(program, "u_contour"),
			falloff: gl.getUniformLocation(program, "u_falloff"),
			shapeContour: gl.getUniformLocation(program, "u_shapeContour"),
			bend: gl.getUniformLocation(program, "u_bend"),
			noise: gl.getUniformLocation(program, "u_noise"),
			bumpStrength: gl.getUniformLocation(program, "u_bumpStrength"),
			bumpDist: gl.getUniformLocation(program, "u_bumpDist"),
			lightAngle: gl.getUniformLocation(program, "u_lightAngle"),
			ambient: gl.getUniformLocation(program, "u_ambient"),
			brightness: gl.getUniformLocation(program, "u_brightness"),
			contrast: gl.getUniformLocation(program, "u_contrast"),
			saturation: gl.getUniformLocation(program, "u_saturation"),
		};

		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		if (u.heightmap) {
			gl.uniform1i(u.heightmap, 0);
		}

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

		const applyHeightmapTexture = (heightmap: HTMLCanvasElement | undefined) => {
			if (!heightmap) {
				return;
			}
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, heightmap);
		};

		let cancelled = false;
		let currentImageSrc: string | undefined;
		const loadHeightmap = (src: string | undefined) => {
			const resolved = src?.trim();
			if (!resolved) return;
			if (resolved === currentImageSrc) return;
			currentImageSrc = resolved;
			const image = new Image();
			image.crossOrigin = "anonymous";
			image.onload = () => {
				if (cancelled) return;
				if (currentImageSrc !== resolved) return;
				applyHeightmapTexture(createLogoGradientHeightmapCanvas(image));
			};
			image.src = resolved;
		};

		loadHeightmap(propsRef.current.imageSrc);

		let lastColorBack: string | undefined;
		let lastColorA: string | undefined;
		let lastColorB: string | undefined;
		let lastColorHighlight: string | undefined;
		let lastColorShadow: string | undefined;

		const start = performance.now();
		const render = () => {
			if (cancelled) return;
			const p = propsRef.current;

			loadHeightmap(p.imageSrc);

			const devicePixelRatio = window.devicePixelRatio || 1;
			const width = canvas.clientWidth * devicePixelRatio;
			const height = canvas.clientHeight * devicePixelRatio;

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}

			if (u.resolution) gl.uniform2f(u.resolution, width, height);
			if (u.time) gl.uniform1f(u.time, (performance.now() - start) / 1000);
			if (u.pixelRatio) gl.uniform1f(u.pixelRatio, devicePixelRatio);

			if (u.colorBack && p.colorBack !== lastColorBack) {
				const [r, g, b, a] = hexToRgba(p.colorBack);
				gl.uniform4f(u.colorBack, r, g, b, a);
				lastColorBack = p.colorBack;
			}
			if (u.colorA && p.colorA !== lastColorA) {
				const [r, g, b, a] = hexToRgba(p.colorA);
				gl.uniform4f(u.colorA, r, g, b, a);
				lastColorA = p.colorA;
			}
			if (u.colorB && p.colorB !== lastColorB) {
				const [r, g, b, a] = hexToRgba(p.colorB);
				gl.uniform4f(u.colorB, r, g, b, a);
				lastColorB = p.colorB;
			}
			if (u.colorHighlight && p.colorHighlight !== lastColorHighlight) {
				const [r, g, b, a] = hexToRgba(p.colorHighlight);
				gl.uniform4f(u.colorHighlight, r, g, b, a);
				lastColorHighlight = p.colorHighlight;
			}
			if (u.colorShadow && p.colorShadow !== lastColorShadow) {
				const [r, g, b, a] = hexToRgba(p.colorShadow);
				gl.uniform4f(u.colorShadow, r, g, b, a);
				lastColorShadow = p.colorShadow;
			}

			if (u.seed) gl.uniform1f(u.seed, p.seed);
			if (u.speed) gl.uniform1f(u.speed, p.speed);
			if (u.scale) gl.uniform1f(u.scale, p.scale);
			if (u.motionMode) gl.uniform1f(u.motionMode, p.motionMode);
			if (u.direction) gl.uniform1f(u.direction, p.direction);
			if (u.octaves) gl.uniform1f(u.octaves, p.octaves);
			if (u.persistence) gl.uniform1f(u.persistence, p.persistence);
			if (u.lacunarity) gl.uniform1f(u.lacunarity, p.lacunarity);
			if (u.warpDepth) gl.uniform1f(u.warpDepth, p.warpDepth);
			if (u.warp) gl.uniform1f(u.warp, p.warp);
			if (u.ior) gl.uniform1f(u.ior, p.ior);
			if (u.dispersion) gl.uniform1f(u.dispersion, p.dispersion);
			if (u.contour) gl.uniform1f(u.contour, p.contour);
			if (u.falloff) gl.uniform1f(u.falloff, p.falloff);
			if (u.shapeContour) gl.uniform1f(u.shapeContour, p.shapeContour);
			if (u.bend) gl.uniform1f(u.bend, p.bend);
			if (u.noise) gl.uniform1f(u.noise, p.noise);
			if (u.bumpStrength) gl.uniform1f(u.bumpStrength, p.bumpStrength);
			if (u.bumpDist) gl.uniform1f(u.bumpDist, Math.max(0.5, p.bumpDist));
			if (u.lightAngle) gl.uniform1f(u.lightAngle, p.lightAngle);
			if (u.ambient) gl.uniform1f(u.ambient, p.ambient);
			if (u.brightness) gl.uniform1f(u.brightness, p.brightness);
			if (u.contrast) gl.uniform1f(u.contrast, p.contrast);
			if (u.saturation) gl.uniform1f(u.saturation, p.saturation);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animationFrameRef.current = requestAnimationFrame(render);
		};

		animationFrameRef.current = requestAnimationFrame(render);

		return () => {
			cancelled = true;
			cancelAnimationFrame(animationFrameRef.current);
			gl.deleteTexture(texture);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
			gl.deleteShader(vertexShader);
			gl.deleteShader(fragmentShader);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ width: "100%", height: "100%", display: "block" }}
		/>
	);
}

export { DEFAULT_LOGO_GLASS_IMAGE_SRC };
