const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const WORKTREE_CREATE_HOOK = path.join(__dirname, "worktree-create.sh");

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		encoding: "utf8",
		...options,
	});

	assert.equal(
		result.status,
		0,
		[
			`${command} ${args.join(" ")} failed with status ${result.status}`,
			result.stdout,
			result.stderr,
		].join("\n"),
	);

	return result;
}

function createTempGitRepo(t) {
	const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-create-hook-"));
	const repoRoot = path.join(tempRoot, "repo");
	fs.mkdirSync(repoRoot);

	t.after(() => {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	});

	run("git", ["init"], { cwd: repoRoot });
	fs.writeFileSync(path.join(repoRoot, "README.md"), "# hook fixture\n");
	run("git", ["add", "README.md"], { cwd: repoRoot });
	run("git", ["commit", "-m", "Initial commit"], {
		cwd: repoRoot,
		env: {
			...process.env,
			GIT_AUTHOR_EMAIL: "test@example.com",
			GIT_AUTHOR_NAME: "Test User",
			GIT_COMMITTER_EMAIL: "test@example.com",
			GIT_COMMITTER_NAME: "Test User",
		},
	});

	return { repoRoot, tempRoot };
}

function createPnpmStub(tempRoot, exitCode = 0) {
	const binDir = path.join(tempRoot, "bin");
	const recordPath = path.join(tempRoot, "pnpm-args.log");
	const pnpmPath = path.join(binDir, "pnpm");
	fs.mkdirSync(binDir, { recursive: true });
	fs.writeFileSync(
		pnpmPath,
		[
			"#!/usr/bin/env bash",
			"printf '%s\\n' \"$*\" >> \"$PNPM_RECORD\"",
			`exit ${exitCode}`,
			"",
		].join("\n"),
	);
	fs.chmodSync(pnpmPath, 0o755);

	return { binDir, recordPath };
}

function runWorktreeCreateHook(repoRoot, payload, env = {}) {
	return spawnSync("bash", [WORKTREE_CREATE_HOOK], {
		cwd: repoRoot,
		encoding: "utf8",
		input: JSON.stringify(payload),
		env: {
			...process.env,
			...env,
		},
	});
}

test("WorktreeCreate creates the requested worktree while keeping stdout path-only", (t) => {
	const { repoRoot, tempRoot } = createTempGitRepo(t);
	const { binDir, recordPath } = createPnpmStub(tempRoot);
	const worktreeDir = path.join(tempRoot, "agent-worktree");
	fs.writeFileSync(path.join(repoRoot, ".env.local"), "ROVO_SESSION_TOKEN=test-token\n");

	const result = runWorktreeCreateHook(
		repoRoot,
		{
			name: "agent-worktree",
			base_ref: "HEAD",
			worktree_ref: "claude/agent-worktree",
			worktree_path: worktreeDir,
		},
		{
			PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
			PNPM_RECORD: recordPath,
		},
	);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout, `${worktreeDir}\n`);
	assert.match(result.stderr, /running pnpm install --prefer-offline/u);
	assert.equal(
		fs.readFileSync(path.join(worktreeDir, ".env.local"), "utf8"),
		"ROVO_SESSION_TOKEN=test-token\n",
	);
	assert.equal(fs.readFileSync(recordPath, "utf8"), "install --prefer-offline\n");

	const branch = run("git", ["branch", "--show-current"], { cwd: worktreeDir });
	assert.equal(branch.stdout.trim(), "claude/agent-worktree");
});

test("WorktreeCreate still accepts the worktree when dependency installation fails", (t) => {
	const { repoRoot, tempRoot } = createTempGitRepo(t);
	const { binDir, recordPath } = createPnpmStub(tempRoot, 23);
	const worktreeDir = path.join(tempRoot, "install-fails-worktree");

	const result = runWorktreeCreateHook(
		repoRoot,
		{
			name: "install-fails-worktree",
			base_ref: "HEAD",
			worktree_path: worktreeDir,
		},
		{
			PATH: `${binDir}${path.delimiter}${process.env.PATH}`,
			PNPM_RECORD: recordPath,
		},
	);

	assert.equal(result.status, 0, result.stderr);
	assert.equal(result.stdout, `${worktreeDir}\n`);
	assert.match(result.stderr, /pnpm install failed/u);
	assert.equal(fs.readFileSync(recordPath, "utf8"), "install --prefer-offline\n");
	assert.ok(fs.existsSync(path.join(worktreeDir, "README.md")));
});
