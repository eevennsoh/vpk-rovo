"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { JiraLinkingFrame } from "./field";
import {
	createJiraLinkingUniformBuffers,
	packJiraLinkingUniforms,
	resolveJiraLinkingSplitAxis,
	type JiraLinkingUniformBuffers,
} from "./uniforms";

/**
 * Retina is plenty for a soft metaball field, and the padded region can be
 * several hundred CSS px on a side while the pointer is moving every frame.
 */
const MAX_PIXEL_RATIO = 2;
/** Avatar images decode asynchronously into the caller's 2D atlas canvas. */
const ATLAS_WARMUP_MS = 1000;
const ATLAS_WARMUP_INTERVAL_MS = 100;
/** Kept well under the 0.04 ceiling; just enough to break OKLab banding. */
const FIELD_GRAIN = 0.028;

/**
 * Opacity the field settles to deep inside the landing shape.
 *
 * Low enough that a target the size of a whole card reads as a tint over its
 * own content rather than a lid on top of it, high enough that the shape still
 * announces itself as the thing being merged into.
 */
const TARGET_INTERIOR_ALPHA = 0.16;

/** Distance from the source-side blob over which that fade happens, in px. */
const TARGET_INTERIOR_FALLOFF_PX = 72;

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
uniform vec2 u_regionOrigin;
uniform float u_pixelRatio;
uniform int u_ballCount;
uniform vec2 u_ballCenter[8];
uniform vec2 u_ballHalf[8];
uniform float u_ballRadius[8];
uniform float u_ballShape[8];
uniform float u_ballAtlas[8];
uniform vec4 u_ballUvRect[8];
uniform vec3 u_ballTint[8];
uniform sampler2D u_atlas;
uniform float u_smoothness;
uniform vec2 u_velocity;
uniform float u_dispersion;
uniform float u_alpha;
uniform float u_grain;
uniform float u_time;
uniform int u_targetIndex;
uniform float u_targetAlpha;
uniform float u_targetFalloff;
uniform float u_tintStrength;

// WebGL2 needs a constant loop bound; u_ballCount breaks out of it early.
const int MAX_BALLS = 8;
// Widest chromatic split, in CSS px, reached at u_dispersion 1.
const float DISPERSION_MAX_PX = 9.0;

// iq's smooth-union: the neck between two blobs, not a blur of two shapes.
float opSmoothUnion(float d1, float d2, float k) {
	float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
	return mix(d2, d1, h) - k * h * (1.0 - h);
}

float sdCircle(vec2 p, float r) {
	return length(p) - r;
}

float sdRoundedBox(vec2 p, vec2 b, float r) {
	vec2 q = abs(p) - b + r;
	return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float ballDistance(int i, vec2 p) {
	vec2 off = p - u_ballCenter[i];
	vec2 halfExtent = u_ballHalf[i];
	// sdRoundedBox is only correct while the corner fits inside the box.
	float corner = min(u_ballRadius[i], min(halfExtent.x, halfExtent.y));
	return u_ballShape[i] > 0.5
		? sdRoundedBox(off, halfExtent, corner)
		: sdCircle(off, u_ballRadius[i]);
}

float fieldDistance(vec2 p) {
	float k = max(u_smoothness, 0.001);
	float d = 1e5;
	for (int i = 0; i < MAX_BALLS; i++) {
		if (i >= u_ballCount) break;
		d = opSmoothUnion(d, ballDistance(i, p), k);
	}
	return d;
}

/**
 * The same union with the landing shape left out.
 *
 * A target the size of a whole card would otherwise blanket the content it is
 * merging into. Measuring from the source side lets the field stay solid through
 * the neck and thin out across the target's interior, so the goo reads as
 * becoming the card's own backdrop rather than covering the card.
 */
float sourceFieldDistance(vec2 p) {
	float k = max(u_smoothness, 0.001);
	float d = 1e5;
	for (int i = 0; i < MAX_BALLS; i++) {
		if (i >= u_ballCount) break;
		if (i == u_targetIndex) continue;
		d = opSmoothUnion(d, ballDistance(i, p), k);
	}
	return d;
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

// Map p into the ball's local box, then into its cell of the avatar atlas.
vec2 ballUv(int i, vec2 p) {
	vec2 halfExtent = max(u_ballHalf[i], vec2(0.0001));
	vec2 local = clamp((p - u_ballCenter[i]) / halfExtent * 0.5 + 0.5, 0.0, 1.0);
	vec4 rect = u_ballUvRect[i];
	return rect.xy + local * rect.zw;
}

/**
 * Inverse-distance weighting in OKLab. Averaging two saturated hues in sRGB
 * drives the neck toward grey; OKLab keeps the marbling perceptually even.
 */
vec3 fieldInk(vec2 p) {
	vec3 lab = vec3(0.0);
	float weightSum = 0.0;

	for (int i = 0; i < MAX_BALLS; i++) {
		if (i >= u_ballCount) break;

		vec2 halfExtent = u_ballHalf[i];
		// Normalising by the ball's own girth plus the live neck width keeps
		// the weighting scale-free: each ball owns its core outright, and
		// neighbours only compete across the neck the union just opened.
		float scale = max(min(halfExtent.x, halfExtent.y) + u_smoothness, 1.0);
		vec2 n = (p - u_ballCenter[i]) / scale;
		float w = 1.0 / pow(dot(n, n) + 0.012, 1.6);

		// Sampled unconditionally: a texture fetch inside divergent control
		// flow has undefined derivatives in GLSL ES 3.00.
		vec4 cell = texture(u_atlas, ballUv(i, p));
		float textured = step(0.0, u_ballAtlas[i]) * cell.a;
		vec3 src = mix(u_ballTint[i], cell.rgb, textured);

		lab += linearToOklab(toLinear(src)) * w;
		weightSum += w;
	}

	return oklabToLinear(lab / max(weightSum, 1e-5));
}

/**
 * The field's colour, faded back toward plain surface as the source leaves the
 * seam. Ball 0 is always the source pill and always carries the surface tint,
 * so the neutral end of the mix is already on hand.
 */
vec3 fieldInkTinted(vec2 p) {
	return mix(toLinear(u_ballTint[0]), fieldInk(p), u_tintStrength);
}

float hash21(vec2 p) {
	return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
	// v_uv is GL-oriented; client space runs y-down. Ball centres are already
	// region-local (packJiraLinkingUniforms does the translation in f64, so
	// highp never has to difference two four-digit client coordinates).
	vec2 fragCoord = vec2(v_uv.x, 1.0 - v_uv.y) * u_resolution;
	vec2 p = fragCoord / max(u_pixelRatio, 0.0001);

	float d = fieldDistance(p);
	float aa = max(fwidth(d), 1e-5);

	// Exactly zero at rest: u_dispersion gates the split to nothing.
	vec2 direction = u_velocity / max(length(u_velocity), 1e-4);
	vec2 split = direction * (u_dispersion * DISPERSION_MAX_PX);

	float coverageR = 1.0 - smoothstep(-aa, aa, fieldDistance(p + split));
	float coverageG = 1.0 - smoothstep(-aa, aa, d);
	float coverageB = 1.0 - smoothstep(-aa, aa, fieldDistance(p - split));
	vec3 coverage = vec3(coverageR, coverageG, coverageB);

	float inside = max(coverageR, max(coverageG, coverageB));
	// One alpha carries the widest channel; the per-channel ratio paints the
	// prismatic rim. Identical channels collapse this to a plain silhouette.
	vec3 rgb = toSrgb(fieldInkTinted(p) * (coverage / max(inside, 1e-4)));

	// Grain is anchored in CLIENT space so it shimmers in place instead of
	// swimming sideways as the region slides along with the pointer.
	vec2 grainSeed = (p + u_regionOrigin) * u_pixelRatio;
	rgb += (hash21(grainSeed + u_time) - 0.5) * u_grain * inside;

	// Solid through the neck, thinning across the target's interior so the goo
	// becomes the target's own surface instead of hiding what sits on it.
	float interiorFade = 1.0;
	if (u_targetIndex >= 0) {
		interiorFade = mix(
			1.0,
			u_targetAlpha,
			smoothstep(0.0, max(u_targetFalloff, 1e-4), sourceFieldDistance(p))
		);
	}

	float alpha = clamp(inside * u_alpha * interiorFade, 0.0, 1.0);
	// Premultiplied output, matching the context's premultipliedAlpha: true.
	fragColor = vec4(clamp(rgb, 0.0, 1.0) * alpha, alpha);
}
`;

interface FusionUniforms {
	alpha: WebGLUniformLocation | null;
	atlas: WebGLUniformLocation | null;
	ballAtlas: WebGLUniformLocation | null;
	ballCenter: WebGLUniformLocation | null;
	ballCount: WebGLUniformLocation | null;
	ballHalf: WebGLUniformLocation | null;
	ballRadius: WebGLUniformLocation | null;
	ballShape: WebGLUniformLocation | null;
	ballTint: WebGLUniformLocation | null;
	ballUvRect: WebGLUniformLocation | null;
	dispersion: WebGLUniformLocation | null;
	grain: WebGLUniformLocation | null;
	pixelRatio: WebGLUniformLocation | null;
	regionOrigin: WebGLUniformLocation | null;
	resolution: WebGLUniformLocation | null;
	smoothness: WebGLUniformLocation | null;
	targetAlpha: WebGLUniformLocation | null;
	targetFalloff: WebGLUniformLocation | null;
	targetIndex: WebGLUniformLocation | null;
	time: WebGLUniformLocation | null;
	tintStrength: WebGLUniformLocation | null;
	velocity: WebGLUniformLocation | null;
}

interface FusionPipeline {
	buffer: WebGLBuffer;
	fragmentShader: WebGLShader;
	program: WebGLProgram;
	texture: WebGLTexture;
	uniforms: FusionUniforms;
	vertexShader: WebGLShader;
}

function compileShader(
	gl: WebGL2RenderingContext,
	type: number,
	source: string,
): WebGLShader | null {
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

/**
 * Every GL object the renderer owns comes out of here, so the
 * `webglcontextrestored` handler can rebuild the whole graph in one call.
 */
function buildFusionPipeline(gl: WebGL2RenderingContext): FusionPipeline | null {
	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	if (!vertexShader || !fragmentShader) {
		if (vertexShader) gl.deleteShader(vertexShader);
		if (fragmentShader) gl.deleteShader(fragmentShader);
		return null;
	}

	const program = gl.createProgram();
	if (!program) {
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		console.error(gl.getProgramInfoLog(program));
		gl.deleteProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}
	gl.useProgram(program);

	const buffer = gl.createBuffer();
	const texture = gl.createTexture();
	if (!buffer || !texture) {
		if (buffer) gl.deleteBuffer(buffer);
		if (texture) gl.deleteTexture(texture);
		gl.deleteProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);
		return null;
	}

	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
		gl.STATIC_DRAW,
	);

	const position = gl.getAttribLocation(program, "a_position");
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	// Array uniforms are addressed by their first element.
	const uniforms: FusionUniforms = {
		alpha: gl.getUniformLocation(program, "u_alpha"),
		atlas: gl.getUniformLocation(program, "u_atlas"),
		ballAtlas: gl.getUniformLocation(program, "u_ballAtlas[0]"),
		ballCenter: gl.getUniformLocation(program, "u_ballCenter[0]"),
		ballCount: gl.getUniformLocation(program, "u_ballCount"),
		ballHalf: gl.getUniformLocation(program, "u_ballHalf[0]"),
		ballRadius: gl.getUniformLocation(program, "u_ballRadius[0]"),
		ballShape: gl.getUniformLocation(program, "u_ballShape[0]"),
		ballTint: gl.getUniformLocation(program, "u_ballTint[0]"),
		ballUvRect: gl.getUniformLocation(program, "u_ballUvRect[0]"),
		dispersion: gl.getUniformLocation(program, "u_dispersion"),
		grain: gl.getUniformLocation(program, "u_grain"),
		pixelRatio: gl.getUniformLocation(program, "u_pixelRatio"),
		regionOrigin: gl.getUniformLocation(program, "u_regionOrigin"),
		resolution: gl.getUniformLocation(program, "u_resolution"),
		smoothness: gl.getUniformLocation(program, "u_smoothness"),
		targetAlpha: gl.getUniformLocation(program, "u_targetAlpha"),
		targetFalloff: gl.getUniformLocation(program, "u_targetFalloff"),
		targetIndex: gl.getUniformLocation(program, "u_targetIndex"),
		time: gl.getUniformLocation(program, "u_time"),
		tintStrength: gl.getUniformLocation(program, "u_tintStrength"),
		velocity: gl.getUniformLocation(program, "u_velocity"),
	};

	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	// A transparent stand-in until an atlas arrives; alpha 0 selects the tint.
	gl.texImage2D(
		gl.TEXTURE_2D,
		0,
		gl.RGBA,
		1,
		1,
		0,
		gl.RGBA,
		gl.UNSIGNED_BYTE,
		new Uint8Array([0, 0, 0, 0]),
	);
	if (uniforms.atlas) gl.uniform1i(uniforms.atlas, 0);
	if (uniforms.grain) gl.uniform1f(uniforms.grain, FIELD_GRAIN);
	if (uniforms.targetAlpha) gl.uniform1f(uniforms.targetAlpha, TARGET_INTERIOR_ALPHA);
	if (uniforms.targetFalloff) {
		gl.uniform1f(uniforms.targetFalloff, TARGET_INTERIOR_FALLOFF_PX);
	}

	gl.enable(gl.BLEND);
	gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.clearColor(0, 0, 0, 0);

	return { buffer, fragmentShader, program, texture, uniforms, vertexShader };
}

function disposeFusionPipeline(gl: WebGL2RenderingContext, pipeline: FusionPipeline) {
	gl.deleteTexture(pipeline.texture);
	gl.deleteBuffer(pipeline.buffer);
	gl.deleteProgram(pipeline.program);
	gl.deleteShader(pipeline.vertexShader);
	gl.deleteShader(pipeline.fragmentShader);
}

function uploadUniforms(
	gl: WebGL2RenderingContext,
	uniforms: FusionUniforms,
	buffers: JiraLinkingUniformBuffers,
	ballCount: number,
) {
	if (uniforms.ballCount) gl.uniform1i(uniforms.ballCount, ballCount);
	if (uniforms.ballCenter) gl.uniform2fv(uniforms.ballCenter, buffers.center);
	if (uniforms.ballHalf) gl.uniform2fv(uniforms.ballHalf, buffers.half);
	if (uniforms.ballRadius) gl.uniform1fv(uniforms.ballRadius, buffers.radius);
	if (uniforms.ballShape) gl.uniform1fv(uniforms.ballShape, buffers.shape);
	if (uniforms.ballAtlas) gl.uniform1fv(uniforms.ballAtlas, buffers.atlas);
	if (uniforms.ballUvRect) gl.uniform4fv(uniforms.ballUvRect, buffers.uvRect);
	if (uniforms.ballTint) gl.uniform3fv(uniforms.ballTint, buffers.tint);
}

export interface JiraLinkingCanvasProps {
	/** Live field for this frame, in client coordinates. */
	frame: JiraLinkingFrame;
	/** Horizontal strip of square avatar cells, or null while none exist. */
	atlas: HTMLCanvasElement | null;
	/** How many cells `atlas` actually holds. */
	atlasCells: number;
	/**
	 * Chip velocity in px/frame. `frame` folds velocity into `dispersion` and
	 * does not echo the vector, so pass the same value handed to
	 * `resolveJiraLinkingFrame` to aim the chromatic split. Omitting it falls
	 * back to the chip-to-dock axis.
	 */
	velocity?: Readonly<{ x: number; y: number }> | null;
}

/**
 * Raw WebGL2 renderer for the session fusion field.
 *
 * Owns the context, one full-quad program, the avatar atlas texture, and the
 * RAF loop. `frame` changes on every pointer move, so it is mirrored through a
 * ref rather than the effect's dependency list — relinking the program 60
 * times a second would jank the drag it is supposed to make feel good.
 */
export function JiraLinkingCanvas({
	atlas,
	atlasCells,
	frame,
	velocity = null,
}: Readonly<JiraLinkingCanvasProps>) {
	const prefersReducedMotion = useReducedMotion() === true;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const propsRef = useRef({ atlas, atlasCells, frame, velocity });
	const [isSupported, setIsSupported] = useState(true);

	useLayoutEffect(() => {
		propsRef.current = { atlas, atlasCells, frame, velocity };
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || prefersReducedMotion) return;

		const gl = canvas.getContext("webgl2", {
			alpha: true,
			antialias: false,
			premultipliedAlpha: true,
		});
		if (!gl) {
			setIsSupported(false);
			return;
		}

		let pipeline = buildFusionPipeline(gl);
		if (!pipeline) {
			gl.getExtension("WEBGL_lose_context")?.loseContext();
			setIsSupported(false);
			return;
		}

		const uniformBuffers = createJiraLinkingUniformBuffers();
		const start = performance.now();
		let animationFrame = 0;
		let cancelled = false;
		let atlasSource: HTMLCanvasElement | null = null;
		let atlasFirstSeen = 0;
		let atlasUploadedAt = -1;

		const syncAtlas = (active: FusionPipeline, source: HTMLCanvasElement | null, now: number) => {
			if (source !== atlasSource) {
				atlasSource = source;
				atlasFirstSeen = now;
				atlasUploadedAt = -1;
			}
			if (!source || source.width < 1 || source.height < 1) return;

			// A 2D canvas mutated in place as avatars decode gives no change
			// signal, so re-upload on a throttled schedule for the first second.
			const isFirstUpload = atlasUploadedAt < 0;
			const isWarmingUp = now - atlasFirstSeen < ATLAS_WARMUP_MS
				&& now - atlasUploadedAt >= ATLAS_WARMUP_INTERVAL_MS;
			if (!isFirstUpload && !isWarmingUp) return;

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, active.texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
			atlasUploadedAt = now;
		};

		const render = () => {
			if (cancelled) return;
			const active = pipeline;
			if (!active) return;

			const live = propsRef.current;
			const { region } = live.frame;
			const now = performance.now();

			const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
			const width = Math.max(1, Math.round(region.width * ratio));
			const height = Math.max(1, Math.round(region.height * ratio));
			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}

			syncAtlas(active, live.atlas, now);

			const ballCount = packJiraLinkingUniforms(
				uniformBuffers,
				live.frame,
				live.atlasCells,
			);
			const { uniforms } = active;

			gl.clear(gl.COLOR_BUFFER_BIT);
			if (ballCount > 0 && live.frame.alpha > 0 && region.width > 0 && region.height > 0) {
				if (uniforms.resolution) gl.uniform2f(uniforms.resolution, width, height);
				if (uniforms.regionOrigin) gl.uniform2f(uniforms.regionOrigin, region.left, region.top);
				if (uniforms.pixelRatio) gl.uniform1f(uniforms.pixelRatio, ratio);
				if (uniforms.time) gl.uniform1f(uniforms.time, (now - start) / 1000);
				if (uniforms.smoothness) gl.uniform1f(uniforms.smoothness, live.frame.smoothness);
				if (uniforms.dispersion) gl.uniform1f(uniforms.dispersion, live.frame.dispersion);
				if (uniforms.alpha) gl.uniform1f(uniforms.alpha, live.frame.alpha);
				if (uniforms.targetIndex) {
					gl.uniform1i(uniforms.targetIndex, live.frame.targetIndex);
				}
				if (uniforms.tintStrength) {
					gl.uniform1f(uniforms.tintStrength, live.frame.tintStrength);
				}
				if (uniforms.velocity) {
					const [axisX, axisY] = resolveJiraLinkingSplitAxis(live.frame, live.velocity);
					gl.uniform2f(uniforms.velocity, axisX, axisY);
				}
				uploadUniforms(gl, uniforms, uniformBuffers, ballCount);
				gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
			}

			animationFrame = requestAnimationFrame(render);
		};

		// preventDefault is what makes the browser fire "webglcontextrestored".
		const handleContextLost = (event: Event) => {
			event.preventDefault();
			cancelAnimationFrame(animationFrame);
			pipeline = null;
			atlasSource = null;
			atlasUploadedAt = -1;
		};

		const handleContextRestored = () => {
			if (cancelled) return;
			pipeline = buildFusionPipeline(gl);
			if (!pipeline) {
				setIsSupported(false);
				return;
			}
			gl.viewport(0, 0, canvas.width, canvas.height);
			animationFrame = requestAnimationFrame(render);
		};

		canvas.addEventListener("webglcontextlost", handleContextLost, false);
		canvas.addEventListener("webglcontextrestored", handleContextRestored, false);
		animationFrame = requestAnimationFrame(render);

		return () => {
			cancelled = true;
			cancelAnimationFrame(animationFrame);
			canvas.removeEventListener("webglcontextlost", handleContextLost, false);
			canvas.removeEventListener("webglcontextrestored", handleContextRestored, false);
			if (pipeline) disposeFusionPipeline(gl, pipeline);
			pipeline = null;
		};
	}, [prefersReducedMotion]);

	if (prefersReducedMotion || !isSupported) return null;

	return (
		<canvas
			aria-hidden="true"
			data-slot="jira-linking-canvas"
			ref={canvasRef}
			style={{
				display: "block",
				height: `${frame.region.height}px`,
				left: `${frame.region.left}px`,
				pointerEvents: "none",
				position: "absolute",
				top: `${frame.region.top}px`,
				width: `${frame.region.width}px`,
			}}
		/>
	);
}
