const assert = require("node:assert/strict");
const test = require("node:test");

const { findPortlessUrl, isOwnerAlive } = require("./portless-routes");

test("isOwnerAlive: true for this process, false for 0/negative", () => {
	assert.equal(isOwnerAlive(process.pid), true);
	assert.equal(isOwnerAlive(0), false);
	assert.equal(isOwnerAlive(-1), false);
	assert.equal(isOwnerAlive("nope"), false);
});

test("findPortlessUrl returns the https URL of the route matching the frontend port", () => {
	const routes = [
		{ hostname: "example-project.localhost", port: 3000, pid: process.pid },
		{ hostname: "feature-x.example-project.localhost", port: 3020, pid: process.pid },
	];

	assert.equal(
		findPortlessUrl(routes, 3020),
		"https://feature-x.example-project.localhost"
	);
	// String ports (as read from .dev-frontend-port) still match.
	assert.equal(findPortlessUrl(routes, "3000"), "https://example-project.localhost");
});

test("findPortlessUrl prefers the live route over a stale one sharing the same reused port", () => {
	// A lingering dead route (pid 0, e.g. the automation-padding alias) precedes
	// the freshly-registered live route at the same reused port. We must NOT
	// return the dead hostname.
	const routes = [
		{ hostname: "stale-dead.localhost", port: 3100, pid: 0 },
		{ hostname: "live-worktree.localhost", port: 3100, pid: process.pid },
	];

	assert.equal(
		findPortlessUrl(routes, 3100),
		"https://live-worktree.localhost"
	);
});

test("findPortlessUrl returns null when no route matches or input is missing", () => {
	const routes = [{ hostname: "example-project.localhost", port: 3000, pid: process.pid }];

	assert.equal(findPortlessUrl(routes, 9999), null);
	assert.equal(findPortlessUrl(routes, null), null);
	assert.equal(findPortlessUrl(routes, ""), null);
	assert.equal(findPortlessUrl(routes, "abc"), null);
	assert.equal(findPortlessUrl([], 3000), null);
	assert.equal(findPortlessUrl(null, 3000), null);
});
