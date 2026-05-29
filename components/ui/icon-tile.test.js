const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ICON_TILE_SOURCE = fs.readFileSync(path.join(__dirname, "icon-tile.tsx"), "utf8");

const SIZE_CLASS_EXPECTATIONS = [
	["xsmall", "size-5", "[font-size:12px]", "[&_span]:size-3!", "[&_svg]:size-3!"],
	["small", "size-6", "[font-size:14px]", "[&_span]:size-3.5!", "[&_svg]:size-3.5!"],
	["medium", "size-8", "[font-size:16px]", "[&_span]:size-4!", "[&_svg]:size-4!"],
	["large", "size-10", "[font-size:20px]", "[&_span]:size-5!", "[&_svg]:size-5!"],
	["xlarge", "size-12", "[font-size:24px]", "[&_span]:size-6!", "[&_svg]:size-6!"],
];

test("IconTile size variants keep ADS tile and icon scaling aligned", () => {
	for (const [size, tileClass, fontSizeClass, spanClass, svgClass] of SIZE_CLASS_EXPECTATIONS) {
		const match = ICON_TILE_SOURCE.match(new RegExp(`\\n\\t\\t\\t\\t${size}: "([^"]*)"`, "u"));

		assert.ok(match, `${size} size variant should exist`);
		assert.deepEqual(match[1].split(" "), [tileClass, fontSizeClass, spanClass, svgClass]);
	}
});
