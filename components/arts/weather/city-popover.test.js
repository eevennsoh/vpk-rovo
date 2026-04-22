const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CITY_POPOVER_FILE = path.join(__dirname, "city-popover.tsx");
const CITY_POPOVER_SOURCE = fs.readFileSync(CITY_POPOVER_FILE, "utf8");

test("CityRailEditor consumes each parent open request only once so Escape can close the manager", () => {
	assert.match(CITY_POPOVER_SOURCE, /const handledOpenRequestKeyRef = useRef\(0\);/);
	assert.match(
		CITY_POPOVER_SOURCE,
		/if \(\s*openRequestKey <= 0 \|\|\s*openRequestKey === handledOpenRequestKeyRef\.current\s*\) \{\s*return;\s*\}/s,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/handledOpenRequestKeyRef\.current = openRequestKey;\s+playSound\("\/sound\/click-001\.mp3"\);\s+setIsOpen\(true\);\s+setHighlightedIndex\(0\);/s,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/if \(event\.key === "Escape"\) \{\s+playSound\("\/sound\/click-004\.mp3"\);\s+setIsOpen\(false\);\s+return;\s+\}/s,
	);
	assert.match(CITY_POPOVER_SOURCE, /\}, \[openRequestKey\]\);/);
	assert.doesNotMatch(
		CITY_POPOVER_SOURCE,
		/if \(openRequestKey <= 0 \|\| isOpen\) return;/,
	);
});

test("CityRailEditor keeps the manager open when mouse clicks toggle a city row", () => {
	assert.match(
		CITY_POPOVER_SOURCE,
		/const toggleCitySelection = useCallback\(\s*\(city: LockscreenLocation, cityIndex: number\) => \{\s*const isRemoving = cityIndex !== -1 && Boolean\(removeCity\);\s*playSound\(isRemoving \? "\/sound\/click-004\.mp3" : "\/sound\/click-001\.mp3"\);\s*if \(cityIndex !== -1 && removeCity\) \{\s*removeCity\(city\.id\);\s*\} else \{\s*addCity\(city\);\s*handleCommit\(cities\.length\);\s*\}\s*\},\s*\[addCity, cities\.length, handleCommit, removeCity\],\s*\);/s,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/const handleCityRowPress = useCallback\(\s*\(city: LockscreenLocation, cityIndex: number\) => \{\s*toggleCitySelection\(city, cityIndex\);\s*\},\s*\[toggleCitySelection\],\s*\);/s,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/if \(event\.key === "Enter"\) \{\s*event\.preventDefault\(\);\s*const city = filteredCities\[highlightedIndex\];\s*if \(!city\) return;\s*const cityIndex = cities\.findIndex\(\(item\) => item\.id === city\.id\);\s*toggleCitySelection\(city, cityIndex\);\s*\}/s,
	);
	assert.doesNotMatch(
		CITY_POPOVER_SOURCE,
		/const handleCityRowPress = useCallback\(\s*\(city: LockscreenLocation, cityIndex: number\) => \{[\s\S]*setIsOpen\(false\);[\s\S]*\},\s*\[toggleCitySelection\],\s*\);/s,
	);
});

test("CityRailEditor lets the city rows use the full list width", () => {
	assert.match(
		CITY_POPOVER_SOURCE,
		/className="scrollbar-auto-hide absolute inset-0 overflow-y-auto"/,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/scrollbarGutter: "auto",/,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/scrollbarWidth: "none",/,
	);
});

test("CityRailEditor gives the floating add and pin buttons the standard VPK focus ring", () => {
	assert.match(
		CITY_POPOVER_SOURCE,
		/Add city"[\s\S]*focus-visible:border-ring focus-visible:ring-ring\/50 focus-visible:ring-3 focus-visible:outline-none/s,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring\/50 focus-visible:ring-3 focus-visible:outline-none/,
	);
	assert.match(
		CITY_POPOVER_SOURCE,
		/group-focus-within\/city-rail:opacity-100/,
	);
});
