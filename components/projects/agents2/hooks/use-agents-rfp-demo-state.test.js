const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const HOOK_SOURCE = fs.readFileSync(path.join(__dirname, "use-agents-rfp-demo-state.ts"), "utf8");

test("useAgentsRfpDemoState isolates agents2 state in localStorage", () => {
	assert.match(HOOK_SOURCE, /AGENTS_RFP_DEMO_STORAGE_KEY/u);
	assert.match(HOOK_SOURCE, /parseAgentsRfpDemoState\(window\.localStorage\.getItem\(AGENTS_RFP_DEMO_STORAGE_KEY\)\)/u);
	assert.match(HOOK_SOURCE, /window\.localStorage\.setItem\(AGENTS_RFP_DEMO_STORAGE_KEY, JSON\.stringify\(state\)\)/u);
	assert.match(HOOK_SOURCE, /const reset = useCallback\(async \(\) => \{/u);
	assert.match(HOOK_SOURCE, /scheduleRfpDraftingAgent/u);
	assert.doesNotMatch(HOOK_SOURCE, /\/api\/agents\/rfp-demo\/state/u);
	assert.doesNotMatch(HOOK_SOURCE, /postStateMutation/u);
	assert.doesNotMatch(HOOK_SOURCE, /fetch\(RFP_DEMO_STATE_ENDPOINT\)/u);
});
