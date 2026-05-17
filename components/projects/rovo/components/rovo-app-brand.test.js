const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-brand.tsx"), "utf8");

test("RovoAppBrand agent selector keeps a single selected agent", () => {
	assert.match(SOURCE, /const \[selectedAgentIds, setSelectedAgentIds\] = useState<readonly string\[\]>\(\["rovo-dev"\]\);/u);
	assert.match(SOURCE, /function selectAgent\(agentId: string\) \{/u);
	assert.match(SOURCE, /currentIds\.length === 1 && currentIds\[0\] === agentId/u);
	assert.match(SOURCE, /\? currentIds\s*: \[agentId\]/u);
	assert.match(SOURCE, /onAgentToggle=\{selectAgent\}/u);
	assert.doesNotMatch(SOURCE, /currentIds\.includes\(agentId\)[\s\S]*currentIds\.filter/u);
});
