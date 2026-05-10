const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadNoisePreviewHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import { NoisePreviewSurface } from "./components/website/demos/visual/noise-preview-surface.tsx";

				export function renderPreview() {
					return renderToStaticMarkup(
						React.createElement(NoisePreviewSurface, {
							opacity: 0.36,
							grainSize: 96,
							seed: 7,
							color: "#FFFFFF",
							blendMode: "overlay",
						}),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "noise-preview-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("Noise preview renders a varied backdrop with an isolated visible overlay", async () => {
	const harness = await loadNoisePreviewHarness();
	const html = harness.renderPreview();

	assert.match(html, /class="[^"]*\bisolate\b/);
	assert.match(html, /radial-gradient/);
	assert.match(html, /data:image\/svg\+xml/);
	assert.match(html, /mix-blend-mode:overlay/);
	assert.match(html, /background-size:96px 96px/);
	assert.doesNotMatch(html, />Overlay</);
	assert.doesNotMatch(html, />Noise</);
});
