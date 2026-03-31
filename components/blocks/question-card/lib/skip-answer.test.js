const test = require("node:test");
const assert = require("node:assert/strict");

const { QUESTION_CARD_SKIPPED_VALUE } = require("./skipped-answer.ts");

test("QUESTION_CARD_SKIPPED_VALUE stays stable for summary and submit flows", () => {
	assert.equal(QUESTION_CARD_SKIPPED_VALUE, "Skipped");
});
