const assert = require("node:assert/strict");
const test = require("node:test");

const {
	WORK_ITEM_REPORT_REQUEST_START,
	buildWorkItemReportRequestContext,
	extractWorkItemReportTitle,
	hasActiveWorkItemContext,
	isWorkItemReportIntent,
	resolveWorkItemReportRequest,
} = require("./work-item-report-intent");

const ACTIVE_CONTEXT = [
	"[Active Jira Work Item Context]",
	"Key: RFP-101",
	"Title: Qualify inbound Acme Mobility RFP",
	"Description: Qualify the opportunity and prepare the response package.",
	"Status: RFP Intake",
	"Priority: High",
	"Assignee: Maya Chen (Proposal manager)",
	"Reporter: Jordan Lee (Account executive)",
	"[End Active Jira Work Item Context]",
].join("\n");

test("detects clear work-item report generation requests", () => {
	const positivePrompts = [
		"generate a report",
		"create a report for this work item",
		"make an HTML report",
		"summarize this ticket as a report",
		"write a report for the current Jira issue",
	];

	for (const prompt of positivePrompts) {
		assert.equal(isWorkItemReportIntent(prompt), true, prompt);
	}
});

test("avoids ordinary report questions and reported-by field references", () => {
	const negativePrompts = [
		"who reported this issue?",
		"what does the reported by field mean?",
		"show me the reporter for this work item",
		"is there a report attached to the ticket?",
		"how many reports did sales file last week?",
		"how do I create a report for this work item?",
	];

	for (const prompt of negativePrompts) {
		assert.equal(isWorkItemReportIntent(prompt), false, prompt);
	}
});

test("extracts active Work Item context and report artifact title", () => {
	assert.equal(hasActiveWorkItemContext(ACTIVE_CONTEXT), true);
	assert.equal(
		extractWorkItemReportTitle(ACTIVE_CONTEXT),
		"Qualify inbound Acme Mobility RFP",
	);
});

test("builds the vpk-html routing block only for report intent", () => {
	const contextBlock = buildWorkItemReportRequestContext({
		contextDescription: ACTIVE_CONTEXT,
		promptText: "create a report for this work item",
		skillId: "vpk-html",
	});

	assert.match(contextBlock, new RegExp(`^\\${WORK_ITEM_REPORT_REQUEST_START}`));
	assert.match(contextBlock, /repo-local \/vpk-html Agent Skill bundle/);
	assert.match(contextBlock, /Do not ask the LLM to freeform-write the final HTML\/CSS/);
	assert.match(contextBlock, /one offline self-contained HTML file/);
	assert.equal(
		buildWorkItemReportRequestContext({
			contextDescription: ACTIVE_CONTEXT,
			promptText: "who reported this?",
		}),
		null,
	);
});

test("resolves artifact routing only when context is available", () => {
	assert.deepEqual(
		resolveWorkItemReportRequest({
			contextDescription: ACTIVE_CONTEXT,
			promptText: "generate an HTML report for this work item",
			skills: [{ id: "vpk-html", name: "vpk-html", title: "vpk-html" }],
		}),
		{
			artifactBackendPreference: "ai-gateway",
			contextBlock: buildWorkItemReportRequestContext({
				contextDescription: ACTIVE_CONTEXT,
				promptText: "generate an HTML report for this work item",
				skillId: "vpk-html",
			}),
			hasContext: true,
			isIntent: true,
			shouldCreateArtifact: true,
			shouldLoadSkill: true,
			skillId: "vpk-html",
			title: "Qualify inbound Acme Mobility RFP",
		},
	);

	const missingContext = resolveWorkItemReportRequest({
		contextDescription: "",
		promptText: "generate a report for this work item",
	});
	assert.equal(missingContext.isIntent, true);
	assert.equal(missingContext.hasContext, false);
	assert.equal(missingContext.artifactBackendPreference, null);
	assert.equal(missingContext.shouldCreateArtifact, false);
	assert.match(missingContext.contextBlock, /no active Work Item context/i);
});
