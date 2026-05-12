#!/usr/bin/env node
/*
 * Ports kami's 4 demo HTML files from ~/.agents/skills/kami/assets/demos/
 * into vpk-html/assets/demos/, re-skinned with vpk-html's terminal/blueprint
 * identity (Geist trio + semantic blueprint accent).
 *
 * Mirrors the port-diagrams.mjs pattern: layout/structure preserved verbatim,
 * only chrome (fonts, colors, @font-face blocks, font-family stacks) changes.
 *
 * Also copies embedded images (kaku-action.jpg, kaku-hero.jpg).
 *
 * Run: node scripts/port-demos.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const KAMI_ROOT = path.join(os.homedir(), ".agents/skills/kami");
const KAMI_DEMOS = path.join(KAMI_ROOT, "assets/demos");
const VPK_DEMOS = path.join(SKILL_ROOT, "assets/demos");
const VPK_THEME_CSS = path.join(SKILL_ROOT, "references/theme.css");

const DEMOS = [
	"demo-agent-slides.html",
	"demo-kaku.html",
	"demo-musk-resume.html",
	"demo-tesla.html",
];

const IMAGE_FILES = ["kaku-action.jpg", "kaku-hero.jpg"];

// Palette mapping: kami → vpk-html semantic aliases. Case-insensitive variants included.
const COLOR_MAP = {
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

// Inline Geist trio as base64 data URIs so demo HTML files are portable.
function inlineFont(filename) {
	const filePath = path.join(SKILL_ROOT, "assets/fonts", filename);
	if (!fs.existsSync(filePath)) throw new Error(`Font file not found: ${filePath}`);
	return `data:font/woff2;base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function buildVpkFontFace() {
	const geistSans = inlineFont("Geist-Regular.woff2");
	const geistMono = inlineFont("GeistMono-Regular.woff2");
	const geistPixel = inlineFont("GeistPixel-Square.woff2");
	return `  @font-face {
    font-family: "Geist";
    src: url("${geistSans}") format("woff2");
    font-weight: 400; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: "Geist Mono";
    src: url("${geistMono}") format("woff2");
    font-weight: 400; font-style: normal; font-display: swap;
  }
  @font-face {
    font-family: "Geist Pixel";
    src: url("${geistPixel}") format("woff2");
    font-weight: 400; font-style: normal; font-display: swap;
}`;
}

function buildVpkThemeBlock() {
	if (!fs.existsSync(VPK_THEME_CSS)) {
		throw new Error(`Theme file not found: ${VPK_THEME_CSS}`);
	}
	return fs.readFileSync(VPK_THEME_CSS, "utf8").trim();
}

function rewriteColors(text) {
	let out = text;
	for (const [from, to] of Object.entries(COLOR_MAP)) {
		out = out.split(from).join(to);
	}
	return out;
}

function rewriteFontStacks(text) {
	let out = text;

	// Charter serif stack → Source Serif 4
	out = out.replace(
		/Charter,\s*Georgia,?\s*(Palatino,?\s*)?serif/g,
		'"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
	);
	out = out.replace(
		/Charter,\s*Georgia,\s*Palatino,\s*"Songti SC",\s*serif/g,
		'"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
	);

	// TsangerJinKai02 (CN serif) → Source Serif 4 with CJK system fallback
	out = out.replace(
		/"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*"STSong",\s*Georgia,\s*serif/g,
		'"Geist", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);
	out = out.replace(
		/"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*Georgia,\s*serif/g,
		'"Geist", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);

	// YuMincho (JP serif) → Source Serif 4 with JP system fallback
	out = out.replace(
		/"YuMincho",\s*"Yu Mincho",\s*"Hiragino Mincho ProN",\s*"Noto Serif CJK JP",\s*"Source Han Serif JP",\s*"TsangerJinKai02",\s*Georgia,\s*serif/g,
		'"Geist", "Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", ui-sans-serif, system-ui, sans-serif',
	);

	// Mono stack normalization
	out = out.replace(
		/"JetBrains Mono",\s*"SF Mono",\s*"Fira Code"[^;]*/g,
		'"Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
	);
	out = out.replace(
		/"JetBrains Mono",\s*"SF Mono",\s*Consolas,\s*monospace/g,
		'"Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace',
	);

	return out;
}

function rewriteFontFaceBlocks(text, VPK_FONT_FACE, themeBlock) {
	// Strip every kami @font-face block (single-line or multi-line) and inject
	// vpk-html's @font-face declarations once, just before :root.
	let out = text;

	// Multi-line @font-face blocks
	out = out.replace(/@font-face\s*\{[\s\S]*?\}\s*/g, "");
	const injected = `${VPK_FONT_FACE}\n\n${themeBlock}`;

	// Insert vpk-html font-face block before the first :root declaration.
	if (/:root\s*\{/.test(out)) {
		out = out.replace(/(:root\s*\{)/, `${injected}\n\n  $1`);
	} else if (/<style>/.test(out)) {
		out = out.replace(/<style>/, `<style>\n${injected}\n`);
	}

	return out;
}

function rewriteHeader(text, slug) {
	const headerComment = `<!-- ==================================================================
     DEMO · ${slug.replace(/^demo-/, "").replace(/-/g, " ")} (vpk-html palette)
     Ported from kami's curated demos library and restyled with the
     vpk-html identity: Geist display/body/mono, semantic paper texture,
     and blueprint accent. Layout, content, and SVG
     geometry are preserved verbatim from kami.
     Source: https://github.com/tw93/Kami
     ================================================================== -->`;

	let out = text;
	out = out.replace(/<!--[\s\S]*?-->\n?/, `${headerComment}\n`);
	out = out.replace(/<meta\s+name="generator"\s+content="[^"]*"\s*\/?>/i, `<meta name="generator" content="vpk-html">`);
	return out;
}

function rewriteBodyAccent(text) {
	// Inject the vpk-html grid background pattern on the body if not already
	// present. Done as a CSS append at the end of the <style> block so it
	// overrides whatever kami sets.
	const gridOverride = `

  /* vpk-html identity overrides */
  html { background: var(--vpk-paper); }
  body {
    background:
      radial-gradient(circle at 1px 1px, var(--vpk-paper-rule) 1px, transparent 0),
      var(--vpk-paper);
    background-size: 16px 16px;
  }
  /* Frame the document with vpk-html chrome when a kami .page or .frame exists */
  .page, .frame {
    border: 2px solid var(--vpk-ink) !important;
    box-shadow: var(--vpk-shadow) !important;
  }
`;
	return text.replace(/<\/style>/, `${gridOverride}</style>`);
}

function transform(rawHtml, slug, fontFaceBlock, themeBlock) {
	let out = rawHtml;
	out = rewriteFontFaceBlocks(out, fontFaceBlock, themeBlock);
	out = rewriteFontStacks(out);
	out = rewriteColors(out);
	out = rewriteHeader(out, slug);
	out = rewriteBodyAccent(out);
	return out;
}

function copyImages() {
	const sourceDir = path.join(KAMI_DEMOS, "images");
	const destDir = path.join(VPK_DEMOS, "images");
	if (!fs.existsSync(sourceDir)) return;
	fs.mkdirSync(destDir, { recursive: true });
	for (const file of IMAGE_FILES) {
		const from = path.join(sourceDir, file);
		const to = path.join(destDir, file);
		if (fs.existsSync(from)) {
			fs.copyFileSync(from, to);
			console.log(`  copy images/${file}`);
		}
	}
}

function main() {
	if (!fs.existsSync(KAMI_DEMOS)) {
		console.error(`Kami demos not found at ${KAMI_DEMOS}`);
		process.exitCode = 1;
		return;
	}
	fs.mkdirSync(VPK_DEMOS, { recursive: true });

	console.log("Inlining Geist fonts as base64 data URIs…");
	const fontFaceBlock = buildVpkFontFace();
	const themeBlock = buildVpkThemeBlock();

	for (const file of DEMOS) {
		const slug = file.replace(/\.html$/, "");
		const sourcePath = path.join(KAMI_DEMOS, file);
		const targetPath = path.join(VPK_DEMOS, file);
		if (!fs.existsSync(sourcePath)) {
			console.warn(`skip ${slug} — not found in kami source`);
			continue;
		}
		const raw = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(targetPath, transform(raw, slug, fontFaceBlock, themeBlock), "utf8");
		console.log(`✓ ${slug}`);
	}

	copyImages();

	console.log(`Ported ${DEMOS.length} demos → ${path.relative(process.cwd(), VPK_DEMOS)}`);
}

main();
