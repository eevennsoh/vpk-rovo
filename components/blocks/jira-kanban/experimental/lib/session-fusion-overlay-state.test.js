const assert = require("node:assert/strict");
const test = require("node:test");

const {
	SESSION_FUSION_ROW_RADIUS_PX,
	SESSION_FUSION_SHELL_RADIUS_PX,
	toBoardAgentSessionLinkFlash,
	toSessionFusionDrop,
	toSessionFusionLandTarget,
	toSessionFusionTarget,
} = require("./session-fusion-overlay-state.ts");

const CARD_BOUNDS = { bottom: 420, left: 100, right: 380, top: 300 };
const SHELL_RECT = { bottom: 444, left: 104, right: 376, top: 300 };
const CLAUDE = { id: "claude-1", name: "Claude", tintSeed: "claude" };
const CODEX = { id: "codex-1", name: "Codex", tintSeed: "openai-codex" };

function proximityOf(overrides = {}) {
	return {
		bounds: CARD_BOUNDS,
		cardCode: "PAY-121",
		distance: 0,
		dockRect: null,
		landRect: null,
		nearness: 1,
		...overrides,
	};
}

test("the approach target is the whole card shell, not a strip at its lip", () => {
	assert.equal(SESSION_FUSION_SHELL_RADIUS_PX, 10);
	assert.deepEqual(toSessionFusionTarget(proximityOf({ dockRect: SHELL_RECT })), {
		anchor: { x: 240, y: 372 },
		height: 144,
		radius: 10,
		width: 272,
	});
});

test("an unmeasured shell falls back to the drop-zone bounds", () => {
	assert.deepEqual(toSessionFusionTarget(proximityOf()), {
		anchor: { x: 240, y: 360 },
		height: 120,
		radius: 10,
		width: 280,
	});
	assert.equal(toSessionFusionTarget(null), null);
});

test("an inverted or empty rect cannot produce a negative shape", () => {
	assert.deepEqual(
		toSessionFusionTarget(proximityOf({
			dockRect: { bottom: 0, left: 40, right: 10, top: 50 },
		})),
		{ anchor: { x: 25, y: 25 }, height: 0, radius: 10, width: 0 },
	);
});

test("a drop only flashes when the proximity winner is the drop target", () => {
	for (const input of [
		{ proximity: proximityOf(), targetCardCode: null },
		{ proximity: null, targetCardCode: "PAY-121" },
		{ proximity: proximityOf({ cardCode: "PAY-9" }), targetCardCode: "PAY-121" },
	]) {
		assert.equal(
			toBoardAgentSessionLinkFlash({ members: [CLAUDE], token: 1, ...input }),
			null,
		);
	}
});

test("the flash names the rows that were added and wears the lead agent's mark", () => {
	assert.deepEqual(
		toBoardAgentSessionLinkFlash({
			members: [CLAUDE],
			proximity: proximityOf(),
			targetCardCode: "PAY-121",
			token: 7,
		}),
		{
			cardCode: "PAY-121",
			flash: { activityIds: ["claude-1"], tint: "#d97757", token: 7 },
		},
	);

	// A cohort sweeps every row it added, in the lead session's colour.
	const cohort = toBoardAgentSessionLinkFlash({
		members: [CODEX, CLAUDE],
		proximity: proximityOf(),
		targetCardCode: "PAY-121",
		token: 8,
	});
	assert.deepEqual(cohort.flash.activityIds, ["codex-1", "claude-1"]);
	assert.equal(cohort.flash.tint, "#3941ff");
});

test("an unmapped brand still flashes, on a neutral accent", () => {
	const flash = toBoardAgentSessionLinkFlash({
		members: [{ id: "mystery-1", name: "Mystery", tintSeed: "mystery" }],
		proximity: proximityOf(),
		targetCardCode: "PAY-121",
		token: 9,
	});
	assert.equal(flash.flash.tint, "var(--color-bg-accent-gray-bolder)");
});

test("an attach drop arms staggered flights into the chin row, not the shell centre", () => {
	const landRect = { bottom: 444, left: 108, right: 372, top: 420 };
	const release = toSessionFusionDrop({
		from: { x: 48, y: 90 },
		id: 3,
		members: [CODEX, CLAUDE],
		proximity: proximityOf({ dockRect: SHELL_RECT, landRect }),
	});
	assert.equal(SESSION_FUSION_ROW_RADIUS_PX, 6);
	assert.deepEqual(release?.target, {
		anchor: { x: 240, y: 432 },
		height: 24,
		radius: 6,
		width: 264,
	});
	assert.deepEqual(
		toSessionFusionLandTarget(proximityOf({ dockRect: SHELL_RECT, landRect })),
		release?.target,
	);
	assert.equal(release?.id, 3);
	assert.equal(release?.drop.playback, "stagger");
	assert.deepEqual(release?.drop.from, { x: 48, y: 90 });
	assert.deepEqual(
		release?.drop.members.map((member) => [member.id, member.name]),
		[["codex-1", "Codex"], ["claude-1", "Claude"]],
	);
});

test("an unmeasured chin still aims at the bottom of the shell", () => {
	assert.deepEqual(toSessionFusionLandTarget(proximityOf({ dockRect: SHELL_RECT })), {
		anchor: { x: 240, y: 432 },
		height: 24,
		radius: 6,
		width: 272,
	});
	assert.deepEqual(toSessionFusionLandTarget(proximityOf()), {
		anchor: { x: 240, y: 408 },
		height: 24,
		radius: 6,
		width: 280,
	});
	assert.equal(toSessionFusionLandTarget(null), null);
});

test("flights do not arm without a card or a member", () => {
	assert.equal(
		toSessionFusionDrop({
			from: { x: 1, y: 1 },
			id: 1,
			members: [CLAUDE],
			proximity: null,
		}),
		null,
	);
	assert.equal(
		toSessionFusionDrop({
			from: { x: 1, y: 1 },
			id: 1,
			members: [],
			proximity: proximityOf(),
		}),
		null,
	);
});

test("an empty cohort has no row to acknowledge", () => {
	assert.equal(
		toBoardAgentSessionLinkFlash({
			members: [],
			proximity: proximityOf(),
			targetCardCode: "PAY-121",
			token: 10,
		}),
		null,
	);
});
