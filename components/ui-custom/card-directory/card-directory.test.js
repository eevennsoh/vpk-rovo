const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const read = (name) => readFileSync(join(__dirname, name), "utf8");

const SHELL_SOURCE = read("card-directory.tsx");
const INTERACTION_SOURCE = read("use-card-interaction.ts");
const PARTS_SOURCE = read("card-directory-parts.tsx");
const AGENT_SOURCE = read("card-directory-agent.tsx");
const AGENT_EXPANDED_SOURCE = read("card-directory-agent-expanded.tsx");
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

test("interaction hook uses an animatable transparent border color for Motion", () => {
	assert.match(INTERACTION_SOURCE, /const TRANSPARENT_BORDER_COLOR = "rgba\(0, 0, 0, 0\)"/u);
	assert.match(INTERACTION_SOURCE, /borderColor: TRANSPARENT_BORDER_COLOR/u);
	assert.doesNotMatch(INTERACTION_SOURCE, /borderColor: "transparent"/u);
});

test("parts carry data-slot attributes for the shared shell pieces", () => {
	for (const slot of [
		"card-directory-header",
		"card-directory-byline",
		"card-directory-description",
		"card-directory-footer",
		"card-directory-stat",
		"card-directory-section",
		"card-directory-banner",
		"card-directory-capabilities",
	]) {
		assert.match(PARTS_SOURCE, new RegExp(`data-slot="${slot}"`, "u"));
	}
});

test("header leading is optional and only renders the leading span when present", () => {
	assert.match(PARTS_SOURCE, /leading\?: ReactNode/u);
	assert.match(PARTS_SOURCE, /\{leading \? <span className="shrink-0">\{leading\}<\/span> : null\}/u);
});

test("banner part bleeds the shell padding and draws the hexagon-outlined cover avatar", () => {
	assert.match(PARTS_SOURCE, /-mx-4 -mt-4 overflow-hidden rounded-t-md/u);
	assert.match(PARTS_SOURCE, /backgroundColor: coverColor/u);
	assert.match(PARTS_SOURCE, /getBannerCoverColor/u);
	assert.match(PARTS_SOURCE, /stroke-surface/u);
});

test("capabilities part renders a borderless icon-tile feature list (no inner scroll)", () => {
	assert.match(PARTS_SOURCE, /@atlaskit\/icon-lab\/core\/ai-model/u);
	assert.doesNotMatch(PARTS_SOURCE, /rounded-xl border border-border bg-bg-input/u);
	assert.doesNotMatch(PARTS_SOURCE, /max-h-44/u);
});

test("agent variant renders a hexagon avatar with rating and chat stats", () => {
	assert.match(AGENT_SOURCE, /shape="hexagon"/u);
	assert.match(AGENT_SOURCE, /StarUnstarredIcon/u);
	assert.match(AGENT_SOURCE, /AiChatIcon/u);
	assert.match(AGENT_SOURCE, /<CardDirectoryByline/u);
	assert.match(AGENT_SOURCE, /chats/u);
});

test("expanded agent variant adds a cover banner and scrollable capabilities to the agent layout", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /<CardDirectoryBanner/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<CardDirectoryCapabilities/u);
	assert.match(AGENT_EXPANDED_SOURCE, /capabilities: readonly string\[\]/u);
	assert.match(AGENT_EXPANDED_SOURCE, /StarUnstarredIcon/u);
	assert.match(AGENT_EXPANDED_SOURCE, /AiChatIcon/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<CardDirectoryByline/u);
});

test("expanded agent variant renders Works with sources and Skills tags", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /TwgToolSourceStack/u);
	assert.match(AGENT_EXPANDED_SOURCE, /SkillTagGroup/u);
	assert.match(AGENT_EXPANDED_SOURCE, /label="Works with"/u);
	assert.match(AGENT_EXPANDED_SOURCE, /label="Skills"/u);
});

test("expanded agent variant divides content and renders a metadata + collaborator footer", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /<Separator \/>/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<AvatarGroup/u);
	assert.match(AGENT_EXPANDED_SOURCE, /AvatarGroupCount/u);
	assert.match(AGENT_EXPANDED_SOURCE, /stats\?: ReadonlyArray/u);
	assert.match(AGENT_EXPANDED_SOURCE, /collaborators\?: ReadonlyArray/u);
});

test("expanded agent variant pins the footer below a scrollable body region", () => {
	// flex-1 + min-h-0 + overflow-y-auto gives a scrollable body so the footer stays pinned
	assert.match(AGENT_EXPANDED_SOURCE, /min-h-0 flex-1 flex-col gap-3 overflow-y-auto/u);
});

test("capabilities label is optional and omitted when not provided", () => {
	assert.match(PARTS_SOURCE, /label \? <span/u);
	assert.doesNotMatch(PARTS_SOURCE, /label = "What it can do"/u);
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

test("barrel exports the shell, parts, and variant wrappers", () => {
	for (const symbol of [
		"CardDirectory",
		"CardDirectoryHeader",
		"CardDirectoryFooter",
		"CardDirectoryStat",
		"CardDirectoryBanner",
		"CardDirectoryCapabilities",
		"CardDirectoryAgent",
		"CardDirectoryAgentExpanded",
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
