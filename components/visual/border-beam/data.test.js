import assert from "node:assert/strict";
import test from "node:test";

import {
	BORDER_BEAM_COLOR_VARIANT_OPTIONS,
	BORDER_BEAM_CONTROL_RANGES,
	BORDER_BEAM_DEFAULTS,
	BORDER_BEAM_SIZE_OPTIONS,
	BORDER_BEAM_THEME_OPTIONS,
	getBorderBeamDefaultsForSize,
	getBorderBeamSizeOptions,
} from "./data.ts";

test("Border Beam exposes every upstream size, color, and theme option", () => {
	assert.deepEqual(
		BORDER_BEAM_SIZE_OPTIONS.map((option) => option.value),
		["md", "sm", "line", "pulse-inner", "pulse-outside"],
	);
	// Exactly upstream's closed union. `colorVariant` takes no custom
	// colours and `staticColors` is a boolean, so VPK cannot add one
	// without forking — the old `rovo` variant was removed with the fork.
	assert.deepEqual(
		BORDER_BEAM_COLOR_VARIANT_OPTIONS.map((option) => option.value),
		["colorful", "mono", "ocean", "sunset"],
	);
	assert.deepEqual(
		BORDER_BEAM_THEME_OPTIONS.map((option) => option.value),
		["dark", "light", "auto"],
	);
});

test("Border Beam family options constrain size controls to matching presets", () => {
	assert.deepEqual(
		getBorderBeamSizeOptions("rotate").map((option) => option.value),
		["md", "sm", "line"],
	);
	assert.deepEqual(
		getBorderBeamSizeOptions("pulse").map((option) => option.value),
		["pulse-inner", "pulse-outside"],
	);
});

test("Border Beam size defaults preserve upstream duration and geometry defaults", () => {
	assert.equal(getBorderBeamDefaultsForSize("md").duration, 1.96);
	assert.equal(getBorderBeamDefaultsForSize("line").duration, 3.1);
	assert.equal(getBorderBeamDefaultsForSize("pulse-inner").duration, 2.3);
	assert.equal(getBorderBeamDefaultsForSize("sm").borderRadius, 32);
	assert.equal(getBorderBeamDefaultsForSize("pulse-outside").brightness, 1.9);
	assert.equal(BORDER_BEAM_DEFAULTS.size, "md");
});

test("Border Beam GUI ranges cover all numeric render controls", () => {
	for (const key of [
		"duration",
		"borderRadius",
		"brightness",
		"saturation",
		"hueRange",
		"strength",
	]) {
		assert.ok(
			Object.hasOwn(BORDER_BEAM_CONTROL_RANGES, key),
			`${key} range should exist`,
		);
		assert.ok(
			BORDER_BEAM_CONTROL_RANGES[key].max > BORDER_BEAM_CONTROL_RANGES[key].min,
		);
		assert.ok(BORDER_BEAM_CONTROL_RANGES[key].step > 0);
	}
});
