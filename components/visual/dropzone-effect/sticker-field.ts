/**
 * The sticker field: one instanced mesh carrying the whole river.
 *
 * The simulation is stateless per frame. Every sticker's position, tumble and
 * swallow state is re-derived from its seed and the current time by
 * `sampleFlow`, so there is no integrator to drift, no order dependence, and a
 * dropped frame changes nothing. The only mutable state is the seed array
 * itself, which is re-rolled when a sticker reaches the drain — that is what
 * makes the river continuous instead of a burst.
 */

import * as THREE from "three";

import type { StickerAtlas } from "./atlas";
import { CONTENT_SCALE } from "./atlas";
import type { StickerFrame, StickerSeed } from "./flow-model";
import {
	createFrame,
	createSeed,
	mulberry32,
	progressOf,
	sampleFlow,
	TRAVEL_DURATION_MAX,
	TRAVEL_DURATION_MIN,
} from "./flow-model";
import { createStickerMaterial } from "./sticker-material";
import type { DropzoneLayout } from "./tuning";
import { FEED_BASELINE, FEED_DECAY } from "./tuning";

export interface StickerField {
	object: THREE.InstancedMesh;
	material: THREE.ShaderMaterial;
	/**
	 * Advances to `time` and returns the ingestion energy released this tick —
	 * the orb's `feed`, which drives its flare.
	 */
	update(time: number): number;
	dispose(): void;
}

export interface StickerFieldOptions {
	/** Fixes the field's randomness, so a scene replays identically. */
	seed?: number;
	/**
	 * Simulation time the field is being built at.
	 *
	 * Required whenever a field is rebuilt mid-scene — a resize, a density or
	 * orb-size change. Staggering against zero instead would leave every seed
	 * already past its duration, so the first update respawns all of them at the
	 * same instant and the river collapses into one synchronised clump at the
	 * spawn edge until it spreads out again.
	 */
	now?: number;
}

/** Builds the field. `atlas` must already be baked. */
export function createStickerField(
	layout: DropzoneLayout,
	atlas: StickerAtlas,
	options: StickerFieldOptions = {},
): StickerField {
	const { seed = 20260906, now = 0 } = options;
	const count = layout.stickerCount;
	const rng = mulberry32(seed);

	const geometry = new THREE.InstancedBufferGeometry();
	const plane = new THREE.PlaneGeometry(1, 1);
	geometry.index = plane.index;
	geometry.attributes = plane.attributes;
	geometry.instanceCount = count;
	plane.dispose();

	const kinds = new Float32Array(count);
	const familyIds = new Float32Array(count);
	const opacities = new Float32Array(count);
	const orbLights = new Float32Array(count);
	const holos = new Float32Array(count);
	const headings = new Float32Array(count);
	const smears = new Float32Array(count * 2);

	const attributes = {
		iKind: new THREE.InstancedBufferAttribute(kinds, 1),
		iFamily: new THREE.InstancedBufferAttribute(familyIds, 1),
		iOpacity: new THREE.InstancedBufferAttribute(opacities, 1),
		iOrbLight: new THREE.InstancedBufferAttribute(orbLights, 1),
		iHolo: new THREE.InstancedBufferAttribute(holos, 1),
		iHeading: new THREE.InstancedBufferAttribute(headings, 1),
		iSmear: new THREE.InstancedBufferAttribute(smears, 2),
	} as const;
	Object.entries(attributes).forEach(([name, attribute]) => {
		attribute.setUsage(THREE.DynamicDrawUsage);
		geometry.setAttribute(name, attribute);
	});

	const material = createStickerMaterial({
		art: atlas.art,
		surface: atlas.surface,
		columns: atlas.columns,
		rows: atlas.rows,
		atlasWidth: atlas.art.image.width,
		atlasHeight: atlas.art.image.height,
	});

	const mesh = new THREE.InstancedMesh(geometry, material, count);
	mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
	// Instances are placed entirely from the simulation, so the mesh's own
	// bounds are meaningless; culling it would blink the whole field out.
	mesh.frustumCulled = false;

	// Stagger the initial population across the whole journey, so the field is
	// already full and mid-flow on the very first frame rather than filling in.
	const seeds: StickerSeed[] = [];
	for (let i = 0; i < count; i += 1) {
		const trip = createSeed(rng, layout, 0, atlas.count);
		trip.startTime = now - rng() * trip.duration;
		seeds.push(trip);
	}

	// Normalise the ingestion gain against this field's own swallow rate, so the
	// orb's baseline glow is the same at 28 stickers as at 150 and only a burst
	// of arrivals pushes it above `FEED_BASELINE`.
	const swallowsPerSecond = count / ((TRAVEL_DURATION_MIN + TRAVEL_DURATION_MAX) / 2);
	const feedGain = (FEED_BASELINE * -Math.log(FEED_DECAY)) / Math.max(swallowsPerSecond, 1e-3);

	const frame: StickerFrame = createFrame();
	const matrix = new THREE.Matrix4();
	const position = new THREE.Vector3();
	const quaternion = new THREE.Quaternion();
	const euler = new THREE.Euler();
	const scale = new THREE.Vector3();

	function update(time: number): number {
		let feed = 0;

		for (let i = 0; i < count; i += 1) {
			let trip = seeds[i];
			if (progressOf(trip, time) >= 1) {
				// Larger stickers make a bigger splash going in.
				const weight = 0.6 + (0.4 * trip.size) / layout.stickerSizeMax;
				feed += feedGain * weight;
				trip = createSeed(rng, layout, time, atlas.count);
				seeds[i] = trip;
			}

			sampleFlow(trip, layout, time, frame);

			position.set(frame.x, frame.y, frame.z);
			euler.set(frame.tiltX, frame.tiltY, frame.spin, "ZYX");
			quaternion.setFromEuler(euler);
			// The artwork occupies `CONTENT_SCALE` of its atlas cell, so the quad
			// is grown to compensate and `seed.size` stays the size of the
			// *artwork*, not of its padding.
			const span = (trip.size * frame.scale * atlas.sizeScales[trip.kind]) / CONTENT_SCALE;
			scale.set(span, span, 1);
			matrix.compose(position, quaternion, scale);
			mesh.setMatrixAt(i, matrix);

			kinds[i] = trip.kind;
			familyIds[i] = atlas.families[trip.kind];
			opacities[i] = frame.opacity;
			orbLights[i] = frame.orbLight;
			holos[i] = trip.holoBias;
			headings[i] = frame.heading;
			smears[i * 2] = frame.smearAlong;
			smears[i * 2 + 1] = frame.smearAcross;
		}

		mesh.instanceMatrix.needsUpdate = true;
		Object.values(attributes).forEach((attribute) => {
			attribute.needsUpdate = true;
		});

		return feed;
	}

	return {
		object: mesh,
		material,
		update,
		dispose() {
			geometry.dispose();
			material.dispose();
			mesh.dispose();
		},
	};
}
