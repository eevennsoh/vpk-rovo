/**
 * Font loading for the @json-render/image Satori renderer.
 * Caches font data in memory after first load.
 */

const fs = require("fs");
const path = require("path");

let cachedFontData = null;

async function loadFonts() {
	if (cachedFontData) return cachedFontData;

	// Try loading Inter from public/fonts/ first
	const localPaths = [
		path.join(process.cwd(), "public", "fonts", "Inter-Regular.woff"),
		path.join(process.cwd(), "public", "fonts", "Inter-Regular.ttf"),
		path.join(process.cwd(), "public", "fonts", "inter-regular.woff"),
		path.join(process.cwd(), "public", "fonts", "inter.woff"),
	];

	for (const fontPath of localPaths) {
		try {
			const data = fs.readFileSync(fontPath);
			cachedFontData = [{ name: "Inter", data: data.buffer, weight: 400, style: "normal" }];
			return cachedFontData;
		} catch {
			// Try next path
		}
	}

	// Fallback: fetch from CDN
	try {
		const response = await fetch(
			"https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff"
		);
		if (response.ok) {
			const data = await response.arrayBuffer();
			cachedFontData = [{ name: "Inter", data, weight: 400, style: "normal" }];
			return cachedFontData;
		}
	} catch {
		// Fall through to system font fallback
	}

	// Minimal fallback — Satori requires at least one font
	cachedFontData = [];
	return cachedFontData;
}

module.exports = { loadFonts };
