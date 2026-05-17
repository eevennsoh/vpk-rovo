const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const JOBS_SURFACE_SOURCE = fs.readFileSync(path.join(__dirname, "jobs-surface.tsx"), "utf8");
const CONTROL_PLANE_DATA_SOURCE = fs.readFileSync(
	path.join(__dirname, "lib/control-plane-data.ts"),
	"utf8",
);

test("Jobs surface displays event-triggered Hermes jobs without adding trigger editing", () => {
	assert.match(CONTROL_PLANE_DATA_SOURCE, /ControlPlaneJobSurface = "rovo" \| "research" \| "system" \| "agents-rfp-demo"/u);
	assert.match(JOBS_SURFACE_SOURCE, /function isEventTriggeredJob\(job: ControlPlaneJob \| null\): boolean/u);
	assert.match(JOBS_SURFACE_SOURCE, /job\?\.trigger\?\.type === "jira-column-entered"/u);
	assert.match(JOBS_SURFACE_SOURCE, /getJobTriggerLabel\(job\)/u);
	assert.match(JOBS_SURFACE_SOURCE, /<Badge variant="secondary">event<\/Badge>/u);
	assert.match(JOBS_SURFACE_SOURCE, /This job is event-triggered; the trigger is displayed below\./u);
	assert.match(JOBS_SURFACE_SOURCE, /<div className="font-medium text-text">Event trigger<\/div>/u);
	assert.match(JOBS_SURFACE_SOURCE, /<div className="text-sm font-medium">Run history<\/div>/u);
	assert.match(JOBS_SURFACE_SOURCE, /href=\{`\/rovo\/\$\{encodeURIComponent\(link\.threadId\)\}`\}/u);
	assert.doesNotMatch(JOBS_SURFACE_SOURCE, /onChange=\{\(event\) => setDraft\(\(current\) => \(\{ \.\.\.current, trigger/u);
});
