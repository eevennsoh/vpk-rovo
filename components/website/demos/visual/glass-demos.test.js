const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function renderDemoMarkup(entryPoint, sourcefile) {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import Demo from "${entryPoint}";

				export function renderDemo() {
					return renderToStaticMarkup(React.createElement(Demo));
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile,
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		loader: {
			".css": "empty",
		},
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text).renderDemo();
}

test("GlassTabsDemo renders the control without the extra showcase copy or card wrapper", async () => {
	const markup = await renderDemoMarkup(
		"./components/website/demos/visual/glass-tabs-demo.tsx",
		"glass-tabs-demo-harness.tsx",
	);

	assert.doesNotMatch(markup, /Shared weather chrome extracted into a reusable glass tab surface\./);
	assert.doesNotMatch(markup, /border border-border px-6 py-10/);
	assert.match(markup, /role="radiogroup"/);
});

test("GlassSliderDemo renders the slider without the extra showcase card wrapper", async () => {
	const markup = await renderDemoMarkup(
		"./components/website/demos/visual/glass-slider-demo.tsx",
		"glass-slider-demo-harness.tsx",
	);

	assert.doesNotMatch(markup, /class="relative overflow-hidden border border-border"/);
	assert.match(markup, /group\/city-rail/);
});

test("LogoGlassDemo renders the image control and extended glass sections", async () => {
	const markup = await renderDemoMarkup(
		"./components/website/demos/visual/logo-glass-demo.tsx",
		"logo-glass-demo-harness.tsx",
	);

	assert.match(markup, /type="file"/);
	assert.match(markup, /Lens Warp/);
	assert.match(markup, /Lighting/);
});
