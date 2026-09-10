const assert = require("node:assert/strict");
const test = require("node:test");

const {
	SESSION_FUSION_ASSIGNMENT_RISE_PX,
	SESSION_FUSION_ROW_RADIUS_PX,
	SESSION_FUSION_SHELL_RADIUS_PX,
	SESSION_FUSION_SURFACE_RADIUS_PX,
	toAssignedAgentTransferMember,
	toBoardAgentSessionLinkFlash,
	toSessionFusionAssignmentOrigin,
	toSessionFusionDrop,
	toSessionFusionGlowLandTarget,
	toSessionFusionLandTarget,
	toSessionFusionTarget,
} = require("./session-fusion-overlay-state.ts");

const CARD_BOUNDS = { bottom: 420, left: 100, right: 380, top: 300 };
const SHELL_RECT = { bottom: 444, left: 104, right: 376, top: 300 };
const SURFACE_RECT = { bottom: 412, left: 108, right: 372, top: 304 };
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
		surfaceRect: null,
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

test("a glow release lands on the card surface, not the chin row", () => {
	const landRect = { bottom: 444, left: 108, right: 372, top: 420 };
	const proximity = proximityOf({
		dockRect: SHELL_RECT,
		landRect,
		surfaceRect: SURFACE_RECT,
	});
	const release = toSessionFusionDrop({
		from: { x: 48, y: 90 },
		id: 4,
		members: [CODEX, CLAUDE],
		proximity,
		variant: "glow",
	});
	assert.equal(SESSION_FUSION_SURFACE_RADIUS_PX, 8);
	assert.deepEqual(release?.target, {
		anchor: { x: 240, y: 358 },
		height: 108,
		radius: 8,
		width: 264,
	});
	assert.deepEqual(toSessionFusionGlowLandTarget(proximity), release?.target);
	// The shell is what grows the halo and backdrop pulse, so glow snapshots it
	// even though the chip lands on the surface inside it.
	assert.deepEqual(release?.fromTarget, toSessionFusionTarget(proximity));
	assert.deepEqual(release?.drop.from, { x: 48, y: 90 });
	assert.deepEqual(
		release?.drop.members.map((member) => member.id),
		["codex-1", "claude-1"],
	);
});

test("fuse still lands on the chin row and snapshots no approach shape", () => {
	const release = toSessionFusionDrop({
		from: { x: 48, y: 90 },
		id: 5,
		members: [CLAUDE],
		proximity: proximityOf({
			dockRect: SHELL_RECT,
			landRect: { bottom: 444, left: 108, right: 372, top: 420 },
			surfaceRect: SURFACE_RECT,
		}),
	});
	assert.equal(release?.target.radius, SESSION_FUSION_ROW_RADIUS_PX);
	assert.equal(release?.target.height, 24);
	assert.equal(release?.fromTarget, undefined);
});

test("an unmeasured surface falls back to the shell, then to the drop-zone bounds", () => {
	assert.deepEqual(toSessionFusionGlowLandTarget(proximityOf({ dockRect: SHELL_RECT })), {
		anchor: { x: 240, y: 372 },
		height: 144,
		radius: 8,
		width: 272,
	});
	assert.deepEqual(toSessionFusionGlowLandTarget(proximityOf()), {
		anchor: { x: 240, y: 360 },
		height: 120,
		radius: 8,
		width: 280,
	});
	assert.equal(toSessionFusionGlowLandTarget(null), null);
});

test("glow acknowledges its own drop, so it never earns a chin-row sweep", () => {
	const input = {
		members: [CLAUDE],
		proximity: proximityOf(),
		targetCardCode: "PAY-121",
		token: 11,
	};
	assert.equal(toBoardAgentSessionLinkFlash({ ...input, variant: "glow" }), null);
	// The same drop under fuse still sweeps, so the suppression is the variant's
	// and not a gate the drop failed.
	assert.deepEqual(toBoardAgentSessionLinkFlash({ ...input, variant: "fuse" }), {
		cardCode: "PAY-121",
		flash: { activityIds: ["claude-1"], tint: "#d97757", token: 11 },
	});
});

test("an assigned agent becomes the link subject, seeded so a brand still tints it", () => {
	assert.deepEqual(
		toAssignedAgentTransferMember({
			issue: { issueKey: "PAY-121", summary: "Carry card-artwork metadata" },
			kind: "agent",
			prompt: "Ask \"Rovo\" to help",
			selectedItem: { avatarSrc: "/3p/rovo.png", id: "subagent:rovo", label: "Rovo" },
		}),
		{ avatarSrc: "/3p/rovo.png", id: "subagent:rovo", name: "Rovo", tintSeed: "rovo" },
	);
});

test("only an agent submit names a subject the acknowledgement can point at", () => {
	const issue = { issueKey: "PAY-121", summary: "Carry card-artwork metadata" };
	// Ask Rovo opens a chat, so no agent row lands on the card.
	assert.equal(
		toAssignedAgentTransferMember({ issue, kind: "ask-rovo", prompt: "why" }),
		null,
	);
	// A skill submit does land a row, but the host picks which agent runs it, so
	// the board cannot name the subject and must not guess the skill.
	assert.equal(
		toAssignedAgentTransferMember({
			issue,
			kind: "skill",
			prompt: "Use the \"Ship note\" skill",
			selectedItem: { id: "ship-note", label: "Ship note" },
		}),
		null,
	);
	// An agent submit with nothing selected cannot be a subject either.
	assert.equal(
		toAssignedAgentTransferMember({ issue, kind: "agent", prompt: "Ask" }),
		null,
	);
});

test("an assignment's chip starts over its landing shape, not off to one side", () => {
	// Glow holds x fixed at the origin for the whole flight, so an origin that
	// is not on the landing axis drops the chip in a column beside the card.
	const proximity = proximityOf({ dockRect: SHELL_RECT, surfaceRect: SURFACE_RECT });
	const glowOrigin = toSessionFusionAssignmentOrigin(proximity, "glow");
	const glowTarget = toSessionFusionGlowLandTarget(proximity);
	assert.equal(glowOrigin.x, glowTarget.anchor.x);
	assert.equal(glowOrigin.y, glowTarget.anchor.y - SESSION_FUSION_ASSIGNMENT_RISE_PX);

	// Fuse aims at its own landing shape, so the origin follows that one instead.
	const fuseOrigin = toSessionFusionAssignmentOrigin(proximity, "fuse");
	const fuseTarget = toSessionFusionLandTarget(proximity);
	assert.equal(fuseOrigin.x, fuseTarget.anchor.x);
	assert.equal(fuseOrigin.y, fuseTarget.anchor.y - SESSION_FUSION_ASSIGNMENT_RISE_PX);
	assert.notDeepEqual(glowOrigin, fuseOrigin);

	assert.equal(toSessionFusionAssignmentOrigin(null, "glow"), null);
});

test("an assignment release is the same shape a drop arms", () => {
	const proximity = proximityOf({
		dockRect: SHELL_RECT,
		landRect: { bottom: 444, left: 108, right: 372, top: 420 },
		surfaceRect: SURFACE_RECT,
	});
	const member = toAssignedAgentTransferMember({
		issue: { issueKey: "PAY-121", summary: "Carry card-artwork metadata" },
		kind: "agent",
		prompt: "Ask \"Claude\" to help",
		selectedItem: { id: "subagent:claude", label: "Claude" },
	});
	const release = toSessionFusionDrop({
		from: toSessionFusionAssignmentOrigin(proximity, "glow"),
		id: 12,
		members: [member],
		proximity,
		variant: "glow",
	});
	assert.deepEqual(release.target, toSessionFusionGlowLandTarget(proximity));
	assert.deepEqual(release.fromTarget, toSessionFusionTarget(proximity));
	assert.deepEqual(release.drop.members.map((m) => m.name), ["Claude"]);
	assert.equal(release.drop.from.x, release.target.anchor.x);
	assert.equal(release.id, 12);
});
