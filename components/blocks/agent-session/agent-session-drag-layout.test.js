const assert = require("node:assert/strict");
const test = require("node:test");

const {
	sessionDragPlaceholderClasses,
	sessionDragSourceClasses,
} = require("./agent-session-drag-layout.ts");

/** The suite asserts on the joined list, the way `cn` receives it. */
const placeholder = (state) => sessionDragPlaceholderClasses(state).filter(Boolean).join(" ");
const source = (state) => sessionDragSourceClasses(state).filter(Boolean).join(" ");

const REST = {
	hasDragBind: true,
	isDragging: false,
	isDraggedOut: false,
	isFollower: false,
	preserveSourceFootprint: false,
};

const state = (overrides) => ({ ...REST, ...overrides });

test("a resting bound row reserves nothing and only suppresses native gestures", () => {
	assert.equal(placeholder(REST), "min-w-0");
	assert.match(source(REST), /touch-none select-none/u);
	assert.doesNotMatch(source(REST), /opacity-0|absolute/u);
});

test("an unbound row gets no touch-action override", () => {
	assert.doesNotMatch(
		source(state({ hasDragBind: false })),
		/touch-none|select-none/u,
	);
});

test("a retained source holds its space and dims instead of vanishing", () => {
	// The list must not open a hole where the card was, so the placeholder keeps
	// the measured height and the source stays visible at disabled opacity.
	const retained = state({ isDragging: true, preserveSourceFootprint: true });

	assert.match(placeholder(retained), /relative w-full/u);
	assert.doesNotMatch(placeholder(retained), /h-0/u);
	assert.match(source(retained), /opacity-\(--opacity-disabled\)/u);
	assert.doesNotMatch(source(retained), /opacity-0\b/u);
	assert.match(source(retained), /cursor-grabbing/u);
});

test("a collapsing source keeps the row height until the chip clears it", () => {
	// While the chip still overlaps the row, collapsing to h-0 would yank the
	// list out from under the pointer mid-gesture.
	const overlapping = state({ isDragging: true });
	const cleared = state({ isDragging: true, isDraggedOut: true });

	assert.match(placeholder(overlapping), /h-\[33px\]/u);
	assert.match(placeholder(cleared), /h-0/u);
	assert.doesNotMatch(placeholder(cleared), /h-\[33px\]/u);
});

test("a hidden source is pulled out of flow so it cannot hold space twice", () => {
	for (const hidden of [
		state({ isDragging: true }),
		state({ isFollower: true }),
	]) {
		const className = source(hidden);
		assert.match(className, /pointer-events-none absolute inset-x-0 top-0 opacity-0/u);
	}
});

test("a cohort follower collapses unless its footprint is retained", () => {
	assert.match(
		placeholder(state({ isFollower: true })),
		/h-0 overflow-hidden/u,
	);
	assert.doesNotMatch(
		placeholder(state({ isFollower: true, preserveSourceFootprint: true })),
		/h-0/u,
	);
});
