const assert = require("node:assert/strict");
const test = require("node:test");

const {
	calculateUsage,
	findSkillByRouteSegments,
	joinMemoryEntries,
	normalizeRouteSegment,
	splitMemoryEntries,
	summarizeJobs,
} = require("./control-plane-utils.ts");

const {
	CONTROL_PLANE_SURFACES,
	INITIAL_CONTROL_PLANE_JOBS,
	INITIAL_CONTROL_PLANE_SKILLS,
} = require("./control-plane-data.ts");

test("splitMemoryEntries preserves Hermes-style delimiter boundaries", () => {
	assert.deepEqual(
		splitMemoryEntries("alpha\n§\n beta \n§\n\n gamma "),
		["alpha", "beta", "gamma"],
	);
});

test("joinMemoryEntries omits blank entries", () => {
	assert.equal(joinMemoryEntries(["alpha", " ", "beta"]), "alpha\n§\nbeta");
});

test("normalizeRouteSegment converts arbitrary text into a stable segment", () => {
	assert.equal(normalizeRouteSegment(" Bootstrap Automation "), "bootstrap-automation");
});

test("findSkillByRouteSegments resolves a skill by category and slug", () => {
	const skill = findSkillByRouteSegments(INITIAL_CONTROL_PLANE_SKILLS, "automation", "bootstrap-automation");
	assert.equal(skill?.name, "bootstrap-automation");
});

test("control-plane surfaces omit the retired standalone wiki route", () => {
	assert.equal(
		CONTROL_PLANE_SURFACES.some((surface) => surface.href === "/rovo/wiki" || surface.label === "Wiki"),
		false,
	);
});

test("summarizeJobs counts each state", () => {
	assert.deepEqual(summarizeJobs(INITIAL_CONTROL_PLANE_JOBS), {
		failed: 0,
		paused: 1,
		running: 1,
		scheduled: 1,
		total: 3,
	});
});

test("calculateUsage clamps over-capacity inputs", () => {
	assert.deepEqual(calculateUsage(9_000, 8_000), {
		percentage: 100,
		remaining: 0,
	});
});
