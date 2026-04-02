const assert = require("node:assert/strict");
const test = require("node:test");

const {
	shouldShowIndeterminateTaskProgressBar,
} = require("./progress-bar-state.ts");

const ALL_TODO_TASKS = {
	done: [],
	inReview: [],
	inProgress: [],
	failed: [],
	todo: [
		{
			id: "task-1",
			label: "Create mock data",
			description: "Ready to start",
		},
	],
};

test("shows the indeterminate progress bar when a run has started but no task has advanced yet", () => {
	assert.equal(
		shouldShowIndeterminateTaskProgressBar({
			runStatus: "running",
			taskStatusGroups: ALL_TODO_TASKS,
		}),
		true,
	);
});

test("stops using the indeterminate progress bar once task execution begins", () => {
	assert.equal(
		shouldShowIndeterminateTaskProgressBar({
			runStatus: "running",
			taskStatusGroups: {
				...ALL_TODO_TASKS,
				inProgress: [
					{
						id: "task-1",
						label: "Create mock data",
						description: "Generating fixtures",
					},
				],
				todo: [],
			},
		}),
		false,
	);
});

test("does not use the indeterminate progress bar for non-running states", () => {
	assert.equal(
		shouldShowIndeterminateTaskProgressBar({
			runStatus: "completed",
			taskStatusGroups: ALL_TODO_TASKS,
		}),
		false,
	);
});
