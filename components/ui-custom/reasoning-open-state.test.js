const test = require("node:test");
const assert = require("node:assert/strict");

const { shouldAutoExpandReasoning } = require("./reasoning-open-state.ts");

test("auto-expands when details appear during streaming and user has not closed", () => {
	assert.equal(
		shouldAutoExpandReasoning({
			autoExpandOnDetails: true,
			hasDetails: true,
			isStreaming: true,
			isOpen: false,
			isExplicitlyClosed: false,
			hasUserClosed: false,
		}),
		true
	);
});

test("does not auto-expand after manual user collapse", () => {
	assert.equal(
		shouldAutoExpandReasoning({
			autoExpandOnDetails: true,
			hasDetails: true,
			isStreaming: true,
			isOpen: false,
			isExplicitlyClosed: false,
			hasUserClosed: true,
		}),
		false
	);
});

test("does not auto-expand when details are not available", () => {
	assert.equal(
		shouldAutoExpandReasoning({
			autoExpandOnDetails: true,
			hasDetails: false,
			isStreaming: true,
			isOpen: false,
			isExplicitlyClosed: false,
			hasUserClosed: false,
		}),
		false
	);
});
