const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GUI_SOURCE = fs.readFileSync(path.join(__dirname, "gui.tsx"), "utf8");

test("GUI.Panel gives every open control panel an inner scroll area", () => {
	assert.match(GUI_SOURCE, /data-gui-panel-scroll="true"/);
	assert.match(GUI_SOURCE, /max-h-\[min\(48svh,32rem\)\] overflow-y-auto overscroll-contain/);
	assert.match(GUI_SOURCE, /\{open \? \(\s*<div[\s\S]+data-gui-panel-scroll="true"[\s\S]+\{children\}/);
});
