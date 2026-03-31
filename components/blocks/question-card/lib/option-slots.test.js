const test = require("node:test");
const assert = require("node:assert/strict");

const {
	getCustomOptionIndex,
	getNextFocusedIndex,
	getTotalOptionSlots,
	getVisibleOptionCount,
} = require("./option-slots.ts");

test("places the custom input directly after visible generated options", () => {
	assert.equal(getCustomOptionIndex(getVisibleOptionCount(1, 3)), 1);
	assert.equal(getCustomOptionIndex(getVisibleOptionCount(2, 3)), 2);
	assert.equal(getCustomOptionIndex(getVisibleOptionCount(3, 3)), 3);
});

test("always counts the custom input as an additional focusable slot", () => {
	assert.equal(getTotalOptionSlots(getVisibleOptionCount(1, 3)), 2);
	assert.equal(getTotalOptionSlots(getVisibleOptionCount(2, 3)), 3);
	assert.equal(getTotalOptionSlots(getVisibleOptionCount(3, 3)), 4);
});

test("clamps keyboard focus at boundaries instead of wrapping", () => {
	const slotsForTwoGeneratedOptions = getTotalOptionSlots(getVisibleOptionCount(2, 3));
	assert.equal(getNextFocusedIndex(0, slotsForTwoGeneratedOptions, "up"), 0);
	assert.equal(getNextFocusedIndex(2, slotsForTwoGeneratedOptions, "down"), 2);
	// Normal movement within bounds still works
	assert.equal(getNextFocusedIndex(0, slotsForTwoGeneratedOptions, "down"), 1);
	assert.equal(getNextFocusedIndex(2, slotsForTwoGeneratedOptions, "up"), 1);
});
