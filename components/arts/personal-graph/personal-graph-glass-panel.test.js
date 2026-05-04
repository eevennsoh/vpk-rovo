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
		/const PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY = 0\.18;/,
	);
	assert.match(
		GLASS_PANEL_SOURCE,
		/fallbackBackgroundOpacity=\{PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY\}/,
	);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /fallbackBackgroundOpacity=\{0\.055\}/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /const PERSONAL_GRAPH_GLASS_FALLBACK_BACKGROUND_OPACITY = 0\.12;/);
});

test("Personal Graph glass panel uses the checkpoint liquid glass tuning", () => {
	assert.match(GLASS_PANEL_SOURCE, /const PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY = 0\.006;/);
	assert.match(GLASS_PANEL_SOURCE, /backgroundOpacity=\{PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY\}/);
	assert.match(GLASS_PANEL_SOURCE, /blur=\{8\}/);
	assert.match(GLASS_PANEL_SOURCE, /borderOpacity=\{0\.05\}/);
	assert.match(GLASS_PANEL_SOURCE, /brightness=\{54\}/);
	assert.match(GLASS_PANEL_SOURCE, /dispersion=\{6\}/);
	assert.match(GLASS_PANEL_SOURCE, /displace=\{5\}/);
	assert.match(GLASS_PANEL_SOURCE, /distortionScale=\{-96\}/);
	assert.match(GLASS_PANEL_SOURCE, /opacity=\{0\.9\}/);
	assert.match(GLASS_PANEL_SOURCE, /saturation=\{1\.08\}/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /const PERSONAL_GRAPH_GLASS_BACKGROUND_OPACITY = 0\.003;/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /brightness=\{68\}/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /distortionScale=\{-118\}/);
});
