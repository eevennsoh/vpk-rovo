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
	display: '"Charlie Display", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
	body: '"Charlie Text", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
	mono: '"Atlassian Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
	numeric: '"Atlassian Mono Numeric", "Atlassian Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
};

FONT_STACKS.sans = FONT_STACKS.body;

const FONT_METADATA = {
	otf: { format: "opentype", mime: "font/otf" },
	ttf: { format: "truetype", mime: "font/ttf" },
	woff2: { format: "woff2", mime: "font/woff2" },
};

export const FONT_FILES = [
	{ family: "Charlie Display", file: "CharlieDisplay-Regular.otf", weight: 400 },
	{ family: "Charlie Display", file: "CharlieDisplay-Semibold.otf", weight: 600 },
	{ family: "Charlie Display", file: "CharlieDisplay-Bold.otf", weight: 700 },
	{ family: "Charlie Display", file: "CharlieDisplay-Black.otf", weight: 900 },
	{ family: "Charlie Display", file: "CharlieDisplay-Italic.otf", weight: 400, style: "italic" },
	{ family: "Charlie Text", file: "CharlieText-Regular.otf", weight: 400 },
	{ family: "Charlie Text", file: "CharlieText-Semibold.otf", weight: 600 },
	{ family: "Charlie Text", file: "CharlieText-Bold.otf", weight: 700 },
	{ family: "Charlie Text", file: "CharlieText-Italic.otf", weight: 400, style: "italic" },
	{ family: "Atlassian Mono", file: "AtlassianMono.v2.ttf", weight: 400 },
	{ family: "Atlassian Mono", file: "AtlassianMonoItalic.v2.ttf", weight: 400, style: "italic" },
	{ family: "Atlassian Mono Numeric", file: "AtlassianMono.v2.ttf", weight: 400, unicodeRange: "U+0030-0039" },
].map(font => {
	const extension = path.extname(font.file).slice(1).toLowerCase();
	const metadata = FONT_METADATA[extension];
	if (!metadata) throw new Error(`Unsupported font type: ${font.file}`);
	return {
		style: "normal",
		...metadata,
		...font,
	};
});

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
	"#D97757": "var(--accent-orange)",
	"#d97757": "var(--accent-orange)",
	"#B85C3E": "var(--accent-orange)",
	"#b85c3e": "var(--accent-orange)",
	"#E3DACC": "var(--primary-blue-tint)",
	"#e3dacc": "var(--primary-blue-tint)",
	"#788C5D": "var(--accent-green)",
	"#788c5d": "var(--accent-green)",
	"#F0EEE6": "var(--surface-sunken)",
	"#f0eee6": "var(--surface-sunken)",
	"#D1CFC5": "var(--rule)",
	"#d1cfc5": "var(--rule)",
	"#87867F": "var(--muted-text)",
	"#87867f": "var(--muted-text)",
	"#9C9A93": "var(--muted-text)",
	"#9c9a93": "var(--muted-text)",
	"#1F1E1B": "var(--code-surface)",
	"#1f1e1b": "var(--code-surface)",
	"#FFFFFF": "var(--surface-raised)",
	"#ffffff": "var(--surface-raised)",
	"rgba(0,0,0,0.12)": "color-mix(in srgb, var(--ink) 12%, transparent)",
	"rgba(0, 0, 0, 0.12)": "color-mix(in srgb, var(--ink) 12%, transparent)",
	"rgba(0,0,0,0.5)": "color-mix(in srgb, var(--ink) 50%, transparent)",
	"rgba(0, 0, 0, 0.5)": "color-mix(in srgb, var(--ink) 50%, transparent)",
	"#3d3d3a": "var(--ink)",
	"#3D3D3A": "var(--ink)",
	"#4d4c48": "var(--muted-text)",
	"#504e49": "var(--muted-text)",
	"#6b6a64": "var(--subtlest-text)",
	"#1B365D": "var(--primary-blue)",
	"#1b365d": "var(--primary-blue)",
	"#2D5A8A": "var(--focus-ring)",
	"#EEF2F7": "var(--primary-blue-tint)",
	"#eef2f7": "var(--primary-blue-tint)",
	"#E4ECF5": "var(--primary-blue-tint)",
	"#e4ecf5": "var(--primary-blue-tint)",
	"#D0DCE9": "var(--primary-blue-tint-strong)",
	"#D6E1EE": "var(--primary-blue-tint-strong)",
	"#e8e6dc": "var(--rule)",
	"#E8E6DC": "var(--rule)",
	"#e8e7e1": "var(--rule)",
	"#E8E7E1": "var(--rule)",
	"#E8E6DE": "var(--code-inverse)",
	"#e8e6de": "var(--code-inverse)",
	"#C9B98A": "var(--accent-saffron)",
	"#c9b98a": "var(--accent-saffron)",
	"#F3D9CC": "var(--danger-tint)",
	"#f3d9cc": "var(--danger-tint)",
	"#8A3B1E": "var(--danger)",
	"#8a3b1e": "var(--danger)",
	"#E4E9DC": "var(--success-tint)",
	"#e4e9dc": "var(--success-tint)",
	"#4B5C39": "var(--success)",
	"#4b5c39": "var(--success)",
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
	"#f0e0d8": "var(--danger-tint)",
	"#F0E0D8": "var(--danger-tint)",
	"#8b4513": "var(--danger)",
	"#8B4513": "var(--danger)",
	"#a64f33": "var(--accent-orange)",
	"#A64F33": "var(--accent-orange)",
	"#30302E": "var(--ink)",
	"#30302e": "var(--ink)",
	"#fff": "var(--surface-raised)",
	"#FFF": "var(--surface-raised)",
	"#B04A3F": "var(--danger)",
	"#b04a3f": "var(--danger)",
	"#B89B6E": "var(--accent-saffron)",
	"#b89b6e": "var(--accent-saffron)",
	"#7A6A4F": "var(--muted-text)",
	"#7a6a4f": "var(--muted-text)",
	"#B8B6AC": "var(--rule-strong)",
	"#b8b6ac": "var(--rule-strong)",
	"rgba(120,140,93,0.10)": "color-mix(in srgb, var(--accent-green) 10%, transparent)",
	"rgba(120, 140, 93, 0.10)": "color-mix(in srgb, var(--accent-green) 10%, transparent)",
	"rgba(120,140,93,0.15)": "color-mix(in srgb, var(--accent-green) 15%, transparent)",
	"rgba(120, 140, 93, 0.15)": "color-mix(in srgb, var(--accent-green) 15%, transparent)",
	"rgba(120,140,93,.22)": "color-mix(in srgb, var(--accent-green) 22%, transparent)",
	"rgba(120,140,93,0.22)": "color-mix(in srgb, var(--accent-green) 22%, transparent)",
	"rgba(120, 140, 93, .22)": "color-mix(in srgb, var(--accent-green) 22%, transparent)",
	"rgba(120, 140, 93, 0.22)": "color-mix(in srgb, var(--accent-green) 22%, transparent)",
	"rgba(120,140,93,0.45)": "color-mix(in srgb, var(--accent-green) 45%, transparent)",
	"rgba(120, 140, 93, 0.45)": "color-mix(in srgb, var(--accent-green) 45%, transparent)",
	"rgba(217,119,87,0.12)": "color-mix(in srgb, var(--accent-orange) 12%, transparent)",
	"rgba(217, 119, 87, 0.12)": "color-mix(in srgb, var(--accent-orange) 12%, transparent)",
	"rgba(217,119,87,.18)": "color-mix(in srgb, var(--accent-orange) 18%, transparent)",
	"rgba(217,119,87,0.18)": "color-mix(in srgb, var(--accent-orange) 18%, transparent)",
	"rgba(217, 119, 87, .18)": "color-mix(in srgb, var(--accent-orange) 18%, transparent)",
	"rgba(217, 119, 87, 0.18)": "color-mix(in srgb, var(--accent-orange) 18%, transparent)",
	"rgba(217,119,87,0.15)": "color-mix(in srgb, var(--accent-orange) 15%, transparent)",
	"rgba(217, 119, 87, 0.15)": "color-mix(in srgb, var(--accent-orange) 15%, transparent)",
	"rgba(217,119,87,0.35)": "color-mix(in srgb, var(--accent-orange) 35%, transparent)",
	"rgba(217, 119, 87, 0.35)": "color-mix(in srgb, var(--accent-orange) 35%, transparent)",
	"rgba(217,119,87,0.55)": "color-mix(in srgb, var(--accent-orange) 55%, transparent)",
	"rgba(217, 119, 87, 0.55)": "color-mix(in srgb, var(--accent-orange) 55%, transparent)",
	"rgba(217,119,87,.6)": "color-mix(in srgb, var(--accent-orange) 60%, transparent)",
	"rgba(217,119,87,0.6)": "color-mix(in srgb, var(--accent-orange) 60%, transparent)",
	"rgba(217,119,87,0.60)": "color-mix(in srgb, var(--accent-orange) 60%, transparent)",
	"rgba(217, 119, 87, .6)": "color-mix(in srgb, var(--accent-orange) 60%, transparent)",
	"rgba(217, 119, 87, 0.6)": "color-mix(in srgb, var(--accent-orange) 60%, transparent)",
	"rgba(217, 119, 87, 0.60)": "color-mix(in srgb, var(--accent-orange) 60%, transparent)",
	"rgba(176,74,63,0.15)": "color-mix(in srgb, var(--danger) 15%, transparent)",
	"rgba(176, 74, 63, 0.15)": "color-mix(in srgb, var(--danger) 15%, transparent)",
	"rgba(255,255,255,0.04)": "color-mix(in srgb, var(--surface-raised) 4%, transparent)",
	"rgba(255, 255, 255, 0.04)": "color-mix(in srgb, var(--surface-raised) 4%, transparent)",
	"#e8e5da": "var(--rule)",
	"#E8E5DA": "var(--rule)",
	"#F0EFE8": "var(--surface-sunken)",
	"#f0efe8": "var(--surface-sunken)",
	"#F0F0E9": "var(--surface-sunken)",
	"#f0f0e9": "var(--surface-sunken)",
	"#F3EEE6": "var(--surface-sunken)",
	"#f3eee6": "var(--surface-sunken)",
	"#EAE9E1": "var(--surface-sunken)",
	"#eae9e1": "var(--surface-sunken)",
	"#EAE9E3": "var(--surface-sunken)",
	"#eae9e3": "var(--surface-sunken)",
	"#D4D3CD": "var(--rule)",
	"#d4d3cd": "var(--rule)",
	"#CCCCC6": "var(--rule)",
	"#ccccc6": "var(--rule)",
	"#B8B7B0": "var(--rule-strong)",
	"#b8b7b0": "var(--rule-strong)",
	"#C78E3F": "var(--accent-saffron)",
	"#c78e3f": "var(--accent-saffron)",
	"#A06A2A": "var(--accent-saffron)",
	"#a06a2a": "var(--accent-saffron)",
	"#C2A83E": "var(--accent-saffron)",
	"#c2a83e": "var(--accent-saffron)",
	"#B04A4A": "var(--danger)",
	"#b04a4a": "var(--danger)",
	"#9A3F3F": "var(--danger)",
	"#9a3f3f": "var(--danger)",
	"#C7684C": "var(--accent-orange)",
	"#c7684c": "var(--accent-orange)",
	"#E0897A": "var(--accent-orange)",
	"#e0897a": "var(--accent-orange)",
	"#E8C2AE": "var(--accent-orange)",
	"#e8c2ae": "var(--accent-orange)",
	"#E8C9BA": "var(--accent-orange)",
	"#e8c9ba": "var(--accent-orange)",
	"#F8E9E0": "var(--danger-tint)",
	"#f8e9e0": "var(--danger-tint)",
	"#FBF3EE": "var(--danger-tint)",
	"#fbf3ee": "var(--danger-tint)",
	"#F8E1D5": "var(--danger-tint)",
	"#f8e1d5": "var(--danger-tint)",
	"#F5E6DE": "var(--danger-tint)",
	"#f5e6de": "var(--danger-tint)",
	"#FBF6F2": "var(--danger-tint)",
	"#fbf6f2": "var(--danger-tint)",
	"#F5E2D8": "var(--danger-tint)",
	"#f5e2d8": "var(--danger-tint)",
	"#ECD9CE": "var(--danger-tint)",
	"#ecd9ce": "var(--danger-tint)",
	"#FBF1EC": "var(--danger-tint)",
	"#fbf1ec": "var(--danger-tint)",
	"#6A8CAF": "var(--accent-navy)",
	"#6a8caf": "var(--accent-navy)",
	"#5C7CA3": "var(--accent-navy)",
	"#5c7ca3": "var(--accent-navy)",
	"#3D6E6E": "var(--accent-navy)",
	"#3d6e6e": "var(--accent-navy)",
	"#A67C52": "var(--accent-saffron)",
	"#a67c52": "var(--accent-saffron)",
	"#A8BC8C": "var(--accent-lime)",
	"#a8bc8c": "var(--accent-lime)",
	"#A3B88A": "var(--accent-lime)",
	"#a3b88a": "var(--accent-lime)",
	"#B8C99D": "var(--accent-lime)",
	"#b8c99d": "var(--accent-lime)",
	"#E8EDE0": "var(--success-tint)",
	"#e8ede0": "var(--success-tint)",
	"#5C6F44": "var(--success)",
	"#5c6f44": "var(--success)",
	"#CFDAC0": "var(--success-tint)",
	"#cfdac0": "var(--success-tint)",
	"#DCE4D2": "var(--success-tint)",
	"#dce4d2": "var(--success-tint)",
	"rgba(20,20,19,0.06)": "color-mix(in srgb, var(--ink) 6%, transparent)",
	"rgba(20, 20, 19, 0.06)": "color-mix(in srgb, var(--ink) 6%, transparent)",
	"rgba(20,20,19,0.08)": "color-mix(in srgb, var(--ink) 8%, transparent)",
	"rgba(20, 20, 19, 0.08)": "color-mix(in srgb, var(--ink) 8%, transparent)",
	"rgba(20,20,19,0.12)": "color-mix(in srgb, var(--ink) 12%, transparent)",
	"rgba(20, 20, 19, 0.12)": "color-mix(in srgb, var(--ink) 12%, transparent)",
	"rgba(20,20,19,0.15)": "color-mix(in srgb, var(--ink) 15%, transparent)",
	"rgba(20, 20, 19, 0.15)": "color-mix(in srgb, var(--ink) 15%, transparent)",
	"rgba(20,20,19,0.18)": "color-mix(in srgb, var(--ink) 18%, transparent)",
	"rgba(20, 20, 19, 0.18)": "color-mix(in srgb, var(--ink) 18%, transparent)",
	"rgba(120,140,93,0.12)": "color-mix(in srgb, var(--accent-green) 12%, transparent)",
	"rgba(120, 140, 93, 0.12)": "color-mix(in srgb, var(--accent-green) 12%, transparent)",
	"rgba(120,140,93,0.16)": "color-mix(in srgb, var(--accent-green) 16%, transparent)",
	"rgba(120, 140, 93, 0.16)": "color-mix(in srgb, var(--accent-green) 16%, transparent)",
	"rgba(217,119,87,0.06)": "color-mix(in srgb, var(--accent-orange) 6%, transparent)",
	"rgba(217, 119, 87, 0.06)": "color-mix(in srgb, var(--accent-orange) 6%, transparent)",
	"rgba(217,119,87,0.10)": "color-mix(in srgb, var(--accent-orange) 10%, transparent)",
	"rgba(217, 119, 87, 0.10)": "color-mix(in srgb, var(--accent-orange) 10%, transparent)",
	"rgba(217,119,87,0.14)": "color-mix(in srgb, var(--accent-orange) 14%, transparent)",
	"rgba(217, 119, 87, 0.14)": "color-mix(in srgb, var(--accent-orange) 14%, transparent)",
	"rgba(176,74,63,0.10)": "color-mix(in srgb, var(--danger) 10%, transparent)",
	"rgba(176, 74, 63, 0.10)": "color-mix(in srgb, var(--danger) 10%, transparent)",
	"rgba(255,255,255,0.6)": "color-mix(in srgb, var(--surface-raised) 60%, transparent)",
	"rgba(255, 255, 255, 0.6)": "color-mix(in srgb, var(--surface-raised) 60%, transparent)",
	"rgba(250,249,245,0.12)": "color-mix(in srgb, var(--paper) 12%, transparent)",
	"rgba(250, 249, 245, 0.12)": "color-mix(in srgb, var(--paper) 12%, transparent)",
	"rgba(227,218,204,0.35)": "color-mix(in srgb, var(--primary-blue-tint) 35%, transparent)",
	"rgba(227, 218, 204, 0.35)": "color-mix(in srgb, var(--primary-blue-tint) 35%, transparent)",
	"rgba(199,142,63,0.16)": "color-mix(in srgb, var(--accent-saffron) 16%, transparent)",
	"rgba(199, 142, 63, 0.16)": "color-mix(in srgb, var(--accent-saffron) 16%, transparent)",
};

const TOKEN_ORDER = [
	"paper",
	"paperBackground",
	"surfaceRaised",
	"surfaceOverlay",
	"surfaceSunken",
	"headline",
	"bodyText",
	"ink",
	"mutedText",
	"subtlestText",
	"inverseText",
	"primaryBlue",
	"primaryBlueTint",
	"primaryBlueTintStrong",
	"rule",
	"ruleStrong",
	"link",
	"linkPressed",
	"selected",
	"accentLime",
	"accentPurple",
	"accentSaffron",
	"accentOrange",
	"accentNavy",
	"accentGreen",
	"accentRed",
	"collectionSoftware",
	"collectionProduct",
	"collectionService",
	"gridDot",
	"gridLine",
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

function pushThemeAliases(lines) {
	lines.push(`\t--font-display: ${FONT_STACKS.display};`);
	lines.push(`\t--font-body: ${FONT_STACKS.body};`);
	lines.push(`\t--font-mono: ${FONT_STACKS.mono};`);
	lines.push(`\t--font-numeric: ${FONT_STACKS.numeric};`);
	lines.push("\t--font-sans: var(--font-body);");
	lines.push("\t--brand: var(--primary-blue);");
	lines.push("\t--accent: var(--primary-blue);");
	lines.push("\t--primary: var(--primary-blue);");
	lines.push("\t--accent-primary: var(--primary-blue);");
	lines.push("\t--collection-accent-software: var(--collection-software);");
	lines.push("\t--collection-accent-product: var(--collection-product);");
	lines.push("\t--collection-accent-service: var(--collection-service);");
	lines.push("\t--paper-rule: var(--grid-dot);");
	lines.push("\t--grid-size: 16px;");
	lines.push("\t--grid-major-size: 72px;");
	lines.push("\t--grid-background: radial-gradient(circle at 1px 1px, var(--grid-dot) 1px, transparent 1.25px), linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);");
	lines.push("\t--grid-background-size: var(--grid-size) var(--grid-size), var(--grid-major-size) var(--grid-major-size), var(--grid-major-size) var(--grid-major-size);");
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
	pushThemeAliases(lines);
	lines.push(`\t--shadow: var(--ds-shadow-raised, ${tokens.light.shadow});`);
	lines.push("}", "");
	lines.push('[data-theme="dark"] {');
	for (const key of TOKEN_ORDER) {
		if (!tokens.semantic[key]) throw new Error(`Missing semantic token: ${key}`);
		if (!tokens.dark[key]) throw new Error(`Missing dark token: ${key}`);
		lines.push(`\t${cssVarName(key)}: ${semanticWithFallback(tokens.semantic[key], tokens.dark[key])};`);
	}
	pushThemeAliases(lines);
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

export function inlineFont(fileName, mime = "font/woff2") {
	const filePath = path.join(FONTS_DIR, fileName);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Font file not found: ${filePath}`);
	}
	return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

export function buildFontFaceBlock() {
	return FONT_FILES.map(({ family, file, format, mime, weight, style, unicodeRange }) => {
		const unicodeRangeRule = unicodeRange ? `\n\tunicode-range: ${unicodeRange};` : "";
		return `@font-face {
\tfont-family: "${family}";
\tsrc: url("${inlineFont(file, mime)}") format("${format}");
\tfont-weight: ${weight};
\tfont-style: ${style};
\tfont-display: swap;
${unicodeRangeRule}}`;
	}).join("\n");
}

export function buildSharedCssBlock() {
	return `${buildFontFaceBlock()}\n${readStylesCss()}`;
}
