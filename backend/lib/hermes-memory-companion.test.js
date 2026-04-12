const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildHermesMemoryCompanionExecutionInput,
	buildHermesMemoryCompanionMessages,
	getLatestAssistantTextFromMessages,
	parseStructuredHermesMemoryFallback,
	runHermesMemoryCompanionReview,
} = require("./hermes-memory-companion");
const {
	parseStructuredJsonResponse,
	runRovoDevBackgroundTask,
} = require("./rovo-task-executor");

test("buildHermesMemoryCompanionMessages asks the reviewer to decide from full-turn meaning", () => {
	const messages = buildHermesMemoryCompanionMessages({
		conversationHistory: [
			{ type: "assistant", content: "I can keep that preference for this chat." },
		],
		latestAssistantMessage: "I'll save it.",
		latestUserMessage: "Save this to durable memory.",
	});

	assert.equal(messages.length, 2);
	assert.match(messages[0].content, /Durable memory here means Hermes memory/i);
	assert.match(messages[0].content, /Decide from the meaning of the full turn/i);
	assert.match(messages[0].content, /Ignore mistaken assistant claims about lacking a memory tool/i);
	assert.match(messages[1].content, /Latest user message:/);
});

test("getLatestAssistantTextFromMessages returns the latest assistant text chunk", () => {
	const text = getLatestAssistantTextFromMessages([
		{ role: "assistant", parts: [{ type: "text", text: "Older response" }] },
		{ role: "user", parts: [{ type: "text", text: "Please remember this." }] },
		{ role: "assistant", parts: [{ type: "data-widget-data", data: { type: "hermes-memory" } }] },
		{ role: "assistant", parts: [{ type: "text", text: "Newest response" }] },
	]);

	assert.equal(text, "Newest response");
});

test("parseStructuredHermesMemoryFallback accepts fenced JSON actions", () => {
	const parsed = parseStructuredHermesMemoryFallback([
		"```json",
		"{",
		'  "mode": "structured-memory-fallback",',
		'  "summary": "Save the preference",',
		'  "actions": [',
		'    { "action": "add", "target": "memory", "content": "Prefer concise replies." }',
		"  ]",
		"}",
		"```",
	].join("\n"));

	assert.equal(parsed?.mode, "structured-memory-fallback");
	assert.equal(parsed?.summary, "Save the preference");
	assert.equal(parsed?.actions.length, 1);
	assert.equal(parsed?.actions[0].action, "add");
	assert.equal(parsed?.actions[0].target, "memory");
	assert.equal(parsed?.actions[0].content, "Prefer concise replies.");
});

test("parseStructuredHermesMemoryFallback accepts an explicit no-op actions array", () => {
	const parsed = parseStructuredHermesMemoryFallback([
		"```json",
		"{",
		'  "mode": "structured-memory-fallback",',
		'  "actions": []',
		"}",
		"```",
	].join("\n"));

	assert.equal(parsed?.mode, "structured-memory-fallback");
	assert.deepEqual(parsed?.actions, []);
});

test("parseStructuredHermesMemoryFallback rejects malformed non-empty actions arrays", () => {
	const parsed = parseStructuredHermesMemoryFallback([
		"```json",
		"{",
		'  "mode": "structured-memory-fallback",',
		'  "actions": [{ "action": "add", "target": "user" }]',
		"}",
		"```",
	].join("\n"));

	assert.equal(parsed, null);
});

test("runRovoDevBackgroundTask parses structured fallback output", async () => {
	let capturedInput = null;

	const result = await runRovoDevBackgroundTask({
		generateTextImpl: async (input) => {
			capturedInput = input;
			return [
				"```json",
				"{",
				'  "mode": "structured-memory-fallback",',
				'  "actions": [',
				'    { "action": "replace", "target": "user", "content": "Prefers terse implementation notes." }',
				"  ]",
				"}",
				"```",
			].join("\n");
		},
		parseStructuredResult: parseStructuredJsonResponse,
		prompt: "Summarize a turn.",
		system: "Memory review",
		timeoutMs: 50,
		});

		assert.equal(capturedInput.conflictPolicy, "wait-for-turn");
		assert.equal(capturedInput.prompt, "Summarize a turn.");
		assert.match(capturedInput.system, /Memory review/u);
		assert.equal(result.didRun, true);
		assert.equal(result.structuredResult.mode, "structured-memory-fallback");
		assert.equal(result.structuredResult.actions.length, 1);
	assert.equal(result.structuredResult.actions[0].action, "replace");
});

test("runHermesMemoryCompanionReview applies structured fallback memory actions", async () => {
	const appliedActions = [];
	const result = await runHermesMemoryCompanionReview({
		conversationHistory: [
			{ type: "user", content: "Can you remember a preference for later?" },
		],
		executeBackgroundTaskImpl: async (input) => {
			assert.equal(input.system.includes("[Hermes Memory Companion]"), true);
			assert.equal(input.prompt.includes("Recent conversation:"), true);
			return {
				didRun: true,
				responseText: [
					"```json",
					"{",
					'  "mode": "structured-memory-fallback",',
					'  "summary": "Persist the user preference.",',
					'  "actions": [',
					'    { "action": "add", "target": "user", "content": "Prefers concise implementation notes." }',
					"  ]",
					"}",
					"```",
				].join("\n"),
				structuredResult: {
					actions: [
						{
							action: "add",
							content: "Prefers concise implementation notes.",
							target: "user",
						},
					],
					mode: "structured-memory-fallback",
					summary: "Persist the user preference.",
				},
			};
		},
		applyStructuredMemoryActionsImpl: async (actions) => {
			appliedActions.push(...actions);
			return actions.map((action, index) => ({
				...action,
				memory: {
					id: `memory-${index}`,
					target: action.target,
				},
			}));
		},
		latestAssistantMessage: "I'll save that preference for later.",
		latestUserMessage: "Save this to durable memory.",
		timeoutMs: 50,
	});

	assert.equal(result.didReview, true);
	assert.equal(result.responseText.includes("structured-memory-fallback"), true);
	assert.equal(appliedActions.length, 1);
	assert.equal(result.structuredFallback.mode, "structured-memory-fallback");
	assert.equal(result.structuredMemoryActions.length, 1);
	assert.equal(result.structuredMemoryActions[0].target, "user");
	assert.equal(result.structuredMemoryActions[0].action, "add");
});

test("runHermesMemoryCompanionReview preserves explicit no-op reviewer decisions", async () => {
	const result = await runHermesMemoryCompanionReview({
		conversationHistory: [
			{ type: "user", content: "Remember to do XYZ tomorrow." },
		],
		executeBackgroundTaskImpl: async () => ({
			didRun: true,
			responseText: '{ "mode": "structured-memory-fallback", "actions": [] }',
			structuredResult: {
				mode: "structured-memory-fallback",
				summary: "This is a reminder-style request, not durable memory.",
				actions: [],
			},
		}),
		latestAssistantMessage: "I can help you set a reminder.",
		latestUserMessage: "Remember to do XYZ tomorrow.",
		timeoutMs: 50,
	});

	assert.equal(result.didReview, true);
	assert.deepEqual(result.structuredMemoryActions, []);
	assert.deepEqual(result.structuredFallback.actions, []);
});

test("runHermesMemoryCompanionReview rejects invalid reviewer output instead of silently no-oping", async () => {
	await assert.rejects(
		runHermesMemoryCompanionReview({
			conversationHistory: [
				{ type: "user", content: "Save this preference for later." },
			],
			executeBackgroundTaskImpl: async () => ({
				didRun: true,
				responseText: "Nothing to save.",
				structuredResult: null,
			}),
			latestAssistantMessage: "I'll save it.",
			latestUserMessage: "Save this preference for later.",
			timeoutMs: 50,
		}),
		(error) => error?.code === "HERMES_MEMORY_COMPANION_INVALID_OUTPUT",
	);
});

test("buildHermesMemoryCompanionExecutionInput preserves the message payload", () => {
	const input = buildHermesMemoryCompanionExecutionInput({
		conversationHistory: [
			{ type: "assistant", content: "I will keep that in mind." },
		],
		latestAssistantMessage: "I can do that.",
		latestUserMessage: "Please remember that preference.",
	});

	assert.match(input.system, /\[Hermes Memory Companion\]/);
	assert.match(input.prompt, /Latest user message:/);
	assert.match(input.prompt, /Please remember that preference\./);
});
