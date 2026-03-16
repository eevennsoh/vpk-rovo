const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { findAvailableRovodevPorts } = require("./lib/dev-tmux-ports");

const repoRoot = path.resolve(__dirname, "..");
const scriptPath = path.join(repoRoot, "scripts/dev-tmux.sh");

test("dev-tmux accepts pnpm passthrough args with a leading double dash", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dev-tmux-test-"));
	const tmuxPath = path.join(tempDir, "tmux");

	fs.writeFileSync(
		tmuxPath,
		[
			"#!/usr/bin/env bash",
			"",
			"if [ \"$1\" = \"has-session\" ]; then",
			"\texit 1",
			"fi",
			"",
			"echo \"unexpected tmux invocation: $*\" >&2",
			"exit 1",
			"",
		].join("\n"),
		"utf8"
	);
	fs.chmodSync(tmuxPath, 0o755);

	const output = execFileSync(scriptPath, ["--", "status"], {
		cwd: repoRoot,
		encoding: "utf8",
		env: {
			...process.env,
			PATH: `${tempDir}:${process.env.PATH}`,
			ROVODEV_BILLING_URL: "https://example.invalid",
		},
	});

	assert.match(output, /Session:/);
	assert.match(output, /tmux: stopped/);

	fs.rmSync(tempDir, { recursive: true, force: true });
});

test("findAvailableRovodevPorts skips occupied reserved ports", async () => {
	const ports = await findAvailableRovodevPorts({
		basePort: 8002,
		poolSize: 3,
		maxTries: 6,
		isPortAvailableFn: async (port) => ![8002, 8004].includes(port),
	});

	assert.deepEqual(ports, [8003, 8005, 8006]);
});
