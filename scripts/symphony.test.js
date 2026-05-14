const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "scripts/symphony.sh");

function writeExecutable(filePath, lines) {
	fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
	fs.chmodSync(filePath, 0o755);
}

function createFakeBin(tempDir) {
	const binDir = path.join(tempDir, "bin");
	fs.mkdirSync(binDir, { recursive: true });
	writeExecutable(path.join(binDir, "git"), [
		"#!/usr/bin/env bash",
		"echo \"unexpected git invocation: $*\" >&2",
		"exit 1",
	]);
	writeExecutable(path.join(binDir, "mise"), ["#!/usr/bin/env bash", "exit 0"]);
	return binDir;
}

test("symphony wrapper forwards one resolved custom logs root", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-wrapper-test-"));
	const binDir = path.join(tempDir, "bin");
	const upstreamDir = path.join(tempDir, "openai-symphony");
	const elixirDir = path.join(upstreamDir, "elixir");
	const runtimeDir = path.join(tempDir, "runtime");
	const customLogsRoot = path.join(tempDir, "custom-logs");
	const argsLog = path.join(tempDir, "symphony-args.log");
	const gitLog = path.join(tempDir, "git-args.log");

	fs.mkdirSync(path.join(upstreamDir, ".git"), { recursive: true });
	fs.mkdirSync(path.join(elixirDir, "bin"), { recursive: true });
	fs.mkdirSync(binDir, { recursive: true });
	writeExecutable(path.join(elixirDir, "bin", "symphony"), ["#!/usr/bin/env bash", "exit 0"]);
	writeExecutable(path.join(binDir, "git"), [
		"#!/usr/bin/env bash",
		"printf '%s\\n' \"$*\" >> \"$SYMPHONY_FAKE_GIT_LOG\"",
		"if [ \"$1\" = \"-C\" ]; then",
		"\tshift 2",
		"fi",
		"if [ \"$1\" = \"remote\" ] && [ \"$2\" = \"get-url\" ]; then",
		"\techo \"https://github.com/openai/symphony.git\"",
		"fi",
		"exit 0",
	]);
	writeExecutable(path.join(binDir, "mise"), [
		"#!/usr/bin/env bash",
		"if [ \"$1\" = \"exec\" ] && [ \"$2\" = \"--\" ] && [ \"$3\" = \"./bin/symphony\" ]; then",
		"\tshift 3",
		"\tprintf '%s\\n' \"$@\" > \"$SYMPHONY_FAKE_ARGS_LOG\"",
		"fi",
		"exit 0",
	]);

	execFileSync(scriptPath, ["--", "--logs-root", customLogsRoot, "--port", "4567"], {
		cwd: repoRoot,
		env: {
			...process.env,
			LINEAR_API_KEY: "lin_api_test",
			PATH: `${binDir}:${process.env.PATH}`,
			SYMPHONY_FAKE_GIT_LOG: gitLog,
			SYMPHONY_FAKE_ARGS_LOG: argsLog,
			SYMPHONY_GITHUB_REPO: "eevennsoh/VPK-rovo",
			SYMPHONY_LINEAR_PROJECT_SLUG: "test-project",
			SYMPHONY_RUNTIME_DIR: runtimeDir,
			SYMPHONY_SOURCE_REPO_URL: "git@github.com:eevennsoh/VPK-rovo.git",
			SYMPHONY_UPSTREAM_DIR: upstreamDir,
			SYMPHONY_UPSTREAM_REPO: "https://github.com/openai/symphony.git",
		},
		stdio: "pipe",
	});

	const forwardedArgs = fs.readFileSync(argsLog, "utf8").trim().split("\n");
	assert.deepEqual(forwardedArgs, [
		path.join(runtimeDir, "WORKFLOW.md"),
		"--i-understand-that-this-will-be-running-without-the-usual-guardrails",
		"--logs-root",
		customLogsRoot,
		"--port",
		"4567",
	]);
	assert.equal(
		forwardedArgs.filter((arg) => arg === "--logs-root").length,
		1,
	);
	assert.equal(fs.existsSync(customLogsRoot), true);
	assert.equal(fs.existsSync(path.join(runtimeDir, "log")), false);

	const cleanInvocations = fs
		.readFileSync(gitLog, "utf8")
		.trim()
		.split("\n")
		.filter((line) => line.includes(" clean -fdx "));
	assert.equal(cleanInvocations.length, 2);
	for (const invocation of cleanInvocations) {
		assert.match(invocation, / -- \. /);
		assert.match(invocation, /:!elixir\/deps/);
		assert.match(invocation, /:!elixir\/_build/);
		assert.match(invocation, /:!elixir\/bin/);
	}

	fs.rmSync(tempDir, { recursive: true, force: true });
});

test("symphony wrapper rejects upstream dir paths that would reset this repo", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "symphony-wrapper-test-"));
	const binDir = createFakeBin(tempDir);
	const baseEnv = {
		...process.env,
		LINEAR_API_KEY: "lin_api_test",
		PATH: `${binDir}:${process.env.PATH}`,
		SYMPHONY_GITHUB_REPO: "eevennsoh/VPK-rovo",
		SYMPHONY_LINEAR_PROJECT_SLUG: "test-project",
		SYMPHONY_SOURCE_REPO_URL: "git@github.com:eevennsoh/VPK-rovo.git",
		SYMPHONY_UPSTREAM_REPO: "https://github.com/openai/symphony.git",
	};

	const cases = [
		{
			upstreamDir: repoRoot,
			message: "SYMPHONY_UPSTREAM_DIR cannot point at this repo",
		},
		{
			upstreamDir: path.dirname(repoRoot),
			message: "SYMPHONY_UPSTREAM_DIR cannot contain this repo",
		},
	];

	for (const entry of cases) {
		const result = spawnSync(scriptPath, ["--version"], {
			cwd: repoRoot,
			env: {
				...baseEnv,
				SYMPHONY_UPSTREAM_DIR: entry.upstreamDir,
			},
			encoding: "utf8",
		});

		assert.notEqual(result.status, 0);
		assert.match(result.stderr, new RegExp(entry.message));
	}

	fs.rmSync(tempDir, { recursive: true, force: true });
});
