const assert = require("node:assert/strict");
const test = require("node:test");

const {
	assertVpkHtmlReportContract,
	buildFallbackReportFields,
	generateWorkItemVpkHtmlReport,
	parseContextFieldSections,
} = require("./work-item-vpk-html-report-generator");

const ACTIVE_CONTEXT = [
	"[Active Jira Work Item Context]",
	"Source: /agents Jira work item modal.",
	"Key: RFP-101",
	"Title: Qualify inbound Acme Mobility RFP",
	"Description: Acme Mobility is evaluating a switch from a legacy competitor work-management platform to Jira for 10,000 users across sales, operations, engineering, support, and implementation teams.",
	"Status: RFP Intake",
	"Priority: High",
	"Start date: Oct 7, 2026",
	"Due date: Oct 28, 2026",
	"Parent: RFP-100 - Acme Mobility Enterprise RFP",
	"Customer: Acme Mobility",
	"Opportunity: Acme Mobility Jira enterprise migration",
	"Seat count: 10,000 seats",
	"Competitor product to displace: LegacyWorks Enterprise",
	"Sales goal: Help the sales team complete a high-quality RFP response that convinces Acme Mobility to switch from the incumbent competitor to Jira.",
	"Procurement stage: Inbound RFP qualification and response intake",
	"Submission portal: Acme Procurement Portal",
	"Response due date: Oct 28, 2026",
	"Assignee: Maya Chen (Proposal manager)",
	"Reporter: Jordan Lee (Account executive)",
	"Labels: enterprise-rfp, q4-sales, migration, 10k-seats",
	"Buyer priorities:",
	"- Prove Jira can scale across 10,000 users with controlled administration and reliable performance.",
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
	"Child work items:",
	"- RFP-105: Build compliance matrix from Acme portal questionnaire (inprogress, high, owner: Maya Chen)",
	"- RFP-107: Draft win themes against incumbent competitor weaknesses (done, high, owner: Jordan Lee)",
	"Attachments:",
	"- Acme-Mobility-enterprise-RFP.pdf (7 Oct 2026, 09:12 AM)",
	"Recent activity:",
	"- 15 minutes ago: Maya Chen (Proposal manager) - I added the portal checklist and marked the security questionnaire, migration plan, and enterprise support model as required exhibits for the first draft.",
	"[End Active Jira Work Item Context]",
].join("\n");

test("parses Work Item context into fields and sections", () => {
	const parsed = parseContextFieldSections(ACTIVE_CONTEXT);

	assert.equal(parsed.fields.key, "RFP-101");
	assert.equal(parsed.fields.title, "Qualify inbound Acme Mobility RFP");
	assert.deepEqual(parsed.sections.knownRisks.slice(0, 1), [
		"Portal deadline is tight and missing exhibits could disqualify the response.",
	]);
	assert.equal(parsed.sections.childItems.length, 2);
});

test("buildFallbackReportFields derives vpk-html status report metrics", () => {
	const fields = buildFallbackReportFields(ACTIVE_CONTEXT);

	assert.equal(fields.docTitle, "RFP-101 · Qualify inbound Acme Mobility RFP");
	assert.equal(fields.reportingPeriod, "Oct 7 to Oct 28, 2026");
	assert.equal(fields.confidence, "Medium");
	assert.equal(fields.blockerCount, "4");
	assert.match(fields.routeHint, /RFP-101 · active work item context/);
});

test("generateWorkItemVpkHtmlReport fills the real status-report template", async () => {
	const gatewayCalls = [];
	const report = await generateWorkItemVpkHtmlReport({
		contextDescription: ACTIVE_CONTEXT,
		generateText: async (options) => {
			gatewayCalls.push(options);
			return JSON.stringify({
				summary: "RFP-101 is in intake with a high-priority response due Oct 28, 2026.",
				whatChangedText: "Maya Chen added the portal checklist and required exhibits from the Work Item activity.",
				confidenceText: "Medium confidence because the portal deadline, migration proof, pricing approval, and security evidence remain active risks.",
				progressText: "RFP-107 is done and RFP-105 is in progress; the Acme Mobility RFP attachment is available as evidence.",
				blockersText: "The Work Item lists four blockers: portal deadline, migration proof, pricing approval, and security evidence.",
				nextWindowText: "Finish the compliance matrix and assign response owners before the Oct 28 deadline.",
				milestonesText: "Validate the portal checklist and resolve information gaps before final submission.",
				informationGaps: ["Deal desk approval date is not specified in the Work Item context."],
			});
		},
		runSkillValidation: false,
	});

	assert.equal(gatewayCalls.length, 1);
	assert.equal(report.artifactTitle, "Qualify inbound Acme Mobility RFP");
	assert.match(report.html, /TEMPLATE · Status Report/);
	assert.match(report.html, /<meta name="generator" content="vpk-html">/);
	assert.match(report.html, /font-family:\s*"Charlie Display"/);
	assert.match(report.html, /--grid-background/);
	assert.match(report.html, /class="masthead"/);
	assert.match(report.html, /class="stat" aria-label="Document metrics"/);
	assert.match(report.html, /RFP-101 · active work item context/);
	assert.match(report.html, /Deal desk approval date is not specified/);
	assert.doesNotMatch(report.html, /\{\{[^}]+\}\}/u);
	assert.doesNotMatch(report.html, /<script\b[^>]*\bsrc=["']https?:\/\//iu);
	assert.doesNotMatch(report.html, /<link\b[^>]*\bhref=["']https?:\/\//iu);
	assert.doesNotMatch(report.html, /url\(\s*["']?https?:\/\//iu);
	assertVpkHtmlReportContract(report.html);
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
