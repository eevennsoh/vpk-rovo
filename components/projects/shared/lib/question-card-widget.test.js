const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildClarificationSummaryDisplayLabel,
	buildClarificationSummaryPrompt,
	buildClarificationSummaryRows,
	createClarificationSubmission,
	parseQuestionCardPayload,
	getLatestQuestionCardPayload,
} = require("./question-card-widget.ts");

test("parseQuestionCardPayload preserves multi-select kind", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-multi",
		questions: [
			{
				id: "q-1",
				label: "Which channels should we use?",
				kind: "multi-select",
				options: [{ label: "Slack" }, { label: "Email" }],
			},
		],
	});

	assert.ok(payload);
	assert.equal(payload.questions[0].kind, "multi-select");
	assert.equal(payload.questions[0].options.length, 2);
});

test("parseQuestionCardPayload preserves both generic and legacy tool call ids", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-tool-call-id",
		tool_call_id: "tool-call-123",
		questions: [{ id: "q-1", label: "What should we do?" }],
	});

	assert.ok(payload);
	assert.equal(payload.toolCallId, "tool-call-123");
	assert.equal(payload.deferredToolCallId, "tool-call-123");
});

test("createClarificationSubmission preserves deferred tool call ids", () => {
	const submission = createClarificationSubmission(
		{
			type: "question-card",
			sessionId: "widget-tool-call-id",
			round: 1,
			maxRounds: 1,
			title: "Answer these questions to continue",
			requiredCount: 1,
			toolCallId: "tool-call-123",
			deferredToolCallId: "tool-call-123",
			questions: [
				{
					id: "q-1",
					label: "What should we do?",
					required: true,
					kind: "single-select",
					options: [{ id: "approve", label: "Ship it" }],
				},
			],
		},
		{ "q-1": "Ship it" },
	);

	assert.equal(submission.toolCallId, "tool-call-123");
	assert.equal(submission.deferredToolCallId, "tool-call-123");
});

test("parseQuestionCardPayload defaults invalid kinds to single-select", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-default-kind",
		questions: [
			{
				id: "q-1",
				label: "Choose a release track",
				kind: "invalid-kind",
				options: [{ label: "Stable" }],
			},
		],
	});

	assert.ok(payload);
	assert.equal(payload.questions[0].kind, "single-select");
});

test("parseQuestionCardPayload keeps text kind for free-form-only questions", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-text-kind",
		questions: [
			{
				id: "q-1",
				label: "Anything else we should know?",
				kind: "text",
				options: [],
			},
		],
	});

	assert.ok(payload);
	assert.equal(payload.questions[0].kind, "text");
});

test("parseQuestionCardPayload filters out self-type options", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-self-type",
		questions: [
			{
				id: "q-1",
				label: "Which Confluence space?",
				kind: "single-select",
				options: [
					{ label: "I'll type the space name" },
					{ label: "Engineering" },
					{ label: "I will enter it myself" },
					{ label: "Product" },
				],
			},
		],
	});

	assert.ok(payload);
	assert.equal(payload.questions[0].options.length, 2);
	assert.equal(payload.questions[0].options[0].label, "Engineering");
	assert.equal(payload.questions[0].options[1].label, "Product");
});

test("parseQuestionCardPayload keeps options that mention typing in context", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-type-context",
		questions: [
			{
				id: "q-1",
				label: "What type of document?",
				kind: "single-select",
				options: [
					{ label: "Blog post type" },
					{ label: "Technical spec" },
				],
			},
		],
	});

	assert.ok(payload);
	assert.equal(payload.questions[0].options.length, 2);
});

test("getLatestQuestionCardPayload finds a question card even if another widget follows", () => {
	const payload = getLatestQuestionCardPayload([
		{
			id: "user-1",
			role: "user",
			parts: [{ type: "text", text: "Build me an app", state: "done" }],
		},
		{
			id: "assistant-1",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "question-card",
						payload: {
							type: "question-card",
							sessionId: "mixed-widget-order",
							questions: [{ id: "q-1", label: "What should we build?" }],
						},
					},
				},
				{
					type: "data-widget-data",
					data: {
						type: "genui-preview",
						payload: { title: "Preview" },
					},
				},
			],
		},
	]);

	assert.ok(payload);
	assert.equal(payload.sessionId, "mixed-widget-order");
});

test("getLatestQuestionCardPayload returns null after a newer user message", () => {
	const payload = getLatestQuestionCardPayload([
		{
			id: "assistant-1",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "question-card",
						payload: {
							type: "question-card",
							sessionId: "stale-card",
							questions: [{ id: "q-1", label: "Question?" }],
						},
					},
				},
			],
		},
		{
			id: "user-2",
			role: "user",
			parts: [{ type: "text", text: "Here are my answers", state: "done" }],
		},
	]);

	assert.equal(payload, null);
});

test("getLatestQuestionCardPayload returns null when latest assistant message also has a valid plan widget", () => {
	const payload = getLatestQuestionCardPayload([
		{
			id: "user-1",
			role: "user",
			parts: [{ type: "text", text: "Build this", state: "done" }],
		},
		{
			id: "assistant-1",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "plan",
						payload: {
							title: "Implementation plan",
							tasks: [
								{ id: "task-1", label: "Create route", blockedBy: [] },
								{ id: "task-2", label: "Wire state", blockedBy: ["task-1"] },
							],
						},
					},
				},
				{
					type: "data-widget-data",
					data: {
						type: "question-card",
						payload: {
							type: "question-card",
							sessionId: "stale-in-same-message",
							questions: [{ id: "q-1", label: "What next?" }],
						},
					},
				},
			],
		},
	]);

	assert.equal(payload, null);
});

test("buildClarificationSummaryRows maps selected option ids to option labels", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-mapping",
		questions: [
			{
				id: "q-1",
				label: "What assets should we track?",
				kind: "single-select",
				options: [
					{ id: "hardware", label: "Hardware only" },
					{ id: "full", label: "Hardware + Software" },
				],
			},
			{
				id: "q-2",
				label: "Anything else?",
				kind: "text",
				options: [],
			},
		],
	});
	assert.ok(parsedPayload);

	const rows = buildClarificationSummaryRows(parsedPayload, {
		"q-1": "full",
		"q-2": "Add serial number import support",
	});

	assert.deepEqual(rows, [
		{
			question: "What assets should we track?",
			answer: "Hardware + Software",
		},
		{
			question: "Anything else?",
			answer: "Add serial number import support",
		},
	]);
});

test("buildClarificationSummaryRows joins multi-select answers and falls back for unknown ids", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-multi",
		questions: [
			{
				id: "q-1",
				label: "Priority outcomes",
				kind: "multi-select",
				options: [
					{ id: "speed", label: "Speed" },
					{ id: "accuracy", label: "Accuracy" },
				],
			},
		],
	});
	assert.ok(parsedPayload);

	const rows = buildClarificationSummaryRows(parsedPayload, {
		"q-1": ["speed", "custom-outcome"],
	});

	assert.deepEqual(rows, [
		{
			question: "Priority outcomes",
			answer: "Speed, custom-outcome",
		},
	]);
});

test("buildClarificationSummaryDisplayLabel reflects captured answer count", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-label",
		title: "Answer these questions",
		questions: [
			{
				id: "q-1",
				label: "Scope",
				kind: "single-select",
				options: [{ id: "a", label: "Option A" }],
			},
		],
	});
	assert.ok(parsedPayload);

	assert.equal(
		buildClarificationSummaryDisplayLabel(parsedPayload, {}),
		'Requirements captured for "Answer these questions".'
	);
	assert.equal(
		buildClarificationSummaryDisplayLabel(parsedPayload, { "q-1": "a" }),
		"Requirements captured (1 answer)."
	);
});

test("buildClarificationSummaryPrompt uses explicit directive when present", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-directive",
		title: "Atlassian Stock Price Chart",
		directive: [
			"Use these details to generate the requested visualization now.",
			"Return a json-render UI widget that matches the requested chart or data view.",
		].join("\n"),
		questions: [
			{
				id: "chart-type",
				label: "What chart type would you prefer?",
				kind: "single-select",
				options: [{ id: "line", label: "Line chart" }],
			},
		],
	});
	assert.ok(parsedPayload);

	const prompt = buildClarificationSummaryPrompt(parsedPayload, {
		"chart-type": "line",
	});

	assert.match(prompt, /Here are my clarification answers for "Atlassian Stock Price Chart":/);
	assert.match(prompt, /Line chart/);
	assert.match(prompt, /json-render UI widget/i);
	assert.doesNotMatch(prompt, /create-plan skill/i);
});

test("buildClarificationSummaryPrompt falls back to neutral continuation directive", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-neutral",
		title: "Clarify this request",
		questions: [
			{
				id: "q-1",
				label: "What outcome do you want?",
				kind: "single-select",
				options: [{ id: "answer", label: "A direct answer" }],
			},
		],
	});
	assert.ok(parsedPayload);

	const prompt = buildClarificationSummaryPrompt(parsedPayload, {
		"q-1": "answer",
	});

	assert.match(prompt, /continue the user's original request now/i);
	assert.match(prompt, /format that best matches the request/i);
	assert.doesNotMatch(prompt, /create-plan skill/i);
	assert.doesNotMatch(prompt, /plan widget/i);
});
