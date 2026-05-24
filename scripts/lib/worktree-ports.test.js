const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync, execSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
	getBackendBasePort,
	getFrontendBasePort,
	inferWorktreeKind,
	getPortInfoForPath,
	getRovoBasePort,
	getWorktreePortOffsetForPath,
} = require("./worktree-ports");

const WORKTREE_PORTS_MODULE_PATH = path.resolve(__dirname, "worktree-ports.js");

function createGitWorktreeFixture() {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-ports-fixture-"));
	const repoPath = path.join(tempDir, "repo");
	const worktreeAPath = path.join(tempDir, "wt-a");
	const worktreeBPath = path.join(tempDir, "wt-b");

	try {
		execSync(`git init ${JSON.stringify(repoPath)}`, { stdio: "ignore" });
		execSync("git config user.email test@example.com", {
			cwd: repoPath,
			stdio: "ignore",
		});
		execSync("git config user.name test", { cwd: repoPath, stdio: "ignore" });

		fs.writeFileSync(path.join(repoPath, "README.md"), "fixture\n", "utf8");
		execSync("git add README.md", { cwd: repoPath, stdio: "ignore" });
		execSync("git commit -m init", { cwd: repoPath, stdio: "ignore" });
		execSync("git branch feature-b", { cwd: repoPath, stdio: "ignore" });
		execSync("git branch feature-a", { cwd: repoPath, stdio: "ignore" });
		execSync(`git worktree add ${JSON.stringify(worktreeBPath)} feature-b`, {
			cwd: repoPath,
			stdio: "ignore",
		});
		execSync(`git worktree add ${JSON.stringify(worktreeAPath)} feature-a`, {
			cwd: repoPath,
			stdio: "ignore",
		});

		return {
			repoPath,
			worktreeAPath,
			worktreeBPath,
			cleanup() {
				fs.rmSync(tempDir, { recursive: true, force: true });
			},
		};
	} catch (error) {
		fs.rmSync(tempDir, { recursive: true, force: true });
		throw error;
	}
}

function runWorktreePortsExpression(cwd, expression) {
	const script = `
		const mod = require(${JSON.stringify(WORKTREE_PORTS_MODULE_PATH)});
		process.stdout.write(JSON.stringify(${expression}));
	`;

	return JSON.parse(
		execFileSync(process.execPath, ["-e", script], {
			cwd,
			encoding: "utf8",
		})
	);
}

test("inferWorktreeKind treats a worktree with .git directory as main", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-ports-main-"));
	try {
		fs.mkdirSync(path.join(tempDir, ".git"));

		assert.equal(inferWorktreeKind(tempDir), "main");
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("inferWorktreeKind falls back to worktree path heuristics when git metadata is unavailable", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-ports-linked-"));
	try {
		const linkedWorktreePath = path.join(tempDir, "codex", "worktrees", "plan-mode");
		fs.mkdirSync(linkedWorktreePath, { recursive: true });

		assert.equal(inferWorktreeKind(linkedWorktreePath), "linked");
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("worktree port helpers keep main first and assign linked worktree slots by identifier", () => {
	const fixture = createGitWorktreeFixture();

	try {
		const resolvedRepoPath = fs.realpathSync(fixture.repoPath);
		const resolvedWorktreeAPath = fs.realpathSync(fixture.worktreeAPath);
		const resolvedWorktreeBPath = fs.realpathSync(fixture.worktreeBPath);
		const allWorktreeInfo = runWorktreePortsExpression(
			fixture.repoPath,
			"mod.getAllWorktreePortInfo()"
		);
		const worktreeAInfo = runWorktreePortsExpression(
			fixture.repoPath,
			`mod.getPortInfoForPath(${JSON.stringify(resolvedWorktreeAPath)})`
		);
		const worktreeBInfo = runWorktreePortsExpression(
			fixture.repoPath,
			`mod.getPortInfoForPath(${JSON.stringify(resolvedWorktreeBPath)})`
		);

		assert.deepEqual(
			allWorktreeInfo.map(({ worktreeName, slot, offset, path, isMain }) => ({
				worktreeName,
				slot,
				offset,
				path,
				isMain,
			})),
			[
				{
					worktreeName: "main",
					slot: 0,
					offset: 0,
					path: resolvedRepoPath,
					isMain: true,
				},
				{
					worktreeName: "feature-a",
					slot: 1,
					offset: 20,
					path: resolvedWorktreeAPath,
					isMain: false,
				},
				{
					worktreeName: "feature-b",
					slot: 2,
					offset: 40,
					path: resolvedWorktreeBPath,
					isMain: false,
				},
			]
		);
		assert.match(allWorktreeInfo[0].identifier, /\S/u);
		assert.equal(allWorktreeInfo[1].identifier, "feature-a");
		assert.equal(allWorktreeInfo[2].identifier, "feature-b");
		assert.deepEqual(worktreeAInfo, {
			worktreeName: "feature-a",
			offset: 20,
			slot: 1,
			frontendBase: 3020,
			backendBase: 8100,
			rovoBase: 8020,
		});
		assert.deepEqual(worktreeBInfo, {
			worktreeName: "feature-b",
			offset: 40,
			slot: 2,
			frontendBase: 3040,
			backendBase: 8120,
			rovoBase: 8040,
		});
	} finally {
		fixture.cleanup();
	}
});

test("getPortInfoForPath falls back to main defaults for unknown paths", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-ports-unknown-"));

	try {
		assert.equal(getWorktreePortOffsetForPath(tempDir), 0);
		assert.deepEqual(getPortInfoForPath(tempDir), {
			worktreeName: "main",
			offset: 0,
			slot: 0,
			frontendBase: 3000,
			backendBase: 8080,
			rovoBase: 8000,
		});
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("base port helpers honor explicit environment overrides", () => {
	const originalPort = process.env.PORT;
	const originalBackendPort = process.env.BACKEND_PORT;
	const originalRovoPort = process.env.ROVO_PORT;

	process.env.PORT = "4100";
	process.env.BACKEND_PORT = "9100";
	process.env.ROVO_PORT = "9200";

	try {
		assert.equal(getFrontendBasePort(), 4100);
		assert.equal(getBackendBasePort(), 9100);
		assert.equal(getRovoBasePort(), 9200);
	} finally {
		if (originalPort === undefined) {
			delete process.env.PORT;
		} else {
			process.env.PORT = originalPort;
		}

		if (originalBackendPort === undefined) {
			delete process.env.BACKEND_PORT;
		} else {
			process.env.BACKEND_PORT = originalBackendPort;
		}

		if (originalRovoPort === undefined) {
			delete process.env.ROVO_PORT;
		} else {
			process.env.ROVO_PORT = originalRovoPort;
		}
	}
});
