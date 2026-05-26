const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getStudioSidebarRecentAgents,
	STUDIO_SIDEBAR_RECENT_AGENT_LIMIT,
} = require("./studio-sidebar-recent-agents.ts");

test("orders recent Studio sidebar agents by last touched", () => {
	const result = getStudioSidebarRecentAgents([
		{ id: "draft-agent", kind: "wip", label: "Draft agent", lastTouchedAt: 30 },
		{ id: "older-agent", kind: "agent", label: "Older agent", lastTouchedAt: 10 },
		{ id: "newest-agent", kind: "agent", label: "Newest agent", lastTouchedAt: 50 },
	]);

	assert.deepEqual(
		result.items.map((item) => item.id),
		["newest-agent", "draft-agent", "older-agent"],
	);
	assert.equal(result.showViewAll, false);
	assert.equal(result.overflowCount, 0);
});

test("limits recent Studio sidebar agents to five and exposes overflow", () => {
	const result = getStudioSidebarRecentAgents([
		{ id: "agent-1", kind: "agent", label: "Agent 1", lastTouchedAt: 1 },
		{ id: "agent-2", kind: "agent", label: "Agent 2", lastTouchedAt: 2 },
		{ id: "agent-3", kind: "agent", label: "Agent 3", lastTouchedAt: 3 },
		{ id: "agent-4", kind: "agent", label: "Agent 4", lastTouchedAt: 4 },
		{ id: "agent-5", kind: "agent", label: "Agent 5", lastTouchedAt: 5 },
		{ id: "agent-6", kind: "agent", label: "Agent 6", lastTouchedAt: 6 },
	]);

	assert.equal(result.items.length, STUDIO_SIDEBAR_RECENT_AGENT_LIMIT);
	assert.deepEqual(
		result.items.map((item) => item.id),
		["agent-6", "agent-5", "agent-4", "agent-3", "agent-2"],
	);
	assert.equal(result.showViewAll, true);
	assert.equal(result.overflowCount, 1);
});
