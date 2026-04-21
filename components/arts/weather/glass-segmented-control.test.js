const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GLASS_SEGMENTED_CONTROL_FILE = path.join(
	__dirname,
	"glass-segmented-control.tsx",
);
const GLASS_SEGMENTED_CONTROL_SOURCE = fs.readFileSync(
	GLASS_SEGMENTED_CONTROL_FILE,
	"utf8",
);

test("GlassSegmentedControl uses a tighter selection animation for keyboard navigation", () => {
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const KEYBOARD_SPRING = \{/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const KEYBOARD_MAX_STRETCH_PX = 8;/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const KEYBOARD_STRETCH_RATIO = 0\.06;/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/keyboardSelectionPulseKey\?: number;/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const selectionInputModeRef = useRef<"pointer" \| "keyboard">\("pointer"\);/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/selectionInputModeRef\.current = "keyboard";/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const isKeyboardSelection = selectionInputModeRef\.current === "keyboard";/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const motionSpring = isKeyboardSelection \? KEYBOARD_SPRING : SPRING;/,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/if \(isKeyboardSelection\) \{\s+leftAnimRef\.current = animate\(pillLeft, target\.left, motionSpring\);\s+widthAnimRef\.current = animate\(pillWidth, target\.width, motionSpring\);\s+return;\s+\}/s,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const stretchCap = isKeyboardSelection\s+\? KEYBOARD_MAX_STRETCH_PX\s+\: MAX_STRETCH_PX;/s,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/const stretchRatio = isKeyboardSelection\s+\? KEYBOARD_STRETCH_RATIO\s+\: PILL_STRETCH_RATIO;/s,
	);
	assert.match(
		GLASS_SEGMENTED_CONTROL_SOURCE,
		/if \(keyboardSelectionPulseKey === previousKeyboardSelectionPulseKeyRef\.current\) \{/,
	);
});
