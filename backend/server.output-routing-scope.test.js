const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("planExecutionActive is declared before both post-tool and strict tool-first routing branches", () => {
	const serverPath = path.join(__dirname, "server.js");
	const source = fs.readFileSync(serverPath, "utf8");
	const declaration = "const planExecutionActive = isPlanExecutionPhase(threadId);";
	const declarationIndex = source.indexOf(declaration);
	const strictToolFirstBranchIndex = source.indexOf("if (\n\t\t\t\t\t\tisStrictToolFirstTurn &&");
	const postToolBranchIndex = source.lastIndexOf(
		"if (!isStrictToolFirstTurn) {",
		strictToolFirstBranchIndex,
	);

	assert.notEqual(declarationIndex, -1, "Expected planExecutionActive declaration in backend/server.js");
	assert.notEqual(postToolBranchIndex, -1, "Expected post-tool routing branch in backend/server.js");
	assert.notEqual(strictToolFirstBranchIndex, -1, "Expected strict tool-first branch in backend/server.js");
	assert.ok(
		declarationIndex < postToolBranchIndex,
		"planExecutionActive must be declared before post-tool routing uses it",
	);
	assert.ok(
		declarationIndex < strictToolFirstBranchIndex,
		"planExecutionActive must be declared before strict tool-first routing uses it",
	);
});
