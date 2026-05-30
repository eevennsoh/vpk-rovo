import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { buildPlan, frameToProps, staggerSlots, willChangeFor } from "./lib.ts";

test("staggerSlots: normal mode is identity order", () => {
	assert.deepEqual(staggerSlots(4, "normal"), [0, 1, 2, 3]);
});

test("staggerSlots: center-out reveals middle first and radiates outward", () => {
	// n=5, center=2: order by distance [2,1,3,0,4] -> position->slot map.
	assert.deepEqual(staggerSlots(5, "center-out"), [3, 1, 0, 2, 4]);
});

test("buildPlan: per-word keeps spaces static and staggers only words", () => {
	const plan = buildPlan("a bb\ncc", "word");
	assert.equal(plan.count, 3);
	assert.equal(plan.lines.length, 2);

	const [first, second] = plan.lines;
	assert.deepEqual(
		first.map((t) => ({ text: t.text, animate: t.animate, slot: t.slot })),
		[
			{ text: "a", animate: true, slot: 0 },
			{ text: " ", animate: false, slot: -1 },
			{ text: "bb", animate: true, slot: 1 },
		],
	);
	assert.deepEqual(
		second.map((t) => ({ text: t.text, animate: t.animate, slot: t.slot })),
		[{ text: "cc", animate: true, slot: 2 }],
	);
});

test("buildPlan: per-character leaves space glyphs unstaggered", () => {
	const plan = buildPlan("ab c", "char");
	assert.equal(plan.count, 3);
	const slots = plan.lines[0].map((t) => t.slot);
	assert.deepEqual(slots, [0, 1, -1, 2]);
});

test("buildPlan: per-line treats each line as one animated unit", () => {
	const plan = buildPlan("x\ny", "line");
	assert.equal(plan.count, 2);
	assert.deepEqual(
		plan.lines.map((line) => line.map((t) => ({ text: t.text, slot: t.slot }))),
		[[{ text: "x", slot: 0 }], [{ text: "y", slot: 1 }]],
	);
});

test("frameToProps: maps blur to a filter string and passes transforms through", () => {
	assert.deepEqual(frameToProps({ opacity: 0, y: 16, blur: 12 }), {
		opacity: 0,
		y: 16,
		filter: "blur(12px)",
	});
	assert.deepEqual(frameToProps({ opacity: 1, x: 0, scale: 1 }), { opacity: 1, x: 0, scale: 1 });
});

test("willChangeFor: lists only animated GPU-friendly properties", () => {
	assert.equal(willChangeFor({ opacity: 0, y: 16, blur: 12 }, { opacity: 1, y: 0, blur: 0 }), "opacity, transform, filter");
	assert.equal(willChangeFor({ opacity: 0 }, { opacity: 1 }), "opacity");
	assert.equal(willChangeFor({ x: -48 }, { x: 0 }), "transform");
});
