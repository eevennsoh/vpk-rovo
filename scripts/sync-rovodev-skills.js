#!/usr/bin/env node

const path = require("node:path");

const { syncRovodevSkillsOverlay } = require("../backend/lib/rovodev-skills-overlay");

async function main() {
	const repoRoot = path.resolve(__dirname, "..");
	const result = await syncRovodevSkillsOverlay({
		hermesSkillsDir: path.join(repoRoot, ".agents", "vendor", "hermes-agent", "skills"),
		targetSkillsDir: path.join(repoRoot, ".rovodev", "skills"),
	});

	console.log(
		[
			`Synced .rovodev/skills overlay at ${result.targetSkillsDir}`,
			`Hermes skill roots: ${result.hermesCount}`,
			`Total entries: ${result.totalCount}`,
		].join("\n"),
	);
}

main().catch((error) => {
	console.error(`Failed to sync .rovodev/skills: ${error.message}`);
	process.exitCode = 1;
});
