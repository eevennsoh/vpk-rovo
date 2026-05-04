const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GLASS_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "personal-graph-glass-panel.tsx"),
	"utf8",
);

test("Personal Graph glass panel uses visible liquid glass fallback before SVG filter is ready", () => {
	assert.match(
		GLASS_PANEL_SOURCE,
		/const PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY = 0\.12;/,
	);
	assert.match(
		GLASS_PANEL_SOURCE,
		/fallbackBackgroundOpacity=\{PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY\}/,
	);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /fallbackBackgroundOpacity=\{0\.055\}/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /const PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY = 0\.18;/);
});

test("Personal Graph glass panel uses the requested liquid glass tuning", () => {
	assert.match(GLASS_PANEL_SOURCE, /const PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY = 0\.003;/);
	assert.match(GLASS_PANEL_SOURCE, /backgroundOpacity=\{PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY\}/);
	assert.match(GLASS_PANEL_SOURCE, /blur=\{5\}/);
	assert.match(GLASS_PANEL_SOURCE, /borderOpacity=\{0\.05\}/);
	assert.match(GLASS_PANEL_SOURCE, /brightness=\{50\}/);
	assert.match(GLASS_PANEL_SOURCE, /dispersion=\{4\}/);
	assert.match(GLASS_PANEL_SOURCE, /displace=\{3\}/);
	assert.match(GLASS_PANEL_SOURCE, /distortionScale=\{-64\}/);
	assert.match(GLASS_PANEL_SOURCE, /opacity=\{0\.88\}/);
	assert.match(GLASS_PANEL_SOURCE, /saturation=\{1\.03\}/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /const PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY = 0\.006;/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /brightness=\{68\}/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /distortionScale=\{-118\}/);
});
