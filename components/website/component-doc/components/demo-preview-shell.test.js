const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

async function loadDemoPreviewShellHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { token } from "./lib/tokens";
				import { DemoPreviewShell } from "./components/website/component-doc/components/demo-preview-shell.tsx";

				export function getShellStyles() {
					const defaultShell = DemoPreviewShell({
						children: React.createElement("div", null, "demo"),
					});
					const fullPageShell = DemoPreviewShell({
						children: React.createElement("div", null, "demo"),
						fullPage: true,
					});

					return {
						surface: token("elevation.surface"),
						defaultStyle: defaultShell.props.style,
						fullPageStyle: fullPageShell.props.style,
					};
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "demo-preview-shell-harness.tsx",
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

test("DemoPreviewShell keeps a raised surface background in embedded and full-page previews", async () => {
	const harness = await loadDemoPreviewShellHarness();
	const { surface, defaultStyle, fullPageStyle } = harness.getShellStyles();

	assert.equal(defaultStyle.backgroundColor, surface);
	assert.equal(fullPageStyle.backgroundColor, surface);
});
