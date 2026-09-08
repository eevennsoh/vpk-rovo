import assert from "node:assert/strict";
import test from "node:test";

import {
	DEFAULT_HEATMAP_CONFIG,
	HEATMAP_CONTROL_RANGES,
	HEATMAP_DEFAULT_BACKGROUND,
	HEATMAP_DEFAULT_HEAT_COLORS,
	HEATMAP_HEAT_COLOR_LABELS,
	HEATMAP_MAX_COLORS,
	clampHeatmapConfig,
	normalizeHeatmapHeatColors,
	resolveHeatmapColors,
	resolveHeatmapConfig,
} from "./data.ts";
import {
	DEFAULT_HEATMAP_SHAPE_ID,
	HEATMAP_SHAPE_OPTIONS,
	HEATMAP_SHAPE_SIZE,
	buildHeatmapShape,
	getHeatmapShape,
} from "./shape.ts";

/**
 * Defaults are pinned to the reference effect
 * (https://www.vshaders.sh/effects/heatmap), NOT to the library's own heatmap
 * preset — which differs on outer glow (0.5) and noise (0). Drifting back to the
 * library values is the regression this guards.
 */
test("Heatmap defaults match the reference effect, not the library preset", () => {
	assert.deepEqual(DEFAULT_HEATMAP_CONFIG, {
		colorBack: "#05020D",
		heatColors: HEATMAP_DEFAULT_HEAT_COLORS,
		colorCount: 4,
		contour: 0.5,
		innerGlow: 0.5,
		outerGlow: 0.35,
		angle: 0,
		noise: 0.25,
		speed: 1,
	});
	assert.equal(HEATMAP_DEFAULT_BACKGROUND, "#05020D");
	assert.deepEqual([...HEATMAP_DEFAULT_HEAT_COLORS], ["#260D59", "#D92659", "#FF8C26", "#FFF2BF"]);
});

test("Every reference control has a range, and each range brackets its default", () => {
	const expected = ["colorCount", "contour", "innerGlow", "outerGlow", "angle", "noise", "speed"];
	assert.deepEqual(Object.keys(HEATMAP_CONTROL_RANGES).sort(), [...expected].sort());

	assert.deepEqual(HEATMAP_CONTROL_RANGES.colorCount, { min: 1, max: 4, step: 1 });
	assert.deepEqual(HEATMAP_CONTROL_RANGES.angle, { min: 0, max: 360, step: 1 });
	for (const key of ["contour", "innerGlow", "outerGlow", "noise"]) {
		assert.deepEqual(HEATMAP_CONTROL_RANGES[key], { min: 0, max: 1, step: 0.01 }, key);
	}
	assert.equal(HEATMAP_CONTROL_RANGES.speed.min, 0);

	for (const key of expected) {
		const { min, max } = HEATMAP_CONTROL_RANGES[key];
		const value = DEFAULT_HEATMAP_CONFIG[key];
		assert.ok(value >= min && value <= max, `${key} default ${value} outside ${min}..${max}`);
	}
});

test("There is one panel label per ramp slot", () => {
	assert.equal(HEATMAP_MAX_COLORS, 4);
	assert.equal(HEATMAP_DEFAULT_HEAT_COLORS.length, HEATMAP_MAX_COLORS);
	assert.deepEqual([...HEATMAP_HEAT_COLOR_LABELS], ["Heat 1", "Heat 2", "Heat 3", "Heat 4"]);
});

test("Heat slots are always four long, so a slot index stays addressable", () => {
	assert.equal(normalizeHeatmapHeatColors(undefined).length, HEATMAP_MAX_COLORS);
	assert.deepEqual(normalizeHeatmapHeatColors(["#111111"]), [
		"#111111",
		HEATMAP_DEFAULT_HEAT_COLORS[1],
		HEATMAP_DEFAULT_HEAT_COLORS[2],
		HEATMAP_DEFAULT_HEAT_COLORS[3],
	]);
	// Extra slots are dropped; blanks fall back rather than reaching the shader.
	assert.deepEqual(normalizeHeatmapHeatColors(["#111111", "  ", "#333333", "#444444", "#555555"]), [
		"#111111",
		HEATMAP_DEFAULT_HEAT_COLORS[1],
		"#333333",
		"#444444",
	]);
});

test("Colors control slices the ramp from the cold end without discarding tuned slots", () => {
	const config = resolveHeatmapConfig({ colorCount: 2 });

	assert.deepEqual(resolveHeatmapColors(config), ["#260D59", "#D92659"]);
	// Lowering the count must not mutate the slots themselves.
	assert.equal(config.heatColors.length, HEATMAP_MAX_COLORS);
	assert.equal(config.heatColors[3], "#FFF2BF");

	assert.equal(resolveHeatmapColors(resolveHeatmapConfig({ colorCount: 1 })).length, 1);
	assert.equal(resolveHeatmapColors(resolveHeatmapConfig({ colorCount: 4 })).length, 4);
});

test("resolveHeatmapColors returns a mutable array, as HeatmapParams requires", () => {
	assert.ok(Array.isArray(resolveHeatmapColors(DEFAULT_HEATMAP_CONFIG)));
	assert.ok(!Object.isFrozen(resolveHeatmapColors(DEFAULT_HEATMAP_CONFIG)));
});

test("Out-of-range values are clamped instead of reaching the shader", () => {
	const clamped = clampHeatmapConfig({
		...DEFAULT_HEATMAP_CONFIG,
		colorCount: 9,
		contour: 4,
		innerGlow: -2,
		angle: 900,
		speed: -5,
	});

	assert.equal(clamped.colorCount, HEATMAP_MAX_COLORS);
	assert.equal(clamped.contour, 1);
	assert.equal(clamped.innerGlow, 0);
	assert.equal(clamped.angle, 360);
	assert.equal(clamped.speed, 0);
});

/**
 * Non-finite values have no meaningful clamp target (`Infinity` is as wrong as
 * `NaN`), so they fall back to the default rather than pinning to a bound.
 */
test("Non-finite values fall back to the default, not to a range bound", () => {
	const clamped = clampHeatmapConfig({
		...DEFAULT_HEATMAP_CONFIG,
		outerGlow: Number.NaN,
		noise: Number.POSITIVE_INFINITY,
		contour: Number.NEGATIVE_INFINITY,
	});

	assert.equal(clamped.outerGlow, DEFAULT_HEATMAP_CONFIG.outerGlow);
	assert.equal(clamped.noise, DEFAULT_HEATMAP_CONFIG.noise);
	assert.equal(clamped.contour, DEFAULT_HEATMAP_CONFIG.contour);
});

test("colorCount is always a whole number of slots", () => {
	assert.equal(clampHeatmapConfig({ ...DEFAULT_HEATMAP_CONFIG, colorCount: 2.6 }).colorCount, 3);
	assert.equal(resolveHeatmapColors(resolveHeatmapConfig({ colorCount: 2.6 })).length, 3);
});

test("resolveHeatmapConfig ignores undefined overrides so optional props can be forwarded raw", () => {
	const config = resolveHeatmapConfig(
		{ contour: undefined, speed: undefined },
		{ speed: 2 },
		undefined,
	);

	assert.equal(config.contour, DEFAULT_HEATMAP_CONFIG.contour);
	assert.equal(config.speed, 2);
});

test("Later overrides win, which is how reduced motion forces a static frame", () => {
	assert.equal(resolveHeatmapConfig({ speed: 3 }, { speed: 0 }).speed, 0);
});

test("Every shape source is square, so the library's fixed un-pad factor stays correct", () => {
	for (const option of HEATMAP_SHAPE_OPTIONS) {
		const url = buildHeatmapShape(option.value);
		const svg = decodeURIComponent(url.replace("data:image/svg+xml;utf8,", ""));

		assert.match(svg, new RegExp(`width="${HEATMAP_SHAPE_SIZE}" height="${HEATMAP_SHAPE_SIZE}"`, "u"));
		assert.match(svg, new RegExp(`viewBox="0 0 ${HEATMAP_SHAPE_SIZE} ${HEATMAP_SHAPE_SIZE}"`, "u"));
		// Black shape on a transparent ground is the mask contract the library reads.
		assert.match(svg, /fill="#000"/u);
	}
});

test("The default shape is one of the offered options", () => {
	assert.ok(HEATMAP_SHAPE_OPTIONS.some((option) => option.value === DEFAULT_HEATMAP_SHAPE_ID));
});

test("Distinct shapes produce distinct sources", () => {
	const urls = new Set(HEATMAP_SHAPE_OPTIONS.map((option) => buildHeatmapShape(option.value)));
	assert.equal(urls.size, HEATMAP_SHAPE_OPTIONS.length);
});

/**
 * Byte-identical URLs are the precondition for the library's permanent
 * `suspend()` cache to hit. A fresh string per mount re-pays ~200ms of blocking
 * CPU blur every time.
 */
test("Shape URLs are cached and byte-identical across calls", () => {
	for (const option of HEATMAP_SHAPE_OPTIONS) {
		assert.equal(getHeatmapShape(option.value), getHeatmapShape(option.value));
	}
	assert.equal(getHeatmapShape(), getHeatmapShape(DEFAULT_HEATMAP_SHAPE_ID));
});
