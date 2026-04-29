"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { SymphonyOrchestrator, computeBackoffMs } = require("./orchestrator");

function baseConfig(root) {
	return {
		agent: {
			approvalPolicy: "never",
			approvalsReviewer: "auto_review",
			maxTurns: 3,
			model: null,
			reasoningEffort: null,
			sandbox: "workspace-write",
			serviceName: "symphony",
		},
		dispatch: {
			backoffBaseMs: 100,
			backoffMaxMs: 1000,
			dryRun: false,
			maxParallel: 1,
			pollIntervalMs: 1000,
		},
		tracker: {
			activeStates: ["Todo"],
			doneState: "Done",
			failedState: null,
			inProgressState: "In Progress",
			landingStates: ["Done"],
			labels: ["symphony"],
			team: "ENG",
			terminalStates: ["Done"],
		},
		workspace: {
			root,
			ttlMs: 0,
		},
	};
}

test("computeBackoffMs caps exponential retry delay", () => {
	const config = baseConfig("/tmp/symphony");
	assert.equal(computeBackoffMs(1, config), 100);
	assert.equal(computeBackoffMs(8, config), 1000);
});

test("SymphonyOrchestrator dispatches an active issue through workspace and agent", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-test-"));
	const issue = {
		description: "Implement it",
		id: "issue-id",
		identifier: "ENG-123",
		stateName: "Todo",
		title: "Add feature",
	};
	const events = [];
	const linearClient = {
		async createComment(issueId, body) {
			events.push(["comment", issueId, body]);
		},
		async searchIssues() {
			return [issue];
		},
		async updateIssueState(issueId, stateName) {
			events.push(["state", issueId, stateName]);
		},
	};
	const workspaceManager = {
		async cleanup() {},
		async createOrReuse() {
			events.push(["workspace"]);
			return { branchName: "symphony/ENG-123", path: tempDir };
		},
		async runPostFailure() {
			events.push(["postFailure"]);
		},
		async runPostSuccess() {
			events.push(["postSuccess"]);
		},
		async runPreStart() {
			events.push(["preStart"]);
		},
	};
	const agent = {
		async initialize() {
			events.push(["agentInitialize"]);
		},
		async runTurn({ input }) {
			events.push(["runTurn", input]);
			return { success: true, text: "Changed files and ran tests.", threadId: "thread-1", turnId: "turn-1" };
		},
		async startThread({ developerInstructions }) {
			events.push(["startThread", developerInstructions]);
		},
		stop() {
			events.push(["stop"]);
		},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => agent,
		config: baseConfig(tempDir),
		linearClient,
		stateFile: path.join(tempDir, "state.json"),
		workflowRuntime: {
			current: {
				body: "Developer instructions",
				config: {
					prompt: "{{ issue.identifier }} {{ issue.title }} attempt {{ attempt }}",
				},
			},
			reloadIfChanged() {
				return false;
			},
		},
		workspaceManager,
	});

	const snapshot = await orchestrator.pollOnce();

	assert.deepEqual(events[0], ["workspace"]);
	assert.deepEqual(events[1], ["preStart"]);
	assert.deepEqual(events[2], ["state", "issue-id", "In Progress"]);
	assert.deepEqual(events[5], ["runTurn", "ENG-123 Add feature attempt 1"]);
	assert.deepEqual(events.at(-2), ["state", "issue-id", "Done"]);
	assert.equal(snapshot.issues[0].status, "succeeded");
	assert.equal(snapshot.issues[0].threadId, "thread-1");
});

test("SymphonyOrchestrator dispatches unlimited workers concurrently", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-parallel-test-"));
	const issues = [
		{ description: "", id: "issue-1", identifier: "ENG-1", stateName: "Todo", title: "First" },
		{ description: "", id: "issue-2", identifier: "ENG-2", stateName: "Todo", title: "Second" },
	];
	let activeTurns = 0;
	let maxActiveTurns = 0;
	const config = baseConfig(tempDir);
	config.dispatch.maxParallel = Number.POSITIVE_INFINITY;
	const linearClient = {
		async createComment() {},
		async searchIssues() {
			return issues;
		},
		async updateIssueState() {},
	};
	const workspaceManager = {
		async cleanup() {},
		async createOrReuse(issue) {
			return { branchName: `symphony/${issue.identifier}`, path: tempDir };
		},
		async runPostFailure() {},
		async runPostSuccess() {},
		async runPreStart() {},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: ({ issue }) => ({
			async initialize() {},
			async runTurn() {
				activeTurns += 1;
				maxActiveTurns = Math.max(maxActiveTurns, activeTurns);
				await new Promise((resolve) => setTimeout(resolve, 10));
				activeTurns -= 1;
				return { success: true, text: issue.identifier, threadId: `thread-${issue.identifier}`, turnId: `turn-${issue.identifier}` };
			},
			async startThread() {},
			stop() {},
		}),
		config,
		linearClient,
		stateFile: path.join(tempDir, "state.json"),
		workflowRuntime: {
			current: { body: "", config: {} },
			reloadIfChanged() {
				return false;
			},
		},
		workspaceManager,
	});

	const snapshot = await orchestrator.pollOnce({ waitForDispatch: true });

	assert.equal(maxActiveTurns, 2);
	assert.deepEqual(
		snapshot.issues.map((issue) => issue.status),
		["succeeded", "succeeded"],
	);
});

test("SymphonyOrchestrator polls non-landing terminal states and cleans completed workspaces", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-cleanup-test-"));
	const issue = {
		description: "",
		id: "issue-id",
		identifier: "ENG-123",
		stateName: "Canceled",
		title: "Completed feature",
	};
	const searches = [];
	const events = [];
	const config = baseConfig(tempDir);
	config.tracker.terminalStates = ["Canceled"];
	const linearClient = {
		async createComment() {
			events.push(["comment"]);
		},
		async searchIssues({ stateNames }) {
			searches.push(stateNames);
			return stateNames.includes("Canceled") ? [issue] : [];
		},
		async updateIssueState(_issueId, stateName) {
			events.push(["state", stateName]);
		},
	};
	const workspaceManager = {
		async cleanup(cleanupIssue) {
			events.push(["cleanup", cleanupIssue.identifier]);
			return { path: tempDir, removed: true };
		},
		async createOrReuse() {
			events.push(["workspace"]);
			return { branchName: "symphony/ENG-123", path: tempDir };
		},
		async runPostFailure() {},
		async runPostSuccess() {},
		async runPreStart() {},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => {
			throw new Error("terminal issues should not start agents");
		},
		config,
		linearClient,
		stateFile: path.join(tempDir, "state.json"),
		workflowRuntime: {
			current: { body: "", config: {} },
			reloadIfChanged() {
				return false;
			},
		},
		workspaceManager,
	});

	const snapshot = await orchestrator.pollOnce();

	assert.deepEqual(searches, [["Todo"], ["Canceled"]]);
	assert.deepEqual(events, [["cleanup", "ENG-123"]]);
	assert.equal(snapshot.issues[0].status, "cleaned");
});

test("SymphonyOrchestrator lands Done issues and comments with PR status", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-landing-test-"));
	const issue = {
		description: "",
		id: "issue-id",
		identifier: "ENG-123",
		stateName: "Done",
		title: "Completed feature",
	};
	const events = [];
	const linearClient = {
		async createComment(issueId, body) {
			events.push(["comment", issueId, body]);
		},
		async searchIssues({ stateNames }) {
			return stateNames.includes("Done") ? [issue] : [];
		},
		async updateIssueState(_issueId, stateName) {
			events.push(["state", stateName]);
		},
	};
	const workspaceManager = {
		async cleanup() {
			events.push(["cleanup"]);
		},
		async createOrReuse() {
			events.push(["workspace"]);
			return { branchName: "symphony/ENG-123", path: tempDir };
		},
		async landIssue(landIssue) {
			events.push(["land", landIssue.identifier]);
			return {
				baseRef: "main",
				branchCleanup: {
					local: { deleted: true },
					remote: { deleted: true },
				},
				branchName: "symphony/ENG-123",
				commitCreated: true,
				prNumber: 12,
				prUrl: "https://github.test/pull/12",
				reusedPullRequest: false,
				status: "merged",
				workspaceRemoved: true,
			};
		},
		async runPostFailure() {},
		async runPostSuccess() {},
		async runPreStart() {},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => {
			throw new Error("Done issues should land without starting agents");
		},
		config: baseConfig(tempDir),
		linearClient,
		stateFile: path.join(tempDir, "state.json"),
		workflowRuntime: {
			current: { body: "", config: {} },
			reloadIfChanged() {
				return false;
			},
		},
		workspaceManager,
	});

	const snapshot = await orchestrator.pollOnce();

	assert.deepEqual(events[0], ["land", "ENG-123"]);
	assert.equal(events[1][0], "comment");
	assert.match(events[1][2], /Symphony landed ENG-123/);
	assert.match(events[1][2], /PR: https:\/\/github.test\/pull\/12/);
	assert.match(events[1][2], /Branch cleanup: deleted local branch; deleted remote branch\./);
	assert.equal(snapshot.issues[0].status, "landed");
	assert.equal(snapshot.issues[0].prUrl, "https://github.test/pull/12");
});
