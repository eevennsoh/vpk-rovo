const test = require("node:test");
const assert = require("node:assert/strict");

const {
	planWidgetRequiresApproval,
} = require("./plan-approval.ts");

test("planWidgetRequiresApproval returns true only for deferred exit-plan widgets", () => {
	assert.equal(
		planWidgetRequiresApproval({
			title: "Team settings rollout",
			description: "Plan summary",
			tasks: [{ id: "task-1", label: "Define scope", blockedBy: [] }],
			agents: [],
			deferredToolCallId: "tool-call-123",
		}),
		true,
	);

	assert.equal(
		planWidgetRequiresApproval({
			title: "Generated checklist",
			description: "Standalone plan output",
			tasks: [{ id: "task-1", label: "Queue follow-up", blockedBy: [] }],
			agents: [],
		}),
		false,
	);

	assert.equal(planWidgetRequiresApproval(null), false);
});
