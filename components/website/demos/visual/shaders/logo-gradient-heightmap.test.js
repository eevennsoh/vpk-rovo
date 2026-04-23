import assert from "node:assert/strict";
import test from "node:test";

import {
	buildLogoGradientHeightmapPixels,
	buildLogoGradientInteriorMask,
	buildLogoGradientOccupancyMaskFromAlpha,
	computeLogoGradientHeightmapWorkSize,
	computeLogoGradientSvgRasterSize,
} from "./logo-gradient-heightmap.ts";

test("svg rasterization follows Framer's 4096px max-side behavior", () => {
	assert.deepEqual(
		computeLogoGradientSvgRasterSize(16, 16),
		{
			width: 4096,
			height: 4096,
		},
	);
});

test("heightmap preprocessing targets a 1024px min side with a 1024^2 area cap", () => {
	assert.deepEqual(
		computeLogoGradientHeightmapWorkSize(4096, 4096),
		{
			width: 1024,
			height: 1024,
		},
	);
});

test("occupancy mask uses alpha only", () => {
	assert.deepEqual(
		Array.from(buildLogoGradientOccupancyMaskFromAlpha([0, 1, 255])),
		[0, 1, 1],
	);
});

test("interior mask keeps only fully enclosed occupied pixels", () => {
	assert.deepEqual(
		Array.from(
			buildLogoGradientInteriorMask(
				new Uint8Array([
					1, 1, 1,
					1, 1, 1,
					1, 1, 1,
				]),
				3,
				3,
			),
		),
		[
			0, 0, 0,
			0, 1, 0,
			0, 0, 0,
		],
	);
});

test("encoded heightmap matches Framer's depth, inverted-alpha, and occupancy channels", () => {
	const pixels = buildLogoGradientHeightmapPixels(
		new Uint8Array([
			0, 0, 0, 0, 0,
			0, 255, 255, 255, 0,
			0, 255, 255, 255, 0,
			0, 255, 255, 255, 0,
			0, 0, 0, 0, 0,
		]),
		5,
		5,
	);

	const centerOffset = (2 * 5 + 2) * 4;
	assert.equal(pixels[centerOffset], 255);
	assert.equal(pixels[centerOffset + 1], 0);
	assert.equal(pixels[centerOffset + 2], 255);
	assert.equal(pixels[centerOffset + 3], 255);

	const cornerOffset = 0;
	assert.equal(pixels[cornerOffset], 0);
	assert.equal(pixels[cornerOffset + 1], 255);
	assert.equal(pixels[cornerOffset + 2], 0);
	assert.equal(pixels[cornerOffset + 3], 255);
});

test("opaque inputs stay fully occupied rather than using a luminance-derived silhouette", () => {
	const pixels = buildLogoGradientHeightmapPixels(
		new Uint8Array([
			255, 255,
			255, 255,
		]),
		2,
		2,
	);

	for (let index = 0; index < pixels.length; index += 4) {
		assert.equal(pixels[index + 1], 0);
		assert.equal(pixels[index + 2], 255);
		assert.equal(pixels[index + 3], 255);
	}
});
