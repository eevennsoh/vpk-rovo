const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	RFP_DRAFTING_AGENT_NAME,
	RFP_DRAFTING_COLUMN_NAME,
	advanceRfpDraftingAgentProcessing,
	createAgents2RfpDemoStateManager,
	createDefaultAgents2RfpDemoState,
	runRfpDraftingAgent,
} = require("./agents2-rfp-demo-state");

const RUN_NOW = Date.parse("2026-01-01T00:00:00.000Z");

async function advanceAll(state, now = RUN_NOW + 40_000) {
	return advanceRfpDraftingAgentProcessing(state, {
		now,
	});
}

test("default agents2 backend state seeds the Omni Live board", () => {
	const state = createDefaultAgents2RfpDemoState();

	assert.deepEqual(
		state.board.columns.map((column) => [column.title, column.cardCodes]),
		[
			["Briefing", ["OMNI-101", "OMNI-102", "OMNI-103", "OMNI-104", "OMNI-105", "OMNI-106", "OMNI-107"]],
			[RFP_DRAFTING_COLUMN_NAME, ["OMNI-141", "OMNI-142", "OMNI-143"]],
			["Experience Build", ["OMNI-161", "OMNI-162", "OMNI-163", "OMNI-164"]],
			["Launch Ready", ["OMNI-181", "OMNI-182"]],
		],
	);
	assert.equal(state.agent, null);
	assert.equal(state.schedule, null);
});

test("applying VoiceMate queues all current Outline Drafting tickets", () => {
	const result = runRfpDraftingAgent(createDefaultAgents2RfpDemoState(), {
		jobId: "job-voicemate",
		now: RUN_NOW,
		runId: "run-initial",
		source: "agent-apply",
	});

	assert.equal(result.state.agent.name, RFP_DRAFTING_AGENT_NAME);
	assert.equal(result.state.agent.jobId, "job-voicemate");
	assert.deepEqual(result.runSummary.processedTicketCodes, ["OMNI-141", "OMNI-142", "OMNI-143"]);
	assert.equal(result.runSummary.status, "running");
	assert.equal(result.threadRecords.length, 3);

	for (const ticketCode of result.runSummary.processedTicketCodes) {
		const workItem = result.state.workItems[ticketCode];
		assert.equal(workItem.status, RFP_DRAFTING_COLUMN_NAME);
		assert.equal(workItem.assignee, RFP_DRAFTING_AGENT_NAME);
		assert.ok(["queued", "running"].includes(workItem.agentStatus));
		assert.match(workItem.agentReadyAt, /^2026-01-01T00:00:/u);
		assert.equal(workItem.generatedAttachment, null);
		assert.match(workItem.agentSessionThreadId, /^agents2-omni-live-omni-/u);
	}
});

test("advancing due VoiceMate tickets attaches HTML and moves them to Experience Build", async () => {
	const initial = runRfpDraftingAgent(createDefaultAgents2RfpDemoState(), {
		jobId: "job-voicemate",
		now: RUN_NOW,
		runId: "run-initial",
	});
	const firstAdvance = await advanceRfpDraftingAgentProcessing(initial.state, {
		now: RUN_NOW + 16_000,
	});

	assert.deepEqual(firstAdvance.completedTicketCodes, ["OMNI-141"]);
	assert.equal(firstAdvance.state.workItems["OMNI-141"].status, "Experience Build");
	assert.equal(firstAdvance.state.workItems["OMNI-142"].status, RFP_DRAFTING_COLUMN_NAME);
	assert.equal(firstAdvance.state.agent.jobRunSummaries[0].status, "running");

	const finalAdvance = await advanceAll(firstAdvance.state);
	assert.deepEqual(finalAdvance.completedTicketCodes, ["OMNI-142", "OMNI-143"]);
	assert.equal(finalAdvance.state.agent.jobRunSummaries[0].status, "completed");
	for (const ticketCode of ["OMNI-141", "OMNI-142", "OMNI-143"]) {
		const workItem = finalAdvance.state.workItems[ticketCode];
		assert.equal(workItem.status, "Experience Build");
		assert.equal(workItem.assignee, null);
		assert.equal(workItem.agentStatus, "completed");
		assert.equal(workItem.generatedAttachment.displayName, `${ticketCode} landing-page outline.html`);
		assert.equal(workItem.generatedAttachment.previewKind, "html-report");
		assert.match(workItem.generatedAttachment.previewHtml, /<!doctype html>/iu);
		assert.match(workItem.generatedAttachment.previewHtml, new RegExp(ticketCode, "u"));
		assert.equal(workItem.agentComment.authorName, RFP_DRAFTING_AGENT_NAME);
		assert.match(workItem.agentComment.content, /Status: draft complete\./u);
		assert.match(workItem.agentComment.content, /moved the ticket to Experience Build/u);
	}
});

test("agents2 state manager persists separately from agents", async (t) => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agents2-rfp-demo-state-"));
	t.after(() => fs.rm(tempDir, { force: true, recursive: true }));
	const manager = createAgents2RfpDemoStateManager({ baseDir: tempDir });
	const result = runRfpDraftingAgent(createDefaultAgents2RfpDemoState(), {
		jobId: "job-voicemate",
		now: RUN_NOW,
		runId: "run-initial",
	});
	const completed = await advanceAll(result.state);

	await manager.writeState(completed.state);
	const persisted = await manager.readState();
	assert.equal(persisted.agent.jobId, "job-voicemate");
	assert.equal(persisted.workItems["OMNI-141"].agentStatus, "completed");
	assert.match(manager.filePath, /agents2-rfp-demo\/state\.json$/u);

	const reset = await manager.resetState();
	assert.equal(reset.agent, null);
	assert.equal(reset.workItems["OMNI-141"].agentStatus, "idle");
	assert.equal(reset.workItems["OMNI-141"].generatedAttachment, null);
});
