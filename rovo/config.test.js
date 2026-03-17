const test = require("node:test");
const assert = require("node:assert/strict");

const { buildUserMessage } = require("./config");

test("buildUserMessage plain-chat profile omits heavy protocol blocks", () => {
	const message = buildUserMessage("hi", [], undefined, {
		profile: "plain-chat",
	});

	assert.match(message, /\[Plain Chat Mode\]/);
	assert.doesNotMatch(message, /\[Clarification Protocol\]/);
	assert.doesNotMatch(message, /\[Interactive Visual UI Protocol\]/);
	assert.doesNotMatch(message, /\[Figma Tool Protocol\]/);
});

test("buildUserMessage plain-chat profile limits conversation history", () => {
	const history = [
		{ type: "user", content: "one" },
		{ type: "assistant", content: "two" },
		{ type: "user", content: "three" },
		{ type: "assistant", content: "four" },
		{ type: "user", content: "five" },
		{ type: "assistant", content: "six" },
	];

	const message = buildUserMessage("hi", history, undefined, {
		profile: "plain-chat",
	});

	assert.doesNotMatch(message, /User: one/);
	assert.doesNotMatch(message, /Assistant: two/);
	assert.match(message, /User: three/);
	assert.match(message, /Assistant: six/);
});
