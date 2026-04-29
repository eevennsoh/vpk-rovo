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

test("WorkspaceManager lands dirty Done work through PR merge and local main sync", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-workspace-land-test-"));
	const workspacePath = path.join(tempDir, "worktrees", "ENG-10-add-graph");
	fs.mkdirSync(workspacePath, { recursive: true });
	const calls = [];
	let workspaceStatusCalls = 0;
	let revListCalls = 0;
	const manager = new WorkspaceManager({
		baseRef: "main",
		branchPrefix: "symphony/",
		execFile: async (command, args, options) => {
			calls.push({ args, command, cwd: options.cwd });
			if (command === "git" && args[0] === "rev-parse") {
				return { stderr: "", stdout: "main\n" };
			}
			if (command === "git" && args[0] === "status" && options.cwd === tempDir) {
				return { stderr: "", stdout: "" };
			}
			if (command === "git" && args[0] === "status" && options.cwd === workspacePath) {
				workspaceStatusCalls += 1;
				return { stderr: "", stdout: workspaceStatusCalls === 1 ? " M app/page.tsx\n?? app/new.tsx\n" : "" };
			}
			if (command === "git" && args[0] === "rev-list" && args.includes("--left-right")) {
				return { stderr: "", stdout: "0\t0\n" };
			}
			if (command === "git" && args[0] === "rev-list") {
				revListCalls += 1;
				return { stderr: "", stdout: revListCalls === 1 ? "0\n" : "1\n" };
			}
			if (command === "gh" && args[0] === "pr" && args[1] === "list" && !calls.some((call) => call.command === "gh" && call.args[1] === "create")) {
				return { stderr: "", stdout: "[]" };
			}
			if (command === "gh" && args[0] === "pr" && args[1] === "create") {
				return { stderr: "", stdout: "https://github.test/pull/10\n" };
			}
			if (command === "gh" && args[0] === "pr" && args[1] === "list") {
				return {
					stderr: "",
					stdout: JSON.stringify([{ number: 10, title: "ENG-10: Add graph", url: "https://github.test/pull/10" }]),
				};
			}
			return { stderr: "", stdout: "" };
		},
		hooks: { timeoutMs: 1000 },
		repo: tempDir,
		root: path.join(tempDir, "worktrees"),
		runHook: async () => ({ skipped: true }),
	});

	const result = await manager.landIssue({
		id: "issue-id",
		identifier: "ENG-10",
		title: "Add graph",
		url: "https://linear.test/ENG-10",
	});

	assert.equal(result.status, "merged");
	assert.equal(result.commitCreated, true);
	assert.equal(result.prNumber, 10);
	assert.equal(result.prUrl, "https://github.test/pull/10");
	assert.ok(calls.some((call) => call.command === "git" && call.args.join(" ") === "add --all" && call.cwd === workspacePath));
	assert.ok(calls.some((call) => call.command === "git" && call.args[0] === "commit" && call.args.at(-1) === "ENG-10: Add graph"));
	assert.ok(calls.some((call) => call.command === "git" && call.args.join(" ") === "push -u origin symphony/ENG-10-add-graph"));
	assert.ok(calls.some((call) => call.command === "gh" && call.args.join(" ").startsWith("pr create --base main --head symphony/ENG-10-add-graph")));
	assert.ok(calls.some((call) => call.command === "gh" && call.args.join(" ") === "pr merge 10 --merge"));
	assert.ok(calls.some((call) => call.command === "git" && call.args.join(" ") === "pull --ff-only origin main" && call.cwd === tempDir));
	assert.ok(calls.some((call) => call.command === "git" && call.args[0] === "worktree" && call.args[1] === "remove" && call.args[2] === workspacePath && call.args.includes("--force")));
});

test("WorkspaceManager blocks landing when the base checkout is dirty", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-workspace-land-block-test-"));
	const workspacePath = path.join(tempDir, "worktrees", "ENG-11-dirty-base");
	fs.mkdirSync(workspacePath, { recursive: true });
	const calls = [];
	const manager = new WorkspaceManager({
		baseRef: "main",
		branchPrefix: "symphony/",
		execFile: async (command, args, options) => {
			calls.push({ args, command, cwd: options.cwd });
			if (command === "git" && args[0] === "rev-parse") {
				return { stderr: "", stdout: "main\n" };
			}
			if (command === "git" && args[0] === "status" && options.cwd === tempDir) {
				return { stderr: "", stdout: " M WORKFLOW.md\n" };
			}
			return { stderr: "", stdout: "" };
		},
		hooks: { timeoutMs: 1000 },
		repo: tempDir,
		root: path.join(tempDir, "worktrees"),
		runHook: async () => ({ skipped: true }),
	});

	await assert.rejects(
		() => manager.landIssue({ id: "issue-id", identifier: "ENG-11", slug: "ENG-11-dirty-base", title: "Dirty base" }),
		/Cannot land Symphony work while .* has uncommitted changes/,
	);
	assert.equal(calls.some((call) => call.command === "gh"), false);
	assert.equal(calls.some((call) => call.command === "git" && call.args[0] === "commit"), false);
});

test("WorkspaceManager blocks landing when the base checkout has unpushed commits", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-workspace-land-ahead-test-"));
	const workspacePath = path.join(tempDir, "worktrees", "ENG-12-ahead-base");
	fs.mkdirSync(workspacePath, { recursive: true });
	const calls = [];
	const manager = new WorkspaceManager({
		baseRef: "main",
		branchPrefix: "symphony/",
		execFile: async (command, args, options) => {
			calls.push({ args, command, cwd: options.cwd });
			if (command === "git" && args[0] === "rev-parse") {
				return { stderr: "", stdout: "main\n" };
			}
			if (command === "git" && args[0] === "status" && options.cwd === tempDir) {
				return { stderr: "", stdout: "" };
			}
			if (command === "git" && args[0] === "rev-list" && args.includes("--left-right")) {
				return { stderr: "", stdout: "1\t0\n" };
			}
			return { stderr: "", stdout: "" };
		},
		hooks: { timeoutMs: 1000 },
		repo: tempDir,
		root: path.join(tempDir, "worktrees"),
		runHook: async () => ({ skipped: true }),
	});

	await assert.rejects(
		() => manager.landIssue({ id: "issue-id", identifier: "ENG-12", slug: "ENG-12-ahead-base", title: "Ahead base" }),
		/Cannot land Symphony work while main has unpushed commits/,
	);
	assert.equal(calls.some((call) => call.command === "gh"), false);
	assert.equal(calls.some((call) => call.command === "git" && call.args[0] === "commit"), false);
});
