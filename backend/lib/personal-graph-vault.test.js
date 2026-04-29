"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { listRaw } = require("./personal-graph-vault");

function createFixtureVault() {
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-vault-"));
	fs.mkdirSync(path.join(vaultRoot, "raw", "assets", "nested"), { recursive: true });
	fs.mkdirSync(path.join(vaultRoot, "wiki"), { recursive: true });
	fs.writeFileSync(path.join(vaultRoot, "raw", "source.md"), "source", "utf8");
	fs.writeFileSync(path.join(vaultRoot, "raw", "assets", "ignored.md"), "asset", "utf8");
	fs.writeFileSync(path.join(vaultRoot, "raw", "assets", "nested", "ignored.txt"), "asset", "utf8");
	return vaultRoot;
}

function toPosixPath(value) {
	return value.split(path.sep).join("/");
}

test("listRaw skips the raw/assets subtree before traversal", (t) => {
	const originalVault = process.env.PERSONAL_GRAPH_VAULT;
	const originalReaddirSync = fs.readdirSync;
	const vaultRoot = createFixtureVault();

	process.env.PERSONAL_GRAPH_VAULT = vaultRoot;
	fs.readdirSync = function patchedReaddirSync(targetPath, options) {
		const relativePath = toPosixPath(path.relative(vaultRoot, targetPath));
		if (relativePath === "raw/assets" || relativePath.startsWith("raw/assets/")) {
			throw new Error(`raw/assets should not be traversed: ${relativePath}`);
		}

		return originalReaddirSync.call(this, targetPath, options);
	};

	t.after(() => {
		if (originalVault === undefined) {
			delete process.env.PERSONAL_GRAPH_VAULT;
		} else {
			process.env.PERSONAL_GRAPH_VAULT = originalVault;
		}
		fs.readdirSync = originalReaddirSync;
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	assert.deepEqual(
		listRaw().map((entry) => entry.relativePath),
		["raw/source.md"],
	);
});
