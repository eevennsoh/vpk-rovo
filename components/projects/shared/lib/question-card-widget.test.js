const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildClarificationDismissPrompt,
	buildClarificationMessageMetadata,
	buildDeferredToolResponse,
	buildClarificationSummaryDisplayLabel,
	buildClarificationSummaryPrompt,
	buildClarificationSummaryRows,
	createClarificationSubmission,
	getQuestionCardResolutionKey,
	hasMatchingClarificationResponse,
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

test("parseQuestionCardPayload caps each round at four questions", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-four-question-cap",
		questions: Array.from({ length: 6 }, (_, index) => ({
			id: `q-${index + 1}`,
			label: `Question ${index + 1}?`,
			kind: "single-select",
			options: [{ label: "Yes" }, { label: "No" }],
		})),
	});

	assert.ok(payload);
	assert.deepEqual(
		payload.questions.map((question) => question.id),
		["q-1", "q-2", "q-3", "q-4"],
	);
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

test("parseQuestionCardPayload preserves camelCase deferred tool ids", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-deferred-tool-call-id",
		toolCallId: "tool-call-456",
		deferredToolCallId: "deferred-tool-call-456",
		questions: [{ id: "q-1", label: "What should we do next?" }],
	});

	assert.ok(payload);
	assert.equal(payload.toolCallId, "tool-call-456");
	assert.equal(payload.deferredToolCallId, "deferred-tool-call-456");
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

test("createClarificationSubmission treats explicit 'Skipped' answers as completed answers", () => {
	const submission = createClarificationSubmission(
		{
			type: "question-card",
			sessionId: "widget-skipped-answer",
			round: 1,
			maxRounds: 1,
			title: "Answer these questions to continue",
			requiredCount: 1,
			toolCallId: "tool-call-skipped",
			deferredToolCallId: "tool-call-skipped",
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
		{ "q-1": "Skipped" },
	);

	assert.equal(submission.completed, true);
	assert.deepEqual(submission.answers, { "q-1": "Skipped" });
});

test("getQuestionCardResolutionKey prefers tool call id over session round", () => {
	const key = getQuestionCardResolutionKey({
		sessionId: "request-user-input-tool-call-123",
		round: 2,
		toolCallId: "tool-call-123",
		deferredToolCallId: "tool-call-123",
	});

	assert.equal(key, "tool:tool-call-123");
});

test("buildClarificationMessageMetadata stores stable clarification identifiers", () => {
	const metadata = buildClarificationMessageMetadata(
		{
			type: "question-card",
			sessionId: "request-user-input-tool-call-456",
			round: 1,
			maxRounds: 1,
			title: "Answer these questions to continue",
			requiredCount: 1,
			deferredToolCallId: "tool-call-456",
			questions: [
				{
					id: "q-1",
					label: "What should we name it?",
					required: true,
					kind: "text",
					options: [],
				},
			],
		},
		{
			answers: { "q-1": "Northstar" },
			status: "answered",
		},
	);

	assert.equal(metadata.source, "clarification-submit");
	assert.equal(metadata.clarificationToolCallId, "tool-call-456");
	assert.equal(metadata.clarificationSessionId, "request-user-input-tool-call-456");
	assert.equal(metadata.clarificationRound, 1);
	assert.equal(metadata.clarificationStatus, "answered");
	assert.deepEqual(metadata.clarificationSummary, [
		{
			question: "What should we name it?",
			answer: "Northstar",
		},
	]);
});

test("buildClarificationMessageMetadata includes skipped rows when answers explicitly contain 'Skipped'", () => {
	const metadata = buildClarificationMessageMetadata(
		{
			type: "question-card",
			sessionId: "request-user-input-tool-call-789",
			round: 1,
			maxRounds: 1,
			title: "Answer these questions to continue",
			requiredCount: 1,
			deferredToolCallId: "tool-call-789",
			questions: [
				{
					id: "q-1",
					label: "What should we name it?",
					required: true,
					kind: "text",
					options: [],
				},
				{
					id: "q-2",
					label: "Any optional notes?",
					required: false,
					kind: "text",
					options: [],
				},
			],
		},
		{
			answers: { "q-1": "Northstar", "q-2": "Skipped" },
			status: "answered",
		},
	);

	assert.deepEqual(metadata.clarificationSummary, [
		{
			question: "What should we name it?",
			answer: "Northstar",
		},
		{
			question: "Any optional notes?",
			answer: "Skipped",
			status: "skipped",
		},
	]);
});

test("buildClarificationMessageMetadata renders dismissals as a visible answer card summary", () => {
	const metadata = buildClarificationMessageMetadata(
		{
			type: "question-card",
			sessionId: "request-user-input-dismissed",
			round: 1,
			maxRounds: 1,
			title: "Answer these questions to continue",
			requiredCount: 1,
			deferredToolCallId: "tool-call-dismissed",
			questions: [
				{
					id: "q-1",
					label: "What should we name it?",
					required: true,
					kind: "text",
					options: [],
				},
			],
		},
		{
			status: "dismissed",
		},
	);

	assert.equal(metadata.clarificationStatus, "dismissed");
	assert.equal(metadata.visibility, undefined);
	assert.equal(metadata.displayLabel, "User dismissed clarification questions.");
	assert.deepEqual(metadata.clarificationSummary, [
		{
			question: "Clarification status",
			answer: "User dismissed",
		},
	]);
});

test("buildClarificationDismissPrompt tells the agent to wait for next instructions", () => {
	const prompt = buildClarificationDismissPrompt({
		type: "question-card",
		sessionId: "request-user-input-dismiss-prompt",
		round: 1,
		maxRounds: 1,
		title: "Answer these questions to continue",
		requiredCount: 1,
		questions: [{ id: "q-1", label: "What should we name it?", required: true, kind: "text", options: [] }],
	});

	assert.match(prompt, /dismissed the clarification questions/i);
	assert.match(prompt, /do not proceed/i);
	assert.match(prompt, /wait for the user's next instructions/i);
});

test("buildDeferredToolResponse maps selected option ids back to labels", () => {
	const response = buildDeferredToolResponse(
		{
			type: "question-card",
			sessionId: "widget-tool-call-id",
			round: 1,
			maxRounds: 1,
			title: "Answer these questions to continue",
			requiredCount: 2,
			deferredToolCallId: "tool-call-123",
			questions: [
				{
					id: "q-1",
					label: "What should we build?",
					required: true,
					kind: "single-select",
					options: [
						{ id: "dashboard", label: "Dashboard" },
						{ id: "notes", label: "Notes App" },
					],
				},
				{
					id: "q-2",
					label: "Which channels matter?",
					required: true,
					kind: "multi-select",
					options: [
						{ id: "slack", label: "Slack" },
						{ id: "email", label: "Email" },
					],
				},
			],
		},
		{
			"q-1": "dashboard",
			"q-2": ["slack", "email"],
		},
	);

	assert.deepEqual(response, {
		tool_call_id: "tool-call-123",
		result: {
			"What should we build?": ["Dashboard"],
			"Which channels matter?": ["Slack", "Email"],
		},
	});
});

test("buildDeferredToolResponse preserves free-text answers", () => {
	const response = buildDeferredToolResponse(
		{
			type: "question-card",
			sessionId: "widget-free-text",
			round: 1,
			maxRounds: 1,
			title: "Anything else?",
			requiredCount: 1,
			toolCallId: "tool-call-456",
			questions: [
				{
					id: "q-1",
					label: "What should we name it?",
					required: true,
					kind: "text",
					options: [],
				},
			],
		},
		{ "q-1": "Northstar" },
	);

	assert.deepEqual(response, {
		tool_call_id: "tool-call-456",
		result: {
			"What should we name it?": ["Northstar"],
		},
	});
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

test("parseQuestionCardPayload caps generated options at three", () => {
	const payload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "widget-three-option-cap",
		questions: [
			{
				id: "q-1",
				label: "Which knowledge source?",
				kind: "single-select",
				options: [
					{ label: "Reusable answer library" },
					{ label: "Customer/account context" },
					{ label: "Product and security evidence" },
					{ label: "Pricing desk approvals" },
				],
			},
		],
	});

	assert.ok(payload);
	assert.deepEqual(
		payload.questions[0].options.map((option) => option.label),
		[
			"Reusable answer library",
			"Customer/account context",
			"Product and security evidence",
		],
	);
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
	assert.equal(payload.sourceMessageId, "assistant-1");
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

test("getLatestQuestionCardPayload ignores question cards on interrupted assistant turns", () => {
	const payload = getLatestQuestionCardPayload([
		{
			id: "user-1",
			role: "user",
			parts: [{ type: "text", text: "Create a feature", state: "done" }],
		},
		{
			id: "assistant-1",
			role: "assistant",
			metadata: {
				interruption: {
					status: "interrupted",
					source: "user-stop",
					interruptedAt: "2026-03-22T07:20:48.164Z",
				},
			},
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "question-card",
						payload: {
							type: "question-card",
							sessionId: "interrupted-card",
							tool_call_id: "tool-call-999",
							questions: [{ id: "q-1", label: "What kind of feature would you like to build?" }],
						},
					},
				},
			],
		},
	]);

	assert.equal(payload, null);
});

test("getLatestQuestionCardPayload tags repeated tool-call cards with the latest assistant message id", () => {
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
							sessionId: "same-session",
							tool_call_id: "tool-call-123",
							questions: [{ id: "q-1", label: "First round?" }],
						},
					},
				},
			],
		},
		{
			id: "user-1",
			role: "user",
			parts: [{ type: "text", text: "Answer set one", state: "done" }],
		},
		{
			id: "assistant-2",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "question-card",
						payload: {
							type: "question-card",
							sessionId: "same-session",
							tool_call_id: "tool-call-123",
							questions: [{ id: "q-1", label: "Second round?" }],
						},
					},
				},
			],
		},
	]);

	assert.ok(payload);
	assert.equal(payload.toolCallId, "tool-call-123");
	assert.equal(payload.sourceMessageId, "assistant-2");
	assert.equal(payload.questions[0].label, "Second round?");
});

test("hasMatchingClarificationResponse matches exact tool call ids only", () => {
	const questionCard = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "request-user-input-tool-call-123",
		tool_call_id: "tool-call-123",
		questions: [{ id: "q-1", label: "What should we build?" }],
	});
	assert.ok(questionCard);

	const messages = [
		{
			id: "assistant-1",
			role: "assistant",
			parts: [],
		},
		{
			id: "user-1",
			role: "user",
			metadata: {
				source: "clarification-submit",
				clarificationToolCallId: "tool-call-999",
				clarificationSessionId: "request-user-input-tool-call-999",
				clarificationRound: 1,
				clarificationStatus: "answered",
			},
			parts: [{ type: "text", text: "Wrong answer", state: "done" }],
		},
		{
			id: "user-2",
			role: "user",
			metadata: {
				source: "clarification-submit",
				clarificationToolCallId: "tool-call-123",
				clarificationSessionId: "request-user-input-tool-call-123",
				clarificationRound: 1,
				clarificationStatus: "answered",
			},
			parts: [{ type: "text", text: "Correct answer", state: "done" }],
		},
	];

	assert.equal(
		hasMatchingClarificationResponse(messages, {
			...questionCard,
			sourceMessageId: "assistant-1",
		}),
		true,
	);
});

test("getLatestQuestionCardPayload ignores a replayed card once the matching clarification was already submitted", () => {
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
							sessionId: "request-user-input-tool-call-123",
							tool_call_id: "tool-call-123",
							questions: [{ id: "q-1", label: "What should we build?" }],
						},
					},
				},
			],
		},
		{
			id: "user-1",
			role: "user",
			metadata: {
				source: "clarification-submit",
				clarificationToolCallId: "tool-call-123",
				clarificationSessionId: "request-user-input-tool-call-123",
				clarificationRound: 1,
				clarificationStatus: "answered",
			},
			parts: [{ type: "text", text: "Build a dashboard", state: "done" }],
		},
		{
			id: "assistant-2",
			role: "assistant",
			parts: [
				{
					type: "data-widget-data",
					data: {
						type: "question-card",
						payload: {
							type: "question-card",
							sessionId: "request-user-input-tool-call-123",
							tool_call_id: "tool-call-123",
							questions: [{ id: "q-1", label: "What should we build?" }],
						},
					},
				},
			],
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

test("buildClarificationSummaryRows marks explicit 'Skipped' answers for badge rendering", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-skipped",
		questions: [
			{
				id: "q-1",
				label: "What assets should we track?",
				required: true,
				kind: "single-select",
				options: [
					{ id: "hardware", label: "Hardware only" },
					{ id: "full", label: "Hardware + Software" },
				],
			},
			{
				id: "q-2",
				label: "Any optional notes?",
				required: false,
				kind: "text",
				options: [],
			},
		],
	});
	assert.ok(parsedPayload);

	const rows = buildClarificationSummaryRows(parsedPayload, {
		"q-1": "full",
		"q-2": "Skipped",
	});

	assert.deepEqual(rows, [
		{
			question: "What assets should we track?",
			answer: "Hardware + Software",
		},
		{
			question: "Any optional notes?",
			answer: "Skipped",
			status: "skipped",
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

test("buildClarificationSummaryPrompt includes only answers without directives", () => {
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
	// Directives should not appear in the user-visible prompt
	assert.doesNotMatch(prompt, /json-render UI widget/i);
	assert.doesNotMatch(prompt, /continue the user's original request/i);
});

test("buildClarificationSummaryPrompt omits default directive", () => {
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

	assert.match(prompt, /Here are my clarification answers/);
	assert.match(prompt, /A direct answer/);
	// No directive text should be present
	assert.doesNotMatch(prompt, /continue the user's original request now/i);
	assert.doesNotMatch(prompt, /format that best matches the request/i);
	assert.doesNotMatch(prompt, /plan widget/i);
});

test("buildClarificationSummaryPrompt contains only title and answers", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-plan-override",
		title: "Clarify this plan request",
		questions: [
			{
				id: "q-1",
				label: "What outcome do you want?",
				kind: "single-select",
				options: [{ id: "task-manager", label: "Task Manager" }],
			},
		],
	});
	assert.ok(parsedPayload);

	const prompt = buildClarificationSummaryPrompt(parsedPayload, {
		"q-1": "task-manager",
	});

	assert.match(prompt, /Here are my clarification answers for "Clarify this plan request":/);
	assert.match(prompt, /Task Manager/);
	// No plan-mode directives should leak into the visible prompt
	assert.doesNotMatch(prompt, /Plan mode is still active/i);
	assert.doesNotMatch(prompt, /exit_plan_mode/i);
	assert.doesNotMatch(prompt, /continue the user's original request/i);
});

test("buildClarificationSummaryPrompt tells final-round cards to continue with best judgment", () => {
	const parsedPayload = parseQuestionCardPayload({
		type: "question-card",
		sessionId: "summary-final-round",
		title: "Shape the reusable RFP agent",
		round: 1,
		maxRounds: 1,
		questions: [
			{
				id: "knowledge-source",
				label: "Which knowledge should the agent reuse first?",
				kind: "single-select",
				options: [{ id: "answers", label: "Reusable answer library" }],
			},
		],
	});
	assert.ok(parsedPayload);

	const prompt = buildClarificationSummaryPrompt(parsedPayload, {});

	assert.match(prompt, /final clarification round/i);
	assert.match(prompt, /Do not ask more clarification questions/i);
	assert.match(prompt, /use best judgment for unanswered items/i);
});
