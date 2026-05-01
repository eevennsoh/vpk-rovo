const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GUI_SOURCE = fs.readFileSync(path.join(__dirname, "gui.tsx"), "utf8");

test("GUI.Panel gives every open control panel a spaced inner scroll area", () => {
	assert.match(GUI_SOURCE, /data-gui-panel-scroll="true"/);
	assert.match(GUI_SOURCE, /max-h-\[min\(48svh,32rem\)\] space-y-4 overflow-y-auto overscroll-contain py-1 pr-2 pl-1/);
	assert.match(GUI_SOURCE, /\{open \? \(\s*<div[\s\S]+data-gui-panel-scroll="true"[\s\S]+\{children\}/);
});

test("GUI.Control does not add side insets around slider controls", () => {
	assert.doesNotMatch(GUI_SOURCE, /<Slider[\s\S]+aria-label=\{label\}[\s\S]+className="px-2"/);
	assert.match(GUI_SOURCE, /className="flex justify-between font-mono/);
	assert.doesNotMatch(GUI_SOURCE, /className="flex justify-between px-2 font-mono/);
});
