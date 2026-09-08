"use client";

import { useEffect, useMemo, useState } from "react";

import { parseColor } from "@/components/ui-custom/lib/shimmer-colors";

import type { JiraLinkingMember } from "./field";
import {
	JIRA_LINKING_ATLAS_CELL_PX,
	JIRA_LINKING_NO_ATLAS_INDEX,
} from "./uniforms";

/**
 * Identity of one thing being linked.
 *
 * Colour is the primary channel and the image is opportunistic, which is the
 * opposite of what a metaball demo usually assumes. Real callers mostly identify
 * a subject with a brand logo *component* rather than an image URL, so there is
 * often nothing to texture with — and the deterministic tint is what makes two
 * differently-branded subjects marble through the neck instead of averaging to
 * grey. Pass `tint` when the host already has a palette; otherwise one is
 * derived from `id` so the same subject is always the same colour.
 */
export interface JiraLinkingIdentity {
	id: string;
	/** Same-origin image drawn into the texture atlas. */
	imageSrc?: string;
	/** Explicit 0-1 sRGB tint. Highest precedence. */
	tint?: readonly [number, number, number];
	/**
	 * Theme variable to read the tint from, e.g. `--color-purple-500`. Lets a
	 * host with its own identity palette keep a subject's fusion colour matching
	 * the colour it wears everywhere else, instead of the generic accent ramp.
	 */
	tintVariable?: string;
	/** Hashed instead of `id` when identity and colour should differ. */
	tintSeed?: string;
}

/** `--color-neutral-500` (#7D818A) when a theme variable cannot be read. */
const FALLBACK_TINT: readonly [number, number, number] = [0.4902, 0.5059, 0.5412];

/**
 * Accent ramp for `id`-derived tints. Deliberately a local list rather than a
 * product identity helper: this component ships in `components/visual` and must
 * not reach into a feature layer for its default palette.
 */
const TINT_VARIABLES = [
	"--color-blue-500",
	"--color-purple-500",
	"--color-teal-500",
	"--color-orange-500",
	"--color-green-500",
	"--color-magenta-500",
	"--color-lime-500",
	"--color-red-500",
	"--color-yellow-500",
] as const;

export interface JiraLinkingAtlas {
	/** One horizontal row of square image cells, or null when none decoded. */
	atlas: HTMLCanvasElement | null;
	atlasCells: number;
	members: readonly JiraLinkingMember[];
}

/** FNV-1a, so the same seed always lands on the same accent. */
function hashSeed(seed: string): number {
	let hash = 0x811c9dc5;
	for (let index = 0; index < seed.length; index += 1) {
		hash ^= seed.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}
	return hash;
}

function resolveTintVariable(variable: string): readonly [number, number, number] {
	if (typeof document === "undefined") {
		return FALLBACK_TINT;
	}

	const raw = getComputedStyle(document.documentElement).getPropertyValue(variable);
	const parsed = parseColor(raw.trim());
	if (!parsed) {
		return FALLBACK_TINT;
	}

	return [parsed.r / 255, parsed.g / 255, parsed.b / 255];
}

function resolveIdentityTint(
	identity: Readonly<JiraLinkingIdentity>,
): readonly [number, number, number] {
	if (identity.tint) {
		return identity.tint;
	}
	if (identity.tintVariable) {
		return resolveTintVariable(identity.tintVariable);
	}

	const seed = identity.tintSeed || identity.id;
	return resolveTintVariable(TINT_VARIABLES[hashSeed(seed) % TINT_VARIABLES.length]);
}

function toImageSources(
	identities: readonly JiraLinkingIdentity[] | null,
): readonly string[] {
	const sources: string[] = [];
	for (const identity of identities ?? []) {
		if (identity.imageSrc) {
			sources.push(identity.imageSrc);
		}
	}
	return sources;
}

function toFusionMembers(
	identities: readonly JiraLinkingIdentity[] | null,
): readonly JiraLinkingMember[] {
	let atlasIndex = 0;
	return (identities ?? []).map((identity) => ({
		atlasIndex: identity.imageSrc ? atlasIndex++ : JIRA_LINKING_NO_ATLAS_INDEX,
		id: identity.id,
		tint: resolveIdentityTint(identity),
	}));
}

/**
 * Resolve the subjects' fusion identity once per gesture.
 *
 * Callers are expected to keep `identities` referentially stable for the whole
 * gesture — it is re-read on every pointer move otherwise, and the atlas would
 * be rebuilt each frame.
 */
export function useJiraLinkingAtlas(
	identities: readonly JiraLinkingIdentity[] | null,
): JiraLinkingAtlas {
	const members = useMemo(() => toFusionMembers(identities), [identities]);
	const sources = useMemo(() => toImageSources(identities), [identities]);
	const [atlas, setAtlas] = useState<HTMLCanvasElement | null>(null);

	useEffect(() => {
		if (sources.length === 0) {
			setAtlas(null);
			return;
		}

		const canvas = document.createElement("canvas");
		canvas.width = sources.length * JIRA_LINKING_ATLAS_CELL_PX;
		canvas.height = JIRA_LINKING_ATLAS_CELL_PX;
		const context = canvas.getContext("2d");
		if (!context) {
			setAtlas(null);
			return;
		}

		let cancelled = false;
		const images = sources.map((source, index) => {
			const image = new Image();
			// SVGs without an intrinsic size draw nothing unless told how big they
			// are, and the atlas can only take same-origin images without tainting.
			image.width = JIRA_LINKING_ATLAS_CELL_PX;
			image.height = JIRA_LINKING_ATLAS_CELL_PX;
			image.decoding = "async";
			image.onload = () => {
				if (cancelled) return;
				context.drawImage(
					image,
					index * JIRA_LINKING_ATLAS_CELL_PX,
					0,
					JIRA_LINKING_ATLAS_CELL_PX,
					JIRA_LINKING_ATLAS_CELL_PX,
				);
			};
			image.src = source;
			return image;
		});
		setAtlas(canvas);

		return () => {
			cancelled = true;
			for (const image of images) {
				image.onload = null;
			}
		};
	}, [sources]);

	return { atlas, atlasCells: sources.length, members };
}
