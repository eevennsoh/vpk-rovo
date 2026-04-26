const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

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
	assert.match(APP_LAYOUT_SOURCE, /THEME_FAVICON_FALLBACK_PATH/);
	assert.match(
		APP_LAYOUT_SOURCE,
		/new URL\(href, window\.location\.href\)\.pathname === themeFaviconFallbackPath;/,
	);
	assert.match(
		APP_LAYOUT_SOURCE,
		/!isThemeFaviconLink\(iconLink\) && !isThemeFaviconFallbackLink\(iconLink\)/,
	);
});

async function loadThemeFaviconHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import { hasCompetingFaviconMutation } from "./lib/theme-favicon.ts";

				export function needsCleanup(records) {
					return hasCompetingFaviconMutation(records);
				}
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "theme-favicon-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	const compiledModule = { exports: {} };
	const compileModule = new Function(
		"require",
		"module",
		"exports",
		result.outputFiles[0].text,
	);
	compileModule(require, compiledModule, compiledModule.exports);
	return compiledModule.exports;
}

function createLinkNode({ rel = "icon", theme = false } = {}) {
	return {
		getAttribute(name) {
			if (name === "rel") {
				return rel;
			}

			if (name === "data-vpk-theme-favicon") {
				return theme ? "true" : null;
			}

			return null;
		},
		matches(selector) {
			return selector === 'link[rel~="icon"]' && rel.split(/\s+/).includes("icon");
		},
	};
}

test("hasCompetingFaviconMutation ignores non-icon head mutations", async () => {
	const harness = await loadThemeFaviconHarness();
	const records = [
		{
			addedNodes: [
				{
					getAttribute() {
						return null;
					},
					matches() {
						return false;
					},
				},
			],
		},
	];

	assert.equal(harness.needsCleanup(records), false);
});

test("hasCompetingFaviconMutation ignores theme favicon nodes", async () => {
	const harness = await loadThemeFaviconHarness();
	const records = [{ addedNodes: [createLinkNode({ theme: true })] }];

	assert.equal(harness.needsCleanup(records), false);
});

test("hasCompetingFaviconMutation detects competing favicon nodes", async () => {
	const harness = await loadThemeFaviconHarness();
	const records = [{ addedNodes: [createLinkNode()] }];

	assert.equal(harness.needsCleanup(records), true);
});
