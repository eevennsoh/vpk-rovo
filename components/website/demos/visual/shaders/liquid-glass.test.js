const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const LIQUID_GLASS_SOURCE = fs.readFileSync(
	path.join(__dirname, "liquid-glass.tsx"),
	"utf8",
);

test("LiquidGlass starts with a deterministic blur fallback before support detection", () => {
	assert.match(
		LIQUID_GLASS_SOURCE,
		/const FALLBACK_BACKDROP_FILTER = "blur\(14px\) saturate\(1\.4\)";/,
	);
	assert.match(LIQUID_GLASS_SOURCE, /backdropSupported === null/);
	assert.match(LIQUID_GLASS_SOURCE, /backdropFilter: FALLBACK_BACKDROP_FILTER/);
	assert.match(LIQUID_GLASS_SOURCE, /WebkitBackdropFilter: FALLBACK_BACKDROP_FILTER/);
	assert.doesNotMatch(
		LIQUID_GLASS_SOURCE,
		/no backdrop-filter"\s+fallback on the server and first client render/,
	);
});

test("LiquidGlass initializes SVG support before the first client paint", () => {
	assert.match(
		LIQUID_GLASS_SOURCE,
		/import \{ useCallback, useEffect, useId, useLayoutEffect, useRef, useState \} from "react";/,
	);
	assert.match(
		LIQUID_GLASS_SOURCE,
		/const useIsomorphicLayoutEffect =\s+typeof window === "undefined" \? useEffect : useLayoutEffect;/,
	);
	assert.match(
		LIQUID_GLASS_SOURCE,
		/useIsomorphicLayoutEffect\(\(\) => \{\s+updateDisplacementMap\(\);/,
	);
	assert.match(LIQUID_GLASS_SOURCE, /useIsomorphicLayoutEffect\(\(\) => \{\s+const check = \(\) => \{/);
});

test("LiquidGlass only applies the SVG filter after a displacement map exists", () => {
	assert.match(LIQUID_GLASS_SOURCE, /const \[filterReady, setFilterReady\] = useState\(false\);/);
	assert.match(
		LIQUID_GLASS_SOURCE,
		/if \(!href\) \{\s+setFilterReady\(false\);\s+return;\s+\}/,
	);
	assert.match(LIQUID_GLASS_SOURCE, /setFilterReady\(true\);/);
	assert.match(LIQUID_GLASS_SOURCE, /if \(svgSupported && filterReady\) \{/);
	assert.doesNotMatch(LIQUID_GLASS_SOURCE, /if \(svgSupported\) \{/);
});
