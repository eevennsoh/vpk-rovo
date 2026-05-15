const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildToolObservationStructuredFallback,
} = require("./genui-tool-observation-structured-fallback");

function findFirstElementByType(spec, type) {
	if (!spec || typeof spec !== "object" || typeof type !== "string") {
		return null;
	}

	const elements = spec.elements;
	if (!elements || typeof elements !== "object") {
		return null;
	}

	for (const value of Object.values(elements)) {
		if (value && typeof value === "object" && value.type === type) {
			return value;
		}
	}

	return null;
}

test("buildToolObservationStructuredFallback renders sections for multiple tools", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "last 7 days of work",
		observations: [
			{
				phase: "result",
				toolName: "mcp__jira__search_issues",
				rawOutput: {
					issues: [
						{
							key: "AIDOPS-101",
							summary: "Agent Logo Change",
							status: "Work in progress",
						},
					],
				},
				text: "AIDOPS-101 returned",
			},
			{
				phase: "result",
				toolName: "mcp__confluence__search_pages",
				rawOutput: {
					results: [
						{
							title: "Project Documentation - Draft",
							space: "Playbook Sandbox",
							url: "https://hello.atlassian.net/wiki/spaces/PLAY/pages/1234",
						},
					],
				},
				text: "Project Documentation - Draft returned",
			},
			{
				phase: "result",
				toolName: "mcp__google_calendar__list_events",
				rawOutput: {
					events: [
						{
							summary: "Design Review",
							start: "2026-02-23T09:00:00Z",
						},
					],
				},
				text: "Design Review event",
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-structured");
	assert.equal(result.resultCount, 3);
	assert.equal(result.errorCount, 0);
	assert.match(result.summary, /Rendered 3 tool events across 3 tools/);

	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /jira search issues \(1\)/i);
	assert.match(serializedSpec, /confluence search pages \(1\)/i);
	assert.match(serializedSpec, /google calendar list events \(1\)/i);
	// Rich rendering: Jira issues render as ObjectTile with summary as title
	assert.match(serializedSpec, /Agent Logo Change/);
	assert.match(serializedSpec, /Project Documentation - Draft/);
	assert.match(serializedSpec, /Design Review/);
});

test("buildToolObservationStructuredFallback still uses generic structured fallback when unrelated tools contribute results", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "show me what i worked on for the last 7 days",
		observations: [
			{
				phase: "result",
				toolName: "get atlassian site urls",
				text: "Accessible Sites:\nhello.atlassian.net",
			},
			{
				phase: "result",
				toolName: "search jira using jql",
				rawOutput: {
					issues: [
						{
							key: "CTSC-35912",
							summary: "Improve Trust Score for CrowdStrike Coverage",
						},
					],
				},
				text: "Returned 1 issue",
			},
			{
				phase: "result",
				toolName: "mcp__google_calendar__list_events",
				rawOutput: {
					events: [{ summary: "Design review" }],
				},
				text: "Returned 1 event",
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-structured");
	assert.equal(findFirstElementByType(result.spec, "WorkSummary"), null);
});

test("buildToolObservationStructuredFallback falls back to text lines when payload is not JSON", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "show tool output",
		observations: [
			{
				phase: "result",
				toolName: "functions.exec_command",
				text: "line one\nline two\nline three",
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-structured");

	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /line one/);
	assert.match(serializedSpec, /line two/);
	assert.match(serializedSpec, /line three/);
});

test("buildToolObservationStructuredFallback stops scanning once detail and link quotas are full", () => {
	let lateGetterRead = false;
	const latePayload = {};
	Object.defineProperty(latePayload, "shouldNotRead", {
		enumerable: true,
		get() {
			lateGetterRead = true;
			return "late value";
		},
	});

	const result = buildToolObservationStructuredFallback({
		prompt: "show tool output",
		observations: [
			{
				phase: "result",
				toolName: "functions.exec_command",
				rawOutput: {
					first: "one",
					second: "two",
					third: "three",
					late: latePayload,
				},
				text: "structured result",
			},
		],
		maxDetailLinesPerEvent: 3,
		maxLinksPerEvent: 0,
	});

	assert.ok(result);
	assert.equal(lateGetterRead, false);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /one/);
	assert.match(serializedSpec, /two/);
	assert.match(serializedSpec, /three/);
	assert.doesNotMatch(serializedSpec, /late value/);
});

test("buildToolObservationStructuredFallback removes tool-definition/schema noise from Slack create message results", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "Send Slack message",
		observations: [
			{
				phase: "result",
				toolName: "slack_slack_atlassian_channel_create_message",
				text: [
					"<tool>slack_slack_atlassian_channel_create_message(channelId: string, text: string): Send a message to a channel in Slack.</tool> { \"type\": \"object\", \"properties\": { \"channelId\": { \"type\": \"string\" } } }",
					"<tool>slack_slack_atlassian_channel_create_message(channelId: string, text: string): Send a message to a channel in Slack.</tool>",
				].join("\n"),
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.doesNotMatch(serializedSpec, /<tool>/i);
	assert.doesNotMatch(serializedSpec, /channelId/i);
	assert.doesNotMatch(serializedSpec, /Send a message to a channel in Slack/i);
	assert.match(serializedSpec, /Slack message sent\./i);
});

test("buildToolObservationStructuredFallback uses concise Slack success fallback when only schema payload remains", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "Send Slack message",
		observations: [
			{
				phase: "result",
				toolName: "slack_slack_atlassian_channel_create_message",
				rawOutput: {
					type: "object",
					properties: {
						channelId: { type: "string" },
						text: { type: "string" },
					},
					required: ["channelId", "text"],
				},
				text: "{\"type\":\"object\",\"properties\":{\"channelId\":{\"type\":\"string\"}}}",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /Slack message sent\./i);
	assert.doesNotMatch(serializedSpec, /channelId/i);
});

test("buildToolObservationStructuredFallback removes wrapper/schema lines while preserving non-slack meaningful text", () => {
	const result = buildToolObservationStructuredFallback({
		observations: [
			{
				phase: "result",
				toolName: "mcp__integrations__invoke_tool",
				text: [
					"<tool>google_google_calendar_atlassian_calendar_list_events(...)</tool>",
					"{\"type\":\"object\",\"properties\":{\"calendarId\":{\"type\":\"string\"}}}",
					"Fetched 2 calendar events for today.",
				].join("\n"),
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /Fetched 2 calendar events for today\./i);
	assert.doesNotMatch(serializedSpec, /<tool>/i);
	assert.doesNotMatch(serializedSpec, /calendarId/i);
});

test("buildToolObservationStructuredFallback reports omitted groups and events when limits apply", () => {
	const result = buildToolObservationStructuredFallback({
		observations: [
			{
				phase: "result",
				toolName: "tool.alpha",
				text: "alpha-1",
			},
			{
				phase: "result",
				toolName: "tool.alpha",
				text: "alpha-2",
			},
			{
				phase: "result",
				toolName: "tool.beta",
				text: "beta-1",
			},
		],
		maxToolGroups: 1,
		maxTotalEvents: 1,
		maxEventsPerTool: 1,
	});

	assert.ok(result);
	assert.equal(result.omittedGroups, 1);
	assert.equal(result.omittedEvents, 2);

	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /tool group omitted/i);
	assert.match(serializedSpec, /tool events omitted/i);
});

test("buildToolObservationStructuredFallback deduplicates repeated identical errors", () => {
	const result = buildToolObservationStructuredFallback({
		observations: [
			{
				phase: "error",
				toolName: "mcp__teamwork_graph__cypher_query",
				text: "SEMANTIC_ERROR invalid datetime format",
			},
			{
				phase: "error",
				toolName: "mcp__teamwork_graph__cypher_query",
				text: "SEMANTIC_ERROR invalid datetime format",
			},
		],
	});

	assert.ok(result);
	assert.equal(result.errorCount, 1);
	assert.equal(result.observationCount, 1);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /Tool results: 0 \| Tool errors: 1/i);
});

test("buildToolObservationStructuredFallback marks error-only payloads with retry-oriented description", () => {
	const result = buildToolObservationStructuredFallback({
		observations: [
			{
				phase: "error",
				toolName: "mcp__teamwork_graph__cypher_query",
				text: "SEMANTIC_ERROR invalid datetime format",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /no successful results/i);
});

test("buildToolObservationStructuredFallback uses result-focused description when mixed result and error observations exist", () => {
	const result = buildToolObservationStructuredFallback({
		observations: [
			{
				phase: "result",
				toolName: "mcp__google_calendar__list_events",
				text: "Returned one event",
			},
			{
				phase: "error",
				toolName: "mcp__google_calendar__list_events",
				text: "Timeout while fetching extended fields",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /1 result and 1 error from 1 tool\./i);
	assert.doesNotMatch(
		serializedSpec,
		/Generated from tool execution results and errors\./i
	);
});

test("buildToolObservationStructuredFallback returns null when no usable observations exist", () => {
	const result = buildToolObservationStructuredFallback({
		observations: [
			{
				phase: "start",
				toolName: "tool.alpha",
				text: "ignored",
			},
		],
	});

	assert.equal(result, null);
});

// ── Rich shape detection tests ──

test("rich rendering: homogeneous array of objects renders as Table", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "list all users",
		observations: [
			{
				phase: "result",
				toolName: "api_users",
				rawOutput: {
					users: [
						{ name: "Alice", email: "alice@test.com", role: "Admin" },
						{ name: "Bob", email: "bob@test.com", role: "User" },
						{ name: "Carol", email: "carol@test.com", role: "User" },
					],
				},
				text: "3 users found",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /"type":"Table"/);
	assert.match(serializedSpec, /Alice/);
	assert.match(serializedSpec, /Bob/);
	assert.match(serializedSpec, /Carol/);
});

test("rich rendering: temporal array with single item renders as Timeline", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "show events",
		observations: [
			{
				phase: "result",
				toolName: "calendar_events",
				rawOutput: [
					{
						title: "Morning standup",
						description: "Daily sync",
						startTime: "2026-03-19T09:00:00Z",
					},
				],
				text: "1 event",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /"type":"Timeline"/);
	assert.match(serializedSpec, /Morning standup/);
});

test("rich rendering: single object with numeric value renders as Metric", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "count issues",
		observations: [
			{
				phase: "result",
				toolName: "counter_tool",
				rawOutput: {
					totalCount: 42,
					unit: "issues",
				},
				text: "42 issues",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /"type":"Metric"/);
	assert.match(serializedSpec, /42/);
	assert.match(serializedSpec, /Total Count/);
});

test("rich rendering: single object with mixed fields renders as field card with Lozenge for status", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "show ticket details",
		observations: [
			{
				phase: "result",
				toolName: "ticket_details",
				rawOutput: {
					title: "Fix login bug",
					status: "In Progress",
					priority: "High",
					assignee: "Alice",
					url: "https://jira.example.com/PROJ-123",
				},
				text: "Ticket PROJ-123",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	// Should have field layout with labels
	assert.match(serializedSpec, /Fix login bug/);
	// Status should render as Lozenge
	assert.match(serializedSpec, /"type":"Lozenge"/);
	assert.match(serializedSpec, /In Progress/);
	// URL should render as Link
	assert.match(serializedSpec, /"type":"Link"/);
});

test("rich rendering: array with title+url renders as Table with content and links", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "search results",
		observations: [
			{
				phase: "result",
				toolName: "search_api",
				rawOutput: [
					{
						title: "Getting started guide",
						description: "A comprehensive guide to getting started",
						url: "https://docs.example.com/getting-started",
					},
					{
						title: "API reference",
						description: "Full API documentation",
						url: "https://docs.example.com/api",
					},
				],
				text: "2 search results",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	// Homogeneous arrays with 2+ items render as Table (higher priority than ObjectTile)
	assert.match(serializedSpec, /"type":"Table"/);
	assert.match(serializedSpec, /Getting started guide/);
	assert.match(serializedSpec, /API reference/);
});

test("rich rendering: single-item array with title renders as ObjectTile", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "find page",
		observations: [
			{
				phase: "result",
				toolName: "search_api",
				rawOutput: [
					{
						title: "Getting started guide",
						description: "A comprehensive guide to getting started",
						url: "https://docs.example.com/getting-started",
					},
				],
				text: "1 result",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	assert.match(serializedSpec, /"type":"ObjectTile"/);
	assert.match(serializedSpec, /Getting started guide/);
	assert.match(serializedSpec, /https:\/\/docs\.example\.com\/getting-started/);
});

test("rich rendering: schema-shaped payload falls through to text lines", () => {
	const result = buildToolObservationStructuredFallback({
		prompt: "show schema",
		observations: [
			{
				phase: "result",
				toolName: "schema_tool",
				rawOutput: {
					type: "object",
					properties: {
						name: { type: "string" },
						age: { type: "number" },
					},
					required: ["name"],
				},
				text: "Schema retrieved",
			},
		],
	});

	assert.ok(result);
	const serializedSpec = JSON.stringify(result.spec);
	// Schema payloads should NOT produce rich elements
	assert.ok(!serializedSpec.includes('"type":"Table"'));
	assert.ok(!serializedSpec.includes('"type":"Timeline"'));
	assert.ok(!serializedSpec.includes('"type":"Metric"'));
	assert.ok(!serializedSpec.includes('"type":"ObjectTile"'));
});
