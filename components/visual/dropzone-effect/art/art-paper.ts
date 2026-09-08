/**
 * Paper stickers: hand-lettered die-cut speech bubbles, a folded plane, and a
 * note card. Matte white with a marker keyline — the high-contrast counterpart
 * to the holographic pieces.
 *
 * All artwork and copy here is original to this component.
 */

import type { StickerDef } from "./art-kit";
import { blob, handLetter, INK, PAPER, poly } from "./art-kit";

/**
 * Adds a speech-bubble tail at bearing `angle` on the blob's bounding ellipse.
 * Drawn as a second subpath: non-zero fill unions it with the body, so the
 * silhouette comes out as one die-cut shape with no seam.
 */
function tail(
	path: Path2D,
	cx: number,
	cy: number,
	w: number,
	h: number,
	angle: number,
	length: number,
	kick: number,
): void {
	const nx = Math.cos(angle);
	const ny = Math.sin(angle);
	// Perpendicular, for the base width.
	const px = -ny;
	const py = nx;
	const baseHalf = length * 0.44;
	// Sit the base slightly inside the body so the union has no notch.
	const bx = cx + nx * (w / 2) * 0.9;
	const by = cy + ny * (h / 2) * 0.9;
	const tipX = bx + nx * length + px * kick * length;
	const tipY = by + ny * length + py * kick * length;

	path.moveTo(bx + px * baseHalf, by + py * baseHalf);
	path.quadraticCurveTo(
		bx + nx * length * 0.55 + px * baseHalf * 0.5,
		by + ny * length * 0.55 + py * baseHalf * 0.5,
		tipX,
		tipY,
	);
	path.quadraticCurveTo(
		bx + nx * length * 0.4 - px * baseHalf * 0.3,
		by + ny * length * 0.4 - py * baseHalf * 0.3,
		bx - px * baseHalf,
		by - py * baseHalf,
	);
	path.closePath();
}

interface BubbleOptions {
	/** Bearing of the tail, in degrees. 90 points down the cell. */
	tailAngle: number;
	/** Sideways lean of the tail tip, as a fraction of its length. */
	tailKick?: number;
	/** Whole-sticker rotation, in degrees. Keeps the set from lining up. */
	rotate?: number;
	sizeScale?: number;
}

/** Builds one hand-lettered speech bubble. */
function bubble(id: string, lines: readonly string[], options: BubbleOptions): StickerDef {
	const { tailAngle, tailKick = 0.35, rotate = 0, sizeScale = 1 } = options;
	const rows = lines.length;
	// Taller bubbles for more copy, but never so tall the tail leaves the cell.
	const boxHeight = 0.2 + rows * 0.115;
	const boxWidth = 0.74;
	const spin = (rotate * Math.PI) / 180;

	const trace = (path: Path2D, s: number, rng: () => number) => {
		const w = s * boxWidth;
		const h = s * boxHeight;
		blob(path, 0, 0, w, h, h * 0.49, rng);
		tail(path, 0, 0, w, h, (tailAngle * Math.PI) / 180, s * 0.15, tailKick);
	};

	return {
		id,
		family: "paper",
		sizeScale,
		outline(path, s) {
			const local = new Path2D();
			// Traced at the origin, then placed — so the same local path can be
			// reused for the keyline in `paint` under an identical transform.
			trace(local, s, seedFor(id));
			path.addPath(local, new DOMMatrix().translate(s / 2, s / 2).rotate(rotate));
		},
		paint(ctx, s, rng) {
			// The clip is the *dilated* silhouette, so filling the whole cell
			// paints the white die-cut border in one stroke.
			ctx.fillStyle = PAPER;
			ctx.fillRect(0, 0, s, s);

			ctx.save();
			ctx.translate(s / 2, s / 2);
			ctx.rotate(spin);

			// Marker keyline, on the un-dilated artwork edge.
			const inner = new Path2D();
			trace(inner, s, seedFor(id));
			ctx.strokeStyle = INK;
			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			ctx.lineWidth = s * 0.023;
			ctx.stroke(inner);

			const fontSize = s * (rows > 2 ? 0.115 : rows > 1 ? 0.13 : 0.155);
			handLetter(ctx, lines, 0, 0, fontSize, fontSize * 1.16, rng);
			ctx.restore();
		},
	};
}

/** Per-sticker deterministic jitter, so a bubble looks the same every reload. */
function seedFor(id: string): () => number {
	let a = 0;
	for (let i = 0; i < id.length; i += 1) {
		a = (a * 31 + id.charCodeAt(i)) >>> 0;
	}
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** A folded paper dart, shaded by facet rather than by gradient. */
const paperPlane: StickerDef = {
	id: "paper-plane",
	family: "paper",
	sizeScale: 1.06,
	outline(path, s) {
		const p = (x: number, y: number) => [s * x, s * y] as const;
		poly(path, [p(0.06, 0.34), p(0.95, 0.1), p(0.52, 0.92), p(0.4, 0.63), p(0.06, 0.34)]);
	},
	paint(ctx, s) {
		const p = (x: number, y: number) => [s * x, s * y] as const;
		ctx.fillStyle = PAPER;
		ctx.fillRect(0, 0, s, s);

		// Underside wing: the darker facet that gives the fold its depth.
		ctx.beginPath();
		poly(ctx, [p(0.06, 0.34), p(0.95, 0.1), p(0.4, 0.63)]);
		const shade = ctx.createLinearGradient(s * 0.1, s * 0.2, s * 0.7, s * 0.6);
		shade.addColorStop(0, "#e8ecf1");
		shade.addColorStop(1, "#c2cad4");
		ctx.fillStyle = shade;
		ctx.fill();

		// Keel.
		ctx.beginPath();
		poly(ctx, [p(0.4, 0.63), p(0.95, 0.1), p(0.52, 0.92)]);
		const keel = ctx.createLinearGradient(s * 0.4, s * 0.9, s * 0.9, s * 0.2);
		keel.addColorStop(0, "#f7f9fb");
		keel.addColorStop(1, "#ffffff");
		ctx.fillStyle = keel;
		ctx.fill();

		// Fold line.
		ctx.beginPath();
		ctx.moveTo(...p(0.95, 0.1));
		ctx.lineTo(...p(0.4, 0.63));
		ctx.strokeStyle = "rgba(21,23,27,0.28)";
		ctx.lineWidth = s * 0.008;
		ctx.stroke();
	},
};

/** A ruled note card with a turned corner. */
const note: StickerDef = {
	id: "note",
	family: "paper",
	sizeScale: 0.94,
	outline(path, s) {
		const x = s * 0.16;
		const y = s * 0.12;
		const w = s * 0.68;
		const h = s * 0.76;
		const fold = s * 0.19;
		const r = s * 0.035;
		path.moveTo(x + r, y);
		path.lineTo(x + w - fold, y);
		path.lineTo(x + w, y + fold);
		path.lineTo(x + w, y + h - r);
		path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
		path.lineTo(x + r, y + h);
		path.quadraticCurveTo(x, y + h, x, y + h - r);
		path.lineTo(x, y + r);
		path.quadraticCurveTo(x, y, x + r, y);
		path.closePath();
	},
	paint(ctx, s) {
		const x = s * 0.16;
		const y = s * 0.12;
		const w = s * 0.68;
		const fold = s * 0.19;
		ctx.fillStyle = PAPER;
		ctx.fillRect(0, 0, s, s);

		// The turned corner, shaded so the card reads as a physical object.
		ctx.beginPath();
		ctx.moveTo(x + w - fold, y);
		ctx.lineTo(x + w, y + fold);
		ctx.lineTo(x + w - fold, y + fold);
		ctx.closePath();
		ctx.fillStyle = "#cfd6de";
		ctx.fill();

		// Ruled lines, shortest last so it reads as a paragraph.
		ctx.strokeStyle = "rgba(21,23,27,0.5)";
		ctx.lineCap = "round";
		ctx.lineWidth = s * 0.022;
		const widths = [0.72, 0.86, 0.64, 0.8, 0.42];
		widths.forEach((fraction, index) => {
			const ly = y + s * 0.28 + index * s * 0.115;
			ctx.beginPath();
			ctx.moveTo(x + s * 0.08, ly);
			ctx.lineTo(x + s * 0.08 + (w - s * 0.16) * fraction, ly);
			ctx.stroke();
		});
	},
};

export const PAPER_STICKERS: readonly StickerDef[] = [
	bubble("bubble-ship", ["Ship it"], { tailAngle: 118, tailKick: 0.3, rotate: -7 }),
	bubble("bubble-dark", ["Add dark", "mode"], { tailAngle: 72, tailKick: -0.3, rotate: 9 }),
	bubble("bubble-vibe", ["Just vibe", "code it"], { tailAngle: 132, rotate: -13 }),
	bubble("bubble-build", ["Build me", "an app"], { tailAngle: 58, tailKick: -0.25, rotate: 5 }),
	bubble("bubble-lgtm", ["LGTM"], { tailAngle: 96, rotate: 11, sizeScale: 0.9 }),
	paperPlane,
	note,
];
