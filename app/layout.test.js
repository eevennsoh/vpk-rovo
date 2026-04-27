const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT_LAYOUT_FILE = path.join(__dirname, "layout.tsx");
const ROOT_LAYOUT_SOURCE = fs.readFileSync(ROOT_LAYOUT_FILE, "utf8");

const EXPECTED_FAVICON_LINKS = [
	{ href: "/website/favicon-fallback.svg" },
	{ href: "/website/favicon-dark.svg", media: "(prefers-color-scheme: light)" },
	{ href: "/website/favicon-light.svg", media: "(prefers-color-scheme: dark)" },
];

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getInlineIconLinkBlock(href) {
	const pattern = new RegExp(
		`<link\\b(?=[^>]*?rel="icon")(?=[^>]*?href="${escapeRegExp(href)}")[^>]*?\\/>`,
	);
	const match = ROOT_LAYOUT_SOURCE.match(pattern);
	assert.ok(match, `expected favicon link for ${href}`);
	return match[0];
}

function getStaticFaviconLinks() {
	const arrayMatch = ROOT_LAYOUT_SOURCE.match(
		/const FAVICON_LINKS:[\s\S]*?=\s*\[([\s\S]*?)\];/,
	);

	if (!arrayMatch) {
		return null;
	}

	assert.match(ROOT_LAYOUT_SOURCE, /FAVICON_LINKS\.map\(\(\{\s*href,\s*media\s*\}\)\s*=>\s*\(/);
	assert.match(ROOT_LAYOUT_SOURCE, /rel="icon"/);
	assert.match(ROOT_LAYOUT_SOURCE, /type="image\/svg\+xml"/);
	assert.match(ROOT_LAYOUT_SOURCE, /sizes="any"/);
	assert.match(ROOT_LAYOUT_SOURCE, /media=\{media\}/);
	assert.match(ROOT_LAYOUT_SOURCE, /href=\{href\}/);

	return Array.from(
		arrayMatch[1].matchAll(
			/\{\s*href:\s*"([^"]+)"(?:,\s*media:\s*"([^"]+)")?\s*\}/g,
		),
		(match) => {
			const link = { href: match[1] };
			if (match[2]) {
				link.media = match[2];
			}
			return link;
		},
	);
}

function getInlineFaviconLinks() {
	return EXPECTED_FAVICON_LINKS.map(({ href }) => {
		const block = getInlineIconLinkBlock(href);
		const media = block.match(/media="([^"]+)"/)?.[1];

		assert.match(block, /type="image\/svg\+xml"/);
		assert.match(block, /sizes="any"/);

		if (!media) {
			return { href };
		}

		return { href, media };
	});
}

function getFaviconLinks() {
	return getStaticFaviconLinks() ?? getInlineFaviconLinks();
}

test("RootLayout keeps the default favicon fallback before color-scheme icons", () => {
	assert.deepEqual(
		getFaviconLinks().map(({ href }) => href),
		EXPECTED_FAVICON_LINKS.map(({ href }) => href),
	);
});

test("RootLayout exposes browser color-scheme favicon links", () => {
	assert.deepEqual(getFaviconLinks(), EXPECTED_FAVICON_LINKS);
	assert.doesNotMatch(ROOT_LAYOUT_SOURCE, /theme-favicon/);
});
