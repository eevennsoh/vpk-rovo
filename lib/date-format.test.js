const test = require("node:test");
const assert = require("node:assert/strict");

const {
	formatDateForDisplay,
	formatRelativeDateForDisplay,
	getHydrationSafeDateFallback,
	isDateOverdue,
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

test("formatRelativeDateForDisplay falls back safely for invalid inputs", () => {
	assert.equal(formatRelativeDateForDisplay("not-a-date"), "not-a-date");
});

test("isDateOverdue compares by date key instead of exact timestamp", () => {
	assert.equal(
		isDateOverdue("2026-04-01", new Date("2026-04-01T23:59:59.000Z")),
		false,
	);
	assert.equal(
		isDateOverdue("2026-03-31", new Date("2026-04-01T00:00:00.000Z")),
		true,
	);
});
