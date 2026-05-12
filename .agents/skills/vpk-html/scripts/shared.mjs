import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT = path.resolve(__dirname, "..");
export const TEMPLATES = path.join(ROOT, "assets", "templates");
export const DIAGRAMS = path.join(ROOT, "assets", "diagrams");
export const DEMOS = path.join(ROOT, "assets", "demos");
export const FONTS_DIR = path.join(ROOT, "assets", "fonts");
export const TOKENS_FILE = path.join(ROOT, "references", "tokens.json");
export const STYLES_FILE = path.join(ROOT, "styles.css");

export const FONT_STACKS = {
	sans: '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
	mono: '"Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
	display: '"Geist Pixel", "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
};

export const FONT_FILES = [
	{ family: "Geist", file: "Geist-Regular.woff2" },
	{ family: "Geist Mono", file: "GeistMono-Regular.woff2" },
	{ family: "Geist Pixel", file: "GeistPixel-Square.woff2" },
];

const VPK_FAVICON_SVGS = {
	fallback: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="#121212"/><circle cx="11" cy="21" r="5" fill="white"/><circle cx="21" cy="21" r="5" fill="white"/><circle cx="11" cy="11" r="5" fill="white"/><circle cx="21" cy="11" r="5" fill="white"/></svg>',
	dark: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="23" r="5" fill="#121212"/><circle cx="23" cy="23" r="5" fill="#121212"/><circle cx="9" cy="9" r="5" fill="#121212"/><circle cx="23" cy="9" r="5" fill="#121212"/></svg>',
	light: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="23" r="5" fill="white" stroke="#121212" stroke-width="1.25"/><circle cx="23" cy="23" r="5" fill="white" stroke="#121212" stroke-width="1.25"/><circle cx="9" cy="9" r="5" fill="white" stroke="#121212" stroke-width="1.25"/><circle cx="23" cy="9" r="5" fill="white" stroke="#121212" stroke-width="1.25"/></svg>',
};

function svgDataUrl(svg) {
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function escapeRegExp(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const FAVICON_LINKS = [
	{ variant: "fallback", href: svgDataUrl(VPK_FAVICON_SVGS.fallback) },
	{ variant: "dark", href: svgDataUrl(VPK_FAVICON_SVGS.dark), media: "(prefers-color-scheme: light)" },
	{ variant: "light", href: svgDataUrl(VPK_FAVICON_SVGS.light), media: "(prefers-color-scheme: dark)" },
];

export function buildFaviconLinkBlock() {
	return FAVICON_LINKS.map(({ href, media }) => {
		const mediaAttribute = media ? ` media="${media}"` : "";
		return `<link rel="icon" type="image/svg+xml" sizes="any"${mediaAttribute} href="${href}">`;
	}).join("\n");
}

export function stripSelfReferentialCustomProperties(source) {
	return source.replace(/^[\t ]*(--[\w-]+)\s*:\s*var\(\1\);\s*$/gm, "");
}

export function hasVpkFaviconLinks(html) {
	return FAVICON_LINKS.every(({ href, media }) => {
		const hrefPattern = escapeRegExp(href);
		const mediaPattern = media ? `(?=[^>]*\\bmedia=["']${escapeRegExp(media)}["'])` : "";
		const pattern = new RegExp(`<link\\b(?=[^>]*\\brel=["'][^"']*\\bicon\\b[^"']*["'])(?=[^>]*\\bhref=["']${hrefPattern}["'])${mediaPattern}[^>]*>`, "i");
		return pattern.test(html);
	});
}

export function collectFaviconIssues(html) {
	if (!/<meta\s+name=["']generator["']\s+content=["']vpk-html["']/i.test(html)) {
		return [];
	}
	if (hasVpkFaviconLinks(html)) {
		return [];
	}
	return ["missing vpk-rovo favicon link set"];
}

export function ensureFaviconLinks(html) {
	if (hasVpkFaviconLinks(html)) {
		return html;
	}

	const faviconBlock = buildFaviconLinkBlock();
	const generatorMeta = /(<meta\s+name=["']generator["']\s+content=["']vpk-html["']\s*\/?>\s*)/i;
	if (generatorMeta.test(html)) {
		return html.replace(generatorMeta, `$1\n${faviconBlock}\n`);
	}

	const viewportMeta = /(<meta\s+name=["']viewport["'][^>]*>\s*)/i;
	if (viewportMeta.test(html)) {
		return html.replace(viewportMeta, `$1\n${faviconBlock}\n`);
	}

	return html.replace(/(<style\b)/i, `${faviconBlock}\n$1`);
}

export const KAMI_COLOR_MAP = {
	"#f5f4ed": "var(--paper)",
	"#F5F4ED": "var(--paper)",
	"#faf9f5": "var(--paper)",
	"#FAF9F5": "var(--paper)",
	"#141413": "var(--ink)",
	"#3d3d3a": "var(--ink)",
	"#3D3D3A": "var(--ink)",
	"#4d4c48": "var(--muted-text)",
	"#504e49": "var(--muted-text)",
	"#6b6a64": "var(--subtlest-text)",
	"#1B365D": "var(--blueprint)",
	"#1b365d": "var(--blueprint)",
	"#2D5A8A": "var(--focus-ring)",
	"#EEF2F7": "var(--blueprint-tint)",
	"#eef2f7": "var(--blueprint-tint)",
	"#E4ECF5": "var(--blueprint-tint)",
	"#e4ecf5": "var(--blueprint-tint)",
	"#D0DCE9": "var(--blueprint-tint-strong)",
	"#D6E1EE": "var(--blueprint-tint-strong)",
	"#e8e6dc": "var(--rule)",
	"#E8E6DC": "var(--rule)",
	"#e5e3d8": "var(--rule)",
	"#E5E3D8": "var(--rule)",
	"#DEDED7": "var(--rule)",
	"#E3E2DC": "var(--rule)",
	"#E9E8E1": "var(--surface-sunken)",
	"#EEEDE6": "var(--surface-sunken)",
	"#EAE9E2": "var(--surface-sunken)",
	"#B2B1AC": "var(--rule-strong)",
	"#B53333": "var(--danger)",
	"#b53333": "var(--danger)",
	"#30302E": "var(--ink)",
	"#30302e": "var(--ink)",
};

const TOKEN_ORDER = [
	"paper",
	"paperBackground",
	"surfaceRaised",
	"surfaceOverlay",
	"surfaceSunken",
	"ink",
	"mutedText",
	"subtlestText",
	"inverseText",
	"rule",
	"ruleStrong",
	"blueprint",
	"link",
	"linkPressed",
	"selected",
	"blueprintTint",
	"blueprintTintStrong",
	"focusRing",
	"codeSurface",
	"codeInk",
	"codeInverse",
	"mathHighlight",
	"success",
	"successTint",
	"warning",
	"warningTint",
	"danger",
	"dangerTint",
	"info",
	"infoTint",
];

const ROOT_BLOCK = /:root\s*\{([^}]*)\}/s;
const DARK_BLOCK = /\[data-theme=["']dark["']\]\s*\{([^}]*)\}/s;
const CSS_VAR = /(--[\w-]+)\s*:\s*([^;]+);/g;

function cssVarName(key) {
	return `--${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`;
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeCss(css) {
	return css.trim().replace(/\r\n/g, "\n");
}

function semanticWithFallback(semanticValue, fallbackValue) {
	const match = semanticValue.match(/^var\((--ds-[^,\s]+),\s*[^)]+\)$/);
	if (!match) return fallbackValue.toLowerCase();
	return `var(${match[1]}, ${fallbackValue.toLowerCase()})`;
}

function listHtmlFiles(directory) {
	if (!fs.existsSync(directory)) return [];
	return fs.readdirSync(directory)
		.filter(name => name.endsWith(".html"))
		.map(name => path.join(directory, name));
}

function collectBlockVars(source, blockPattern) {
	const block = blockPattern.exec(source)?.[1];
	if (!block) return null;

	const vars = new Map();
	for (const match of block.matchAll(CSS_VAR)) {
		if (!vars.has(match[1])) vars.set(match[1], match[2].trim());
	}
	return vars;
}

function collectStyleVars(source) {
	return {
		root: collectBlockVars(source, ROOT_BLOCK),
		dark: collectBlockVars(source, DARK_BLOCK),
	};
}

function compareStyleVars(filePath, expected, actual) {
	const issues = [];
	for (const mode of ["root", "dark"]) {
		const expectedVars = expected[mode];
		const actualVars = actual[mode];
		if (!expectedVars || !actualVars) {
			issues.push(`${path.relative(ROOT, filePath)} missing ${mode === "root" ? ":root" : "[data-theme=\"dark\"]"} token block`);
			continue;
		}
		for (const [name, expectedValue] of expectedVars) {
			const actualValue = actualVars.get(name);
			if (actualValue !== undefined && actualValue.toLowerCase() !== expectedValue.toLowerCase()) {
				issues.push(`${path.relative(ROOT, filePath)}: ${name} expected ${expectedValue}, got ${actualValue}`);
			}
		}
	}
	return issues;
}

export function loadTokens() {
	return readJson(TOKENS_FILE);
}

export function buildStylesCssFromTokens(tokens = loadTokens()) {
	const lines = [":root {", "\tcolor-scheme: light dark;"];
	for (const key of TOKEN_ORDER) {
		if (!tokens.semantic[key]) throw new Error(`Missing semantic token: ${key}`);
		lines.push(`\t${cssVarName(key)}: ${tokens.semantic[key]};`);
	}
	lines.push("\t--paper-rule: color-mix(in srgb, var(--ink) 8%, transparent);");
	lines.push(`\t--shadow: var(--ds-shadow-raised, ${tokens.light.shadow});`);
	lines.push("}", "");
	lines.push('[data-theme="dark"] {');
	for (const key of TOKEN_ORDER) {
		if (!tokens.semantic[key]) throw new Error(`Missing semantic token: ${key}`);
		if (!tokens.dark[key]) throw new Error(`Missing dark token: ${key}`);
		lines.push(`\t${cssVarName(key)}: ${semanticWithFallback(tokens.semantic[key], tokens.dark[key])};`);
	}
	lines.push("\t--paper-rule: color-mix(in srgb, var(--ink) 8%, transparent);");
	lines.push(`\t--shadow: var(--ds-shadow-raised, ${tokens.dark.shadow});`);
	lines.push("}", "");
	lines.push("@media (prefers-reduced-motion: reduce) {");
	lines.push("\t*,");
	lines.push("\t*::before,");
	lines.push("\t*::after {");
	lines.push("\t\tanimation-duration: 0.001ms !important;");
	lines.push("\t\tscroll-behavior: auto !important;");
	lines.push("\t\ttransition-duration: 0.001ms !important;");
	lines.push("\t}");
	lines.push("}");
	return `${lines.join("\n")}\n`;
}

export function readStylesCss() {
	if (!fs.existsSync(STYLES_FILE)) {
		throw new Error(`Styles file not found: ${STYLES_FILE}`);
	}
	return fs.readFileSync(STYLES_FILE, "utf8").trim();
}

export function checkStyleSource() {
	const expected = normalizeCss(buildStylesCssFromTokens());
	const actual = normalizeCss(readStylesCss());
	if (actual === expected) return [];
	return [
		"styles.css does not match references/tokens.json",
		"run: node .agents/skills/vpk-html/scripts/build.mjs --write-styles",
	];
}

export function writeStylesCssFromTokens() {
	fs.writeFileSync(STYLES_FILE, buildStylesCssFromTokens(), "utf8");
}

export function checkStyleConsumers() {
	const sharedCss = readStylesCss();
	const expected = collectStyleVars(sharedCss);
	const files = [
		...listHtmlFiles(TEMPLATES),
		...listHtmlFiles(DIAGRAMS),
		...listHtmlFiles(DEMOS),
	];
	const drift = [];
	for (const filePath of files) {
		const content = fs.readFileSync(filePath, "utf8");
		drift.push(...compareStyleVars(filePath, expected, collectStyleVars(content)));
	}
	return drift;
}

export function inlineFont(fileName) {
	const filePath = path.join(FONTS_DIR, fileName);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Font file not found: ${filePath}`);
	}
	return `data:font/woff2;base64,${fs.readFileSync(filePath).toString("base64")}`;
}

export function buildFontFaceBlock() {
	return FONT_FILES.map(({ family, file }) => `@font-face {
\tfont-family: "${family}";
\tsrc: url("${inlineFont(file)}") format("woff2");
\tfont-weight: 400;
\tfont-style: normal;
\tfont-display: swap;
}`).join("\n");
}

export function buildSharedCssBlock() {
	return `${buildFontFaceBlock()}\n${readStylesCss()}`;
}
