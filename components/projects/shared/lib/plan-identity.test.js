const test = require("node:test");
const assert = require("node:assert/strict");

const {
	extractTaskHeadingFromLabel,
} = require("./plan-identity.ts");

test("extractTaskHeadingFromLabel removes empty parentheses left by stripped file paths", () => {
	assert.equal(
		extractTaskHeadingFromLabel(
			"Create the To-Do page route (`app/todo/page.tsx`) — Build the page UI."
		),
		"Create the To-Do page route",
	);
});
