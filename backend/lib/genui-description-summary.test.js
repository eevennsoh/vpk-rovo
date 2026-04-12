const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldSummarizeDescription,
	buildDescriptionSummaryPrompt,
	parseDescriptionSummaryResponse,
	generateDescriptionSummary,
} = require("./genui-description-summary");

/* -------------------------------------------------------------------------- */
/*  shouldSummarizeDescription                                                */
/* -------------------------------------------------------------------------- */

test("shouldSummarizeDescription returns false for empty input", () => {
	assert.equal(shouldSummarizeDescription(""), false);
	assert.equal(shouldSummarizeDescription("   "), false);
	assert.equal(shouldSummarizeDescription(null), false);
	assert.equal(shouldSummarizeDescription(undefined), false);
});

test("shouldSummarizeDescription returns false for short descriptions (<=60 chars)", () => {
	assert.equal(shouldSummarizeDescription("Team structure overview"), false);
	assert.equal(shouldSummarizeDescription("Monitor KPIs and campaign trends"), false);
	assert.equal(shouldSummarizeDescription("A".repeat(60)), false);
});

test("shouldSummarizeDescription returns true for long verbose descriptions", () => {
	assert.equal(
		shouldSummarizeDescription(
			"Let me fetch the team details for David Hoang's team to get the current structure and reporting hierarchy"
		),
		true
	);
	assert.equal(
		shouldSummarizeDescription(
			"I'll look up the calendar events and summarize the upcoming meetings for this week"
		),
		true
	);
});

test("shouldSummarizeDescription returns false for default description", () => {
	assert.equal(shouldSummarizeDescription("Generated from your request"), false);
});

test("shouldSummarizeDescription returns false for low-signal patterns", () => {
	assert.equal(shouldSummarizeDescription("Generated from the Jira board data and sprint details that were retrieved"), false);
	assert.equal(shouldSummarizeDescription("Tool results from the API call to fetch project settings and configuration"), false);
});

test("shouldSummarizeDescription returns false for context-driven descriptions", () => {
	assert.equal(shouldSummarizeDescription("5 Jira work items and 3 Confluence pages found in the project"), false);
	assert.equal(shouldSummarizeDescription("12 calendar events available in the shared calendar for this week"), false);
});

/* -------------------------------------------------------------------------- */
/*  buildDescriptionSummaryPrompt                                             */
/* -------------------------------------------------------------------------- */

test("buildDescriptionSummaryPrompt includes title and description", () => {
	const prompt = buildDescriptionSummaryPrompt({
		title: "David Hoang's Team",
		description: "Let me fetch the team details for David Hoang's team.",
	});

	assert.match(prompt, /Card title: David Hoang's Team/);
	assert.match(prompt, /Current description: Let me fetch the team details/);
	assert.match(prompt, /4-10 words/);
});

test("buildDescriptionSummaryPrompt works without title", () => {
	const prompt = buildDescriptionSummaryPrompt({
		description: "Let me fetch the team details.",
	});

	assert.doesNotMatch(prompt, /Card title:/);
	assert.match(prompt, /Current description: Let me fetch the team details\./);
});

test("buildDescriptionSummaryPrompt throws for missing description", () => {
	assert.throws(
		() => buildDescriptionSummaryPrompt({ title: "Test" }),
		/description is required/
	);
});

/* -------------------------------------------------------------------------- */
/*  parseDescriptionSummaryResponse                                           */
/* -------------------------------------------------------------------------- */

test("parseDescriptionSummaryResponse extracts shortDescription from valid JSON", () => {
	const result = parseDescriptionSummaryResponse(
		'{"shortDescription":"Team structure and hierarchy"}'
	);
	assert.equal(result.shortDescription, "Team structure and hierarchy");
});

test("parseDescriptionSummaryResponse handles wrapped JSON", () => {
	const result = parseDescriptionSummaryResponse(
		'Here is the result: {"shortDescription":"Sprint planning board"}'
	);
	assert.equal(result.shortDescription, "Sprint planning board");
});

test("parseDescriptionSummaryResponse falls back to description key", () => {
	const result = parseDescriptionSummaryResponse(
		'{"description":"Campaign performance metrics"}'
	);
	assert.equal(result.shortDescription, "Campaign performance metrics");
});

test("parseDescriptionSummaryResponse returns null for malformed JSON", () => {
	const result = parseDescriptionSummaryResponse("not json at all");
	assert.equal(result.shortDescription, null);
});

test("parseDescriptionSummaryResponse returns null for empty JSON values", () => {
	const result = parseDescriptionSummaryResponse('{"shortDescription":""}');
	assert.equal(result.shortDescription, null);
});

test("parseDescriptionSummaryResponse strips quotes and trailing periods", () => {
	const result = parseDescriptionSummaryResponse(
		'{"shortDescription":"\'Team org chart and roles.\'"}'
	);
	assert.equal(result.shortDescription, "Team org chart and roles");
});

/* -------------------------------------------------------------------------- */
/*  generateDescriptionSummary                                                */
/* -------------------------------------------------------------------------- */

test("generateDescriptionSummary skips summarization for short descriptions", async () => {
	const generateText = () => {
		throw new Error("Should not be called");
	};

	const result = await generateDescriptionSummary({
		title: "Team",
		description: "Short description text",
		generateText,
	});

	assert.equal(result.shortDescription, null);
});

test("generateDescriptionSummary calls generateText for verbose descriptions", async () => {
	let capturedOptions = null;

	const generateText = async (options) => {
		capturedOptions = options;
		return '{"shortDescription":"Team structure overview"}';
	};

	const result = await generateDescriptionSummary({
		title: "David Hoang's Team",
		description: "Let me fetch the team details for David Hoang's team to get the current structure and reporting hierarchy",
		generateText,
	});

	assert.equal(result.shortDescription, "Team structure overview");
	assert.ok(capturedOptions);
	assert.equal(capturedOptions.maxOutputTokens, 60);
	assert.equal(capturedOptions.temperature, 0.4);
});

test("generateDescriptionSummary throws for missing description", async () => {
	await assert.rejects(
		() => generateDescriptionSummary({ title: "Test", generateText: async () => "" }),
		/description is required/
	);
});

test("generateDescriptionSummary throws for missing generateText", async () => {
	await assert.rejects(
		() => generateDescriptionSummary({
			title: "Test",
			description: "A long verbose description that needs summarization for the card header",
		}),
		/generateText function is required/
	);
});
