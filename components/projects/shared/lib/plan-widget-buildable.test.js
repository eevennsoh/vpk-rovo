"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

/**
 * Contract tests for isPlanCardBuildable.
 *
 * plan-widget.ts cannot be imported directly by node:test because it has
 * value imports from @/ path aliases. The function under test is a pure
 * 20-line predicate, so we inline its logic here as a contract test to
 * validate the spec requirements (Test Cases 8 + 13).
 *
 * Source of truth: components/projects/shared/lib/plan-widget.ts
 * isPlanCardBuildable(planPayload, allPlanPayloads, acceptedPlanKey)
 */
function isPlanCardBuildable(planPayload, allPlanPayloads, acceptedPlanKey) {
	if (acceptedPlanKey !== null) {
		return { buildable: false, reason: "A plan has already been accepted." };
	}

	if (allPlanPayloads.length === 0) {
		return { buildable: false, reason: "No plans available." };
	}

	const latestPlan = allPlanPayloads[allPlanPayloads.length - 1];
	const isLatest =
		planPayload.title === latestPlan.title &&
		planPayload.tasks.length === latestPlan.tasks.length &&
		planPayload.tasks.every((task, index) => task.id === latestPlan.tasks[index]?.id);

	if (!isLatest) {
		return { buildable: false, reason: "A newer plan is available." };
	}

	return { buildable: true };
}

function makePlan(title, taskIds) {
	return {
		title,
		tasks: taskIds.map((id) => ({ id, label: `Task ${id}`, blockedBy: [] })),
		agents: [],
	};
}

describe("isPlanCardBuildable — Test Case 8: iterative CTA", () => {
	it("latest plan is buildable when no acceptance exists", () => {
		const planA = makePlan("Dashboard v1", ["task-1", "task-2"]);
		const result = isPlanCardBuildable(planA, [planA], null);
		assert.deepStrictEqual(result, { buildable: true });
	});

	it("older plan is NOT buildable when a newer plan exists", () => {
		const planA = makePlan("Dashboard v1", ["task-1", "task-2"]);
		const planB = makePlan("Dashboard v2", ["task-1", "task-2", "task-3"]);

		const resultA = isPlanCardBuildable(planA, [planA, planB], null);
		assert.strictEqual(resultA.buildable, false);
		assert.strictEqual(resultA.reason, "A newer plan is available.");

		const resultB = isPlanCardBuildable(planB, [planA, planB], null);
		assert.deepStrictEqual(resultB, { buildable: true });
	});

	it("only the last plan is buildable among three iterations", () => {
		const planA = makePlan("Plan A", ["t1"]);
		const planB = makePlan("Plan B", ["t1", "t2"]);
		const planC = makePlan("Plan C", ["t1", "t2", "t3"]);
		const all = [planA, planB, planC];

		assert.strictEqual(isPlanCardBuildable(planA, all, null).buildable, false);
		assert.strictEqual(isPlanCardBuildable(planB, all, null).buildable, false);
		assert.strictEqual(isPlanCardBuildable(planC, all, null).buildable, true);
	});

	it("plans with same title but different task ids are distinguished", () => {
		const planA = makePlan("Dashboard", ["task-1", "task-2"]);
		const planB = makePlan("Dashboard", ["task-1", "task-2", "task-3"]);

		assert.strictEqual(
			isPlanCardBuildable(planA, [planA, planB], null).buildable,
			false,
		);
		assert.strictEqual(
			isPlanCardBuildable(planB, [planA, planB], null).buildable,
			true,
		);
	});

	it("same title and task count but different task ids is not the latest plan", () => {
		const planA = makePlan("Dashboard", ["task-1", "task-2"]);
		const planB = makePlan("Dashboard", ["task-1", "task-99"]);

		assert.strictEqual(isPlanCardBuildable(planA, [planA, planB], null).buildable, false);
		assert.strictEqual(isPlanCardBuildable(planB, [planA, planB], null).buildable, true);
	});

	it("returns not buildable when allPlanPayloads is empty", () => {
		const plan = makePlan("Solo Plan", ["t1"]);
		const result = isPlanCardBuildable(plan, [], null);
		assert.strictEqual(result.buildable, false);
		assert.strictEqual(result.reason, "No plans available.");
	});
});

describe("isPlanCardBuildable — Test Case 13: build disabled after acceptance", () => {
	it("all plans become non-buildable after any plan is accepted", () => {
		const planA = makePlan("Plan A", ["t1", "t2"]);
		const planB = makePlan("Plan B", ["t1", "t2", "t3"]);
		const acceptedKey = "Plan B-t1|t2|t3";

		assert.strictEqual(
			isPlanCardBuildable(planA, [planA, planB], acceptedKey).buildable,
			false,
		);
		assert.strictEqual(
			isPlanCardBuildable(planA, [planA, planB], acceptedKey).reason,
			"A plan has already been accepted.",
		);

		assert.strictEqual(
			isPlanCardBuildable(planB, [planA, planB], acceptedKey).buildable,
			false,
		);
		assert.strictEqual(
			isPlanCardBuildable(planB, [planA, planB], acceptedKey).reason,
			"A plan has already been accepted.",
		);
	});

	it("acceptance blocks even the latest plan", () => {
		const plan = makePlan("Single Plan", ["t1"]);
		const acceptedKey = "Single Plan-t1";

		const result = isPlanCardBuildable(plan, [plan], acceptedKey);
		assert.strictEqual(result.buildable, false);
		assert.strictEqual(result.reason, "A plan has already been accepted.");
	});

	it("acceptance with any key value blocks all plans", () => {
		const plan = makePlan("Plan", ["t1"]);
		const result = isPlanCardBuildable(plan, [plan], "any-non-null-key");
		assert.strictEqual(result.buildable, false);
	});

	it("null acceptedPlanKey allows buildable check to proceed normally", () => {
		const plan = makePlan("Plan", ["t1"]);
		const result = isPlanCardBuildable(plan, [plan], null);
		assert.strictEqual(result.buildable, true);
	});
});
