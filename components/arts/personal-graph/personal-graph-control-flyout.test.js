const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CONTROL_FLYOUT_SOURCE = fs.readFileSync(
	path.join(__dirname, "personal-graph-control-flyout.tsx"),
	"utf8",
);

test("Personal Graph flyout labels use the tooltip surface treatment", () => {
	assert.match(
		CONTROL_FLYOUT_SOURCE,
		/rounded-md bg-bg-neutral-bold px-3 py-1\.5 text-xs text-text-inverse shadow-md/,
	);
	assert.doesNotMatch(
		CONTROL_FLYOUT_SOURCE,
		/rounded-lg border border-border bg-bg-neutral-subtle px-2\.5 py-1 text-xs font-medium text-text shadow-sm/,
	);
});
