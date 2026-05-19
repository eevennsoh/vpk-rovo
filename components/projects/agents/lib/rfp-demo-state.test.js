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
						RFP_DRAFTING_AGENT_AVATAR_SRCS,
						RFP_DRAFTING_AGENT_CONVERSATION_STARTERS,
						RFP_DRAFTING_AGENT_DESCRIPTION,
						RFP_DRAFTING_AGENT_ID,
						RFP_DRAFTING_AGENT_NAME,
						RFP_DRAFTING_EVENT_TRIGGER_LABEL,
						RFP_DRAFTING_TRIGGER_PROMPT,
						attachRfpReportToWorkItem,
					approveRfpReport,
					clearRfpDraftingAgentTrigger,
					createDefaultAgentsRfpDemoState,
					createRfpDraftingAgent,
					exportRfpReportPdf,
					generateRfpReport,
					getGeneratedRfpAttachments,
					getRfpDemoAgents,
					getRfpDemoColumnAgentAssignments,
					moveRfpDemoCard,
					parseAgentsRfpDemoState,
					recordRfpReportArtifactUpdate,
					refineRfpReport,
					resolveRfpDemoBoardColumns,
					scheduleRfpDraftingAgent,
					selectRfpReportVersion,
					setRfpDraftingAgentTrigger,
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

test("valid persisted payload resumes board, report, agent trigger, and activity", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.scheduleRfpDraftingAgent(
		harness.attachRfpReportToWorkItem(harness.refineRfpReport(harness.createDefaultAgentsRfpDemoState())),
	);
	const resumed = harness.parseAgentsRfpDemoState(JSON.stringify(state));

	assert.equal(resumed.report.stage, "attached");
	assert.equal(resumed.agent.id, harness.RFP_DRAFTING_AGENT_ID);
	assert.equal(resumed.agent.description, harness.RFP_DRAFTING_AGENT_DESCRIPTION);
	assert.deepEqual(resumed.agent.conversationStarters, [...harness.RFP_DRAFTING_AGENT_CONVERSATION_STARTERS]);
	assert.equal(resumed.schedule, null);
	assert.equal(resumed.agent.trigger.label, harness.RFP_DRAFTING_EVENT_TRIGGER_LABEL);
	assert.equal(resumed.customAgentActivity.length, 3);
	assert.deepEqual(
		harness.getGeneratedRfpAttachments(resumed, "RFP-101").map((attachment) => attachment.displayName),
		["Acmecorp RFP qualification DACI.pdf"],
	);
});

test("persisted report versions are normalized before canvas props consume them", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = {
		...harness.createDefaultAgentsRfpDemoState(),
		report: {
			stage: "refined",
			currentVersionId: "missing-version",
			previewHtml: "  <!doctype html><html><body>Report</body></html>  ",
			versions: [
				{
					id: " refined-current-report ",
					label: "Refined current report",
					summary: "",
					createdBy: "Maya",
					timestampLabel: "",
				},
				{ id: "", label: "Broken version" },
				"not-a-version",
			],
		},
	};
	const resumed = harness.parseAgentsRfpDemoState(JSON.stringify(state));

	assert.deepEqual(resumed.report.versions, [
		{
			id: "refined-current-report",
			label: "Refined current report",
			summary: "Refined current report",
			createdBy: "Maya",
			timestampLabel: "Now",
		},
	]);
	assert.equal(resumed.report.currentVersionId, undefined);
	assert.equal(resumed.report.previewHtml, "<!doctype html><html><body>Report</body></html>");
});

test("legacy persisted RFP agent profile gets description and conversation starters", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.createRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState());
	delete state.agent.description;
	delete state.agent.conversationStarters;

	const resumed = harness.parseAgentsRfpDemoState(JSON.stringify(state));

	assert.equal(resumed.agent.description, harness.RFP_DRAFTING_AGENT_DESCRIPTION);
	assert.deepEqual(resumed.agent.conversationStarters, [...harness.RFP_DRAFTING_AGENT_CONVERSATION_STARTERS]);
});

test("creating the RFP agent keeps Rovo as the selected chat agent", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.createRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState());

	assert.equal(state.agent.id, harness.RFP_DRAFTING_AGENT_ID);
	assert.equal(state.chat.selectedAgentId, "rovo");
});

test("RFP agent trigger prompt saves and explicit no-trigger state survives parsing", async () => {
	const harness = await loadRfpDemoStateHarness();
	const created = harness.createRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState());
	assert.equal(created.agent.trigger.prompt, harness.RFP_DRAFTING_TRIGGER_PROMPT);
	const prompted = harness.setRfpDraftingAgentTrigger(
		created,
		"When an RFP ticket enters Drafting, inspect the packet and draft the response package.",
	);

	assert.equal(prompted.agent.trigger.label, harness.RFP_DRAFTING_EVENT_TRIGGER_LABEL);
	assert.equal(
		prompted.agent.trigger.prompt,
		"When an RFP ticket enters Drafting, inspect the packet and draft the response package.",
	);

	const cleared = harness.clearRfpDraftingAgentTrigger(prompted);
	assert.equal(cleared.agent.trigger, null);

	const resumed = harness.parseAgentsRfpDemoState(JSON.stringify(cleared));
	assert.equal(resumed.agent.trigger, null);

	const reapplied = harness.createRfpDraftingAgent(resumed);
	assert.equal(reapplied.agent.trigger.label, harness.RFP_DRAFTING_EVENT_TRIGGER_LABEL);
	assert.equal(reapplied.agent.trigger.prompt, harness.RFP_DRAFTING_TRIGGER_PROMPT);
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

	const updated = harness.recordRfpReportArtifactUpdate(refined);
	assert.equal(updated.report.stage, "refined");
	assert.equal(updated.canvas.activeViewId, "report");
	assert.equal(updated.report.currentVersionId, "atlassian-logo-report");
	assert.deepEqual(
		updated.report.versions.map((version) => version.label),
		["Initial generated report", "Refined current report", "Added Atlassian logo"],
	);

	const approved = harness.approveRfpReport(updated);
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
	assert.equal(attached.workItems["RFP-101"].attachmentComment.authorName, "Maya Chen");
	assert.match(attached.workItems["RFP-101"].attachmentComment.content, /^Rovo drafted this comment\n/u);
	assert.match(attached.workItems["RFP-101"].attachmentComment.content, /Acmecorp RFP qualification DACI\.pdf/u);
	assert.equal(attached.workItems["RFP-101"].attachmentComment.attachmentHref, `#rovo-canvas-${harness.GENERATED_RFP_REPORT_ATTACHMENT_ID}`);
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

	assert.equal(twice.agent.name, "RFP Drafter");
	assert.equal(twice.agent.description, harness.RFP_DRAFTING_AGENT_DESCRIPTION);
	assert.deepEqual(twice.agent.conversationStarters, [...harness.RFP_DRAFTING_AGENT_CONVERSATION_STARTERS]);
	assert.ok(harness.RFP_DRAFTING_AGENT_AVATAR_SRCS.includes(twice.agent.avatarSrc));
	assert.notEqual(twice.agent.avatarSrc, "/1p/rovo.svg");
	assert.equal(twice.agent.trigger.label, harness.RFP_DRAFTING_EVENT_TRIGGER_LABEL);
	assert.deepEqual(harness.getRfpDemoColumnAgentAssignments(twice), {
		Drafting: [harness.RFP_DRAFTING_AGENT_ID],
	});
	assert.equal(harness.getRfpDemoAgents(twice, [])[0].avatarSrc, twice.agent.avatarSrc);
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
		/RFP Drafter started first-pass response prep for RFP-102\./,
	);
	assert.match(state.toasts[0].message, /Preparing first-pass response package/);
});

test("running RFP agent assignees resolve to hexagon board card avatars", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.moveRfpDemoCard(
		harness.scheduleRfpDraftingAgent(harness.createDefaultAgentsRfpDemoState()),
		"RFP-102",
		"Drafting",
	);
	state.workItems["RFP-102"] = {
		...state.workItems["RFP-102"],
		agentAssignmentIds: [harness.RFP_DRAFTING_AGENT_ID],
		agentStatus: "running",
		assignee: harness.RFP_DRAFTING_AGENT_NAME,
	};

	const drafting = harness.resolveRfpDemoBoardColumns(state).find((column) => column.title === "Drafting");
	const activeCard = drafting.cards.find((card) => card.code === "RFP-102");

	assert.equal(activeCard.avatarSrc, state.agent.avatarSrc);
	assert.equal(activeCard.avatarShape, "hexagon");
	assert.equal(activeCard.avatarPulse, true);
});

test("completed Review tickets left unassigned use the person placeholder avatar", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.createDefaultAgentsRfpDemoState();
	state.board.columns = state.board.columns.map((column) => {
		if (column.title === "Drafting") {
			return {
				...column,
				cardCodes: column.cardCodes.filter((cardCode) => cardCode !== "RFP-141"),
			};
		}
		if (column.title === "Review") {
			return {
				...column,
				cardCodes: ["RFP-141", ...column.cardCodes],
			};
		}
		return column;
	});
	state.workItems["RFP-141"] = {
		...state.workItems["RFP-141"],
		agentAssignmentIds: [harness.RFP_DRAFTING_AGENT_ID],
		agentStatus: "completed",
		assignee: null,
		status: "Review",
	};

	const reviewColumn = harness.resolveRfpDemoBoardColumns(state).find((column) => column.title === "Review");
	const completedCard = reviewColumn.cards.find((card) => card.code === "RFP-141");

	assert.equal(completedCard.avatarSrc, undefined);
	assert.equal(completedCard.avatarUnassignedKind, "person");
	assert.equal(completedCard.avatarPulse, false);
	assert.ok(completedCard.tags.some((tag) => tag.text === "draft ready"));
});

test("resolved Review column promotes latest completed RFP agent tickets", async () => {
	const harness = await loadRfpDemoStateHarness();
	const state = harness.createDefaultAgentsRfpDemoState();
	state.board.columns = state.board.columns.map((column) => {
		if (column.title === "Drafting") {
			return {
				...column,
				cardCodes: column.cardCodes.filter((cardCode) => !["RFP-141", "RFP-142", "RFP-143"].includes(cardCode)),
			};
		}
		if (column.title === "Review") {
			return {
				...column,
				cardCodes: [...column.cardCodes, "RFP-141", "RFP-142", "RFP-143", "RFP-101"],
			};
		}
		return column;
	});
	state.workItems["RFP-141"] = {
		...state.workItems["RFP-141"],
		agentAssignmentIds: [harness.RFP_DRAFTING_AGENT_ID],
		agentStatus: "completed",
		assignee: null,
		completedAt: "2026-06-03T15:02:00.000Z",
		status: "Review",
	};
	state.workItems["RFP-142"] = {
		...state.workItems["RFP-142"],
		agentAssignmentIds: [harness.RFP_DRAFTING_AGENT_ID],
		agentStatus: "completed",
		assignee: null,
		completedAt: "2026-06-03T15:04:00.000Z",
		status: "Review",
	};
	state.workItems["RFP-143"] = {
		...state.workItems["RFP-143"],
		agentAssignmentIds: [harness.RFP_DRAFTING_AGENT_ID],
		agentStatus: "completed",
		assignee: null,
		completedAt: "2026-06-03T15:06:00.000Z",
		status: "Review",
	};
	state.workItems["RFP-101"] = {
		...state.workItems["RFP-101"],
		agentAssignmentIds: [harness.RFP_DRAFTING_AGENT_ID],
		agentStatus: "completed",
		assignee: null,
		completedAt: "2026-06-03T15:20:00.000Z",
		status: "Review",
	};

	const reviewColumn = harness.resolveRfpDemoBoardColumns(state).find((column) => column.title === "Review");

	assert.deepEqual(
		reviewColumn.cards.slice(0, 4).map((card) => card.code),
		["RFP-101", "RFP-143", "RFP-142", "RFP-141"],
	);
});
