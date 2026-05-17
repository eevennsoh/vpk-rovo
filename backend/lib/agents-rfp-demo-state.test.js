const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	RFP_DRAFTING_AGENT_NAME,
	RFP_DRAFTING_COLUMN_NAME,
	RFP_DRAFTING_EVENT_TRIGGER,
	RFP_DRAFTING_EVENT_TRIGGER_LABEL,
	RFP_REVIEW_COLUMN_NAME,
	createAgentsRfpDemoStateManager,
	createDefaultAgentsRfpDemoState,
	moveTicketToColumn,
	runRfpDraftingAgent,
} = require("./agents-rfp-demo-state");

test("default RFP demo backend state seeds the current board", () => {
	const state = createDefaultAgentsRfpDemoState();

	assert.deepEqual(
		state.board.columns.map((column) => [column.title, column.cardCodes]),
		[
			["RFP Intake", ["RFP-101", "RFP-102", "RFP-103", "RFP-104", "RFP-105", "RFP-106", "RFP-107"]],
			[RFP_DRAFTING_COLUMN_NAME, ["RFP-141", "RFP-142", "RFP-143"]],
			[RFP_REVIEW_COLUMN_NAME, ["RFP-161", "RFP-162", "RFP-163", "RFP-164"]],
			["Submitted", ["RFP-181", "RFP-182"]],
		],
	);
	assert.equal(state.agent, null);
	assert.equal(state.schedule, null);
});

test("applying the RFP Drafting Agent processes all current Drafting tickets", () => {
	const result = runRfpDraftingAgent(createDefaultAgentsRfpDemoState(), {
		jobId: "job-rfp-drafting",
		runId: "run-initial",
		source: "agent-apply",
	});

	assert.equal(result.state.agent.name, RFP_DRAFTING_AGENT_NAME);
	assert.equal(result.state.agent.jobId, "job-rfp-drafting");
	assert.deepEqual(result.state.agent.trigger, RFP_DRAFTING_EVENT_TRIGGER);
	assert.equal(result.state.agent.trigger.label, RFP_DRAFTING_EVENT_TRIGGER_LABEL);
	assert.deepEqual(result.runSummary.processedTicketCodes, ["RFP-141", "RFP-142", "RFP-143"]);
	assert.deepEqual(result.runSummary.skippedTicketCodes, []);
	assert.deepEqual(result.runSummary.failedTicketCodes, []);
	assert.equal(result.threadRecords.length, 3);

	for (const ticketCode of result.runSummary.processedTicketCodes) {
		const workItem = result.state.workItems[ticketCode];
		assert.equal(workItem.status, RFP_REVIEW_COLUMN_NAME);
		assert.equal(workItem.assignee, RFP_DRAFTING_AGENT_NAME);
		assert.equal(workItem.agentStatus, "completed");
		assert.equal(workItem.generatedAttachment.displayName, `${ticketCode} response draft.pdf`);
		assert.equal(workItem.agentComment.authorName, RFP_DRAFTING_AGENT_NAME);
		assert.match(workItem.agentSessionThreadId, /^agents-rfp-demo-rfp-/u);
	}
});

test("rerunning skips completed tickets with generated draft output", () => {
	const initial = runRfpDraftingAgent(createDefaultAgentsRfpDemoState(), {
		jobId: "job-rfp-drafting",
		runId: "run-initial",
	});
	const rerun = runRfpDraftingAgent(initial.state, {
		jobId: "job-rfp-drafting",
		runId: "run-rerun",
	});

	assert.deepEqual(rerun.runSummary.processedTicketCodes, []);
	assert.deepEqual(rerun.runSummary.failedTicketCodes, []);
	assert.deepEqual(rerun.runSummary.skippedTicketCodes, ["RFP-141", "RFP-142", "RFP-143"]);
	assert.equal(rerun.runSummary.status, "skipped");
	assert.equal(rerun.threadRecords.length, 0);
});

test("a later ticket entering Drafting processes only that ticket", () => {
	const initial = runRfpDraftingAgent(createDefaultAgentsRfpDemoState(), {
		jobId: "job-rfp-drafting",
		runId: "run-initial",
	});
	const movedState = moveTicketToColumn(initial.state, "RFP-102", RFP_DRAFTING_COLUMN_NAME);
	const eventRun = runRfpDraftingAgent(movedState, {
		jobId: "job-rfp-drafting",
		runId: "run-rfp-102",
		source: "jira-column-entered",
		ticketCodes: ["RFP-102"],
	});

	assert.deepEqual(eventRun.runSummary.processedTicketCodes, ["RFP-102"]);
	assert.deepEqual(eventRun.runSummary.skippedTicketCodes, []);
	assert.deepEqual(eventRun.runSummary.failedTicketCodes, []);
	assert.equal(eventRun.state.workItems["RFP-102"].status, RFP_REVIEW_COLUMN_NAME);
	assert.equal(eventRun.state.workItems["RFP-141"].status, RFP_REVIEW_COLUMN_NAME);
	assert.equal(eventRun.threadRecords.length, 1);
});

test("failed tickets do not block other tickets and retry on a later run", () => {
	const withExtraTicket = moveTicketToColumn(createDefaultAgentsRfpDemoState(), "RFP-102", RFP_DRAFTING_COLUMN_NAME);
	const failedRun = runRfpDraftingAgent(withExtraTicket, {
		failTicketCodes: ["RFP-142"],
		jobId: "job-rfp-drafting",
		runId: "run-with-failure",
	});

	assert.deepEqual(failedRun.runSummary.failedTicketCodes, ["RFP-142"]);
	assert.deepEqual(failedRun.runSummary.processedTicketCodes, ["RFP-102", "RFP-141", "RFP-143"]);
	assert.equal(failedRun.state.workItems["RFP-142"].status, RFP_DRAFTING_COLUMN_NAME);
	assert.equal(failedRun.state.workItems["RFP-142"].agentStatus, "failed");
	assert.equal(failedRun.state.workItems["RFP-141"].status, RFP_REVIEW_COLUMN_NAME);
	assert.equal(failedRun.state.workItems["RFP-143"].status, RFP_REVIEW_COLUMN_NAME);

	const retryRun = runRfpDraftingAgent(failedRun.state, {
		jobId: "job-rfp-drafting",
		runId: "run-retry",
	});
	assert.deepEqual(retryRun.runSummary.processedTicketCodes, ["RFP-142"]);
	assert.equal(retryRun.state.workItems["RFP-142"].agentStatus, "completed");
	assert.equal(retryRun.state.workItems["RFP-142"].status, RFP_REVIEW_COLUMN_NAME);
});

test("state manager persists normalized demo state and reset clears agent output", async (t) => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agents-rfp-demo-state-"));
	t.after(() => fs.rm(tempDir, { force: true, recursive: true }));
	const manager = createAgentsRfpDemoStateManager({ baseDir: tempDir });
	const result = runRfpDraftingAgent(createDefaultAgentsRfpDemoState(), {
		jobId: "job-rfp-drafting",
		runId: "run-initial",
	});

	await manager.writeState(result.state);
	const persisted = await manager.readState();
	assert.equal(persisted.agent.jobId, "job-rfp-drafting");
	assert.equal(persisted.workItems["RFP-141"].agentStatus, "completed");

	const reset = await manager.resetState();
	assert.equal(reset.agent, null);
	assert.equal(reset.workItems["RFP-141"].agentStatus, "idle");
	assert.equal(reset.workItems["RFP-141"].generatedAttachment, null);
});
