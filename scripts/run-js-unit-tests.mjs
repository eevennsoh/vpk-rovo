import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const EXCLUDED_TEST_FILES = new Set([
	// Stale source-extraction coverage for functions no longer in backend/server.js.
	"backend/lib/deferred-clarification-replay.test.js",
]);
const INCLUDED_TEST_PREFIXES = [
	"app/",
	"backend/",
	"lib/",
	"rovo/",
	"scripts/",
];

const gitResult = spawnSync("git", [
	"ls-files",
	"--cached",
	"--others",
	"--exclude-standard",
	"*.test.js",
], {
	encoding: "utf8",
	stdio: ["ignore", "pipe", "inherit"],
});

if (gitResult.status !== 0) {
	process.exit(gitResult.status ?? 1);
}

const testFiles = gitResult.stdout
	.split("\n")
	.map((filePath) => filePath.trim())
	.filter((filePath) => {
		if (!filePath || EXCLUDED_TEST_FILES.has(filePath)) {
			return false;
		}
		if (!INCLUDED_TEST_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
			return false;
		}

		const source = readFileSync(filePath, "utf8");
		return source.includes("node:test");
	});

if (testFiles.length === 0) {
	process.exit(0);
}

for (const testFile of testFiles) {
	const source = readFileSync(testFile, "utf8");
	const nodeArgs = source.includes("vm.SyntheticModule") || source.includes("vm.SourceTextModule")
		? ["--experimental-vm-modules"]
		: [];
	const result = spawnSync(process.execPath, [...nodeArgs, "--test", testFile], {
		stdio: "inherit",
	});

	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}

	if (result.signal) {
		process.kill(process.pid, result.signal);
	}
}
