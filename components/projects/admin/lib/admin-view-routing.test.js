const assert = require("node:assert/strict");
const test = require("node:test");

const { resolveAdminView } = require("./admin-view-routing.ts");

test("resolveAdminView maps core admin sidebar items to concrete views", () => {
	assert.deepEqual(resolveAdminView("Overview"), {
		kind: "dashboard",
		title: "Overview",
	});
	assert.deepEqual(resolveAdminView("Audit log"), {
		kind: "audit-log",
		title: "Audit log",
	});
	assert.deepEqual(resolveAdminView("AI settings"), {
		kind: "rovo-settings",
		title: "AI settings",
	});
	assert.deepEqual(resolveAdminView("View all sites"), {
		kind: "spaces",
		title: "View all sites",
	});
});

test("resolveAdminView falls back to placeholder for unknown items", () => {
	assert.deepEqual(resolveAdminView("Unknown admin area"), {
		kind: "placeholder",
		title: "Unknown admin area",
	});
});
