const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildWorkSummaryStructuredSpec,
} = require("./genui-work-summary-tool-handler");

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

test("buildWorkSummaryStructuredSpec emits WorkSummary when prompt is a Jira/Confluence work summary", () => {
	const result = buildWorkSummaryStructuredSpec({
		prompt: "Summarize my last 7 days of work from Jira and Confluence",
		observations: [
			{
				phase: "result",
				toolName: "mcp__jira__search_issues",
				rawOutput: {
					issues: [
						{
							key: "AIDOPS-101",
							summary: "Agent Logo Change",
							status: { name: "In Progress" },
							statusCategory: { key: "in-progress" },
							priority: { name: "High" },
							issuetype: { name: "Task" },
							self: "https://hello.atlassian.net/browse/AIDOPS-101",
							updated: "2026-02-23T09:10:00.000Z",
						},
					],
				},
				text: "Returned 1 issue",
			},
			{
				phase: "result",
				toolName: "mcp__confluence__search_pages",
				rawOutput: {
					results: [
						{
							title: "Project Documentation - Draft",
							space: { name: "Playbook Sandbox" },
							url: "https://hello.atlassian.net/wiki/spaces/PLAY/pages/1234",
							lastModified: "2026-02-22T15:45:00.000Z",
						},
					],
				},
				text: "Returned 1 page",
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-work-summary");
	const workSummaryElement = findFirstElementByType(result.spec, "WorkSummary");
	assert.ok(workSummaryElement);
	assert.equal(workSummaryElement.props.jiraItems.length, 1);
	assert.equal(workSummaryElement.props.jiraItems[0].key, "AIDOPS-101");
	assert.equal(workSummaryElement.props.confluencePages.length, 1);
	assert.equal(
		workSummaryElement.props.confluencePages[0].title,
		"Project Documentation - Draft"
	);
});

test("buildWorkSummaryStructuredSpec emits WorkSummary with empty arrays when work summary tools return no rows", () => {
	const result = buildWorkSummaryStructuredSpec({
		prompt: "Last 7 days of work from Jira and Confluence",
		observations: [
			{
				phase: "result",
				toolName: "mcp__jira__search_using_jql",
				rawOutput: { issues: [] },
				text: "No issues found for JQL query: assignee = currentUser() AND updated >= -7d",
			},
			{
				phase: "result",
				toolName: "mcp__confluence__search_pages",
				rawOutput: { results: [] },
				text: "No pages found for CQL query.",
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-work-summary");
	const workSummaryElement = findFirstElementByType(result.spec, "WorkSummary");
	assert.ok(workSummaryElement);
	assert.deepEqual(workSummaryElement.props.jiraItems, []);
	assert.deepEqual(workSummaryElement.props.confluencePages, []);
});

test("buildWorkSummaryStructuredSpec ignores user-context and site-discovery helpers for work summaries", () => {
	const result = buildWorkSummaryStructuredSpec({
		prompt: "show me what i worked on for the last 7 days",
		observations: [
			{
				phase: "result",
				toolName: "get full context for user",
				text: "[SAL-API] operation: cypherQuery responded with message: {} httpStatus: [500]",
			},
			{
				phase: "result",
				toolName: "get atlassian site urls",
				text: "Accessible Sites:\nhello.atlassian.net\nstatuspage.atlassian.net",
			},
			{
				phase: "result",
				toolName: "search jira using jql",
				rawOutput: {
					issues: [
						{
							key: "CTSC-35912",
							summary: "Improve Trust Score for CrowdStrike Coverage",
							status: { name: "Backlog" },
							priority: { name: "Minor" },
							issuetype: { name: "Bug" },
							self: "https://hello.atlassian.net/browse/CTSC-35912",
							updated: "2026-03-17T10:00:00.000Z",
						},
					],
				},
				text: "Returned 1 issue",
			},
		],
	});

	assert.ok(result);
	assert.equal(result.source, "tool-observation-work-summary");
	const workSummaryElement = findFirstElementByType(result.spec, "WorkSummary");
	assert.ok(workSummaryElement);
	assert.equal(workSummaryElement.props.jiraItems.length, 1);
	assert.equal(workSummaryElement.props.jiraItems[0].key, "CTSC-35912");
	assert.deepEqual(workSummaryElement.props.confluencePages, []);
});
