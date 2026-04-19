import assert from "node:assert/strict";
import test from "node:test";

import {
	SQUIRCLE_DEFAULT_SMOOTHNESS,
	buildObjectBoundingBoxSuperellipsePath,
	buildSuperellipsePath,
	formatCornerShapeSuperellipse,
	mapSmoothnessToCornerShapeValue,
	mapSmoothnessToExponent,
} from "./squircle-shape.ts";

test("default smoothness matches Framer squircle corner-shape", () => {
	assert.equal(SQUIRCLE_DEFAULT_SMOOTHNESS, 100);
	assert.equal(mapSmoothnessToExponent(SQUIRCLE_DEFAULT_SMOOTHNESS), 4);
	assert.equal(mapSmoothnessToCornerShapeValue(SQUIRCLE_DEFAULT_SMOOTHNESS), 2);
	assert.equal(formatCornerShapeSuperellipse(SQUIRCLE_DEFAULT_SMOOTHNESS), "superellipse(2)");
});

test("minimum smoothness resolves to the rectangular fallback exponent", () => {
	assert.equal(mapSmoothnessToExponent(0), 7.5);
});

test("buildSuperellipsePath stays stable for rectangular wide and tall shapes", () => {
	assert.equal(
		buildSuperellipsePath(320, 180, 4, 0, 4),
		"M 320.000 90.000 L 160.000 180.000 L 0.000 90.000 L 160.000 0.000 Z",
	);
	assert.equal(
		buildSuperellipsePath(180, 320, 4, 0, 4),
		"M 180.000 160.000 L 90.000 320.000 L 0.000 160.000 L 90.000 0.000 Z",
	);
});

test("object bounding box path is finite", () => {
	const pathData = buildObjectBoundingBoxSuperellipsePath();
	assert.equal(pathData.includes("NaN"), false);
	assert.equal(pathData.startsWith("M "), true);
	assert.equal(pathData.endsWith(" Z"), true);
});
