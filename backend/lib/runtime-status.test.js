const test = require("node:test");
const assert = require("node:assert/strict");

const { buildRuntimeStatusSnapshot } = require("./runtime-status");

test("buildRuntimeStatusSnapshot derives degraded state from Hermes and Rovo surfaces", () => {
	const snapshot = buildRuntimeStatusSnapshot({
		hermes: {
			available: false,
			health: "degraded",
			message: "Hermes local files are unavailable.",
			status: "unavailable",
		},
		rovo: {
			available: true,
			status: "ready",
		},
	});

	assert.equal(snapshot.status, "degraded");
	assert.deepEqual(snapshot.degradedSurfaces, ["hermes"]);
	assert.equal(snapshot.surfaces.hermes.name, "hermes");
	assert.equal(snapshot.surfaces.hermes.health, "degraded");
	assert.equal(snapshot.surfaces.hermes.status, "unavailable");
	assert.equal(snapshot.surfaces.hermes.message, "Hermes local files are unavailable.");
});
