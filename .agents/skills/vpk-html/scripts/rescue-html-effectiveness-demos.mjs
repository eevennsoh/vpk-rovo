#!/usr/bin/env node
/*
 * Copy the upstream html-effectiveness demo pages into vpk-html's demo paths.
 *
 * These demos intentionally preserve ThariqS/html-effectiveness page structure,
 * JavaScript, and sample content, then apply the vpk-html visual shell. The
 * remaining mutations are validation shims required by vpk-html's local offline
 * checks: embedded local font declarations, a dark-token stub, a generator meta
 * tag, and accessibility landmarks/markers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(SKILL_ROOT, "assets", "html-effectiveness");
const DEMOS_DIR = path.join(SKILL_ROOT, "assets", "demos");
const FONTS_DIR = path.join(SKILL_ROOT, "assets", "fonts");

const FILES = [
	["01-exploration-code-approaches.html", "demo-exploration-code-approaches.html"],
	["02-exploration-visual-designs.html", "demo-exploration-visual-designs.html"],
	["03-code-review-pr.html", "demo-code-review-pr.html"],
	["04-code-understanding.html", "demo-code-understanding.html"],
	["05-design-system.html", "demo-design-system.html"],
	["06-component-variants.html", "demo-component-variants.html"],
	["07-prototype-animation.html", "demo-prototype-animation.html"],
	["08-prototype-interaction.html", "demo-prototype-interaction.html"],
	["09-slide-deck.html", "demo-slide-deck.html"],
	["10-svg-illustrations.html", "demo-svg-illustrations.html"],
	["11-status-report.html", "demo-status-report.html"],
	["12-incident-report.html", "demo-incident-report.html"],
	["13-flowchart-diagram.html", "demo-flowchart-diagram.html"],
	["14-research-feature-explainer.html", "demo-research-feature-explainer.html"],
	["15-research-concept-explainer.html", "demo-research-concept-explainer.html"],
	["16-implementation-plan.html", "demo-implementation-plan.html"],
	["17-pr-writeup.html", "demo-pr-writeup.html"],
	["18-editor-triage-board.html", "demo-editor-triage-board.html"],
	["19-editor-feature-flags.html", "demo-editor-feature-flags.html"],
	["20-editor-prompt-tuner.html", "demo-editor-prompt-tuner.html"],
];

function fontFace(name, fileName) {
	const data = fs.readFileSync(path.join(FONTS_DIR, fileName)).toString("base64");
	return `@font-face {
  font-family: "${name}";
  src: url("data:font/woff2;base64,${data}") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}`;
}

function validationCss() {
	return `/* vpk-html validation shim: local fonts and offline checks. */
${fontFace("Geist", "Geist-Regular.woff2")}
${fontFace("Geist Mono", "GeistMono-Regular.woff2")}
${fontFace("Geist Pixel", "GeistPixel-Square.woff2")}
:root { color-scheme: light dark; }
[data-theme="dark"] { color-scheme: dark; }
`;
}

function vpkVisualCss() {
	return `/* vpk-html visual overlay: blueprint paper system over upstream demos. */
:root {
  color-scheme: light dark;
  --vpk-paper: var(--ds-surface, #ffffff);
  --vpk-surface-raised: var(--ds-surface-raised, #ffffff);
  --vpk-surface-sunken: var(--ds-surface-sunken, #f0f1f2);
  --vpk-ink: var(--ds-text, #292a2e);
  --vpk-muted-text: var(--ds-text-subtle, #505258);
  --vpk-subtlest-text: var(--ds-text-subtlest, #6b6e76);
  --vpk-inverse-text: var(--ds-text-inverse, #ffffff);
  --vpk-rule: var(--ds-border, #0b120e24);
  --vpk-rule-strong: var(--ds-border-bold, #7d818a);
  --vpk-blueprint: var(--ds-background-brand-bold, #1868db);
  --vpk-link: var(--ds-link, #1868db);
  --vpk-link-pressed: var(--ds-link-pressed, #1558bc);
  --vpk-blueprint-tint: var(--ds-background-information, #e9f2fe);
  --vpk-blueprint-tint-strong: var(--ds-background-information-hovered, #cfe1fd);
  --vpk-success: var(--ds-background-success-bold, #5b7f24);
  --vpk-danger: var(--ds-background-danger-bold, #c9372c);
  --vpk-code-surface: var(--ds-background-neutral-subtle, #f0f1f2);
  --vpk-code-inverse: var(--ds-text-inverse, #ffffff);
  --vpk-paper-rule: color-mix(in srgb, var(--vpk-ink) 8%, transparent);
  --ivory: var(--vpk-paper);
  --paper: var(--vpk-surface-raised);
  --white: var(--vpk-surface-raised);
  --slate: var(--vpk-ink);
  --near-black: var(--vpk-ink);
  --gray-50: var(--vpk-surface-sunken);
  --gray-100: var(--vpk-surface-sunken);
  --gray-150: var(--vpk-surface-sunken);
  --gray-200: var(--vpk-rule);
  --gray-300: var(--vpk-rule);
  --gray-500: var(--vpk-muted-text);
  --gray-700: var(--vpk-ink);
  --gray-800: var(--vpk-ink);
  --g100: var(--vpk-surface-sunken);
  --g200: var(--vpk-rule);
  --g300: var(--vpk-rule);
  --g500: var(--vpk-muted-text);
  --g700: var(--vpk-ink);
  --clay: var(--vpk-blueprint);
  --clay-d: var(--vpk-link-pressed);
  --oat: var(--vpk-blueprint-tint);
  --olive: var(--vpk-success);
  --rust: var(--vpk-danger);
  --sky: var(--vpk-blueprint);
  --serif: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
  --display: "Geist Pixel", "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
  --border: 1px solid var(--gray-300);
  --radius-panel: 0;
  --radius-row: 0;
  --card-shadow: 4px 4px 0 var(--vpk-blueprint-tint);
}

[data-theme="dark"] {
  --vpk-paper: var(--ds-surface, #101214);
  --vpk-surface-raised: var(--ds-surface-raised, #22272b);
  --vpk-surface-sunken: var(--ds-surface-sunken, #161a1d);
  --vpk-ink: var(--ds-text, #dee4ea);
  --vpk-muted-text: var(--ds-text-subtle, #9fadbc);
  --vpk-subtlest-text: var(--ds-text-subtlest, #738496);
  --vpk-inverse-text: var(--ds-text-inverse, #101214);
  --vpk-rule: var(--ds-border, #a6c5e229);
  --vpk-rule-strong: var(--ds-border-bold, #738496);
  --vpk-blueprint: var(--ds-background-brand-bold, #579dff);
  --vpk-link: var(--ds-link, #579dff);
  --vpk-link-pressed: var(--ds-link-pressed, #85b8ff);
  --vpk-blueprint-tint: var(--ds-background-information, #09326c);
  --vpk-blueprint-tint-strong: var(--ds-background-information-hovered, #0c418a);
  --vpk-success: var(--ds-background-success-bold, #b3df72);
  --vpk-danger: var(--ds-background-danger-bold, #f87168);
  --vpk-code-surface: var(--ds-background-neutral-subtle, #161a1d);
  --vpk-code-inverse: var(--ds-text-inverse, #101214);
  --vpk-paper-rule: color-mix(in srgb, var(--vpk-ink) 8%, transparent);
}

html,
body {
  background:
    radial-gradient(circle at 1px 1px, var(--vpk-paper-rule) 1px, transparent 0),
    var(--ivory) !important;
  background-size: 16px 16px !important;
  color: var(--slate) !important;
  font-family: var(--sans) !important;
  letter-spacing: 0 !important;
}

*,
*::before,
*::after {
  min-width: 0;
}

body {
  -webkit-font-smoothing: antialiased;
}

img,
svg,
canvas,
video {
  max-width: 100%;
}

h1,
.title,
.hero-title,
.deck-title {
  color: var(--clay) !important;
  font-family: var(--display) !important;
  font-weight: 400 !important;
  letter-spacing: 0.02em !important;
  line-height: 0.95 !important;
  text-transform: uppercase !important;
}

h2,
h3,
h4,
.section-title,
.card-title,
.panel-title {
  color: var(--slate) !important;
  font-family: var(--display) !important;
  font-weight: 400 !important;
  letter-spacing: 0.04em !important;
  line-height: 1.08 !important;
  text-transform: uppercase !important;
}

p,
li,
td,
th,
textarea,
input,
select {
  font-family: var(--sans) !important;
}

.eyebrow,
.label,
.num,
.chip,
.pill,
.tag,
.badge,
.meta,
.caption,
.hint,
.nav,
.tabs,
.stat-label {
  font-family: var(--mono) !important;
  letter-spacing: 0.08em !important;
}

.eyebrow,
.label,
.num,
.tag,
.badge,
.stat-label {
  color: var(--clay) !important;
  text-transform: uppercase !important;
}

:is(
  .approach,
  .prompt-box,
  .tradeoffs,
  .score-card,
  .card,
  .panel,
  .module,
  .node,
  .token-card,
  .variant-card,
  .state-card,
  .phone,
  .screen,
  .workspace,
  .editor,
  .board,
  .column,
  .ticket,
  .timeline,
  .event,
  .metric,
  .summary,
  .callout,
  .note,
  .diagram,
  .canvas,
  .figure,
  .slide,
  .control,
  .toolbar,
  .preview,
  .option,
  .row-card
) {
  background: color-mix(in srgb, var(--white) 94%, transparent) !important;
  border-color: var(--gray-300) !important;
  border-radius: 0 !important;
  box-shadow: var(--card-shadow) !important;
}

:is(.stage, .browser, .mock, .flow, .matrix, .table, table, .diff, .code, pre) {
  border-color: var(--gray-300) !important;
  border-radius: 0 !important;
}

.code,
pre,
.diff,
.code-block,
.snippet {
  background: var(--vpk-ink) !important;
  color: var(--vpk-code-inverse) !important;
  font-family: var(--mono) !important;
  max-width: 100% !important;
  overflow-x: auto !important;
}

code,
kbd,
samp {
  font-family: var(--mono) !important;
}

a,
a:visited {
  color: var(--clay-d) !important;
  text-decoration-color: color-mix(in srgb, var(--clay) 45%, transparent) !important;
  text-underline-offset: 0.18em !important;
}

button,
.button,
.btn,
[role="button"] {
  background: var(--clay) !important;
  border: 1px solid var(--slate) !important;
  border-radius: 0 !important;
  box-shadow: 3px 3px 0 color-mix(in srgb, var(--vpk-ink) 22%, transparent) !important;
  color: var(--vpk-inverse-text) !important;
  font-family: var(--mono) !important;
  letter-spacing: 0.08em !important;
  text-transform: uppercase !important;
}

button.secondary,
.button.secondary,
.btn.secondary {
  background: var(--white) !important;
  color: var(--clay-d) !important;
}

input,
textarea,
select {
  background: var(--white) !important;
  border: 1px solid var(--gray-300) !important;
  border-radius: 0 !important;
  color: var(--slate) !important;
}

table,
th,
td {
  border-color: var(--gray-300) !important;
}

table {
  max-width: 100% !important;
}

th,
.head,
.table-head {
  background: var(--oat) !important;
  color: var(--slate) !important;
}

.hl,
mark,
strong,
.active,
.selected {
  color: var(--clay-d) !important;
}

mark,
.chip,
.pill,
.tag,
.badge {
  background: var(--oat) !important;
  border-color: color-mix(in srgb, var(--clay) 35%, var(--gray-300)) !important;
  border-radius: 0 !important;
}

svg text {
  font-family: var(--mono) !important;
}

svg [fill="#D97757"],
svg [fill="#B85C3E"],
svg [fill="#d97757"],
svg [fill="#b85c3e"] {
  fill: var(--clay) !important;
}

svg [stroke="#D97757"],
svg [stroke="#B85C3E"],
svg [stroke="#d97757"],
svg [stroke="#b85c3e"] {
  stroke: var(--clay) !important;
}

svg [fill="#E3DACC"],
svg [fill="#F0EEE6"],
svg [fill="#e3dacc"],
svg [fill="#f0eee6"] {
  fill: var(--oat) !important;
}

svg [stroke="#E3DACC"],
svg [stroke="#D1CFC5"],
svg [stroke="#e3dacc"],
svg [stroke="#d1cfc5"] {
  stroke: var(--gray-300) !important;
}

@media (max-width: 760px) {
  html,
  body {
    overflow-x: hidden;
  }

  body {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  :is(
    .page,
    .container,
    .wrap,
    .shell,
    main,
    section,
    article,
    header,
    .workspace,
    .board,
    .editor,
    .stage,
    .canvas,
    .slide,
    .phone,
    .screen,
    .panel,
    .card,
    .approach
  ) {
    max-width: 100% !important;
    width: auto !important;
  }

  :is(
    .approaches,
    .grid,
    .columns,
    .layout,
    .content-grid,
    .main-grid,
    .diff-grid,
    .compare,
    .screens,
    .flow-grid,
    .board,
    .workspace,
    .kanban,
    .editor-layout,
    .cards,
    .variants,
    .token-grid,
    .timeline,
    .summary-grid,
    .metric-grid,
    .stage-grid
  ) {
    grid-template-columns: 1fr !important;
  }

  :is(.code, pre, .diff, .code-block, .snippet) {
    white-space: pre-wrap !important;
    overflow-wrap: anywhere !important;
  }

  table {
    display: block !important;
    overflow-x: auto !important;
  }
}
`;
}

function addGeneratorMeta(html) {
	if (/<meta\s+name=["']generator["']/i.test(html)) return html;
	return html.replace(
		/(<meta\s+name=["']viewport["'][^>]*>\s*)/i,
		`$1\n  <meta name="generator" content="vpk-html">`,
	);
}

function addValidationCss(html) {
	if (html.includes("vpk-html validation shim")) return html;
	return html.replace(/<style>/i, `<style>\n${validationCss()}`);
}

function addVpkVisualCss(html) {
	if (html.includes("vpk-html visual overlay")) return html;
	return html.replace(/<\/style>/i, `${vpkVisualCss()}\n</style>`);
}

function addMainLandmark(html) {
	if (/<main\b/i.test(html)) return html;
	return html
		.replace(/<body([^>]*)>/i, `<body$1>\n<main aria-label="html-effectiveness demo">`)
		.replace(/(\s*)(<script\b|<\/body>)/i, `\n</main>$1$2`);
}

function markDecorativeSvgs(html) {
	return html.replace(/<svg\b(?![^>]*\baria-(?:label|hidden|labelledby)=)([^>]*)>/gi, "<svg aria-hidden=\"true\"$1>");
}

function addSourceComment(html, sourceFile) {
	if (html.includes("Source: https://github.com/ThariqS/html-effectiveness")) return html;
	return html.replace(
		/<html\b/i,
		`<!-- Source: https://github.com/ThariqS/html-effectiveness/blob/main/${sourceFile} -->\n<html`,
	);
}

function markUpstreamDemo(html) {
	if (/data-vpk-upstream-demo=/.test(html)) return html;
	return html.replace(
		/<html\b([^>]*)>/i,
		`<html$1 data-vpk-upstream-demo="html-effectiveness" data-vpk-literal-double-braces="true">`,
	);
}

function addGeneratedButtonLabels(html) {
	return html.replace(
		/<button([^>]*\bid=["']filterBadge["'][^>]*)><\/button>/i,
		`<button$1 aria-label="Toggle filtered tickets"></button>`,
	);
}

function adapt(html, sourceFile) {
	return addGeneratedButtonLabels(
		markDecorativeSvgs(
			addMainLandmark(
				addVpkVisualCss(
					addValidationCss(
						addGeneratorMeta(
							markUpstreamDemo(
								addSourceComment(html, sourceFile),
							),
						),
					),
				),
			),
		),
	);
}

function main() {
	fs.mkdirSync(DEMOS_DIR, { recursive: true });

	for (const [sourceName, demoName] of FILES) {
		const sourcePath = path.join(SOURCE_DIR, sourceName);
		const targetPath = path.join(DEMOS_DIR, demoName);
		if (!fs.existsSync(sourcePath)) {
			throw new Error(`Missing upstream source file: ${path.relative(process.cwd(), sourcePath)}`);
		}
		const html = fs.readFileSync(sourcePath, "utf8");
		fs.writeFileSync(targetPath, adapt(html, sourceName), "utf8");
		console.log(`wrote ${path.relative(process.cwd(), targetPath)} from ${sourceName}`);
	}

	console.log(`${FILES.length} upstream html-effectiveness demos copied`);
}

main();
