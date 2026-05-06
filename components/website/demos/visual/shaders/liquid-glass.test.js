const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const LIQUID_GLASS_SOURCE = fs.readFileSync(
	path.join(__dirname, "liquid-glass.tsx"),
	"utf8",
);
const LIQUID_GLASS_BUTTON_SOURCE = fs.readFileSync(
	path.join(__dirname, "liquid-glass-button.tsx"),
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
		/import type \{ CSSProperties, ReactNode, RefObject \} from "react";/,
	);
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

test("LiquidGlass keeps pointer-reactive layers opt-in", () => {
	assert.match(LIQUID_GLASS_SOURCE, /pointerLayers = false,/);
	assert.match(
		LIQUID_GLASS_SOURCE,
		/const pointerTrackingEnabled = resolvedPointerLayers\.length > 0 \|\| pointerInput !== null;/,
	);
	assert.match(
		LIQUID_GLASS_SOURCE,
		/\{resolvedPointerLayers\.length > 0 \? \(/,
	);
});

test("LiquidGlass pointer defaults use VPK token colors instead of copied overlays", () => {
	const pointerDefaultsStart = LIQUID_GLASS_SOURCE.indexOf("const DEFAULT_POINTER_EDGE_COLOR");
	const pointerDefaultsEnd = LIQUID_GLASS_SOURCE.indexOf("const useIsomorphicLayoutEffect");
	const pointerDefaults = LIQUID_GLASS_SOURCE.slice(pointerDefaultsStart, pointerDefaultsEnd);
	const defaultLayersStart = LIQUID_GLASS_SOURCE.indexOf("const DEFAULT_POINTER_LAYERS");
	const defaultLayersEnd = LIQUID_GLASS_SOURCE.indexOf("function formatCssLength");
	const defaultLayers = LIQUID_GLASS_SOURCE.slice(defaultLayersStart, defaultLayersEnd);

	assert.match(pointerDefaults, /var\(--ds-surface-overlay\)/);
	assert.match(pointerDefaults, /var\(--ds-text\)/);
	assert.match(pointerDefaults, /var\(--ds-text-inverse\)/);
	assert.match(defaultLayers, /type: "edge"/);
	assert.doesNotMatch(defaultLayers, /type: "spot"/);
	assert.doesNotMatch(defaultLayers, /radial-gradient/);
	assert.doesNotMatch(pointerDefaults, /bg-black|bg-white|text-white/);
	assert.doesNotMatch(pointerDefaults, /rgba\(\s*(0|255)\s*,\s*(0|255)\s*,\s*(0|255)/);
});

test("LiquidGlass does not copy upstream elastic transform behavior", () => {
	assert.doesNotMatch(LIQUID_GLASS_SOURCE, /calculateElasticTranslation/);
	assert.doesNotMatch(LIQUID_GLASS_SOURCE, /calculateDirectionalScale/);
	assert.doesNotMatch(LIQUID_GLASS_SOURCE, /transformStyle/);
	assert.doesNotMatch(LIQUID_GLASS_SOURCE, /translate\(calc\(-50%/);
	assert.doesNotMatch(LIQUID_GLASS_SOURCE, /onMouseDown=\{\(\) => setIsActive/);
});

test("LiquidGlass measures displacement maps from layout size, not transformed geometry", () => {
	assert.match(LIQUID_GLASS_SOURCE, /const w = el\?\.offsetWidth \?\? 0;/);
	assert.match(LIQUID_GLASS_SOURCE, /const h = el\?\.offsetHeight \?\? 0;/);
	assert.doesNotMatch(LIQUID_GLASS_SOURCE, /const rect = containerRef\.current\?\.getBoundingClientRect\(\);\s+const w = rect\?\.width/);
});

test("LiquidGlassButton owns semantic button interaction and motion", () => {
	assert.match(
		LIQUID_GLASS_BUTTON_SOURCE,
		/export function LiquidGlassButton\(/,
	);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /motion\.button/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /type = "button"/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /disabled = false/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /focus-visible:border-ring/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /whileTap=\{disabled \|\| shouldReduceMotion \? undefined : \{ scale: pressScale \}\}/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /useMotionValue\(0\)/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /--liquid-glass-button-strength/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /--liquid-glass-button-pressed/);
	assert.match(LIQUID_GLASS_BUTTON_SOURCE, /pointer-events-none absolute inset-0/);
});
