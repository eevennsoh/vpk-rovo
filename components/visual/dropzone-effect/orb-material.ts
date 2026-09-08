/**
 * The orb: the sink the whole river runs into.
 *
 * Drawn as a single screen-facing quad with everything — halo, glass body,
 * internal caustic, dichroic rim and the "+" glyph — resolved analytically in
 * one fragment shader. There is no render-target refraction: the reference's
 * Astro theme runs its lens at zero dispersion over a near-black starfield, so
 * the interior really is a flat glass grey, and a procedural orb matches it
 * exactly for the cost of one quad.
 *
 * Colours are sampled from the reference: body rgb(70,73,76) at the core
 * falling to rgb(60,60,63) at the base, halo peaking at rgb(38,39,54) just
 * outside the rim, and a rim that runs lavender at the crown through cool white
 * at the base to a dim cyan at the flanks.
 */

import * as THREE from "three";

import {
	COLOR_ORB_BODY,
	COLOR_ORB_BODY_LOW,
	COLOR_ORB_HALO,
	COLOR_RIM_BOTTOM,
	COLOR_RIM_SIDE,
	COLOR_RIM_TOP,
	ORB_HALO_REACH,
} from "./tuning";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uBody;
uniform vec3 uBodyLow;
uniform vec3 uHalo;
uniform vec3 uRimTop;
uniform vec3 uRimBottom;
uniform vec3 uRimSide;
/** Quad half-size in orb radii — the halo reach. */
uniform float uReach;
/** Orb radius in pixels, for pixel-accurate antialiasing. */
uniform float uRadiusPx;
uniform float uTime;
/** Ingestion energy, 0-1. Rises on every swallow and decays away. */
uniform float uFeed;
/**
 * 1 draws the glass disc, rim and glyph; 0 leaves only the halo and the
 * ingestion flare. Zero is what the Jira variant uses: there the drop well is
 * real DOM, and the shader's job is to light it, not to impersonate it.
 */

varying vec2 vUv;

const float TAU = 6.28318530718;

/** Signed distance to a plus sign with arm half-length L and half-thickness T. */
float plusSdf(vec2 p, float L, float T) {
	vec2 q = abs(p);
	return min(max(q.x - L, q.y - T), max(q.y - L, q.x - T));
}

void main() {
	// Quad space -> orb radii.
	vec2 p = (vUv - 0.5) * 2.0 * uReach;
	float r = length(p);
	float angle = atan(p.y, p.x);

	// One screen pixel, in orb-radius units. Everything antialiases against
	// this, so the rim stays a crisp hairline at any orb size.
	float px = 1.0 / uRadiusPx;

	// --- halo ---------------------------------------------------------------
	// A Gaussian skirt centred just outside the rim, exactly where the
	// reference glow peaks. Hollow in the middle, because the opaque disc
	// fills that. Emitted with zero alpha so it adds instead of covering.
	float haloBand = (r - 1.02) / (uReach - 1.0);
	float halo = exp(-haloBand * haloBand * 7.0) * smoothstep(0.0, 0.28, r);
	halo *= 1.0 - smoothstep(0.94, 1.0, r) * 0.35;
	vec3 colour = uHalo * halo * (1.0 + uFeed * 3.0);

	// --- body ---------------------------------------------------------------
	float disc = 1.0 - smoothstep(1.0 - px * 1.5, 1.0 + px * 1.5, r);
	if (disc > 0.001) {
		// Vertical grade: lighter through the upper half, settling darker at
		// the base. p.y is +1 at the crown.
		vec3 body = mix(uBodyLow, uBody, smoothstep(-1.0, 0.55, p.y));

		// A broad internal bloom, offset toward the upper left, so the glass
		// reads as a volume rather than a filled circle.
		float bloomFalloff = length(p - vec2(-0.24, 0.3)) * 1.15;
		float bloom = exp(-bloomFalloff * bloomFalloff);
		body += vec3(0.055, 0.062, 0.075) * bloom;

		// The caustic: light gathering at the crown. In the reference this
		// answers force; here the only force is ingestion, so it answers feed.
		// Inverted rather than descending: GLSL leaves smoothstep undefined when
		// edge0 >= edge1, and drivers are free to disagree about it.
		float crown = smoothstep(0.1, 0.95, p.y) * (1.0 - smoothstep(0.55, 1.0, r));
		body += vec3(0.5, 0.58, 0.78) * crown * (0.05 + uFeed * 0.55);

		// Inner shadow, hugging the rim, which is what sells the meniscus.
		body *= 1.0 - smoothstep(0.72, 0.99, r) * 0.18;

		// "+" glyph. Re-measured against the reference side by side: 0.205 R
		// half-length, 0.027 R half-thickness. The first pass at 0.24/0.034 read
		// visibly bolder than the original next to it.
		// Antialias over half a pixel, not a whole one: at this stroke width a
		// full-pixel ramp on both edges nearly doubles the apparent thickness.
		float glyph = plusSdf(p, 0.205, 0.027);
		float glyphMask = 1.0 - smoothstep(-px * 0.5, px * 0.5, glyph);
		body = mix(body, vec3(0.88, 0.89, 0.93), glyphMask);
		// A whisper of bleed, so the glyph sits in the glass rather than on it.
		// Kept tight: a wide skirt reads as a fat, blurry cross.
		body += vec3(0.5, 0.55, 0.68) * (1.0 - smoothstep(-px, px * 2.5, glyph)) * 0.06;

		colour = mix(colour, body, disc);
	}

	// --- dichroic rim -------------------------------------------------------
	// Brightest at crown and base, dimmest at the flanks — measured every 30
	// degrees off the reference.
	float sine = sin(angle);
	vec3 rimHue = sine > 0.0 ? mix(uRimSide, uRimTop, sine) : mix(uRimSide, uRimBottom, -sine);
	// A slow drift keeps the iridescence alive without ever reading as spin.
	rimHue *= 0.86 + 0.14 * sin(angle * 2.0 + uTime * 0.35);
	// The reference rim is a soft 4-6 px band on a 150 px radius — roughly 3 %
	// of the radius. Wider than this reads as a glowing donut; tighter reads as
	// a drawn stroke rather than a lit edge.
	float rimWidth = max(px * 1.4, 0.016);
	float rimBand = (r - 0.972) / rimWidth;
	float rim = exp(-rimBand * rimBand);
	// Measured: the reference rim runs about 1.7x brighter at the crown and base
	// than at the flanks. A uniform ring reads as a drawn circle, not as glass.
	rim *= 0.3 + 0.7 * abs(sine);
	colour += rimHue * rim * (0.95 + uFeed * 1.5);

	// A second, much dimmer and wider pass reads as the thickness of the glass.
	float rim2Band = (r - 0.9) / (rimWidth * 4.5);
	float rim2 = exp(-rim2Band * rim2Band) * 0.09;
	colour += rimHue * rim2;

	gl_FragColor = vec4(colour, disc);
}
`;

/** Uniforms the scene drives every frame. */
export interface OrbUniforms {
	uTime: { value: number };
	uFeed: { value: number };
	uRadiusPx: { value: number };
}

export interface OrbMaterialHandle {
	material: THREE.ShaderMaterial;
	uniforms: OrbUniforms;
}

/**
 * Builds the orb material. `radiusPx` is the orb radius in CSS pixels.
 */
export function createOrbMaterial(radiusPx: number): OrbMaterialHandle {
	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			uBody: { value: new THREE.Color(COLOR_ORB_BODY) },
			uBodyLow: { value: new THREE.Color(COLOR_ORB_BODY_LOW) },
			uHalo: { value: new THREE.Color(COLOR_ORB_HALO) },
			uRimTop: { value: new THREE.Color(COLOR_RIM_TOP) },
			uRimBottom: { value: new THREE.Color(COLOR_RIM_BOTTOM) },
			uRimSide: { value: new THREE.Color(COLOR_RIM_SIDE) },
			uReach: { value: ORB_HALO_REACH },
			uRadiusPx: { value: radiusPx },
			uTime: { value: 0 },
			uFeed: { value: 0 },
		},
		transparent: true,
		depthWrite: false,
		depthTest: true,
		// Premultiplied output: the halo can emit colour at zero alpha, which
		// makes it additive, while the disc covers at alpha 1 — one quad, two
		// blend behaviours, no second draw.
		premultipliedAlpha: true,
	});

	return {
		material,
		uniforms: material.uniforms as unknown as OrbUniforms,
	};
}
