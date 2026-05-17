const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadRfpDemoStateHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					AGENTS_RFP_DEMO_STORAGE_KEY,
					GENERATED_RFP_REPORT_ATTACHMENT_ID,
					RFP_DRAFTING_AGENT_ID,
					attachRfpReportToWorkItem,
					approveRfpReport,
					createDefaultAgentsRfpDemoState,
					createRfpDraftingAgent,
					exportRfpReportPdf,
					generateRfpReport,
					getGeneratedRfpAttachments,
					getRfpDemoColumnAgentAssignments,
					moveRfpDemoCard,
					parseAgentsRfpDemoState,
					refineRfpReport,
					resolveRfpDemoBoardColumns,
					scheduleRfpDraftingAgent,
					selectRfpReportVersion,
				} from "./components/projects/agents/lib/rfp-demo-state";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "rfp-demo-state-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("missing and invalid localStorage payloads seed default RFP demo state", async () => {
	const harness = await loadRfpDemoStateHarness();

	const missing = harness.parseAgentsRfpDemoState(null);
	assert.equal(missing.version, 1);
	assert.equal(missing.report.stage, "none");
	assert.equal(missing.board.columns[0].title, "RFP Intake");
	assert.ok(missing.board.columns[0].cardCodes.includes("RFP-101"));

	const invalid = harness.parseAgentsRfpDemoState(JSON.stringify({ version: 99 }));
	assert.deepEqual(invalid, missing);
});

test("valid localStorage payload resumes board, report, agent, schedule, and activity", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.scheduleRfpDraftingAgent(
		harness.attachRfpReportToWorkItem(harness.refineRfpReport(harness.createDefaultAgentsRfpDemoState())),
	);
	const resumed = harness.parseAgentsRfpDemoState(JSON.stringify(state));

	assert.equal(resumed.report.stage, "attached");
	assert.equal(resumed.agent.id, harness.RFP_DRAFTING_AGENT_ID);
	assert.equal(resumed.schedule.scheduleLabel, "Weekdays at 9:00 AM");
	assert.equal(resumed.customAgentActivity.length, 3);
	assert.deepEqual(
		harness.getGeneratedRfpAttachments(resumed, "RFP-101").map((attachment) => attachment.displayName),
		["RFP response strategy.pdf"],
	);
});

test("report stages advance through generated, refined, approved, pdf-exported, and attached", async () => {
	const harness = await loadRfpDemoStateHarness();
	const generated = harness.generateRfpReport(harness.createDefaultAgentsRfpDemoState());
	assert.equal(generated.report.stage, "generated");
	assert.equal(generated.canvas.activeViewId, "report");
	assert.deepEqual(generated.report.versions.map((version) => version.label), ["Initial generated report"]);

	const refined = harness.refineRfpReport(generated);
	assert.equal(refined.report.stage, "refined");
	assert.equal(refined.canvas.activeViewId, "report");
	assert.equal(refined.report.currentVersionId, "refined-current-report");
	assert.deepEqual(
		refined.report.versions.map((version) => version.label),
		["Initial generated report", "Refined current report"],
	);

	const approved = harness.approveRfpReport(refined);
	assert.equal(approved.report.stage, "approved");

	const exported = harness.exportRfpReportPdf(approved);
	assert.equal(exported.report.stage, "pdf-exported");

	const attached = harness.attachRfpReportToWorkItem(exported, "<!doctype html><html><body>Report</body></html>");
	assert.equal(attached.report.stage, "attached");
	assert.equal(attached.report.previewHtml, "<!doctype html><html><body>Report</body></html>");
	assert.equal(attached.canvas.open, false);
	assert.equal(attached.canvas.activeViewId, "report");
	assert.deepEqual(
		harness.getGeneratedRfpAttachments(attached, "RFP-101").map((attachment) => attachment.previewKind),
		["pdf-preview"],
	);
	assert.deepEqual(
		harness.getGeneratedRfpAttachments(attached, "RFP-101").map((attachment) => attachment.id),
		[harness.GENERATED_RFP_REPORT_ATTACHMENT_ID],
	);
	assert.deepEqual(attached.toasts.map((toast) => toast.message), ["Added PDF to RFP-101."]);
});

test("selecting a report version updates the current version only for known versions", async () => {
	const harness = await loadRfpDemoStateHarness();
	const refined = harness.refineRfpReport(harness.createDefaultAgentsRfpDemoState());
	const initialSelected = harness.selectRfpReportVersion(refined, "initial-generated-report");

	assert.equal(initialSelected.report.currentVersionId, "initial-generated-report");
	assert.strictEqual(
		harness.selectRfpReportVersion(initialSelected, "missing-version"),
		initialSelected,
	);
});

test("attaching the report collapses report confirmations to the final PDF toast", async () => {
	const harness = await loadRfpDemoStateHarness();
	const approved = harness.approveRfpReport(harness.refineRfpReport(harness.createDefaultAgentsRfpDemoState()));
	const exported = harness.exportRfpReportPdf(approved);
	const attached = harness.attachRfpReportToWorkItem(exported);

	assert.deepEqual(attached.toasts.map((toast) => toast.message), ["Added PDF to RFP-101."]);
});

test("agent creation is idempotent and assigns Drafting without retroactively assigning RFP-101", async () => {
	const harness = await loadRfpDemoStateHarness();
	const once = harness.createRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState());
	const twice = harness.createRfpDraftingAgent(once);

	assert.equal(twice.agent.name, "RFP Drafting Agent");
	assert.deepEqual(harness.getRfpDemoColumnAgentAssignments(twice), {
		Drafting: [harness.RFP_DRAFTING_AGENT_ID],
	});
	assert.deepEqual(twice.workItems["RFP-101"].agentAssignmentIds, []);
	assert.equal(
		twice.customAgentActivity.filter((item) => item.type === "agent-created").length,
		1,
	);
});

test("dragging RFP-102 to Drafting before agent creation only moves the card", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.moveRfpDemoCard(
		harness.createDefaultAgentsRfpDemoState(),
		"RFP-102",
		"Drafting",
	);
	const columns = harness.resolveRfpDemoBoardColumns(state);
	const drafting = columns.find((column) => column.title === "Drafting");

	assert.equal(state.workItems["RFP-102"].status, "Drafting");
	assert.equal(drafting.cards[0].code, "RFP-102");
	assert.deepEqual(state.workItems["RFP-102"].agentAssignmentIds, []);
	assert.deepEqual(state.customAgentActivity, []);
});

test("dragging RFP-102 to Drafting after agent creation assigns the agent and starts prep", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.moveRfpDemoCard(
		harness.scheduleRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState()),
		"RFP-102",
		"Drafting",
	);

	assert.deepEqual(state.workItems["RFP-102"].agentAssignmentIds, [harness.RFP_DRAFTING_AGENT_ID]);
	assert.match(
		state.customAgentActivity.map((item) => item.message).join("\n"),
		/RFP Drafting Agent started first-pass response prep for RFP-102\./,
	);
	assert.match(state.toasts[0].message, /Preparing first-pass response package/);
});
