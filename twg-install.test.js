const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = __dirname;
const scriptPath = path.join(repoRoot, "twg-install.sh");

function createTempDir(prefix) {
	return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeFakeTwgBinary(filePath) {
	fs.writeFileSync(
		filePath,
		[
			"#!/usr/bin/env bash",
			"set -euo pipefail",
			"printf 'args=%s\\n' \"$*\" >> \"$TWG_FAKE_LOG\"",
			"printf 'bun_install=%s\\n' \"${BUN_INSTALL:-unset}\" >> \"$TWG_FAKE_LOG\"",
			"printf 'bun_debug=%s\\n' \"${BUN_DEBUG:-unset}\" >> \"$TWG_FAKE_LOG\"",
			"",
			"if [[ \"$*\" == \"setup finalize --help\" ]]; then",
			"\texit 0",
			"fi",
			"",
			"if [[ \"$1\" == \"setup\" && \"$2\" == \"finalize\" ]]; then",
			"\texit 0",
			"fi",
			"",
			"echo \"unexpected fake twg invocation: $*\" >&2",
			"exit 1",
			"",
		].join("\n"),
		"utf8",
	);
	fs.chmodSync(filePath, 0o755);
}

test("installer skip-download reuses a local binary and finalizes through the clean wrapper", () => {
	const tempRoot = createTempDir("twg-install-test-");
	const homeDir = path.join(tempRoot, "home");
	const installDir = path.join(tempRoot, "bin");
	const legacyTwgPath = path.join(installDir, "twg");
	const twgBinPath = path.join(installDir, "twg-bin");
	const logPath = path.join(tempRoot, "fake-twg.log");

	try {
		fs.mkdirSync(homeDir, { recursive: true });
		fs.mkdirSync(installDir, { recursive: true });
		writeFakeTwgBinary(legacyTwgPath);

		const output = execFileSync(
			"bash",
			[
				scriptPath,
				"--skip-download",
				"--skip-login",
				"--skip-skills",
				"--version",
				"1.2.3",
				"--install-dir",
				installDir,
			],
			{
				cwd: repoRoot,
				encoding: "utf8",
				env: {
					...process.env,
					BUN_DEBUG: "1",
					BUN_INSTALL: path.join(tempRoot, "bun"),
					HOME: homeDir,
					PATH: `${installDir}:${process.env.PATH}`,
					TWG_FAKE_LOG: logPath,
				},
			},
		);

		assert.match(output, /Skipping download and reusing existing twg/);
		assert.match(output, /Installed:/);
		assert.equal(fs.existsSync(legacyTwgPath), true);
		assert.equal(fs.existsSync(twgBinPath), true);

		const wrapper = fs.readFileSync(legacyTwgPath, "utf8");
		assert.match(wrapper, /exec "\$SCRIPT_DIR\/twg-bin" "\$@"/);

		const invocations = fs.readFileSync(logPath, "utf8");
		assert.match(invocations, /args=setup finalize --help/);
		assert.match(invocations, /args=setup finalize .*--install-method direct-public-installer/);
		assert.match(invocations, /args=setup finalize .*--skip-login/);
		assert.match(invocations, /args=setup finalize .*--skip-skills/);
		assert.match(invocations, new RegExp(`--binary-path ${twgBinPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
		assert.doesNotMatch(invocations, /bun_install=(?!unset)/);
		assert.doesNotMatch(invocations, /bun_debug=(?!unset)/);
	} finally {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	}
});
