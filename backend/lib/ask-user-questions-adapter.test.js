const test = require("node:test");
const assert = require("node:assert/strict");

const {
	adaptClarificationAnswers,
	convertToolInputToQuestionCardFormat,
} = require("./ask-user-questions-adapter");

// ─── adaptClarificationAnswers ───────────────────────────────────────────────

test("passes through answers unchanged for non-request-user-input sessions", () => {
	const answers = { "q-1": "Bug Fix", "q-2": ["High", "Medium"] };
	const result = adaptClarificationAnswers("clarification-123", answers, null);
	assert.deepEqual(result, answers);
});

test("passes through answers unchanged for planning-gate sessions", () => {
	const answers = { "q-1": "Quick recommendation" };
	const result = adaptClarificationAnswers("agent-team-abc", answers, null);
	assert.deepEqual(result, answers);
});

test("normalizes single string values to arrays for request-user-input sessions without metadata", () => {
	const answers = { "q-1": "Bug Fix", "q-2": "High" };
	const result = adaptClarificationAnswers("request-user-input-tc-123", answers, null);
	assert.deepEqual(result, {
		"q-1": ["Bug Fix"],
		"q-2": ["High"],
	});
});

test("preserves array values for request-user-input sessions without metadata", () => {
	const answers = { "q-1": ["Bug Fix", "Refactoring"] };
	const result = adaptClarificationAnswers("request-user-input-tc-456", answers, null);
	assert.deepEqual(result, {
		"q-1": ["Bug Fix", "Refactoring"],
	});
});

test("maps question IDs to question text when metadata is provided", () => {
	const answers = { "q-1": "Bug Fix", "q-2": "High" };
	const questionMeta = [
		{ id: "q-1", label: "What type of task are you working on?" },
		{ id: "q-2", label: "What priority level?" },
	];
	const result = adaptClarificationAnswers("request-user-input-tc-789", answers, questionMeta);
	assert.deepEqual(result, {
		"What type of task are you working on?": ["Bug Fix"],
		"What priority level?": ["High"],
	});
});

test("maps IDs to text and normalizes mixed single/array values", () => {
	const answers = { "q-1": "New Feature", "q-2": ["Unit Tests", "Integration Tests"] };
	const questionMeta = [
		{ id: "q-1", label: "What kind of change?" },
		{ id: "q-2", label: "What test coverage?" },
	];
	const result = adaptClarificationAnswers("request-user-input-tc-001", answers, questionMeta);
	assert.deepEqual(result, {
		"What kind of change?": ["New Feature"],
		"What test coverage?": ["Unit Tests", "Integration Tests"],
	});
});

test("falls back to question ID when metadata has no matching entry", () => {
	const answers = { "q-1": "Yes", "q-unknown": "Custom answer" };
	const questionMeta = [
		{ id: "q-1", label: "Should we proceed?" },
	];
	const result = adaptClarificationAnswers("request-user-input-tc-002", answers, questionMeta);
	assert.deepEqual(result, {
		"Should we proceed?": ["Yes"],
		"q-unknown": ["Custom answer"],
	});
});

test("maps selected option ids back to option labels when metadata includes options", () => {
	const answers = { "q-1": "dashboard", "q-2": ["slack", "email"] };
	const questionMeta = [
		{
			id: "q-1",
			label: "What should we build?",
			options: [
				{ id: "dashboard", label: "Dashboard" },
				{ id: "notes", label: "Notes App" },
			],
		},
		{
			id: "q-2",
			label: "Which channels matter?",
			options: [
				{ id: "slack", label: "Slack" },
				{ id: "email", label: "Email" },
			],
		},
	];
	const result = adaptClarificationAnswers("request-user-input-tc-777", answers, questionMeta);
	assert.deepEqual(result, {
		"What should we build?": ["Dashboard"],
		"Which channels matter?": ["Slack", "Email"],
	});
});

test("returns empty object for null/undefined answers", () => {
	assert.deepEqual(adaptClarificationAnswers("request-user-input-tc-003", null, null), {});
	assert.deepEqual(adaptClarificationAnswers("request-user-input-tc-003", undefined, null), {});
});

test("returns empty object for non-object answers", () => {
	assert.deepEqual(adaptClarificationAnswers("request-user-input-tc-004", "not an object", null), {});
});

test("handles empty metadata array like no metadata", () => {
	const answers = { "q-1": "Yes" };
	const result = adaptClarificationAnswers("request-user-input-tc-005", answers, []);
	assert.deepEqual(result, { "q-1": ["Yes"] });
});

// ─── convertToolInputToQuestionCardFormat ────────────────────────────────────

test("converts standard QuestionsInput format with questions and options", () => {
	const toolInput = {
		questions: [
			{
				question: "What type of task are you working on?",
				options: [
					{ label: "Bug Fix", description: "Fix an existing issue" },
					{ label: "New Feature", description: "Implement new functionality" },
					{ label: "Refactoring", description: "Improve code structure" },
				],
			},
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.equal(result.length, 1);
	assert.equal(result[0].id, "q-1");
	assert.equal(result[0].label, "What type of task are you working on?");
	assert.equal(result[0].kind, "single-select");
	assert.equal(result[0].options.length, 3);
	assert.equal(result[0].options[0].label, "Bug Fix");
	assert.equal(result[0].options[0].description, "Fix an existing issue");
});

test("converts at most three preset options per question", () => {
	const toolInput = {
		questions: [
			{
				question: "Which knowledge should the agent reuse first?",
				options: [
					{ label: "Reusable answer library" },
					{ label: "Customer/account context" },
					{ label: "Product and security evidence" },
					{ label: "Pricing approvals" },
				],
			},
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.deepEqual(
		result[0].options.map((option) => option.label),
		[
			"Reusable answer library",
			"Customer/account context",
			"Product and security evidence",
		],
	);
});

test("converts multiple questions", () => {
	const toolInput = {
		questions: [
			{
				question: "What type of task?",
				options: [
					{ label: "Bug Fix", description: "Fix a bug" },
				],
			},
			{
				question: "What priority?",
				options: [
					{ label: "High", description: "Urgent" },
					{ label: "Low", description: "Can wait" },
				],
			},
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.equal(result.length, 2);
	assert.equal(result[0].label, "What type of task?");
	assert.equal(result[1].label, "What priority?");
	assert.equal(result[0].options.length, 1);
	assert.equal(result[1].options.length, 2);
});

test("uses label field when question field is absent", () => {
	const toolInput = {
		questions: [
			{
				label: "Fallback label question?",
				options: [{ label: "Option A" }],
			},
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.equal(result[0].label, "Fallback label question?");
});

test("returns null for null/undefined input", () => {
	assert.equal(convertToolInputToQuestionCardFormat(null), null);
	assert.equal(convertToolInputToQuestionCardFormat(undefined), null);
});

test("returns null for input without questions", () => {
	assert.equal(convertToolInputToQuestionCardFormat({}), null);
	assert.equal(convertToolInputToQuestionCardFormat({ questions: [] }), null);
});

test("skips questions without label or question text", () => {
	const toolInput = {
		questions: [
			{ header: "Only Header", options: [] },
			{ question: "Valid question?", options: [{ label: "Yes" }] },
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.equal(result.length, 1);
	assert.equal(result[0].label, "Valid question?");
});

test("skips options without label", () => {
	const toolInput = {
		questions: [
			{
				question: "Pick one",
				options: [
					{ label: "Valid", description: "Has label" },
					{ description: "No label here" },
					{ label: "", description: "Empty label" },
				],
			},
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.equal(result[0].options.length, 1);
	assert.equal(result[0].options[0].label, "Valid");
});

test("preserves existing question IDs", () => {
	const toolInput = {
		questions: [
			{
				id: "custom-id",
				question: "Custom ID question?",
				options: [],
			},
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.equal(result[0].id, "custom-id");
});

test("generates sequential IDs when none provided", () => {
	const toolInput = {
		questions: [
			{ question: "First?", options: [] },
			{ question: "Second?", options: [] },
			{ question: "Third?", options: [] },
		],
	};

	const result = convertToolInputToQuestionCardFormat(toolInput);
	assert.ok(result);
	assert.equal(result[0].id, "q-1");
	assert.equal(result[1].id, "q-2");
	assert.equal(result[2].id, "q-3");
});
