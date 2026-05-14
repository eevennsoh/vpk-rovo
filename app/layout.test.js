const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT_LAYOUT_FILE = path.join(__dirname, "layout.tsx");
const ROOT_LAYOUT_SOURCE = fs.readFileSync(ROOT_LAYOUT_FILE, "utf8");
const ROOT_FAVICON_FILE = path.join(__dirname, "favicon.ico");

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

function getDevStylesheetGuardScriptSource() {
	const start = ROOT_LAYOUT_SOURCE.indexOf("function getDevStylesheetGuardScript(): string {");
	const end = ROOT_LAYOUT_SOURCE.indexOf("export default async function RootLayout");

	assert.notEqual(start, -1, "expected development stylesheet guard helper");
	assert.notEqual(end, -1, "expected root layout after development stylesheet guard helper");

	const helperSource = ROOT_LAYOUT_SOURCE.slice(start, end);
	const match = helperSource.match(
		/return `([\s\S]*?)`;\s*}/,
	);

	assert.ok(match, "expected development stylesheet guard script");
	return match[1];
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

test("RootLayout keeps the pre-hydration bootstrap out of the React script tree", () => {
	assert.match(
		ROOT_LAYOUT_SOURCE,
		/import \{ PreHydrationScript \} from "@\/components\/utils\/pre-hydration-script";/,
	);
	assert.match(
		ROOT_LAYOUT_SOURCE,
		/<PreHydrationScript id="vpk-pre-hydration">\{preHydrationScript\}<\/PreHydrationScript>/,
	);
	assert.doesNotMatch(ROOT_LAYOUT_SOURCE, /<script(?:\s|>)/);
	assert.doesNotMatch(ROOT_LAYOUT_SOURCE, /dangerouslySetInnerHTML=\{\{ __html: preHydrationScript \}\}/);
});

test("RootLayout keeps the development stylesheet guard out of production pre-hydration output", () => {
	assert.match(
		ROOT_LAYOUT_SOURCE,
		/function getDevStylesheetGuardScript\(\): string \{\s*if \(process\.env\.NODE_ENV !== "development"\) \{\s*return "";/,
	);
	assert.match(ROOT_LAYOUT_SOURCE, /const devStylesheetGuardScript = getDevStylesheetGuardScript\(\);/);
	assert.match(ROOT_LAYOUT_SOURCE, /\$\{devStylesheetGuardScript\}/);
	assert.doesNotMatch(ROOT_LAYOUT_SOURCE, /"\$\{process\.env\.NODE_ENV\}" === "development"/);
});

test("RootLayout keeps the development stylesheet guard scoped to app globals CSS preloads", () => {
	const guardScript = getDevStylesheetGuardScriptSource();

	assert.ok(
		guardScript.includes(
			"const appGlobalsChunkPattern = /\\\\/_next\\\\/static\\\\/chunks\\\\/app_globals_[^/]+\\\\.css",
		),
		"expected guard to target app globals CSS chunks",
	);
	assert.match(guardScript, /head\.querySelectorAll\('link\[as="style"\]\[href\]'\)/);
	assert.match(guardScript, /preloadLink\.relList\.contains\("preload"\)/);
	assert.match(guardScript, /ensureStylesheetLink\(href\)/);
	assert.match(guardScript, /stylesheet\.rel = "stylesheet"/);
	assert.match(
		guardScript,
		/stylesheet\.setAttribute\("data-vpk-dev-css-chunk-guard", "head-script"\)/,
	);
	assert.match(guardScript, /head\.appendChild\(stylesheet\)/);
});

test("RootLayout keeps a conventional root favicon fallback", () => {
	assert.ok(fs.existsSync(ROOT_FAVICON_FILE), "expected app/favicon.ico to serve /favicon.ico");
});
