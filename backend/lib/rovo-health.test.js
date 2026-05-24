const test = require("node:test");
const assert = require("node:assert/strict");

const {
	classifyRovoHealthCheck,
} = require("./rovo-health");

test("classifyRovoHealthCheck marks healthy states ready", () => {
	const health = classifyRovoHealthCheck({
		status: "healthy",
		mcp_servers: { atlassian: "running" },
	});

	assert.equal(health.ready, true);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, false);
	assert.equal(health.status, "healthy");
});

test("classifyRovoHealthCheck treats startup states as retryable", () => {
	const health = classifyRovoHealthCheck({
		status: "unknown",
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, true);
	assert.equal(health.terminal, false);
	assert.equal(health.reason, "starting");
});

test("classifyRovoHealthCheck treats pending review as terminal", () => {
	const health = classifyRovoHealthCheck({
		status: "pending user review",
		detail: { title: "Third-party MCP server" },
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, true);
	assert.equal(health.reason, "pending-user-review");
	assert.equal(health.detail.title, "Third-party MCP server");
});

test("classifyRovoHealthCheck treats entitlement failures as terminal", () => {
	const health = classifyRovoHealthCheck({
		status: "entitlement check failed",
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, true);
	assert.equal(health.reason, "entitlement-failed");
});

test("classifyRovoHealthCheck treats auth-required probes as terminal", () => {
	const health = classifyRovoHealthCheck({
		status: "reachable",
		requiresAuth: true,
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, true);
	assert.equal(health.reason, "authentication-required");
});
