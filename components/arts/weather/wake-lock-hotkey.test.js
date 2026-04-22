const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WEATHER_SOURCE = fs.readFileSync(
	path.join(__dirname, "index.tsx"),
	"utf8",
);

test("Weather opens the wake-lock popover when the W shortcut activates keep-awake", () => {
	assert.match(
		WEATHER_SOURCE,
		/const \[openWakeLockMenuRequestKey, setOpenWakeLockMenuRequestKey\] = React\.useState\(0\);/,
	);
	assert.match(WEATHER_SOURCE, /openRequestKey\?: number;/);
	assert.match(
		WEATHER_SOURCE,
		/React\.useEffect\(\(\) => \{\s+if \(openRequestKey <= lastOpenRequestKeyRef\.current \|\| disabled\) \{\s+return;\s+\}\s+lastOpenRequestKeyRef\.current = openRequestKey;\s+allowNextOpenRef\.current = true;\s+setIsPositionOpen\(true\);\s+setIsTooltipOpen\(false\);\s+\}, \[disabled, openRequestKey\]\);/s,
	);
	assert.match(
		WEATHER_SOURCE,
		/openRequestKey=\{wakeLock\.openRequestKey\}/,
	);
	assert.match(
		WEATHER_SOURCE,
		/if \(normalizedKey === "w"\) \{\s+if \(\s+event\.repeat \|\|\s+hasShortcutModifier \|\|\s+typingTarget \|\|\s+sliderTarget \|\|\s+interactiveTarget \|\|\s+isCityManagerOpen \|\|\s+!isWakeLockSupported\s+\) \{\s+return;\s+\}\s+event\.preventDefault\(\);\s+revealThemeControlFromKeyboard\(\);\s+handleWakeLockToggle\(\);\s+if \(!isWakeLockEnabled\) \{\s+setOpenWakeLockMenuRequestKey\(\(current\) => current \+ 1\);\s+\}\s+if \(wakeLockButtonRef\.current\) \{/s,
	);
	assert.match(
		WEATHER_SOURCE,
		/wakeLock=\{\{[\s\S]*openRequestKey: openWakeLockMenuRequestKey,[\s\S]*\}\}/,
	);
});
