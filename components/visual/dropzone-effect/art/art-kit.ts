/**
 * Shared drawing primitives for the Dropzone sticker artwork.
 *
 * Every sticker is authored into a square atlas cell in normalised space: the
 * helpers below take a cell size `s` and draw relative to it, so a sticker
 * scales to any atlas resolution without retuning.
 *
 * Three passes are baked per sticker:
 *   - the die-cut silhouette (the outline, dilated by a white margin),
 *   - the colour artwork,
 *   - a surface map (dome height, specular mask, holographic film thickness).
 *
 * All artwork here is original to this component.
 */

export type StickerFamily = "paper" | "holo" | "chrome";

export interface StickerDef {
	/** Stable identifier, also used as the test fixture name. */
	id: string;
	/** Drives how the shader lights it. */
	family: StickerFamily;
	/**
	 * Relative on-screen weight. A lightning bolt occupies far less of its
	 * square cell than a speech bubble, so it is scaled up to compensate.
	 */
	sizeScale: number;
	/**
	 * Traces the artwork silhouette, centred in an `s` x `s` cell. The atlas
	 * builder dilates this by `DIE_CUT_MARGIN` to get the actual cut line, so
	 * the white sticker border is derived rather than drawn twice.
	 */
	outline(path: Path2D, s: number): void;
	/**
	 * Paints the sticker. Clipped to the *dilated* silhouette, so filling the
	 * whole cell paints the die-cut border too. `art` is the un-dilated
	 * outline, for keylines and interior clips.
	 */
	paint(ctx: Ctx, s: number, rng: () => number, art: Path2D): void;
}

export type Ctx = CanvasRenderingContext2D;

/**
 * The subset of the canvas path API shared by `Path2D` and a 2D context, so a
 * shape helper can build either one.
 */
export type PathTarget = Pick<
	Path2D,
	"moveTo" | "lineTo" | "quadraticCurveTo" | "bezierCurveTo" | "arc" | "ellipse" | "closePath"
>;

/** Width of the white die-cut margin, as a fraction of the cell. */
export const DIE_CUT_MARGIN = 0.028;

export const TAU = Math.PI * 2;

export function rngFrom(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * A rounded blob: a rounded rectangle whose corner radii wobble slightly, so
 * hand-drawn shapes never look like a CSS `border-radius`.
 */
export function blob(
	path: PathTarget,
	cx: number,
	cy: number,
	w: number,
	h: number,
	radius: number,
	rng: () => number,
): void {
	const hw = w / 2;
	const hh = h / 2;
	const r = [0, 1, 2, 3].map(() => radius * (0.82 + rng() * 0.36));
	const clamped = r.map((value) => Math.min(value, hw * 0.98, hh * 0.98));
	path.moveTo(cx - hw + clamped[0], cy - hh);
	path.lineTo(cx + hw - clamped[1], cy - hh);
	path.quadraticCurveTo(cx + hw, cy - hh, cx + hw, cy - hh + clamped[1]);
	path.lineTo(cx + hw, cy + hh - clamped[2]);
	path.quadraticCurveTo(cx + hw, cy + hh, cx + hw - clamped[2], cy + hh);
	path.lineTo(cx - hw + clamped[3], cy + hh);
	path.quadraticCurveTo(cx - hw, cy + hh, cx - hw, cy + hh - clamped[3]);
	path.lineTo(cx - hw, cy - hh + clamped[0]);
	path.quadraticCurveTo(cx - hw, cy - hh, cx - hw + clamped[0], cy - hh);
	path.closePath();
}

/** A star with rounded valleys — reads as vinyl, not as clip art. */
export function star(
	path: PathTarget,
	cx: number,
	cy: number,
	outer: number,
	inner: number,
	points: number,
	rotation = -Math.PI / 2,
): void {
	const step = Math.PI / points;
	path.moveTo(cx + Math.cos(rotation) * outer, cy + Math.sin(rotation) * outer);
	for (let i = 1; i < points * 2; i += 1) {
		const radius = i % 2 === 0 ? outer : inner;
		const a = rotation + i * step;
		const px = cx + Math.cos(a) * radius;
		const py = cy + Math.sin(a) * radius;
		if (i % 2 === 1) {
			// Round the valley by cutting the corner with a short quadratic.
			const prev = rotation + (i - 1) * step;
			const next = rotation + (i + 1) * step;
			const cxp = cx + Math.cos(prev) * outer;
			const cyp = cy + Math.sin(prev) * outer;
			const cxn = cx + Math.cos(next) * outer;
			const cyn = cy + Math.sin(next) * outer;
			path.quadraticCurveTo(
				px + (cxp - px) * 0.12,
				py + (cyp - py) * 0.12,
				px + (cxn - px) * 0.06 + (px - cx) * 0.02,
				py + (cyn - py) * 0.06 + (py - cy) * 0.02,
			);
			path.lineTo(cxn, cyn);
			i += 1;
		} else {
			path.lineTo(px, py);
		}
	}
	path.closePath();
}

/** A four-point sparkle with concave edges. */
export function sparkle(path: PathTarget, cx: number, cy: number, r: number, waist = 0.22): void {
	const w = r * waist;
	path.moveTo(cx, cy - r);
	path.quadraticCurveTo(cx + w, cy - w, cx + r, cy);
	path.quadraticCurveTo(cx + w, cy + w, cx, cy + r);
	path.quadraticCurveTo(cx - w, cy + w, cx - r, cy);
	path.quadraticCurveTo(cx - w, cy - w, cx, cy - r);
	path.closePath();
}

/** Traces a polyline as a closed path. */
export function poly(path: PathTarget, points: readonly (readonly [number, number])[]): void {
	points.forEach(([x, y], index) => {
		if (index === 0) {
			path.moveTo(x, y);
		} else {
			path.lineTo(x, y);
		}
	});
	path.closePath();
}

/**
 * The holographic palette. Sampling it at a rotating offset is what gives the
 * baked artwork its rainbow; the shader then rotates the same wheel again by
 * view angle, so the sheen moves as the sticker turns.
 */
export const HOLO_STOPS = [
	"#7fdce6",
	"#8fb9ff",
	"#b79cff",
	"#ff97cf",
	"#ffab8d",
	"#ffe27a",
	"#86e0ab",
	"#7fdce6",
] as const;

/** An iridescent sweep across the cell at `angle` radians, offset around the wheel. */
export function holoGradient(ctx: Ctx, s: number, angle: number, offset: number): CanvasGradient {
	const half = s * 0.72;
	const dx = Math.cos(angle) * half;
	const dy = Math.sin(angle) * half;
	const gradient = ctx.createLinearGradient(s / 2 - dx, s / 2 - dy, s / 2 + dx, s / 2 + dy);
	// One sweep through the palette, not two. The baked artwork only supplies
	// the base tint; the shader's interference term owns the actual rainbow, and
	// stacking two full wheels reads as noise.
	const count = HOLO_STOPS.length;
	for (let i = 0; i < count; i += 1) {
		gradient.addColorStop(i / (count - 1), HOLO_STOPS[(i + Math.floor(offset * count)) % count]);
	}
	return gradient;
}

/** A polished-metal sweep: alternating dark and light bands, never a flat grey. */
export function chromeGradient(ctx: Ctx, s: number, angle = Math.PI / 2): CanvasGradient {
	const half = s * 0.62;
	const dx = Math.cos(angle) * half;
	const dy = Math.sin(angle) * half;
	const gradient = ctx.createLinearGradient(s / 2 - dx, s / 2 - dy, s / 2 + dx, s / 2 + dy);
	const bands: readonly [number, string][] = [
		[0, "#f4f6f8"],
		[0.16, "#c3cad2"],
		[0.3, "#8c96a2"],
		[0.42, "#e8edf2"],
		[0.55, "#ffffff"],
		[0.68, "#aab3bd"],
		[0.82, "#79838f"],
		[0.93, "#d3d9e0"],
		[1, "#f7f9fb"],
	];
	bands.forEach(([at, colour]) => gradient.addColorStop(at, colour));
	return gradient;
}

/** Near-black ink, matched to the reference's marker outlines. */
export const INK = "#15171b";
/** The die-cut paper white. Very slightly cool so it sits in a night scene. */
export const PAPER = "#fbfcfd";

/**
 * Hand-lettered text: each glyph gets a small seeded rotation, offset and size
 * jitter. Set-and-forget typography reads as a screenshot; this reads as a
 * marker pen, which is what the die-cut bubbles need.
 */
export function handLetter(
	ctx: Ctx,
	lines: readonly string[],
	cx: number,
	cy: number,
	fontSize: number,
	lineHeight: number,
	rng: () => number,
): void {
	ctx.save();
	ctx.fillStyle = INK;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `700 ${fontSize}px ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", system-ui, sans-serif`;

	const top = cy - ((lines.length - 1) * lineHeight) / 2;
	lines.forEach((line, lineIndex) => {
		const widths = Array.from(line, (char) => ctx.measureText(char).width);
		const total = widths.reduce((sum, width) => sum + width, 0);
		let x = cx - total / 2;
		const y = top + lineIndex * lineHeight;
		Array.from(line).forEach((char, index) => {
			const width = widths[index];
			ctx.save();
			ctx.translate(x + width / 2, y + (rng() - 0.5) * fontSize * 0.07);
			ctx.rotate((rng() - 0.5) * 0.075);
			const scale = 0.97 + rng() * 0.07;
			ctx.scale(scale, scale);
			ctx.fillText(char, 0, 0);
			ctx.restore();
			x += width;
		});
	});
	ctx.restore();
}

/**
 * Strokes a path with a slightly living line weight, so the marker outline is
 * not a uniform machine stroke.
 */
export function inkStroke(ctx: Ctx, s: number, weight: number, rng: () => number): void {
	ctx.save();
	ctx.strokeStyle = INK;
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	for (let pass = 0; pass < 2; pass += 1) {
		ctx.lineWidth = s * weight * (pass === 0 ? 1 : 0.55 + rng() * 0.2);
		ctx.globalAlpha = pass === 0 ? 1 : 0.35;
		ctx.stroke();
	}
	ctx.restore();
}

/** A soft specular streak, for chrome and holo faces. */
export function specularStreak(
	ctx: Ctx,
	s: number,
	angle: number,
	offset: number,
	strength: number,
): void {
	ctx.save();
	ctx.translate(s / 2, s / 2);
	ctx.rotate(angle);
	const gradient = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
	gradient.addColorStop(0, "rgba(255,255,255,0)");
	gradient.addColorStop(Math.max(0, offset - 0.09), "rgba(255,255,255,0)");
	gradient.addColorStop(offset, `rgba(255,255,255,${strength})`);
	gradient.addColorStop(Math.min(1, offset + 0.09), "rgba(255,255,255,0)");
	gradient.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = gradient;
	ctx.fillRect(-s, -s, s * 2, s * 2);
	ctx.restore();
}
