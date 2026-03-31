const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getToolApprovalDecisionTransition,
	getToolApprovalProgressLabel,
} = require("./tool-approval-utils.ts");

const items = [
	{
		id: "edit-2",
		toolCallId: "call-edit-shell",
		toolName: "find_and_replace_code",
		title: "Edit file",
		description: "Patch the future-chat shell so the approval surface can mount above the composer dock.",
	},
	{
		id: "delete-1",
		toolCallId: "call-delete-temp",
		toolName: "delete_file",
		title: "Delete file",
		description: "Remove an obsolete temporary artifact from the workspace after the refactor completes.",
	},
	{
		id: "bash-1",
		toolCallId: "call-run-checks",
		toolName: "bash",
		title: "Run bash command",
		description: "Run validation so the agent can continue with a verified result.",
	},
];

test("per-decision submissions fire immediately and preserve the remaining queue", () => {
	const firstTransition = getToolApprovalDecisionTransition({
		items,
		activeIndex: 0,
		decisionsByToolCallId: {},
		toolCallId: items[0].toolCallId,
		approved: true,
		submissionMode: "per-decision",
	});

	assert.equal(firstTransition.shouldSubmit, true);
	assert.equal(firstTransition.isComplete, false);
	assert.deepEqual(firstTransition.submission, [
		{
			toolCallId: items[0].toolCallId,
			approved: true,
			denyMessage: undefined,
		},
	]);
	assert.equal(firstTransition.nextActiveIndex, 1);
	assert.equal(
		getToolApprovalProgressLabel({
			items,
			activeIndex: firstTransition.nextActiveIndex,
			decisionsByToolCallId: firstTransition.nextDecisionsByToolCallId,
			progressMode: "remaining",
		}),
		"2 left",
	);
});

test("batch submissions still wait for the full set of decisions", () => {
	const transition = getToolApprovalDecisionTransition({
		items,
		activeIndex: 0,
		decisionsByToolCallId: {},
		toolCallId: items[0].toolCallId,
		approved: false,
		submissionMode: "batch",
	});

	assert.equal(transition.shouldSubmit, false);
	assert.equal(transition.isComplete, false);
	assert.equal(transition.submission.length, 1);
	assert.equal(transition.nextActiveIndex, 1);
	assert.equal(
		getToolApprovalProgressLabel({
			items,
			activeIndex: 0,
			decisionsByToolCallId: {},
			progressMode: "remaining",
		}),
		"3 left",
	);
});
