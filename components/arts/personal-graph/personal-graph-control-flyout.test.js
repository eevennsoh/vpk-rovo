const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CONTROL_FLYOUT_SOURCE = fs.readFileSync(
	path.join(__dirname, "personal-graph-control-flyout.tsx"),
	"utf8",
);

test("Personal Graph flyout label chips stay off narrow viewports", () => {
	assert.match(
		CONTROL_FLYOUT_SOURCE,
		/className="pointer-events-none absolute right-\[calc\(100%\+12px\)\] top-1\/2 hidden -translate-y-1\/2 whitespace-nowrap rounded-md bg-bg-neutral-bold px-3 py-1\.5 text-xs text-text-inverse shadow-md sm:block"/,
	);
	assert.match(CONTROL_FLYOUT_SOURCE, /aria-label=\{action\.label\}/);
	assert.doesNotMatch(
		CONTROL_FLYOUT_SOURCE,
		/rounded-lg border border-border bg-bg-neutral-subtle px-2\.5 py-1 text-xs font-medium text-text shadow-sm/,
	);
});
