import assert from "node:assert/strict";
import test from "node:test";

import {
	hexToRgbaUnit,
	hslaToRgbaUnit,
	rgbaUnitToHex,
	rgbaUnitToHsla,
} from "./color-utils.ts";

function assertClose(actual, expected, epsilon = 0.005) {
	assert.ok(
		Math.abs(actual - expected) <= epsilon,
		`Expected ${actual} to be within ${epsilon} of ${expected}`,
	);
}

test("hex colors round-trip with explicit alpha", () => {
	const color = hexToRgbaUnit("#1868DB80");

	assert.deepEqual(color, [24 / 255, 104 / 255, 219 / 255, 128 / 255]);
	assert.equal(rgbaUnitToHex(color), "#1868DB80");
});

test("hex colors without alpha preserve the existing alpha channel", () => {
	const color = hexToRgbaUnit("#171717", 0.35);

	assert.deepEqual(color, [23 / 255, 23 / 255, 23 / 255, 89 / 255]);
});

test("hsla and rgba conversions preserve alpha", () => {
	const rgba = hslaToRgbaUnit(212, 80, 48, 0.42);
	const hsla = rgbaUnitToHsla(rgba);

	assertClose(hsla[0], 212, 0.75);
	assertClose(hsla[1], 80, 0.75);
	assertClose(hsla[2], 48, 0.75);
	assertClose(hsla[3], 0.42, 0.002);
});
