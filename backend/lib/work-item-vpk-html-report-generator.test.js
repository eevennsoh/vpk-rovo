const assert = require("node:assert/strict");
const test = require("node:test");

const {
	DACI_ONE_PAGER_TEMPLATE_PATH,
	assertVpkHtmlReportContract,
	buildFallbackDaciReportFields,
	buildFallbackReportFields,
	generateWorkItemVpkHtmlReport,
	parseContextFieldSections,
} = require("./work-item-vpk-html-report-generator");

const ACTIVE_CONTEXT = [
	"[Active Jira Work Item Context]",
	"Source: /agents Jira work item modal.",
	"Key: RFP-101",
	"Title: Acmecorp: Prepare for bid recommendation for ESM RFP",
	"Description: Acmecorp is evaluating Atlassian as a replacement for its current service-management and work-management stack.",
	"Status: RFP Intake",
	"Priority: High",
	"Start date: May 12, 2026",
	"Due date: Jun 8, 2026",
	"Parent: RFP-100 - Enterprise RFP Response",
	"Customer: Acmecorp",
	"Opportunity: Acmecorp enterprise service-management platform evaluation",
	"Seat count: multi-thousand users",
	"Deal size: multi-thousand users; budget qualification pending",
	"Competitor product to displace: incumbent service-management, CMDB, asset, HR, GRC, and custom workflow tooling",
	"Sales goal: Help the sales team decide whether Atlassian should respond to the Acmecorp RFP by qualifying fit, budget, stakeholder access, competitive advantage, and review risk before drafting a customer-facing package.",
	"Procurement stage: Inbound RFP qualification and response intake",
	"Submission portal: Acmecorp supplier RFP portal",
	"Response due date: Jun 8, 2026",
	"Assignee: Maya Chen (Proposal manager)",
	"Reporter: Jordan Lee (Account executive)",
	"Labels: Acmecorp, qualification, enterprise",
	"Buyer priorities:",
	"- Acmecorp wants to consolidate fragmented regional tools into a clearer enterprise service-management operating model.",
	"Known risks:",
	"- Portal deadline is tight and missing exhibits could disqualify the response.",
	"- Competitor displacement requires credible migration proof and reference customers.",
	"- Pricing needs deal desk approval before any seat-volume commitment is shared.",
	"- Security questionnaire may require current SOC 2, data residency, and audit logging evidence.",
	"Next actions:",
	"- Finish the compliance matrix and identify mandatory no-response gaps.",
	"- Assign section owners across sales, sales engineering, security, legal, deal desk, and customer references.",
	"Response team needs:",
	"- Account executive: Jordan Lee - Customer strategy and competitor displacement narrative.",
	"- Proposal manager: Maya Chen - Compliance matrix and response calendar.",
	"- Security and legal: Elena Ruiz - Data residency, DPA, legal terms, audit logs, Guard, compliance exhibits, and vulnerability answers.",
	"- Deal desk: Darius Pavri - Pricing workbook, license assumptions, TCO positioning, discount guardrails, and approval path.",
	"Child work items:",
	"- RFP-105: Build compliance matrix from Acmecorp portal questionnaire (inprogress, high, owner: Maya Chen)",
	"- RFP-107: Draft win themes against incumbent competitor weaknesses (done, high, owner: Jordan Lee)",
	"Attachments:",
	"- Acmecorp-enterprise-RFP.pdf (15 May 2026, 11:05 AM)",
	"Recent activity:",
	"- 15 minutes ago: Maya Chen (Proposal manager) - I added the portal checklist and marked the security questionnaire, migration plan, and enterprise support model as required exhibits for the first draft.",
	"[End Active Jira Work Item Context]",
].join("\n");

test("parses Work Item context into fields and sections", () => {
	const parsed = parseContextFieldSections(ACTIVE_CONTEXT);

	assert.equal(parsed.fields.key, "RFP-101");
	assert.equal(parsed.fields.title, "Acmecorp: Prepare for bid recommendation for ESM RFP");
	assert.deepEqual(parsed.sections.knownRisks.slice(0, 1), [
		"Portal deadline is tight and missing exhibits could disqualify the response.",
	]);
	assert.equal(parsed.sections.childItems.length, 2);
});

test("buildFallbackReportFields derives vpk-html status report metrics", () => {
	const fields = buildFallbackReportFields(ACTIVE_CONTEXT);

	assert.equal(fields.docTitle, "RFP-101 · Acmecorp: Prepare for bid recommendation for ESM RFP");
	assert.equal(fields.reportingPeriod, "May 12 to Jun 8, 2026");
	assert.equal(fields.confidence, "Medium");
	assert.equal(fields.blockerCount, "4");
	assert.match(fields.routeHint, /RFP-101 · active work item context/);
});

test("buildFallbackDaciReportFields derives Acmecorp DACI fields", () => {
	const fields = buildFallbackDaciReportFields(ACTIVE_CONTEXT);

	assert.equal(fields.artifactTitle, "Acmecorp RFP qualification DACI");
	assert.match(fields.driverText, /Maya Chen/u);
	assert.match(fields.approverText, /Darius Pavri/u);
	assert.match(fields.approverText, /Elena Ruiz/u);
	assert.match(fields.budgetText, /budget qualification pending/u);
	assert.ok(fields.openGaps.some((gap) => /Stakeholder relationship/u.test(gap)));
});

test("buildFallbackDaciReportFields keeps non-Acmecorp RFP clients scoped", () => {
	const fields = buildFallbackDaciReportFields([
		"[Active Jira Work Item Context]",
		"Key: RFP-102",
		"Title: Northstar Bank: Parse supplier questionnaire and requested files",
		"Customer: Northstar Bank",
		"Description: Review the Northstar Bank supplier packet.",
		"Assignee: Jordan Lee (Account executive)",
		"[End Active Jira Work Item Context]",
	].join("\n"));
	const serialized = JSON.stringify(fields);

	assert.equal(fields.artifactTitle, "Northstar Bank RFP qualification DACI");
	assert.match(serialized, /Northstar Bank/u);
	assert.doesNotMatch(serialized, /Acmecorp/u);
});

test("generateWorkItemVpkHtmlReport fills the real one-pager template for RFP qualification", async () => {
	const gatewayCalls = [];
	const report = await generateWorkItemVpkHtmlReport({
		contextDescription: ACTIVE_CONTEXT,
		generateText: async (options) => {
			gatewayCalls.push(options);
			return JSON.stringify({
				recommendationText: "Respond to Acmecorp only if budget and stakeholder access are confirmed before drafting.",
				driverText: "Driver: Maya Chen, proposal manager.",
				approverText: "Approver: Darius Pavri and Elena Ruiz.",
				contributorsText: "Contributors: Jordan Lee and Priya Shah.",
				informedText: "Informed: executive stakeholders after bid/no-bid decision.",
				relationshipText: "Acmecorp has working-level engagement, but executive sponsor access still needs confirmation.",
				budgetText: "Budget qualification remains pending for Acmecorp.",
				campaignFitText: "Acmecorp matches the enterprise service-management campaign.",
				competitiveAdvantages: ["JSM and Assets fit the ITSM and CMDB story.", "Rovo differentiates AI knowledge reuse."],
				decisionRisks: ["Budget and stakeholder access are not confirmed."],
				openGaps: ["Deal desk approval date is not specified in the Work Item context."],
			});
		},
	});

	assert.equal(gatewayCalls.length, 1);
	assert.match(gatewayCalls[0].prompt, /RFP qualification DACI/u);
	assert.equal(report.artifactTitle, "Acmecorp RFP qualification DACI");
	assert.equal(report.skill.templatePath, DACI_ONE_PAGER_TEMPLATE_PATH);
	assert.match(report.html, /Acmecorp RFP qualification DACI/);
	assert.match(report.html, /<meta name="generator" content="vpk-html">/);
	assert.match(report.html, /font-family:\s*"Charlie Display"/);
	assert.match(report.html, /--grid-background/);
	assert.match(report.html, /class="header"/);
	assert.match(report.html, /<main>/);
	assert.match(report.html, /DACI roles/);
	assert.match(report.html, /Driver: Maya Chen/);
	assert.match(report.html, /Approver: Darius Pavri and Elena Ruiz/);
	assert.match(report.html, /Qualification readout/);
	assert.match(report.html, /Deal desk approval date is not specified/);
	assert.doesNotMatch(report.html, /\{\{[^}]+\}\}/u);
	assert.doesNotMatch(report.html, /<script\b[^>]*\bsrc=["']https?:\/\//iu);
	assert.doesNotMatch(report.html, /<link\b[^>]*\bhref=["']https?:\/\//iu);
	assert.doesNotMatch(report.html, /url\(\s*["']?https?:\/\//iu);
	assertVpkHtmlReportContract(report.html);
	assert.equal(report.validation.results.length, 2);
	assert.equal(report.validation.results[1].scriptPath, "scripts/check-html.mjs");
	assert.match(report.validation.results[1].stdout, /ok .*report\.html/u);
});

test("generateWorkItemVpkHtmlReport keeps generic work items on the status-report template", async () => {
	const genericContext = [
		"[Active Jira Work Item Context]",
		"Key: OPS-42",
		"Title: Refresh weekly support dashboard",
		"Description: Update the weekly operational support dashboard with current incident, request, and SLA context.",
		"Status: In progress",
		"Priority: Medium",
		"Assignee: Taylor Quinn (Ops lead)",
		"Reporter: Sam Rivera (Support manager)",
		"[End Active Jira Work Item Context]",
	].join("\n");
	const report = await generateWorkItemVpkHtmlReport({
		contextDescription: genericContext,
		generateText: async () => JSON.stringify({
			summary: "OPS-42 is a dashboard refresh.",
			whatChangedText: "The dashboard update is in progress.",
			confidenceText: "Medium confidence because validation is pending.",
			progressText: "The work item is assigned.",
			blockersText: "No blockers were supplied.",
			nextWindowText: "Validate the dashboard.",
			milestonesText: "Finish the weekly update.",
			informationGaps: ["Dashboard owner review date is not specified."],
		}),
		runSkillValidation: false,
	});

	assert.equal(report.skill.templatePath, "assets/templates/status-report.html");
	assert.match(report.html, /TEMPLATE · Status Report/);
	assert.match(report.html, /class="masthead"/);
	assert.match(report.html, /<main>/);
	assert.doesNotMatch(report.html, /DACI roles/);
});

test("generateWorkItemVpkHtmlReport requires active Work Item context", async () => {
	await assert.rejects(
		generateWorkItemVpkHtmlReport({
			contextDescription: "No Work Item here",
			runSkillValidation: false,
		}),
		/without active Work Item context/u,
	);
});
