const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadContextBarHarness() {
	const mockModules = new Map([
		[
			"@/components/ui/tag",
			`
				import React from "react";
				export function Tag(props) {
					return React.createElement(
						"span",
						{ "data-slot": "tag", "data-color": props.color },
						props.elemBefore,
						React.createElement("span", { "data-tag-text": true }, props.children),
					);
				}
			`,
		],
		[
			"@atlaskit/icon/core/cross",
			`
				import React from "react";
				export default function CrossIcon(props) {
					return React.createElement("svg", { "data-icon": "cross", "data-size": props.size });
				}
			`,
		],
	]);

	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToStaticMarkup } from "react-dom/server";
				import {
					CollapsibleContextBar,
					ContextBar,
					ContextBarLead,
					ContextBarTag,
					ContextBarTrigger,
				} from "./components/ui-custom/context-bar/context-bar.tsx";

				export function renderBar(dismissible) {
					return renderToStaticMarkup(
						React.createElement(
							ContextBar,
							{ onDismiss: dismissible ? () => {} : undefined, dismissLabel: "Close it" },
							React.createElement(ContextBarLead, { icon: React.createElement("svg", { "data-icon": "lead" }) }, "Edit:"),
							React.createElement(ContextBarTag, { title: "Agent name" }, "Agent name"),
						),
					);
				}

				export function renderTrigger() {
					return renderToStaticMarkup(
						React.createElement(ContextBarTrigger, { onClick: () => {} }, "Edit agent"),
					);
				}

				export function renderCollapsible(defaultOpen) {
					return renderToStaticMarkup(
						React.createElement(
							CollapsibleContextBar,
							{
								defaultOpen,
								leadLabel: "Edit:",
								collapsedLabel: "Edit agent",
								dismissLabel: "Close it",
							},
							React.createElement(ContextBarTag, { title: "Agent name" }, "Agent name"),
						),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "context-bar-harness.tsx",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
		plugins: [
			{
				name: "context-bar-test-mocks",
				setup(build) {
					build.onResolve({ filter: /.*/ }, (args) => {
						if (!mockModules.has(args.path)) {
							return undefined;
						}
						return { path: args.path, namespace: "context-bar-test-mock" };
					});
					build.onLoad({ filter: /.*/, namespace: "context-bar-test-mock" }, (args) => ({
						contents: mockModules.get(args.path),
						loader: "tsx",
						resolveDir: process.cwd(),
					}));
				},
			},
		],
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("ContextBar renders an interactive dismiss when onDismiss is provided", async () => {
	const harness = await loadContextBarHarness();
	const markup = harness.renderBar(true);

	assert.match(markup, /data-context-bar/);
	assert.match(markup, /Edit:/);
	assert.match(markup, /aria-label="Close it"/);
	assert.match(markup, /<button/);
	assert.match(markup, /data-icon="cross"/);
});

test("ContextBar renders a non-interactive placeholder without onDismiss", async () => {
	const harness = await loadContextBarHarness();
	const markup = harness.renderBar(false);

	assert.match(markup, /data-icon="cross"/);
	assert.doesNotMatch(markup, /<button/);
});

test("ContextBarTrigger renders a labelled pill button", async () => {
	const harness = await loadContextBarHarness();
	const markup = harness.renderTrigger();

	assert.match(markup, /data-context-bar-trigger/);
	assert.match(markup, /<button/);
	assert.match(markup, /Edit agent/);
});

test("CollapsibleContextBar starts expanded and can collapse to a trigger", async () => {
	const harness = await loadContextBarHarness();

	const open = harness.renderCollapsible(true);
	assert.match(open, /data-context-bar/);
	assert.match(open, /Edit:/);
	assert.match(open, /aria-label="Close it"/);
	assert.doesNotMatch(open, /data-context-bar-trigger/);

	const collapsed = harness.renderCollapsible(false);
	assert.match(collapsed, /data-context-bar-trigger/);
	assert.match(collapsed, /Edit agent/);
	assert.doesNotMatch(collapsed, /aria-label="Close it"/);
});
