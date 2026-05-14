const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadQueueProviderHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import {
					RovoAppQueueBoundary,
					RovoAppQueueProvider,
					useRovoAppQueue,
				} from "./app/rovo/rovo-queue-provider.tsx";

				function QueueConsumer() {
					const queue = useRovoAppQueue();
					const nextAction = queue.peekNextQueuedActionForThread("thread-1");
					return React.createElement("div", null, nextAction ? nextAction.text : "ready");
				}

				export function renderWithoutProvider() {
					return renderToString(
						React.createElement(
							RovoAppQueueBoundary,
							null,
							React.createElement(QueueConsumer),
						),
					);
				}

				export function renderWithProvider() {
					return renderToString(
						React.createElement(
							RovoAppQueueProvider,
							null,
							React.createElement(
								RovoAppQueueBoundary,
								null,
								React.createElement(QueueConsumer),
							),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "rovo-queue-provider-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("RovoAppQueueBoundary provides queue context when mounted outside the route layout", async () => {
	const harness = await loadQueueProviderHarness();

	assert.equal(harness.renderWithoutProvider(), "<div>ready</div>");
});

test("RovoAppQueueBoundary reuses an existing queue provider", async () => {
	const harness = await loadQueueProviderHarness();

	assert.equal(harness.renderWithProvider(), "<div>ready</div>");
});
