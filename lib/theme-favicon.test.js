const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const THEME_FAVICON_FILE = path.join(__dirname, "theme-favicon.ts");
const APP_LAYOUT_FILE = path.join(__dirname, "..", "app", "layout.tsx");

const THEME_FAVICON_SOURCE = fs.readFileSync(THEME_FAVICON_FILE, "utf8");
const APP_LAYOUT_SOURCE = fs.readFileSync(APP_LAYOUT_FILE, "utf8");

test("theme favicon helper preserves the existing favicon.ico fallback", () => {
	assert.match(
		THEME_FAVICON_SOURCE,
		/export const THEME_FAVICON_FALLBACK_PATH = "\/favicon\.ico";/,
	);
	assert.match(
		THEME_FAVICON_SOURCE,
		/new URL\(href, window\.location\.href\)\.pathname === THEME_FAVICON_FALLBACK_PATH;/,
	);
	assert.match(
		THEME_FAVICON_SOURCE,
		/!isThemeFaviconLink\(iconLink\) && !isThemeFaviconFallbackLink\(iconLink\)/,
	);
});

test("pre-hydration favicon script also preserves the favicon.ico fallback", () => {
	assert.match(
		APP_LAYOUT_SOURCE,
		/THEME_FAVICON_FALLBACK_PATH/,
	);
	assert.match(
		APP_LAYOUT_SOURCE,
		/new URL\(href, window\.location\.href\)\.pathname === themeFaviconFallbackPath;/,
	);
	assert.match(
		APP_LAYOUT_SOURCE,
		/!isThemeFaviconLink\(iconLink\) && !isThemeFaviconFallbackLink\(iconLink\)/,
	);
});
