const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GLASS_SLIDER_FILE = path.join(__dirname, "glass-slider.tsx");
const GLASS_SLIDER_SOURCE = fs.readFileSync(GLASS_SLIDER_FILE, "utf8");

test("GlassSlider animates parent-driven fill updates while keeping hover and drag sync immediate", () => {
	assert.match(
		GLASS_SLIDER_SOURCE,
		/const skipControlledFillAnimationRef = useRef\(false\);/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/skipControlledFillAnimationRef\.current = true;\s+setValue\(roundValue\(snappedValue, step\)\);/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/skipControlledFillAnimationRef\.current = true;\s+setValue\(roundValue\(newValue, step\)\);/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/if \(skipControlledFillAnimationRef\.current\) \{\s+skipControlledFillAnimationRef\.current = false;\s+fillPercent\.jump\(percentage\);/s,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/if \(!animRef\.current && fillPercent\.get\(\) !== percentage\) \{\s+animateFillTo\(percentage\);/s,
	);
	assert.doesNotMatch(
		GLASS_SLIDER_SOURCE,
		/if \(!isInteracting && !animRef\.current\) \{\s+fillPercent\.jump\(percentage\);/s,
	);
});

test("GlassSlider reuses hover elasticity for keyboard navigation pulses", () => {
	assert.match(
		GLASS_SLIDER_SOURCE,
		/function hoverStretchFromNorm\(norm: number\)/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/function computeHoverStretchFromPercent\(percent: number\)/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/keyboardNavigationPulseKey\?: number;/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/const \[isKeyboardActive, setIsKeyboardActive\] = useState\(false\);/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/const isActive = isInteracting \|\| isHovered \|\| isKeyboardActive;/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/const pulseKeyboardHover = useCallback\(/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/const targetStretch = computeHoverStretchFromPercent\(targetPercent\);/,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/useEffect\(\(\) => \{\s+if \(keyboardNavigationPulseKey <= 0\) return;\s+pulseKeyboardHover\(percentage\);/s,
	);
	assert.match(
		GLASS_SLIDER_SOURCE,
		/pulseKeyboardHover\(percentFromValue\(rounded\)\);/,
	);
});
