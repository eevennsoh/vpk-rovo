const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadStudioAppLayoutHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import StudioAppLayout from "./app/studio/layout.tsx";
				import { RovoChatProvider, useRovoChat } from "./app/contexts/context-rovo-chat.tsx";
				import { useRovoAppQueue } from "./app/studio/rovo-queue-provider.tsx";

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
								StudioAppLayout,
								null,
								React.createElement(Consumer),
							),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "studio-layout-harness.tsx",
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

test("StudioAppLayout composes the Studio queue context with the root chat provider", async () => {
	const harness = await loadStudioAppLayoutHarness();

	assert.equal(harness.renderLayout(), "<div>0</div>");
});
