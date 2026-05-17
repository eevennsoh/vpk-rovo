const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const SHOW_WORKTREE_PORTS_SCRIPT = path.resolve(__dirname, "show-worktree-ports.js");

function execGit(args, cwd) {
	execFileSync("git", args, {
		cwd,
		stdio: "ignore",
	});
}

function createGitWorktreeFixture() {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "show-worktree-ports-"));
	const repoPath = path.join(tempDir, "repo");
	const worktreePath = path.join(tempDir, "wt-pool");

	try {
		execGit(["init", repoPath], tempDir);
		execGit(["config", "user.email", "test@example.com"], repoPath);
		execGit(["config", "user.name", "test"], repoPath);

		fs.writeFileSync(path.join(repoPath, "README.md"), "fixture\n", "utf8");
		execGit(["add", "README.md"], repoPath);
		execGit(["commit", "-m", "init"], repoPath);
		execGit(["branch", "feature-pool"], repoPath);
		execGit(["worktree", "add", worktreePath, "feature-pool"], repoPath);

		return {
			repoPath,
			worktreePath,
			cleanup() {
				fs.rmSync(tempDir, { recursive: true, force: true });
			},
		};
	} catch (error) {
		fs.rmSync(tempDir, { recursive: true, force: true });
		throw error;
	}
}

test("ports CLI treats the recorded RovoDev pool file as an active port contract", () => {
	const fixture = createGitWorktreeFixture();

	try {
		fs.writeFileSync(
			path.join(fixture.worktreePath, ".dev-rovodev-ports"),
			JSON.stringify([8020, 8021]),
			"utf8",
		);

		const output = execFileSync(process.execPath, [SHOW_WORKTREE_PORTS_SCRIPT], {
			cwd: fixture.repoPath,
			encoding: "utf8",
		});

		assert.match(output, /feature-pool/);
		assert.match(output, /rovodev=8020, 8021/);
	} finally {
		fixture.cleanup();
	}
});
