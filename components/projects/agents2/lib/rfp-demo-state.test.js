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
					RFP_DRAFTING_AGENT_CONVERSATION_STARTERS,
					RFP_DRAFTING_AGENT_DESCRIPTION,
					RFP_DRAFTING_AGENT_ID,
					RFP_DRAFTING_AGENT_NAME,
					RFP_DRAFTING_EVENT_TRIGGER_LABEL,
					RFP_DRAFTING_TRIGGER_PROMPT,
					attachRfpReportToWorkItem,
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
					setRfpDraftingAgentTrigger,
				} from "./components/projects/agents2/lib/rfp-demo-state";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "agents2-state-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("default agents2 state is local, Omni-coded, and isolated from agents", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.parseAgentsRfpDemoState(null);

	assert.equal(harness.AGENTS_RFP_DEMO_STORAGE_KEY, "vpk-rovo:agents2-omni-live-demo:v1");
	assert.deepEqual(state.board.columns.map((column) => column.title), [
		"Briefing",
		"Outline Drafting",
		"Experience Build",
		"Launch Ready",
	]);
	assert.ok(state.board.columns[0].cardCodes.includes("OMNI-101"));
	assert.equal(state.report.stage, "none");
	assert.equal(state.agent, null);
});

test("VoiceMate profile and trigger are normalized from persisted state", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.createRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState());
	delete state.agent.description;
	delete state.agent.conversationStarters;
	const resumed = harness.parseAgentsRfpDemoState(JSON.stringify(state));

	assert.equal(resumed.agent.id, harness.RFP_DRAFTING_AGENT_ID);
	assert.equal(resumed.agent.name, "VoiceMate");
	assert.equal(harness.RFP_DRAFTING_AGENT_NAME, "VoiceMate");
	assert.equal(resumed.agent.description, harness.RFP_DRAFTING_AGENT_DESCRIPTION);
	assert.deepEqual(resumed.agent.conversationStarters, [...harness.RFP_DRAFTING_AGENT_CONVERSATION_STARTERS]);
	assert.equal(resumed.agent.trigger.label, "On event: ticket enters Outline Drafting");
	assert.match(resumed.agent.trigger.prompt, /brand guide, voice and tone notes, launch milestones/u);
	assert.doesNotMatch(resumed.agent.trigger.prompt, /RFP|response package/u);
});

test("landing-page outline stages attach HTML to OMNI-101", async () => {
	const harness = await loadRfpDemoStateHarness();
	const generated = harness.generateRfpReport(harness.createDefaultAgentsRfpDemoState());
	const refined = harness.refineRfpReport(generated);
	const exported = harness.exportRfpReportPdf(refined);
	const attached = harness.attachRfpReportToWorkItem(exported, "<!doctype html><html><body>Omni Live</body></html>");
	const attachments = harness.getGeneratedRfpAttachments(attached, "OMNI-101");

	assert.equal(refined.report.versions[0].label, "Initial generated outline");
	assert.equal(refined.report.versions[1].label, "Refined current outline");
	assert.equal(exported.report.stage, "pdf-exported");
	assert.equal(attached.report.stage, "attached");
	assert.equal(attached.report.previewHtml, "<!doctype html><html><body>Omni Live</body></html>");
	assert.deepEqual(attachments.map((attachment) => attachment.displayName), ["Omni Live landing-page outline.html"]);
	assert.deepEqual(attachments.map((attachment) => attachment.previewKind), ["html-report"]);
	assert.deepEqual(attachments.map((attachment) => attachment.id), [harness.GENERATED_RFP_REPORT_ATTACHMENT_ID]);
	assert.deepEqual(attached.toasts.map((toast) => toast.message), ["Added landing-page outline to OMNI-101."]);
});

test("moving an Outline Drafting ticket after VoiceMate creation assigns outline prep", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.moveRfpDemoCard(
		harness.scheduleRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState()),
		"OMNI-102",
		"Outline Drafting",
	);
	const outlineColumn = harness.resolveRfpDemoBoardColumns(state).find((column) => column.title === "Outline Drafting");

	assert.deepEqual(harness.getRfpDemoColumnAgentAssignments(state), {
		"Outline Drafting": [harness.RFP_DRAFTING_AGENT_ID],
	});
	assert.equal(outlineColumn.cards[0].code, "OMNI-102");
	assert.deepEqual(state.workItems["OMNI-102"].agentAssignmentIds, [harness.RFP_DRAFTING_AGENT_ID]);
	assert.match(state.customAgentActivity.map((item) => item.message).join("\n"), /VoiceMate started landing-page outline prep for OMNI-102/u);
	assert.match(state.toasts[0].message, /Preparing landing-page outline/u);
});

test("scheduling VoiceMate only creates the trigger profile; backend run owns ticket assignment", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.scheduleRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState());
	const outlineCardCodes = state.board.columns.find((column) => column.title === "Outline Drafting").cardCodes;
	const outlineColumn = harness.resolveRfpDemoBoardColumns(state).find((column) => column.title === "Outline Drafting");

	assert.deepEqual(outlineCardCodes, ["OMNI-141", "OMNI-142", "OMNI-143"]);
	assert.equal(state.schedule, null);
	assert.equal(state.agent.name, "VoiceMate");
	assert.equal(state.agent.trigger.label, "On event: ticket enters Outline Drafting");
	for (const cardCode of outlineCardCodes) {
		assert.deepEqual(state.workItems[cardCode].agentAssignmentIds, []);
		assert.equal(state.workItems[cardCode].assignee, null);
		assert.equal(state.workItems[cardCode].agentStatus, "idle");
	}
	assert.deepEqual(
		outlineColumn.cards.map((card) => card.avatarShape),
		[undefined, undefined, undefined],
	);
	assert.deepEqual(
		outlineColumn.cards.map((card) => card.avatarPulse),
		[undefined, undefined, undefined],
	);
});
