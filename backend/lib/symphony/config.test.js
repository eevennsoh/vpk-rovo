"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { normalizeWorkflowConfig, resolveEnvReferences, resolvePath } = require("./config");

test("resolveEnvReferences expands exact environment placeholders strictly", () => {
	assert.equal(resolveEnvReferences("$LINEAR_API_KEY", { LINEAR_API_KEY: "lin_123" }), "lin_123");
	assert.equal(resolveEnvReferences("prefix-$LINEAR_API_KEY", { LINEAR_API_KEY: "lin_123" }), "prefix-$LINEAR_API_KEY");
	assert.throws(() => resolveEnvReferences("$MISSING", {}), /Required environment variable is not set/);
});

test("normalizeWorkflowConfig applies defaults and resolves paths", () => {
	const config = normalizeWorkflowConfig(
		{
			tracker: {
				api_key: "$LINEAR_API_KEY",
				team: "ENG",
			},
			workspace: {
				root: "./workspaces",
			},
			dispatch: {
				max_parallel: 2,
			},
		},
		{
			env: { LINEAR_API_KEY: "lin_123" },
			workflowDir: "/tmp/symphony-test",
		},
	);

	assert.equal(config.tracker.apiKey, "lin_123");
	assert.equal(config.tracker.team, "ENG");
	assert.equal(config.workspace.root, "/tmp/symphony-test/workspaces");
	assert.equal(config.dispatch.maxParallel, 2);
	assert.deepEqual(config.tracker.landingStates, ["Merging"]);
	assert.equal(config.tracker.reviewState, "Human Review");
	assert.equal(config.tracker.reworkState, "Rework");
	assert.equal(config.tracker.mergeState, "Merging");
	assert.deepEqual(config.validation.commands, ["pnpm run lint", "pnpm run typecheck"]);
	assert.equal(config.github.allowNoChecks, true);
	assert.equal(config.github.requireGreenChecks, true);
	assert.equal(config.agent.approvalPolicy, "never");
	assert.equal(config.agent.sandbox, "workspace-write");
});

test("normalizeWorkflowConfig accepts parity states, validation commands, and GitHub gates", () => {
	const config = normalizeWorkflowConfig(
		{
			github: {
				allow_no_checks: false,
				require_green_checks: false,
				require_no_unresolved_reviews: false,
			},
			tracker: {
				api_key: "lin_123",
				team: "ENG",
				review_state: "Review",
				rework_state: "Needs Changes",
				merge_state: "Ready to Merge",
			},
			validation: {
				commands: ["node --test backend/lib/symphony/*.test.js"],
			},
		},
		{ env: {}, workflowDir: "/tmp" },
	);

	assert.equal(config.tracker.reviewState, "Review");
	assert.equal(config.tracker.reworkState, "Needs Changes");
	assert.equal(config.tracker.mergeState, "Ready to Merge");
	assert.deepEqual(config.validation.commands, ["node --test backend/lib/symphony/*.test.js"]);
	assert.equal(config.github.allowNoChecks, false);
	assert.equal(config.github.requireGreenChecks, false);
	assert.equal(config.github.requireNoUnresolvedReviews, false);
});

test("normalizeWorkflowConfig validates positive integer fields", () => {
	assert.throws(
		() =>
			normalizeWorkflowConfig(
				{
					dispatch: { max_parallel: 0 },
					tracker: { api_key: "lin_123", team: "ENG" },
				},
				{ env: {}, workflowDir: "/tmp" },
			),
		/dispatch.max_parallel must be a positive integer/,
	);
});

test("normalizeWorkflowConfig allows unlimited max parallel dispatch", () => {
	const config = normalizeWorkflowConfig(
		{
			dispatch: { max_parallel: "infinite" },
			tracker: { api_key: "lin_123", team: "ENG" },
		},
		{ env: {}, workflowDir: "/tmp" },
	);

	assert.equal(config.dispatch.maxParallel, Number.POSITIVE_INFINITY);
});

test("resolvePath handles home and relative paths", () => {
	assert.equal(resolvePath("~/work", "/repo", {}, "/Users/test"), "/Users/test/work");
	assert.equal(resolvePath("work", "/repo", {}), "/repo/work");
});
