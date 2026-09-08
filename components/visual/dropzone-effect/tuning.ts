/**
 * Every tunable number for the Dropzone effect, in one place.
 *
 * Geometry is expressed in CSS pixels because the scene runs the repo's
 * `1 world unit = 1 CSS px` camera convention (see `components/arts/cursors/
 * three/cursor-scene.tsx`): the perspective camera sits at
 * `(viewportHeight / 2) / tan(fov / 2)`, so a mesh of size N spans N px at
 * `z = 0`. Anything that must hold across viewports is stored as a *fraction*
 * of the viewport and resolved by `resolveLayout()`.
 *
 * Values marked "measured" were sampled off a 868x1464 reference capture; the
 * phone screen inside it is 628x1361 px, the orb sits at (0.49 w, 0.469 h) with
 * a 63 px radius, and the backdrop is pure black.
 */

import type { DropzoneLayout } from "./flow-model";

// Re-exported so the rest of the component keeps a single import surface for
// "the resolved scene geometry", even though the river owns its shape.
export type { DropzoneLayout } from "./flow-model";

/** Perspective camera field of view, in degrees. Long-ish so edge stickers stay square. */
export const CAMERA_FOV = 38;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/**
 * Orb centre, as signed fractions of the viewport away from the exact middle
 * (+x right, +y up).
 *
 * The reference is a portrait phone and centres the orb horizontally. A
 * landscape frame cannot copy that: everything converges radially on the orb,
 * so a centred sink confines the whole river to the quadrant it feeds from and
 * leaves three quarters of the frame empty. Dropping it below and left of
 * centre lets the diagonal from the upper-right corner run the full length of
 * the frame, which is the composition the reference actually reads as.
 */
export const ORB_CENTER_X_FRACTION = -0.1;
export const ORB_CENTER_Y_FRACTION = -0.235;

/**
 * Orb radius as a fraction of viewport height. The reference's 0.046 is
 * measured on a portrait phone, where it is also 10.9 % of the *width*; on a
 * landscape frame that same fraction of height shrinks to 3 % of width and the
 * sink stops reading as the focal point. This is the height fraction that
 * restores its presence.
 */
export const ORB_RADIUS_H_FRACTION = 0.066;
/** …and a ceiling as a fraction of width, so narrow viewports don't get a moon. */
export const ORB_RADIUS_W_FRACTION = 0.09;
/** Absolute clamps, so tiny and huge viewports both stay sane. */
export const ORB_RADIUS_MIN = 34;
export const ORB_RADIUS_MAX = 110;

/**
 * Halo reach as a multiple of the orb radius. Measured: the glow is gone by
 * r = 85 px against a 63 px disc, i.e. 1.35x — rounded up because our halo is
 * additive against a true black and reads slightly tighter.
 */
export const ORB_HALO_REACH = 1.65;


// ---------------------------------------------------------------------------
// Population
// ---------------------------------------------------------------------------

/** One live sticker per this many square pixels of viewport. */
export const STICKER_AREA_PER_INSTANCE = 9_000;
export const STICKER_COUNT_MIN = 28;
export const STICKER_COUNT_MAX = 150;

/**
 * On-screen sticker size range, as a fraction of viewport height. Measured from
 * the reference's 40 plume slots: 22 pt to 104 pt on an 874 pt canvas.
 */
export const STICKER_SIZE_MIN_H_FRACTION = 0.028;
export const STICKER_SIZE_MAX_H_FRACTION = 0.118;

/**
 * Depth slab, as a fraction of the camera distance. Negative is farther from
 * the camera. Perspective alone then spans roughly 0.6x - 1.5x on top of the
 * 4x intrinsic size range, which is what produces "near ones large and soft,
 * far ones small and crisp".
 */
export const DEPTH_NEAR_FRACTION = 0.24;
export const DEPTH_FAR_FRACTION = -0.72;


// ---------------------------------------------------------------------------
// Ingestion feed
// ---------------------------------------------------------------------------

/**
 * Where the orb's ingestion glow settles while the river runs steadily.
 *
 * The reference's figure is a per-swallow gain of 0.16, which is right for a
 * one-shot drain of 40 stickers. A continuous river swallows on the order of
 * ten a second, and a fixed gain against a `FEED_DECAY^dt` leak reaches
 * equilibrium at `rate * gain / ln(1 / decay)` — around 0.7, pinned near the
 * ceiling, where a flare can never read as a flare.
 *
 * So the field normalises its per-swallow gain against its own swallow rate to
 * land here instead, and only bursts above the baseline show as a pulse.
 */
export const FEED_BASELINE = 0.12;
export const FEED_DECAY = 0.08;
export const FEED_MAX_GLOW = 0.85;

// ---------------------------------------------------------------------------
// Starfield
// ---------------------------------------------------------------------------

export const STAR_AREA_PER_STAR = 2_600;
export const STAR_COUNT_MIN = 240;
export const STAR_COUNT_MAX = 1_400;
/** Star sprite size range in px at the focal plane. */
export const STAR_SIZE_MIN = 1.1;
export const STAR_SIZE_MAX = 3.2;
/** Depth slab for stars, as a multiple of the camera distance. */
export const STAR_DEPTH_NEAR = -0.25;
export const STAR_DEPTH_FAR = -3.4;

// ---------------------------------------------------------------------------
// Post
// ---------------------------------------------------------------------------

/**
 * Luminance above which a pixel contributes to bloom. Set just above diffuse
 * white (~0.85 linear) so only speculars, the orb rim and the "+" glyph bloom.
 * Lower than this and the orb's rim floods its own interior, which reads as a
 * glowing donut instead of a disc of glass.
 */
export const BLOOM_THRESHOLD = 0.97;
export const BLOOM_INTENSITY = 0.5;
/** Circle-of-confusion, in px, at the near depth limit. Far side stays crisp. */
/**
 * Circle of confusion at the near depth limit, in CSS px. Enough that a near
 * sticker is obviously in front of the plane, not so much that a speech bubble
 * turns into a grey smudge — past about 8 px the artwork stops reading as an
 * object and starts reading as dirt on the lens.
 */
export const DOF_MAX_COC = 7.5;
/** Depth (world z) that is perfectly in focus. The orb plane. */
export const DOF_FOCUS_Z = 0;
/** How far from focus, in px of z, before the CoC saturates. */
export const DOF_FALLOFF = 500;
export const GRAIN_STRENGTH = 0.019;
export const VIGNETTE_STRENGTH = 0.3;
/** Lateral chromatic split at the frame edge, in px. */
export const CHROMATIC_ABERRATION = 1.15;

// ---------------------------------------------------------------------------
// Palette (measured off the reference)
// ---------------------------------------------------------------------------

/** Backdrop. The reference is a true black, and the contrast is the point. */
export const COLOR_BACKDROP = "#000000";
/** Orb body at its core: measured rgb(70, 73, 76). */
export const COLOR_ORB_BODY = "#46494c";
/** Orb body at its lower edge: measured rgb(60, 60, 63). */
export const COLOR_ORB_BODY_LOW = "#3c3c3f";
/** Halo peak, just outside the rim: measured rgb(38, 39, 54). */
export const COLOR_ORB_HALO = "#262736";
/**
 * Rim colours, sampled every 30 deg around the reference orb. The rim is
 * brightest at top and bottom and swings lavender -> cool white -> cyan, which
 * is the dichroic signature that makes the glass read as glass.
 */
export const COLOR_RIM_TOP = "#b3a2cc"; // 270 deg, measured rgb(171,164,186), tint pushed
export const COLOR_RIM_BOTTOM = "#a5a7a9"; // 90 deg, measured rgb(165,167,169)
export const COLOR_RIM_SIDE = "#5d7682"; // 180 deg, measured rgb(103,109,119), tint pushed

/**
 * The knobs a consumer may turn at runtime. Everything else in this file is a
 * measured constant and is deliberately not exposed: the point of the component
 * is that it already looks right.
 */
export interface DropzoneTuning {
	/** Multiplier on the automatic sticker count. */
	density: number;
	/** Multiplier on the automatic orb radius. */
	orbScale: number;
	/** Multiplier on the river's speed. */
	speed: number;
	/** Strength of the orb's catch-light on stickers about to be swallowed. */
	catchLight: number;
	/** Holographic film thickness. Higher packs more, tighter rainbow bands. */
	filmScale: number;
	/** How hard the baked dome height bends the surface normal. */
	dome: number;
	/** Scene exposure, before tone mapping. */
	exposure: number;
	/** Multiplier on `BLOOM_INTENSITY`. */
	bloom: number;
	/** Near-field circle of confusion, in px. Overrides `DOF_MAX_COC`. */
	defocus: number;
	/** Multiplier on `GRAIN_STRENGTH`. */
	grain: number;
}

export const DROPZONE_TUNING_DEFAULTS: DropzoneTuning = {
	density: 1,
	orbScale: 1,
	speed: 1,
	catchLight: 2.6,
	filmScale: 1.0,
	dome: 2.6,
	exposure: 1,
	bloom: 1,
	defocus: DOF_MAX_COC,
	grain: 1,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Resolves every fraction in this file against a concrete viewport. */
export function resolveLayout(
	width: number,
	height: number,
	tuning: DropzoneTuning = DROPZONE_TUNING_DEFAULTS,
): DropzoneLayout {
	const safeWidth = Math.max(1, width);
	const safeHeight = Math.max(1, height);
	const cameraDistance = safeHeight / 2 / Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
	const orbRadius =
		clamp(
			Math.min(safeHeight * ORB_RADIUS_H_FRACTION, safeWidth * ORB_RADIUS_W_FRACTION),
			ORB_RADIUS_MIN,
			ORB_RADIUS_MAX,
		) * tuning.orbScale;

	return {
		width: safeWidth,
		height: safeHeight,
		cameraDistance,
		orbX: safeWidth * ORB_CENTER_X_FRACTION,
		orbY: safeHeight * ORB_CENTER_Y_FRACTION,
		orbRadius,
		halfDiagonal: Math.hypot(safeWidth, safeHeight) / 2,
		stickerCount: Math.round(
			clamp(
				((safeWidth * safeHeight) / STICKER_AREA_PER_INSTANCE) * tuning.density,
				STICKER_COUNT_MIN,
				STICKER_COUNT_MAX,
			),
		),
		stickerSizeMin: safeHeight * STICKER_SIZE_MIN_H_FRACTION,
		stickerSizeMax: safeHeight * STICKER_SIZE_MAX_H_FRACTION,
		depthNear: cameraDistance * DEPTH_NEAR_FRACTION,
		depthFar: cameraDistance * DEPTH_FAR_FRACTION,
		starCount: Math.round(
			clamp((safeWidth * safeHeight) / STAR_AREA_PER_STAR, STAR_COUNT_MIN, STAR_COUNT_MAX),
		),
		starDepthNear: cameraDistance * STAR_DEPTH_NEAR,
		starDepthFar: cameraDistance * STAR_DEPTH_FAR,
	};
}
