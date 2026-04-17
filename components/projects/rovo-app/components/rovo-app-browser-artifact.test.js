const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

async function loadRovoAppBrowserArtifactHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import { RovoAppBrowserArtifact } from "./components/projects/rovo-app/components/rovo-app-browser-artifact.tsx";

				export function renderRovoAppBrowserArtifact() {
					return renderToString(
						React.createElement(RovoAppBrowserArtifact, {
							onClose: () => {},
							screenshot: null,
							status: "ready",
							title: "Example Domain",
							url: "https://example.com",
							workspaceId: null,
						}),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "rovo-app-browser-artifact-harness.tsx",
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

test("RovoAppBrowserArtifact renders the inline preview as a passive surface", async () => {
	const harness = await loadRovoAppBrowserArtifactHarness();
	const markup = harness.renderRovoAppBrowserArtifact();

	assert.match(markup, /aria-label="Example Domain"/);
	assert.match(markup, />https:\/\/example\.com<\/span>/);
	assert.doesNotMatch(markup, /role="application"/);
	assert.doesNotMatch(markup, /tabindex="0"/);
});
