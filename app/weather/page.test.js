const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const WEATHER_PAGE_FILE = path.join(__dirname, "page.tsx");
const WEATHER_PAGE_SOURCE = fs.readFileSync(WEATHER_PAGE_FILE, "utf8");

test("WeatherPage preserves a compatibility redirect to the renamed Awake route", () => {
	assert.match(WEATHER_PAGE_SOURCE, /import\s+\{\s*redirect\s*\}\s+from\s+"next\/navigation";/);
	assert.match(WEATHER_PAGE_SOURCE, /redirect\("\/awake"\);/);
});
