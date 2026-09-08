const assert = require("node:assert/strict");
const test = require("node:test");

const {
	JIRA_LINKING_DEFAULT_RANGE_PX,
	JIRA_LINKING_FUSE_DURATION_MS,
	JIRA_LINKING_FUSE_MIN_PROGRESS,
	advanceJiraLinkingVelocity,
	isJiraLinkingActive,
	resolveJiraLinkingFuseNearness,
	resolveJiraLinkingFuseProgress,
	resolveJiraLinkingNearness,
	lerpJiraLinkingTarget,
} = require("./lifecycle.ts");

test("nearness is a smoothstep ramp, not a linear one", () => {
	assert.equal(resolveJiraLinkingNearness(0), 1);
	assert.equal(resolveJiraLinkingNearness(JIRA_LINKING_DEFAULT_RANGE_PX), 0);
	assert.equal(resolveJiraLinkingNearness(9999), 0);
	// Halfway through the range a linear ramp would read 0.5; smoothstep agrees
	// only at the midpoint, and sits below it at the quarter mark.
	assert.equal(resolveJiraLinkingNearness(60), 0.5);
	assert.ok(resolveJiraLinkingNearness(90) < 0.25);
	assert.equal(resolveJiraLinkingNearness(30, 120), 0.84375);
});

test("nearness refuses to divide by a range it cannot use", () => {
	assert.equal(resolveJiraLinkingNearness(10, 0), 0);
	assert.equal(resolveJiraLinkingNearness(10, -5), 0);
	assert.equal(resolveJiraLinkingNearness(Number.NaN), 0);
});

test("reduced motion vetoes the effect even mid-fuse", () => {
	assert.equal(
		isJiraLinkingActive({ hasRelease: true, nearness: 1, shouldReduceMotion: true }),
		false,
	);
	assert.equal(
		isJiraLinkingActive({ hasRelease: false, nearness: 1, shouldReduceMotion: true }),
		false,
	);
});

test("the effect wakes on any approach and stays awake through the fuse", () => {
	assert.equal(
		isJiraLinkingActive({ hasRelease: false, nearness: 0, shouldReduceMotion: false }),
		false,
	);
	assert.equal(
		isJiraLinkingActive({ hasRelease: false, nearness: 0.01, shouldReduceMotion: null }),
		true,
	);
	assert.equal(
		isJiraLinkingActive({ hasRelease: true, nearness: 0, shouldReduceMotion: false }),
		true,
	);
});

test("an armed fuse never reports a clean zero, so the field cannot blink out", () => {
	assert.equal(resolveJiraLinkingFuseProgress(0), JIRA_LINKING_FUSE_MIN_PROGRESS);
	assert.equal(resolveJiraLinkingFuseProgress(-16), JIRA_LINKING_FUSE_MIN_PROGRESS);
	assert.equal(resolveJiraLinkingFuseProgress(Number.NaN), JIRA_LINKING_FUSE_MIN_PROGRESS);
});

test("fuse progress reaches exactly 1 at the duration token and clamps beyond it", () => {
	assert.equal(resolveJiraLinkingFuseProgress(JIRA_LINKING_FUSE_DURATION_MS / 2), 0.5);
	assert.equal(resolveJiraLinkingFuseProgress(JIRA_LINKING_FUSE_DURATION_MS), 1);
	assert.equal(resolveJiraLinkingFuseProgress(5000), 1);
});

test("fuse nearness decays the approach value to zero so alpha can collapse", () => {
	assert.equal(resolveJiraLinkingFuseNearness(1, 0), 1);
	assert.equal(resolveJiraLinkingFuseNearness(1, 0.25), 0.75);
	assert.equal(resolveJiraLinkingFuseNearness(1, 1), 0);
	assert.equal(resolveJiraLinkingFuseNearness(0.4, 0.5), 0.2);
});

test("out-of-range nearness and progress are clamped rather than extrapolated", () => {
	assert.equal(resolveJiraLinkingFuseNearness(4, 0), 1);
	assert.equal(resolveJiraLinkingFuseNearness(1, 4), 0);
	assert.equal(resolveJiraLinkingFuseNearness(Number.NaN, 0), 0);
});

test("velocity smoothing eases toward the sample instead of snapping to it", () => {
	assert.deepEqual(
		advanceJiraLinkingVelocity({ x: 0, y: 0 }, { x: 10, y: -20 }, 0.5),
		{ x: 5, y: -10 },
	);
	assert.deepEqual(
		advanceJiraLinkingVelocity({ x: 4, y: 4 }, { x: 0, y: 0 }, 0),
		{ x: 4, y: 4 },
	);
	assert.deepEqual(
		advanceJiraLinkingVelocity({ x: 4, y: 4 }, { x: 9, y: 1 }, 1),
		{ x: 9, y: 1 },
	);
});

const CARD = { anchor: { x: 240, y: 372 }, height: 144, radius: 10, width: 272 };
const ROW = { anchor: { x: 240, y: 428 }, height: 24, radius: 6, width: 264 };

test("the landing shape morphs between two rects instead of swapping", () => {
	assert.deepEqual(lerpJiraLinkingTarget(CARD, ROW, 0), CARD);
	assert.deepEqual(lerpJiraLinkingTarget(CARD, ROW, 1), ROW);

	// easeInOut(0.5) is exactly 0.5, so the midpoint is a plain average.
	assert.deepEqual(lerpJiraLinkingTarget(CARD, ROW, 0.5), {
		anchor: { x: 240, y: 400 },
		height: 84,
		radius: 8,
		width: 268,
	});
});

test("a missing shape on either side means no morph, just the other one", () => {
	assert.deepEqual(lerpJiraLinkingTarget(undefined, ROW, 0), ROW);
	assert.deepEqual(lerpJiraLinkingTarget(null, ROW, 0.5), ROW);
	assert.deepEqual(lerpJiraLinkingTarget(CARD, null, 0.5), CARD);
	assert.equal(lerpJiraLinkingTarget(null, null, 0.5), null);
});

test("out-of-range fuse progress cannot overshoot the landing shape", () => {
	assert.deepEqual(lerpJiraLinkingTarget(CARD, ROW, -1), CARD);
	assert.deepEqual(lerpJiraLinkingTarget(CARD, ROW, 4), ROW);
	assert.deepEqual(lerpJiraLinkingTarget(CARD, ROW, Number.NaN), CARD);
});
