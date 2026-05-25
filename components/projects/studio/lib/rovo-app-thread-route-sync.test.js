const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildRovoAppThreadPath,
	getRovoAppThreadIdFromPath,
	ROVO_APP_ROOT_PATH,
} = require("./rovo-app-thread-route-sync.ts");

test("Studio thread routes use the Studio root path", () => {
	assert.equal(ROVO_APP_ROOT_PATH, "/studio");
	assert.equal(
		buildRovoAppThreadPath("thread/with spaces"),
		"/studio/thread%2Fwith%20spaces",
	);
});

test("Studio thread route parsing keeps reserved surface routes out of thread ids", () => {
	assert.equal(getRovoAppThreadIdFromPath("/studio/thread%2Fwith%20spaces"), "thread/with spaces");
	assert.equal(getRovoAppThreadIdFromPath("/studio"), null);
	assert.equal(getRovoAppThreadIdFromPath("/studio/"), null);
	assert.equal(getRovoAppThreadIdFromPath("/studio/jobs"), null);
	assert.equal(getRovoAppThreadIdFromPath("/rovo/thread-1"), null);
});
