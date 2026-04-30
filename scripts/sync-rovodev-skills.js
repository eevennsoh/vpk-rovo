#!/usr/bin/env node

const path = require("node:path");

const { ensureRovodevSkillsSymlink } = require("../backend/lib/rovodev-skills-overlay");

async function main() {
	const repoRoot = path.resolve(__dirname, "..");
	const result = await ensureRovodevSkillsSymlink({ repoRoot });

	console.log(
		[
			"Ensured .rovodev/skills symlink.",
			`Target: ${result.targetSkillsDir}`,
			`Link: ${result.linkTarget}`,
			`Shared skills: ${result.sharedSkillsDir}`,
		].join("\n"),
	);
}

main().catch((error) => {
	console.error(`Failed to ensure .rovodev/skills symlink: ${error.message}`);
	process.exitCode = 1;
});
