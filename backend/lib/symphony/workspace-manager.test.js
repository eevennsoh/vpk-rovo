"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { WorkspaceManager, issueEnv, sanitizePathSegment } = require("./workspace-manager");

test("sanitizePathSegment removes unsafe path characters", () => {
	assert.equal(sanitizePathSegment("../ENG-123 bad/value"), "ENG-123-bad-value");
	assert.throws(() => sanitizePathSegment("///"), /Cannot build workspace path/);
});

test("WorkspaceManager creates deterministic worktree path and branch", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-workspace-test-"));
	const calls = [];
	const manager = new WorkspaceManager({
		baseRef: "main",
		branchPrefix: "symphony/",
		execFile: async (command, args, options) => {
			calls.push({ args, command, options });
			fs.mkdirSync(args[4], { recursive: true });
			return { stderr: "", stdout: "" };
		},
		hooks: { timeoutMs: 1000 },
		repo: tempDir,
		root: path.join(tempDir, "worktrees"),
		runHook: async () => ({ skipped: true }),
	});

	const issue = { id: "issue-id", identifier: "ENG-123", title: "Fix it" };
	const workspace = await manager.createOrReuse(issue);

	assert.equal(workspace.path, path.join(tempDir, "worktrees", "ENG-123"));
	assert.equal(workspace.branchName, "symphony/ENG-123");
	assert.equal(calls[0].command, "git");
	assert.deepEqual(calls[0].args.slice(0, 3), ["worktree", "add", "-B"]);
});

test("issueEnv exposes stable hook variables", () => {
	assert.deepEqual(issueEnv({ id: "1", identifier: "ENG-1", title: "Title", url: "https://linear.test/ENG-1" }, "/tmp/w"), {
		SYMPHONY_ISSUE_ID: "1",
		SYMPHONY_ISSUE_IDENTIFIER: "ENG-1",
		SYMPHONY_ISSUE_TITLE: "Title",
		SYMPHONY_ISSUE_URL: "https://linear.test/ENG-1",
		SYMPHONY_WORKSPACE: "/tmp/w",
	});
});
