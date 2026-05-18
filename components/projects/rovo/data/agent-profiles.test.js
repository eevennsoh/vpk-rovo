const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROFILES_SOURCE = fs.readFileSync(path.join(__dirname, "agent-profiles.ts"), "utf8");
const DEMO_AGENTS_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/agent-selector/data/demo-agents.ts"),
	"utf8",
);
const AGENT_SELECTOR_PAGE_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/blocks/agent-selector/page.tsx"),
	"utf8",
);

test("Rovo Dev stays available as the fallback profile but is not a selector example", () => {
	assert.match(PROFILES_SOURCE, /id: ROVO_AGENT_ID[\s\S]*name: "Rovo Dev"/u);
	assert.match(
		PROFILES_SOURCE,
		/ROVO_AGENT_SELECTOR_AGENTS[\s\S]*\.filter\(\(agent\) => agent\.id !== ROVO_AGENT_ID\)[\s\S]*\.map/u,
	);
	assert.match(
		PROFILES_SOURCE,
		/ROVO_CUSTOM_AGENT_SELECTOR_AGENTS: readonly AgentSelectorAgent\[\] = ROVO_AGENT_SELECTOR_AGENTS;/u,
	);
	assert.doesNotMatch(DEMO_AGENTS_SOURCE, /ROVO_AGENT_ID/u);
	assert.doesNotMatch(DEMO_AGENTS_SOURCE, /rovo-dev/u);
	assert.match(AGENT_SELECTOR_PAGE_SOURCE, /variant === "selected-agent-actions" \? \["ai-insights-agent"\] : \["github-copilot"\]/u);
});
