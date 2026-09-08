const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	JIRA_DROPZONE_FULL_MOTION_PROFILE,
	JIRA_DROPZONE_REDUCED_MOTION_PROFILE,
	resolveFlightProfile,
	resolveJiraDropzoneArcOptions,
} = require("./lib/jira-dropzone-motion.ts");

test("the default well arc matches Motion arc({ peak, strength })", () => {
	assert.deepEqual(resolveJiraDropzoneArcOptions(JIRA_DROPZONE_FULL_MOTION_PROFILE), {
		peak: 0.5,
		strength: 0.42,
	});
	assert.equal(JIRA_DROPZONE_FULL_MOTION_PROFILE.arcDirection, "automatic");
	assert.equal(JIRA_DROPZONE_FULL_MOTION_PROFILE.arcRotate, 0);
});

test("locked cw and ccw directions pass through to Motion arc options", () => {
	assert.deepEqual(
		resolveJiraDropzoneArcOptions({
			...JIRA_DROPZONE_FULL_MOTION_PROFILE,
			arcDirection: "cw",
		}),
		{ direction: "cw", peak: 0.5, strength: 0.42 },
	);
	assert.deepEqual(
		resolveJiraDropzoneArcOptions({
			...JIRA_DROPZONE_FULL_MOTION_PROFILE,
			arcDirection: "ccw",
		}),
		{ direction: "ccw", peak: 0.5, strength: 0.42 },
	);
});

test("a non-zero rotate is passed through as scaled tangent following", () => {
	assert.deepEqual(
		resolveJiraDropzoneArcOptions({
			...JIRA_DROPZONE_FULL_MOTION_PROFILE,
			arcRotate: 0.9,
		}),
		{ peak: 0.5, rotate: 0.9, strength: 0.42 },
	);
	assert.deepEqual(
		resolveJiraDropzoneArcOptions({
			...JIRA_DROPZONE_FULL_MOTION_PROFILE,
			arcDirection: "cw",
			arcRotate: 0.9,
		}),
		{ direction: "cw", peak: 0.5, rotate: 0.9, strength: 0.42 },
	);
});

test("resolveFlightProfile merges live arc overrides unless motion is reduced", () => {
	assert.equal(resolveFlightProfile(false), JIRA_DROPZONE_FULL_MOTION_PROFILE);
	assert.equal(resolveFlightProfile(null), JIRA_DROPZONE_FULL_MOTION_PROFILE);
	assert.equal(resolveFlightProfile(true), JIRA_DROPZONE_REDUCED_MOTION_PROFILE);
	assert.deepEqual(
		resolveFlightProfile(false, {
			arcDirection: "ccw",
			arcPeak: 0.15,
			arcRotate: 0.9,
			arcStrength: 0.5,
			durationMs: 450,
		}),
		{
			...JIRA_DROPZONE_FULL_MOTION_PROFILE,
			arcDirection: "ccw",
			arcPeak: 0.15,
			arcRotate: 0.9,
			arcStrength: 0.5,
			durationMs: 450,
		},
	);
	assert.equal(
		resolveFlightProfile(true, { arcRotate: 0.9, durationMs: 450 }),
		JIRA_DROPZONE_REDUCED_MOTION_PROFILE,
	);
});
