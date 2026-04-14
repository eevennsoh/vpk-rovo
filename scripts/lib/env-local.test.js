const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { ensureEnvLocalExists } = require("./env-local");

function createTempDir(prefix) {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test("ensureEnvLocalExists copies .env.local from the main worktree before the example", () => {
	const tempRoot = createTempDir("env-local-main-priority-");
	const mainWorktreePath = path.join(tempRoot, "main");
	const linkedWorktreePath = path.join(tempRoot, "feature");

	try {
		fs.mkdirSync(mainWorktreePath, { recursive: true });
		fs.mkdirSync(linkedWorktreePath, { recursive: true });
		fs.writeFileSync(path.join(mainWorktreePath, ".env.local"), "SOURCE=main\n", "utf8");
		fs.writeFileSync(path.join(linkedWorktreePath, ".env.local.example"), "SOURCE=example\n", "utf8");

		const result = ensureEnvLocalExists({
			cwd: linkedWorktreePath,
			mainWorktreePath,
		});

		assert.equal(result.createdFrom, "main-worktree");
		assert.equal(
			fs.readFileSync(path.join(linkedWorktreePath, ".env.local"), "utf8"),
			"SOURCE=main\n"
		);
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});

test("ensureEnvLocalExists falls back to .env.local.example when the main worktree file is unavailable", () => {
	const tempRoot = createTempDir("env-local-example-fallback-");
	const mainWorktreePath = path.join(tempRoot, "main");
	const linkedWorktreePath = path.join(tempRoot, "feature");

	try {
		fs.mkdirSync(mainWorktreePath, { recursive: true });
		fs.mkdirSync(linkedWorktreePath, { recursive: true });
		fs.writeFileSync(path.join(linkedWorktreePath, ".env.local.example"), "SOURCE=example\n", "utf8");

		const result = ensureEnvLocalExists({
			cwd: linkedWorktreePath,
			mainWorktreePath,
		});

		assert.equal(result.createdFrom, "example");
		assert.equal(
			fs.readFileSync(path.join(linkedWorktreePath, ".env.local"), "utf8"),
			"SOURCE=example\n"
		);
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});

test("ensureEnvLocalExists leaves an existing .env.local unchanged", () => {
	const tempRoot = createTempDir("env-local-existing-");
	const mainWorktreePath = path.join(tempRoot, "main");
	const linkedWorktreePath = path.join(tempRoot, "feature");

	try {
		fs.mkdirSync(mainWorktreePath, { recursive: true });
		fs.mkdirSync(linkedWorktreePath, { recursive: true });
		fs.writeFileSync(path.join(mainWorktreePath, ".env.local"), "SOURCE=main\n", "utf8");
		fs.writeFileSync(path.join(linkedWorktreePath, ".env.local"), "SOURCE=existing\n", "utf8");
		fs.writeFileSync(path.join(linkedWorktreePath, ".env.local.example"), "SOURCE=example\n", "utf8");

		const result = ensureEnvLocalExists({
			cwd: linkedWorktreePath,
			mainWorktreePath,
		});

		assert.equal(result.createdFrom, null);
		assert.equal(
			fs.readFileSync(path.join(linkedWorktreePath, ".env.local"), "utf8"),
			"SOURCE=existing\n"
		);
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});
