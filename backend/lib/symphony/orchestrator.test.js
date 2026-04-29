"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { SymphonyEventLog } = require("./event-log");
const { createStatusServer } = require("./http-server");
const { SymphonyOrchestrator, computeBackoffMs, formatIssueCommentsMarkdown } = require("./orchestrator");

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
			landingStates: ["Merging"],
			labels: ["symphony"],
			mergeState: "Merging",
			reviewState: "Human Review",
			reworkState: "Rework",
			team: "ENG",
			terminalStates: ["Done"],
		},
		github: {
			allowNoChecks: true,
			requireGreenChecks: true,
			requireNoUnresolvedReviews: true,
		},
		validation: {
			commands: ["pnpm run lint"],
			timeoutMs: 1000,
		},
		workspace: {
			root,
			ttlMs: 0,
		},
	};
}

function readEvents(root) {
	const filePath = path.join(root, ".symphony-events.jsonl");
	if (!fs.existsSync(filePath)) {
		return [];
	}
	return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

function requestJson(server, pathname) {
	return new Promise((resolve, reject) => {
		const { port } = server.address();
		const req = http.get({ hostname: "127.0.0.1", path: pathname, port }, (res) => {
			let body = "";
			res.setEncoding("utf8");
			res.on("data", (chunk) => {
				body += chunk;
			});
			res.on("end", () => {
				try {
					resolve({ body: JSON.parse(body), statusCode: res.statusCode });
				} catch (error) {
					reject(error);
				}
			});
		});
		req.on("error", reject);
	});
}

test("computeBackoffMs caps exponential retry delay", () => {
	const config = baseConfig("/tmp/symphony");
	assert.equal(computeBackoffMs(1, config), 100);
	assert.equal(computeBackoffMs(8, config), 1000);
});

test("formatIssueCommentsMarkdown preserves recent Linear context in chronological order", () => {
	const markdown = formatIssueCommentsMarkdown([
		{
			body: "Second note",
			createdAt: "2026-04-29T02:00:00.000Z",
			user: { name: "Reviewer" },
		},
		{
			body: "## Codex Workpad\nCurrent plan goes here.",
			createdAt: "2026-04-29T01:00:00.000Z",
			user: { name: "Codex" },
		},
	]);

	assert.match(markdown, /^- 2026-04-29T01:00:00.000Z by Codex/);
	assert.match(markdown, /## Codex Workpad/);
	assert.match(markdown, /- 2026-04-29T02:00:00.000Z by Reviewer/);
});

test("formatIssueCommentsMarkdown keeps prompt history bounded", () => {
	const comments = [
		{
			body: "dropped oldest one",
			createdAt: "2026-04-29T00:00:00.000Z",
			user: { name: "Oldest" },
		},
		{
			body: "dropped oldest two",
			createdAt: "2026-04-29T00:01:00.000Z",
			user: { name: "Older" },
		},
		...Array.from({ length: 24 }, (_value, index) => ({
			body: `kept comment ${index + 1}`,
			createdAt: `2026-04-29T00:${String(index + 2).padStart(2, "0")}:00.000Z`,
			user: { email: "reviewer@example.com" },
		})),
		{
			body: "x".repeat(4005),
			createdAt: "2026-04-29T00:26:00.000Z",
			user: null,
		},
	];

	const markdown = formatIssueCommentsMarkdown(comments);

	assert.equal(markdown.match(/^- /gm)?.length, 25);
	assert.doesNotMatch(markdown, /dropped oldest one/);
	assert.doesNotMatch(markdown, /dropped oldest two/);
	assert.match(markdown, /kept comment 1/);
	assert.match(markdown, /reviewer@example\.com/);
	assert.match(markdown, /Unknown author/);
	assert.match(markdown, /\[comment truncated\]/);
	assert.equal(markdown.includes("x".repeat(4001)), false);
});

test("SymphonyOrchestrator dispatches an active issue through workspace and agent", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-test-"));
	const issue = {
		comments: [
			{
				body: "Human rework note",
				createdAt: "2026-04-29T03:00:00.000Z",
				user: { name: "Reviewer" },
			},
		],
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
		async getIssue() {
			return issue;
		},
		async searchIssues() {
			return [issue];
		},
		async updateIssueState(issueId, stateName) {
			events.push(["state", issueId, stateName]);
		},
		async upsertWorkpadComment(issueId, body) {
			events.push(["workpad", issueId, body]);
			return { body, id: "workpad-1" };
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
		async runValidationCommands() {
			events.push(["validation"]);
			return { commands: [{ command: "pnpm run lint", ok: true }], ok: true };
		},
		async prepareReviewPullRequest() {
			events.push(["reviewPr"]);
			return { branchName: "symphony/ENG-123", prNumber: 1, prUrl: "https://github.test/pull/1", status: "review_ready" };
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
					prompt: "{{ issue.identifier }} {{ issue.title }} attempt {{ attempt }}\n{{ issue.commentsMarkdown }}",
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
	assert.match(events[5][1], /ENG-123 Add feature attempt 1/);
	assert.match(events[5][1], /Human rework note/);
	assert.ok(events.some((event) => event[0] === "validation"));
	assert.ok(events.some((event) => event[0] === "reviewPr"));
	assert.deepEqual(events.at(-2), ["state", "issue-id", "Human Review"]);
	assert.equal(snapshot.issues[0].status, "review");
	assert.equal(snapshot.issues[0].threadId, "thread-1");
	assert.ok(readEvents(tempDir).some((event) => event.type === "review_ready" && event.prUrl === "https://github.test/pull/1"));
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
		async getIssue(issueId) {
			return issues.find((issue) => issue.id === issueId);
		},
		async searchIssues() {
			return issues;
		},
		async updateIssueState() {},
		async upsertWorkpadComment() {
			return { id: "workpad" };
		},
	};
	const workspaceManager = {
		async cleanup() {},
		async createOrReuse(issue) {
			return { branchName: `symphony/${issue.identifier}`, path: tempDir };
		},
		async runPostFailure() {},
		async runPostSuccess() {},
		async runPreStart() {},
		async runValidationCommands() {
			return { commands: [{ command: "pnpm run lint", ok: true }], ok: true };
		},
		async prepareReviewPullRequest(issue) {
			return { branchName: `symphony/${issue.identifier}`, prUrl: `https://github.test/${issue.identifier}`, status: "review_ready" };
		},
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
		["review", "review"],
	);
});

test("SymphonyOrchestrator moves max-turn active loops to Human Review with blockers", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-max-turns-test-"));
	const issue = {
		comments: [],
		description: "",
		id: "issue-id",
		identifier: "ENG-44",
		stateName: "Todo",
		title: "Needs retries",
	};
	const events = [];
	let turns = 0;
	const config = baseConfig(tempDir);
	config.agent.maxTurns = 2;
	const linearClient = {
		async createComment(issueId, body) {
			events.push(["comment", issueId, body]);
		},
		async getIssue() {
			return issue;
		},
		async searchIssues({ stateNames }) {
			return stateNames.includes("Todo") ? [issue] : [];
		},
		async updateIssueState(_issueId, stateName) {
			events.push(["state", stateName]);
		},
		async upsertWorkpadComment(issueId, body) {
			events.push(["workpad", issueId, body]);
			return { body, id: "workpad-1" };
		},
	};
	const workspaceManager = {
		async cleanup() {},
		async createOrReuse() {
			return { branchName: "symphony/ENG-44", path: tempDir };
		},
		async prepareReviewPullRequest() {
			events.push(["reviewPr"]);
			return { branchName: "symphony/ENG-44", prNumber: 44, prUrl: "https://github.test/pull/44", status: "review_ready" };
		},
		async runPostFailure() {},
		async runPreStart() {},
		async runValidationCommands() {
			return { commands: [{ command: "pnpm run lint", exitCode: 1, ok: false }], ok: false };
		},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => ({
			async initialize() {},
			async runTurn() {
				turns += 1;
				return { success: true, text: `attempt ${turns}`, threadId: "thread-44", turnId: `turn-${turns}` };
			},
			async startThread() {
				this.threadId = "thread-44";
			},
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

	const snapshot = await orchestrator.pollOnce();

	assert.equal(turns, 2);
	assert.equal(snapshot.issues[0].status, "max_turns_review");
	assert.equal(snapshot.issues[0].lastBlocker, "Validation failed.");
	assert.ok(events.some((event) => event[0] === "comment" && /Human Review with blockers/.test(event[2])));
	assert.ok(events.some((event) => event[0] === "state" && event[1] === "Human Review"));
	assert.ok(readEvents(tempDir).some((event) => event.type === "validation_completed" && event.validation.commands[0].exitCode === 1));
});

test("SymphonyOrchestrator continues active turns until validation passes", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-validation-loop-test-"));
	const issue = {
		comments: [],
		description: "",
		id: "issue-id",
		identifier: "ENG-45",
		stateName: "Todo",
		title: "Fix validation",
	};
	const events = [];
	let turns = 0;
	let validations = 0;
	const linearClient = {
		async createComment(issueId, body) {
			events.push(["comment", issueId, body]);
		},
		async getIssue() {
			return issue;
		},
		async searchIssues({ stateNames }) {
			return stateNames.includes("Todo") ? [issue] : [];
		},
		async updateIssueState(_issueId, stateName) {
			events.push(["state", stateName]);
		},
		async upsertWorkpadComment(issueId, body) {
			events.push(["workpad", issueId, body]);
			return { body, id: "workpad-1" };
		},
	};
	const workspaceManager = {
		async cleanup() {},
		async createOrReuse() {
			return { branchName: "symphony/ENG-45", path: tempDir };
		},
		async prepareReviewPullRequest() {
			return { branchName: "symphony/ENG-45", prNumber: 45, prUrl: "https://github.test/pull/45", status: "review_ready" };
		},
		async runPostFailure() {},
		async runPreStart() {},
		async runValidationCommands() {
			validations += 1;
			return {
				commands: [{ command: "pnpm run lint", exitCode: validations === 1 ? 1 : 0, ok: validations !== 1 }],
				ok: validations !== 1,
			};
		},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => ({
			async initialize() {},
			async runTurn() {
				turns += 1;
				return { success: true, text: `attempt ${turns}`, threadId: "thread-45", turnId: `turn-${turns}` };
			},
			async startThread() {
				this.threadId = "thread-45";
			},
			stop() {},
		}),
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

	assert.equal(turns, 2);
	assert.equal(snapshot.issues[0].status, "review");
	assert.equal(snapshot.issues[0].lastBlocker, null);
	assert.ok(events.some((event) => event[0] === "comment" && /moved this issue to Human Review\./.test(event[2])));
	assert.equal(events.some((event) => event[0] === "comment" && /with blockers/.test(event[2])), false);
	assert.ok(readEvents(tempDir).filter((event) => event.type === "validation_completed").length >= 2);
});

test("SymphonyOrchestrator stops an active Codex run before terminal cleanup", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-stop-test-"));
	const issue = {
		description: "",
		id: "issue-id",
		identifier: "ENG-77",
		stateName: "Todo",
		title: "Cancel while running",
	};
	const events = [];
	let currentState = "Todo";
	let rejectTurn;
	let resolveRunStarted;
	const runStarted = new Promise((resolve) => {
		resolveRunStarted = resolve;
	});
	const linearClient = {
		async createComment(_issueId, body) {
			events.push(["comment", body]);
		},
		async getIssue() {
			issue.stateName = currentState;
			return issue;
		},
		async searchIssues({ stateNames }) {
			issue.stateName = currentState;
			return stateNames.includes(currentState) ? [issue] : [];
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
			return { branchName: "symphony/ENG-77", path: tempDir };
		},
		async runPostFailure() {
			events.push(["postFailure"]);
		},
		async runPostSuccess() {},
		async runPreStart() {},
	};
	let stopped = false;
	const agent = {
		async initialize() {},
		async runTurn() {
			resolveRunStarted();
			return new Promise((_resolve, reject) => {
				rejectTurn = reject;
			});
		},
		async startThread() {
			this.threadId = "thread-stop";
		},
		stop() {
			if (stopped) {
				return;
			}
			stopped = true;
			events.push(["stop"]);
			rejectTurn?.(new Error("stopped by test"));
		},
	};
	const config = baseConfig(tempDir);
	config.tracker.terminalStates = ["Canceled"];
	config.tracker.landingStates = ["Merging"];
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => agent,
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

	await orchestrator.pollOnce({ waitForDispatch: false });
	await runStarted;
	currentState = "Canceled";
	const snapshot = await orchestrator.pollOnce();

	assert.ok(stopped);
	assert.ok(events.findIndex((event) => event[0] === "stop") < events.findIndex((event) => event[0] === "cleanup"));
	assert.equal(events.some((event) => event[0] === "postFailure"), false);
	assert.equal(events.some((event) => event[0] === "comment" && /failed/i.test(event[1])), false);
	assert.equal(snapshot.issues[0].status, "cleaned");
	const eventTypes = readEvents(tempDir).map((event) => event.type);
	assert.ok(eventTypes.includes("agent_stop_requested"));
	assert.ok(eventTypes.includes("run_stopped"));
	assert.ok(eventTypes.includes("cleanup_succeeded"));
});

test("SymphonyOrchestrator reloads workflow front matter before polling", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-reload-test-"));
	const initialConfig = baseConfig(tempDir);
	const nextConfig = baseConfig(tempDir);
	nextConfig.dispatch.maxParallel = Number.POSITIVE_INFINITY;
	nextConfig.tracker.activeStates = ["Ready"];
	nextConfig.tracker.labels = ["codex"];
	nextConfig.tracker.terminalStates = ["Closed"];
	const searches = [];
	const linearClient = {
		async createComment() {},
		async searchIssues(search) {
			searches.push(search);
			return [];
		},
		async updateIssueState() {},
	};
	let reloaded = false;
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => {
			throw new Error("no issues should dispatch");
		},
		config: initialConfig,
		linearClient,
		reloadRuntimeConfig() {
			return { config: nextConfig };
		},
		stateFile: path.join(tempDir, "state.json"),
		workflowRuntime: {
			current: { body: "", config: {} },
			reloadIfChanged() {
				if (reloaded) {
					return false;
				}
				reloaded = true;
				return true;
			},
		},
		workspaceManager: {},
	});

	await orchestrator.pollOnce();

	assert.deepEqual(searches[0], { labels: ["codex"], stateNames: ["Ready"], team: "ENG" });
	assert.deepEqual(searches[1], { labels: ["codex"], stateNames: ["Merging"], team: "ENG" });
	assert.deepEqual(searches[2], { labels: ["codex"], stateNames: ["Closed"], team: "ENG" });
	assert.equal(orchestrator.config.dispatch.maxParallel, Number.POSITIVE_INFINITY);
	assert.ok(readEvents(tempDir).some((event) => event.type === "workflow_reloaded"));
});

test("SymphonyOrchestrator records failed runs and retry scheduling", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-failure-log-test-"));
	const issue = {
		description: "",
		id: "issue-id",
		identifier: "ENG-500",
		stateName: "Todo",
		title: "Fail run",
	};
	const linearClient = {
		async createComment() {},
		async getIssue() {
			return issue;
		},
		async searchIssues({ stateNames }) {
			return stateNames.includes("Todo") ? [issue] : [];
		},
		async updateIssueState() {},
	};
	const workspaceManager = {
		async cleanup() {},
		async createOrReuse() {
			return { branchName: "symphony/ENG-500", path: tempDir };
		},
		async runPostFailure() {},
		async runPostSuccess() {},
		async runPreStart() {},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => ({
			async initialize() {},
			async runTurn() {
				throw new Error("boom");
			},
			async startThread() {
				this.threadId = "thread-fail";
			},
			stop() {},
		}),
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

	assert.equal(snapshot.issues[0].status, "failed");
	const eventTypes = readEvents(tempDir).map((event) => event.type);
	assert.ok(eventTypes.includes("run_failed"));
	assert.ok(eventTypes.includes("retry_scheduled"));
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

	assert.deepEqual(searches, [["Todo"], ["Merging"], ["Canceled"]]);
	assert.deepEqual(events, [["cleanup", "ENG-123"]]);
	assert.equal(snapshot.issues[0].status, "cleaned");
	assert.ok(readEvents(tempDir).some((event) => event.type === "cleanup_succeeded" && event.issueIdentifier === "ENG-123"));
});

test("SymphonyOrchestrator lands Merging issues and comments with PR status", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-landing-test-"));
	const issue = {
		description: "",
		id: "issue-id",
		identifier: "ENG-123",
		stateName: "Merging",
		title: "Completed feature",
	};
	const events = [];
	const linearClient = {
		async createComment(issueId, body) {
			events.push(["comment", issueId, body]);
		},
		async searchIssues({ stateNames }) {
			return stateNames.includes("Merging") ? [issue] : [];
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
		orchestrator.getRecord(issue).validation = { commands: [{ command: "pnpm run lint", ok: true }], ok: true };

		const snapshot = await orchestrator.pollOnce();

	assert.deepEqual(events[0], ["land", "ENG-123"]);
	assert.equal(events[1][0], "comment");
	assert.match(events[1][2], /Symphony landed ENG-123/);
	assert.match(events[1][2], /PR: https:\/\/github.test\/pull\/12/);
	assert.match(events[1][2], /Branch cleanup: deleted local branch; deleted remote branch\./);
	assert.deepEqual(events[2], ["state", "Done"]);
	assert.equal(snapshot.issues[0].status, "landed");
	assert.equal(snapshot.issues[0].prUrl, "https://github.test/pull/12");
	const eventTypes = readEvents(tempDir).map((event) => event.type);
	assert.ok(eventTypes.includes("pr_created"));
	assert.ok(eventTypes.includes("pr_merged"));
		assert.ok(readEvents(tempDir).some((event) => event.type === "landing_succeeded" && event.prUrl === "https://github.test/pull/12"));
	});

test("SymphonyOrchestrator moves blocked Merging issues back to Human Review", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-orchestrator-merge-block-test-"));
	const issue = {
		description: "",
		id: "issue-id",
		identifier: "ENG-124",
		stateName: "Merging",
		title: "Blocked feature",
	};
	const events = [];
	const linearClient = {
		async createComment(issueId, body) {
			events.push(["comment", issueId, body]);
		},
		async searchIssues({ stateNames }) {
			return stateNames.includes("Merging") ? [issue] : [];
		},
		async updateIssueState(_issueId, stateName) {
			events.push(["state", stateName]);
		},
		async upsertWorkpadComment(issueId, body) {
			events.push(["workpad", issueId, body]);
			return { body, id: "workpad-1" };
		},
	};
	const workspaceManager = {
		async cleanup() {},
		async landIssue() {
			throw new Error("GitHub review decision is CHANGES_REQUESTED.");
		},
	};
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => {
			throw new Error("Merging issues should not start agents");
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
	orchestrator.getRecord(issue).validation = { commands: [{ command: "pnpm run lint", ok: true }], ok: true };

	const snapshot = await orchestrator.pollOnce();

	assert.ok(events.some((event) => event[0] === "comment" && /could not land ENG-124/.test(event[2])));
	assert.ok(events.some((event) => event[0] === "workpad" && /CHANGES_REQUESTED/.test(event[2])));
	assert.ok(events.some((event) => event[0] === "state" && event[1] === "Human Review"));
	assert.equal(snapshot.issues[0].status, "blocked");
	assert.equal(snapshot.issues[0].retryAfterMs, null);
	assert.ok(readEvents(tempDir).some((event) => event.type === "merge_blocked" && /CHANGES_REQUESTED/.test(event.error)));
});

test("status server includes durable event history after restart", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-status-test-"));
	const eventLog = new SymphonyEventLog({
		clock: () => Date.parse("2026-04-29T00:00:00.000Z"),
		root: tempDir,
	});
	eventLog.append({
		branchName: "symphony/ENG-9",
		issueIdentifier: "ENG-9",
		prUrl: "https://github.test/pull/9",
		status: "landed",
		type: "landing_succeeded",
		workspacePath: path.join(tempDir, "ENG-9"),
	});
	const orchestrator = new SymphonyOrchestrator({
		agentFactory: () => {
			throw new Error("status test should not dispatch");
		},
		config: baseConfig(tempDir),
		eventLog,
		linearClient: {
			async createComment() {},
			async searchIssues() {
				return [];
			},
			async updateIssueState() {},
		},
		stateFile: path.join(tempDir, "state.json"),
		workflowRuntime: {
			current: { body: "", config: {} },
			reloadIfChanged() {
				return false;
			},
		},
		workspaceManager: {},
	});
	const server = createStatusServer(orchestrator);
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	try {
		const response = await requestJson(server, "/status");
		assert.equal(response.statusCode, 200);
		assert.equal(response.body.counts.landed, 1);
		assert.equal(response.body.groups.landed[0].identifier, "ENG-9");
		assert.equal(response.body.groups.landed[0].prUrl, "https://github.test/pull/9");
		assert.equal(response.body.recentEvents[0].type, "landing_succeeded");
	} finally {
		await new Promise((resolve) => server.close(resolve));
	}
});
