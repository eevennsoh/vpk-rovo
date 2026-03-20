const test = require("node:test");
const assert = require("node:assert/strict");

const {
	classifyRovoDevHealthCheck,
} = require("./rovodev-health");

test("classifyRovoDevHealthCheck marks healthy states ready", () => {
	const health = classifyRovoDevHealthCheck({
		status: "healthy",
		mcp_servers: { atlassian: "running" },
	});

	assert.equal(health.ready, true);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, false);
	assert.equal(health.status, "healthy");
});

test("classifyRovoDevHealthCheck treats startup states as retryable", () => {
	const health = classifyRovoDevHealthCheck({
		status: "unknown",
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, true);
	assert.equal(health.terminal, false);
	assert.equal(health.reason, "starting");
});

test("classifyRovoDevHealthCheck treats pending review as terminal", () => {
	const health = classifyRovoDevHealthCheck({
		status: "pending user review",
		detail: { title: "Third-party MCP server" },
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, true);
	assert.equal(health.reason, "pending-user-review");
	assert.equal(health.detail.title, "Third-party MCP server");
});

test("classifyRovoDevHealthCheck treats entitlement failures as terminal", () => {
	const health = classifyRovoDevHealthCheck({
		status: "entitlement check failed",
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, true);
	assert.equal(health.reason, "entitlement-failed");
});

test("classifyRovoDevHealthCheck treats auth-required probes as terminal", () => {
	const health = classifyRovoDevHealthCheck({
		status: "reachable",
		requiresAuth: true,
	});

	assert.equal(health.ready, false);
	assert.equal(health.retryable, false);
	assert.equal(health.terminal, true);
	assert.equal(health.reason, "authentication-required");
});
