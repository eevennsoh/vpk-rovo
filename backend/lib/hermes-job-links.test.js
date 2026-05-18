const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createHermesJobLinkManager } = require("./hermes-job-links");

test("Hermes job links preserve event trigger metadata and RFP run history", async (t) => {
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "vpk-hermes-job-links-"));
	t.after(() => fs.rm(tempDir, { force: true, recursive: true }));
	const manager = createHermesJobLinkManager({ baseDir: tempDir });

	await manager.setLink("job-rfp-drafting", {
		postResultToThread: false,
		runHistory: [
			{
				id: "run-initial",
				jobId: "job-rfp-drafting",
				source: "agent-apply",
				triggerLabel: "On event: ticket enters Drafting",
				status: "completed",
				startedAt: "2025-09-03T15:00:00.000Z",
				finishedAt: "2025-09-03T15:08:00.000Z",
				processedTicketCodes: ["RFP-141"],
				skippedTicketCodes: [],
				failedTicketCodes: [],
				threadLinks: [{ ticketCode: "RFP-141", threadId: "agents-rfp-demo-rfp-141" }],
				summary: "Processed 1 ticket, skipped 0, failed 0.",
			},
		],
		surface: "agents-rfp-demo",
		threadStrategy: "new-per-run",
		trigger: {
			type: "jira-column-entered",
			board: "Enterprise RFP Response",
			column: "Drafting",
			label: "On event: ticket enters Drafting",
		},
		triggerLabel: "On event: ticket enters Drafting",
	});

		const merged = await manager.mergeJobsWithLinks([{
			id: "job-rfp-drafting",
			name: "RFP Drafter - Enterprise RFP Response",
			schedule: "manual",
		}]);

	assert.equal(merged[0].surface, "agents-rfp-demo");
	assert.deepEqual(merged[0].trigger, {
		type: "jira-column-entered",
		board: "Enterprise RFP Response",
		column: "Drafting",
		label: "On event: ticket enters Drafting",
	});
	assert.equal(merged[0].triggerLabel, "On event: ticket enters Drafting");
	assert.equal(merged[0].runHistory.length, 1);
	assert.deepEqual(merged[0].runHistory[0].threadLinks, [
		{ ticketCode: "RFP-141", threadId: "agents-rfp-demo-rfp-141" },
	]);
});
