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
const RICH_TEXT_TOOLBAR_SOURCE = readFileSync(
	join(__dirname, "rich-text-editor", "toolbar.tsx"),
	"utf8",
);

test("Agent instructions composer uses the shared Tiptap editor", () => {
	assert.match(AGENT_SOURCE, /import \{ RichTextEditor \} from "@\/components\/ui-custom\/rich-text-editor";/u);
	assert.match(AGENT_SOURCE, /function AgentInstructionsComposer/u);
	assert.match(AGENT_SOURCE, /<RichTextEditor[\s\S]*aria-label="Agent instructions"/u);
	assert.match(AGENT_SOURCE, /placeholder="Describe the agent’s role and what it should do\. @mention, or \/ for skills"/u);
	assert.match(AGENT_SOURCE, /onPlainTextChange=\{onInstructionsChange\}/u);
	assert.doesNotMatch(AGENT_SOURCE, /AGENT_EDITOR_CONTROLS/u);
});

test("Agent config updates instructions as plain text only", () => {
	assert.match(
		AGENT_SOURCE,
		/onInstructionsChange=\{\(value\) => onTextChange\?\.\("instructions", value\)\}/u,
	);
	assert.doesNotMatch(AGENT_SOURCE, /getHTML\(/u);
	assert.doesNotMatch(AGENT_SOURCE, /instructionsHtml|richInstructions/u);
});

test("Shared Tiptap editor is SSR-safe and emits plain text updates", () => {
	assert.match(RICH_TEXT_EDITOR_SOURCE, /import \{ EditorContent, useEditor \} from "@tiptap\/react";/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /immediatelyRender: false/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /"--rich-text-placeholder": toCssString\(placeholder\)/u);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /data-empty=\{isEmpty \? "true" : undefined\}/u);
	assert.match(
		RICH_TEXT_EDITOR_SOURCE,
		/onUpdate: \(\{ editor: activeEditor \}\) => \{[\s\S]*onPlainTextChangeRef\.current\?\.\(getEditorPlainText\(activeEditor\)\);/u,
	);
	assert.match(RICH_TEXT_EDITOR_SOURCE, /editor\.commands\.setContent\(plainTextToEditorHtml\(nextValue\), \{[\s\S]*emitUpdate: false/u);
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
