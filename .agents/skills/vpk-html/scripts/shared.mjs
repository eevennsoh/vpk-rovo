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

export const KAMI_COLOR_MAP = {
	"#f5f4ed": "var(--vpk-paper)",
	"#F5F4ED": "var(--vpk-paper)",
	"#faf9f5": "var(--vpk-paper)",
	"#FAF9F5": "var(--vpk-paper)",
	"#141413": "var(--vpk-ink)",
	"#3d3d3a": "var(--vpk-ink)",
	"#3D3D3A": "var(--vpk-ink)",
	"#4d4c48": "var(--vpk-muted-text)",
	"#504e49": "var(--vpk-muted-text)",
	"#6b6a64": "var(--vpk-subtlest-text)",
	"#1B365D": "var(--vpk-blueprint)",
	"#1b365d": "var(--vpk-blueprint)",
	"#2D5A8A": "var(--vpk-focus-ring)",
	"#EEF2F7": "var(--vpk-blueprint-tint)",
	"#eef2f7": "var(--vpk-blueprint-tint)",
	"#E4ECF5": "var(--vpk-blueprint-tint)",
	"#e4ecf5": "var(--vpk-blueprint-tint)",
	"#D0DCE9": "var(--vpk-blueprint-tint-strong)",
	"#D6E1EE": "var(--vpk-blueprint-tint-strong)",
	"#e8e6dc": "var(--vpk-rule)",
	"#E8E6DC": "var(--vpk-rule)",
	"#e5e3d8": "var(--vpk-rule)",
	"#E5E3D8": "var(--vpk-rule)",
	"#DEDED7": "var(--vpk-rule)",
	"#E3E2DC": "var(--vpk-rule)",
	"#E9E8E1": "var(--vpk-surface-sunken)",
	"#EEEDE6": "var(--vpk-surface-sunken)",
	"#EAE9E2": "var(--vpk-surface-sunken)",
	"#B2B1AC": "var(--vpk-rule-strong)",
	"#B53333": "var(--vpk-danger)",
	"#b53333": "var(--vpk-danger)",
	"#30302E": "var(--vpk-ink)",
	"#30302e": "var(--vpk-ink)",
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
const CSS_VAR = /(--vpk-[\w-]+)\s*:\s*([^;]+);/g;

function cssVarName(key) {
	return `--vpk-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`;
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
		vars.set(match[1], match[2].trim());
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
	lines.push("\t--vpk-paper-rule: color-mix(in srgb, var(--vpk-ink) 8%, transparent);");
	lines.push(`\t--vpk-shadow: var(--ds-shadow-raised, ${tokens.light.shadow});`);
	lines.push("}", "");
	lines.push('[data-theme="dark"] {');
	for (const key of TOKEN_ORDER) {
		if (!tokens.semantic[key]) throw new Error(`Missing semantic token: ${key}`);
		if (!tokens.dark[key]) throw new Error(`Missing dark token: ${key}`);
		lines.push(`\t${cssVarName(key)}: ${semanticWithFallback(tokens.semantic[key], tokens.dark[key])};`);
	}
	lines.push("\t--vpk-paper-rule: color-mix(in srgb, var(--vpk-ink) 8%, transparent);");
	lines.push(`\t--vpk-shadow: var(--ds-shadow-raised, ${tokens.dark.shadow});`);
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
