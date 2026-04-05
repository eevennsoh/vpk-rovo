const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");

async function loadFutureChatLayoutHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import FutureChatLayout from "./app/future-chat/layout.tsx";
				import { useRovoChat } from "./app/contexts/context-rovo-chat.tsx";
				import { useFutureChatQueue } from "./app/future-chat/future-chat-queue-provider.tsx";

				function Consumer() {
					const chat = useRovoChat();
					const queue = useFutureChatQueue();
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
							FutureChatLayout,
							null,
							React.createElement(Consumer),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "future-chat-layout-harness.tsx",
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

test("FutureChatLayout provides chat and queue context to nested consumers", async () => {
	const harness = await loadFutureChatLayoutHarness();

	assert.equal(harness.renderLayout(), "<div>0</div>");
});
