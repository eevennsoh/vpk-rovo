const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WEATHER_FILE = path.join(__dirname, "index.tsx");
const CITY_POPOVER_FILE = path.join(__dirname, "city-popover.tsx");
const WEATHER_SOURCE = fs.readFileSync(WEATHER_FILE, "utf8");
const CITY_POPOVER_SOURCE = fs.readFileSync(CITY_POPOVER_FILE, "utf8");

test("Weather keeps the ticking clock state out of the top-level scene", () => {
	assert.doesNotMatch(
		WEATHER_SOURCE,
		/const clock = useLocationClock\(selected\.timezone\);/,
	);
	assert.match(WEATHER_SOURCE, /function WeatherTimeCard\(/);
	assert.match(WEATHER_SOURCE, /function WeatherDateSummary\(/);
	assert.match(
		WEATHER_SOURCE,
		/function SelectedWeatherClock\(/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const clock = useLocationClock\(timezone\);/,
	);
	assert.match(
		WEATHER_SOURCE,
		/<SelectedWeatherClock[\s\S]*timezone=\{selected\.timezone\}/,
	);
	assert.match(
		WEATHER_SOURCE,
		/<WeatherTimeCard[\s\S]*clock=\{clock\}/,
	);
	assert.match(
		WEATHER_SOURCE,
		/<WeatherDateSummary clock=\{clock\} \/>/,
	);
});

test("Weather splits pointer-driven chrome between the top theme control and bottom keyboard hints", () => {
	assert.match(
		WEATHER_SOURCE,
		/import \{ GlassTabs \} from "@\/components\/ui\/glass-tabs";/,
	);
	assert.doesNotMatch(
		WEATHER_SOURCE,
		/import \{ GlassSegmentedControl \} from "\.\/glass-segmented-control";/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const \[pointerViewportZone, setPointerViewportZone\] = React\.useState<"top" \| "bottom" \| null>\(null\);/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const \[isPointerOverSlider, setIsPointerOverSlider\] = React\.useState\(false\);/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const \[isThemeKeyboardVisible, setIsThemeKeyboardVisible\] = React\.useState\(false\);/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const \[themeNavigationPulseKey, setThemeNavigationPulseKey\] = React\.useState\(0\);/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const \[openCityManagerRequestKey, setOpenCityManagerRequestKey\] = React\.useState\(0\);/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const \[isCityManagerOpen, setIsCityManagerOpen\] = React\.useState\(false\);/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const \[cityNavigationPulseKey, setCityNavigationPulseKey\] = React\.useState\(0\);/,
	);
	assert.match(WEATHER_SOURCE, /function WeatherKeyboardHints\(/);
	assert.match(WEATHER_SOURCE, /const revealThemeControlFromKeyboard = React\.useCallback\(\(\) => \{/);
	assert.match(WEATHER_SOURCE, /setIsThemeKeyboardVisible\(true\);/);
	assert.match(WEATHER_SOURCE, /setTimeout\(\(\) => \{\s+setIsThemeKeyboardVisible\(false\);/s);
	assert.match(WEATHER_SOURCE, /keyboardSelectionPulseKey: number;/);
	assert.match(
		WEATHER_SOURCE,
		/isVisible=\{\s+isThemeKeyboardVisible \|\|\s+\(pointerViewportZone === "top" && !isPointerOverSlider\)\s+\}/,
	);
	assert.match(
		WEATHER_SOURCE,
		/<WeatherKeyboardHints isVisible=\{pointerViewportZone === "bottom"\} isEditing=\{isCityManagerOpen\} \/>/,
	);
	assert.match(WEATHER_SOURCE, /<ReturnIcon className="size-3\.5" \/>/);
	assert.match(WEATHER_SOURCE, /Enter (opens city manager|to update cities)/);
	assert.doesNotMatch(WEATHER_SOURCE, /Esc closes search/);
	assert.match(WEATHER_SOURCE, /event\.key === "ArrowUp" \|\| event\.key === "ArrowDown"/);
	assert.match(WEATHER_SOURCE, /const nextSelectedIndex = Math\.max\(/);
	assert.match(WEATHER_SOURCE, /if \(nextSelectedIndex === selectedIndex\) \{/);
	assert.match(WEATHER_SOURCE, /setSelectedIndex\(nextSelectedIndex\);/);
	assert.match(
		WEATHER_SOURCE,
		/setCityNavigationPulseKey\(\(current\) => current \+ 1\);/,
	);
	assert.match(WEATHER_SOURCE, /revealThemeControlFromKeyboard\(\);/);
	assert.match(
		WEATHER_SOURCE,
		/if \(typingTarget \|\| sliderTarget \|\| interactiveTarget\) return;/,
	);
	assert.match(
		WEATHER_SOURCE,
		/const nextIndex = Math\.max\(\s*0,\s*Math\.min\(safeIndex \+ delta, THEME_MODE_ORDER\.length - 1\),\s*\);/s,
	);
	assert.doesNotMatch(
		WEATHER_SOURCE,
		/\(safeIndex \+ delta \+ THEME_MODE_ORDER\.length\) %\s*THEME_MODE_ORDER\.length/,
	);
	assert.match(
		WEATHER_SOURCE,
		/setThemeNavigationPulseKey\(\(current\) => current \+ 1\);/,
	);
	assert.match(WEATHER_SOURCE, /event\.key === "Enter"/);
	assert.match(
		WEATHER_SOURCE,
		/setOpenCityManagerRequestKey\(\(current\) => current \+ 1\);/,
	);
	assert.match(WEATHER_SOURCE, /openRequestKey=\{openCityManagerRequestKey\}/);
	assert.match(WEATHER_SOURCE, /onOpenChange=\{setIsCityManagerOpen\}/);
	assert.match(
		WEATHER_SOURCE,
		/keyboardSelectionPulseKey=\{themeNavigationPulseKey\}/,
	);
	assert.match(
		WEATHER_SOURCE,
		/<GlassTabs[\s\S]*keyboardSelectionPulseKey=\{themeNavigationPulseKey\}/,
	);
	assert.doesNotMatch(WEATHER_SOURCE, /clipPath:/);
	assert.match(
		WEATHER_SOURCE,
		/animate=\{isVisible\s*\?\s*\{ opacity: 1, filter: "blur\(0px\)" \}\s*:\s*\{ opacity: 0, filter: "blur\(16px\)" \}\s*\}/s,
	);
	assert.match(WEATHER_SOURCE, /keyboardNavigationPulseKey=\{cityNavigationPulseKey\}/);
});

test("CityRailEditor opens the city manager with Enter from the focused slider", () => {
	assert.match(CITY_POPOVER_SOURCE, /openRequestKey\?: number;/);
	assert.match(CITY_POPOVER_SOURCE, /onOpenChange\?: \(isOpen: boolean\) => void;/);
	assert.match(CITY_POPOVER_SOURCE, /keyboardNavigationPulseKey\?: number;/);
	assert.match(CITY_POPOVER_SOURCE, /onOpenChange\?\.\(isOpen\);/);
	assert.match(CITY_POPOVER_SOURCE, /if \(openRequestKey <= 0\) return;/);
	assert.match(CITY_POPOVER_SOURCE, /onKeyDown=\{\(event\) => \{/);
	assert.match(CITY_POPOVER_SOURCE, /if \(isOpen \|\| event\.key !== "Enter"\) return;/);
	assert.match(CITY_POPOVER_SOURCE, /target\.closest\('\[role="slider"\]'\)/);
	assert.match(CITY_POPOVER_SOURCE, /setIsOpen\(true\);/);
	assert.match(CITY_POPOVER_SOURCE, /keyboardNavigationPulseKey=\{keyboardNavigationPulseKey\}/);
});

test("CityRailEditor toggles a selected city off when Enter is pressed again", () => {
	assert.match(CITY_POPOVER_SOURCE, /addCity,\s+removeCity,\s+openRequestKey = 0,/s);
	assert.match(
		CITY_POPOVER_SOURCE,
		/if \(cityIndex !== -1 && removeCity\) \{\s+removeCity\(city\.id\);/s,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/if \(cityIndex !== -1 && removeCity\) \{\s+removeCity\(city\.id\);\s+\} else \{\s+addCity\(city\);\s+handleCommit\(cities\.length\);/s,
	);
});

test("CityRailEditor shows checkmarks for every city already in the selected list", () => {
	assert.match(
		CITY_POPOVER_SOURCE,
		/const isSelected = cityIndex !== -1;/,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/className=\"w-full bg-transparent text-sm text-text-subtlest outline-none placeholder:text-text-subtlest\"/,
	);
});
