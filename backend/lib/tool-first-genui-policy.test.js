const test = require("node:test");
const assert = require("node:assert/strict");

const {
	TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY,
	resolveToolFirstPolicy,
	isToolNameRelevant,
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

test("resolveToolFirstPolicy matches integration-domain prompts", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Check my Google Calendar availability tomorrow and propose slots",
	});

	assert.equal(policy.matched, true);
	assert.ok(policy.domains.includes("google-calendar"));
	assert.match(policy.instruction, /Tool-first execution policy/);
	assert.equal(policy.enforcement.mode, TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY);
	assert.equal(policy.enforcement.maxRelevantRetries, 1);
});

test("resolveToolFirstPolicy adds Google Calendar required-args guidance", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "List Google Calendar events",
	});

	assert.equal(policy.matched, true);
	assert.ok(policy.domains.includes("google-calendar"));
	assert.match(policy.instruction, /Google Calendar/i);
	assert.match(policy.instruction, /calendarId/i);
	assert.match(policy.instruction, /timeMin/i);
	assert.match(policy.instruction, /timeMax/i);
	assert.match(policy.instruction, /next 7 days/i);
	assert.match(policy.instruction, /local timezone/i);
	assert.match(policy.instruction, /UTC ISO 8601/i);
});

test("resolveToolFirstPolicy ignores casual prompts", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Hey, can you tell me a joke?",
	});

	assert.equal(policy.matched, false);
	assert.equal(policy.domains.length, 0);
	assert.equal(policy.instruction, null);
});

test("resolveToolFirstPolicy does not match generic translation prompts", () => {
	const policy = resolveToolFirstPolicy({
		prompt: 'translate "Let\'s do this together" to Mandarin',
	});

	assert.equal(policy.matched, false);
	assert.equal(policy.domains.length, 0);
});

test("resolveToolFirstPolicy matches explicit Google Translate prompts", () => {
	const policy = resolveToolFirstPolicy({
		prompt: 'Use Google Translate to translate "Hello team" to Spanish',
	});

	assert.equal(policy.matched, true);
	assert.ok(policy.domains.includes("google-translate"));
});

test("resolveToolFirstPolicy matches figma design-context prompts", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Get Figma design context",
	});

	assert.equal(policy.matched, true);
	assert.ok(policy.domains.includes("figma"));
});

test("resolveToolFirstPolicy matches Drive prompts without explicit Google prefix", () => {
	const listPolicy = resolveToolFirstPolicy({
		prompt: "List all files in my Drive?",
	});
	const storagePolicy = resolveToolFirstPolicy({
		prompt: "Check my Drive storage info",
	});

	assert.equal(listPolicy.matched, true);
	assert.ok(listPolicy.domains.includes("google-drive-docs"));
	assert.equal(storagePolicy.matched, true);
	assert.ok(storagePolicy.domains.includes("google-drive-docs"));
});

test("isToolNameRelevant maps tool names against matched domains", () => {
	const relevant = isToolNameRelevant({
		toolName: "mcp__slack__search_channels",
		domains: ["slack"],
	});
	const irrelevant = isToolNameRelevant({
		toolName: "mcp__figma__get_design_context",
		domains: ["slack"],
	});

	assert.equal(relevant, true);
	assert.equal(irrelevant, false);
});

test("isToolNameRelevant matches Atlassian Google Drive URL bridge tools", () => {
	const relevant = isToolNameRelevant({
		toolName: "google_google_drive_atlassian_url_get_content",
		domains: ["google-drive-docs"],
	});

	assert.equal(relevant, true);
});

test("browser automation treats bash helper calls as relevant", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Navigate to example.com and click the more information link",
	});

	assert.equal(policy.matched, true);
	assert.ok(policy.domains.includes("browser-automation"));
	assert.match(policy.instruction, /chromium-preview-agent/i);
	assert.match(policy.instruction, /Do not call `mcp_get_tool_schema`/i);
	assert.equal(
		isToolNameRelevant({
			toolName: "bash",
			domains: ["browser-automation"],
		}),
		true
	);
});

test("execution state tracks relevant tool success", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Find project context using Teamwork Graph and summarize updates",
	});
	const state = createToolFirstExecutionState(policy);

	recordToolThinkingEvent(state, {
		phase: "start",
		toolName: "mcp__teamwork_graph__project_context",
	});
	recordToolThinkingEvent(state, {
		phase: "result",
		toolName: "mcp__teamwork_graph__project_context",
		outputPreview: "Project context loaded",
	});

	assert.equal(state.relevantToolStarts, 1);
	assert.equal(state.relevantToolResults, 1);
	assert.equal(hasRelevantToolSuccess(state), true);
	assert.equal(hasRelevantToolObservation(state), true);
});

test("execution state counts resolved Slack integration tool results", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Send a Slack message saying hi",
	});
	const state = createToolFirstExecutionState(policy);

	recordToolThinkingEvent(state, {
		phase: "result",
		toolName: "slack_slack_atlassian_channel_create_message",
		outputPreview: "Message posted to CMM7V62NN",
	});

	assert.equal(state.relevantToolResults, 1);
	assert.equal(hasRelevantToolSuccess(state), true);
});

test("fallback text explains text-only mode when tools fail", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Search Compass for webtransport ownership",
	});
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
		rovoDevFallback: false,
	});
	assert.match(message, /couldn't verify a successful/i);
	assert.match(message, /Last relevant tool/i);
	assert.match(message, /re-authenticate/i);
});

test("buildToolContextForGenui includes relevant result summaries", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Summarize Google Drive comments and permissions for this doc",
	});
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
	const policy = resolveToolFirstPolicy({
		prompt: "List Jira issues assigned to me",
	});
	const state = createToolFirstExecutionState(policy);
	recordToolFirstAttempt(state);
	recordToolFirstAttempt(state, { isRetry: true });

	assert.equal(state.attempts, 2);
	assert.equal(state.retriesUsed, 1);
});

test("buildToolFirstRetryInstruction includes domain and retry details", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Search Slack thread updates",
	});
	const instruction = buildToolFirstRetryInstruction({
		policy,
		attemptNumber: 2,
		remainingRetries: 1,
	});

	assert.match(instruction, /Retry attempt 2/i);
	assert.match(instruction, /Slack/i);
	assert.match(instruction, /Remaining retries/i);
});

test("buildToolFirstRetryInstruction adds TWG fallback guidance for work-summary windows", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Last 7 days of work",
	});
	const state = createToolFirstExecutionState(policy);
	recordToolThinkingEvent(state, {
		phase: "error",
		toolName: "mcp__teamwork_graph__cypher_query",
		errorText: "SEMANTIC_ERROR: invalid datetime format. Expected ISO 8601 datetime format",
	});
	const instruction = buildToolFirstRetryInstruction({
		policy,
		attemptNumber: 2,
		remainingRetries: 0,
		execution: state,
	});

	assert.match(instruction, /Jira JQL/i);
	assert.match(instruction, /Confluence CQL/i);
	assert.match(instruction, /ISO 8601/i);
	assert.match(instruction, /validation error/i);
});

test("buildToolFirstRetryInstruction adds Google Calendar validation retry guidance", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "List Google Calendar events",
	});
	const state = createToolFirstExecutionState(policy);
	recordToolThinkingEvent(state, {
		phase: "error",
		toolName: "google_google_calendar_atlassian_calendar_get_events",
		errorText: "Expected ISO 8601 date-time for timeMin",
	});

	const instruction = buildToolFirstRetryInstruction({
		policy,
		attemptNumber: 2,
		remainingRetries: 0,
		execution: state,
	});

	assert.match(instruction, /Google Calendar validation retry directive/i);
	assert.match(instruction, /Google Calendar/i);
	assert.match(instruction, /calendarId/i);
	assert.match(instruction, /timeMin/i);
	assert.match(instruction, /timeMax/i);
	assert.match(instruction, /UTC ISO 8601/i);
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
	const policy = resolveToolFirstPolicy({
		prompt: "Check Google Calendar availability this week",
	});
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
		rovoDevFallback: false,
	});

	assert.match(warning.message, /couldn't verify a successful/i);
	assert.deepEqual(warning.domains, ["Google Calendar"]);
	assert.equal(warning.attempts, 1);
	assert.equal(warning.retriesUsed, 0);
	assert.equal(warning.hadRelevantToolStart, true);
	assert.equal(warning.relevantToolErrors, 1);
	assert.equal(warning.lastRelevantToolName, "mcp__google_calendar__list_events");
	assert.equal(warning.lastRelevantErrorCategory, "permission");
	assert.equal(warning.rovoDevFallback, false);
});

test("buildToolFirstTextFallback adds Google Calendar required-field validation hints", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "List Google Calendar events",
	});
	const state = createToolFirstExecutionState(policy);
	recordToolFirstAttempt(state);
	recordToolThinkingEvent(state, {
		phase: "error",
		toolName: "google_google_calendar_atlassian_calendar_get_events",
		errorText: "Invalid datetime format for timeMin",
	});

	const message = buildToolFirstTextFallback({
		policy,
		execution: state,
		rovoDevFallback: false,
	});

	assert.match(message, /Google Calendar/i);
	assert.match(message, /calendarId/i);
	assert.match(message, /timeMin/i);
	assert.match(message, /timeMax/i);
	assert.match(message, /UTC ISO 8601/i);
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

test("resolveToolFirstPolicy matches work-activity prompts to teamwork-graph domain", () => {
	const cases = [
		"Last 7 days of work",
		"Last seven days of work",
		"Show my recent work",
		"summarize my work from last week",
		"recent work activity this week",
		"What did I work on this week?",
		"my work activity",
		"past 2 weeks of work",
		"my work activities",
		"What have you worked on lately?",
	];

	for (const prompt of cases) {
		const policy = resolveToolFirstPolicy({ prompt });
		assert.equal(policy.matched, true, `Expected "${prompt}" to match`);
		assert.ok(
			policy.domains.includes("teamwork-graph"),
			`Expected "${prompt}" to match teamwork-graph domain, got: ${policy.domains.join(", ")}`
		);
	}
});

test("resolveToolFirstPolicy enables TWG time-window fallback relevance domains", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Last 7 days of work summary",
	});

	assert.equal(policy.matched, true);
	assert.ok(policy.domains.includes("teamwork-graph"));
	assert.ok(policy.relevanceDomains.includes("jira"));
	assert.ok(policy.relevanceDomains.includes("confluence"));
	assert.equal(policy.teamworkGraphTimeWindow.enabled, true);
	assert.match(policy.instruction, /Teamwork Graph/i);
	assert.match(policy.instruction, /Jira JQL and Confluence CQL/i);
	assert.match(policy.instruction, /ISO 8601/i);
});

test("shouldSuppressToolFirstIntentStatus suppresses early intent labels until relevant tool starts", () => {
	const policy = resolveToolFirstPolicy({
		prompt: "Last 7 days of work",
	});
	const state = createToolFirstExecutionState(policy);

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

test("stripToolFirstFailureNarrative keeps normal narrative unchanged", () => {
	const input = "The Slack message was sent successfully.";
	const output = stripToolFirstFailureNarrative(input);
	assert.equal(output.replaced, false);
	assert.equal(output.text, input);
});
