const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(
	path.join(__dirname, "use-clicky-voice.ts"),
	"utf8",
);

test("Clicky deactivation does not disconnect the Realtime voice session", () => {
	assert.doesNotMatch(SOURCE, /disconnectRealtime/u);
	assert.match(SOURCE, /stops visual capture\/pointing without tearing down voice/u);
	assert.match(SOURCE, /connectedForClickyRef\.current/u);
});

test("Clicky sends structured Studio screen assistant context with screenshots", () => {
	assert.match(SOURCE, /getScreenAssistantSnapshot/u);
	assert.match(SOURCE, /screenAssistant: \{ \.\.\.screenAssistant, turnId \}/u);
	assert.match(SOURCE, /Studio screen assistant context JSON/u);
});
