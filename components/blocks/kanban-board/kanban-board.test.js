const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");

test("Kanban card focus border stays inside the card and uses the focused border token", () => {
	assert.match(SOURCE, /className="border-2 border-transparent outline-none focus-visible:border-ring"/);
	assert.doesNotMatch(SOURCE, /border: "none"/);
});

test("Kanban drag-over column border stays inside the column and uses the focused border token", () => {
	assert.match(SOURCE, /className="border-2 border-transparent transition-colors"/);
	assert.match(SOURCE, /classList\.add\("border-ring"\)/);
	assert.doesNotMatch(SOURCE, /ring-offset-2/);
	assert.doesNotMatch(SOURCE, /ring-border-bold/);
});
