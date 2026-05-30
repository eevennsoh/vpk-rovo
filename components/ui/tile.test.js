const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const TILE_SOURCE = fs.readFileSync(path.join(__dirname, "tile.tsx"), "utf8");

const SIZE_CLASS_EXPECTATIONS = [
	["xxsmall", "size-4", "[font-size:10px]"],
	["xsmall", "size-5", "[font-size:12px]"],
	["small", "size-6", "[font-size:14px]"],
	["medium", "size-8", "[font-size:16px]"],
	["large", "size-10", "[font-size:20px]"],
	["xlarge", "size-12", "[font-size:24px]"],
];

const INSET_CHILD_SIZE_EXPECTATIONS = [
	["xxsmall", "[&_span]:size-2.5!", "[&_img]:size-2.5!", "[&_svg]:size-2.5!"],
	["xsmall", "[&_span]:size-3!", "[&_img]:size-3!", "[&_svg]:size-3!"],
	["small", "[&_span]:size-3.5!", "[&_img]:size-3.5!", "[&_svg]:size-3.5!"],
	["medium", "[&_span]:size-4!", "[&_img]:size-4!", "[&_svg]:size-4!"],
	["large", "[&_span]:size-5!", "[&_img]:size-5!", "[&_svg]:size-5!"],
	["xlarge", "[&_span]:size-6!", "[&_img]:size-6!", "[&_svg]:size-6!"],
];

test("Tile size variants keep tile and content scaling aligned", () => {
	for (const [size, tileClass, fontSizeClass] of SIZE_CLASS_EXPECTATIONS) {
		const match = TILE_SOURCE.match(new RegExp(`\\n\\t\\t\\t\\t${size}: "([^"]*)"`, "u"));

		assert.ok(match, `${size} size variant should exist`);
		assert.deepEqual(match[1].split(" "), [tileClass, fontSizeClass]);
	}
});

test("Tile inset child sizes match the tile font-size scale", () => {
	for (const [size, spanClass, imageClass, svgClass] of INSET_CHILD_SIZE_EXPECTATIONS) {
		const match = TILE_SOURCE.match(new RegExp(`\\n\\t${size}: "([^"]*)"`, "u"));

		assert.ok(match, `${size} inset child size should exist`);
		assert.deepEqual(match[1].split(" "), [spanClass, imageClass, svgClass]);
	}
});
