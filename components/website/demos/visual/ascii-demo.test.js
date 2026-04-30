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
	assert.match(DEMO_SOURCE, /ASCII_TONE_MAPPING_MODES/);
	assert.match(DEMO_SOURCE, /ASCII_MASK_SOURCES/);
	assert.match(DEMO_SOURCE, /ASCII_MASK_MODES/);
	assert.match(DEMO_SOURCE, /label="Blend"/);
	assert.match(DEMO_SOURCE, /label="Mode"/);
	assert.match(DEMO_SOURCE, /label="Mask Mode"/);
	assert.match(DEMO_SOURCE, /label="Mask Invert"/);
	assert.match(DEMO_SOURCE, /label="Cell Size"/);
	assert.match(DEMO_SOURCE, /label="Charset"/);
	assert.match(DEMO_SOURCE, /label="Font Weight"/);
	assert.match(DEMO_SOURCE, /label="Background"/);
	assert.match(DEMO_SOURCE, /label="Tone Mapping"/);
	assert.match(DEMO_SOURCE, /label="Glyph Signal"/);
	assert.match(DEMO_SOURCE, /label="Color Signal"/);
	assert.match(DEMO_SOURCE, /label="Black Point"/);
	assert.match(DEMO_SOURCE, /label="White Point"/);
	assert.match(DEMO_SOURCE, /label="Invert"/);
	assert.match(DEMO_SOURCE, /label="Bloom"/);
	assert.match(DEMO_SOURCE, /ShaderColorInput/);
});

test("ASCII shader uses a generated glyph atlas and luminance pass", () => {
	assert.match(SHADER_SOURCE, /createAsciiAtlas/);
	assert.match(SHADER_SOURCE, /u_asciiAtlas/);
	assert.match(SHADER_SOURCE, /u_characterCount/);
	assert.match(SHADER_SOURCE, /dot\(color, vec3\(0\.2126, 0\.7152, 0\.0722\)\)/);
	assert.match(SHADER_SOURCE, /sampleCoverTexture/);
	assert.match(SHADER_SOURCE, /blendColor/);
	assert.match(SHADER_SOURCE, /maskValue/);
	assert.match(SHADER_SOURCE, /toneMap/);
	assert.match(SHADER_SOURCE, /shapedSignal/);
});
