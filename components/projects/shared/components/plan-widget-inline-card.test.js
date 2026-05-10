const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));
const test = require("node:test");
const esbuild = require("esbuild");

async function loadPlanWidgetInlineCardHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				import React from "react";
				import { renderToString } from "react-dom/server";
				import { PlanWidgetInlineCard } from "./components/projects/shared/components/plan-widget-inline-card.tsx";

				const tasks = [
					{
						id: "task-1",
						label: "Build the dashboard shell",
						status: "pending",
					},
				];

				export function renderCollapsedPlanWidgetInlineCard() {
					return renderToString(
						React.createElement(PlanWidgetInlineCard, {
							collapsed: true,
							description: "Build a new dashboard artifact.",
							shortDescription: "Build a new dashboard artifact.",
							tasks,
							title: "My Dashboard",
						}),
					);
				}
			`,
			loader: "tsx",
			resolveDir: process.cwd(),
			sourcefile: "plan-widget-inline-card-harness.tsx",
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

test("PlanWidgetInlineCard collapsed mode renders a single button for the disclosure bubble", async () => {
	const harness = await loadPlanWidgetInlineCardHarness();
	const markup = harness.renderCollapsedPlanWidgetInlineCard();
	const buttonMatches = [...markup.matchAll(/<button\b/g)];

	assert.equal(buttonMatches.length, 1);
	assert.match(markup, /aria-expanded="false"/);
	assert.match(markup, />My Dashboard<\/span>/);
});
