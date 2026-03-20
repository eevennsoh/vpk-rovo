const test = require("node:test");
const assert = require("node:assert/strict");

const {
	normalizeBoardLayoutSpec,
} = require("./spec-normalization.ts");

test("normalizeBoardLayoutSpec converts board-like horizontal stacks to grid columns", () => {
	const spec = {
		root: "main",
		elements: {
			main: {
				type: "Stack",
				props: { direction: "vertical", gap: "lg" },
				children: ["header", "board"],
			},
			header: {
				type: "PageHeader",
				props: { title: "Sprint Board", description: "Sprint 24" },
			},
			board: {
				type: "Stack",
				props: {
					direction: "horizontal",
					gap: "md",
					align: "start",
					wrap: false,
					padding: null,
				},
				children: ["todo-col", "progress-col", "review-col", "done-col"],
			},
			"todo-col": {
				type: "Card",
				props: { title: "To Do", description: "2 tasks" },
				children: ["todo-list"],
			},
			"todo-list": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				repeat: { statePath: "/tasks/todo", key: "id" },
				children: ["todo-card"],
			},
			"todo-card": {
				type: "Card",
				props: { title: { $item: "title" }, description: { $item: "assignee" } },
				children: [],
			},
			"progress-col": {
				type: "Card",
				props: { title: "In Progress", description: "1 task" },
				children: ["progress-list"],
			},
			"progress-list": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				repeat: { statePath: "/tasks/inProgress", key: "id" },
				children: ["progress-card"],
			},
			"progress-card": {
				type: "Card",
				props: { title: { $item: "title" }, description: { $item: "assignee" } },
				children: [],
			},
			"review-col": {
				type: "Card",
				props: { title: "In Review", description: "1 task" },
				children: ["review-list"],
			},
			"review-list": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				repeat: { statePath: "/tasks/review", key: "id" },
				children: ["review-card"],
			},
			"review-card": {
				type: "Card",
				props: { title: { $item: "title" }, description: { $item: "assignee" } },
				children: [],
			},
			"done-col": {
				type: "Card",
				props: { title: "Done", description: "2 tasks" },
				children: ["done-list"],
			},
			"done-list": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				repeat: { statePath: "/tasks/done", key: "id" },
				children: ["done-card"],
			},
			"done-card": {
				type: "Card",
				props: { title: { $item: "title" }, description: { $item: "assignee" } },
				children: [],
			},
		},
		state: {
			tasks: {
				todo: [{ id: "1", title: "Task", assignee: "Alice" }],
				inProgress: [{ id: "2", title: "Task", assignee: "Bob" }],
				review: [{ id: "3", title: "Task", assignee: "Charlie" }],
				done: [{ id: "4", title: "Task", assignee: "Dana" }],
			},
		},
	};

	const result = normalizeBoardLayoutSpec(spec);

	assert.notEqual(result, spec);
	assert.equal(result.elements.board.type, "Grid");
	assert.deepEqual(result.elements.board.props, {
		columns: "4",
		gap: "md",
		className: null,
	});
	assert.deepEqual(result.elements.board.children, [
		"todo-col",
		"progress-col",
		"review-col",
		"done-col",
	]);
	assert.deepEqual(result.state, spec.state);
	assert.equal(result.elements["todo-list"].repeat.statePath, "/tasks/todo");
});

test("normalizeBoardLayoutSpec leaves non-board horizontal card rows unchanged", () => {
	const spec = {
		root: "main",
		elements: {
			main: {
				type: "Stack",
				props: { direction: "vertical", gap: "lg" },
				children: ["metrics-row"],
			},
			"metrics-row": {
				type: "Stack",
				props: {
					direction: "horizontal",
					gap: "md",
					align: "center",
					wrap: false,
				},
				children: ["metric-a", "metric-b", "metric-c"],
			},
			"metric-a": {
				type: "Card",
				props: { title: "Open Work Items", description: "12" },
				children: [],
			},
			"metric-b": {
				type: "Card",
				props: { title: "Velocity", description: "34 pts" },
				children: [],
			},
			"metric-c": {
				type: "Card",
				props: { title: "Burnup", description: "On track" },
				children: [],
			},
		},
	};

	const result = normalizeBoardLayoutSpec(spec);

	assert.equal(result, spec);
	assert.equal(result.elements["metrics-row"].type, "Stack");
});

test("normalizeBoardLayoutSpec preserves className when converting board layouts", () => {
	const spec = {
		root: "main",
		elements: {
			main: {
				type: "Stack",
				props: { direction: "vertical", gap: "lg" },
				children: ["board"],
			},
			board: {
				type: "Stack",
				props: {
					direction: "horizontal",
					gap: "lg",
					className: "items-start lg:min-h-[28rem]",
				},
				children: ["todo-col", "done-col"],
			},
			"todo-col": {
				type: "Card",
				props: { title: "To Do", description: "1 task" },
				children: ["todo-list"],
			},
			"todo-list": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				repeat: { statePath: "/tasks/todo", key: "id" },
				children: ["todo-card"],
			},
			"todo-card": {
				type: "Card",
				props: { title: { $item: "title" } },
				children: [],
			},
			"done-col": {
				type: "Card",
				props: { title: "Done", description: "1 task" },
				children: ["done-list"],
			},
			"done-list": {
				type: "Stack",
				props: { direction: "vertical", gap: "sm" },
				repeat: { statePath: "/tasks/done", key: "id" },
				children: ["done-card"],
			},
			"done-card": {
				type: "Card",
				props: { title: { $item: "title" } },
				children: [],
			},
		},
	};

	const result = normalizeBoardLayoutSpec(spec);

	assert.equal(result.elements.board.type, "Grid");
	assert.equal(result.elements.board.props.className, "items-start lg:min-h-[28rem]");
	assert.equal(result.elements.board.props.columns, "2");
	assert.equal(result.elements.board.props.gap, "lg");
});
