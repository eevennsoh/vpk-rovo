/**
 * The sticker material.
 *
 * One instanced draw call renders the whole field. Per-instance attributes
 * carry the atlas slot, the family, the swallow state and the motion smear, so
 * a hundred stickers cost one bind.
 *
 * Shading is deliberately not a stock PBR material:
 *
 *   - the surface normal is differentiated from the baked dome height, so a
 *     flat quad lights like a domed vinyl die-cut;
 *   - holographic foil uses a thin-film interference term whose hue depends on
 *     `dot(N, V)`, which is what makes the sheen travel as the sticker tumbles
 *     rather than sitting on it like a printed rainbow;
 *   - the orb is a real light in the shading, so the catch-light before a
 *     sticker is swallowed is a consequence of geometry, not an animation.
 *
 * Rendering uses alpha-to-coverage rather than alpha blending: die-cut stickers
 * are opaque cutouts, so they can depth-sort against each other correctly, and
 * MSAA resolves the edge. Blending would need a per-instance sort that
 * instanced geometry cannot do.
 */

import * as THREE from "three";

const vertexShader = /* glsl */ `
attribute float iKind;
attribute float iFamily;
attribute float iOpacity;
attribute float iOrbLight;
attribute float iHolo;
attribute float iHeading;
attribute vec2 iSmear;

varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vTangentV;
varying vec3 vBitangentV;
varying vec3 vViewPos;
varying float vKind;
varying float vFamily;
varying float vOpacity;
varying float vOrbLight;
varying float vHolo;

void main() {
	vUv = uv;
	vKind = iKind;
	vFamily = iFamily;
	vOpacity = iOpacity;
	vOrbLight = iOrbLight;
	vHolo = iHolo;

	mat4 mv = modelViewMatrix * instanceMatrix;
	vec4 originView = mv * vec4(0.0, 0.0, 0.0, 1.0);
	vec4 pointView = mv * vec4(position, 1.0);

	// Motion smear, applied in view space: stretch along the screen-space
	// heading and thin across it. Doing it here rather than in the instance
	// matrix keeps the smear frame independent of the tumble frame.
	vec3 delta = pointView.xyz - originView.xyz;
	vec2 along = vec2(cos(iHeading), sin(iHeading));
	vec2 across = vec2(-along.y, along.x);
	float a = dot(delta.xy, along);
	float b = dot(delta.xy, across);
	delta.xy = along * (a * iSmear.x) + across * (b * iSmear.y);

	vec4 mvPosition = vec4(originView.xyz + delta, 1.0);
	vViewPos = mvPosition.xyz;

	mat3 basis = mat3(mv);
	vTangentV = normalize(basis * vec3(1.0, 0.0, 0.0));
	vBitangentV = normalize(basis * vec3(0.0, 1.0, 0.0));
	vNormalV = normalize(basis * vec3(0.0, 0.0, 1.0));

	gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D uArt;
uniform sampler2D uSurface;
/** columns, rows, texel.x, texel.y */
uniform vec4 uAtlas;
uniform vec3 uOrbViewPos;
uniform vec3 uOrbColor;
uniform float uDome;
uniform float uCatchStrength;
uniform float uFilmScale;
uniform float uExposure;

varying vec2 vUv;
varying vec3 vNormalV;
varying vec3 vTangentV;
varying vec3 vBitangentV;
varying vec3 vViewPos;
varying float vKind;
varying float vFamily;
varying float vOpacity;
varying float vOrbLight;
varying float vHolo;

const float TAU = 6.28318530718;
/** Relative wavelengths for R, G, B. Sets the order of the interference bands. */
const vec3 LAMBDA = vec3(0.62, 0.55, 0.465);

vec2 atlasUv(vec2 local) {
	vec2 cell = vec2(1.0 / uAtlas.x, 1.0 / uAtlas.y);
	float column = mod(vKind, uAtlas.x);
	// Canvas rows run top-down; the texture is flipped on upload, so the row
	// index has to be flipped back.
	float row = uAtlas.y - 1.0 - floor(vKind / uAtlas.x);
	vec2 corner = vec2(column, row) * cell;
	// Keep every tap — including the mip chain and the height gradient taps —
	// inside this cell, so no sticker bleeds into its neighbour.
	vec2 inset = uAtlas.zw * 2.0;
	return clamp(corner + clamp(local, 0.0, 1.0) * cell, corner + inset, corner + cell - inset);
}

/**
 * A cheap analytic environment: dark floor, cool sky, and an overhead softbox.
 * Chrome has no colour of its own — it is entirely this, so the environment
 * doing something interesting is the whole trick.
 */
vec3 environment(vec3 reflected) {
	float up = reflected.y;
	vec3 sky = mix(vec3(0.014, 0.018, 0.028), vec3(0.30, 0.36, 0.47), smoothstep(-0.35, 0.55, up));
	sky += vec3(0.85, 0.9, 1.0) * smoothstep(0.72, 1.0, up) * 0.85;
	// A dim warm bounce from below keeps the undersides from going pure black.
	// Inverted rather than descending: GLSL leaves smoothstep undefined when
	// edge0 >= edge1.
	sky += vec3(0.16, 0.12, 0.1) * (1.0 - smoothstep(-0.95, -0.2, up));
	return sky;
}

void main() {
	vec2 uv = atlasUv(vUv);
	vec4 surface = texture2D(uSurface, uv);
	float coverage = surface.a;
	if (coverage < 0.05) {
		discard;
	}

	vec4 art = texture2D(uArt, uv);

	// --- normal from the baked dome height --------------------------------
	float hx =
		texture2D(uSurface, uv + vec2(uAtlas.z, 0.0)).r -
		texture2D(uSurface, uv - vec2(uAtlas.z, 0.0)).r;
	float hy =
		texture2D(uSurface, uv + vec2(0.0, uAtlas.w)).r -
		texture2D(uSurface, uv - vec2(0.0, uAtlas.w)).r;
	vec3 local = normalize(vec3(-hx * uDome, -hy * uDome, 1.0));

	vec3 faceNormal = vNormalV;
	if (!gl_FrontFacing) {
		faceNormal = -faceNormal;
	}
	vec3 N = normalize(vTangentV * local.x + vBitangentV * local.y + faceNormal * local.z);
	vec3 V = normalize(-vViewPos);
	float ndv = clamp(dot(N, V), 0.0, 1.0);

	float wPaper = step(vFamily, 0.5);
	float wHolo = step(0.5, vFamily) * step(vFamily, 1.5);
	float wChrome = step(1.5, vFamily);

	vec3 albedo = art.rgb;
	// The back of a die-cut sticker is blank liner white.
	if (!gl_FrontFacing) {
		albedo = vec3(0.9, 0.91, 0.93);
	}

	// --- thin-film interference -------------------------------------------
	// Optical path length through the film varies with thickness and with the
	// refracted angle; approximating the latter with ndv is what shifts the
	// hue as the sticker turns.
	float thickness = surface.b * uFilmScale + vHolo * 0.6;
	vec3 phase = TAU * thickness * (0.55 + 0.45 * ndv) / LAMBDA;
	vec3 iris = 0.5 + 0.5 * cos(phase);
	// Enough that the foil obviously shifts as it turns, not so much that every
	// holo sticker reads as an oil slick. The reference's holo pieces are pale
	// pastels with one or two hue zones, not full spectra.
	float irisMix = wHolo * 0.6 + wChrome * 0.12;
	albedo = mix(albedo, albedo * (0.32 + 1.38 * iris), irisMix * float(gl_FrontFacing));

	// --- lighting ----------------------------------------------------------
	float roughness = mix(0.42, 0.62, surface.g) * (wPaper * 1.5 + wHolo * 0.62 + wChrome * 0.4);
	roughness = clamp(roughness, 0.05, 1.0);
	float shininess = 2.0 / (roughness * roughness * roughness * roughness) - 2.0;
	float f0 = wPaper * 0.05 + wHolo * 0.28 + wChrome * 0.85;
	float fresnel = f0 + (1.0 - f0) * pow(1.0 - ndv, 5.0);

	vec3 keyDir = normalize(vec3(-0.32, 0.72, 0.62));
	vec3 fillDir = normalize(vec3(0.68, -0.14, 0.42));
	vec3 keyColor = vec3(1.0, 0.98, 0.94);
	vec3 fillColor = vec3(0.42, 0.55, 0.82);

	vec3 diffuse = vec3(0.0);
	vec3 specular = vec3(0.0);

	// Budgeted so a white paper sticker lands near 0.85 linear rather than
	// clipping: everything above 1.0 is detail thrown away, and on a black
	// backdrop a blown-out white die-cut loses its keyline and its artwork.
	diffuse += keyColor * max(dot(N, keyDir), 0.0) * 0.58;
	diffuse += fillColor * max(dot(N, fillDir), 0.0) * 0.24;
	// Wrapped ambient, so nothing in the field ever reads as a silhouette.
	diffuse += vec3(0.072, 0.086, 0.122) * (0.5 + 0.5 * N.y);

	specular += keyColor * pow(max(dot(N, normalize(keyDir + V)), 0.0), shininess);
	specular += fillColor * pow(max(dot(N, normalize(fillDir + V)), 0.0), shininess) * 0.5;

	// --- the orb as a real light -------------------------------------------
	vec3 orbDir = normalize(uOrbViewPos - vViewPos);
	float orb = vOrbLight * uCatchStrength;
	diffuse += uOrbColor * orb * max(dot(N, orbDir), 0.0) * 0.9;
	specular += uOrbColor * orb * pow(max(dot(N, normalize(orbDir + V)), 0.0), shininess) * 2.2;
	// A little wrap, so even a sticker facing away flares as it goes in.
	vec3 emissive = uOrbColor * orb * 0.14 * (0.4 + 0.6 * fresnel);

	vec3 reflected = reflect(-V, N);
	vec3 env = environment(reflected) * (wPaper * 0.14 + wHolo * 0.6 + wChrome * 1.0);

	vec3 colour = albedo * diffuse + specular * fresnel * (0.5 + 1.2 * (wHolo + wChrome));
	colour += env * fresnel;
	colour += emissive;
	colour *= uExposure;

	// Output stays linear: the scene renders into a linear float target and the
	// composite pass is the only place that encodes to sRGB. uArt is uploaded
	// as an sRGB texture, so its samples are already linear here.
	gl_FragColor = vec4(colour, coverage * vOpacity * art.a);
}
`;

export interface StickerMaterialOptions {
	art: THREE.Texture;
	surface: THREE.Texture;
	columns: number;
	rows: number;
	/** Pixel dimensions of the atlas, for the texel size. */
	atlasWidth: number;
	atlasHeight: number;
}

/** Builds the instanced sticker material. */
export function createStickerMaterial(options: StickerMaterialOptions): THREE.ShaderMaterial {
	const material = new THREE.ShaderMaterial({
		vertexShader,
		fragmentShader,
		uniforms: {
			uArt: { value: options.art },
			uSurface: { value: options.surface },
			uAtlas: {
				value: new THREE.Vector4(
					options.columns,
					options.rows,
					1 / options.atlasWidth,
					1 / options.atlasHeight,
				),
			},
			uOrbViewPos: { value: new THREE.Vector3() },
			uOrbColor: { value: new THREE.Color("#b9cdff") },
			uDome: { value: 2.6 },
			uCatchStrength: { value: 2.6 },
			uFilmScale: { value: 1.0 },
			uExposure: { value: 1.0 },
		},
		transparent: false,
		alphaToCoverage: true,
		side: THREE.DoubleSide,
		depthWrite: true,
		depthTest: true,
	});
	// Cutout, not blend: lets a hundred instances depth-sort against each other
	// without a per-instance sort, which instanced geometry cannot do. The
	// shader discards empty texels itself, and alpha-to-coverage plus MSAA
	// resolves the die-cut edge — an alphaTest here would hard-clip it first.
	material.alphaTest = 0;
	return material;
}
