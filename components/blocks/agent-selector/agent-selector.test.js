const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPONENT_SOURCE = fs.readFileSync(path.join(__dirname, "components/agent-selector.tsx"), "utf8");
const DATA_SOURCE = fs.readFileSync(path.join(__dirname, "data/demo-agents.ts"), "utf8");
const PAGE_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("AgentSelector demo list omits Rovo Dev", () => {
	assert.doesNotMatch(DATA_SOURCE, /name:\s*"Rovo Dev"/u);
	assert.doesNotMatch(DATA_SOURCE, /id:\s*"rovo-dev"/u);
});

test("AgentSelector demo uses single selection without multi-select toggling", () => {
	assert.match(PAGE_SOURCE, /variant === "selected-agent-actions" \? \["ai-insights-agent"\] : \["github-copilot"\]/u);
	assert.match(PAGE_SOURCE, /function selectAgent\(agentId: string\) \{[\s\S]*setSelectedAgentIds\(\[agentId\]\);[\s\S]*\}/u);
	assert.match(PAGE_SOURCE, /selectionMode="single"/u);
	assert.doesNotMatch(PAGE_SOURCE, /currentIds\.includes\(agentId\)[\s\S]*currentIds\.filter/u);
});

test("AgentSelector hides command checkmarks for single-select usage", () => {
	assert.match(COMPONENT_SOURCE, /selectionMode = "multiple"/u);
	assert.match(COMPONENT_SOURCE, /const supportsMultipleSelection = selectionMode === "multiple";/u);
	assert.match(COMPONENT_SOURCE, /showCheckIcon=\{supportsMultipleSelection\}/u);
	assert.match(COMPONENT_SOURCE, /data-checked=\{supportsMultipleSelection && isSelected \? true : undefined\}/u);
});
