const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-sidebar.tsx"), "utf8");

test("Studio sidebar selects Agents by default instead of Insights", () => {
	assert.match(
		SOURCE,
		/icon: <AiAgentIcon label="" \/>[\s\S]*isSelected: true,[\s\S]*label: "Agents"/u,
	);
	assert.doesNotMatch(
		SOURCE,
		/icon: <ChartTrendUpIcon label="" \/>[\s\S]*isSelected: true,[\s\S]*label: "Insights"/u,
	);
});

test("Studio sidebar recent agent children use one 12px indentation level without a section label", () => {
	assert.match(SOURCE, /<div className="flex flex-col gap-0\.5 pl-3">\s*\{recentAgents\.items\.map/u);
	assert.doesNotMatch(SOURCE, /mt-0\.5 flex flex-col gap-0\.5 pl-7/u);
	assert.doesNotMatch(SOURCE, />\s*Recent\s*<\/div>/u);
});
