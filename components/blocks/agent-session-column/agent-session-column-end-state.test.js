const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const END_STATE_PATH = join(__dirname, "agent-session-column-end-state.tsx");

test("the deck end cap congratulates the viewer with animated copy and count", () => {
	assert.equal(existsSync(END_STATE_PATH), true);
	const source = readFileSync(END_STATE_PATH, "utf8");

	assert.match(source, /import TextEffects from "@\/components\/visual\/text-effects"/u);
	assert.match(source, /import TextMorphing from "@\/components\/visual\/text-morphing"/u);
	assert.match(source, /text="Nice work"/u);
	assert.match(source, /text=\{String\(count\)\}/u);
	assert.match(source, /<span aria-hidden="true">[\s\S]*?<TextMorphing/u);
	assert.match(source, /<span className="sr-only">\{count\}<\/span>/u);
	assert.match(
		source,
		/<TextEffects[\s\S]*?text="sessions now accounted for\."/u,
	);
	assert.match(source, /autoLoop: false/u);
	assert.match(source, /durationMs: 600/u);
	assert.match(source, /staggerMs: 150/u);
	assert.match(source, /minHeight: AGENT_SESSION_DECK_END_SPACE_PX/u);
});
