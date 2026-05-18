const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const HOOK_SOURCE = fs.readFileSync(path.join(__dirname, "use-agents-rfp-demo-state.ts"), "utf8");

test("useAgentsRfpDemoState follows agents backend state contract on agents2 endpoints", () => {
	assert.match(HOOK_SOURCE, /RFP_DEMO_STATE_ENDPOINT = "\/api\/agents2\/rfp-demo\/state"/u);
	assert.match(HOOK_SOURCE, /RFP_DEMO_APPLY_AGENT_ENDPOINT = "\/api\/agents2\/rfp-demo\/agent\/apply"/u);
	assert.match(HOOK_SOURCE, /RFP_DEMO_TICKET_EVENT_ENDPOINT = "\/api\/agents2\/rfp-demo\/events\/ticket-entered-column"/u);
	assert.match(HOOK_SOURCE, /fetch\(RFP_DEMO_STATE_ENDPOINT\)/u);
	assert.match(HOOK_SOURCE, /postStateMutation\(RFP_DEMO_STATE_ENDPOINT, \{ state: nextState \}\)/u);
	assert.match(HOOK_SOURCE, /postStateMutation\(RFP_DEMO_APPLY_AGENT_ENDPOINT\)/u);
	assert.doesNotMatch(HOOK_SOURCE, /\/api\/agents\/rfp-demo\/state/u);
	assert.doesNotMatch(HOOK_SOURCE, /window\.localStorage/u);
	assert.doesNotMatch(HOOK_SOURCE, /setTimeout/u);
});
