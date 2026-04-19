const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ARTS_PAGE_FILE = path.join(__dirname, "page.tsx");
const ARTS_PAGE_SOURCE = fs.readFileSync(ARTS_PAGE_FILE, "utf8");

test("ArtsPage keeps a dedicated shell instead of importing HomeContent", () => {
	assert.doesNotMatch(ARTS_PAGE_SOURCE, /import\s+\{\s*HomeContent\s*\}\s+from\s+"@\/app\/home-content";/);
	assert.match(ARTS_PAGE_SOURCE, /import\s+\{\s*HomeArtsSection\s*\}\s+from\s+"@\/app\/home-arts-section";/);
	assert.match(ARTS_PAGE_SOURCE, /const artComponents = getArtComponentsWithUpdatedAt\(\);/);
	assert.match(ARTS_PAGE_SOURCE, /<HomeArtsSection artComponents=\{artComponents\} \/>/);
});
