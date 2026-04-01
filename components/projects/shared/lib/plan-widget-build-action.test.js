"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
	runPlanBuildAndCollapse,
} = require("./plan-widget-build-action.ts");

test("collapses the plan card after a successful build action resolves", async () => {
	const events = [];

	await runPlanBuildAndCollapse(async () => {
		events.push("build:start");
		await Promise.resolve();
		events.push("build:end");
	}, () => {
		events.push("collapse");
	});

	assert.deepEqual(events, ["build:start", "build:end", "collapse"]);
});

test("does not collapse the plan card when the build action fails", async () => {
	let collapsed = false;

	await assert.rejects(
		runPlanBuildAndCollapse(async () => {
			throw new Error("build failed");
		}, () => {
			collapsed = true;
		}),
		/build failed/,
	);

	assert.equal(collapsed, false);
});
