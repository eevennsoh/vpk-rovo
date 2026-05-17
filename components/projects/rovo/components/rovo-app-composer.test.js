const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const COMPOSER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-composer.tsx"), "utf8");
const SHELL_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-shell.tsx"), "utf8");

test("RovoAppComposer uses the shared edit context bar for open artifacts", () => {
	assert.match(COMPOSER_SOURCE, /import ChatContextBar from "@\/components\/projects\/sidebar-chat\/components\/chat-context-bar";/u);
	assert.match(COMPOSER_SOURCE, /variant: "edit" as const/u);
	assert.match(COMPOSER_SOURCE, /iconName: "artifact" as const/u);
	assert.match(COMPOSER_SOURCE, /<ChatContextBar context=\{artifactContextBar\} onDismiss=\{onDismissArtifactContext\} \/>/u);
	assert.doesNotMatch(COMPOSER_SOURCE, /Editing:/u);
});

test("RovoAppComposer hides the internal vpk-html skill chip while preserving selected skills", () => {
	assert.match(COMPOSER_SOURCE, /const HIDDEN_COMPOSER_SKILL_IDS = new Set\(\["vpk-html"\]\);/u);
	assert.match(COMPOSER_SOURCE, /const visibleSelectedHermesSkills = selectedHermesSkills\.filter/u);
	assert.match(COMPOSER_SOURCE, /!HIDDEN_COMPOSER_SKILL_IDS\.has\(skill\.id\)/u);
	assert.match(COMPOSER_SOURCE, /visibleSelectedHermesSkills\.map/u);
});

test("RovoAppShell adds side gutter for the compact artifact composer", () => {
	assert.match(SHELL_SOURCE, /isArtifactOpen \? "max-w-none px-3" : "max-w-\[800px\]"/u);
});
