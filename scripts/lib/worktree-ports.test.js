const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
	getGitWorktrees,
	inferWorktreeKind,
	getPortInfoForPath,
} = require("./worktree-ports");

test("inferWorktreeKind treats a worktree with .git directory as main", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-ports-main-"));
	try {
		fs.mkdirSync(path.join(tempDir, ".git"));

		assert.equal(inferWorktreeKind(tempDir), "main");
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("inferWorktreeKind treats a worktree with .git file pointing into .git/worktrees as linked", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "worktree-ports-linked-"));
	try {
		fs.writeFileSync(
			path.join(tempDir, ".git"),
			"gitdir: /tmp/example/.git/worktrees/plan-mode\n",
			"utf8"
		);

		assert.equal(inferWorktreeKind(tempDir), "linked");
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("getPortInfoForPath resolves linked worktree slots from git metadata", () => {
	const repoRoot = path.resolve(__dirname, "..", "..");
	const mainPath = path.resolve(repoRoot, "..", "VPK-rovodev");
	const linkedPath = repoRoot;
	const linkedWorktree = getGitWorktrees().find((worktree) => worktree.path === linkedPath);

	const mainInfo = getPortInfoForPath(mainPath);
	const linkedInfo = getPortInfoForPath(linkedPath);

	assert.ok(linkedWorktree);
	assert.equal(mainInfo.slot, 0);
	assert.equal(mainInfo.rovodevBase, 8000);
	assert.equal(linkedInfo.worktreeName, linkedWorktree.identifier);
	assert.ok(linkedInfo.slot > 0);
	assert.equal(linkedInfo.offset, linkedInfo.slot * 20);
	assert.equal(linkedInfo.frontendBase, 3000 + linkedInfo.offset);
	assert.equal(linkedInfo.backendBase, 8080 + linkedInfo.offset);
	assert.equal(linkedInfo.rovodevBase, 8000 + linkedInfo.offset);
});
