const test = require("node:test");
const assert = require("node:assert/strict");

const {
	formatDateForDisplay,
	getHydrationSafeDateFallback,
} = require("./date-format.ts");

test("getHydrationSafeDateFallback returns a stable ISO-style fallback", () => {
	assert.equal(
		getHydrationSafeDateFallback("2026-02-05T00:00:00.000Z"),
		"2026-02-05",
	);
});

test("formatDateForDisplay falls back safely for invalid inputs", () => {
	assert.equal(formatDateForDisplay("not-a-date", "medium"), "not-a-date");
});
