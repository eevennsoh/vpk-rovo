#!/usr/bin/env node
/*
 * Ports kami's 8 EN HTML templates from ~/.agents/skills/kami/assets/templates/
 * into vpk-html/assets/templates/, re-skinned with vpk-html's semantic
 * blueprint identity (Geist Sans body + Geist Mono labels + Geist Pixel
 * masthead).
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
import { buildFontFaceBlock, FONT_STACKS, KAMI_COLOR_MAP, readStylesCss } from "./shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const KAMI_ROOT = path.join(os.homedir(), ".agents/skills/kami");
const KAMI_TEMPLATES = path.join(KAMI_ROOT, "assets/templates");
const VPK_TEMPLATES = path.join(SKILL_ROOT, "assets/templates");

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

// vpk-html identity overrides: semantic paper, no chrome, 4-size scale,
// family + weight + color hierarchy instead of size hierarchy.
const VPK_OVERRIDES = `

  /* ===== vpk-html identity overrides ===== */

  html, body { background: var(--vpk-paper) !important; }

  /* Strip section chrome unless a component opts into raised-surface treatment. */
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
    border-color: var(--vpk-rule) !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  /* Hairline rule between sections — flat 1px, no inset, no shadow. */
  hr, .rule, .section-rule {
    background: var(--vpk-rule) !important;
    border: 0 !important;
    height: 1px !important;
  }

  /* 4-size type scale: 10 / 12 / 14 / 16px. Body is 16px, all headings are 16px.
     Hierarchy comes from family + weight + color + position. */
  body, p, li, dd, dt, blockquote, td, th, .body, .lead, .prose {
    font-family: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 16px !important;
    line-height: 1.8 !important;
    color: var(--vpk-ink) !important;
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
    color: var(--vpk-ink) !important;
    margin: 0 !important;
  }

  /* Masthead role: cover-title / first h1 carries the semantic blueprint accent. */
  .cover h1:first-child, .cover-title:first-child,
  .hero h1:first-child, .doc-title h1:first-child,
  .resume-name {
    font-family: "Geist Pixel", "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace !important;
    color: var(--vpk-blueprint) !important;
    font-weight: 400 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.02em !important;
  }

  /* Margin labels / eyebrows / figure tags: Geist Mono, 10-12px, blueprint. */
  .eyebrow, .label, .meta-mono, .kicker,
  .figure-tag, .margin-label, .fig-num, .stage-name {
    font-family: "Geist Pixel", "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace !important;
    font-size: 10px !important;
    line-height: 14px !important;
    letter-spacing: 0.18em !important;
    text-transform: uppercase !important;
    color: var(--vpk-blueprint) !important;
    font-weight: 400 !important;
  }

  /* Secondary metadata / captions: 14px, ink-muted. */
  .caption, .meta, .footnote, .annotation, .subtitle, .cover-sub, .cover-meta,
  .doc-meta, .release-meta, .stage-detail, .stage-meta {
    font-family: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif !important;
    font-size: 14px !important;
    line-height: 22px !important;
    color: var(--vpk-muted-text) !important;
  }

  /* Links: same semantic blueprint family as the masthead. */
  a, a:visited {
    color: var(--vpk-link) !important;
    text-decoration: none !important;
  }
  a:hover {
    text-decoration: underline !important;
    text-decoration-thickness: 1px !important;
    text-underline-offset: 3px !important;
  }

  /* Emphasis: italic preferred; bold reserved for headings. */
  .hl, mark, strong { color: var(--vpk-blueprint) !important; background: transparent !important; font-weight: 600 !important; }
  em, i { font-style: italic !important; color: var(--vpk-ink) !important; }

  /* Dotted rule utility. */
  .dotted-rule, .vpk-dotted-rule {
    background-image: radial-gradient(circle, var(--vpk-ink) 1px, transparent 1px) !important;
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
    color: var(--vpk-ink) !important;
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
	for (const [from, to] of Object.entries(KAMI_COLOR_MAP)) {
		out = out.split(from).join(to);
	}
	return out;
}

function rewriteFontStacks(text) {
	let out = text;

	// kami's Charter serif stacks (multiple variants) → Geist Sans.
	out = out.replace(
		/Charter,\s*Georgia,\s*\n?\s*Palatino,\s*"Times New Roman",\s*serif/g,
		FONT_STACKS.sans,
	);
	out = out.replace(/Charter,\s*Georgia,\s*Palatino,\s*serif/g, FONT_STACKS.sans);
	out = out.replace(/Charter,\s*Georgia,\s*Palatino,\s*"Songti SC",\s*serif/g, FONT_STACKS.sans);
	// TsangerJinKai02 (kami CN serif) → Geist Sans + CJK system fallback.
	out = out.replace(
		/"TsangerJinKai02"[^;]*serif/g,
		'"Geist", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);
	// kami's older JetBrainsMono.woff2 path → Geist Mono filename (the path is dead
	// anyway since templates inline fonts as base64; this just keeps strings consistent).
	out = out.replace(/JetBrainsMono\.woff2/g, "GeistMono-Regular.woff2");
	// kami's JetBrains Mono font-family stacks → Geist Mono.
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*Consolas,\s*monospace/g, FONT_STACKS.mono);
	out = out.replace(/"JetBrains Mono",\s*"SF Mono",\s*"Fira Code"[^;]*/g, FONT_STACKS.mono);
	return out;
}

function rewriteFontFaceBlocks(text, fontFaceBlock, themeBlock) {
	let out = text;
	out = out.replace(/@font-face\s*\{[\s\S]*?\}\s*/g, "");
	const injected = `${fontFaceBlock}\n\n${themeBlock}`;
	if (/:root\s*\{/.test(out)) {
		out = out.replace(/(:root\s*\{)/, `${injected}\n\n  $1`);
	} else if (/<style>/.test(out)) {
		out = out.replace(/<style>/, `<style>\n${injected}\n`);
	}
	return out;
}

function rewriteHeader(text, slug) {
	const friendly = slug.replace(/-/g, " ");
	const headerComment = `<!-- ==================================================================
     TEMPLATE · ${friendly} (vpk-html · Making Software identity)
     Ported from kami's editorial template library, restyled with the
     vpk-html semantic aliases: paper (var(--vpk-paper)), ink
     (var(--vpk-ink)), blueprint accent (var(--vpk-blueprint)),
     status accents, and muted text (var(--vpk-muted-text)).
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

function transform(rawHtml, slug, fontFaceBlock, themeBlock) {
	let out = rawHtml;
	out = rewriteFontFaceBlocks(out, fontFaceBlock, themeBlock);
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
	const fontFaceBlock = buildFontFaceBlock();
	const themeBlock = readStylesCss();

	for (const { source, slug } of TEMPLATES) {
		const sourcePath = path.join(KAMI_TEMPLATES, source);
		const targetPath = path.join(VPK_TEMPLATES, `${slug}.html`);
		if (!fs.existsSync(sourcePath)) {
			console.warn(`skip ${slug} — ${source} not found in kami source`);
			continue;
		}
		const raw = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(targetPath, transform(raw, slug, fontFaceBlock, themeBlock), "utf8");
		console.log(`✓ ${slug} (from ${source})`);
	}

	console.log(`Ported ${TEMPLATES.length} templates → ${path.relative(process.cwd(), VPK_TEMPLATES)}`);
}

main();
