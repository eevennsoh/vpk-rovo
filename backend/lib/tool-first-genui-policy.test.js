const test = require("node:test");
const assert = require("node:assert/strict");

const {
	TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY,
	resolveToolFirstPolicy,
	createToolFirstExecutionState,
	recordToolFirstAttempt,
	recordToolThinkingEvent,
	hasRelevantToolSuccess,
	hasRelevantToolObservation,
	shouldSuppressToolFirstIntentStatus,
	getToolFirstRetryDelayMs,
	buildToolFirstRetryInstruction,
	buildToolContextForGenui,
	classifyToolErrorCategory,
	buildToolFirstTextFallback,
	stripToolFirstFailureNarrative,
	buildToolFirstWarningPayload,
} = require("./tool-first-genui-policy");

test("resolveToolFirstPolicy disables local tool-first matching for broad prompts", () => {
	const prompts = [
		"Send a Slack message saying hi",
		"Check my Google Calendar availability tomorrow and propose slots",
		"How do I manage space on this page layout?",
		"Can you summarize the dependencies of this React component?",
		"What is the best way to structure a project update email?",
		"Show me the recent work on this graph rendering bug",
	];

	for (const prompt of prompts) {
		const policy = resolveToolFirstPolicy({ prompt });
		assert.equal(policy.matched, false, `Expected local tool-first matching to stay disabled for "${prompt}"`);
		assert.deepEqual(policy.domains, []);
		assert.equal(policy.instruction, null);
	}
});

test("resolveToolFirstPolicy still returns enforcement defaults while disabled", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Hey, can you tell me a joke?",
	});

	assert.equal(policy.matched, false);
	assert.equal(policy.enforcement.mode, TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY);
	assert.equal(policy.enforcement.maxRelevantRetries, 1);
	assert.equal(policy.teamworkGraphTimeWindow.enabled, false);
});

test("execution state still tracks manually-scoped relevant tool success", () => {
	const state = createToolFirstExecutionState({
		matched: true,
		domains: ["slack"],
		relevanceDomains: ["slack"],
		domainLabels: ["Slack"],
	});

	recordToolThinkingEvent(state, {
		phase: "start",
		toolName: "slack_slack_atlassian_channel_create_message",
	});
	recordToolThinkingEvent(state, {
		phase: "result",
		toolName: "slack_slack_atlassian_channel_create_message",
		outputPreview: "Message posted to CMM7V62NN",
	});

	assert.equal(state.relevantToolStarts, 1);
	assert.equal(state.relevantToolResults, 1);
	assert.equal(hasRelevantToolSuccess(state), true);
	assert.equal(hasRelevantToolObservation(state), true);
});

test("buildToolContextForGenui includes relevant result summaries for manual policies", () => {
	const policy = {
		matched: true,
		domains: ["google-drive-docs"],
		relevanceDomains: ["google-drive-docs"],
		domainLabels: ["Google Drive / Docs"],
	};
	const state = createToolFirstExecutionState(policy);
	recordToolThinkingEvent(state, {
		phase: "result",
		toolName: "mcp__google_drive__get_comments",
		outputPreview: "2 unresolved comments about scope and timeline",
	});

	const context = buildToolContextForGenui({
		policy,
		execution: state,
		assistantText: "I found two open comments.",
	});
	assert.match(context, /Tool execution context/);
	assert.match(context, /Recent relevant tool results/);
	assert.match(context, /unresolved comments/i);
});

test("recordToolFirstAttempt increments attempt and retry counters", () => {
	const state = createToolFirstExecutionState({
		matched: true,
		domains: ["jira"],
		relevanceDomains: ["jira"],
		domainLabels: ["Jira"],
	});

	recordToolFirstAttempt(state);
	recordToolFirstAttempt(state, { isRetry: true });

	assert.equal(state.attempts, 2);
	assert.equal(state.retriesUsed, 1);
});

test("buildToolFirstRetryInstruction still reports manual retry metadata", () => {
	const instruction = buildToolFirstRetryInstruction({
		policy: {
			matched: true,
			domains: ["slack"],
			relevanceDomains: ["slack"],
			domainLabels: ["Slack"],
		},
		attemptNumber: 2,
		remainingRetries: 1,
	});

	assert.match(instruction, /Retry attempt 2/i);
	assert.match(instruction, /Slack/i);
	assert.match(instruction, /Remaining retries/i);
});

test("getToolFirstRetryDelayMs returns configured backoff values", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Find Confluence page updates",
	});

	assert.equal(getToolFirstRetryDelayMs({ policy, retryIndex: 0 }), 750);
	assert.equal(getToolFirstRetryDelayMs({ policy, retryIndex: 1 }), 750);
	assert.equal(getToolFirstRetryDelayMs({ policy, retryIndex: 8 }), 750);
});

test("classifyToolErrorCategory maps common failure types", () => {
	assert.equal(
		classifyToolErrorCategory("SEMANTIC_ERROR invalid datetime format expected ISO 8601"),
		"validation"
	);
	assert.equal(classifyToolErrorCategory("401 Unauthorized"), "auth");
	assert.equal(classifyToolErrorCategory("403 forbidden"), "permission");
	assert.equal(classifyToolErrorCategory("404 not found"), "not_found");
	assert.equal(classifyToolErrorCategory("429 rate limit"), "rate_limit");
	assert.equal(classifyToolErrorCategory("503 service unavailable"), "transient_network");
	assert.equal(classifyToolErrorCategory("something odd happened"), "unknown");
});

test("buildToolFirstWarningPayload returns structured warning metadata", () => {
	const policy = {
		matched: true,
		domains: ["google-calendar"],
		relevanceDomains: ["google-calendar"],
		domainLabels: ["Google Calendar"],
	};
	const state = createToolFirstExecutionState(policy);
	recordToolFirstAttempt(state);
	recordToolThinkingEvent(state, {
		phase: "error",
		toolName: "mcp__google_calendar__list_events",
		errorText: "403 forbidden",
	});

	const warning = buildToolFirstWarningPayload({
		policy,
		execution: state,
		rovoFallback: false,
	});

	assert.match(warning.message, /couldn't verify a successful/i);
	assert.deepEqual(warning.domains, ["Google Calendar"]);
	assert.equal(warning.attempts, 1);
	assert.equal(warning.retriesUsed, 0);
	assert.equal(warning.hadRelevantToolStart, true);
	assert.equal(warning.relevantToolErrors, 1);
	assert.equal(warning.lastRelevantToolName, "mcp__google_calendar__list_events");
	assert.equal(warning.lastRelevantErrorCategory, "permission");
	assert.equal(warning.rovoFallback, false);
});

test("buildToolFirstTextFallback still produces generic failure guidance", () => {
	const policy = {
		matched: true,
		domains: ["compass"],
		relevanceDomains: ["compass"],
		domainLabels: ["Compass"],
	};
	const state = createToolFirstExecutionState(policy);
	recordToolFirstAttempt(state);
	recordToolThinkingEvent(state, {
		phase: "error",
		toolName: "mcp__compass__component_search",
		errorText: "403 unauthorized",
	});

	const message = buildToolFirstTextFallback({
		policy,
		execution: state,
		rovoFallback: false,
	});
	assert.match(message, /couldn't verify a successful/i);
	assert.match(message, /Last relevant tool/i);
	assert.match(message, /re-authenticate/i);
});

test("shouldSuppressToolFirstIntentStatus suppresses early intent labels until relevant tool starts", () => {
	const state = createToolFirstExecutionState({
		matched: true,
		domains: ["teamwork-graph"],
		relevanceDomains: ["teamwork-graph"],
		domainLabels: ["Teamwork Graph"],
	});

	assert.equal(
		shouldSuppressToolFirstIntentStatus({
			execution: state,
			label: "Classifying request",
			content: "Detected intent: genui",
		}),
		true
	);

	recordToolThinkingEvent(state, {
		phase: "start",
		toolName: "mcp__teamwork_graph__work_summary",
	});

	assert.equal(
		shouldSuppressToolFirstIntentStatus({
			execution: state,
			label: "Classifying request",
			content: "Detected intent: genui",
		}),
		false
	);
});

test("stripToolFirstFailureNarrative removes fallback warning paragraph", () => {
	const input = [
		"I sent the message successfully.",
		"",
		"I couldn't verify a successful Slack tool result after 3 attempts (2 retries). Relevant integration tools were called, but no successful result was returned. If you need a tool-grounded result, retry after resolving the issue above.",
	].join("\n");

	const output = stripToolFirstFailureNarrative(input);
	assert.equal(output.replaced, true);
	assert.equal(output.text, "I sent the message successfully.");
});

test("stripToolFirstFailureNarrative keeps normal narrative unchanged", () => {
	const input = "The Slack message was sent successfully.";
	const output = stripToolFirstFailureNarrative(input);
	assert.equal(output.replaced, false);
	assert.equal(output.text, input);
});
