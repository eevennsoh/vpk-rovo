const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

async function loadToolOutputHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import { ToolOutput } from "./components/ui-ai/tool.tsx";

				export function renderToolOutput(props) {
					return renderToString(React.createElement(ToolOutput, props));
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "tool-output-harness.tsx",
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

test("ToolOutput renders exact raw structured output for successful tool results", async () => {
	const harness = await loadToolOutputHarness();
	const markup = harness.renderToolOutput({
		output: {
			manager: {
				name: "David Hoang",
			},
		},
		outputPreview: "Success",
		outputTruncated: true,
		outputBytes: 2048,
		errorText: undefined,
	});

	assert.match(markup, /David Hoang/);
	assert.doesNotMatch(markup, />Success</);
	assert.doesNotMatch(markup, /Result preview truncated for display/);
});
