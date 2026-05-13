#!/usr/bin/env node
/*
 * Ports kami's 4 demo HTML files from ~/.agents/skills/kami/assets/demos/
 * into vpk-html/assets/demos/, re-skinned with vpk-html's Atlassian deck
 * identity (Charlie Text, Charlie Display, Atlassian Mono).
 *
 * Mirrors the port-diagrams.mjs pattern: layout/structure preserved verbatim,
 * only chrome (fonts, colors, @font-face blocks, font-family stacks) changes.
 *
 * Run: node scripts/port-demos.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildFontFaceBlock, ensureFaviconLinks, FONT_STACKS, KAMI_COLOR_MAP, readStylesCss } from "./shared.mjs";

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

const KAKU_HERO_FIGURE = `<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaku terminal interface diagram with command output and AI recovery panel.">
      <rect x="0.5" y="0.5" width="479" height="319" fill="none" stroke="var(--rule)"/>
      <rect x="40" y="48" width="400" height="224" rx="8" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
      <rect x="40" y="48" width="400" height="34" rx="8" fill="var(--ink)"/>
      <circle cx="62" cy="65" r="4" fill="var(--danger)"/>
      <circle cx="78" cy="65" r="4" fill="var(--warning)"/>
      <circle cx="94" cy="65" r="4" fill="var(--success)"/>
      <text x="240" y="69" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="10" fill="var(--inverse-text)">kaku</text>
      <text x="64" y="112" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--primary-blue)">$ kaku ai</text>
      <text x="64" y="140" font-family="Atlassian Mono, ui-monospace, monospace" font-size="11" fill="var(--ink)">assistant.toml loaded</text>
      <text x="64" y="162" font-family="Atlassian Mono, ui-monospace, monospace" font-size="11" fill="var(--muted-text)">mode: command recovery</text>
      <rect x="246" y="104" width="154" height="82" rx="6" fill="var(--primary-blue-tint)" stroke="var(--primary-blue)"/>
      <text x="323" y="134" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="11" fill="var(--primary-blue)">AI recovery</text>
      <text x="323" y="156" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">explain and patch</text>
      <path d="M64 210h300" fill="none" stroke="var(--rule-strong)" stroke-width="1"/>
      <text x="64" y="236" font-family="Atlassian Mono, ui-monospace, monospace" font-size="10" fill="var(--muted-text)">Cmd + Shift + E applies the suggested command</text>
    </svg>`;

const KAKU_ACTION_FIGURE = `<svg viewBox="0 0 480 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaku workflow from shell command to assistant suggestion and confirmed action.">
      <rect x="0.5" y="0.5" width="479" height="319" fill="none" stroke="var(--rule)"/>
      <rect x="42" y="96" width="112" height="74" rx="6" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
      <rect x="184" y="96" width="112" height="74" rx="6" fill="var(--primary-blue-tint)" stroke="var(--primary-blue)"/>
      <rect x="326" y="96" width="112" height="74" rx="6" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
      <path d="M154 133h30M296 133h30" fill="none" stroke="var(--primary-blue)" stroke-width="2"/>
      <text x="98" y="126" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--ink)">shell</text>
      <text x="98" y="146" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">failed command</text>
      <text x="240" y="126" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--primary-blue)">assistant</text>
      <text x="240" y="146" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">safe suggestion</text>
      <text x="382" y="126" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="12" fill="var(--ink)">apply</text>
      <text x="382" y="146" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="9" fill="var(--muted-text)">confirmed action</text>
      <text x="240" y="220" text-anchor="middle" font-family="Atlassian Mono, ui-monospace, monospace" font-size="10" fill="var(--muted-text)">Kaku keeps the loop inside the command session.</text>
    </svg>`;

function rewriteColors(text) {
	let out = text;
	for (const [from, to] of Object.entries(KAMI_COLOR_MAP)) {
		out = out.split(from).join(to);
	}
	return out;
}

function rewriteFontStacks(text) {
	let out = text;

	// Charter serif stack → Charlie Text
	out = out.replace(
		/Charter,\s*Georgia,?\s*(Palatino,?\s*)?serif/g,
		FONT_STACKS.sans,
	);
	out = out.replace(
		/Charter,\s*Georgia,\s*Palatino,\s*"Songti SC",\s*serif/g,
		FONT_STACKS.sans,
	);

	// TsangerJinKai02 (CN serif) → Charlie Text with CJK system fallback
	out = out.replace(
		/"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*"STSong",\s*Georgia,\s*serif/g,
		'"Charlie Text", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);
	out = out.replace(
		/"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*Georgia,\s*serif/g,
		'"Charlie Text", "Noto Sans CJK SC", ui-sans-serif, system-ui, sans-serif',
	);

	// YuMincho (JP serif) → Charlie Text with JP system fallback
	out = out.replace(
		/"YuMincho",\s*"Yu Mincho",\s*"Hiragino Mincho ProN",\s*"Noto Serif CJK JP",\s*"Source Han Serif JP",\s*"TsangerJinKai02",\s*Georgia,\s*serif/g,
		'"Charlie Text", "Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", ui-sans-serif, system-ui, sans-serif',
	);

	// Mono stack normalization
	out = out.replace(
		/"JetBrains Mono",\s*"SF Mono",\s*"Fira Code"[^;]*/g,
		FONT_STACKS.mono,
	);
	out = out.replace(
		/"JetBrains Mono",\s*"SF Mono",\s*Consolas,\s*monospace/g,
		FONT_STACKS.mono,
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
     vpk-html identity: Charlie display/body type, Atlassian Mono numbers,
     and primary blue accents. Layout, content, and SVG
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
  html { background: var(--paper-background); }
  body {
    background:
      var(--grid-background),
      var(--paper-background);
    background-size: var(--grid-background-size);
  }
  /* Frame the document with vpk-html chrome when a kami .page or .frame exists */
  .page, .frame {
    border: 2px solid var(--ink) !important;
    box-shadow: var(--shadow) !important;
  }
`;
	return text.replace(/<\/style>/, `${gridOverride}</style>`);
}

function addMainLandmark(html) {
	if (/<main\b/i.test(html)) return html;
	return html
		.replace(/<body([^>]*)>/i, `<body$1>\n<main aria-label="vpk-html curated demo">`)
		.replace(/(\s*)(<script\b|<\/body>)/i, `\n</main>$1$2`);
}

function markDecorativeSvgs(html) {
	return html.replace(/<svg\b(?![^>]*\baria-(?:label|hidden|labelledby)=)([^>]*)>/gi, "<svg aria-hidden=\"true\"$1>");
}

function rewriteKakuImageTags(text) {
	const imageTagWithAlt = (altText) => new RegExp(`<${"img"}\\s+src="[^"]+"\\s+alt="${altText}"\\s*/?>`, "g");

	return text
		.replace(/\.contact-screenshot img/g, ".contact-screenshot svg")
		.replace(imageTagWithAlt("Kaku terminal interface"), KAKU_HERO_FIGURE)
		.replace(imageTagWithAlt("Kaku terminal in action"), KAKU_ACTION_FIGURE);
}

function transform(rawHtml, slug, fontFaceBlock, themeBlock) {
	let out = rawHtml;
	out = rewriteFontStacks(out);
	out = rewriteColors(out);
	out = rewriteFontFaceBlocks(out, fontFaceBlock, themeBlock);
	out = rewriteHeader(out, slug);
	out = ensureFaviconLinks(out);
	out = rewriteKakuImageTags(out);
	out = rewriteBodyAccent(out);
	out = addMainLandmark(out);
	out = markDecorativeSvgs(out);
	return out;
}

function main() {
	if (!fs.existsSync(KAMI_DEMOS)) {
		console.error(`Kami demos not found at ${KAMI_DEMOS}`);
		process.exitCode = 1;
		return;
	}
	fs.mkdirSync(VPK_DEMOS, { recursive: true });

	console.log("Inlining local Atlassian fonts as base64 data URIs…");
	const fontFaceBlock = buildFontFaceBlock();
	const themeBlock = readStylesCss();

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

	console.log(`Ported ${DEMOS.length} demos → ${path.relative(process.cwd(), VPK_DEMOS)}`);
}

main();
