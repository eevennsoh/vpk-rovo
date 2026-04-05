const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

async function loadRovoAppLayoutHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import RovoAppLayout from "./app/rovo-app/layout.tsx";
				import { useRovoChat } from "./app/contexts/context-rovo-chat.tsx";
				import { useRovoAppQueue } from "./app/rovo-app/rovo-app-queue-provider.tsx";

				function Consumer() {
					const chat = useRovoChat();
					const queue = useRovoAppQueue();
					const nextAction = queue.peekNextQueuedActionForThread("thread-1");
					return React.createElement(
						"div",
						null,
						nextAction ? nextAction.text : String(chat.queueCount),
					);
				}

				export function renderLayout() {
					return renderToString(
						React.createElement(
							RovoAppLayout,
							null,
							React.createElement(Consumer),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "rovo-app-layout-harness.tsx",
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

test("RovoAppLayout provides chat and queue context to nested consumers", async () => {
	const harness = await loadRovoAppLayoutHarness();

	assert.equal(harness.renderLayout(), "<div>0</div>");
});
