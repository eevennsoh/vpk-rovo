const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SHADER_SOURCE = fs.readFileSync(path.join(__dirname, "shaders/ascii.tsx"), "utf8");
const DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "ascii-demo.tsx"), "utf8");
const COMPONENTS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../../app/data/components.ts"),
	"utf8",
);
const MANIFEST_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../../app/data/component-manifest.ts"),
	"utf8",
);
const DETAILS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../../app/data/details/visual.ts"),
	"utf8",
);
const NAV_UTILS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../../app/data/nav-utils.ts"),
	"utf8",
);
const REGISTRY_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../registry.ts"),
	"utf8",
);

test("ASCII is registered as a visual shader component", () => {
	assert.match(
		COMPONENTS_SOURCE,
		/visualComponent\("ascii", "ASCII", "@\/components\/website\/demos\/visual\/shaders\/ascii"\)/,
	);
	assert.match(
		MANIFEST_SOURCE,
		/visualComponent\("ascii", "ASCII", "@\/components\/website\/demos\/visual\/shaders\/ascii"\)/,
	);
	assert.match(REGISTRY_SOURCE, /ascii: dynamic\(\(\) => import\("\.\/demos\/visual\/ascii-demo"\)/);
	assert.match(DETAILS_SOURCE, /"ascii": \{/);
	assert.match(NAV_UTILS_SOURCE, /shaders: \[[^\]]*"ascii"/);
});

test("ASCII demo exposes the shader-lab style ASCII controls", () => {
	assert.match(DEMO_SOURCE, /import Ascii/);
	assert.match(DEMO_SOURCE, /ASCII_CONTROL_BLEND_MODES/);
	assert.match(DEMO_SOURCE, /ASCII_COLOR_SOURCE_MODES/);
	assert.match(DEMO_SOURCE, /ASCII_DEFAULT_SOURCE_COLORS/);
	assert.match(DEMO_SOURCE, /ASCII_MAX_SOURCE_COLORS/);
	assert.match(DEMO_SOURCE, /ASCII_TONE_MAPPING_MODES/);
	assert.match(DEMO_SOURCE, /ASCII_MASK_SOURCES/);
	assert.match(DEMO_SOURCE, /ASCII_MASK_MODES/);
	assert.match(DEMO_SOURCE, /label="Blend"/);
	assert.match(DEMO_SOURCE, /label="Mode"/);
	assert.match(DEMO_SOURCE, /label="Mask Mode"/);
	assert.match(DEMO_SOURCE, /label="Mask Invert"/);
	assert.match(DEMO_SOURCE, /label="Cell Size"/);
	assert.match(DEMO_SOURCE, /label="Charset"/);
	assert.match(DEMO_SOURCE, /DEFAULT_CHARSET_VALUES/);
	assert.match(DEMO_SOURCE, /charsetCharacters/);
	assert.match(DEMO_SOURCE, /activeCharsetCharacters/);
	assert.match(DEMO_SOURCE, /label="Characters"/);
	assert.match(DEMO_SOURCE, /characters=\{activeCharsetCharacters\}/);
	assert.match(DEMO_SOURCE, /label="Font Weight"/);
	assert.match(DEMO_SOURCE, /label="Background Color"/);
	assert.match(DEMO_SOURCE, /label="Source Background"/);
	assert.match(DEMO_SOURCE, /label="Tone Mapping"/);
	assert.match(DEMO_SOURCE, /label="Glyph Signal"/);
	assert.match(DEMO_SOURCE, /label="Color Signal"/);
	assert.match(DEMO_SOURCE, /label="Source Channel"/);
	assert.match(DEMO_SOURCE, /label="Colors"/);
	assert.match(DEMO_SOURCE, /allowAddRemove/);
	assert.match(DEMO_SOURCE, /colorMode === "source"/);
	assert.match(DEMO_SOURCE, /label="Black Point"/);
	assert.match(DEMO_SOURCE, /label="White Point"/);
	assert.match(DEMO_SOURCE, /label="Invert"/);
	assert.match(DEMO_SOURCE, /label="Bloom"/);
	assert.match(DEMO_SOURCE, /ShaderColorInput/);
});

test("ASCII demo defaults to the requested source color palette", () => {
	const requestedPalette = /\["#1868DB", "#FCA700", "#AF59E1", "#6A9A23"\]/;

	assert.match(SHADER_SOURCE, new RegExp(`ASCII_DEFAULT_SOURCE_COLORS = ${requestedPalette.source}`));
	assert.match(DETAILS_SOURCE, requestedPalette);
	assert.doesNotMatch(SHADER_SOURCE, /"#05070F"/);
	assert.doesNotMatch(SHADER_SOURCE, /"#66D9E8"/);
});

test("ASCII image mode does not keep the generated VPK backdrop as a fallback", () => {
	assert.match(SHADER_SOURCE, /createEmptyTexture/);
	assert.match(SHADER_SOURCE, /sourceMode === "image" && imageSrc/);
	assert.match(SHADER_SOURCE, /shouldUseAnonymousCrossOrigin\(imageSrc\)/);
	assert.doesNotMatch(SHADER_SOURCE, /createDefaultTexture/);
	assert.doesNotMatch(SHADER_SOURCE, /fillText\("VPK"/);
	assert.match(DETAILS_SOURCE, /image mode starts from an empty source rather than a bundled demo texture/);
});

test("ASCII shader uses a generated glyph atlas and luminance pass", () => {
	assert.match(SHADER_SOURCE, /createAsciiAtlas/);
	assert.match(SHADER_SOURCE, /u_asciiAtlas/);
	assert.match(SHADER_SOURCE, /u_characterCount/);
	assert.match(SHADER_SOURCE, /ASCII_CHARACTER_MODES = \["signal", "sequence"\]/);
	assert.match(SHADER_SOURCE, /characterMode \?\? "signal"/);
	assert.doesNotMatch(SHADER_SOURCE, /charset === "custom" \? "sequence"/);
	assert.match(SHADER_SOURCE, /u_characterMode/);
	assert.match(SHADER_SOURCE, /floor\(clamp\(biasedGlyphSignal, 0\.0, 1\.0\) \* characterCount\)/);
	assert.doesNotMatch(SHADER_SOURCE, /biasedGlyphSignal \* \(characterCount - 1\.0\)/);
	assert.match(SHADER_SOURCE, /sequenceCharacterIndex = floor\(mod\(cellID\.x \+ cellID\.y \* cellCount\.x, characterCount\)\)/);
	assert.match(SHADER_SOURCE, /u_characterMode > 0\.5 \? sequenceCharacterIndex : signalCharacterIndex/);
	assert.match(SHADER_SOURCE, /Math\.ceil\(Math\.sqrt\(glyphs\.length\)\)/);
	assert.doesNotMatch(SHADER_SOURCE, /ASCII_ATLAS_MAX_COLUMNS/);
	assert.match(SHADER_SOURCE, /dot\(color, vec3\(0\.2126, 0\.7152, 0\.0722\)\)/);
	assert.match(SHADER_SOURCE, /sampleCoverTexture/);
	assert.match(SHADER_SOURCE, /blendColor/);
	assert.match(SHADER_SOURCE, /maskValue/);
	assert.match(SHADER_SOURCE, /toneMap/);
	assert.match(SHADER_SOURCE, /shapedSignal/);
	assert.match(SHADER_SOURCE, /u_colorSourceMode/);
	assert.match(SHADER_SOURCE, /sourceColorFromMode/);
	assert.match(SHADER_SOURCE, /u_sourceColors/);
	assert.match(SHADER_SOURCE, /u_sourceColorCount/);
	assert.match(DETAILS_SOURCE, /colorSourceMode/);
	assert.match(DETAILS_SOURCE, /sourceColors/);
});
