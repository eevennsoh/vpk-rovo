const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadRovoAppLayoutHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import RovoAppLayout from "./app/rovo/layout.tsx";
				import { RovoChatProvider, useRovoChat } from "./app/contexts/context-rovo-chat.tsx";
				import { useRovoAppQueue } from "./app/rovo/rovo-queue-provider.tsx";

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
							RovoChatProvider,
							null,
							React.createElement(
								RovoAppLayout,
								null,
								React.createElement(Consumer),
							),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "rovo-layout-harness.tsx",
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

test("RovoAppLayout composes queue context with the root chat provider", async () => {
	const harness = await loadRovoAppLayoutHarness();

	assert.equal(harness.renderLayout(), "<div>0</div>");
});
