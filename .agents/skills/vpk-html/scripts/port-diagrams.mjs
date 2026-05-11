#!/usr/bin/env node
/*
 * Ports the 14 kami diagram primitives from ~/.agents/skills/kami/assets/diagrams/
 * into vpk-html/assets/diagrams/, re-skinned with vpk-html's Making Software
 * identity (warm paper + electric blue + accent-warning red) and the Geist
 * typeface trio (Sans / Mono / Pixel-Square).
 *
 * The SVG geometry is preserved verbatim — only fills, strokes, fonts, and
 * surrounding chrome change. Run with: node scripts/port-diagrams.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const VPK_FONTS_DIR = path.join(SKILL_ROOT, "assets/fonts");
const KAMI_ROOT = path.join(os.homedir(), ".agents/skills/kami");
const KAMI_DIAGRAMS = path.join(KAMI_ROOT, "assets/diagrams");
const VPK_DIAGRAMS = path.join(SKILL_ROOT, "assets/diagrams");

function inlineFont(filename) {
	const filePath = path.join(VPK_FONTS_DIR, filename);
	if (!fs.existsSync(filePath)) throw new Error(`Font file not found: ${filePath}`);
	return `data:font/woff2;base64,${fs.readFileSync(filePath).toString("base64")}`;
}

// Palette mapping: kami → vpk-html (Making Software language).
const COLOR_MAP = {
	"#f5f4ed": "#FBFBFB", // parchment → paper
	"#F5F4ED": "#FBFBFB",
	"#faf9f5": "#FBFBFB", // ivory → paper (collapse to single neutral)
	"#FAF9F5": "#FBFBFB",
	"#141413": "#0A0A0A", // near-black → ink
	"#504e49": "#525252", // olive → mid gray
	"#6b6a64": "#757575", // stone → ink-muted (50% ink)
	"#1B365D": "#1B3FE5", // brand → accent-blue (electric)
	"#1b365d": "#1B3FE5",
	"#2D5A8A": "#1B3FE5", // ink-light collapses to accent
	"#EEF2F7": "#E6EAFB", // brand-tint → blue-tint
	"#eef2f7": "#E6EAFB",
	"#e8e6dc": "#E0E0E0", // border (warm) → hairline neutral
	"#E8E6DC": "#E0E0E0",
	"#E9E8E1": "#EAEAEA",
	"#EEEDE6": "#EFEFEF",
	"#EAE9E2": "#E5E5E5",
	"#DEDED7": "#E0E0E0",
	"#E3E2DC": "#E0E0E0",
	"#B2B1AC": "#BDBDBD",
	"#B53333": "#D14E3E", // error → accent-warning
	"#b53333": "#D14E3E",
	"#30302E": "#2A2A2A",
	"#30302e": "#2A2A2A",
};

const GEIST_SANS = '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const GEIST_MONO = '"Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace';
const GEIST_PIXEL = '"Geist Pixel", "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace';

const FONT_REPLACEMENTS = [
	{
		// kami Charter serif stack (body) → Geist Sans.
		pattern: /Charter,\s*Georgia,\s*Palatino,\s*serif/g,
		replacement: GEIST_SANS,
	},
	{
		// kami JetBrains Mono stack with CJK fallbacks → Geist Mono.
		pattern:
			/'JetBrains Mono',\s*"SF Mono",\s*Consolas,\s*"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*monospace/g,
		replacement: GEIST_MONO,
	},
	{
		// Short JetBrains Mono refs inside SVG <text font-family="..."> attributes.
		pattern: /'JetBrains Mono',\s*monospace/g,
		replacement: "'Geist Mono', monospace",
	},
];

function buildHead() {
	const geistSans = inlineFont("Geist-Regular.woff2");
	const geistMono = inlineFont("GeistMono-Regular.woff2");
	const geistPixel = inlineFont("GeistPixel-Square.woff2");
	return `<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --vpk-paper: #FBFBFB;
    --vpk-ink: #0A0A0A;
    --vpk-ink-muted: #757575;
    --vpk-accent-blue: #1B3FE5;
    --vpk-accent-warning: #D14E3E;
    --vpk-rule: #E0E0E0;

    --vpk-font-sans: ${GEIST_SANS};
    --vpk-font-mono: ${GEIST_MONO};
    --vpk-font-display: ${GEIST_PIXEL};
  }

  @font-face {
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
  }

  body {
    background: var(--vpk-paper);
    color: var(--vpk-ink);
    font-family: var(--vpk-font-sans);
    font-size: 16px;
    line-height: 1.8;
    min-height: 100vh;
    padding: clamp(2rem, 4vw, 4rem);
  }

  .frame {
    margin: 0 auto;
    max-width: 1080px;
    padding: 0;
  }

  .eyebrow {
    color: var(--vpk-accent-warning);
    font-family: var(--vpk-font-mono);
    font-size: 10px;
    line-height: 14px;
    letter-spacing: 0.18em;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  h1 {
    color: var(--vpk-accent-blue);
    font-family: var(--vpk-font-display);
    font-size: 16px;
    line-height: 1.8;
    font-weight: 400;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }

  svg { display: block; min-width: 860px; width: 100%; }

  .caption {
    border-top: 1px solid var(--vpk-rule);
    color: var(--vpk-ink-muted);
    font-family: var(--vpk-font-sans);
    font-size: 14px;
    line-height: 22px;
    margin-top: 24px;
    max-width: 60ch;
    padding-top: 16px;
  }
</style>`;
}

function rewriteColors(text) {
	let out = text;
	for (const [from, to] of Object.entries(COLOR_MAP)) {
		out = out.split(from).join(to);
	}
	return out;
}

function rewriteFonts(text) {
	let out = text;
	for (const { pattern, replacement } of FONT_REPLACEMENTS) {
		out = out.replace(pattern, replacement);
	}
	return out;
}

function transform(rawHtml, slug, headBlock) {
	// Replace the <style>…</style> block wholesale with vpk-html chrome.
	const styled = rawHtml.replace(/<style>[\s\S]*?<\/style>/, headBlock);

	// Rewrite the per-diagram eyebrow label so it identifies as vpk.
	const eyebrowReplaced = styled.replace(
		/<p class="eyebrow">[^<]*<\/p>/,
		`<p class="eyebrow">${slug.replace(/-/g, " ")} · vpk-html diagram</p>`,
	);

	const titleReplaced = eyebrowReplaced.replace(
		/<title>[^<]*<\/title>/,
		`<title>${slug.replace(/-/g, " ")} · vpk-html diagram</title>`,
	);

	const headerComment = `<!-- ==================================================================
     DIAGRAM · ${slug.replace(/-/g, " ")} (vpk-html palette)
     SVG primitive ported from kami's diagram library, restyled with the
     vpk-html identity: Geist Pixel headline, Geist Sans body, warm paper
     background, ink-blue (#1868DB) accent. Drop the <svg> block into a
     long-doc, portfolio, or design-system payload via section.trustedHtml.
     ================================================================== -->`;
	const commentReplaced = titleReplaced.replace(/<!--[\s\S]*?-->\n?/, `${headerComment}\n`);

	// Now rewrite colors and fonts everywhere (including SVG).
	const colored = rewriteColors(commentReplaced);
	const fonted = rewriteFonts(colored);

	return fonted;
}

function main() {
	if (!fs.existsSync(KAMI_DIAGRAMS)) {
		console.error(`Kami diagrams not found at ${KAMI_DIAGRAMS}`);
		process.exitCode = 1;
		return;
	}
	fs.mkdirSync(VPK_DIAGRAMS, { recursive: true });

	console.log("Inlining Geist fonts as base64 data URIs…");
	const headBlock = buildHead();

	const files = fs.readdirSync(KAMI_DIAGRAMS).filter(name => name.endsWith(".html"));
	for (const file of files) {
		const slug = file.replace(/\.html$/, "");
		const sourcePath = path.join(KAMI_DIAGRAMS, file);
		const targetPath = path.join(VPK_DIAGRAMS, file);
		const raw = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(targetPath, transform(raw, slug, headBlock), "utf8");
		console.log(`✓ ${slug}`);
	}
	console.log(`Ported ${files.length} diagrams → ${path.relative(process.cwd(), VPK_DIAGRAMS)}`);
}

main();
