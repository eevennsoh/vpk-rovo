const test = require("node:test");
const assert = require("node:assert/strict");

const { buildClarificationDirective } = require("./clarification-directive");

test("buildClarificationDirective returns visualization directive for chart requests", () => {
	const directive = buildClarificationDirective({
		latestUserMessage: "show me a chart of atlassian stock price",
		intentHint: "visualization",
	});

	assert.match(directive, /generate the requested visualization now/i);
	assert.match(directive, /json-render ui widget/i);
	assert.doesNotMatch(directive, /plan widget/i);
});

test("buildClarificationDirective returns plan directive for planning requests", () => {
	const directive = buildClarificationDirective({
		latestUserMessage: "create an implementation plan for this feature",
	});

	assert.match(directive, /generate the final plan now/i);
	assert.match(directive, /plan widget with concrete tasks/i);
});

test("buildClarificationDirective returns neutral continuation directive by default", () => {
	const directive = buildClarificationDirective({
		latestUserMessage: "help me improve this draft response",
	});

	assert.match(directive, /continue the user's original request now/i);
	assert.match(directive, /format that best matches the request/i);
	assert.doesNotMatch(directive, /create-plan/i);
	assert.doesNotMatch(directive, /plan widget/i);
});
