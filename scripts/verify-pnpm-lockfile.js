#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const BLOCKED_REGISTRY_PATTERNS = [
	{
		explanation:
			"Use npm-remote tarball URLs instead; atlassian-npm lockfile URLs have broken CI installs.",
		pattern: /packages\.atlassian\.com\/api\/npm\/atlassian-npm\//u,
	},
];

function findBlockedLockfileRegistryUrls(lockfileText) {
	const findings = [];
	const lines = lockfileText.split(/\r?\n/u);

	lines.forEach((line, index) => {
		for (const registryPattern of BLOCKED_REGISTRY_PATTERNS) {
			if (registryPattern.pattern.test(line)) {
				findings.push({
					explanation: registryPattern.explanation,
					line: index + 1,
					text: line.trim(),
				});
			}
		}
	});

	return findings;
}

function main() {
	const lockfilePath = path.resolve(process.argv[2] ?? "pnpm-lock.yaml");
	const lockfileText = fs.readFileSync(lockfilePath, "utf8");
	const findings = findBlockedLockfileRegistryUrls(lockfileText);

	if (findings.length === 0) {
		console.log(`Verified ${path.relative(process.cwd(), lockfilePath) || lockfilePath}`);
		return;
	}

	console.error(`${path.relative(process.cwd(), lockfilePath) || lockfilePath} contains blocked registry URLs:`);
	for (const finding of findings) {
		console.error(`- line ${finding.line}: ${finding.text}`);
		console.error(`  ${finding.explanation}`);
	}
	process.exitCode = 1;
}

if (require.main === module) {
	main();
}

module.exports = {
	findBlockedLockfileRegistryUrls,
};
