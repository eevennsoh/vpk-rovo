"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import {
	buildLogoGradientHeightmapPixels,
	createLogoGradientHeightmapCanvas,
	LOGO_GRADIENT_DEFAULT_IMAGE_SRC,
} from "./logo-gradient-heightmap";

export const LOGO_SPECTRUM_DEFAULT_BACKGROUND = "#000000";
export const LOGO_SPECTRUM_DEFAULT_BASE_COLOR = "#444444";

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

uniform vec4 u_colorBack;
uniform vec4 u_baseColor;
uniform float u_speed;
uniform float u_offset;
uniform float u_angle;
uniform float u_sweepSpeed;
uniform float u_glow;
uniform float u_bend;
uniform float u_edge;
uniform float u_contour;
uniform float u_density;
uniform float u_viscosity;
uniform float u_deflection;
uniform float u_distort;
uniform float u_noiseAmount;
uniform float u_distortSpeed;
uniform float u_noiseScale;
uniform float u_dispersion;
uniform float u_lineFade;
uniform float u_grain;
uniform float u_ambient;
uniform float u_saturation;
uniform float u_exposure;

const float DEG2RAD = 0.01745329;
const float TWO_PI = 6.28318530718;

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

vec2 heightGrad(vec2 uv, vec2 dudx, vec2 dudy, vec2 texel, float blurRadius) {
	float eps = 12.0;
	float dR = blurDepth3x3(uv + vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
	float dL = blurDepth3x3(uv - vec2(eps * texel.x, 0.0), dudx, dudy, texel, blurRadius);
	float dU = blurDepth3x3(uv + vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
	float dD = blurDepth3x3(uv - vec2(0.0, eps * texel.y), dudx, dudy, texel, blurRadius);
	return vec2(dR - dL, dU - dD) / (2.0 * eps * texel);
}

float hash21(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

mat3 getOrthogonalBasis(vec3 z) {
	z = normalize(z);
	vec3 up = abs(z.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
	vec3 x = normalize(cross(up, z));
	return mat3(x, cross(z, x), z);
}

vec3 cyclicNoise(vec3 p, float pump) {
	vec4 sum = vec4(0.0);
	mat3 basis = getOrthogonalBasis(vec3(-1.0, 2.0, -3.0));
	for (int i = 0; i < 5; i++) {
		p *= basis;
		p += sin(p.yzx);
		sum += vec4(cross(cos(p), sin(p.zxy)), 1.0);
		sum *= pump;
		p *= 2.0;
	}
	return sum.xyz / sum.w;
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

	vec2 scanUV = vec2(uv.x * imgAspect, 1.0 - uv.y);

	vec2 dudx = dFdx(uv);
	vec2 dudy = dFdy(uv);

	vec4 hm = textureGrad(u_image_heightmap, uv, dudx, dudy);
	float fw_b = 0.5 * fwidth(hm.b);
	float hardMask = smoothstep(0.5 - fw_b, 0.5 + fw_b, hm.b);
	float opacity = hardMask * (1.0 - hm.g);

	float edgeDist = canvasAspect > imgAspect
		? min(uv.x, 1.0 - uv.x)
		: min(uv.y, 1.0 - uv.y);
	opacity *= smoothstep(0.0, fwidth(edgeDist), edgeDist);

	if (opacity < 0.001) {
		fragColor = vec4(u_colorBack.rgb * u_colorBack.a, u_colorBack.a);
		return;
	}

	vec2 texel = 1.0 / texSize;
	float depth = max(blurDepth3x3(uv, dudx, dudy, texel, 6.0), 0.001);

	vec2 hGrad = heightGrad(uv, dudx, dudy, texel, 12.0);
	float gradMag = length(hGrad);
	vec2 gradDir = gradMag > 0.001 ? hGrad : vec2(0.0);
	vec2 contourDir = vec2(-gradDir.y, gradDir.x);

	float edgeProximity = 1.0 - smoothstep(0.0, u_edge, depth);

	float t = u_time * u_speed * 10.0;

	float angleRad = (u_angle + u_time * u_sweepSpeed * u_speed * 60.0) * DEG2RAD;
	vec2 scanDir = vec2(cos(angleRad), sin(angleRad));
	float scanBase = dot(scanUV, scanDir);

	float deflection = (depth - 0.5) * u_deflection * 0.06;

	float outerSoft = smoothstep(0.0, mix(0.001, 0.5, 2.0), depth);

	float bevelEnv = smoothstep(0.0, 0.55, edgeProximity);
	bevelEnv *= bevelEnv;
	bevelEnv *= outerSoft;
	float bevelOffset = dot(contourDir, scanDir) * bevelEnv * u_bend * 0.07 * 0.5
		- dot(gradDir, scanDir) * bevelEnv * u_bend * 0.025 * 0.5;

	float lineY = scanBase + deflection + bevelOffset + u_offset;

	float viscN = clamp(u_viscosity / 3.0, 0.0, 1.0);
	float lineWidthExp = mix(20.0, 1.0, viscN);
	float bloomWeight = mix(0.15, 0.7, viscN);
	float softExp = mix(2.4, 1.1, viscN);
	float densityPhase = u_density * 180.0;

	float phase = (lineY - t * 0.025) * densityPhase - 1.5707963;

	vec3 np = vec3(scanUV * u_noiseScale, u_time * 0.15 * u_distortSpeed);

	float sdClean = phase - TWO_PI * floor(phase / TWO_PI + 0.5);
	float peakClean = 0.5 + 0.5 * cos(sdClean);

	float noiseAmt = u_distort > 0.5 ? u_noiseAmount : 0.0;
	float dispAmpVal = u_distort > 0.5 ? u_dispersion : 0.0;

	float peakNoisy = 0.0;
	float peakNoisyWeight = 0.0;
	int SAMPLES = dispAmpVal > 0.001 ? 5 : 1;
	float dispAmp = dispAmpVal;

	for (int i = 0; i < 5; i++) {
		if (i >= SAMPLES) break;

		float eph = SAMPLES > 1 ? float(i) / float(SAMPLES - 1) : 0.0;
		float sqEph = eph * eph;

		vec3 npS = np + vec3(0.0, 0.0, -sqEph * dispAmp * 0.8);

		vec3 n3 = cyclicNoise(npS, 1.5);
		float n = dot(n3.xy, scanDir);

		float amp = 1.0 + dispAmp * sqEph * 0.6;
		float sdNoisy = sdClean + n * noiseAmt * amp * TWO_PI * 0.5;

		float w = mix(1.0, 1.0 - sqEph * 0.5, dispAmp);
		peakNoisy += (0.5 + 0.5 * cos(sdNoisy)) * w;
		peakNoisyWeight += w;
	}
	peakNoisy /= max(peakNoisyWeight, 0.001);

	float fadeRamp = smoothstep(0.0, 0.4, depth);
	float lineFade = mix(1.0, fadeRamp, clamp(u_lineFade, 0.0, 1.0));

	float line = pow(peakNoisy, lineWidthExp) * lineFade;
	float lineSoft = pow(peakNoisy, softExp) * lineFade;
	float lineGlow = pow(peakNoisy, 0.45) * lineFade;

	float coarseMod = mix(0.9, 1.1, 0.5 + 0.5 * sin(lineY * densityPhase * 0.08 + t * 0.4));

	float contourHeat = (1.0 - smoothstep(0.0, 0.25, depth)) * u_contour;

	vec3 tint = u_baseColor.rgb;
	float centerBoost = mix(0.75, 1.1, smoothstep(0.0, 0.35, depth));
	float floorGlow = 0.05 * smoothstep(0.0, 0.4, depth);

	float grain = hash21(v_uv * vec2(1920.0, 1080.0) + floor(t * 12.0));
	float grainMod = 1.0 + (grain - 0.5) * 2.0 * u_grain * 0.25;

	float bodyIntensity = (
		floorGlow
		+ (line + lineSoft * bloomWeight + lineGlow * u_glow * 0.35) * u_exposure
		+ contourHeat * 1.4
	) * centerBoost * coarseMod * grainMod;

	vec3 rimHot = vec3(contourHeat * line * u_exposure * 0.9);
	vec3 peakHighlight = vec3(smoothstep(0.7, 1.0, line) * u_glow * u_exposure * 0.6);

	vec3 bodyCol = tint * bodyIntensity + rimHot + peakHighlight;

	float luma = dot(bodyCol, vec3(0.2126, 0.7152, 0.0722));
	bodyCol = mix(vec3(luma), bodyCol, u_saturation);
	bodyCol += tint * u_ambient * depth;

	bodyCol = bodyCol / (1.0 + max(bodyCol - 1.0, 0.0));

	vec3 bgColor = u_colorBack.rgb * u_colorBack.a;
	float bgAlpha = u_colorBack.a;

	vec3 finalCol = bgColor * (1.0 - opacity) + bodyCol * opacity;
	float finalAlpha = bgAlpha + opacity * (1.0 - bgAlpha);

	fragColor = vec4(finalCol, finalAlpha);
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

export interface LogoSpectrumProps {
	className?: string;
	imageSrc?: string;
	colorBack?: string;
	baseColor?: string;
	speed?: number;
	offset?: number;
	angle?: number;
	sweepSpeed?: number;
	glow?: number;
	bend?: number;
	edge?: number;
	contour?: number;
	density?: number;
	viscosity?: number;
	deflection?: number;
	distort?: boolean;
	noiseAmount?: number;
	distortSpeed?: number;
	noiseScale?: number;
	dispersion?: number;
	lineFade?: number;
	grain?: number;
	ambient?: number;
	saturation?: number;
	exposure?: number;
}

export default function LogoSpectrum({
	className,
	imageSrc,
	colorBack = LOGO_SPECTRUM_DEFAULT_BACKGROUND,
	baseColor = LOGO_SPECTRUM_DEFAULT_BASE_COLOR,
	speed = 0.3,
	offset = 0.21,
	angle = 225,
	sweepSpeed = 0,
	glow = 0.7,
	bend = 0.34,
	edge = 1,
	contour = 1,
	density = 0.08,
	viscosity = 0.5,
	deflection = 3,
	distort = false,
	noiseAmount = 0.5,
	distortSpeed = 1,
	noiseScale = 1.5,
	dispersion = 0,
	lineFade = 0,
	grain = 0,
	ambient = 0,
	saturation = 1.2,
	exposure = 1.4,
}: LogoSpectrumProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationFrameRef = useRef<number>(0);

	const propsRef = useRef({
		imageSrc,
		colorBack,
		baseColor,
		speed,
		offset,
		angle,
		sweepSpeed,
		glow,
		bend,
		edge,
		contour,
		density,
		viscosity,
		deflection,
		distort,
		noiseAmount,
		distortSpeed,
		noiseScale,
		dispersion,
		lineFade,
		grain,
		ambient,
		saturation,
		exposure,
	});

	useLayoutEffect(() => {
		propsRef.current = {
			imageSrc,
			colorBack,
			baseColor,
			speed,
			offset,
			angle,
			sweepSpeed,
			glow,
			bend,
			edge,
			contour,
			density,
			viscosity,
			deflection,
			distort,
			noiseAmount,
			distortSpeed,
			noiseScale,
			dispersion,
			lineFade,
			grain,
			ambient,
			saturation,
			exposure,
		};
	});

	const reduced = useReducedMotion();
	const [inView, setInView] = useState(false);
	const [tabVisible, setTabVisible] = useState(
		typeof document === "undefined" ? true : document.visibilityState === "visible",
	);

	useEffect(() => {
		const el = canvasRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: "200px" },
		);
		io.observe(el);
		const onVis = () => setTabVisible(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", onVis);
		return () => {
			io.disconnect();
			document.removeEventListener("visibilitychange", onVis);
		};
	}, []);

	const shouldAnimate = !reduced && inView && tabVisible;

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (!shouldAnimate) return;

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
			colorBack: gl.getUniformLocation(program, "u_colorBack"),
			baseColor: gl.getUniformLocation(program, "u_baseColor"),
			speed: gl.getUniformLocation(program, "u_speed"),
			offset: gl.getUniformLocation(program, "u_offset"),
			angle: gl.getUniformLocation(program, "u_angle"),
			sweepSpeed: gl.getUniformLocation(program, "u_sweepSpeed"),
			glow: gl.getUniformLocation(program, "u_glow"),
			bend: gl.getUniformLocation(program, "u_bend"),
			edge: gl.getUniformLocation(program, "u_edge"),
			contour: gl.getUniformLocation(program, "u_contour"),
			density: gl.getUniformLocation(program, "u_density"),
			viscosity: gl.getUniformLocation(program, "u_viscosity"),
			deflection: gl.getUniformLocation(program, "u_deflection"),
			distort: gl.getUniformLocation(program, "u_distort"),
			noiseAmount: gl.getUniformLocation(program, "u_noiseAmount"),
			distortSpeed: gl.getUniformLocation(program, "u_distortSpeed"),
			noiseScale: gl.getUniformLocation(program, "u_noiseScale"),
			dispersion: gl.getUniformLocation(program, "u_dispersion"),
			lineFade: gl.getUniformLocation(program, "u_lineFade"),
			grain: gl.getUniformLocation(program, "u_grain"),
			ambient: gl.getUniformLocation(program, "u_ambient"),
			saturation: gl.getUniformLocation(program, "u_saturation"),
			exposure: gl.getUniformLocation(program, "u_exposure"),
		};

		const heightmapTexture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
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

		const uploadHeightmap = (source: HTMLCanvasElement | HTMLImageElement) => {
			const heightmap = createLogoGradientHeightmapCanvas(source);
			if (!heightmap) {
				return;
			}

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

		let cancelled = false;
		let currentImageSrc: string | undefined;
		const loadHeightmap = (src: string) => {
			if (src === currentImageSrc) return;
			currentImageSrc = src;
			const image = new Image();
			image.crossOrigin = "anonymous";
			image.onload = () => {
				if (cancelled) return;
				if (currentImageSrc !== src) return;
				uploadHeightmap(image);
			};
			image.src = src;
		};

		loadHeightmap(propsRef.current.imageSrc ?? LOGO_GRADIENT_DEFAULT_IMAGE_SRC);

		let lastColorBack: string | undefined;
		let lastBaseColor: string | undefined;

		const startTime = performance.now();
		const render = () => {
			if (cancelled) return;
			const p = propsRef.current;

			loadHeightmap(p.imageSrc ?? LOGO_GRADIENT_DEFAULT_IMAGE_SRC);

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

			if (u.colorBack && p.colorBack !== lastColorBack) {
				const [r, g, b, a] = hexToRgba(p.colorBack);
				gl.uniform4f(u.colorBack, r, g, b, a);
				lastColorBack = p.colorBack;
			}
			if (u.baseColor && p.baseColor !== lastBaseColor) {
				const [r, g, b, a] = hexToRgba(p.baseColor);
				gl.uniform4f(u.baseColor, r, g, b, a);
				lastBaseColor = p.baseColor;
			}

			if (u.speed) gl.uniform1f(u.speed, p.speed);
			if (u.offset) gl.uniform1f(u.offset, p.offset);
			if (u.angle) gl.uniform1f(u.angle, p.angle);
			if (u.sweepSpeed) gl.uniform1f(u.sweepSpeed, p.sweepSpeed);
			if (u.glow) gl.uniform1f(u.glow, p.glow);
			if (u.bend) gl.uniform1f(u.bend, p.bend);
			if (u.edge) gl.uniform1f(u.edge, p.edge);
			if (u.contour) gl.uniform1f(u.contour, p.contour);
			if (u.density) gl.uniform1f(u.density, p.density);
			if (u.viscosity) gl.uniform1f(u.viscosity, p.viscosity);
			if (u.deflection) gl.uniform1f(u.deflection, p.deflection);
			if (u.distort) gl.uniform1f(u.distort, p.distort ? 1 : 0);
			if (u.noiseAmount) gl.uniform1f(u.noiseAmount, p.noiseAmount);
			if (u.distortSpeed) gl.uniform1f(u.distortSpeed, p.distortSpeed);
			if (u.noiseScale) gl.uniform1f(u.noiseScale, p.noiseScale);
			if (u.dispersion) gl.uniform1f(u.dispersion, p.dispersion);
			if (u.lineFade) gl.uniform1f(u.lineFade, p.lineFade);
			if (u.grain) gl.uniform1f(u.grain, p.grain);
			if (u.ambient) gl.uniform1f(u.ambient, p.ambient);
			if (u.saturation) gl.uniform1f(u.saturation, p.saturation);
			if (u.exposure) gl.uniform1f(u.exposure, p.exposure);

			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			animationFrameRef.current = requestAnimationFrame(render);
		};

		animationFrameRef.current = requestAnimationFrame(render);

		return () => {
			cancelled = true;
			cancelAnimationFrame(animationFrameRef.current);
		};
	}, [shouldAnimate]);

	return (
		<canvas
			ref={canvasRef}
			className={className}
			style={{ display: "block", height: "100%", width: "100%" }}
		/>
	);
}
