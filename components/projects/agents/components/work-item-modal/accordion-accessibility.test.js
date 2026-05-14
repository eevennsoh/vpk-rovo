const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readComponentSource(fileName) {
	return fs.readFileSync(path.join(__dirname, fileName), "utf8");
}

test("work item modal accordion buttons expose expanded state", () => {
	assert.match(
		readComponentSource("details-accordion.tsx"),
		/<Button[\s\S]*aria-label=\{state\.isDetailsOpen \? "Collapse" : "Expand"\}[\s\S]*aria-expanded=\{state\.isDetailsOpen\}/,
	);
	assert.match(
		readComponentSource("more-fields-accordion.tsx"),
		/<Button[\s\S]*aria-label=\{state\.isMoreFieldsOpen \? "Collapse" : "Expand"\}[\s\S]*aria-expanded=\{state\.isMoreFieldsOpen\}/,
	);
	assert.match(
		readComponentSource("automation-accordion.tsx"),
		/<Button[\s\S]*aria-label=\{state\.isAutomationOpen \? "Collapse" : "Expand"\}[\s\S]*aria-expanded=\{state\.isAutomationOpen\}/,
	);
});
