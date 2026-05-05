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

test("Personal Graph glass panel exposes the chromatic RGB preset", () => {
	assert.match(GLASS_PANEL_SOURCE, /export const PERSONAL_GRAPH_CHROMATIC_RGB_GLASS_PROPS = \{/);
	assert.match(GLASS_PANEL_SOURCE, /blur: 4,/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /blur: 0\.45,/);
	assert.match(GLASS_PANEL_SOURCE, /displace: 5,/);
	assert.match(GLASS_PANEL_SOURCE, /distortionScale: -180,/);
	assert.match(GLASS_PANEL_SOURCE, /dispersion: 0,/);
	assert.match(GLASS_PANEL_SOURCE, /redOffset: 50,/);
	assert.match(GLASS_PANEL_SOURCE, /greenOffset: -1,/);
	assert.match(GLASS_PANEL_SOURCE, /blueOffset: -19,/);
	assert.match(GLASS_PANEL_SOURCE, /xChannel: "R",/);
	assert.match(GLASS_PANEL_SOURCE, /yChannel: "G",/);
	assert.match(GLASS_PANEL_SOURCE, /glassProps\?: PersonalGraphGlassTuningProps;/);
	assert.match(GLASS_PANEL_SOURCE, /\{\.\.\.glassProps\}/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /chromaticEdge/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /PERSONAL_GRAPH_CHROMATIC_EDGE_STYLE/);
	assert.doesNotMatch(GLASS_PANEL_SOURCE, /data-personal-graph-chromatic-edge/);
});
