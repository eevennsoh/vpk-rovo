const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadHtmlPreviewHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import { HtmlPreviewFrame } from "./components/projects/shared/components/preview-body-renderer.tsx";

				export function renderHtmlPreviewFrame() {
					return renderToString(
						React.createElement(HtmlPreviewFrame, {
							html: "<!doctype html><html><body><h1>Report</h1></body></html>",
							title: "Work item report",
						}),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "preview-body-renderer-html-harness.tsx",
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

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("HtmlPreviewFrame renders generated HTML in a sandboxed srcDoc iframe", async () => {
	const harness = await loadHtmlPreviewHarness();
	const markup = harness.renderHtmlPreviewFrame();

	assert.match(markup, /<iframe/);
	assert.match(markup, /sandbox=""/);
	assert.match(markup, /srcDoc="&lt;!doctype html&gt;/);
	assert.match(markup, /title="Work item report"/);
});
