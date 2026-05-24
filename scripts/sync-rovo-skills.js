#!/usr/bin/env node

const path = require("node:path");

const { ensureRovoSkillsSymlink } = require("../backend/lib/rovo-skills-overlay");

async function main() {
	const repoRoot = path.resolve(__dirname, "..");
	const result = await ensureRovoSkillsSymlink({ repoRoot });

	console.log(
		[
			"Ensured .rovo/skills symlink.",
			`Target: ${result.targetSkillsDir}`,
			`Link: ${result.linkTarget}`,
			`Shared skills: ${result.sharedSkillsDir}`,
		].join("\n"),
	);
}

main().catch((error) => {
	console.error(`Failed to ensure .rovo/skills symlink: ${error.message}`);
	process.exitCode = 1;
});
