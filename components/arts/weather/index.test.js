const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WEATHER_FILE = path.join(__dirname, "index.tsx");
const WEATHER_SOURCE = fs.readFileSync(WEATHER_FILE, "utf8");

test("Weather keeps the ticking clock state out of the top-level scene", () => {
	assert.doesNotMatch(
		WEATHER_SOURCE,
		/const clock = useLocationClock\(selected\.timezone\);/,
	);
	assert.match(WEATHER_SOURCE, /function WeatherTimeCard\(/);
	assert.match(WEATHER_SOURCE, /function WeatherDateSummary\(/);
	assert.match(
		WEATHER_SOURCE,
		/<WeatherTimeCard[\s\S]*timezone=\{selected\.timezone\}/,
	);
	assert.match(
		WEATHER_SOURCE,
		/<WeatherDateSummary timezone=\{selected\.timezone\} \/>/,
	);
});
