const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadRovoAppShellPaneLayoutHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import { RovoAppShellPaneLayout } from "./components/projects/rovo-app/components/rovo-app-shell-pane-layout.tsx";

				function renderLayout(shouldSplitArtifactPane) {
					return renderToString(
						React.createElement(RovoAppShellPaneLayout, {
							artifactOrigin: { left: 16, top: 24, width: 320, height: 96 },
							artifactPane: React.createElement("aside", { id: "artifact-pane" }, "artifact"),
							artifactPanelId: "artifact-pane-panel",
							chatPane: React.createElement("section", { id: "chat-pane" }, "chat"),
							chatPanelId: "chat-pane-panel",
							minArtifactPaneWidth: 320,
							minChatPaneWidth: 440,
							onArtifactSplitLayoutChanged: () => {},
							shouldSplitArtifactPane,
							shellSize: { width: 1280, height: 720 },
							splitArtifactPaneDefaultSize: 480,
							splitChatPaneDefaultSize: 800,
							splitChatPaneMaxSize: 800,
						}),
					);
				}

				export function renderStackedLayout() {
					return renderLayout(false);
				}

				export function renderSplitLayout() {
					return renderLayout(true);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "rovo-app-shell-pane-layout-harness.tsx",
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

test("RovoAppShellPaneLayout keeps the chat pane inside a stable resizable group in stacked mode", async () => {
	const harness = await loadRovoAppShellPaneLayoutHarness();
	const markup = harness.renderStackedLayout();

	assert.match(markup, /data-slot="resizable-panel-group"/);
	assert.match(markup, /id="chat-pane-panel"/);
	assert.match(markup, /<section id="chat-pane">chat<\/section>/);
	assert.match(markup, /id="artifact-pane"/);
	assert.doesNotMatch(markup, /data-slot="resizable-handle"/);
});

test("RovoAppShellPaneLayout renders the split artifact panel alongside the stable chat pane", async () => {
	const harness = await loadRovoAppShellPaneLayoutHarness();
	const markup = harness.renderSplitLayout();

	assert.match(markup, /data-slot="resizable-panel-group"/);
	assert.match(markup, /id="chat-pane-panel"/);
	assert.match(markup, /<section id="chat-pane">chat<\/section>/);
	assert.match(markup, /data-slot="resizable-handle"/);
	assert.match(markup, /id="artifact-pane-panel"/);
	assert.match(markup, /<aside id="artifact-pane">artifact<\/aside>/);
});
