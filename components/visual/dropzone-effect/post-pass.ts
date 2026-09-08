/**
 * Everything that happens after the scene is drawn.
 *
 * The scene renders into a linear half-float target with 4x MSAA — MSAA is not
 * optional here, because the stickers are drawn with alpha-to-coverage rather
 * than blending, and without samples to resolve the die-cut edge turns into a
 * hard 1-bit stencil. The same target carries a depth texture, which is the
 * only reason the depth-of-field pass can tell a near sticker from a far one.
 *
 * From there: a soft-knee bright pass feeding two blurred mips, then one
 * fullscreen composite that does defocus, chromatic aberration, bloom,
 * vignette, ACES, sRGB and grain in a single dependent chain. One pass rather
 * than six means the HDR colour is only round-tripped through memory once.
 *
 * `EffectComposer` is deliberately not used: three of these passes need to read
 * depth and each other's mips at specific resolutions, and hand-rolling the
 * ping-pong is both shorter and more legible than teaching `Pass` about it.
 */

import * as THREE from "three";

import {
	BLOOM_INTENSITY,
	BLOOM_THRESHOLD,
	CHROMATIC_ABERRATION,
	DOF_FALLOFF,
	DOF_FOCUS_Z,
	DOF_MAX_COC,
	GRAIN_STRENGTH,
	VIGNETTE_STRENGTH,
} from "./tuning";

/**
 * Width of the soft knee below `BLOOM_THRESHOLD`, as a fraction of it. A hard
 * cut makes bloom pop on as a sticker's highlight crosses the threshold, which
 * on a slowly tumbling sticker reads as a flicker rather than a glint.
 */
const BLOOM_KNEE_FRACTION = 0.55;

/** Mip weights in the composite. The half-res mip carries the shape, the quarter the reach. */
const BLOOM_WEIGHT_HALF = 0.62;
const BLOOM_WEIGHT_QUARTER = 0.38;

const fullscreenVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const brightFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uSource;
/** Texel size of the *source*, so the box tap lands on real neighbours. */
uniform vec2 uTexel;
uniform float uThreshold;
uniform float uKnee;

varying vec2 vUv;

void main() {
	// A 4-tap box rather than a point sample: this pass halves the resolution,
	// and a point sample would let a single blown-out sticker pixel crawl
	// through the mip chain as a shimmering dot.
	vec3 c = texture2D(uSource, vUv + vec2(-uTexel.x, -uTexel.y)).rgb;
	c += texture2D(uSource, vUv + vec2(uTexel.x, -uTexel.y)).rgb;
	c += texture2D(uSource, vUv + vec2(-uTexel.x, uTexel.y)).rgb;
	c += texture2D(uSource, vUv + vec2(uTexel.x, uTexel.y)).rgb;
	c *= 0.25;

	float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));

	// Quadratic soft knee (the standard Karis curve): quadratic ramp inside the
	// knee, linear above it, so bloom fades in instead of switching on.
	float soft = clamp(luma - uThreshold + uKnee, 0.0, 2.0 * uKnee);
	soft = soft * soft / (4.0 * uKnee + 1e-5);
	float contribution = max(soft, luma - uThreshold) / max(luma, 1e-5);

	gl_FragColor = vec4(c * contribution, 1.0);
}
`;

const blurFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uSource;
/** One texel step of the *destination*, already carrying the axis. */
uniform vec2 uDirection;

varying vec2 vUv;

void main() {
	// Separable 9-tap gaussian, sigma = 2 texels, weights normalised to 1.
	vec3 c = texture2D(uSource, vUv).rgb * 0.2042;
	c += (texture2D(uSource, vUv + uDirection).rgb +
		texture2D(uSource, vUv - uDirection).rgb) * 0.1802;
	c += (texture2D(uSource, vUv + uDirection * 2.0).rgb +
		texture2D(uSource, vUv - uDirection * 2.0).rgb) * 0.1238;
	c += (texture2D(uSource, vUv + uDirection * 3.0).rgb +
		texture2D(uSource, vUv - uDirection * 3.0).rgb) * 0.0663;
	c += (texture2D(uSource, vUv + uDirection * 4.0).rgb +
		texture2D(uSource, vUv - uDirection * 4.0).rgb) * 0.0276;
	gl_FragColor = vec4(c, 1.0);
}
`;

const compositeFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uScene;
uniform sampler2D uDepth;
uniform sampler2D uBloomHalf;
uniform sampler2D uBloomQuarter;
/** Target size in device pixels. */
uniform vec2 uResolution;
/** Device pixels per CSS pixel; every px-denominated tuning value scales by it. */
uniform float uPixelRatio;
uniform float uNear;
uniform float uFar;
/** Camera world z. It looks down -Z, so worldZ = uCameraZ - viewDistance. */
uniform float uCameraZ;
uniform float uFocusZ;
uniform float uFalloff;
uniform float uMaxCoc;
uniform float uAberration;
uniform float uBloom;
uniform float uVignette;
uniform float uGrain;
uniform float uTime;

varying vec2 vUv;

/** Golden angle. Successive taps land in the largest remaining gap. */
const float GOLDEN_ANGLE = 2.39996323;
const int DOF_TAPS = 16;
const float DOF_TAPS_F = 16.0;

/** Hoskins' hash11-from-vec2. Cheap, and good enough for rotation and grain. */
float hash12(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * 0.1031);
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.x + p3.y) * p3.z);
}

/** World-space z of whatever is drawn at uv. */
float worldDepth(vec2 uv) {
	float raw = texture2D(uDepth, uv).x;
	float ndc = raw * 2.0 - 1.0;
	// Standard perspective un-project: window depth is 1/z-ish, not linear.
	float viewDistance = (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
	return uCameraZ - viewDistance;
}

/**
 * Circle of confusion at uv, in device pixels.
 *
 * Only geometry *nearer* than the focal plane defocuses. That is not physical —
 * a real lens blurs both sides — but the whole read of this piece is "near ones
 * large and soft, far ones small and crisp", and blurring the far half would
 * take the starfield and the distant stickers with it.
 */
float cocAt(vec2 uv) {
	float gap = worldDepth(uv) - uFocusZ;
	if (gap <= 0.0) {
		return 0.0;
	}
	return clamp(gap / uFalloff, 0.0, 1.0) * uMaxCoc * uPixelRatio;
}

/**
 * One scene sample with the lateral chromatic split applied. "ca" is computed
 * once per fragment from the *centre* uv, because aberration is a property of
 * where the pixel sits on the lens, not of where the defocus tap wandered to.
 */
vec3 fetchScene(vec2 uv, vec2 ca) {
	return vec3(
		texture2D(uScene, uv + ca).r,
		texture2D(uScene, uv).g,
		texture2D(uScene, uv - ca).b
	);
}

/** Defocus gather: a golden-angle spiral scaled by this fragment's own CoC. */
vec3 gatherDefocus(vec2 uv, vec2 ca) {
	vec3 sum = fetchScene(uv, ca);
	float centreCoc = cocAt(uv);
	// Below half a pixel there is nothing to gather, and the whole backdrop and
	// starfield land here — so the common case costs three fetches, not fifty.
	if (centreCoc < 0.5) {
		return sum;
	}

	vec2 texel = 1.0 / uResolution;
	// Per-pixel rotation turns the spiral's structured undersampling into
	// noise, which the grain pass then hides.
	float rotation = hash12(gl_FragCoord.xy) * 6.28318530718;
	float weight = 1.0;

	for (int i = 0; i < DOF_TAPS; i++) {
		float index = float(i) + 0.5;
		// sqrt keeps the taps area-uniform instead of clustering at the centre.
		float radius = sqrt(index / DOF_TAPS_F);
		float angle = index * GOLDEN_ANGLE + rotation;
		vec2 tapUv = uv + vec2(cos(angle), sin(angle)) * radius * centreCoc * texel;

		// Reject taps far sharper than the centre. Without this, a crisp
		// background sampled from inside a blurred foreground sticker bleeds
		// through it — the classic near-field halo.
		float w = smoothstep(centreCoc * 0.2, centreCoc * 0.7, cocAt(tapUv));
		sum += fetchScene(tapUv, ca) * w;
		weight += w;
	}

	return sum / weight;
}

/** Narkowicz's ACES filmic fit. The chrome stickers and the orb rim need it. */
vec3 tonemapAces(vec3 x) {
	return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

/**
 * The real piecewise sRGB transfer function, not pow(c, 1.0 / 2.2). The two
 * disagree most in the bottom 2 % of the range, which on a pure-black backdrop
 * is exactly where every pixel of this scene lives.
 */
vec3 encodeSrgb(vec3 c) {
	c = clamp(c, 0.0, 1.0);
	vec3 lo = c * 12.92;
	vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
	return mix(lo, hi, step(vec3(0.0031308), c));
}

void main() {
	vec2 centred = vUv - 0.5;

	// Radial split, scaled by r^2 so the middle of the frame stays clean and
	// only the corners fringe.
	float split = uAberration * uPixelRatio * dot(centred, centred);
	vec2 ca = centred * 2.0 * split / uResolution;

	vec3 colour = gatherDefocus(vUv, ca);

	colour += (texture2D(uBloomHalf, vUv).rgb * ${BLOOM_WEIGHT_HALF.toFixed(2)} +
		texture2D(uBloomQuarter, vUv).rgb * ${BLOOM_WEIGHT_QUARTER.toFixed(2)}) * uBloom;

	// Vignette in normalised radius: 0 at centre, 2 at the corners.
	float radiusSq = dot(centred, centred) * 4.0;
	colour *= 1.0 - uVignette * smoothstep(0.25, 1.35, radiusSq);

	colour = encodeSrgb(tonemapAces(colour));

	// Grain last, in display space, because its job is to dither the encoded
	// 8-bit output. Two hashes differenced give a triangular distribution,
	// which cancels the quantisation bias a uniform one leaves behind — and
	// banding in the near-black backdrop is the only artefact this pass exists
	// to fix, so the amplitude stays a fraction of a code value.
	vec2 jitter = vec2(fract(uTime * 12.9898), fract(uTime * 78.233)) * 511.0;
	float n1 = hash12(gl_FragCoord.xy + jitter);
	float n2 = hash12(gl_FragCoord.xy + jitter.yx + 19.19);
	colour += (n1 - n2) * uGrain;

	gl_FragColor = vec4(colour, 1.0);
}
`;

/** Live overrides for the composite pass. Unset keys keep their current value. */
export interface DropzonePostTuning {
	/** Multiplier on `BLOOM_INTENSITY`. 1 = the `tuning.ts` default. */
	bloom?: number;
	/** Overrides `DOF_MAX_COC`, in CSS pixels. */
	defocus?: number;
	/** Multiplier on `GRAIN_STRENGTH`. */
	grain?: number;
}

/** The post chain. Own it for the lifetime of the scene; it holds GPU memory. */
export interface DropzonePost {
	/** The MSAA HDR target the scene must render into. */
	readonly sceneTarget: THREE.WebGLRenderTarget;
	/** Renders `sceneTarget` through the effect chain to the default framebuffer. */
	render(renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, time: number): void;
	setSize(width: number, height: number, pixelRatio: number): void;
	setTuning(tuning: DropzonePostTuning): void;
	dispose(): void;
}

/** A half-float colour target with no mips — the shape every bloom level uses. */
function createBloomTarget(width: number, height: number): THREE.WebGLRenderTarget {
	return new THREE.WebGLRenderTarget(width, height, {
		type: THREE.HalfFloatType,
		colorSpace: THREE.LinearSRGBColorSpace,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		generateMipmaps: false,
		depthBuffer: false,
		stencilBuffer: false,
	});
}

/**
 * Builds the post-processing chain. `width` and `height` are CSS pixels;
 * `pixelRatio` converts them to the device resolution the targets allocate at.
 */
export function createDropzonePost(
	width: number,
	height: number,
	pixelRatio: number,
): DropzonePost {
	/** Device pixels, floored to at least one so a collapsed viewport is survivable. */
	const device = (css: number, ratio: number) => Math.max(1, Math.round(css * ratio));
	/** Mip size. Bit-shifted rather than divided, so the two levels never drift. */
	const mip = (full: number, level: number) => Math.max(1, full >> level);

	let fullWidth = device(width, pixelRatio);
	let fullHeight = device(height, pixelRatio);

	const depthTexture = new THREE.DepthTexture(
		fullWidth,
		fullHeight,
		THREE.UnsignedIntType,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		THREE.DepthFormat,
	);

	const sceneTarget = new THREE.WebGLRenderTarget(fullWidth, fullHeight, {
		type: THREE.HalfFloatType,
		colorSpace: THREE.LinearSRGBColorSpace,
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		generateMipmaps: false,
		stencilBuffer: false,
		depthTexture,
		// Alpha-to-coverage has nothing to resolve against without samples, so
		// this is a correctness requirement, not a quality knob.
		samples: 4,
	});

	const bloomHalfA = createBloomTarget(mip(fullWidth, 1), mip(fullHeight, 1));
	const bloomHalfB = createBloomTarget(mip(fullWidth, 1), mip(fullHeight, 1));
	const bloomQuarterA = createBloomTarget(mip(fullWidth, 2), mip(fullHeight, 2));
	const bloomQuarterB = createBloomTarget(mip(fullWidth, 2), mip(fullHeight, 2));

	// A fullscreen triangle, not a quad: one primitive, no diagonal seam, and
	// every fragment quad along the former diagonal stops being shaded twice.
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
	);
	geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));

	const passDefaults = { depthTest: false, depthWrite: false } as const;

	const brightMaterial = new THREE.ShaderMaterial({
		vertexShader: fullscreenVertexShader,
		fragmentShader: brightFragmentShader,
		uniforms: {
			uSource: { value: sceneTarget.texture },
			uTexel: { value: new THREE.Vector2(1 / fullWidth, 1 / fullHeight) },
			uThreshold: { value: BLOOM_THRESHOLD },
			uKnee: { value: BLOOM_THRESHOLD * BLOOM_KNEE_FRACTION },
		},
		...passDefaults,
	});

	// One blur material, driven four times. The passes are strictly sequential,
	// so mutating its uniforms between them is safe and saves three programs.
	const blurMaterial = new THREE.ShaderMaterial({
		vertexShader: fullscreenVertexShader,
		fragmentShader: blurFragmentShader,
		uniforms: {
			uSource: { value: null },
			uDirection: { value: new THREE.Vector2() },
		},
		...passDefaults,
	});

	const compositeMaterial = new THREE.ShaderMaterial({
		vertexShader: fullscreenVertexShader,
		fragmentShader: compositeFragmentShader,
		uniforms: {
			uScene: { value: sceneTarget.texture },
			uDepth: { value: depthTexture },
			uBloomHalf: { value: bloomHalfA.texture },
			uBloomQuarter: { value: bloomQuarterB.texture },
			uResolution: { value: new THREE.Vector2(fullWidth, fullHeight) },
			uPixelRatio: { value: pixelRatio },
			uNear: { value: 0.1 },
			uFar: { value: 1000 },
			uCameraZ: { value: 0 },
			uFocusZ: { value: DOF_FOCUS_Z },
			uFalloff: { value: DOF_FALLOFF },
			uMaxCoc: { value: DOF_MAX_COC },
			uAberration: { value: CHROMATIC_ABERRATION },
			uBloom: { value: BLOOM_INTENSITY },
			uVignette: { value: VIGNETTE_STRENGTH },
			uGrain: { value: GRAIN_STRENGTH },
			uTime: { value: 0 },
		},
		...passDefaults,
	});

	const quadScene = new THREE.Scene();
	const quad = new THREE.Mesh(geometry, compositeMaterial);
	// The triangle reaches outside the ortho box by design; culling would eat it.
	quad.frustumCulled = false;
	quadScene.add(quad);
	const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

	const blit = (
		renderer: THREE.WebGLRenderer,
		material: THREE.ShaderMaterial,
		target: THREE.WebGLRenderTarget | null,
	) => {
		quad.material = material;
		renderer.setRenderTarget(target);
		// Explicit, because the caller may have turned autoClear off for its
		// own multi-pass scene render.
		renderer.clear();
		renderer.render(quadScene, quadCamera);
	};

	const blur = (
		renderer: THREE.WebGLRenderer,
		source: THREE.Texture,
		target: THREE.WebGLRenderTarget,
		axis: "x" | "y",
	) => {
		blurMaterial.uniforms.uSource.value = source;
		// Steps are in *destination* texels, which is what makes the half ->
		// quarter hop a blur and a downsample in one pass.
		blurMaterial.uniforms.uDirection.value.set(
			axis === "x" ? 1 / target.width : 0,
			axis === "y" ? 1 / target.height : 0,
		);
		blit(renderer, blurMaterial, target);
	};

	return {
		sceneTarget,

		render(renderer, camera, time) {
			blit(renderer, brightMaterial, bloomHalfA);
			blur(renderer, bloomHalfA.texture, bloomHalfB, "x");
			blur(renderer, bloomHalfB.texture, bloomHalfA, "y");
			blur(renderer, bloomHalfA.texture, bloomQuarterA, "x");
			blur(renderer, bloomQuarterA.texture, bloomQuarterB, "y");

			const uniforms = compositeMaterial.uniforms;
			uniforms.uNear.value = camera.near;
			uniforms.uFar.value = camera.far;
			uniforms.uCameraZ.value = camera.position.z;
			uniforms.uTime.value = time;

			blit(renderer, compositeMaterial, null);
			renderer.setRenderTarget(null);
		},

		setSize(nextWidth, nextHeight, nextPixelRatio) {
			fullWidth = device(nextWidth, nextPixelRatio);
			fullHeight = device(nextHeight, nextPixelRatio);

			sceneTarget.setSize(fullWidth, fullHeight);
			// `RenderTarget.setSize` only walks its colour textures; the renderer
			// reallocates the depth texture, but only once its image dimensions
			// disagree with the target's.
			depthTexture.image.width = fullWidth;
			depthTexture.image.height = fullHeight;
			depthTexture.needsUpdate = true;

			bloomHalfA.setSize(mip(fullWidth, 1), mip(fullHeight, 1));
			bloomHalfB.setSize(mip(fullWidth, 1), mip(fullHeight, 1));
			bloomQuarterA.setSize(mip(fullWidth, 2), mip(fullHeight, 2));
			bloomQuarterB.setSize(mip(fullWidth, 2), mip(fullHeight, 2));

			brightMaterial.uniforms.uTexel.value.set(1 / fullWidth, 1 / fullHeight);
			compositeMaterial.uniforms.uResolution.value.set(fullWidth, fullHeight);
			compositeMaterial.uniforms.uPixelRatio.value = nextPixelRatio;
		},

		setTuning(tuning) {
			const uniforms = compositeMaterial.uniforms;
			if (tuning.bloom !== undefined) {
				uniforms.uBloom.value = BLOOM_INTENSITY * tuning.bloom;
			}
			if (tuning.defocus !== undefined) {
				uniforms.uMaxCoc.value = tuning.defocus;
			}
			if (tuning.grain !== undefined) {
				uniforms.uGrain.value = GRAIN_STRENGTH * tuning.grain;
			}
		},

		dispose() {
			sceneTarget.dispose();
			depthTexture.dispose();
			bloomHalfA.dispose();
			bloomHalfB.dispose();
			bloomQuarterA.dispose();
			bloomQuarterB.dispose();
			geometry.dispose();
			brightMaterial.dispose();
			blurMaterial.dispose();
			compositeMaterial.dispose();
		},
	};
}
