const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getPlanFeedbackToolGuard,
} = require("./plan-feedback-tool-guard");

const isExitPlanModeTool = (toolName) => toolName === "exit_plan_mode";
const isRequestUserInputTool = (toolName) => toolName === "ask_user_questions";

test("does nothing outside a plan-feedback deferred resume turn", () => {
	assert.deepEqual(
		getPlanFeedbackToolGuard({
			isPlanFeedbackDeferredResumeTurn: false,
			isExitPlanModeTool,
			isRequestUserInputTool,
			toolName: "open_files",
			toolCallId: "tool-1",
			resumedToolCallId: "tool-plan",
		}),
		{ ignore: false, block: false },
	);
});

test("ignores the replayed original exit_plan_mode tool call", () => {
	assert.deepEqual(
		getPlanFeedbackToolGuard({
			isPlanFeedbackDeferredResumeTurn: true,
			isExitPlanModeTool,
			isRequestUserInputTool,
			toolName: "exit_plan_mode",
			toolCallId: "tool-plan",
			resumedToolCallId: "tool-plan",
		}),
		{ ignore: true, block: false },
	);
});

test("allows new interactive planning tools during plan feedback", () => {
	assert.deepEqual(
		getPlanFeedbackToolGuard({
			isPlanFeedbackDeferredResumeTurn: true,
			isExitPlanModeTool,
			isRequestUserInputTool,
			toolName: "exit_plan_mode",
			toolCallId: "tool-new-plan",
			resumedToolCallId: "tool-old-plan",
		}),
		{ ignore: false, block: false },
	);

	assert.deepEqual(
		getPlanFeedbackToolGuard({
			isPlanFeedbackDeferredResumeTurn: true,
			isExitPlanModeTool,
			isRequestUserInputTool,
			toolName: "ask_user_questions",
			toolCallId: "tool-clarify",
			resumedToolCallId: "tool-old-plan",
		}),
		{ ignore: false, block: false },
	);
});

test("blocks non-interactive tools during plan feedback", () => {
	assert.deepEqual(
		getPlanFeedbackToolGuard({
			isPlanFeedbackDeferredResumeTurn: true,
			isExitPlanModeTool,
			isRequestUserInputTool,
			toolName: "update_todo",
			toolCallId: "tool-todo",
			resumedToolCallId: "tool-old-plan",
		}),
		{ ignore: false, block: true },
	);

	assert.deepEqual(
		getPlanFeedbackToolGuard({
			isPlanFeedbackDeferredResumeTurn: true,
			isExitPlanModeTool,
			isRequestUserInputTool,
			toolName: "open_files",
			toolCallId: "tool-open",
			resumedToolCallId: "tool-old-plan",
		}),
		{ ignore: false, block: true },
	);
});
