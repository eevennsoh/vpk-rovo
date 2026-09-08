/**
 * Bakes every sticker into two texture atlases at runtime.
 *
 *   `art`     RGBA — the painted die-cut artwork.
 *   `surface` RGBA — R: dome height, G: micro-roughness, B: holographic film
 *                    thickness, A: die-cut coverage.
 *
 * The surface map is what turns flat artwork into a lit object. Height is the
 * blurred silhouette: the shader differentiates it into a normal, so the vinyl
 * has a real domed edge that catches light as the sticker turns. Nothing is
 * fetched over the network and nothing is checked in as a binary.
 */

import * as THREE from "three";

import { ALL_STICKERS } from "./art";
import type { StickerFamily } from "./art/art-kit";
import { DIE_CUT_MARGIN, rngFrom } from "./art/art-kit";

/**
 * Artwork is drawn into this fraction of its cell, leaving a gutter so the
 * die-cut dilation and the mip chain never bleed into the neighbouring cell.
 */
export const CONTENT_SCALE = 0.86;

/** Blur radius for the dome height, as a fraction of the cell. */
const DOME_BLUR = 0.055;

const FAMILY_INDEX: Record<StickerFamily, number> = { paper: 0, holo: 1, chrome: 2 };

export interface StickerAtlas {
	art: THREE.CanvasTexture;
	surface: THREE.CanvasTexture;
	columns: number;
	rows: number;
	count: number;
	/** Per-sticker relative on-screen weight. */
	sizeScales: Float32Array;
	/** Per-sticker family index: 0 paper, 1 holo, 2 chrome. */
	families: Float32Array;
	dispose(): void;
}

function createCanvas(size: number): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	return canvas;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) {
		throw new Error("Dropzone effect: 2D canvas context unavailable");
	}
	return ctx;
}

/**
 * Low-frequency swirl standing in for film thickness across the sticker face.
 * Uniform thickness bands the whole sticker one colour at a time; varying it is
 * what makes the foil look poured rather than printed.
 */
function filmThickness(x: number, y: number, seed: number): number {
	// Deliberately low frequency: two or three broad zones across a sticker,
	// not a contour map. The shader multiplies this into an interference phase
	// that already cycles several times, so a busy thickness map compounds into
	// oil-slick camouflage instead of foil.
	const a = Math.sin(x * 2.1 + seed) * Math.cos(y * 1.7 - seed * 1.3);
	const b = Math.sin((x + y) * 2.9 + seed * 2.3) * 0.4;
	const c = Math.sin(x * 4.3 - y * 3.7 + seed * 3.1) * 0.14;
	return (a + b + c) * 0.5 + 0.5;
}

/** Fine grain that gives the specular lobe something to break up on. */
function microRoughness(x: number, y: number, seed: number): number {
	const n = Math.sin(x * 137.1 + seed) * 43758.5453 + Math.cos(y * 91.7 - seed) * 12345.6789;
	return (n - Math.floor(n)) * 0.5 + 0.25;
}

/**
 * Builds both atlases. Call once per mount; the result is shared by every
 * instance in the field.
 */
export function buildStickerAtlas(cell = 320): StickerAtlas {
	const count = ALL_STICKERS.length;
	const columns = Math.ceil(Math.sqrt(count));
	const rows = Math.ceil(count / columns);

	const artCanvas = createCanvas(0);
	artCanvas.width = columns * cell;
	artCanvas.height = rows * cell;
	const artCtx = context2d(artCanvas);

	const surfaceCanvas = createCanvas(0);
	surfaceCanvas.width = columns * cell;
	surfaceCanvas.height = rows * cell;
	const surfaceCtx = context2d(surfaceCanvas);

	// Scratch buffers, reused per sticker.
	const maskCanvas = createCanvas(cell);
	const maskCtx = context2d(maskCanvas);
	const cellCanvas = createCanvas(cell);
	const cellCtx = context2d(cellCanvas);
	const blurCanvas = createCanvas(cell);
	const blurCtx = context2d(blurCanvas);

	const sizeScales = new Float32Array(count);
	const families = new Float32Array(count);

	const contentMatrix = new DOMMatrix()
		.translate(cell / 2, cell / 2)
		.scale(CONTENT_SCALE)
		.translate(-cell / 2, -cell / 2);

	ALL_STICKERS.forEach((def, index) => {
		const column = index % columns;
		const row = Math.floor(index / columns);
		const originX = column * cell;
		const originY = row * cell;
		sizeScales[index] = def.sizeScale;
		families[index] = FAMILY_INDEX[def.family];

		// --- silhouette -----------------------------------------------------
		const raw = new Path2D();
		def.outline(raw, cell);
		const placed = new Path2D();
		placed.addPath(raw, contentMatrix);

		// Dilating the outline by a fat round stroke *is* the die-cut: it is an
		// exact outward offset, and canvas has no path-offset primitive.
		maskCtx.clearRect(0, 0, cell, cell);
		maskCtx.fillStyle = "#fff";
		maskCtx.strokeStyle = "#fff";
		maskCtx.lineJoin = "round";
		maskCtx.lineCap = "round";
		maskCtx.lineWidth = cell * DIE_CUT_MARGIN * 2;
		maskCtx.fill(placed);
		maskCtx.stroke(placed);

		// --- artwork --------------------------------------------------------
		cellCtx.clearRect(0, 0, cell, cell);
		cellCtx.save();
		cellCtx.setTransform(contentMatrix);
		def.paint(cellCtx, cell, rngFrom(index * 7919 + 13), raw);
		cellCtx.restore();
		// Clip the painted cell to the die-cut.
		cellCtx.globalCompositeOperation = "destination-in";
		cellCtx.drawImage(maskCanvas, 0, 0);
		cellCtx.globalCompositeOperation = "source-over";
		artCtx.drawImage(cellCanvas, originX, originY);

		// --- surface --------------------------------------------------------
		blurCtx.clearRect(0, 0, cell, cell);
		blurCtx.filter = `blur(${cell * DOME_BLUR}px)`;
		blurCtx.drawImage(maskCanvas, 0, 0);
		blurCtx.filter = "none";

		const blurred = blurCtx.getImageData(0, 0, cell, cell);
		const crisp = maskCtx.getImageData(0, 0, cell, cell);
		const out = surfaceCtx.createImageData(cell, cell);
		const seed = index * 1.618;
		for (let p = 0; p < cell * cell; p += 1) {
			const px = (p % cell) / cell;
			const py = Math.floor(p / cell) / cell;
			const o = p * 4;
			// sqrt pushes the ramp up fast at the edge: a steep shoulder, which
			// is what makes a vinyl sticker's rim catch the light.
			const height = Math.sqrt(blurred.data[o + 3] / 255);
			out.data[o] = height * 255;
			out.data[o + 1] = microRoughness(px, py, seed) * 255;
			out.data[o + 2] = filmThickness(px, py, seed) * 255;
			out.data[o + 3] = crisp.data[o + 3];
		}
		surfaceCtx.putImageData(out, originX, originY);
	});

	const art = new THREE.CanvasTexture(artCanvas);
	art.colorSpace = THREE.SRGBColorSpace;
	const surface = new THREE.CanvasTexture(surfaceCanvas);
	surface.colorSpace = THREE.NoColorSpace;

	[art, surface].forEach((texture) => {
		texture.wrapS = THREE.ClampToEdgeWrapping;
		texture.wrapT = THREE.ClampToEdgeWrapping;
		texture.minFilter = THREE.LinearMipmapLinearFilter;
		texture.magFilter = THREE.LinearFilter;
		texture.generateMipmaps = true;
		texture.anisotropy = 4;
		texture.needsUpdate = true;
	});

	return {
		art,
		surface,
		columns,
		rows,
		count,
		sizeScales,
		families,
		dispose() {
			art.dispose();
			surface.dispose();
		},
	};
}
