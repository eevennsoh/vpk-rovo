const test = require("node:test");
const assert = require("node:assert/strict");

const {
	normalizeTeamAgentCount,
	resolveRunLaneDefinitions,
	assignTasksToLanes,
	buildConversationContextWithBudget,
	mergeConversationContextWithBudget,
} = require("./team-run-lanes");

test("normalizeTeamAgentCount clamps values to 1-4", () => {
	assert.equal(normalizeTeamAgentCount(0), 1);
	assert.equal(normalizeTeamAgentCount(2), 2);
	assert.equal(normalizeTeamAgentCount(7), 4);
	assert.equal(normalizeTeamAgentCount("3"), 3);
});

test("resolveRunLaneDefinitions derives deterministic contextual lanes", () => {
	const lanes = resolveRunLaneDefinitions({
		tasks: [
			{ label: "Implement frontend dashboard shell" },
			{ label: "Build backend API endpoints" },
			{ label: "Write QA regression checks" },
		],
		agentCount: 3,
	});

	assert.deepEqual(
		lanes.map((lane) => lane.agentId),
		["lane-1", "lane-2", "lane-3"]
	);
	assert.deepEqual(
		lanes.map((lane) => lane.agentName),
		["Backend Agent", "Frontend Agent", "QA Agent"]
	);
});

test("resolveRunLaneDefinitions falls back to generic lanes for task-specific tokens", () => {
	const lanes = resolveRunLaneDefinitions({
		tasks: [
			{ label: "Build daily timesheet table" },
			{ label: "Implement weekly Mon-Fri table" },
			{ label: "Create sidebar nav entry" },
		],
		agentCount: 3,
	});

	assert.deepEqual(
		lanes.map((lane) => lane.agentName),
		["Implementation Agent", "Frontend Agent", "Backend Agent"]
	);
});

test("assignTasksToLanes remaps planner agents into selected lane pool", () => {
	const laneDefinitions = resolveRunLaneDefinitions({
		tasks: [
			{ label: "Create frontend home page" },
			{ label: "Build backend auth API" },
		],
		agentCount: 2,
		configuredLaneNames: ["Frontend Agent", "Backend Agent"],
	});

	const assignedTasks = assignTasksToLanes(
		[
			{
				id: "task-1",
				label: "Refine frontend loading state",
				agentId: "tiny-ui-agent",
				agentName: "UI micro-agent",
			},
			{
				id: "task-2",
				label: "Add backend route validation",
				agentId: "tiny-api-agent",
				agentName: "API micro-agent",
			},
		],
		laneDefinitions
	);

	assert.equal(assignedTasks[0].agentId, "lane-1");
	assert.equal(assignedTasks[0].agentName, "Frontend Agent");
	assert.equal(assignedTasks[1].agentId, "lane-2");
	assert.equal(assignedTasks[1].agentName, "Backend Agent");
});

test("buildConversationContextWithBudget enforces per-entry, message, and char limits", () => {
	const context = buildConversationContextWithBudget(
		[
			{ role: "user", content: "A".repeat(500) },
			{ role: "assistant", content: "B".repeat(500) },
			{ role: "user", content: "C".repeat(500) },
		],
		{ maxMessages: 2, maxChars: 700, maxEntryChars: 300 }
	);

	assert.equal(context.length, 2);
	assert.equal(context[0].content.length <= 300, true);
	assert.equal(context[1].content.length <= 300, true);
	const totalChars = context.reduce((sum, entry) => sum + entry.content.length, 0);
	assert.equal(totalChars <= 700, true);
});

test("mergeConversationContextWithBudget keeps newest entries under budget", () => {
	const merged = mergeConversationContextWithBudget(
		[
			{ type: "user", content: "old-1" },
			{ type: "assistant", content: "old-2" },
		],
		[
			{ type: "user", content: "new-1" },
			{ type: "assistant", content: "new-2" },
		],
		{ maxMessages: 2, maxChars: 20, maxEntryChars: 20 }
	);

	assert.deepEqual(
		merged.map((entry) => entry.content),
		["new-1", "new-2"]
	);
});
