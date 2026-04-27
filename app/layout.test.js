const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT_LAYOUT_FILE = path.join(__dirname, "layout.tsx");
const ROOT_LAYOUT_SOURCE = fs.readFileSync(ROOT_LAYOUT_FILE, "utf8");

function getIconLinkBlock(href) {
	const pattern = new RegExp(
		`<link\\s+[\\s\\S]*?rel="icon"[\\s\\S]*?href="${href.replaceAll("/", "\\/")}"[\\s\\S]*?\\/>`,
	);
	const match = ROOT_LAYOUT_SOURCE.match(pattern);
	assert.ok(match, `expected favicon link for ${href}`);
	return match[0];
}

test("RootLayout keeps the default favicon fallback before color-scheme icons", () => {
	const fallbackIndex = ROOT_LAYOUT_SOURCE.indexOf('href="/website/favicon-fallback.svg"');
	const lightIndex = ROOT_LAYOUT_SOURCE.indexOf('href="/website/favicon-dark.svg"');
	const darkIndex = ROOT_LAYOUT_SOURCE.indexOf('href="/website/favicon-light.svg"');

	assert.notEqual(fallbackIndex, -1);
	assert.notEqual(lightIndex, -1);
	assert.notEqual(darkIndex, -1);
	assert.ok(fallbackIndex < lightIndex);
	assert.ok(fallbackIndex < darkIndex);

	const fallbackLink = getIconLinkBlock("/website/favicon-fallback.svg");
	assert.match(fallbackLink, /type="image\/svg\+xml"/);
	assert.match(fallbackLink, /sizes="any"/);
	assert.doesNotMatch(fallbackLink, /media=/);
});

test("RootLayout exposes browser color-scheme favicon links", () => {
	const lightPreferenceLink = getIconLinkBlock("/website/favicon-dark.svg");
	const darkPreferenceLink = getIconLinkBlock("/website/favicon-light.svg");

	assert.match(lightPreferenceLink, /type="image\/svg\+xml"/);
	assert.match(lightPreferenceLink, /sizes="any"/);
	assert.match(lightPreferenceLink, /media="\(prefers-color-scheme: light\)"/);

	assert.match(darkPreferenceLink, /type="image\/svg\+xml"/);
	assert.match(darkPreferenceLink, /sizes="any"/);
	assert.match(darkPreferenceLink, /media="\(prefers-color-scheme: dark\)"/);

	assert.equal(ROOT_LAYOUT_SOURCE.match(/rel="icon"/g)?.length, 3);
	assert.doesNotMatch(ROOT_LAYOUT_SOURCE, /theme-favicon/);
});
