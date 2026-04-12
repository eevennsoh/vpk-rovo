const test = require("node:test");
const assert = require("node:assert/strict");

const {
	shouldSuppressHermesKnowledgeDirectSpecCard,
} = require("./hermes-direct-spec-suppression");

test("suppresses direct spec promotion for Hermes memory recall replies", () => {
	assert.equal(
		shouldSuppressHermesKnowledgeDirectSpecCard({
			assistantText:
				"Based on my Hermes memory, here's what I know about you.\n\n```spec\n{\"op\":\"add\",\"path\":\"/root\",\"value\":\"main\"}\n```",
			genuiHint: false,
			latestUserMessage: "What do you remember about me?",
			narrative: "Based on my Hermes memory, here's what I know about you.",
		}),
		true,
	);
});

test("does not suppress when the user explicitly wants a visual memory surface", () => {
	assert.equal(
		shouldSuppressHermesKnowledgeDirectSpecCard({
			assistantText:
				"Based on my Hermes memory, here's a dashboard.\n\n```spec\n{\"op\":\"add\",\"path\":\"/root\",\"value\":\"main\"}\n```",
			genuiHint: false,
			latestUserMessage: "Visualize my Hermes memory as a dashboard.",
			narrative: "Based on my Hermes memory, here's a dashboard.",
		}),
		false,
	);
});

test("does not suppress when routing already opted into genui", () => {
	assert.equal(
		shouldSuppressHermesKnowledgeDirectSpecCard({
			assistantText:
				"Based on my Hermes memory, here's what I know about you.\n\n```spec\n{\"op\":\"add\",\"path\":\"/root\",\"value\":\"main\"}\n```",
			genuiHint: true,
			latestUserMessage: "What do you remember about me?",
			narrative: "Based on my Hermes memory, here's what I know about you.",
		}),
		false,
	);
});
