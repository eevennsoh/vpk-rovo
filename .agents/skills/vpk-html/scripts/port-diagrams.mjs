#!/usr/bin/env node
/*
 * Ports the 14 kami diagram primitives from ~/.agents/skills/kami/assets/diagrams/
 * into vpk-html/assets/diagrams/, re-skinned with vpk-html's Atlassian
 * deck identity and Charlie / Atlassian Mono typefaces.
 *
 * The SVG geometry is preserved verbatim — only fills, strokes, fonts, and
 * surrounding chrome change. Run with: node scripts/port-diagrams.mjs
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
const KAMI_DIAGRAMS = path.join(KAMI_ROOT, "assets/diagrams");
const VPK_DIAGRAMS = path.join(SKILL_ROOT, "assets/diagrams");

const FONT_REPLACEMENTS = [
	{
		// kami Charter serif stack (body) → Charlie Text.
		pattern: /Charter,\s*Georgia,\s*Palatino,\s*serif/g,
		replacement: FONT_STACKS.sans,
	},
	{
		// kami JetBrains Mono stack with CJK fallbacks → Atlassian Mono.
		pattern:
			/'JetBrains Mono',\s*"SF Mono",\s*Consolas,\s*"TsangerJinKai02",\s*"Source Han Serif SC",\s*"Noto Serif CJK SC",\s*"Songti SC",\s*monospace/g,
		replacement: FONT_STACKS.mono,
	},
	{
		// Short JetBrains Mono refs inside SVG <text font-family="..."> attributes.
		pattern: /'JetBrains Mono',\s*monospace/g,
		replacement: "'Atlassian Mono', monospace",
	},
];

function buildHead() {
	return `<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

${readStylesCss()}

  :root {
    --font-sans: ${FONT_STACKS.body};
    --font-mono: ${FONT_STACKS.mono};
    --font-display: ${FONT_STACKS.display};
  }

${buildFontFaceBlock()}

  body {
    background:
      var(--grid-background),
      var(--paper-background);
    background-size: var(--grid-background-size);
    color: var(--ink);
    font-family: "Atlassian Mono Numeric", var(--font-sans);
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
    color: var(--primary-blue);
    font-family: var(--font-mono);
    font-size: 10px;
    line-height: 14px;
    letter-spacing: 0.18em;
    margin-bottom: 12px;
    text-transform: uppercase;
  }

  h1 {
    color: var(--headline);
    font-family: var(--font-display);
    font-size: 16px;
    line-height: 1.8;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: none;
    margin-bottom: 24px;
  }

  svg { display: block; min-width: 860px; width: 100%; }

  .caption {
    border-top: 1px solid var(--rule);
    color: var(--muted-text);
    font-family: var(--font-sans);
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
	for (const [from, to] of Object.entries(KAMI_COLOR_MAP)) {
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
	const sourceColored = rewriteColors(rawHtml);
	const sourceFonted = rewriteFonts(sourceColored);

	// Replace the <style>…</style> block wholesale with vpk-html chrome.
	const styled = sourceFonted.replace(/<style>[\s\S]*?<\/style>/, headBlock);

	// Rewrite the per-diagram eyebrow label so it identifies as vpk.
	const eyebrowReplaced = styled.replace(
		/<p class="eyebrow">[^<]*<\/p>/,
		`<p class="eyebrow">${slug.replace(/-/g, " ")} · vpk-html diagram</p>`,
	);

	const titleReplaced = eyebrowReplaced.replace(
		/<title>[^<]*<\/title>/,
		`<title>${slug.replace(/-/g, " ")} · vpk-html diagram</title>`,
	);

	const faviconed = ensureFaviconLinks(titleReplaced);

	const headerComment = `<!-- ==================================================================
     DIAGRAM · ${slug.replace(/-/g, " ")} (vpk-html palette)
     SVG primitive ported from kami's diagram library, restyled with the
     vpk-html identity: Charlie Display headline, Charlie Text body,
     primary blue focal accent. Drop the <svg> block into a
     long-doc, portfolio, or design-system payload via section.trustedHtml.
     ================================================================== -->`;
	const commentReplaced = faviconed.replace(/<!--[\s\S]*?-->\n?/, `${headerComment}\n`);

	return commentReplaced;
}

function main() {
	if (!fs.existsSync(KAMI_DIAGRAMS)) {
		console.error(`Kami diagrams not found at ${KAMI_DIAGRAMS}`);
		process.exitCode = 1;
		return;
	}
	fs.mkdirSync(VPK_DIAGRAMS, { recursive: true });

	console.log("Inlining local Atlassian fonts as base64 data URIs…");
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
