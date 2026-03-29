const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildPausedToolApprovalPayload,
	buildToolApprovalResumeDecisions,
	normalizeToolApprovalSubmission,
} = require("./paused-tool-approval");

test("buildPausedToolApprovalPayload maps paused tool calls into approval items", () => {
	const payload = buildPausedToolApprovalPayload({
		approvalId: "approval-1",
		threadId: "thread-1",
		createdAt: "2026-03-29T11:28:16.000Z",
		parts: [
			{
				tool_call_id: "tool-1",
				tool_name: "create_file",
				args: JSON.stringify({
					file_path: "components/projects/team-chat/data/mock-threads.ts",
				}),
			},
			{
				tool_call_id: "tool-2",
				tool_name: "bash",
				args: JSON.stringify({
					command: "pnpm tsc --noEmit",
				}),
			},
		],
	});

	assert.deepEqual(payload, {
		approvalId: "approval-1",
		threadId: "thread-1",
		createdAt: "2026-03-29T11:28:16.000Z",
		items: [
			{
				id: "tool-1-1",
				toolCallId: "tool-1",
				toolName: "create_file",
				title: "Create file",
				description: "Create `components/projects/team-chat/data/mock-threads.ts` in the workspace.",
				targetPath: "components/projects/team-chat/data/mock-threads.ts",
				commandPreview: null,
				riskLevel: "medium",
				permissionScenario: "ASK",
			},
			{
				id: "tool-2-2",
				toolCallId: "tool-2",
				toolName: "bash",
				title: "Run bash command",
				description: "Run a shell command in the workspace.",
				targetPath: null,
				commandPreview: "pnpm tsc --noEmit",
				riskLevel: "high",
				permissionScenario: "ASK",
			},
		],
	});
});

test("normalizeToolApprovalSubmission accepts approval batches with explicit decisions", () => {
	const submission = normalizeToolApprovalSubmission({
		approvalId: "approval-1",
		decisions: [
			{ toolCallId: "tool-1", approved: true },
			{ toolCallId: "tool-2", approved: false, denyMessage: "Do not run this command." },
		],
	});

	assert.deepEqual(submission, {
		approvalId: "approval-1",
		decisions: [
			{ toolCallId: "tool-1", approved: true, denyMessage: undefined },
			{ toolCallId: "tool-2", approved: false, denyMessage: "Do not run this command." },
		],
	});
});

test("buildToolApprovalResumeDecisions converts approvals into resume_tool_calls payload", () => {
	const decisions = buildToolApprovalResumeDecisions(
		{
			approvalId: "approval-1",
			decisions: [
				{ toolCallId: "tool-1", approved: true },
				{ toolCallId: "tool-2", approved: false },
			],
		},
		[
			{
				tool_call_id: "tool-1",
				tool_name: "create_file",
				args: JSON.stringify({
					file_path: "components/projects/team-chat/data/mock-threads.ts",
				}),
			},
			{
				tool_call_id: "tool-2",
				tool_name: "bash",
				args: JSON.stringify({
					command: "rm -rf components/projects/team-chat",
				}),
			},
		],
	);

	assert.deepEqual(decisions, [
		{ tool_call_id: "tool-1", deny_message: null },
		{
			tool_call_id: "tool-2",
			deny_message: "Bash command was not approved: rm -rf components/projects/team-chat",
		},
	]);
});
