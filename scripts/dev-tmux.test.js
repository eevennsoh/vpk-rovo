const assert = require("node:assert/strict");
const http = require("node:http");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
	findAvailableRovodevPorts,
	waitForRovodevPortsHealthy,
} = require("./lib/dev-tmux-ports");
const { checkRovodevHealth } = require("./lib/rovodev-utils");

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

test("dev-tmux accepts explicit command with numeric pool size", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dev-tmux-start-test-"));
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

	const output = execFileSync(scriptPath, ["status", "6"], {
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

test("dev-tmux accepts shorthand double-dash pool size syntax", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dev-tmux-shorthand-test-"));
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

	const output = execFileSync(scriptPath, ["status", "--1"], {
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

test("dev-tmux stop invokes worktree listener cleanup", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dev-tmux-stop-test-"));
	const tmuxPath = path.join(tempDir, "tmux");
	const nodePath = path.join(tempDir, "node");
	const cleanupLogPath = path.join(tempDir, "cleanup.log");

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

	fs.writeFileSync(
		nodePath,
		[
			"#!/usr/bin/env bash",
			"",
			"if [ \"$1\" = \"./scripts/cleanup-worktree-listeners.js\" ]; then",
			"\techo \"$1\" >> \"$NODE_CLEANUP_LOG\"",
			"\texit 0",
			"fi",
			"",
			`exec "${process.execPath}" "$@"`,
			"",
		].join("\n"),
		"utf8"
	);
	fs.chmodSync(nodePath, 0o755);

	const output = execFileSync(scriptPath, ["stop"], {
		cwd: repoRoot,
		encoding: "utf8",
		env: {
			...process.env,
			PATH: `${tempDir}:${process.env.PATH}`,
			NODE_CLEANUP_LOG: cleanupLogPath,
			ROVODEV_BILLING_URL: "https://example.invalid",
		},
	});

	assert.match(output, /No tmux session named/);
	assert.equal(
		fs.readFileSync(cleanupLogPath, "utf8").trim(),
		"./scripts/cleanup-worktree-listeners.js"
	);

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

test("waitForRovodevPortsHealthy retries until every reserved port is healthy", async () => {
	const attemptsByPort = new Map();

	const results = await waitForRovodevPortsHealthy({
		ports: [8000, 8001],
		maxAttempts: 4,
		intervalMs: 0,
		checkRovodevHealthFn: async (port) => {
			const nextAttempt = (attemptsByPort.get(port) ?? 0) + 1;
			attemptsByPort.set(port, nextAttempt);

			return {
				healthy: nextAttempt >= 2,
				status: nextAttempt >= 2 ? "healthy" : "starting",
				mcpServers: null,
			};
		},
	});

	assert.deepEqual(
		results.map(({ port, health }) => [port, health.status]),
		[
			[8000, "healthy"],
			[8001, "healthy"],
		]
	);
	assert.equal(attemptsByPort.get(8000), 2);
	assert.equal(attemptsByPort.get(8001), 2);
});

test("waitForRovodevPortsHealthy surfaces the last unhealthy status on timeout", async () => {
	await assert.rejects(
		() =>
			waitForRovodevPortsHealthy({
				ports: [8000],
				maxAttempts: 2,
				intervalMs: 0,
				checkRovodevHealthFn: async () => ({
					healthy: false,
					status: "unreachable",
					mcpServers: null,
				}),
			}),
		/RovoDev ports did not become healthy in time: 8000 \(unreachable\)/
	);
});

test("checkRovodevHealth treats 401 auth responses as healthy", async () => {
	const server = http.createServer((_req, res) => {
		res.writeHead(401, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ detail: "Missing credentials" }));
	});

	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const address = server.address();
	assert.ok(address && typeof address === "object");

	try {
		const result = await checkRovodevHealth(address.port);
		assert.deepEqual(result, {
			healthy: true,
			status: "auth-required",
			mcpServers: null,
		});
	} finally {
		await new Promise((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
					return;
				}
				resolve();
			});
		});
	}
});
