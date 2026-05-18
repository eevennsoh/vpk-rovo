const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROGRESS_TRACKER_SOURCE = fs.readFileSync(path.join(__dirname, "progress-tracker.tsx"), "utf8");

test("ProgressTracker supports optional bylines and warning steps without replacing default labels", () => {
	assert.match(PROGRESS_TRACKER_SOURCE, /export type ProgressTrackerStepState = "todo" \| "current" \| "done" \| "warning"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /label: React\.ReactNode/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /byline\?: React\.ReactNode/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /labelClassName\?: string/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /bylineClassName\?: string/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /import WarningIcon from "@atlaskit\/icon\/core\/warning"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /state === "warning"[\s\S]*token\("color\.icon\.warning"\)/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /data-slot="progress-tracker-label"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /data-slot="progress-tracker-byline"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /typeof step\.label === "string" \? step\.label\.trim\(\) : ""/u);
});
