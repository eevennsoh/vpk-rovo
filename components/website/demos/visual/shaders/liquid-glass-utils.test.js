import assert from "node:assert/strict";
import test from "node:test";

import {
	buildLiquidGlassChannelScales,
	buildLiquidGlassDisplacementImageHref,
	getLiquidGlassDisplacementMetrics,
} from "./liquid-glass-utils.ts";

test("blur is scaled into the displacement map's higher internal resolution", () => {
	const metrics = getLiquidGlassDisplacementMetrics(200, 400, 50, 0.05, 8);

	assert.deepEqual(
		metrics,
		{
			innerW: 400,
			innerH: 800,
			scaledRadius: 100,
			edgeSize: 10,
			scaledBlur: 16,
		},
	);
});

test("dispersion offsets the red and blue channel scales around the base distortion", () => {
	assert.deepEqual(
		buildLiquidGlassChannelScales(-90, 6),
		{
			red: -96,
			green: -90,
			blue: -84,
		},
	);
});

test("embedded displacement SVG uses gaussian blur only when blur is non-zero", () => {
	const hrefWithBlur = buildLiquidGlassDisplacementImageHref({
		width: 200,
		height: 400,
		borderRadius: 50,
		borderWidth: 0.05,
		brightness: 50,
		blur: 8,
		opacity: 0.93,
		redGradId: "red",
		blueGradId: "blue",
		blurFilterId: "inner-blur",
	});
	const svgWithBlur = decodeURIComponent(hrefWithBlur.slice("data:image/svg+xml,".length));
	assert.match(svgWithBlur, /<feGaussianBlur stdDeviation="16"/);
	assert.match(svgWithBlur, /filter="url\(#inner-blur\)"/);

	const hrefWithoutBlur = buildLiquidGlassDisplacementImageHref({
		width: 200,
		height: 400,
		borderRadius: 50,
		borderWidth: 0.05,
		brightness: 50,
		blur: 0,
		opacity: 0.93,
		redGradId: "red",
		blueGradId: "blue",
		blurFilterId: "inner-blur",
	});
	const svgWithoutBlur = decodeURIComponent(hrefWithoutBlur.slice("data:image/svg+xml,".length));
	assert.equal(svgWithoutBlur.includes("feGaussianBlur"), false);
	assert.equal(svgWithoutBlur.includes('filter="url(#inner-blur)"'), false);
});
