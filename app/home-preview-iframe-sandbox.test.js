const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appDir = __dirname;

function readAppSource(fileName) {
	return fs.readFileSync(path.join(appDir, fileName), "utf8");
}

test("first-party preview iframes keep a normal origin for Next dev assets", () => {
	const catalogSource = readAppSource("home-catalog-section.tsx");
	const homeSource = readAppSource("home-content.tsx");

	assert.match(catalogSource, /sandbox="allow-same-origin allow-scripts"/);

	const homePreviewSandboxMatches =
		homeSource.match(/sandbox="allow-same-origin allow-scripts"/g) ?? [];

	assert.equal(homePreviewSandboxMatches.length, 2);
	assert.doesNotMatch(catalogSource, /sandbox="allow-scripts"/);
	assert.doesNotMatch(homeSource, /sandbox="allow-scripts"/);
});
