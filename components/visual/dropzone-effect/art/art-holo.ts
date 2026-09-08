/**
 * Holographic stickers: die-cut vinyl with an iridescent foil face.
 *
 * The baked artwork carries a rainbow *and* a low-frequency swirl in the film
 * thickness. The shader then rotates the same colour wheel again by view angle,
 * so the sheen genuinely travels across the face as the sticker tumbles — the
 * baked gradient alone would look like a printed rainbow, not like foil.
 *
 * All artwork here is original to this component.
 */

import type { PathTarget, StickerDef } from "./art-kit";
import {
	HOLO_STOPS,
	holoGradient,
	PAPER,
	poly,
	sparkle,
	specularStreak,
	star,
	TAU,
} from "./art-kit";

type Trace = (path: PathTarget, s: number) => void;

/** Soft blooms of shifted hue, so the foil swirls instead of banding. */
function swirl(ctx: CanvasRenderingContext2D, s: number, rng: () => number): void {
	ctx.save();
	ctx.globalCompositeOperation = "screen";
	for (let i = 0; i < 3; i += 1) {
		const cx = s * (0.15 + rng() * 0.7);
		const cy = s * (0.15 + rng() * 0.7);
		const r = s * (0.26 + rng() * 0.34);
		const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
		const colour = HOLO_STOPS[Math.floor(rng() * (HOLO_STOPS.length - 1))];
		gradient.addColorStop(0, `${colour}70`);
		gradient.addColorStop(1, `${colour}00`);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, s, s);
	}
	ctx.restore();
}

/** Darkens the inside of the die-cut edge, so the vinyl reads as domed. */
function innerShade(ctx: CanvasRenderingContext2D, s: number, art: Path2D): void {
	ctx.save();
	ctx.clip(art);
	ctx.filter = `blur(${s * 0.035}px)`;
	ctx.strokeStyle = "rgba(70,84,112,0.55)";
	ctx.lineWidth = s * 0.055;
	ctx.stroke(art);
	ctx.restore();
}

interface HoloOptions {
	sizeScale?: number;
	/** Angle of the iridescent sweep, radians. */
	angle?: number;
	/** Where on the colour wheel the sweep starts, 0-1. */
	offset?: number;
	/** Optional detail painted on top, inside the artwork clip. */
	detail?: (ctx: CanvasRenderingContext2D, s: number) => void;
}

function holoSticker(id: string, trace: Trace, options: HoloOptions = {}): StickerDef {
	const { sizeScale = 1, angle = 0.9, offset = 0, detail } = options;
	return {
		id,
		family: "holo",
		sizeScale,
		outline(path, s) {
			trace(path, s);
		},
		paint(ctx, s, rng, art) {
			// The clip is the dilated silhouette: this is the white die-cut border.
			ctx.fillStyle = PAPER;
			ctx.fillRect(0, 0, s, s);

			ctx.save();
			ctx.clip(art);
			ctx.fillStyle = holoGradient(ctx, s, angle, offset);
			ctx.fillRect(0, 0, s, s);
			swirl(ctx, s, rng);
			specularStreak(ctx, s, angle + 0.62, 0.36, 0.58);
			specularStreak(ctx, s, angle + 0.62, 0.72, 0.26);
			detail?.(ctx, s);
			ctx.restore();

			innerShade(ctx, s, art);
		},
	};
}

const point = (s: number, x: number, y: number) => [s * x, s * y] as const;

export const HOLO_STICKERS: readonly StickerDef[] = [
	holoSticker("star", (path, s) => star(path, s / 2, s / 2, s * 0.47, s * 0.2, 5), {
		sizeScale: 1.08,
		angle: 1.2,
		offset: 0.1,
	}),

	holoSticker(
		"sparkle",
		(path, s) => {
			sparkle(path, s / 2, s * 0.46, s * 0.42, 0.18);
			sparkle(path, s * 0.83, s * 0.84, s * 0.15, 0.2);
		},
		{ sizeScale: 1.14, angle: 2.1, offset: 0.4 },
	),

	holoSticker(
		"bolt",
		(path, s) =>
			poly(path, [
				point(s, 0.62, 0.04),
				point(s, 0.24, 0.53),
				point(s, 0.46, 0.53),
				point(s, 0.35, 0.96),
				point(s, 0.76, 0.42),
				point(s, 0.53, 0.42),
			]),
		{ sizeScale: 1.22, angle: 1.5, offset: 0.62 },
	),

	holoSticker(
		"planet",
		(path, s) => {
			// Ring first: outer ellipse clockwise, inner counter-clockwise, so
			// non-zero winding leaves a band. The body then fills the hole.
			// The ring's hole has to survive the die-cut dilation, which eats
			// DIE_CUT_MARGIN off every inside edge. A thin ring against a fat
			// body closes up completely and the planet bakes as a plain blob.
			path.ellipse(s / 2, s * 0.54, s * 0.5, s * 0.225, -0.36, 0, TAU, false);
			path.ellipse(s / 2, s * 0.54, s * 0.35, s * 0.125, -0.36, 0, TAU, true);
			path.ellipse(s / 2, s * 0.47, s * 0.23, s * 0.23, 0, 0, TAU, false);
		},
		{
			sizeScale: 1.02,
			angle: 0.4,
			offset: 0.25,
			detail: (ctx, s) => {
				// A crescent terminator, so the body reads as a sphere.
				const shadow = ctx.createRadialGradient(
					s * 0.36,
					s * 0.36,
					s * 0.04,
					s * 0.5,
					s * 0.47,
					s * 0.34,
				);
				shadow.addColorStop(0, "rgba(255,255,255,0.5)");
				shadow.addColorStop(0.62, "rgba(255,255,255,0)");
				shadow.addColorStop(1, "rgba(56,66,92,0.42)");
				ctx.fillStyle = shadow;
				ctx.fillRect(0, 0, s, s);
			},
		},
	),

	holoSticker(
		"rocket",
		(path, s) => {
			// Body: a pointed capsule.
			path.moveTo(s * 0.5, s * 0.03);
			path.bezierCurveTo(s * 0.73, s * 0.24, s * 0.74, s * 0.55, s * 0.66, s * 0.79);
			path.lineTo(s * 0.34, s * 0.79);
			path.bezierCurveTo(s * 0.26, s * 0.55, s * 0.27, s * 0.24, s * 0.5, s * 0.03);
			path.closePath();
			// Fins.
			poly(path, [
				point(s, 0.34, 0.56),
				point(s, 0.12, 0.86),
				point(s, 0.17, 0.92),
				point(s, 0.36, 0.82),
			]);
			poly(path, [
				point(s, 0.66, 0.56),
				point(s, 0.88, 0.86),
				point(s, 0.83, 0.92),
				point(s, 0.64, 0.82),
			]);
			// Exhaust flare.
			poly(path, [point(s, 0.4, 0.79), point(s, 0.5, 0.99), point(s, 0.6, 0.79)]);
		},
		{
			sizeScale: 1,
			angle: 1.9,
			offset: 0.55,
			detail: (ctx, s) => {
				ctx.beginPath();
				ctx.arc(s * 0.5, s * 0.33, s * 0.11, 0, TAU);
				const port = ctx.createRadialGradient(
					s * 0.46,
					s * 0.29,
					0,
					s * 0.5,
					s * 0.33,
					s * 0.12,
				);
				port.addColorStop(0, "#dff0ff");
				port.addColorStop(0.55, "#5f7fbe");
				port.addColorStop(1, "#2c3f6b");
				ctx.fillStyle = port;
				ctx.fill();
			},
		},
	),

	holoSticker(
		"code",
		(path, s) => {
			const bar = (pts: readonly (readonly [number, number])[]) => poly(path, pts);
			// Gaps have to clear twice DIE_CUT_MARGIN, or the three glyphs fuse
			// into one lump when the silhouette is dilated.
			// "<"
			bar([
				point(s, 0.24, 0.14),
				point(s, 0.32, 0.24),
				point(s, 0.14, 0.5),
				point(s, 0.32, 0.76),
				point(s, 0.24, 0.86),
				point(s, 0.0, 0.5),
			]);
			// "/"
			bar([
				point(s, 0.58, 0.1),
				point(s, 0.68, 0.14),
				point(s, 0.46, 0.9),
				point(s, 0.36, 0.86),
			]);
			// ">"
			bar([
				point(s, 0.78, 0.14),
				point(s, 1.0, 0.5),
				point(s, 0.78, 0.86),
				point(s, 0.7, 0.76),
				point(s, 0.86, 0.5),
				point(s, 0.7, 0.24),
			]);
		},
		{ sizeScale: 1.1, angle: 0.6, offset: 0.78 },
	),

	holoSticker(
		"heart",
		(path, s) => {
			path.moveTo(s * 0.5, s * 0.92);
			path.bezierCurveTo(s * 0.04, s * 0.6, s * 0.1, s * 0.16, s * 0.32, s * 0.14);
			path.bezierCurveTo(s * 0.43, s * 0.13, s * 0.49, s * 0.22, s * 0.5, s * 0.3);
			path.bezierCurveTo(s * 0.51, s * 0.22, s * 0.57, s * 0.13, s * 0.68, s * 0.14);
			path.bezierCurveTo(s * 0.9, s * 0.16, s * 0.96, s * 0.6, s * 0.5, s * 0.92);
			path.closePath();
		},
		{ sizeScale: 1, angle: 2.5, offset: 0.32 },
	),

	holoSticker(
		"gem",
		(path, s) =>
			poly(path, [
				point(s, 0.28, 0.14),
				point(s, 0.72, 0.14),
				point(s, 0.94, 0.42),
				point(s, 0.5, 0.93),
				point(s, 0.06, 0.42),
			]),
		{
			sizeScale: 0.98,
			angle: 1.1,
			offset: 0.86,
			detail: (ctx, s) => {
				ctx.strokeStyle = "rgba(255,255,255,0.72)";
				ctx.lineWidth = s * 0.012;
				const facets: readonly (readonly [number, number, number, number])[] = [
					[0.06, 0.42, 0.94, 0.42],
					[0.28, 0.14, 0.38, 0.42],
					[0.72, 0.14, 0.62, 0.42],
					[0.38, 0.42, 0.5, 0.93],
					[0.62, 0.42, 0.5, 0.93],
				];
				facets.forEach(([x1, y1, x2, y2]) => {
					ctx.beginPath();
					ctx.moveTo(s * x1, s * y1);
					ctx.lineTo(s * x2, s * y2);
					ctx.stroke();
				});
			},
		},
	),

	holoSticker(
		"orbit",
		(path, s) => {
			path.ellipse(s / 2, s / 2, s * 0.47, s * 0.27, -0.5, 0, TAU, false);
			path.ellipse(s / 2, s / 2, s * 0.34, s * 0.135, -0.5, 0, TAU, true);
			path.ellipse(s * 0.5, s * 0.5, s * 0.12, s * 0.12, 0, 0, TAU, false);
		},
		{ sizeScale: 1.05, angle: 2.8, offset: 0.5 },
	),
];
