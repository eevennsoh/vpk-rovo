const test = require("node:test");
const assert = require("node:assert/strict");

const {
	extractTaskHeadingFromLabel,
	formatPlanStepCount,
	resolvePlanVisualIdentity,
	sanitizePlanDescription,
} = require("./plan-identity.ts");

test("extractTaskHeadingFromLabel removes empty parentheses left by stripped file paths", () => {
	assert.equal(
		extractTaskHeadingFromLabel(
			"Create the To-Do page route (`app/todo/page.tsx`) — Build the page UI."
		),
		"Create the To-Do page route",
	);
});

test("formatPlanStepCount uses step wording", () => {
	assert.equal(formatPlanStepCount(1), "1 step");
	assert.equal(formatPlanStepCount(6), "6 steps");
});

test("sanitizePlanDescription normalizes legacy task prefixes to steps", () => {
	assert.equal(
		sanitizePlanDescription("6 tasks • Monitor KPIs, trends, and campaign performance metrics", 6),
		"6 steps • Monitor KPIs, trends, and campaign performance metrics",
	);
});

test("resolvePlanVisualIdentity maps analytics titles to dashboard icon", () => {
	assert.deepEqual(resolvePlanVisualIdentity("Analytics Dashboard"), {
		iconName: "dashboard",
		tileVariant: "orange",
	});
});

test("resolvePlanVisualIdentity maps deploy titles to release icon", () => {
	assert.deepEqual(resolvePlanVisualIdentity("Deploy Pipeline"), {
		iconName: "release",
		tileVariant: "purple",
	});
});

test("resolvePlanVisualIdentity returns stable fallback identity for uncategorized titles", () => {
	assert.deepEqual(
		resolvePlanVisualIdentity("Flexible Friday Plan"),
		resolvePlanVisualIdentity("Flexible Friday Plan"),
	);
	assert.match(resolvePlanVisualIdentity("Flexible Friday Plan").iconName, /^(clipboard|compass|lab\/wrench|settings|lightbulb|app|note|board)$/);
});
