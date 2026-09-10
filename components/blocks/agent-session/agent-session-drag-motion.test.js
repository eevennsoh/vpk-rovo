const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");

const {
	measureSessionDragIdentityOrigin,
	SESSION_DRAG_CHIP_ENTER_TARGET,
	SESSION_DRAG_CHIP_ENTER_TRANSITION,
	SESSION_DRAG_CHIP_REDUCED_TRANSITION,
	SESSION_DRAG_IDENTITY_SELECTOR,
} = require("./agent-session-drag-motion.ts");

const CARD_SOURCE = readFileSync(join(__dirname, "agent-session-card.tsx"), "utf8");
const MEDIUM_CARD_SOURCE = readFileSync(join(__dirname, "agent-session-medium-card.tsx"), "utf8");
const MEDIUM_DRAG_SOURCE = readFileSync(join(__dirname, "agent-session-medium-drag.tsx"), "utf8");

/** A host whose marked identity measures to the given box. */
function hostWithIdentity(rect) {
	return {
		querySelector: (selector) =>
			selector === SESSION_DRAG_IDENTITY_SELECTOR
				? { getBoundingClientRect: () => rect }
				: null,
	};
}

test("the chip's origin is the centre of the grabbed row's identity mark", () => {
	assert.deepEqual(
		measureSessionDragIdentityOrigin(
			hostWithIdentity({ height: 32, left: 100, top: 200, width: 32 }),
		),
		{ x: 116, y: 216 },
	);
});

test("an unmarked or already-collapsed row degrades to a plain fade", () => {
	// The row is animating to `h-0` on exactly the frames the chip mounts, so a
	// zero box is a real state, not a defect — both branches must return null so
	// the chip falls back to `x: 0, y: 0` instead of flying from the viewport
	// corner.
	assert.equal(measureSessionDragIdentityOrigin({ querySelector: () => null }), null);
	assert.equal(
		measureSessionDragIdentityOrigin(
			hostWithIdentity({ height: 0, left: 100, top: 200, width: 32 }),
		),
		null,
	);
	assert.equal(
		measureSessionDragIdentityOrigin(
			hostWithIdentity({ height: 32, left: 100, top: 200, width: 0 }),
		),
		null,
	);
});

test("both drag hosts mark an identity for the chip to fly out of", () => {
	// `measureSessionDragIdentityOrigin` returns null when this marker is
	// missing and the chip then fades in place with no error and no warning, so
	// the marker itself is the contract.
	assert.equal(SESSION_DRAG_IDENTITY_SELECTOR, "[data-session-drag-identity]");
	assert.match(CARD_SOURCE, /data-session-drag-identity=""/u);
	assert.match(MEDIUM_CARD_SOURCE, /data-session-drag-identity=""/u);
	// The large card marks outside the select-mark branch, so a markable row and
	// a plain one share one origin.
	assert.match(
		CARD_SOURCE,
		/data-session-drag-identity=""[\s\S]*mark === undefined \|\| mark === null/u,
	);
});

test("the enter transition is the popup-family token pair, resolved once", () => {
	// duration-normal + ease-out-practical, per `.agents/rules/motion-decisions.md`.
	assert.deepEqual(SESSION_DRAG_CHIP_ENTER_TRANSITION, {
		duration: 0.15,
		ease: [0.4, 1, 0.6, 1],
	});
	assert.deepEqual(SESSION_DRAG_CHIP_ENTER_TARGET, { opacity: 1, x: 0, y: 0 });
	// VPK duration tokens resolve to literal ms and never collapse themselves.
	assert.deepEqual(SESSION_DRAG_CHIP_REDUCED_TRANSITION, { duration: 0 });
});

test("the origin is captured on pointerdown and cleared on both drag endings", () => {
	// Measured in the same pointerdown that already reads the source height, and
	// stored as a delta from the pointer so nothing has to read a ref at render.
	assert.match(
		MEDIUM_DRAG_SOURCE,
		/const identityOrigin = measureSessionDragIdentityOrigin\(event\.currentTarget\);\s*\n\s*setChipOrigin\(identityOrigin === null\s*\n\s*\? null\s*\n\s*: \{ x: identityOrigin\.x - event\.clientX, y: identityOrigin\.y - event\.clientY \}\);/u,
	);
	// A stale origin would make the next gesture's chip fly from the previous
	// row, so both endSessionDrag and cancelSessionDrag clear it.
	assert.equal(
		MEDIUM_DRAG_SOURCE.match(/setChipOrigin\(null\);/gu)?.length,
		2,
		"endSessionDrag and cancelSessionDrag must both clear the origin",
	);
	assert.equal(
		MEDIUM_DRAG_SOURCE.match(/setChipSettled\(false\);/gu)?.length,
		2,
		"endSessionDrag and cancelSessionDrag must both re-arm the entrance",
	);
});

test("reduced motion zeroes the chip entrance instead of just shortening it", () => {
	assert.match(MEDIUM_DRAG_SOURCE, /const reduceChipMotion = Boolean\(shouldReduceMotion\);/u);
	// `initial={false}` is what stops the FLIP from playing at all; a zero
	// duration alone would still snap the chip in from the measured origin.
	assert.match(
		MEDIUM_DRAG_SOURCE,
		/initial=\{reduceChipMotion\s*\n\s*\? false/u,
	);
	assert.match(
		MEDIUM_DRAG_SOURCE,
		/transition=\{reduceChipMotion\s*\n\s*\? SESSION_DRAG_CHIP_REDUCED_TRANSITION\s*\n\s*: SESSION_DRAG_CHIP_ENTER_TRANSITION\}/u,
	);
	// No compositor promotion for an animation that is not going to run, and
	// none once the entrance has settled either.
	assert.match(
		MEDIUM_DRAG_SOURCE,
		/willChange: reduceChipMotion \|\| chipSettled \? undefined : "opacity, transform"/u,
	);
	assert.match(MEDIUM_DRAG_SOURCE, /onAnimationComplete=\{\(\) => setChipSettled\(true\)\}/u);
	// Timing comes from the shared token module, never inlined at the callsite.
	assert.match(MEDIUM_DRAG_SOURCE, /from "\.\/agent-session-drag-motion"/u);
	assert.doesNotMatch(MEDIUM_DRAG_SOURCE, /duration: 0\.15/u);
	assert.doesNotMatch(MEDIUM_DRAG_SOURCE, /cubic-bezier/u);
});
