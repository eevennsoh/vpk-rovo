const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createRovoPortAffinity,
} = require("./rovo-port-affinity");

test("markSuccess stores the preferred port and clears prior avoids", () => {
	const affinity = createRovoPortAffinity();

	affinity.markFailure("thread-1", 8000);
	affinity.markSuccess("thread-1", 8002);

	assert.equal(affinity.getPreferredPort("thread-1"), 8002);
	assert.deepEqual(affinity.getAvoidPorts("thread-1"), []);
});

test("markFailure clears matching preference and records the failed port to avoid", () => {
	const affinity = createRovoPortAffinity();

	affinity.markSuccess("thread-1", 8000);
	affinity.markFailure("thread-1", 8000);

	assert.equal(affinity.getPreferredPort("thread-1"), null);
	assert.deepEqual(affinity.getAvoidPorts("thread-1"), [8000]);
});

test("clear removes all remembered affinity for a thread", () => {
	const affinity = createRovoPortAffinity();

	affinity.markSuccess("thread-1", 8001);
	affinity.markFailure("thread-1", 8002);
	affinity.clear("thread-1");

	assert.equal(affinity.getPreferredPort("thread-1"), null);
	assert.deepEqual(affinity.getAvoidPorts("thread-1"), []);
});
