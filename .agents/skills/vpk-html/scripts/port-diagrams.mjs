#!/usr/bin/env node
/*
 * Ports the 14 kami diagram primitives from ~/.agents/skills/kami/assets/diagrams/
 * into vpk-html/assets/diagrams/, re-skinned with vpk-html's semantic
 * blueprint identity and the Geist typeface trio (Sans / Mono /
 * Pixel-Square).
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

// Palette mapping: kami → vpk-html semantic aliases.
const COLOR_MAP = {
	"#f5f4ed": "var(--vpk-paper)",
	"#F5F4ED": "var(--vpk-paper)",
	"#faf9f5": "var(--vpk-paper)",
	"#FAF9F5": "var(--vpk-paper)",
	"#141413": "var(--vpk-ink)",
	"#504e49": "var(--vpk-muted-text)",
	"#6b6a64": "var(--vpk-subtlest-text)",
	"#1B365D": "var(--vpk-blueprint)",
	"#1b365d": "var(--vpk-blueprint)",
	"#2D5A8A": "var(--vpk-focus-ring)",
	"#EEF2F7": "var(--vpk-blueprint-tint)",
	"#eef2f7": "var(--vpk-blueprint-tint)",
	"#e8e6dc": "var(--vpk-rule)",
	"#E8E6DC": "var(--vpk-rule)",
	"#E9E8E1": "var(--vpk-surface-sunken)",
	"#EEEDE6": "var(--vpk-surface-sunken)",
	"#EAE9E2": "var(--vpk-surface-sunken)",
	"#DEDED7": "var(--vpk-rule)",
	"#E3E2DC": "var(--vpk-rule)",
	"#B2B1AC": "var(--vpk-rule-strong)",
	"#B53333": "var(--vpk-danger)",
	"#b53333": "var(--vpk-danger)",
	"#30302E": "var(--vpk-ink)",
	"#30302e": "var(--vpk-ink)",
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
    color-scheme: light dark;
    --vpk-paper: var(--ds-surface, #ffffff);
    --vpk-surface-raised: var(--ds-surface-raised, #ffffff);
    --vpk-surface-sunken: var(--ds-surface-sunken, #f0f1f2);
    --vpk-ink: var(--ds-text, #292a2e);
    --vpk-muted-text: var(--ds-text-subtle, #505258);
    --vpk-subtlest-text: var(--ds-text-subtlest, #6b6e76);
    --vpk-blueprint: var(--ds-background-brand-bold, #1868db);
    --vpk-blueprint-tint: var(--ds-background-information, #e9f2fe);
    --vpk-rule: var(--ds-border, #0b120e24);
    --vpk-rule-strong: var(--ds-border-bold, #7d818a);
    --vpk-focus-ring: var(--ds-border-focused, #4688ec);
    --vpk-danger: var(--ds-background-danger-bold, #c9372c);

    --vpk-font-sans: ${GEIST_SANS};
    --vpk-font-mono: ${GEIST_MONO};
    --vpk-font-display: ${GEIST_PIXEL};
  }

  [data-theme="dark"] {
    --vpk-paper: var(--ds-surface, #101214);
    --vpk-surface-raised: var(--ds-surface-raised, #22272b);
    --vpk-surface-sunken: var(--ds-surface-sunken, #161a1d);
    --vpk-ink: var(--ds-text, #dee4ea);
    --vpk-muted-text: var(--ds-text-subtle, #9fadbc);
    --vpk-subtlest-text: var(--ds-text-subtlest, #738496);
    --vpk-blueprint: var(--ds-background-brand-bold, #579dff);
    --vpk-blueprint-tint: var(--ds-background-information, #09326c);
    --vpk-rule: var(--ds-border, #a6c5e229);
    --vpk-rule-strong: var(--ds-border-bold, #738496);
    --vpk-focus-ring: var(--ds-border-focused, #579dff);
    --vpk-danger: var(--ds-background-danger-bold, #f87168);
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
    color: var(--vpk-blueprint);
    font-family: var(--vpk-font-mono);
    font-size: 10px;
    line-height: 14px;
    letter-spacing: 0.18em;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  h1 {
    color: var(--vpk-blueprint);
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
    color: var(--vpk-muted-text);
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
     vpk-html identity: Geist Pixel headline, Geist Sans body, semantic
     brand-blue accent. Drop the <svg> block into a
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
