const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-brand.tsx"), "utf8");
const HEADER_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-app-header.tsx"), "utf8");
const BACK_BUTTON_SOURCE = fs.readFileSync(path.join(__dirname, "rovo-agent-back-button.tsx"), "utf8");

test("RovoAppBrand agent selector keeps a single selected agent", () => {
	assert.match(SOURCE, /useRovoSelectedAgent/u);
	assert.match(SOURCE, /const selectedAgentIds = useMemo<readonly string\[\]>\(\(\) => \[selectedAgentId\], \[selectedAgentId\]\);/u);
	assert.match(SOURCE, /function handleAgentSelect\(agentId: string\) \{/u);
	assert.match(SOURCE, /selectAgent\(agentId\);/u);
	assert.match(SOURCE, /onAgentToggle=\{handleAgentSelect\}/u);
	assert.match(SOURCE, /selectionMode="single"/u);
	assert.doesNotMatch(SOURCE, /currentIds\.includes\(agentId\)[\s\S]*currentIds\.filter/u);
});

test("RovoAppBrand uses selected-agent actions while a custom agent is active", () => {
	assert.match(SOURCE, /selectedAgentActions = useMemo<readonly AgentSelectorAction\[\]>/u);
	assert.match(SOURCE, /id: "chat-with-rovo"[\s\S]*label: "Chat with Rovo"[\s\S]*resetAgentToRovo\(\);/u);
	assert.match(SOURCE, /id: "edit-agent"[\s\S]*label: "Edit agent"/u);
	assert.match(SOURCE, /heading=\{isCustomAgentSelected \? "Switch to another agent" : undefined\}/u);
	assert.match(SOURCE, /selectedAgentActions=\{selectedAgentActions\}/u);
	assert.match(SOURCE, /const triggerLabel = isRovoAgentProfile\(selectedAgent\) \? "Rovo" : selectedAgent\.name;/u);
	assert.match(SOURCE, /ROVO_APP_BRAND_CONTAINER_VARIANTS/u);
	assert.match(SOURCE, /<AnimatePresence initial=\{false\} mode="wait">/u);
	assert.match(SOURCE, /key=\{selectedAgentId\}/u);
	assert.match(SOURCE, /variants=\{identityItemVariants\}/u);
});

test("fullscreen Rovo header exposes a custom-agent back button", () => {
	assert.match(HEADER_SOURCE, /<RovoAgentBackButton \/>/u);
	assert.match(BACK_BUTTON_SOURCE, /useRovoSelectedAgent/u);
	assert.match(BACK_BUTTON_SOURCE, /isCustomAgentSelected \? \(/u);
	assert.match(BACK_BUTTON_SOURCE, /<AnimatePresence initial=\{false\}>/u);
	assert.match(BACK_BUTTON_SOURCE, /<motion\.div[\s\S]*key="back-to-rovo"[\s\S]*variants=\{buttonVariants\}/u);
	assert.match(BACK_BUTTON_SOURCE, /aria-label="Back to Rovo"/u);
	assert.match(BACK_BUTTON_SOURCE, /onClick=\{resetAgentToRovo\}/u);
});
