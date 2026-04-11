const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
	buildRovoDevDiscoveryCandidatePorts,
	resolveRovoDevPorts,
} = require("./rovodev-port-discovery");

test("buildRovoDevDiscoveryCandidatePorts prioritizes env port and dedupes the worktree range", () => {
	assert.deepEqual(
		buildRovoDevDiscoveryCandidatePorts({
			envPort: "8010",
			basePort: 8008,
			maxTries: 4,
		}),
		[8010, 8008, 8009, 8011]
	);
});

test("resolveRovoDevPorts reuses recorded ports without probing the worktree range", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-port-discovery-"));
	const portFile = path.join(tempDir, ".dev-rovodev-port");
	const portsFile = path.join(tempDir, ".dev-rovodev-ports");
	fs.writeFileSync(portFile, "8012");
	fs.writeFileSync(portsFile, JSON.stringify([8012, 8013]));

	let healthCheckCalls = 0;
	const result = await resolveRovoDevPorts({
		portFile,
		portsFile,
		envPort: "8000",
		basePort: 8000,
		maxTries: 5,
		healthCheck: async () => {
			healthCheckCalls += 1;
			return { status: "healthy" };
		},
		classifyHealthCheck: (health) => ({ ready: health.status === "healthy" }),
		persistDiscoveredPorts: true,
	});

	assert.deepEqual(result, {
		ports: [8012, 8013],
		source: "recorded",
	});
	assert.equal(healthCheckCalls, 0);
});

test("resolveRovoDevPorts rediscovers healthy ports and restores missing port files", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovodev-port-recovery-"));
	const portFile = path.join(tempDir, ".dev-rovodev-port");
	const portsFile = path.join(tempDir, ".dev-rovodev-ports");

	const result = await resolveRovoDevPorts({
		portFile,
		portsFile,
		basePort: 8000,
		maxTries: 3,
		healthCheck: async (port) => ({
			status: port === 8000 ? "healthy" : "unhealthy",
		}),
		classifyHealthCheck: (health) => ({
			ready: health.status === "healthy",
		}),
		persistDiscoveredPorts: true,
	});

	assert.deepEqual(result, {
		ports: [8000],
		source: "discovered",
	});
	assert.equal(fs.readFileSync(portFile, "utf8").trim(), "8000");
	assert.deepEqual(JSON.parse(fs.readFileSync(portsFile, "utf8")), [8000]);
});
