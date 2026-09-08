const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	JIRA_LINKING_FULL_DROP_PROFILE,
	JIRA_LINKING_REDUCED_DROP_PROFILE,
	flightsFromLinkingDrop,
	resolveJiraLinkingArcOptions,
	resolveJiraLinkingDropPlayback,
	resolveJiraLinkingDropProfile,
} = require("./drop.ts");

function member(id, name = id) {
	return { id, name };
}

function drop(overrides = {}) {
	return {
		from: overrides.from ?? { x: 10, y: 20 },
		members: overrides.members ?? [member("s1")],
		playback: overrides.playback,
	};
}

test("an unspecified playback is a stagger, so a card drop matches the well", () => {
	assert.equal(resolveJiraLinkingDropPlayback(drop()), "stagger");
	assert.equal(resolveJiraLinkingDropPlayback(drop({ playback: "cohort" })), "cohort");
	assert.equal(resolveJiraLinkingDropPlayback(drop({ playback: "stagger" })), "stagger");
});

test("a four-member stagger receipt is N flights with well-matching delays", () => {
	const flights = flightsFromLinkingDrop(
		drop({
			members: [member("a"), member("b"), member("c"), member("d")],
		}),
		JIRA_LINKING_FULL_DROP_PROFILE,
	);
	const staggerMs = JIRA_LINKING_FULL_DROP_PROFILE.staggerMs;
	assert.equal(flights.length, 4);
	assert.deepEqual(
		flights.map((flight) => flight.delayMs),
		[0, staggerMs, staggerMs * 2, staggerMs * 3],
	);
	assert.deepEqual(
		flights.map((flight) => flight.members.map((item) => item.id)),
		[["a"], ["b"], ["c"], ["d"]],
	);
});

test("a four-member stagger receipt fans launch points", () => {
	const next = drop({
		members: [member("a"), member("b"), member("c"), member("d")],
	});
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	const spread = JIRA_LINKING_FULL_DROP_PROFILE.launchSpreadPx;
	assert.deepEqual(
		flights.map((flight) => flight.from.x - next.from.x),
		[-1.5, -0.5, 0.5, 1.5].map((step) => step * spread),
	);
	assert.deepEqual(
		flights.map((flight) => flight.from.y),
		[next.from.y, next.from.y, next.from.y, next.from.y],
	);
});

test("a cohort playback is one flight from the drop origin", () => {
	const next = drop({
		members: [member("a"), member("b"), member("c"), member("d")],
		playback: "cohort",
	});
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	assert.equal(flights.length, 1);
	assert.equal(flights[0].delayMs, 0);
	assert.deepEqual(flights[0].from, next.from);
	assert.deepEqual(
		flights[0].members.map((item) => item.id),
		["a", "b", "c", "d"],
	);
});

test("a single member does not fan even when staggering", () => {
	const next = drop();
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	assert.equal(flights.length, 1);
	assert.deepEqual(flights[0].from, next.from);
	assert.equal(flights[0].delayMs, 0);
});

test("reduced stagger keeps member flights without delay or spread", () => {
	const next = drop({
		members: [member("a"), member("b")],
	});
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_REDUCED_DROP_PROFILE);
	assert.equal(flights.length, 2);
	assert.deepEqual(flights.map((flight) => flight.delayMs), [0, 0]);
	assert.deepEqual(flights.map((flight) => flight.from), [next.from, next.from]);
	assert.equal(JIRA_LINKING_REDUCED_DROP_PROFILE.travel, "none");
	assert.equal(JIRA_LINKING_REDUCED_DROP_PROFILE.durationMs, 0);
});

test("the drop profile follows reduced motion the way the well does", () => {
	assert.equal(resolveJiraLinkingDropProfile(true), JIRA_LINKING_REDUCED_DROP_PROFILE);
	assert.equal(resolveJiraLinkingDropProfile(false), JIRA_LINKING_FULL_DROP_PROFILE);
	assert.equal(resolveJiraLinkingDropProfile(null), JIRA_LINKING_FULL_DROP_PROFILE);
});

test("card-drop flights use automatic arc direction; peak and stagger stay with the well", () => {
	const {
		JIRA_DROPZONE_FULL_MOTION_PROFILE,
	} = require("../jira-dropzone/lib/jira-dropzone-motion.ts");
	assert.equal(JIRA_LINKING_FULL_DROP_PROFILE.arcPeak, JIRA_DROPZONE_FULL_MOTION_PROFILE.arcPeak);
	assert.equal(
		JIRA_LINKING_FULL_DROP_PROFILE.arcStrength,
		JIRA_DROPZONE_FULL_MOTION_PROFILE.arcStrength,
	);
	assert.equal(JIRA_LINKING_FULL_DROP_PROFILE.direction, "automatic");
	assert.equal(
		JIRA_LINKING_FULL_DROP_PROFILE.durationMs,
		JIRA_DROPZONE_FULL_MOTION_PROFILE.durationMs,
	);
	assert.equal(
		JIRA_LINKING_FULL_DROP_PROFILE.staggerMs,
		JIRA_DROPZONE_FULL_MOTION_PROFILE.staggerMs,
	);
	assert.equal(
		JIRA_LINKING_FULL_DROP_PROFILE.launchSpreadPx,
		JIRA_DROPZONE_FULL_MOTION_PROFILE.launchSpreadPx,
	);
	assert.deepEqual(resolveJiraLinkingArcOptions(JIRA_LINKING_FULL_DROP_PROFILE), {
		peak: 0.5,
		strength: 0.42,
	});
});

test("locked cw and ccw directions pass through to Motion arc options", () => {
	assert.deepEqual(
		resolveJiraLinkingArcOptions({
			...JIRA_LINKING_FULL_DROP_PROFILE,
			direction: "cw",
		}),
		{ direction: "cw", peak: 0.5, strength: 0.42 },
	);
	assert.deepEqual(
		resolveJiraLinkingArcOptions({
			...JIRA_LINKING_FULL_DROP_PROFILE,
			direction: "ccw",
		}),
		{ direction: "ccw", peak: 0.5, strength: 0.42 },
	);
});

test("flight keys are stable for identical input and unique per member", () => {
	const next = drop({
		members: [member("a"), member("b")],
	});
	const first = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	const second = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	assert.deepEqual(
		first.map((flight) => flight.key),
		second.map((flight) => flight.key),
	);
	assert.notEqual(first[0].key, first[1].key);
});
