import html2canvas from "html2canvas";

// ---------------------------------------------------------------------------
// Viewport capture utility for Clicky AI cursor companion.
// Uses html2canvas to render the DOM to a canvas, then exports as base64 JPEG.
// ---------------------------------------------------------------------------

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.7;
const CLICKY_OVERLAY_SELECTOR = "[data-clicky-overlay]";

export interface CaptureResult {
	base64: string;
	width: number;
	height: number;
}

/**
 * Capture the current viewport as a base64-encoded JPEG.
 * Hides the Clicky overlay during capture so it doesn't appear in the image.
 * Resizes to cap the longest dimension at 1280px for token efficiency.
 */
export async function captureViewport(): Promise<CaptureResult | null> {
	const overlay = document.querySelector(CLICKY_OVERLAY_SELECTOR) as HTMLElement | null;

	try {
		// Hide overlay during capture
		if (overlay) {
			overlay.style.display = "none";
		}

		const canvas = await html2canvas(document.body, {
			useCORS: true,
			allowTaint: true,
			logging: false,
			scale: 1, // Force 1:1 CSS pixel mapping (ignore devicePixelRatio)
			width: window.innerWidth,
			height: window.innerHeight,
			windowWidth: window.innerWidth,
			windowHeight: window.innerHeight,
			x: window.scrollX,
			y: window.scrollY,
		});

		// Restore overlay
		if (overlay) {
			overlay.style.display = "";
		}

		// Resize if needed
		const { width, height } = canvas;
		const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
		const targetWidth = Math.round(width * scale);
		const targetHeight = Math.round(height * scale);

		let outputCanvas: HTMLCanvasElement;

		if (scale < 1) {
			outputCanvas = document.createElement("canvas");
			outputCanvas.width = targetWidth;
			outputCanvas.height = targetHeight;
			const ctx = outputCanvas.getContext("2d");
			if (!ctx) return null;
			ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
		} else {
			outputCanvas = canvas;
		}

		const dataUrl = outputCanvas.toDataURL("image/jpeg", JPEG_QUALITY);
		// Strip "data:image/jpeg;base64," prefix
		const base64 = dataUrl.split(",")[1];

		return {
			base64,
			width: targetWidth,
			height: targetHeight,
		};
	} catch {
		// Restore overlay on error
		if (overlay) {
			overlay.style.display = "";
		}
		return null;
	}
}
