const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadTodoPageHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import TodoPage from "./app/todo/page.tsx";

				export function renderPage() {
					return renderToString(React.createElement(TodoPage));
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "todo-page-harness.tsx",
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

test("TodoPage renders a stable new task input id for SSR", async () => {
	const harness = await loadTodoPageHarness();
	const markup = harness.renderPage();

	assert.match(markup, /for="todo-new-task-input"/);
	assert.match(markup, /id="todo-new-task-input"/);
});
