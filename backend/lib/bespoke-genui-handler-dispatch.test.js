const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { dispatchBespokeGenuiHandler } = require("./bespoke-genui-handler-dispatch");

describe("dispatchBespokeGenuiHandler", () => {
	it("returns null for empty observations", () => {
		const result = dispatchBespokeGenuiHandler({
			observations: [],
			prompt: "test",
		});
		assert.strictEqual(result, null);
	});

	it("returns null when observations is undefined", () => {
		const result = dispatchBespokeGenuiHandler({ prompt: "test" });
		assert.strictEqual(result, null);
	});

	it("returns null when called with no arguments", () => {
		const result = dispatchBespokeGenuiHandler();
		assert.strictEqual(result, null);
	});

	it("returns null for non-matching tool observations", () => {
		const result = dispatchBespokeGenuiHandler({
			observations: [
				{ phase: "result", toolName: "random_tool", text: "some result" },
			],
			prompt: "tell me a joke",
		});
		assert.strictEqual(result, null);
	});

	it("matches Figma observations and returns spec", () => {
		const result = dispatchBespokeGenuiHandler({
			observations: [
				{
					phase: "result",
					toolName: "mcp__figma__get_design_context",
					text: "Design context fetched",
					rawOutput: [
						"Screenshot of the design",
						"```tsx\nfunction Button() { return <button>Click</button> }\n```",
						"https://figma.com/design/abc123/test",
					],
				},
			],
			prompt: "implement this figma design",
		});

		assert.ok(result !== null, "should return a result for Figma observations");
		assert.strictEqual(result.source, "tool-observation-figma-structured");
		assert.ok(result.spec, "should have a spec");
		assert.ok(result.summary, "should have a summary");
	});

	it("matches Google Calendar observations and returns spec", () => {
		const result = dispatchBespokeGenuiHandler({
			observations: [
				{
					phase: "result",
					toolName: "mcp__google_calendar__list_events",
					text: JSON.stringify({
						events: [
							{
								id: "1",
								summary: "Team standup",
								start: { dateTime: "2026-03-19T09:00:00Z" },
								end: { dateTime: "2026-03-19T09:30:00Z" },
							},
							{
								id: "2",
								summary: "Sprint planning",
								start: { dateTime: "2026-03-19T10:00:00Z" },
								end: { dateTime: "2026-03-19T11:00:00Z" },
							},
						],
					}),
					rawOutput: {
						events: [
							{
								id: "1",
								summary: "Team standup",
								start: { dateTime: "2026-03-19T09:00:00Z" },
								end: { dateTime: "2026-03-19T09:30:00Z" },
							},
							{
								id: "2",
								summary: "Sprint planning",
								start: { dateTime: "2026-03-19T10:00:00Z" },
								end: { dateTime: "2026-03-19T11:00:00Z" },
							},
						],
					},
				},
			],
			prompt: "show my google calendar today",
		});

		assert.ok(result !== null, "should return a result for Google Calendar observations");
		assert.ok(
			result.source.includes("google"),
			`source should contain 'google', got: ${result.source}`
		);
		assert.ok(result.spec, "should have a spec");
	});

	it("matches Work Summary observations with Jira data and intent", () => {
		const result = dispatchBespokeGenuiHandler({
			observations: [
				{
					phase: "result",
					toolName: "mcp__jira__search_issues",
					text: JSON.stringify({
						issues: [
							{
								key: "PROJ-123",
								fields: {
									summary: "Fix login bug",
									status: { name: "Done", statusCategory: { name: "Done" } },
									priority: { name: "High" },
									issuetype: { name: "Bug" },
									updated: "2026-03-18T10:00:00Z",
								},
							},
						],
					}),
					rawOutput: {
						issues: [
							{
								key: "PROJ-123",
								fields: {
									summary: "Fix login bug",
									status: { name: "Done", statusCategory: { name: "Done" } },
									priority: { name: "High" },
									issuetype: { name: "Bug" },
									updated: "2026-03-18T10:00:00Z",
								},
							},
						],
					},
				},
			],
			prompt: "show my work summary for the last 7 days",
		});

		assert.ok(result !== null, "should return a result for Work Summary");
		assert.strictEqual(result.source, "tool-observation-work-summary");
		assert.ok(result.spec, "should have a spec");
	});

	it("prioritizes WorkSummary over Figma over Google", () => {
		// WorkSummary should take priority even when all domains could match
		const result = dispatchBespokeGenuiHandler({
			observations: [
				{
					phase: "result",
					toolName: "mcp__jira__search_issues",
					text: JSON.stringify({
						issues: [{ key: "PROJ-1", fields: { summary: "Test", status: { name: "Done", statusCategory: { name: "Done" } } } }],
					}),
					rawOutput: {
						issues: [{ key: "PROJ-1", fields: { summary: "Test", status: { name: "Done", statusCategory: { name: "Done" } } } }],
					},
				},
			],
			prompt: "show my work summary for the last week",
		});

		assert.ok(result !== null, "WorkSummary should match for Jira data with time-window intent");
		assert.strictEqual(
			result.source,
			"tool-observation-work-summary",
			"WorkSummary should match first when intent is present"
		);
	});

	it("preserves spec shape for valid results", () => {
		const result = dispatchBespokeGenuiHandler({
			observations: [
				{
					phase: "result",
					toolName: "mcp__figma__get_design_context",
					text: "Design context",
					rawOutput: [
						"Screenshot",
						"```tsx\nfunction App() { return <div /> }\n```",
						"https://figma.com/file/abc",
					],
				},
			],
			prompt: "implement design",
		});

		if (result) {
			assert.ok(result.spec.root, "spec should have root");
			assert.ok(result.spec.elements, "spec should have elements");
			assert.strictEqual(typeof result.summary, "string", "summary should be string");
			assert.strictEqual(typeof result.source, "string", "source should be string");
		}
	});
});
