const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

async function loadWebsiteHeaderHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import { ThemeWrapper } from "./components/utils/theme-wrapper.tsx";
				import { WebsiteHeader } from "./components/website/website-header.tsx";

				export function renderHeader() {
					return renderToString(
						React.createElement(
							ThemeWrapper,
							null,
							React.createElement(WebsiteHeader, {
								packageName: "@vpk",
								leftContent: React.createElement("div", null, "tabs"),
							}),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "website-header-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		loader: {
			".css": "empty",
		},
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

test("WebsiteHeader keeps the sticky docs navigation above preview content", async () => {
	const harness = await loadWebsiteHeaderHarness();
	const markup = harness.renderHeader();

	assert.match(markup, /<header class="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-surface">/);
});
