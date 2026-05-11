#!/usr/bin/env node
/*
 * Ports kami's 8 EN HTML templates from ~/.agents/skills/kami/assets/templates/
 * into vpk-html/assets/templates/, re-skinned with vpk-html's identity
 * (warm paper + electric blue + Geist Sans body + Geist Mono labels +
 * Geist Pixel masthead).
 *
 * Layout, @page rules, and {{placeholders}} are preserved verbatim. Only
 * chrome (fonts, colors, @font-face blocks, font-family stacks) changes,
 * plus a small set of vpk identity overrides appended to the <style> block.
 *
 * Run: node scripts/port-templates.mjs
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
const KAMI_TEMPLATES = path.join(KAMI_ROOT, "assets/templates");
const VPK_TEMPLATES = path.join(SKILL_ROOT, "assets/templates");
const VPK_FONTS_DIR = path.join(SKILL_ROOT, "assets/fonts");

// Inline fonts as base64 data URIs so filled documents are portable across
// directories (kami uses ../fonts/ relative paths; we want a filled file in
// docs/html/<slug>.html to work without symlinks or copy-along font dirs).
function inlineFont(filename) {
	const filePath = path.join(VPK_FONTS_DIR, filename);
	if (!fs.existsSync(filePath)) {
		throw new Error(`Font file not found: ${filePath}`);
	}
	const buffer = fs.readFileSync(filePath);
	return `data:font/woff2;base64,${buffer.toString("base64")}`;
}

// Source filename → output slug. EN variants only; slides-weasy maps to slides.
const TEMPLATES = [
	{ source: "one-pager-en.html", slug: "one-pager" },
	{ source: "long-doc-en.html", slug: "long-doc" },
	{ source: "letter-en.html", slug: "letter" },
	{ source: "portfolio-en.html", slug: "portfolio" },
	{ source: "resume-en.html", slug: "resume" },
	{ source: "slides-weasy-en.html", slug: "slides" },
	{ source: "equity-report-en.html", slug: "equity-report" },
	{ source: "changelog-en.html", slug: "changelog" },
];

// Palette mapping: kami → vpk-html (Making Software design language).
//   paper          #FBFBFB  warm off-white, never pure white
//   ink            #0A0A0A  warm-tinted near-black
//   ink-muted      #757575  50% ink, captions / margin labels
//   accent-blue    #1B3FE5  electric blue, masthead / links / diagrams
//   accent-warning #D14E3E  warm red, figure-tag margin labels only
const COLOR_MAP = {
	"#f5f4ed": "#FBFBFB", // parchment → paper
	"#F5F4ED": "#FBFBFB",
	"#faf9f5": "#FBFBFB", // ivory → paper (collapse to single neutral)
	"#FAF9F5": "#FBFBFB",
	"#141413": "#0A0A0A", // near-black → ink
	"#3d3d3a": "#2A2A2A", // dark-warm
	"#3D3D3A": "#2A2A2A",
	"#4d4c48": "#3D3D3D",
	"#504e49": "#525252", // olive → mid gray
	"#6b6a64": "#757575", // stone → ink-muted (50% ink)
	"#1B365D": "#1B3FE5", // brand → accent-blue (electric)
	"#1b365d": "#1B3FE5",
	"#2D5A8A": "#1B3FE5", // ink-light collapses to same accent
	"#EEF2F7": "#E6EAFB", // brand-tint → blue-tint (lighter)
	"#eef2f7": "#E6EAFB",
	"#E4ECF5": "#D5DDF8",
	"#e4ecf5": "#D5DDF8",
	"#D0DCE9": "#BFCBF6",
	"#D6E1EE": "#C8D3F7",
	"#e8e6dc": "#E0E0E0", // border (warm) → border (neutral hairline)
	"#E8E6DC": "#E0E0E0",
	"#e5e3d8": "#E0E0E0",
	"#E5E3D8": "#E0E0E0",
	"#DEDED7": "#E0E0E0",
	"#E3E2DC": "#E0E0E0",
	"#E9E8E1": "#EAEAEA",
	"#EEEDE6": "#EFEFEF",
	"#EAE9E2": "#E5E5E5",
	"#B2B1AC": "#BDBDBD",
	"#B53333": "#D14E3E", // error red → accent-warning
	"#b53333": "#D14E3E",
	"#30302E": "#2A2A2A",
	"#30302e": "#2A2A2A",
};

// Replace kami's @font-face blocks with vpk-html's font set, inlined as
// base64 data URIs (single-file portability — no relative font paths).
// vpk-html v4: Geist trio (Sans / Mono / Pixel-Square) by Vercel.
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

// Making Software identity overrides: paper background, no chrome, 4-size scale,
// family + weight + color hierarchy instead of size hierarchy.
const VPK_OVERRIDES = `

  /* ===== vpk-html identity overrides (Making Software language) ===== */

  /* Paper background — warm off-white, never pure white. No grid, no banding. */
  html, body { background: #FBFBFB !important; }

  /* Strip all section chrome: no borders, no shadows, no rounded corners,
     no section background colors. Per Making Software refuses-list. */
  .frame, .page, section, .card, .metric, .metric-card,
  .header, .hero, .cover, .doc-cover,
  .quote, .pull-quote, .callout, .verdict, .tag, .pill {
    background: transparent !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  /* Preserve a single hairline border ONLY on tables (they need column rules). */
  table, th, td {
    border-color: #E0E0E0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  /* Hairline rule between sections — flat 1px, no inset, no shadow. */
  hr, .rule, .section-rule {
    background: #E0E0E0 !important;
    border: 0 !important;
    height: 1px !important;
  }

  /* 4-size type scale: 10 / 12 / 14 / 16px. Body is 16px, all headings are 16px.
     Hierarchy comes from family + weight + color + position. */
  body, p, li, dd, dt, blockquote, td, th, .body, .lead, .prose {
    font-family: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: #0A0A0A !important;
  }
  h1, h2, h3, h4, h5, h6,
  .cover-title, .doc-title, .resume-name, .deck-cover .title,
  .hero h1, .title-block h1, .equity-header .ticker, .letter-subject,
  .section-title {
    font-family: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 16px !important;
    line-height: 1.8 !important;
    font-weight: 600 !important;
    letter-spacing: 0 !important;
    color: #0A0A0A !important;
    margin: 0 !important;
  }

  /* Masthead role: cover-title / first h1 carries the brand. Geist Pixel, accent-blue. */
  .cover h1:first-child, .cover-title:first-child,
  .hero h1:first-child, .doc-title h1:first-child,
  .resume-name {
    font-family: "Geist Pixel", "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace !important;
    color: #1B3FE5 !important;
    font-weight: 400 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.02em !important;
  }

  /* Margin labels / eyebrows / figure tags: Geist Mono, 10–12px, accent-warning. */
  .eyebrow, .label, .meta-mono, .kicker,
  .figure-tag, .margin-label, .fig-num, .stage-name {
    font-family: "Geist Pixel", "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace !important;
    font-size: 10px !important;
    line-height: 14px !important;
    letter-spacing: 0.18em !important;
    text-transform: uppercase !important;
    color: #D14E3E !important;
    font-weight: 400 !important;
  }

  /* Secondary metadata / captions: 14px, ink-muted. */
  .caption, .meta, .footnote, .annotation, .subtitle, .cover-sub, .cover-meta,
  .doc-meta, .release-meta, .stage-detail, .stage-meta {
    font-family: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 14px !important;
    line-height: 22px !important;
    color: #757575 !important;
  }

  /* Links: same accent-blue as masthead. No underline by default; underline on hover. */
  a, a:visited {
    color: #1B3FE5 !important;
    text-decoration: none !important;
  }
  a:hover {
    text-decoration: underline !important;
    text-decoration-thickness: 1px !important;
    text-underline-offset: 3px !important;
  }

  /* Emphasis: italic preferred; bold reserved for headings. */
  .hl, mark, strong { color: #1B3FE5 !important; background: transparent !important; font-weight: 600 !important; }
  em, i { font-style: italic !important; color: #0A0A0A !important; }

  /* Dotted rule utility (Making Software signature separator). */
  .dotted-rule, .vpk-dotted-rule {
    background-image: radial-gradient(circle, #0A0A0A 1px, transparent 1px) !important;
    background-size: 8px 8px !important;
    background-repeat: repeat-x !important;
    background-position: 0 50% !important;
    background-color: transparent !important;
    border: 0 !important;
    height: 8px !important;
    margin: 32px 0 !important;
  }

  /* Drop cap on the first paragraph after a section break. */
  section > p:first-child::first-letter,
  .lead::first-letter,
  .cover + p::first-letter {
    font-family: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif !important;
    color: #0A0A0A !important;
    float: left !important;
    font-size: 48px !important;
    line-height: 1 !important;
    padding-right: 8px !important;
    padding-top: 4px !important;
    font-weight: 600 !important;
  }
`;

function rewriteColors(text) {
	let out = text;
	for (const [from, to] of Object.entries(COLOR_MAP)) {
		out = out.split(from).join(to);
	}
	return out;
}

function rewriteFontStacks(text) {
	let out = text;
	const GEIST_SANS = '"Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
	const GEIST_MONO = '"Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace';

	// kami's Charter serif stacks (multiple variants) → Geist Sans.
	out = out.replace(
		/Charter,\s*Georgia,\s*\n?\s*Palatino,\s*"Times New Roman",\s*serif/g,
		GEIST_SANS,
	);
	out = out.replace(/Charter,\s*Georgia,\s*Palatino,\s*serif/g, GEIST_SANS);
	out = out.replace(/Charter,\s*Georgia,\s*Palatino,\s*"Songti SC",\s*serif/g, GEIST_SANS);
	// TsangerJinKai02 (kami CN serif) → Geist Sans + CJK system fallback.
	out = out.replace(
		/"TsangerJinKai02"[^;]*serif/g,
		'"Geist", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);
	// kami's older JetBrainsMono.woff2 path → Geist Mono filename (the path is dead
	// anyway since templates inline fonts as base64; this just keeps strings consistent).
	out = out.replace(/JetBrainsMono\.woff2/g, "GeistMono-Regular.woff2");
	// kami's JetBrains Mono font-family stacks → Geist Mono.
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*Consolas,\s*monospace/g, GEIST_MONO);
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*"Fira Code"[^;]*/g, GEIST_MONO);
	return out;
}

function rewriteFontFaceBlocks(text, fontFaceBlock) {
	let out = text;
	out = out.replace(/@font-face\s*\{[\s\S]*?\}\s*/g, "");
	if (/:root\s*\{/.test(out)) {
		out = out.replace(/(:root\s*\{)/, `${fontFaceBlock}\n\n  $1`);
	} else if (/<style>/.test(out)) {
		out = out.replace(/<style>/, `<style>\n${fontFaceBlock}\n`);
	}
	return out;
}

function rewriteHeader(text, slug) {
	const friendly = slug.replace(/-/g, " ");
	const headerComment = `<!-- ==================================================================
     TEMPLATE · ${friendly} (vpk-html · Making Software identity)
     Ported from kami's editorial template library, restyled with the
     Making Software design language: warm paper (#FBFBFB), warm ink
     (#0A0A0A), electric accent-blue (#1B3FE5), accent-warning red
     (#D14E3E) for figure tags, ink-muted (#757575) for captions.
     Geist Pixel (Square) masthead, Geist Sans body, Geist Mono labels, 16px throughout
     (hierarchy via family + weight + color, not size).
     No section borders. No shadows. No grid. No rounded corners.
     Layout and double-curly placeholders preserved verbatim from kami.
     Source: https://github.com/tw93/Kami (MIT)
     Design language: design-makingsoftware.md (extract from makingsoftware.com)
     ================================================================== -->`;
	let out = text;
	out = out.replace(/<!--[\s\S]*?-->\n?/, `${headerComment}\n`);
	if (/<meta\s+name="generator"/i.test(out)) {
		out = out.replace(/<meta\s+name="generator"\s+content="[^"]*"\s*\/?>/i, `<meta name="generator" content="vpk-html">`);
	} else {
		out = out.replace(/<meta\s+charset="[^"]*"\s*\/?>/i, match => `${match}\n<meta name="generator" content="vpk-html">`);
	}
	return out;
}

function appendOverrides(text) {
	return text.replace(/<\/style>/, `${VPK_OVERRIDES}</style>`);
}

function transform(rawHtml, slug, fontFaceBlock) {
	let out = rawHtml;
	out = rewriteFontFaceBlocks(out, fontFaceBlock);
	out = rewriteFontStacks(out);
	out = rewriteColors(out);
	out = rewriteHeader(out, slug);
	out = appendOverrides(out);
	return out;
}

function main() {
	if (!fs.existsSync(KAMI_TEMPLATES)) {
		console.error(`Kami templates not found at ${KAMI_TEMPLATES}`);
		process.exitCode = 1;
		return;
	}
	fs.mkdirSync(VPK_TEMPLATES, { recursive: true });

	console.log("Inlining fonts as base64 data URIs…");
	const fontFaceBlock = buildVpkFontFace();

	for (const { source, slug } of TEMPLATES) {
		const sourcePath = path.join(KAMI_TEMPLATES, source);
		const targetPath = path.join(VPK_TEMPLATES, `${slug}.html`);
		if (!fs.existsSync(sourcePath)) {
			console.warn(`skip ${slug} — ${source} not found in kami source`);
			continue;
		}
		const raw = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(targetPath, transform(raw, slug, fontFaceBlock), "utf8");
		console.log(`✓ ${slug} (from ${source})`);
	}

	console.log(`Ported ${TEMPLATES.length} templates → ${path.relative(process.cwd(), VPK_TEMPLATES)}`);
}

main();
