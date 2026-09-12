const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const EXPERIMENTAL_SOURCE = readFileSync(join(__dirname, "experimental", "experimental-jira-kanban.tsx"), "utf8");
const EXPERIMENTAL_CARD_SOURCE = readFileSync(join(__dirname, "experimental", "experimental-jira-kanban-card.tsx"), "utf8");
const EXPERIMENTAL_PAGE_SOURCE = [
	readFileSync(join(__dirname, "experimental", "page.tsx"), "utf8"),
	readFileSync(join(__dirname, "experimental", "experimental-page-types.ts"), "utf8"),
].join("\n");

test("Kanban assignment catalog starts from the shared AgentSelector directory", () => {
	const catalogSource = readFileSync(join(__dirname, "lib", "agent-catalog.ts"), "utf8");
	assert.match(catalogSource, /export function mergeJiraKanbanAgentCatalog\(/u);
	assert.match(catalogSource, /ROVO_AGENT_SELECTOR_AGENTS/u);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /ROVO_AGENT_SELECTOR_AGENTS/u);
});

test("Experimental kanban variant reuses the shared board data contracts", () => {
	// Types and state helpers stay shared so both variants remain swappable
	// inside an owning surface.
	assert.match(EXPERIMENTAL_SOURCE, /import type \{[\s\S]*JiraKanbanProps,\n\} from "\.\.\/index";/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /import \{ createJiraKanbanColumns \} from "\.\.\/jira-kanban-data";/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /\} from "\.\.\/state";/u);
	assert.doesNotMatch(EXPERIMENTAL_SOURCE, /^export interface JiraKanbanProps/mu);
});
