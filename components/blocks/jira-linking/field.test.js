const assert = require("node:assert/strict");
const test = require("node:test");

const {
	resolveJiraLinkingFrame,
	JIRA_LINKING_MAX_TINT_SUBJECTS,
	JIRA_LINKING_REGION_PADDING_PX,
} = require("./field.ts");

// 160x32 chip centred at (480, 316); its pill corner radius caps at 12.
const SOURCE_RECT = { height: 32, left: 400, top: 300, width: 160 };
const TARGET_ANCHOR = { x: 700, y: 500 };
const TARGET_WIDTH = 240;
const STILL = { x: 0, y: 0 };
// Stand-ins for the theme-resolved `--color-surface` / chin surface tints.
const SOURCE_TINT = [1, 1, 1];
const TARGET_TINT = [0.94, 0.945, 0.95];

function member(id, atlasIndex = -1, tint = [0.2, 0.4, 0.6]) {
	return { atlasIndex, id, tint };
}

function frame(overrides = {}) {
	return resolveJiraLinkingFrame({
		sourceRect: SOURCE_RECT,
		sourceTint: SOURCE_TINT,
		targetAnchor: TARGET_ANCHOR,
		targetTint: TARGET_TINT,
		targetWidth: TARGET_WIDTH,
		fuseProgress: 0,
		members: [member("claude"), member("codex", 1, [0.9, 0.3, 0.1])],
		nearness: 0.5,
		pointer: { x: 480, y: 316 },
		velocity: STILL,
		...overrides,
	});
}

function close(actual, expected, tolerance = 1e-9) {
	assert.ok(
		Math.abs(actual - expected) <= tolerance,
		`expected ${actual} to be within ${tolerance} of ${expected}`,
	);
}

test("nothing is drawn without a measured chip, or while neither near nor fusing", () => {
	assert.equal(frame({ sourceRect: null }), null);
	assert.equal(frame({ fuseProgress: 0, nearness: 0 }), null);
	assert.equal(frame({ fuseProgress: -1, nearness: -1 }), null);
	assert.notEqual(frame({ fuseProgress: 0.01, nearness: 0 }), null);
	assert.notEqual(frame({ fuseProgress: 0, nearness: 0.01 }), null);
});

test("at rest the chip leads, avatars overlap along its leading edge, and the dock trails last", () => {
	const resolved = frame({ fuseProgress: 0 });
	const [chip, first, second, dock] = resolved.balls;

	assert.equal(resolved.balls.length, 4);
	assert.deepEqual(chip, {
		atlasIndex: -1,
		cx: 480,
		cy: 316,
		halfHeight: 16,
		halfWidth: 80,
		radius: 12,
		shape: "pill",
		tint: SOURCE_TINT,
	});
	assert.deepEqual(first, {
		atlasIndex: -1,
		cx: 411,
		cy: 316,
		halfHeight: 11,
		halfWidth: 11,
		radius: 11,
		shape: "circle",
		tint: [0.2, 0.4, 0.6],
	});
	// 14px apart is less than a 22px diameter, so the avatars overlap.
	assert.equal(second.cx - first.cx, 14);
	assert.equal(second.atlasIndex, 1);
	assert.deepEqual(second.tint, [0.9, 0.3, 0.1]);
	assert.deepEqual(dock, {
		atlasIndex: -1,
		cx: 700,
		cy: 500,
		halfHeight: 12,
		halfWidth: 120,
		radius: 6,
		shape: "pill",
		tint: TARGET_TINT,
	});
	assert.equal(resolved.fuseProgress, 0);
});

test("the chip and dock pills take their surface tints from the caller, not a baked white", () => {
	const darkChip = [0.118, 0.122, 0.129];
	const darkDock = [0.161, 0.169, 0.18];
	const resolved = frame({ sourceTint: darkChip, targetTint: darkDock });
	const [chip] = resolved.balls;
	const dock = resolved.balls.at(-1);

	assert.deepEqual(chip.tint, darkChip);
	assert.deepEqual(dock.tint, darkDock);
	// The avatars keep their own identity tints either way.
	assert.deepEqual(resolved.balls[1].tint, [0.2, 0.4, 0.6]);
});

test("half way through the fuse every non-dock ball is half way to the dock and still full size", () => {
	const resolved = frame({ fuseProgress: 0.5, nearness: 0 });
	const [chip, first, , dock] = resolved.balls;

	// easeInOut(0.5) is exactly 0.5.
	close(chip.cx, 590);
	close(chip.cy, 408);
	close(first.cx, 555.5);
	close(first.cy, 408);
	assert.equal(first.radius, 11);
	assert.equal(dock.cx, 700);
	assert.equal(dock.cy, 500);
});

test("the fuse lands every ball on the dock and dissolves the avatars to nothing", () => {
	const resolved = frame({ fuseProgress: 1, nearness: 0 });
	const [chip, first, second, dock] = resolved.balls;

	assert.equal(chip.cx, 700);
	assert.equal(chip.cy, 500);
	for (const avatar of [first, second]) {
		assert.equal(avatar.cx, 700);
		assert.equal(avatar.cy, 500);
		assert.equal(avatar.radius, 0);
		assert.equal(avatar.halfWidth, 0);
		assert.equal(avatar.halfHeight, 0);
	}
	assert.equal(dock.cx, 700);

	// The dissolve only starts over the last 40%.
	assert.equal(frame({ fuseProgress: 0.6, nearness: 0 }).balls[1].radius, 11);
	close(frame({ fuseProgress: 0.8, nearness: 0 }).balls[1].radius, 5.5);
});

test("without a dock anchor the field keeps its slot and never travels", () => {
	const resolved = frame({ targetAnchor: null, fuseProgress: 1, nearness: 0 });

	assert.equal(resolved.balls.length, 3);
	assert.equal(resolved.balls[0].cx, 480);
	assert.equal(resolved.balls[1].cx, 411);
	assert.equal(resolved.balls.filter((ball) => ball.shape === "pill").length, 1);
});

test("only the first two subjects tint the field, however many are linked", () => {
	const crowd = Array.from({ length: 12 }, (_, index) => member(`agent-${index}`, index));

	// chip + 2 avatars + target, no matter how big the cohort is.
	const docked = frame({ members: crowd });
	assert.equal(docked.balls.length, JIRA_LINKING_MAX_TINT_SUBJECTS + 2);
	assert.deepEqual(
		docked.balls.filter((ball) => ball.shape === "circle").map((ball) => ball.atlasIndex),
		[0, 1],
	);

	// The cap is on subjects, not on the slots the target happens to free up.
	const undocked = frame({ targetAnchor: null, members: crowd });
	assert.equal(
		undocked.balls.filter((ball) => ball.shape === "circle").length,
		JIRA_LINKING_MAX_TINT_SUBJECTS,
	);

	// A pair is exactly the cap, and a lone subject is untouched by it.
	assert.equal(frame({ members: crowd.slice(0, 2) }).balls.length, 4);
	assert.equal(frame({ members: crowd.slice(0, 1) }).balls.length, 3);

	// Two subjects is a real mix: the circles keep their own distinct tints.
	const pair = frame({ members: [member("a", 0, [1, 0, 0]), member("b", 1, [0, 0, 1])] });
	assert.deepEqual(
		pair.balls.filter((ball) => ball.shape === "circle").map((ball) => ball.tint),
		[[1, 0, 0], [0, 0, 1]],
	);
});

test("the region is the padded bounding box of every ball extent", () => {
	assert.equal(JIRA_LINKING_REGION_PADDING_PX, 120);

	const chipOnly = frame({ targetAnchor: null, members: [] });
	assert.deepEqual(chipOnly.region, {
		height: 32 + 240,
		left: 400 - 120,
		top: 300 - 120,
		width: 160 + 240,
	});

	// With the dock included the box has to stretch to (820, 512).
	const docked = frame({ members: [] });
	assert.deepEqual(docked.region, {
		height: 512 - 300 + 240,
		left: 400 - 120,
		top: 300 - 120,
		width: 820 - 400 + 240,
	});
});

test("smoothness ramps from a tight 6px seam to a 34px neck as the subjects close", () => {
	close(frame({ fuseProgress: 0, nearness: 0.01 }).smoothness, 6.28);
	assert.equal(frame({ fuseProgress: 0, nearness: 0.5 }).smoothness, 20);
	assert.equal(frame({ fuseProgress: 0, nearness: 1 }).smoothness, 34);
	// Closeness is the stronger of the two signals.
	assert.equal(frame({ fuseProgress: 1, nearness: 0 }).smoothness, 34);
});

test("the neck widens to span a bridgeable chip-to-chin gap, and gives up past one", () => {
	// Chip centre (480, 316) with a 16px half-height; the dock half-height is 12.
	// A dock 92px straight below leaves a 64px surface gap -> 64 * 0.75 = 48.
	const bridgeable = frame({
		targetAnchor: { x: 480, y: 408 },
		fuseProgress: 0,
		nearness: 1,
	});
	assert.equal(bridgeable.smoothness, 48);

	// Half closed, the same geometry only gets half the widened neck.
	assert.equal(
		frame({ targetAnchor: { x: 480, y: 408 }, fuseProgress: 0, nearness: 0.5 }).smoothness,
		27,
	);

	// A 40px gap wants k=30, below the resting maximum, so the seam stays at 34.
	assert.equal(
		frame({ targetAnchor: { x: 480, y: 384 }, fuseProgress: 0, nearness: 1 }).smoothness,
		34,
	);

	// Beyond NECK_MAX_GAP_PX no reachable k bridges the pills, so do not smear.
	assert.equal(
		frame({ targetAnchor: { x: 480, y: 800 }, fuseProgress: 0, nearness: 1 }).smoothness,
		34,
	);

	// With no chin to reach for there is nothing to bridge.
	assert.equal(
		frame({ targetAnchor: null, fuseProgress: 0, nearness: 1 }).smoothness,
		34,
	);
});

test("subject colour lives at the seam and dissolves as the source moves inward", () => {
	// Source centre (480, 316). A 400x300 target centred there swallows it whole,
	// leaving 200px of inset on the shallow axis — far past the 64px fade.
	const buried = frame({
		fuseProgress: 0,
		nearness: 1,
		targetAnchor: { x: 480, y: 316 },
		targetHeight: 300,
		targetWidth: 400,
	});
	assert.equal(buried.tintStrength, 0);

	// Hugging the target's left edge from outside: still a seam, still coloured.
	const outside = frame({
		fuseProgress: 0,
		nearness: 1,
		targetAnchor: { x: 800, y: 316 },
		targetHeight: 300,
		targetWidth: 400,
	});
	assert.equal(outside.tintStrength, 1);

	// Exactly on the border is the last frame at full colour.
	const onBorder = frame({
		fuseProgress: 0,
		nearness: 1,
		targetAnchor: { x: 680, y: 316 },
		targetHeight: 300,
		targetWidth: 400,
	});
	assert.equal(onBorder.tintStrength, 1);

	// 32px in is half the fade depth, so smoothstep puts it at half strength.
	const halfway = frame({
		fuseProgress: 0,
		nearness: 1,
		targetAnchor: { x: 648, y: 316 },
		targetHeight: 300,
		targetWidth: 400,
	});
	assert.equal(halfway.tintStrength, 0.5);

	// The shallow axis wins: deep horizontally but hugging the top edge is a seam.
	const alongTopEdge = frame({
		fuseProgress: 0,
		nearness: 1,
		targetAnchor: { x: 480, y: 466 },
		targetHeight: 300,
		targetWidth: 400,
	});
	assert.equal(alongTopEdge.tintStrength, 1);

	// With nothing to be buried in, colour is never suppressed.
	assert.equal(frame({ targetAnchor: null, fuseProgress: 0, nearness: 1 }).tintStrength, 1);
});

test("the frame names its landing shape so the renderer can fade the interior", () => {
	const docked = frame({ fuseProgress: 0, nearness: 1 });
	assert.equal(docked.targetIndex, docked.balls.length - 1);
	assert.equal(docked.balls[docked.targetIndex].shape, "pill");

	// No target means nothing to fade into, and no ball to point at.
	assert.equal(frame({ targetAnchor: null, fuseProgress: 0, nearness: 1 }).targetIndex, -1);

	// The index still tracks the last slot once the tint cap has applied.
	const crowd = Array.from({ length: 12 }, (_, index) => member(`agent-${index}`));
	const packed = frame({ fuseProgress: 0, members: crowd, nearness: 1 });
	assert.equal(packed.targetIndex, packed.balls.length - 1);
	assert.equal(packed.balls.length, JIRA_LINKING_MAX_TINT_SUBJECTS + 2);
});

test("the target blob takes the caller's shape, and stays a chin-sized pill without one", () => {
	const card = frame({
		fuseProgress: 0,
		nearness: 1,
		targetHeight: 128,
		targetRadius: 10,
		targetWidth: 280,
	});
	const cardTarget = card.balls[card.balls.length - 1];
	assert.equal(cardTarget.halfHeight, 64);
	assert.equal(cardTarget.halfWidth, 140);
	assert.equal(cardTarget.radius, 10);
	assert.equal(cardTarget.shape, "pill");

	// Omitting both keeps the original chin-sized default.
	const chin = frame({ fuseProgress: 0, nearness: 1 });
	const chinTarget = chin.balls[chin.balls.length - 1];
	assert.equal(chinTarget.halfHeight, 12);
	assert.equal(chinTarget.radius, 6);

	// A negative height cannot invert the shape.
	const collapsed = frame({ fuseProgress: 0, nearness: 1, targetHeight: -40 });
	assert.equal(collapsed.balls[collapsed.balls.length - 1].halfHeight, 0);
});

test("the neck measures to the target's surface, not its centre", () => {
	// Source centre (480, 316), half-extents 80x16. A 280x128 card centred at
	// (700, 316) sits 220px away centre-to-centre but only 80px from its left
	// edge, so a centre-to-centre estimate would call this unbridgeable.
	const beside = frame({
		fuseProgress: 0,
		nearness: 1,
		targetAnchor: { x: 700, y: 316 },
		targetHeight: 128,
		targetWidth: 280,
	});
	assert.equal(beside.smoothness, 48);

	// A source already overlapping the card has no gap left to bridge.
	const inside = frame({
		fuseProgress: 0,
		nearness: 1,
		targetAnchor: { x: 520, y: 316 },
		targetHeight: 128,
		targetWidth: 280,
	});
	assert.equal(inside.smoothness, 34);
});

test("dispersion is exactly zero at rest and saturates at 28px per frame", () => {
	assert.equal(frame({ fuseProgress: 1, nearness: 1, velocity: STILL }).dispersion, 0);
	assert.equal(frame({ fuseProgress: 0, nearness: 1, velocity: STILL }).dispersion, 0);

	assert.equal(
		frame({ fuseProgress: 0.5, nearness: 0, velocity: { x: 28, y: 0 } }).dispersion,
		0.5,
	);
	assert.equal(
		frame({ fuseProgress: 1, nearness: 1, velocity: { x: 280, y: 0 } }).dispersion,
		1,
	);
	// Approach disperses at a third of the strength of the fuse.
	close(
		frame({ fuseProgress: 0, nearness: 1, velocity: { x: 0, y: 28 } }).dispersion,
		0.35,
	);
	close(
		frame({ fuseProgress: 0, nearness: 1, velocity: { x: 14, y: 0 } }).dispersion,
		0.175,
	);
});

test("alpha tracks nearness during the approach and collapses over the last 30% of the fuse", () => {
	assert.equal(frame({ fuseProgress: 0, nearness: 0.4 }).alpha, 0.4);
	assert.equal(frame({ fuseProgress: 0.5, nearness: 0 }).alpha, 1);
	assert.equal(frame({ fuseProgress: 0.7, nearness: 0 }).alpha, 1);
	close(frame({ fuseProgress: 0.85, nearness: 0 }).alpha, 0.5, 1e-6);
	assert.equal(frame({ fuseProgress: 1, nearness: 0 }).alpha, 0);
	// A card still under the pointer keeps its backdrop lit through the collapse.
	assert.equal(frame({ fuseProgress: 1, nearness: 0.6 }).alpha, 0.6);
});
