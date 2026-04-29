"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { WorkspaceManager, buildIssueSlug, issueEnv, sanitizePathSegment, slugifyTitle } = require("./workspace-manager");

test("sanitizePathSegment removes unsafe path characters", () => {
	assert.equal(sanitizePathSegment("../ENG-123 bad/value"), "ENG-123-bad-value");
	assert.throws(() => sanitizePathSegment("///"), /Cannot build workspace path/);
});

test("slugifyTitle lowercases, hyphenates, and caps at 50 chars", () => {
	assert.equal(slugifyTitle("Hello World!!!"), "hello-world");
	assert.equal(slugifyTitle("  Mixed-CASE  Title  "), "mixed-case-title");
	assert.equal(slugifyTitle(""), "");
	assert.equal(slugifyTitle("!!!"), "");
	assert.equal(slugifyTitle("a".repeat(80)).length, 50);
	// truncated tail should not end in a hyphen
	assert.match(slugifyTitle("word ".repeat(40)), /^[a-z0-9-]+$/);
	assert.equal(slugifyTitle("word ".repeat(40)).endsWith("-"), false);
});

test("buildIssueSlug prefers explicit cached slug, then identifier-title, then identifier alone", () => {
	assert.equal(buildIssueSlug({ identifier: "ENG-1", title: "New routing", slug: "ENG-1-pinned" }), "ENG-1-pinned");
	assert.equal(buildIssueSlug({ identifier: "ENG-1", title: "New routing" }), "ENG-1-new-routing");
	assert.equal(buildIssueSlug({ identifier: "ENG-1", title: "" }), "ENG-1");
	assert.equal(buildIssueSlug({ identifier: "ENG-1", title: "!!!" }), "ENG-1");
});

test("WorkspaceManager creates worktree path that includes the title slug", async () => {
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

	assert.equal(workspace.path, path.join(tempDir, "worktrees", "ENG-123-fix-it"));
	assert.equal(workspace.branchName, "symphony/ENG-123-fix-it");
	assert.equal(calls[0].command, "git");
	assert.deepEqual(calls[0].args.slice(0, 3), ["worktree", "add", "-B"]);
});

test("WorkspaceManager honors a pre-pinned slug on the issue (cached across renames)", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-workspace-test-"));
	const manager = new WorkspaceManager({
		baseRef: "main",
		branchPrefix: "symphony/",
		execFile: async (_command, args) => {
			fs.mkdirSync(args[4], { recursive: true });
			return { stderr: "", stdout: "" };
		},
		hooks: { timeoutMs: 1000 },
		repo: tempDir,
		root: path.join(tempDir, "worktrees"),
		runHook: async () => ({ skipped: true }),
	});

	// Issue title changed in Linear, but the orchestrator already pinned the slug.
	const issue = { id: "issue-id", identifier: "ENG-7", title: "Brand new title", slug: "ENG-7-original-title" };
	const workspace = await manager.createOrReuse(issue);

	assert.equal(workspace.path, path.join(tempDir, "worktrees", "ENG-7-original-title"));
	assert.equal(workspace.branchName, "symphony/ENG-7-original-title");
});

test("WorkspaceManager falls back to identifier when title is missing or unsluggable", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-workspace-test-"));
	const manager = new WorkspaceManager({
		baseRef: "main",
		branchPrefix: "symphony/",
		execFile: async (_command, args) => {
			fs.mkdirSync(args[4], { recursive: true });
			return { stderr: "", stdout: "" };
		},
		hooks: { timeoutMs: 1000 },
		repo: tempDir,
		root: path.join(tempDir, "worktrees"),
		runHook: async () => ({ skipped: true }),
	});

	const issue = { id: "issue-id", identifier: "ENG-4", title: "!!!" };
	const workspace = await manager.createOrReuse(issue);

	assert.equal(workspace.path, path.join(tempDir, "worktrees", "ENG-4"));
	assert.equal(workspace.branchName, "symphony/ENG-4");
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
