const test = require("node:test");
const assert = require("node:assert/strict");
const {
	extractAIGatewayDeferredToolFromAssistantText,
	buildQuestionCardPayloadFromAIGatewayDeferredTool,
	buildPlanWidgetPayloadFromAIGatewayDeferredTool,
	buildQuestionMetaFromQuestionCardPayload,
} = require("./ai-gateway-deferred-tools");
const {
	adaptClarificationAnswers,
} = require("./ask-user-questions-adapter");

test("extracts ask_user_questions deferred-tool envelope and strips it from mixed prose", () => {
	const text = [
		"I need two details first.",
		"",
		"```deferred-tool",
		JSON.stringify({
			tool_name: "ask_user_questions",
			input: {
				questions: [
					{
						question: "Which workflow should I optimize?",
						header: "Workflow",
						options: [
							{ label: "Review", description: "Optimize code review." },
							{ label: "Build", description: "Optimize implementation." },
						],
					},
				],
			},
		}),
		"```",
		"",
		"I will wait for your answer.",
	].join("\n");

	const result = extractAIGatewayDeferredToolFromAssistantText(text);
	assert.ok(result);
	assert.equal(result.toolCall.toolName, "ask_user_questions");
	assert.equal(result.toolCall.input.questions.length, 1);
	assert.equal(result.cleanedText, "I need two details first.\n\nI will wait for your answer.");
	assert.equal(result.duplicateCount, 0);
});

test("returns null for malformed deferred-tool JSON", () => {
	const result = extractAIGatewayDeferredToolFromAssistantText([
		"```deferred-tool",
		'{ "tool_name": "ask_user_questions", "input": ',
		"```",
	].join("\n"));

	assert.equal(result, null);
});

test("dedupes duplicate deferred-tool envelopes by using the first and stripping all", () => {
	const first = {
		tool_name: "ask_user_questions",
		input: {
			questions: [
				{
					question: "First?",
					options: [{ label: "A" }, { label: "B" }],
				},
			],
		},
	};
	const second = {
		tool_name: "exit_plan_mode",
		input: { plan: "Second plan" },
	};
	const result = extractAIGatewayDeferredToolFromAssistantText([
		"Before",
		"```deferred-tool",
		JSON.stringify(first),
		"```",
		"Middle",
		"```deferred-tool",
		JSON.stringify(second),
		"```",
		"After",
	].join("\n"));

	assert.ok(result);
	assert.equal(result.toolCall.toolName, "ask_user_questions");
	assert.equal(result.duplicateCount, 1);
	assert.equal(result.cleanedText, "Before\n\nMiddle\n\nAfter");
});

test("normalizes Gateway ask_user_questions input into question-card payload metadata", () => {
	const payload = buildQuestionCardPayloadFromAIGatewayDeferredTool(
		{
			questions: [
				{
					question: "Which surface should change?",
					header: "Surface",
					options: [
						{ label: "Sidebar", description: "Only the sidebar chat." },
						{ label: "Floating", description: "Only the floating chat." },
					],
				},
			],
		},
		{
			sessionId: "request-user-input-ai-gateway-ask_user_questions-1",
			title: "Answer these questions to continue",
			description: "Pick the best option.",
		},
	);

	assert.ok(payload);
	assert.equal(payload.type, "question-card");
	assert.equal(payload.sessionId, "request-user-input-ai-gateway-ask_user_questions-1");
	assert.equal(payload.questions[0].label, "Which surface should change?");
	assert.equal(payload.questions[0].description, "Surface");
	assert.deepEqual(payload.questions[0].options, [
		{
			id: "option-1",
			label: "Sidebar",
			description: "Only the sidebar chat.",
			recommended: false,
		},
		{
			id: "option-2",
			label: "Floating",
			description: "Only the floating chat.",
			recommended: false,
		},
	]);

	const meta = buildQuestionMetaFromQuestionCardPayload(payload);
	const adapted = adaptClarificationAnswers(
		payload.sessionId,
		{ "q-1": "option-2" },
		meta,
	);
	assert.deepEqual(adapted, {
		"Which surface should change?": ["Floating"],
	});
});

test("normalizes Gateway ask_user_questions input with a three option cap", () => {
	const payload = buildQuestionCardPayloadFromAIGatewayDeferredTool(
		{
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
		},
		{
			sessionId: "request-user-input-ai-gateway-three-options",
		},
	);

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

test("normalizes Gateway exit_plan_mode input into plan widget payload", () => {
	const payload = buildPlanWidgetPayloadFromAIGatewayDeferredTool(
		{
			title: "Chat parity",
			description: "Shared chat controls",
			plan: "## Plan\n\n1. Reuse the shared controls.",
			tasks: [
				{ id: "controls", label: "Wire shared controls", agent: "frontend" },
				"Validate behavior",
			],
		},
		{ toolCallId: "ai-gateway-exit_plan_mode-1" },
	);

	assert.ok(payload);
	assert.equal(payload.title, "Chat parity");
	assert.equal(payload.description, "Shared chat controls");
	assert.equal(payload.markdown, "## Plan\n\n1. Reuse the shared controls.");
	assert.equal(payload.deferredToolCallId, "ai-gateway-exit_plan_mode-1");
	assert.deepEqual(payload.tasks, [
		{
			id: "controls",
			label: "Wire shared controls",
			blockedBy: [],
			agent: "frontend",
		},
		{
			id: "task-2",
			label: "Validate behavior",
			blockedBy: [],
		},
	]);
	assert.deepEqual(payload.agents, ["frontend"]);
});

test("extracts a whole-response JSON deferred tool envelope", () => {
	const result = extractAIGatewayDeferredToolFromAssistantText(JSON.stringify({
		tool_name: "exit_plan_mode",
		input: { plan: "Ship the smallest safe change." },
	}));

	assert.ok(result);
	assert.equal(result.toolCall.toolName, "exit_plan_mode");
	assert.equal(result.cleanedText, "");
});
