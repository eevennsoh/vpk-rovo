import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const DATA_SOURCE = readFileSync(
	path.join(ROOT, "components/visual/liquid-metal/data.ts"),
	"utf8",
);
const INDEX_SOURCE = readFileSync(
	path.join(ROOT, "components/visual/liquid-metal/index.tsx"),
	"utf8",
);
// The installed package is the upstream contract now — not a vendored copy.
const UPSTREAM_DTS = readFileSync(
	path.join(ROOT, "node_modules/metal-fx/dist/index.d.ts"),
	"utf8",
);
const PACKAGE_JSON = JSON.parse(
	readFileSync(path.join(ROOT, "package.json"), "utf8"),
);

function unionValues(source, typeName) {
	const match = source.match(
		new RegExp(`export (?:declare )?type ${typeName} = ([^;]+);`, "u"),
	);
	assert.ok(match, `missing ${typeName}`);
	return [...match[1].matchAll(/["']([^"']+)["']/gu)].map((m) => m[1]);
}

function optionValues(source, constName) {
	const match = source.match(
		new RegExp(`export const ${constName}[\\s\\S]*?\\];`, "u"),
	);
	assert.ok(match, `missing ${constName}`);
	return [...match[0].matchAll(/value: "([^"]+)"/gu)].map((m) => m[1]);
}

test("Liquid Metal consumes the pinned upstream package, not a fork", () => {
	assert.equal(
		PACKAGE_JSON.dependencies["metal-fx"],
		"1.0.2",
		"metal-fx must stay pinned to the last provenance-attested release",
	);
	assert.match(INDEX_SOURCE, /from "metal-fx"/u);
	assert.doesNotMatch(
		INDEX_SOURCE,
		/vendor\/metal-fx/u,
		"upstream source must not be re-vendored",
	);
	assert.doesNotMatch(DATA_SOURCE, /vendor\/metal-fx/u);
});

test("Liquid Metal documents the shared-canvas material limitation", () => {
	// Upstream renders every visible instance from one shared GL canvas, so
	// `preset` is page-level. Callers must not expect per-instance materials.
	assert.match(INDEX_SOURCE, /shared offscreen\s+\*? ?GL canvas/u);
	assert.match(INDEX_SOURCE, /ONE material at a time/u);
});

test("Liquid Metal option lists match the installed upstream contract", () => {
	assert.deepEqual(unionValues(UPSTREAM_DTS, "MetalFxVariant"), [
		"button",
		"circle",
	]);
	assert.deepEqual(unionValues(UPSTREAM_DTS, "MetalFxPreset"), [
		"chromatic",
		"silver",
		"gold",
	]);
	assert.deepEqual(unionValues(UPSTREAM_DTS, "MetalFxTheme").sort(), [
		"auto",
		"dark",
		"light",
	]);
	assert.match(UPSTREAM_DTS, /export declare const PRESETS: Record</u);

	assert.deepEqual(optionValues(DATA_SOURCE, "LIQUID_METAL_VARIANT_OPTIONS"), [
		"button",
		"circle",
	]);
	// preset options derive from the package at runtime rather than being
	// restated, so they cannot drift from upstream
	assert.match(
		DATA_SOURCE,
		/LIQUID_METAL_PRESET_OPTIONS[\s\S]*?Object\.keys\(PRESETS\)/u,
	);
	assert.deepEqual(optionValues(DATA_SOURCE, "LIQUID_METAL_THEME_OPTIONS"), [
		"auto",
		"dark",
		"light",
	]);
	assert.deepEqual(
		unionValues(DATA_SOURCE, "LiquidMetalReflectionTargetsMode"),
		["none", "refs"],
	);
	assert.deepEqual(
		optionValues(DATA_SOURCE, "LIQUID_METAL_REFLECTION_TARGET_MODE_OPTIONS"),
		["none", "refs"],
	);
});

test("Liquid Metal records which upstream release it tracks", () => {
	assert.match(
		DATA_SOURCE,
		/repository: "https:\/\/github\.com\/Jakubantalik\/metal-fx"/u,
	);
	assert.match(DATA_SOURCE, /packageName: "metal-fx"/u);
	assert.match(DATA_SOURCE, /packageVersion: "1\.0\.2"/u);
	assert.match(DATA_SOURCE, /license: "MIT"/u);
	// vendoring artefacts are gone: the lockfile is the integrity record
	assert.doesNotMatch(DATA_SOURCE, /archiveSha256/u);
	assert.doesNotMatch(DATA_SOURCE, /commit:/u);
});

test("Liquid Metal numeric controls cover all upstream numeric effect props", () => {
	for (const key of [
		"strength",
		"borderRadius",
		"shaderScale",
		"ringCssPx",
		"scale",
	]) {
		assert.match(
			DATA_SOURCE,
			new RegExp(`${key}: \\{ min: [^}]+defaultValue: [^}]+\\}`, "u"),
		);
	}
});

test("Liquid Metal data does not add presentation-only upstream aliases", () => {
	assert.doesNotMatch(DATA_SOURCE, /LiquidMetal(?:Variant|Preset|Theme)/u);
	assert.doesNotMatch(DATA_SOURCE, /graphite|pearl|reflectionMode|PRESENTATION/u);
});
