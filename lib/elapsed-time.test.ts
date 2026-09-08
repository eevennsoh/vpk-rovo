import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { formatElapsedTime, formatRelativeTime } from "./elapsed-time.ts";

test("formatElapsedTime omits zero seconds from exact-minute durations", () => {
	assert.equal(formatElapsedTime(300), "5m");
});

test("formatElapsedTime omits zero minutes from sub-minute durations", () => {
	assert.equal(formatElapsedTime(4), "4s");
});

test("formatElapsedTime keeps padded seconds when a remainder exists", () => {
	assert.equal(formatElapsedTime(304), "5m 04s");
	assert.equal(formatElapsedTime(312), "5m 12s");
});

test("formatElapsedTime hides empty and invalid durations", () => {
	assert.equal(formatElapsedTime(0), "");
	assert.equal(formatElapsedTime(-1), "");
	assert.equal(formatElapsedTime(Number.NaN), "");
});

test("formatRelativeTime uses contextual minute, hour, and day labels", () => {
	assert.equal(formatRelativeTime(5), "Just now");
	assert.equal(formatRelativeTime(5 * 60), "5m ago");
	assert.equal(formatRelativeTime(60 * 60), "1hr ago");
	assert.equal(formatRelativeTime(24 * 60 * 60), "Yesterday");
	assert.equal(formatRelativeTime(3 * 24 * 60 * 60), "3d ago");
});
