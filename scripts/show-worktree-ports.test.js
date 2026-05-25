const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
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

function listenOnEphemeralPort() {
	return new Promise((resolve, reject) => {
		const server = net.createServer();
		server.unref();
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const address = server.address();
			if (!address || typeof address === "string") {
				server.close();
				reject(new Error("Failed to bind ephemeral port"));
				return;
			}
			resolve({ server, port: address.port });
		});
	});
}

function closeServer(server) {
	return new Promise((resolve) => {
		server.close(() => resolve());
	});
}

test("ports CLI shows pool ports that are actually listening", async () => {
	const fixture = createGitWorktreeFixture();
	const { server: alive, port: alivePort } = await listenOnEphemeralPort();

	try {
		fs.writeFileSync(
			path.join(fixture.worktreePath, ".dev-rovo-ports"),
			JSON.stringify([alivePort]),
			"utf8",
		);

		const output = execFileSync(process.execPath, [SHOW_WORKTREE_PORTS_SCRIPT], {
			cwd: fixture.repoPath,
			encoding: "utf8",
		});

		assert.match(output, /feature-pool/);
		assert.match(output, new RegExp(`rovo=${alivePort}\\b`));
	} finally {
		await closeServer(alive);
		fixture.cleanup();
	}
});

test("ports CLI shows (no active ports) when port files are stale tombstones", async () => {
	const fixture = createGitWorktreeFixture();

	try {
		// Tombstones for ports nothing is listening on. Use values in the unlikely-to-be-bound
		// reserved/private range so the test stays deterministic on dev machines.
		fs.writeFileSync(path.join(fixture.worktreePath, ".dev-frontend-port"), "1", "utf8");
		fs.writeFileSync(path.join(fixture.worktreePath, ".dev-backend-port"), "2", "utf8");
		fs.writeFileSync(
			path.join(fixture.worktreePath, ".dev-rovo-ports"),
			JSON.stringify([3, 4]),
			"utf8",
		);

		const output = execFileSync(process.execPath, [SHOW_WORKTREE_PORTS_SCRIPT], {
			cwd: fixture.repoPath,
			encoding: "utf8",
		});

		assert.match(output, /feature-pool/, "worktree row should still appear");
		assert.match(output, /\(no active ports\)/, "should fall back to the no-ports label");
		assert.doesNotMatch(output, /frontend=1\b/, "stale frontend port must not appear");
		assert.doesNotMatch(output, /backend=2\b/, "stale backend port must not appear");
		assert.doesNotMatch(output, /rovo=3\b/, "stale rovo pool ports must not appear");
	} finally {
		fixture.cleanup();
	}
});

test("ports CLI shows a mix of alive and dead pool ports as only the alive ones", async () => {
	const fixture = createGitWorktreeFixture();
	const { server: alive, port: alivePort } = await listenOnEphemeralPort();
	// Pick a dead port that's deterministically unbound for the test's lifetime by
	// binding then immediately closing.
	const { server: deadHolder, port: deadPort } = await listenOnEphemeralPort();
	await closeServer(deadHolder);

	try {
		fs.writeFileSync(
			path.join(fixture.worktreePath, ".dev-rovo-ports"),
			JSON.stringify([alivePort, deadPort]),
			"utf8",
		);

		const output = execFileSync(process.execPath, [SHOW_WORKTREE_PORTS_SCRIPT], {
			cwd: fixture.repoPath,
			encoding: "utf8",
		});

		assert.match(output, new RegExp(`rovo=${alivePort}\\b`));
		assert.doesNotMatch(output, new RegExp(`\\b${deadPort}\\b`));
	} finally {
		await closeServer(alive);
		fixture.cleanup();
	}
});
