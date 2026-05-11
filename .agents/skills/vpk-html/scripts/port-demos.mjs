#!/usr/bin/env node
/*
 * Ports kami's 4 demo HTML files from ~/.agents/skills/kami/assets/demos/
 * into vpk-html/assets/demos/, re-skinned with vpk-html's terminal/blueprint
 * identity (VT323 + Source Serif 4 + grid background + ink-blue accent).
 *
 * Mirrors the port-diagrams.mjs pattern: layout/structure preserved verbatim,
 * only chrome (fonts, colors, @font-face blocks, font-family stacks) changes.
 *
 * Also copies embedded images (kaku-action.jpg, kaku-hero.jpg) and the bonus
 * equity-report-en.png preview.
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

const DEMOS = [
	"demo-agent-slides.html",
	"demo-kaku.html",
	"demo-musk-resume.html",
	"demo-tesla.html",
];

const IMAGE_FILES = ["kaku-action.jpg", "kaku-hero.jpg"];
const COPIED_PNGS = ["equity-report-en.png"];

// Palette mapping: kami → vpk-html. Case-insensitive variants included.
const COLOR_MAP = {
	"#f5f4ed": "#ffffff",
	"#F5F4ED": "#ffffff",
	"#faf9f5": "#fafafa",
	"#FAF9F5": "#fafafa",
	"#141413": "#292a2e",
	"#3d3d3a": "#3a3d42",
	"#3D3D3A": "#3a3d42",
	"#4d4c48": "#4a4d52",
	"#504e49": "#505258",
	"#6b6a64": "#7a7c82",
	"#1B365D": "#1868db",
	"#1b365d": "#1868db",
	"#2D5A8A": "#4688ec",
	"#EEF2F7": "#e9f2fe",
	"#eef2f7": "#e9f2fe",
	"#E4ECF5": "#d4e4fc",
	"#e4ecf5": "#d4e4fc",
	"#D0DCE9": "#bcd2f7",
	"#D6E1EE": "#c4d8f9",
	"#e8e6dc": "#dadcdf",
	"#E8E6DC": "#dadcdf",
	"#e5e3d8": "#dadcdf",
	"#E5E3D8": "#dadcdf",
	"#DEDED7": "#dadcdf",
	"#E3E2DC": "#dde0e3",
	"#E9E8E1": "#e8eaee",
	"#EEEDE6": "#eef0f2",
	"#EAE9E2": "#e0e3e6",
	"#B2B1AC": "#abb0b6",
	"#B53333": "#c9372c",
	"#b53333": "#c9372c",
	"#30302E": "#3a3d42",
	"#30302e": "#3a3d42",
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

function rewriteFontFaceBlocks(text, VPK_FONT_FACE) {
	// Strip every kami @font-face block (single-line or multi-line) and inject
	// vpk-html's @font-face declarations once, just before :root.
	let out = text;

	// Multi-line @font-face blocks
	out = out.replace(/@font-face\s*\{[\s\S]*?\}\s*/g, "");

	// Insert vpk-html font-face block before the first :root declaration.
	if (/:root\s*\{/.test(out)) {
		out = out.replace(/(:root\s*\{)/, `${VPK_FONT_FACE}\n\n  $1`);
	} else if (/<style>/.test(out)) {
		out = out.replace(/<style>/, `<style>\n${VPK_FONT_FACE}\n`);
	}

	return out;
}

function rewriteHeader(text, slug) {
	const headerComment = `<!-- ==================================================================
     DEMO · ${slug.replace(/^demo-/, "").replace(/-/g, " ")} (vpk-html palette)
     Ported from kami's curated demos library and restyled with the
     vpk-html identity: VT323 display headlines, Source Serif body, grid
     background, ink-blue (#1868DB) accent. Layout, content, and SVG
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
  html { background: #ffffff; }
  body {
    background:
      linear-gradient(90deg, rgba(11, 18, 14, 0.018) 1px, transparent 1px),
      linear-gradient(0deg, rgba(11, 18, 14, 0.018) 1px, transparent 1px),
      #ffffff;
    background-size: 24px 24px;
  }
  /* Frame the document with vpk-html chrome when a kami .page or .frame exists */
  .page, .frame {
    border: 2px solid #292a2e !important;
    box-shadow: 0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31) !important;
  }
`;
	return text.replace(/<\/style>/, `${gridOverride}</style>`);
}

function transform(rawHtml, slug, fontFaceBlock) {
	let out = rawHtml;
	out = rewriteFontFaceBlocks(out, fontFaceBlock);
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

function copyExtraPngs() {
	for (const file of COPIED_PNGS) {
		const from = path.join(KAMI_DEMOS, file);
		const to = path.join(VPK_DEMOS, file);
		if (fs.existsSync(from)) {
			fs.copyFileSync(from, to);
			console.log(`  copy ${file}`);
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

	for (const file of DEMOS) {
		const slug = file.replace(/\.html$/, "");
		const sourcePath = path.join(KAMI_DEMOS, file);
		const targetPath = path.join(VPK_DEMOS, file);
		if (!fs.existsSync(sourcePath)) {
			console.warn(`skip ${slug} — not found in kami source`);
			continue;
		}
		const raw = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(targetPath, transform(raw, slug, fontFaceBlock), "utf8");
		console.log(`✓ ${slug}`);
	}

	copyImages();
	copyExtraPngs();

	console.log(`Ported ${DEMOS.length} demos → ${path.relative(process.cwd(), VPK_DEMOS)}`);
}

main();
