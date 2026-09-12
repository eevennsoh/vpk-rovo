const assert = require("node:assert/strict");
const test = require("node:test");

async function loadStatus() {
	return import("./agent-row-status.ts");
}

test("agent row tooltips map running, waiting, and completed sessions", async () => {
	const { agentRowStatusTooltip } = await loadStatus();

	assert.equal(
		agentRowStatusTooltip([{ agentId: "claude-code", status: "running" }], "claude-code"),
		"Working",
	);
	assert.equal(
		agentRowStatusTooltip([{ agentId: "claude-code", status: "waiting" }], "claude-code"),
		"Needs input",
	);
	assert.equal(
		agentRowStatusTooltip([{ agentId: "claude-code", status: "completed" }], "claude-code"),
		"Finished",
	);
});

test("agent row status prefers the latest session and falls back to Working", async () => {
	const { agentRowStatusTooltip, resolveAgentRowSessionStatus } = await loadStatus();

	assert.equal(
		resolveAgentRowSessionStatus(
			[
				{ agentId: "claude-code", status: "running" },
				{ agentId: "claude-code", status: "waiting" },
			],
			"claude-code",
		),
		"waiting",
	);
	assert.equal(agentRowStatusTooltip([], "new-agent"), "Working");
	assert.equal(
		resolveAgentRowSessionStatus(
			[],
			"readiness-checker",
			[{
				kind: "changed-files",
				actor: { id: "static-readiness-checker" },
				sessionItem: { state: "complete" },
			}],
		),
		"completed",
	);
});
