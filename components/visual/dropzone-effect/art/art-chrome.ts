/**
 * Chrome stickers: polished-metal die-cuts of small everyday objects.
 *
 * The banded gradient does the heavy lifting — real chrome has no diffuse
 * colour of its own, only a reflection of a bright sky and a dark floor, so a
 * hard light/dark alternation reads as metal where a smooth grey ramp reads as
 * plastic.
 *
 * All artwork here is original to this component.
 */

import type { PathTarget, StickerDef } from "./art-kit";
import { chromeGradient, PAPER, poly, specularStreak } from "./art-kit";

type Trace = (path: PathTarget, s: number) => void;

/** Rounded rectangle, on either a Path2D or a context. */
function roundRect(
	path: PathTarget,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
): void {
	const radius = Math.min(r, w / 2, h / 2);
	path.moveTo(x + radius, y);
	path.lineTo(x + w - radius, y);
	path.quadraticCurveTo(x + w, y, x + w, y + radius);
	path.lineTo(x + w, y + h - radius);
	path.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
	path.lineTo(x + radius, y + h);
	path.quadraticCurveTo(x, y + h, x, y + h - radius);
	path.lineTo(x, y + radius);
	path.quadraticCurveTo(x, y, x + radius, y);
	path.closePath();
}

interface ChromeOptions {
	sizeScale?: number;
	/** Angle of the metal banding, radians. */
	angle?: number;
	detail?: (ctx: CanvasRenderingContext2D, s: number) => void;
}

function chromeSticker(id: string, trace: Trace, options: ChromeOptions = {}): StickerDef {
	const { sizeScale = 1, angle = Math.PI / 2.4, detail } = options;
	return {
		id,
		family: "chrome",
		sizeScale,
		outline(path, s) {
			trace(path, s);
		},
		paint(ctx, s, _rng, art) {
			ctx.fillStyle = PAPER;
			ctx.fillRect(0, 0, s, s);

			ctx.save();
			ctx.clip(art);
			ctx.fillStyle = chromeGradient(ctx, s, angle);
			ctx.fillRect(0, 0, s, s);
			detail?.(ctx, s);
			specularStreak(ctx, s, angle + 1.2, 0.3, 0.6);
			// Contact shade along the die-cut edge.
			ctx.filter = `blur(${s * 0.03}px)`;
			ctx.strokeStyle = "rgba(46,54,68,0.6)";
			ctx.lineWidth = s * 0.05;
			ctx.stroke(art);
			ctx.restore();
		},
	};
}

export const CHROME_STICKERS: readonly StickerDef[] = [
	chromeSticker("keyboard", (path, s) => roundRect(path, s * 0.05, s * 0.26, s * 0.9, s * 0.48, s * 0.07), {
		sizeScale: 1.04,
		angle: Math.PI / 2,
		detail: (ctx, s) => {
			ctx.fillStyle = "rgba(38,46,60,0.55)";
			const cols = 8;
			const rows = 3;
			const left = s * 0.09;
			const top = s * 0.31;
			const kw = (s * 0.82) / cols;
			const kh = (s * 0.28) / rows;
			for (let r = 0; r < rows; r += 1) {
				for (let c = 0; c < cols; c += 1) {
					const w = r === rows - 1 && c > 1 && c < 6 ? kw * (6 - 2) : kw * 0.74;
					const x = left + c * kw + kw * 0.13;
					if (r === rows - 1 && c > 2 && c < 6) {
						continue;
					}
					ctx.beginPath();
					roundRect(ctx, x, top + r * kh + kh * 0.14, w, kh * 0.7, s * 0.012);
					ctx.fill();
					if (r === rows - 1 && c === 2) {
						// Space bar swallows the middle of the bottom row.
						ctx.beginPath();
						roundRect(ctx, x + kw, top + r * kh + kh * 0.14, kw * 3.5, kh * 0.7, s * 0.012);
						ctx.fill();
					}
				}
			}
		},
	}),

	chromeSticker("phone", (path, s) => roundRect(path, s * 0.27, s * 0.05, s * 0.46, s * 0.9, s * 0.11), {
		sizeScale: 0.96,
		angle: Math.PI / 2.8,
		detail: (ctx, s) => {
			ctx.beginPath();
			roundRect(ctx, s * 0.31, s * 0.1, s * 0.38, s * 0.8, s * 0.08);
			const screen = ctx.createLinearGradient(s * 0.31, s * 0.1, s * 0.69, s * 0.9);
			screen.addColorStop(0, "#1b2740");
			screen.addColorStop(0.5, "#0d1220");
			screen.addColorStop(1, "#24304a");
			ctx.fillStyle = screen;
			ctx.fill();
			// Screen glare.
			ctx.beginPath();
			ctx.moveTo(s * 0.31, s * 0.66);
			ctx.lineTo(s * 0.69, s * 0.34);
			ctx.lineTo(s * 0.69, s * 0.5);
			ctx.lineTo(s * 0.31, s * 0.82);
			ctx.closePath();
			ctx.fillStyle = "rgba(255,255,255,0.11)";
			ctx.fill();
			// Pill cutout.
			ctx.beginPath();
			roundRect(ctx, s * 0.45, s * 0.13, s * 0.1, s * 0.022, s * 0.011);
			ctx.fillStyle = "rgba(6,9,16,0.9)";
			ctx.fill();
		},
	}),

	chromeSticker("floppy", (path, s) => roundRect(path, s * 0.07, s * 0.07, s * 0.86, s * 0.86, s * 0.06), {
		sizeScale: 0.94,
		angle: Math.PI / 2.2,
		detail: (ctx, s) => {
			// Shutter.
			ctx.beginPath();
			roundRect(ctx, s * 0.3, s * 0.1, s * 0.4, s * 0.28, s * 0.02);
			ctx.fillStyle = "rgba(48,57,72,0.62)";
			ctx.fill();
			ctx.beginPath();
			roundRect(ctx, s * 0.55, s * 0.13, s * 0.11, s * 0.22, s * 0.014);
			ctx.fillStyle = "rgba(226,232,240,0.85)";
			ctx.fill();
			// Label.
			ctx.beginPath();
			roundRect(ctx, s * 0.22, s * 0.5, s * 0.56, s * 0.36, s * 0.02);
			ctx.fillStyle = "rgba(240,244,249,0.92)";
			ctx.fill();
			ctx.strokeStyle = "rgba(70,82,102,0.45)";
			ctx.lineWidth = s * 0.016;
			ctx.lineCap = "round";
			[0.6, 0.69, 0.78].forEach((y, index) => {
				ctx.beginPath();
				ctx.moveTo(s * 0.28, s * y);
				ctx.lineTo(s * (index === 2 ? 0.56 : 0.72), s * y);
				ctx.stroke();
			});
		},
	}),

	chromeSticker(
		"cursor",
		(path, s) =>
			poly(path, [
				[s * 0.2, s * 0.06],
				[s * 0.2, s * 0.86],
				[s * 0.38, s * 0.69],
				[s * 0.5, s * 0.96],
				[s * 0.65, s * 0.89],
				[s * 0.53, s * 0.63],
				[s * 0.77, s * 0.6],
			]),
		{
			sizeScale: 1.08,
			angle: Math.PI / 3,
		},
	),

	chromeSticker(
		"bulb",
		(path, s) => {
			path.arc(s * 0.5, s * 0.4, s * 0.32, Math.PI * 0.86, Math.PI * 0.14, false);
			path.lineTo(s * 0.62, s * 0.72);
			path.lineTo(s * 0.62, s * 0.88);
			path.quadraticCurveTo(s * 0.62, s * 0.95, s * 0.55, s * 0.95);
			path.lineTo(s * 0.45, s * 0.95);
			path.quadraticCurveTo(s * 0.38, s * 0.95, s * 0.38, s * 0.88);
			path.lineTo(s * 0.38, s * 0.72);
			path.closePath();
		},
		{
			sizeScale: 1,
			angle: Math.PI / 2,
			detail: (ctx, s) => {
				// Glass warms toward the filament; the screw base stays cold.
				const glow = ctx.createRadialGradient(
					s * 0.5,
					s * 0.38,
					s * 0.02,
					s * 0.5,
					s * 0.4,
					s * 0.34,
				);
				glow.addColorStop(0, "rgba(255,246,214,0.95)");
				glow.addColorStop(0.55, "rgba(255,236,186,0.3)");
				glow.addColorStop(1, "rgba(255,236,186,0)");
				ctx.fillStyle = glow;
				ctx.fillRect(0, 0, s, s);
				ctx.strokeStyle = "rgba(58,68,84,0.5)";
				ctx.lineWidth = s * 0.014;
				[0.76, 0.82, 0.88].forEach((y) => {
					ctx.beginPath();
					ctx.moveTo(s * 0.38, s * y);
					ctx.lineTo(s * 0.62, s * y);
					ctx.stroke();
				});
			},
		},
	),
];
