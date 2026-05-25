const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
	buildRovoDiscoveryCandidatePorts,
	resolveRovoPorts,
} = require("./rovo-port-discovery");

test("buildRovoDiscoveryCandidatePorts prioritizes env port and dedupes the worktree range", () => {
	assert.deepEqual(
		buildRovoDiscoveryCandidatePorts({
			envPort: "8010",
			basePort: 8008,
			maxTries: 4,
		}),
		[8010, 8008, 8009, 8011]
	);
});

test("resolveRovoPorts reuses recorded ports without probing the worktree range", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovo-port-discovery-"));
	const portFile = path.join(tempDir, ".dev-rovo-port");
	const portsFile = path.join(tempDir, ".dev-rovo-ports");
	fs.writeFileSync(portFile, "8012");
	fs.writeFileSync(portsFile, JSON.stringify([8012, 8013]));

	let healthCheckCalls = 0;
	const result = await resolveRovoPorts({
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

test("resolveRovoPorts rejects partially invalid recorded port pools", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovo-port-discovery-"));
	const portFile = path.join(tempDir, ".dev-rovo-port");
	const portsFile = path.join(tempDir, ".dev-rovo-ports");
	fs.writeFileSync(portFile, "8014");
	fs.writeFileSync(portsFile, JSON.stringify([8012, "8013"]));

	let healthCheckCalls = 0;
	const result = await resolveRovoPorts({
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
		ports: [8014],
		source: "recorded",
	});
	assert.equal(healthCheckCalls, 0);
});

test("resolveRovoPorts rediscovers healthy ports and restores missing port files", async () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "rovo-port-recovery-"));
	const portFile = path.join(tempDir, ".dev-rovo-port");
	const portsFile = path.join(tempDir, ".dev-rovo-ports");

	const result = await resolveRovoPorts({
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
