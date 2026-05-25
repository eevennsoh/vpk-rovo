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
