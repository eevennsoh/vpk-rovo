const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const read = (name) => readFileSync(join(__dirname, name), "utf8");

const SHELL_SOURCE = read("card-directory.tsx");
const INTERACTION_SOURCE = read("use-card-interaction.ts");
const PARTS_SOURCE = read("card-directory-parts.tsx");
const AGENT_SOURCE = read("card-directory-agent.tsx");
const SKILL_SOURCE = read("card-directory-skill.tsx");
const TOOL_SOURCE = read("card-directory-tool.tsx");
const TEMPLATE_SOURCE = read("card-directory-template.tsx");
const INDEX_SOURCE = read("index.ts");
const AGENT_BROWSER_SOURCE = readFileSync(
	join(__dirname, "..", "..", "blocks", "agent-browser", "components", "agent-browser.tsx"),
	"utf8",
);

test("shell preserves the bordered surface and hover-elevation classes", () => {
	assert.match(SHELL_SOURCE, /group\/card/u);
	assert.match(SHELL_SOURCE, /rounded-md border border-border bg-surface p-4/u);
	assert.match(SHELL_SOURCE, /focus-visible:ring-3 focus-visible:ring-ring\/50/u);
	assert.match(SHELL_SOURCE, /willChange: "transform"/u);
});

test("shell exposes the keyboard-operable button contract when interactive", () => {
	assert.match(SHELL_SOURCE, /role="button"/u);
	assert.match(SHELL_SOURCE, /tabIndex=\{0\}/u);
	assert.match(SHELL_SOURCE, /onKeyDown=\{handleKeyDown\}/u);
	assert.match(SHELL_SOURCE, /aria-label=\{selectLabel\}/u);
	assert.match(SHELL_SOURCE, /whileTap=\{tapAnimation\}/u);
});

test("interaction hook derives interactivity from onSelect and guards Enter/Space", () => {
	assert.match(INTERACTION_SOURCE, /const interactive = Boolean\(onSelect\)/u);
	assert.match(INTERACTION_SOURCE, /useReducedMotion\(\)/u);
	assert.match(INTERACTION_SOURCE, /event\.key !== "Enter" && event\.key !== " "/u);
	assert.match(INTERACTION_SOURCE, /event\.preventDefault\(\)/u);
});

test("parts carry data-slot attributes for the shared shell pieces", () => {
	for (const slot of [
		"card-directory-header",
		"card-directory-byline",
		"card-directory-description",
		"card-directory-footer",
		"card-directory-stat",
		"card-directory-section",
	]) {
		assert.match(PARTS_SOURCE, new RegExp(`data-slot="${slot}"`, "u"));
	}
});

test("agent variant renders a hexagon avatar with rating and chat stats", () => {
	assert.match(AGENT_SOURCE, /shape="hexagon"/u);
	assert.match(AGENT_SOURCE, /StarUnstarredIcon/u);
	assert.match(AGENT_SOURCE, /AiChatIcon/u);
	assert.match(AGENT_SOURCE, /<CardDirectoryByline/u);
	assert.match(AGENT_SOURCE, /chats/u);
});

test("skill variant uses an icon tile, publisher footer, and view count", () => {
	assert.match(SKILL_SOURCE, /IconTile/u);
	assert.match(SKILL_SOURCE, /@atlaskit\/icon\/core\/eye-open/u);
	assert.match(SKILL_SOURCE, /justify-between/u);
	assert.doesNotMatch(SKILL_SOURCE, /CardDirectoryByline/u);
});

test("tool variant uses an app-logo tile with tool and teammate counts", () => {
	assert.match(TOOL_SOURCE, /@atlaskit\/icon-lab\/core\/wrench/u);
	assert.match(TOOL_SOURCE, /@atlaskit\/icon\/core\/people-group/u);
	assert.match(TOOL_SOURCE, /tools/u);
	assert.match(TOOL_SOURCE, /teammates/u);
	assert.doesNotMatch(TOOL_SOURCE, /CardDirectoryByline/u);
});

test("template variant renders Works with sources and Skills tags, no glow or stats", () => {
	assert.match(TEMPLATE_SOURCE, /TwgToolSourceStack/u);
	assert.match(TEMPLATE_SOURCE, /SkillTagGroup/u);
	assert.match(TEMPLATE_SOURCE, /label="Works with"/u);
	assert.match(TEMPLATE_SOURCE, /label="Skills"/u);
	assert.doesNotMatch(TEMPLATE_SOURCE, /CardGlow|card-glow/u);
	assert.doesNotMatch(TEMPLATE_SOURCE, /StarUnstarredIcon|AiChatIcon/u);
});

test("barrel exports the shell, parts, and four variant wrappers", () => {
	for (const symbol of [
		"CardDirectory",
		"CardDirectoryHeader",
		"CardDirectoryFooter",
		"CardDirectoryStat",
		"CardDirectoryAgent",
		"CardDirectorySkill",
		"CardDirectoryTool",
		"CardDirectoryTemplate",
	]) {
		assert.match(INDEX_SOURCE, new RegExp(`\\b${symbol}\\b`, "u"));
	}
});

test("agent-browser renders the shared CardDirectoryAgent (no inline card duplication)", () => {
	assert.match(AGENT_BROWSER_SOURCE, /import \{ CardDirectoryAgent \} from "@\/components\/ui-custom\/card-directory"/u);
	assert.match(AGENT_BROWSER_SOURCE, /<CardDirectoryAgent/u);
	assert.doesNotMatch(AGENT_BROWSER_SOURCE, /AgentDirectoryCard/u);
	assert.doesNotMatch(AGENT_BROWSER_SOURCE, /AGENT_CARD_HOVER_ANIMATION/u);
});
