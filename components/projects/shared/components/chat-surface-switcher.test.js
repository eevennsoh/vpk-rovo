const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
	path.join(__dirname, "chat-surface-switcher.tsx"),
	"utf8",
);

test("chat surface switcher calls the surface switch hook before switching to the selected surface", () => {
	assert.match(
		source,
		/const handleSelectSurface = \(surface: CurrentSurface\) => \{\s*onSurfaceSwitch\?\.\(surface\);\s*switchSurface\(surface\);\s*\};/u,
	);
	assert.match(
		source,
		/onSelect=\{\(\) => handleSelectSurface\("sidebar"\)\}[\s\S]*>\s*Side panel/u,
	);
	assert.match(
		source,
		/onSelect=\{\(\) => handleSelectSurface\("floating"\)\}[\s\S]*>\s*Floating/u,
	);
	assert.doesNotMatch(source, /<DropdownMenuItem[\s\S]*?onClick=/u);
});
