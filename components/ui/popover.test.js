const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
	path.join(__dirname, "popover.tsx"),
	"utf8",
);

test("popover content supports overriding the portal positioner layer", () => {
	assert.match(source, /positionerClassName\?: string/u);
	assert.match(
		source,
		/className=\{cn\("isolate z-50", positionerClassName\)\}/u,
	);
});
