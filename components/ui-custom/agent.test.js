const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const AGENT_SOURCE = readFileSync(join(__dirname, "agent.tsx"), "utf8");
const RICH_TEXT_EDITOR_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "rich-text-editor.tsx"),
	"utf8",
);
const RICH_TEXT_EDITOR_CSS = readFileSync(
	join(__dirname, "rich-text-editor", "rich-text-editor.css"),
	"utf8",
);
const RICH_TEXT_EXTENSIONS_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "extensions.ts"),
	"utf8",
);
const RICH_TEXT_SUGGESTION_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "suggestion-menu.tsx"),
	"utf8",
);
const RICH_TEXT_TOOLBAR_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "toolbar.tsx"),
	"utf8",
);
const STUDIO_AGENT_RESULT_SOURCE = readFileSync(
	join(__dirname, "..", "..", "backend", "lib", "studio-agent-result.js"),
	"utf8",
);
const STUDIO_SHELL_SOURCE = readFileSync(
	join(__dirname, "..", "projects", "studio", "components", "rovo-app-shell.tsx"),
	"utf8",
);

test("Agent instructions composer uses the shared Tiptap editor", () => {
	assert.match(AGENT_SOURCE, /RichTextEditor,[\s\S]*\} from "@\/components\/ui-custom\/rich-text-editor";/u);
	assert.match(AGENT_SOURCE, /function AgentInstructionsComposer/u);
	assert.match(AGENT_SOURCE, /<RichTextEditor[\s\S]*aria-label="Agent instructions"/u);
	assert.match(AGENT_SOURCE, /placeholder="Describe the agent’s role and what it should do\. @mention, or \/ for skills"/u);
	assert.match(AGENT_SOURCE, /mentionSources=\{mentionSources\}/u);
	assert.match(AGENT_SOURCE, /onMarkdownChange=\{onInstructionsChange\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /AGENT_EDITOR_CONTROLS/u);
});

test("Agent config updates instructions as markdown strings", () => {
	assert.match(
		AGENT_SOURCE,
		/onInstructionsChange=\{\(value\) => onTextChange\?\.\("instructions", value\)\}/u,
	);
	assert.match(AGENT_SOURCE, /fetch\("\/api\/skills"/u);
	assert.match(AGENT_SOURCE, /fetch\("\/api\/wiki\/memory-explorer"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("skill"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("memory"/u);
	assert.doesNotMatch(AGENT_SOURCE, /getHTML\(/u);
	assert.doesNotMatch(AGENT_SOURCE, /instructionsHtml|richInstructions/u);
});

test("Shared Tiptap editor is SSR-safe and emits markdown updates", () => {
	assert.match(RICH_TEXT_EDITOR_SOURCE, /import \{ EditorContent, useEditor \} from "@tiptap\/react";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /contentType: "markdown"/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /immediatelyRender: false/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /"--rich-text-placeholder": toCssString\(placeholder\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /data-empty=\{isEmpty \? "true" : undefined\}/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/onUpdate: \(\{ editor: activeEditor \}\) => \{[\s\S]*const markdown = activeEditor\.getMarkdown\(\);[\s\S]*onMarkdownChangeRef\.current\?\.\(markdown\);/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /editor\.commands\.setContent\(nextValue, \{[\s\S]*contentType: "markdown",[\s\S]*emitUpdate: false/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_SOURCE, /absolute top-0 left-0/u);
});

test("Shared Tiptap placeholder stays aligned with the editable paragraph", () => {
	assert.match(
		RICH_TEXT_EDITOR_CSS,
		/\.rich-text-editor-content\[data-empty="true"\] \.tiptap-editor > p:first-child::before/u,
	);
	assert.match(RICH_TEXT_EDITOR_CSS, /content: var\(--rich-text-placeholder\);/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /float: left;/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /height: 0;/u);
	assert.doesNotMatch(RICH_TEXT_EDITOR_CSS, /position:\s*absolute/u);
});

test("Shared Tiptap extensions wire Markdown, mentions, and slash suggestions", () => {
	for (const importPath of [
		"@tiptap/markdown",
		"@tiptap/extension-mention",
		"@tiptap/suggestion",
	]) {
		assert.match(RICH_TEXT_EXTENSIONS_SOURCE, new RegExp(importPath.replace("/", "\\/"), "u"));
	}

	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /const SlashCommand = Extension\.create/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Suggestion<RichTextCommandItem/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /char: "\/"/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Mention\.configure/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /data-type": "mention"/u);
	assert.match(RICH_TEXT_EXTENSIONS_SOURCE, /Markdown\.configure/u);
});

test("Slash command menu contains every toolbar command", () => {
	for (const command of [
		"Normal text",
		"Heading 1",
		"Heading 2",
		"Heading 3",
		"Quote",
		"Bold",
		"Italic",
		"Underline",
		"Strikethrough",
		"Bulleted list",
		"Numbered list",
		"Align left",
		"Align center",
		"Align right",
		"Link",
	]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(`label: "${command}"`, "u"));
	}
});

test("Mention menu exposes Studio context categories and mention lozenges", () => {
	for (const category of ["Skills", "Links", "Memory", "Triggers", "Tools"]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(category, "u"));
	}

	for (const idPrefix of ["link:", "trigger:", "tool:"]) {
		assert.match(RICH_TEXT_SUGGESTION_SOURCE, new RegExp(`id: "${idPrefix}`, "u"));
	}
	assert.match(AGENT_SOURCE, /toMentionId\("skill"/u);
	assert.match(AGENT_SOURCE, /toMentionId\("memory"/u);

	assert.match(RICH_TEXT_EDITOR_CSS, /\.rich-text-mention/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="skill"\]/u);
	assert.match(RICH_TEXT_EDITOR_CSS, /\[data-mention-category="memory"\]/u);
});

test("Agent creation guidance asks for structured markdown instructions", () => {
	for (const source of [STUDIO_AGENT_RESULT_SOURCE, STUDIO_SHELL_SOURCE]) {
		assert.match(source, /structured Markdown/u);
		assert.match(source, /## Instructions/u);
		assert.match(source, /bold labels/u);
	}

	assert.match(STUDIO_AGENT_RESULT_SOURCE, /- \*\*Summary\*\*/u);
	assert.match(STUDIO_AGENT_RESULT_SOURCE, /## Validation/u);
});

test("Shared toolbar carries the Confluence editor control set", () => {
	for (const control of [
		"Text alignment",
		"Bulleted list",
		"Numbered list",
		"Link",
		"Comment",
		"More options",
	]) {
		assert.match(RICH_TEXT_TOOLBAR_SOURCE, new RegExp(control, "u"));
	}

	for (const command of [
		"toggleBold",
		"toggleItalic",
		"toggleUnderline",
		"toggleStrike",
		"toggleBulletList",
		"toggleOrderedList",
		"setTextAlign",
		"setLink",
	]) {
		assert.match(RICH_TEXT_TOOLBAR_SOURCE, new RegExp(command, "u"));
	}
});
