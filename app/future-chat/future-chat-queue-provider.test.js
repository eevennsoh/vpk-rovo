const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

async function loadQueueProviderHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import {
					FutureChatQueueBoundary,
					FutureChatQueueProvider,
					useFutureChatQueue,
				} from "./app/future-chat/future-chat-queue-provider.tsx";

				function QueueConsumer() {
					useFutureChatQueue();
					return React.createElement("div", null, "ready");
				}

				export function renderWithoutProvider() {
					return renderToString(
						React.createElement(
							FutureChatQueueBoundary,
							null,
							React.createElement(QueueConsumer),
						),
					);
				}

				export function renderWithProvider() {
					return renderToString(
						React.createElement(
							FutureChatQueueProvider,
							null,
							React.createElement(
								FutureChatQueueBoundary,
								null,
								React.createElement(QueueConsumer),
							),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "future-chat-queue-provider-harness.tsx",
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

test("FutureChatQueueBoundary provides queue context when mounted outside the route layout", async () => {
	const harness = await loadQueueProviderHarness();

	assert.equal(harness.renderWithoutProvider(), "<div>ready</div>");
});

test("FutureChatQueueBoundary reuses an existing queue provider", async () => {
	const harness = await loadQueueProviderHarness();

	assert.equal(harness.renderWithProvider(), "<div>ready</div>");
});
