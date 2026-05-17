const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const esbuild = require("esbuild");

function loadTsModule(entryPoint) {
	const build = esbuild.buildSync({
		entryPoints: [entryPoint],
		bundle: true,
		platform: "node",
		format: "cjs",
		write: false,
		logLevel: "silent",
	});
	const moduleInstance = new Module(entryPoint);
	moduleInstance.filename = entryPoint;
	moduleInstance.paths = Module._nodeModulePaths(path.dirname(entryPoint));
	moduleInstance._compile(build.outputFiles[0].text, entryPoint);
	return moduleInstance.exports;
}

const {
	collectAssistantThinkingTraceData,
	resolveAssistantThinkingTraceOpen,
	resolveAssistantThinkingTracePhase,
	resolveAssistantThinkingTraceVisibility,
	resolveThinkingToolCallStepOpen,
	shouldCollapseAssistantThinkingTraceOnPhaseChange,
} = loadTsModule(path.join(__dirname, "assistant-thinking-trace-state.ts"));

test("collectAssistantThinkingTraceData detects event-only traces", () => {
	const data = collectAssistantThinkingTraceData({
		parts: [
			{
				type: "data-thinking-event",
				data: {
					eventId: "event-1",
					phase: "start",
					toolName: "search",
					toolCallId: "tool-1",
				},
			},
		],
	});

	assert.equal(data.hasThinkingStatusPart, false);
	assert.equal(data.hasThinkingEvents, true);
	assert.equal(data.hasTraceDataSignals, true);
	assert.equal(data.hasBackendThinkingActivity, true);
	assert.equal(data.thinkingToolCalls[0].state, "running");
});

test("collectAssistantThinkingTraceData preserves status content", () => {
	const data = collectAssistantThinkingTraceData({
		parts: [
			{
				type: "data-thinking-status",
				data: {
					label: "Inspecting files",
					content: "Reading the current implementation",
				},
			},
		],
	});

	assert.equal(data.hasThinkingStatusPart, true);
	assert.deepEqual(data.thinkingNarrationMap.unassociated, [
		"Reading the current implementation",
	]);
	assert.equal(data.lastThinkingStatusPart.data.label, "Inspecting files");
});

test("collectAssistantThinkingTraceData associates narration with tool calls", () => {
	const data = collectAssistantThinkingTraceData({
		parts: [
			{
				type: "data-thinking-status",
				data: {
					label: "Searching",
					content: "Checking the repository",
				},
			},
			{
				type: "data-thinking-event",
				data: {
					eventId: "event-1",
					phase: "start",
					toolName: "rg",
					toolCallId: "tool-1",
					input: { pattern: "thinking" },
				},
			},
			{
				type: "data-thinking-event",
				data: {
					eventId: "event-2",
					phase: "result",
					toolName: "rg",
					toolCallId: "tool-1",
					output: "match",
					outputPreview: "match",
				},
			},
		],
	});

	assert.equal(data.thinkingToolCalls.length, 1);
	assert.equal(data.thinkingToolCalls[0].state, "completed");
	assert.deepEqual(data.thinkingNarrationMap.byToolCallId.get("tool-1"), [
		"Checking the repository",
	]);
});

test("collectAssistantThinkingTraceData accepts filtered thinking tool calls", () => {
	const data = collectAssistantThinkingTraceData(
		{
			parts: [
				{
					type: "data-thinking-event",
					data: {
						eventId: "event-1",
						phase: "start",
						toolName: "request_user_input",
						toolCallId: "tool-1",
					},
				},
			],
		},
		{
			thinkingToolCalls: [],
		},
	);

	assert.equal(data.hasThinkingToolCalls, false);
	assert.equal(data.hasAwaitingInputToolCalls, false);
	assert.deepEqual(data.thinkingToolCalls, []);
});

test("collectAssistantThinkingTraceData marks answered question tools complete", () => {
	const data = collectAssistantThinkingTraceData(
		{
			parts: [
				{
					type: "data-thinking-event",
					data: {
						eventId: "event-1",
						phase: "start",
						toolName: "ask_user_questions",
						toolCallId: "tool-1",
						timestamp: "2026-03-22T00:00:00.000Z",
					},
				},
				{
					type: "data-turn-complete",
					data: {
						timestamp: "2026-03-22T00:01:00.000Z",
					},
				},
			],
		},
		{
			treatQuestionToolCallsAsAnswered: true,
		},
	);

	assert.equal(data.hasAnsweredQuestionToolCalls, true);
	assert.equal(data.hasAwaitingInputToolCalls, false);
	assert.equal(data.thinkingToolCalls[0].state, "completed");
	assert.equal(data.thinkingToolCalls[0].outputPreview, "Questions answered.");
});

test("collectAssistantThinkingTraceData extracts update_todo progress", () => {
	const data = collectAssistantThinkingTraceData({
		parts: [
			{
				type: "data-thinking-event",
				data: {
					eventId: "event-1",
					phase: "result",
					toolName: "update_todo",
					toolCallId: "tool-1",
					output:
						'<todo>\n{"id":1,"content":"Unify trace","active_form":"Unifying trace","status":"in_progress"}\n</todo>',
				},
			},
		],
	});

	assert.equal(data.hasTodoProgressItems, true);
	assert.equal(data.hasLegacyTodoQueueItems, false);
	assert.equal(data.todoProgressItems[0].label, "Unify trace");
});

test("resolveThinkingToolCallStepOpen keeps steps collapsed unless manually opened", () => {
	const manuallyOpenedToolCallIds = new Set(["call:manual"]);

	assert.equal(
		resolveThinkingToolCallStepOpen({
			toolCallId: "call:previous",
			manuallyOpenedToolCallIds,
		}),
		false,
	);
	assert.equal(
		resolveThinkingToolCallStepOpen({
			toolCallId: "call:latest",
			manuallyOpenedToolCallIds,
		}),
		false,
	);
	assert.equal(
		resolveThinkingToolCallStepOpen({
			toolCallId: "call:manual",
			manuallyOpenedToolCallIds,
		}),
		true,
	);
});

test("resolveAssistantThinkingTraceOpen expands by default for active tool-backed thinking", () => {
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			hasThinkingToolCalls: true,
			reasoningPhase: "thinking",
			userOpenOverride: null,
		}),
		true,
	);
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			hasThinkingToolCalls: true,
			reasoningPhase: "preload",
			userOpenOverride: null,
		}),
		true,
	);
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			hasThinkingToolCalls: true,
			reasoningPhase: "completed",
			userOpenOverride: null,
		}),
		false,
	);
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			hasThinkingToolCalls: false,
			reasoningPhase: "thinking",
			userOpenOverride: null,
		}),
		false,
	);
});

test("resolveAssistantThinkingTraceOpen can suppress auto expansion for question-card waits", () => {
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			allowAutoOpen: false,
			hasThinkingToolCalls: true,
			reasoningPhase: "thinking",
			userOpenOverride: null,
		}),
		false,
	);
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			allowAutoOpen: false,
			hasThinkingToolCalls: true,
			reasoningPhase: "thinking",
			userOpenOverride: true,
		}),
		true,
	);
});

test("assistant thinking trace suppresses auto-open for question-card tool states", () => {
	const source = fs.readFileSync(
		path.join(__dirname, "../components/assistant-thinking-trace.tsx"),
		"utf8",
	);

	assert.match(
		source,
		/allowAutoOpen: !data\.hasAwaitingInputToolCalls && !data\.hasAnsweredQuestionToolCalls/u,
	);
});

test("resolveAssistantThinkingTraceOpen respects manual user toggles", () => {
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			hasThinkingToolCalls: true,
			reasoningPhase: "thinking",
			userOpenOverride: false,
		}),
		false,
	);
	assert.equal(
		resolveAssistantThinkingTraceOpen({
			hasThinkingToolCalls: true,
			reasoningPhase: "completed",
			userOpenOverride: true,
		}),
		true,
	);
});

test("shouldCollapseAssistantThinkingTraceOnPhaseChange collapses when thinking completes", () => {
	assert.equal(
		shouldCollapseAssistantThinkingTraceOnPhaseChange({
			previousReasoningPhase: "thinking",
			reasoningPhase: "completed",
		}),
		true,
	);
	assert.equal(
		shouldCollapseAssistantThinkingTraceOnPhaseChange({
			previousReasoningPhase: "completed",
			reasoningPhase: "completed",
		}),
		false,
	);
	assert.equal(
		shouldCollapseAssistantThinkingTraceOnPhaseChange({
			previousReasoningPhase: "thinking",
			reasoningPhase: "thinking",
		}),
		false,
	);
});

test("collectAssistantThinkingTraceData includes legacy queues and agent executions", () => {
	const data = collectAssistantThinkingTraceData({
		parts: [
			{
				type: "data-todo-queue",
				data: {
					items: [
						{
							id: "task-1",
							text: "Review",
							blockedBy: [],
						},
					],
				},
			},
			{
				type: "data-agent-execution",
				data: {
					agentId: "agent-1",
					agentName: "Explorer",
					taskId: "task-1",
					taskLabel: "Inspect trace",
					status: "working",
					content: "Reading files",
				},
			},
		],
	});

	assert.equal(data.hasLegacyTodoQueueItems, true);
	assert.equal(data.hasAgentExecutions, true);
	assert.equal(data.todoQueueItems[0].text, "Review");
	assert.equal(data.agentExecutions[0].agentName, "Explorer");
});

test("resolveAssistantThinkingTracePhase handles awaiting and completed turns", () => {
	assert.equal(
		resolveAssistantThinkingTracePhase({
			isThinkingActive: true,
			hasTurnComplete: false,
			isThinkingLifecycleStreaming: true,
			hasBackendThinkingActivity: true,
			hasAwaitingInputToolCalls: true,
			lifecyclePhase: "completed",
		}),
		"thinking"
	);

	assert.equal(
		resolveAssistantThinkingTracePhase({
			isThinkingActive: true,
			hasTurnComplete: true,
			isThinkingLifecycleStreaming: false,
			hasBackendThinkingActivity: true,
			hasAwaitingInputToolCalls: false,
			lifecyclePhase: "idle",
		}),
		"completed"
	);
});

test("resolveAssistantThinkingTracePhase keeps shimmer active while post-tool widget generation is pending", () => {
	assert.equal(
		resolveAssistantThinkingTracePhase({
			isThinkingActive: true,
			hasTurnComplete: true,
			isThinkingLifecycleStreaming: false,
			hasBackendThinkingActivity: true,
			hasAwaitingInputToolCalls: false,
			isPostToolsGeneration: true,
			hasWidgetOutput: false,
			lifecyclePhase: "completed",
		}),
		"thinking"
	);

	assert.equal(
		resolveAssistantThinkingTracePhase({
			isThinkingActive: true,
			hasTurnComplete: true,
			isThinkingLifecycleStreaming: false,
			hasBackendThinkingActivity: true,
			hasAwaitingInputToolCalls: false,
			isPostToolsGeneration: true,
			hasWidgetOutput: true,
			lifecyclePhase: "thinking",
		}),
		"completed"
	);
});

test("completed thinking tool calls suppress the collapsed byline", () => {
	const chainOfThoughtSource = fs.readFileSync(
		path.join(__dirname, "../../../ui-custom/chain-of-thought.tsx"),
		"utf8",
	);
	const assistantTraceSource = fs.readFileSync(
		path.join(__dirname, "../components/assistant-thinking-trace.tsx"),
		"utf8",
	);

	assert.match(
		chainOfThoughtSource,
		/const shouldShowDescription = description !== null;/u,
	);
	assert.match(
		assistantTraceSource,
		/description=\{\s*toolCall\.state === "completed"\s*\?\s*null\s*:\s*getThinkingToolByline\(toolCall, narration\)\s*\}/u,
	);
});

test("resolveAssistantThinkingTraceVisibility latches during transient empty frames", () => {
	assert.deepEqual(
		resolveAssistantThinkingTraceVisibility({
			isThinkingActive: false,
			isResponseInFlight: true,
			wasLatched: true,
		}),
		{
			effectiveIsThinkingActive: true,
			nextLatched: true,
		}
	);
});
