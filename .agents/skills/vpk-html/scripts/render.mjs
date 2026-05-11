#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateRenderPayload } from "../schemas/render-payload.schema.mjs";
import { getTemplateDefinition } from "../templates/catalog.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SKILL_ROOT = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(SKILL_ROOT, "../../..");

const VERSION = "0.1.0";
const FONT_SPECS = [
	{
		family: "VT323",
		file: "VT323-Regular.woff2",
		weight: "400",
		style: "normal",
		cssVar: "--font-display",
	},
	{
		family: "Source Serif 4",
		file: "SourceSerif4-Regular.woff2",
		weight: "400",
		style: "normal",
		cssVar: "--font-body",
	},
	{
		family: "JetBrains Mono",
		file: "JetBrainsMono-Regular.woff2",
		weight: "400",
		style: "normal",
		cssVar: "--font-mono",
	},
];

function parseArgs(argv) {
	const args = {
		input: null,
		out: null,
		overwrite: false,
	};

	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--input") {
			args.input = argv[++i];
		} else if (arg === "--out") {
			args.out = argv[++i];
		} else if (arg === "--overwrite") {
			args.overwrite = true;
		} else if (arg === "--help" || arg === "-h") {
			args.help = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}

	return args;
}

function usage() {
	return "Usage: render.mjs --input <payload.json> [--out docs/html/<slug>.html] [--overwrite]";
}

export function slugifyTitle(title) {
	const slug = title
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");

	return slug || "vpk-html-document";
}

function assertSafeSlug(slug) {
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		throw new Error(`Invalid slug: ${slug}`);
	}
	return slug;
}

export function resolveDefaultOutputPath(payload) {
	const slug = assertSafeSlug(payload.slug || slugifyTitle(payload.title));
	return path.join(REPO_ROOT, "docs", "html", `${slug}.html`);
}

function resolveOutputPath(outPath) {
	if (!outPath) return null;
	const resolved = path.resolve(REPO_ROOT, outPath);
	if (!resolved.startsWith(`${REPO_ROOT}${path.sep}`)) {
		throw new Error(`Output path must stay inside the repository: ${outPath}`);
	}
	return resolved;
}

function resolveRepoPath(repoRelativePath) {
	const resolved = path.resolve(REPO_ROOT, repoRelativePath);
	if (!resolved.startsWith(`${REPO_ROOT}${path.sep}`)) {
		throw new Error(`Path must stay inside the repository: ${repoRelativePath}`);
	}
	return resolved;
}

function escapeHtml(value) {
	return String(value ?? "")
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
	return escapeHtml(value).replaceAll("\n", " ");
}

function readText(filePath) {
	return fs.readFileSync(filePath, "utf8");
}

function readFontCss() {
	return FONT_SPECS.map(spec => {
		const fontPath = path.join(SKILL_ROOT, "assets", "fonts", spec.file);
		if (!fs.existsSync(fontPath)) {
			throw new Error(`Missing font ${spec.file}. Run node .agents/skills/vpk-html/scripts/ensure-fonts.mjs`);
		}
		const data = fs.readFileSync(fontPath).toString("base64");
		if (data.length === 0) {
			throw new Error(`Font is empty: ${spec.file}`);
		}

		return `@font-face {
	font-family: "${spec.family}";
	src: url("data:font/woff2;base64,${data}") format("woff2");
	font-style: ${spec.style};
	font-weight: ${spec.weight};
	font-display: swap;
}`;
	}).join("\n\n");
}

function renderParagraphs(body) {
	if (!body) return "";
	return String(body)
		.split(/\n{2,}/)
		.map(paragraph => `<p>${escapeHtml(paragraph.trim())}</p>`)
		.join("\n");
}

function renderList(items) {
	if (!items || items.length === 0) return "";
	return `<ul class="vpk-list">
${items.map(item => `\t<li>${escapeHtml(item)}</li>`).join("\n")}
</ul>`;
}

function renderCards(cards) {
	if (!cards || cards.length === 0) return "";
	return `<div class="vpk-card-grid">
${cards
		.map(card => {
			const tagName = card.href ? "a" : "article";
			const href = card.href ? ` href="${escapeAttribute(card.href)}"` : "";
			const className = card.href ? "vpk-card vpk-card-link" : "vpk-card";

			return `<${tagName} class="${className}"${href}>
	${card.status ? `<p class="vpk-eyebrow">${escapeHtml(card.status)}</p>` : ""}
	<h3>${escapeHtml(card.title)}</h3>
	${card.body ? renderParagraphs(card.body) : ""}
	${card.meta ? `<p class="vpk-meta">${escapeHtml(card.meta)}</p>` : ""}
</${tagName}>`;
		})
		.join("\n")}
</div>`;
}

function renderSteps(steps) {
	if (!steps || steps.length === 0) return "";
	return `<ol class="vpk-steps">
${steps
	.map((step, index) => `<li>
	<span class="vpk-step-index">${index + 1}</span>
	<div>
		<h3>${escapeHtml(step.title)}</h3>
		${step.body ? renderParagraphs(step.body) : ""}
		${step.code ? `<pre><code>${escapeHtml(step.code)}</code></pre>` : ""}
	</div>
</li>`)
	.join("\n")}
</ol>`;
}

function renderTable(table) {
	if (!table) return "";
	return `<div class="vpk-table-wrap">
	<table>
		<thead>
			<tr>${table.headers.map(header => `<th scope="col">${escapeHtml(header)}</th>`).join("")}</tr>
		</thead>
		<tbody>
${table.rows
	.map(row => `			<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
	.join("\n")}
		</tbody>
	</table>
</div>`;
}

function renderDiagram(diagram, fallbackTitle) {
	if (!diagram) return "";
	const nodes = diagram.nodes && diagram.nodes.length > 0 ? diagram.nodes : ["Input", "Distill", "Render", "Validate"];
	const edges =
		diagram.edges && diagram.edges.length > 0
			? diagram.edges
			: nodes.slice(0, -1).map((node, index) => [node, nodes[index + 1]]);
	const title = diagram.title || fallbackTitle || "Diagram";
	const width = Math.max(720, nodes.length * 170);
	const nodeY = 76;
	const nodeWidth = 132;
	const nodeHeight = 52;
	const gap = (width - nodeWidth * nodes.length) / Math.max(1, nodes.length + 1);
	const positions = new Map(
		nodes.map((node, index) => [
			node,
			{
				x: Math.round(gap + index * (nodeWidth + gap)),
				y: nodeY,
			},
		]),
	);

	return `<figure class="vpk-diagram">
	<svg viewBox="0 0 ${width} 190" role="img" aria-label="${escapeAttribute(title)}">
		<title>${escapeHtml(title)}</title>
		<g class="vpk-diagram-edges">
${edges
	.map(([from, to]) => {
		const start = positions.get(from);
		const end = positions.get(to);
		if (!start || !end) return "";
		return `			<path d="M ${start.x + nodeWidth} ${start.y + nodeHeight / 2} L ${end.x} ${end.y + nodeHeight / 2}" />`;
	})
	.join("\n")}
		</g>
		<g class="vpk-diagram-nodes">
${nodes
	.map(node => {
		const position = positions.get(node);
		return `			<g>
				<rect x="${position.x}" y="${position.y}" width="${nodeWidth}" height="${nodeHeight}" rx="0" />
				<text x="${position.x + nodeWidth / 2}" y="${position.y + nodeHeight / 2 + 5}" text-anchor="middle">${escapeHtml(node)}</text>
			</g>`;
	})
	.join("\n")}
		</g>
	</svg>
	<figcaption>${escapeHtml(diagram.type || "flowchart")} primitive</figcaption>
</figure>`;
}

function renderSlides(slides) {
	if (!slides || slides.length === 0) return "";
	return `<section class="vpk-deck" data-vpk-deck aria-roledescription="slide deck">
	<div class="vpk-deck-track">
${slides
	.map((slide, index) => `<article class="vpk-slide" data-vpk-slide ${index === 0 ? "" : "hidden"} tabindex="0" aria-label="Slide ${index + 1} of ${slides.length}">
	<p class="vpk-eyebrow">Slide ${index + 1}</p>
	<h2>${escapeHtml(slide.title)}</h2>
	${slide.body ? renderParagraphs(slide.body) : ""}
	${renderList(slide.items)}
</article>`)
	.join("\n")}
	</div>
	<div class="vpk-deck-controls" aria-label="Slide controls">
		<button type="button" data-vpk-deck-prev>Previous</button>
		<span data-vpk-deck-progress>1 / ${slides.length}</span>
		<button type="button" data-vpk-deck-next>Next</button>
	</div>
</section>`;
}

function renderControls(controls, templateId) {
	if (!controls || controls.length === 0) return "";
	return `<form class="vpk-controls" data-vpk-controls="${escapeAttribute(templateId)}">
${controls
	.map((control, index) => {
		const value = control.value || String(control.min ?? 0);
		const min = control.min ?? 0;
		const max = control.max ?? 100;
		return `<label>
	<span>${escapeHtml(control.label)}</span>
	<input type="range" min="${min}" max="${max}" value="${escapeAttribute(value)}" data-vpk-slider aria-describedby="control-value-${index}">
	<output id="control-value-${index}">${escapeHtml(value)}</output>
</label>`;
	})
	.join("\n")}
</form>`;
}

function renderEditor(definition, section) {
	const initial = {
		template: definition.id,
		items: section.cards || section.items || [],
	};
	return `<section class="vpk-editor" data-vpk-editor>
	${section.heading ? `<div class="vpk-editor-context">
		<h2>${escapeHtml(section.heading)}</h2>
		${section.body ? renderParagraphs(section.body) : ""}
		${renderCards(section.cards)}
		${renderTable(section.table)}
		${section.trustedHtml ? `<div class="vpk-trusted-html">${section.trustedHtml}</div>` : ""}
	</div>` : ""}
	<div class="vpk-editor-toolbar">
		<button type="button" data-vpk-editor-export>Export JSON</button>
		<button type="button" data-vpk-editor-copy>Copy</button>
		<button type="button" data-vpk-editor-import>Import</button>
	</div>
	<label>
		<span>Editor JSON</span>
		<textarea data-vpk-editor-text rows="10">${escapeHtml(JSON.stringify(initial, null, "\t"))}</textarea>
	</label>
	<p class="vpk-meta" data-vpk-editor-status aria-live="polite">Ready</p>
</section>`;
}

function assetMime(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	if (ext === ".png") return "image/png";
	if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
	if (ext === ".gif") return "image/gif";
	if (ext === ".webp") return "image/webp";
	if (ext === ".svg") return "image/svg+xml";
	return "application/octet-stream";
}

function renderAssets(assets) {
	const images = assets.filter(asset => asset.kind === "image");
	if (images.length === 0) return "";

	return `<section class="vpk-section vpk-assets" aria-labelledby="embedded-assets">
	<h2 id="embedded-assets">Embedded Assets</h2>
${images
	.map(asset => {
		const assetPath = resolveRepoPath(asset.path);
		if (!fs.existsSync(assetPath)) {
			throw new Error(`Missing listed asset: ${asset.path}`);
		}
		const data = fs.readFileSync(assetPath).toString("base64");
		return `<figure>
	<img src="data:${assetMime(assetPath)};base64,${data}" alt="${escapeAttribute(asset.alt)}">
	${asset.credit ? `<figcaption>${escapeHtml(asset.credit)}</figcaption>` : ""}
</figure>`;
	})
	.join("\n")}
</section>`;
}

function renderSection(section, definition) {
	if (section.slides || definition.id === "slide-deck") {
		return renderSlides(section.slides || [
			{
				title: section.heading || "Opening",
				body: section.body || "",
				items: section.items || [],
			},
		]);
	}

	if (definition.id.startsWith("editor-") && section.type === "editor") {
		return renderEditor(definition, section);
	}

	const headingId = section.heading ? `section-${slugifyTitle(section.heading)}` : null;
	return `<section class="vpk-section vpk-section-${escapeAttribute(section.type || "section")}">
	${section.kicker ? `<p class="vpk-eyebrow">${escapeHtml(section.kicker)}</p>` : ""}
	${section.heading ? `<h2 id="${headingId}">${escapeHtml(section.heading)}</h2>` : ""}
	${section.body ? renderParagraphs(section.body) : ""}
	${renderList(section.items)}
	${renderCards(section.cards)}
	${renderSteps(section.steps)}
	${section.code ? `<pre><code>${escapeHtml(section.code)}</code></pre>` : ""}
	${renderTable(section.table)}
	${renderDiagram(section.diagram, section.heading)}
	${renderControls(section.controls, definition.id)}
	${section.trustedHtml ? `<div class="vpk-trusted-html">${section.trustedHtml}</div>` : ""}
</section>`;
}

function renderSources(payload) {
	const usesAlgebrica =
		payload.options.useAlgebrica || payload.assets.some(asset => asset.algebrica === true);
	const sources = [...payload.sources];
	if (usesAlgebrica && !sources.some(source => /algebrica/i.test(source.label))) {
		sources.push({
			label: "Algebrica by Antonio Lupetti",
			url: "https://github.com/antoniolupetti/algebrica",
			license: "CC BY-NC 4.0",
			note: "Visible attribution required for copied or adapted Algebrica material.",
		});
	}

	if (sources.length === 0) return "";

	return `<aside class="vpk-sources" aria-labelledby="vpk-sources-heading" ${usesAlgebrica ? 'data-vpk-algebrica="true"' : ""}>
	<h2 id="vpk-sources-heading">Sources and Credits</h2>
	<ol>
${sources
	.map(source => {
		const label = escapeHtml(source.label);
		const sourceRef = source.url
			? `<a href="${escapeAttribute(source.url)}" rel="noreferrer">${label}</a>`
			: label;
		const license = source.license ? ` <span class="vpk-license">${escapeHtml(source.license)}</span>` : "";
		const note = source.note ? `<p>${escapeHtml(source.note)}</p>` : "";
		return `		<li>${sourceRef}${license}${note}</li>`;
	})
	.join("\n")}
	</ol>
</aside>`;
}

function renderNav(sections) {
	const links = sections
		.filter(section => section.heading)
		.map(section => `<a href="#section-${slugifyTitle(section.heading)}">${escapeHtml(section.heading)}</a>`)
		.join("");

	if (!links) return "";
	return `<nav class="vpk-nav" aria-label="Document sections">${links}</nav>`;
}

function renderBaseCss() {
	const themeCss = readText(path.join(SKILL_ROOT, "references", "theme.css"));
	return `${readFontCss()}

${themeCss}

:root {
	--vpk-font-display: "VT323", ui-monospace, "SFMono-Regular", Consolas, monospace;
	--vpk-font-body: "Source Serif 4", Georgia, "Times New Roman", serif;
	--vpk-font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
}

* {
	box-sizing: border-box;
}

html {
	background: var(--vpk-paper-background);
	color: var(--vpk-ink);
	font-family: var(--vpk-font-body);
	line-height: 1.55;
}

body {
	margin: 0;
	min-width: 320px;
}

a {
	color: var(--vpk-blueprint);
	text-decoration-thickness: 0.08em;
	text-underline-offset: 0.18em;
}

button,
input,
textarea {
	font: inherit;
}

button {
	background: var(--vpk-surface-raised);
	border: 2px solid var(--vpk-rule);
	box-shadow: var(--vpk-shadow);
	color: var(--vpk-ink);
	cursor: pointer;
	padding: 0.45rem 0.7rem;
}

button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
	outline: 3px solid var(--vpk-focus-ring);
	outline-offset: 3px;
}

.vpk-shell {
	background:
		linear-gradient(90deg, color-mix(in srgb, var(--vpk-rule) 8%, transparent) 1px, transparent 1px),
		linear-gradient(0deg, color-mix(in srgb, var(--vpk-rule) 8%, transparent) 1px, transparent 1px),
		var(--vpk-paper);
	background-size: 24px 24px;
	min-height: 100vh;
}

.vpk-page {
	margin: 0 auto;
	max-width: 1120px;
	padding: clamp(1rem, 2vw, 2rem);
}

.vpk-toolbar {
	align-items: center;
	display: flex;
	gap: 0.75rem;
	justify-content: space-between;
	margin-bottom: 1rem;
}

.vpk-nav {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-bottom: 1rem;
}

.vpk-nav a,
.vpk-pill {
	background: var(--vpk-surface-raised);
	border: 1px solid var(--vpk-rule);
	color: var(--vpk-ink);
	padding: 0.25rem 0.45rem;
	text-decoration: none;
}

.vpk-hero,
.vpk-section,
.vpk-sources {
	background: var(--vpk-paper-background);
	border: 2px solid var(--vpk-rule);
	box-shadow: var(--vpk-shadow);
	margin: 0 0 1.25rem;
	padding: clamp(1rem, 3vw, 2rem);
}

.vpk-hero h1 {
	font-family: var(--vpk-font-display);
	font-size: clamp(3rem, 12vw, 8rem);
	font-weight: 400;
	letter-spacing: 0;
	line-height: 0.82;
	margin: 0.25rem 0 1rem;
	text-wrap: balance;
}

.vpk-section h2,
.vpk-sources h2,
.vpk-slide h2 {
	font-family: var(--vpk-font-display);
	font-size: clamp(2rem, 6vw, 4rem);
	font-weight: 400;
	line-height: 0.92;
	margin: 0 0 1rem;
	text-wrap: balance;
}

.vpk-section h3,
.vpk-card h3 {
	font-size: 1.1rem;
	margin: 0 0 0.35rem;
}

.vpk-eyebrow,
.vpk-meta,
.vpk-license {
	color: var(--vpk-muted-text);
	font-family: var(--vpk-font-mono);
	font-size: 0.78rem;
	letter-spacing: 0;
	text-transform: uppercase;
}

.vpk-list,
.vpk-sources ol {
	padding-left: 1.25rem;
}

.vpk-card-grid {
	display: grid;
	gap: 1rem;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
	margin-top: 1rem;
}

.vpk-card,
.vpk-diagram,
.vpk-editor,
.vpk-controls,
.vpk-table-wrap {
	background: var(--vpk-surface-raised);
	border: 1px solid var(--vpk-rule);
	padding: 1rem;
}

.vpk-card-link {
	color: inherit;
	display: block;
	text-decoration: none;
}

.vpk-card-link:hover {
	border-color: var(--vpk-blueprint);
}

.vpk-demo-grid,
.vpk-token-swatch-grid,
.vpk-variant-grid,
.vpk-figure-sheet {
	display: grid;
	gap: 1rem;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
}

.vpk-demo-panel,
.vpk-token-swatch,
.vpk-variant,
.vpk-letter,
.vpk-slope-demo {
	background: var(--vpk-surface-raised);
	border: 1px solid var(--vpk-rule);
	padding: 1rem;
}

.vpk-demo-panel,
.vpk-token-swatch,
.vpk-variant,
.vpk-slope-demo {
	display: grid;
	gap: 0.75rem;
}

.vpk-demo-panel strong,
.vpk-token-swatch strong,
.vpk-variant span {
	display: block;
}

.vpk-mini-browser {
	background: var(--vpk-code-surface);
	border: 1px solid var(--vpk-rule);
	display: grid;
	gap: 0.5rem;
	min-height: 8rem;
	padding: 1rem;
}

.vpk-meter {
	background: var(--vpk-code-surface);
	border: 1px solid var(--vpk-rule);
	height: 0.85rem;
	overflow: hidden;
}

.vpk-meter span {
	background: var(--vpk-blueprint);
	display: block;
	height: 100%;
}

.vpk-badge-row {
	display: flex;
	flex-wrap: wrap;
	gap: 0.4rem;
}

.vpk-badge {
	border: 1px solid var(--vpk-rule);
	font-family: var(--vpk-font-mono);
	font-size: 0.78rem;
	padding: 0.2rem 0.4rem;
}

.vpk-token-swatch span {
	border: 1px solid var(--vpk-rule);
	display: block;
	height: 3rem;
}

.vpk-token-swatch code,
.vpk-token-swatch small {
	display: block;
}

.vpk-variant button {
	justify-self: start;
}

.vpk-variant.is-primary button {
	background: var(--vpk-blueprint);
	color: var(--vpk-paper);
}

.vpk-variant.is-danger button {
	background: var(--vpk-danger);
	color: var(--vpk-paper);
}

.vpk-variant.is-disabled {
	color: var(--vpk-muted-text);
	opacity: 0.72;
}

.vpk-flag-on {
	border-color: var(--vpk-success);
}

.vpk-flag-off {
	border-color: var(--vpk-muted-text);
	color: var(--vpk-muted-text);
}

.vpk-trusted-html svg {
	display: block;
	height: auto;
	max-width: 100%;
}

.vpk-trusted-html svg rect,
.vpk-trusted-html svg circle {
	fill: var(--vpk-code-surface);
	stroke: var(--vpk-rule);
	stroke-width: 2;
}

.vpk-trusted-html svg path {
	fill: none;
	stroke: var(--vpk-blueprint);
	stroke-linecap: square;
	stroke-linejoin: round;
	stroke-width: 3;
}

.vpk-trusted-html svg .vpk-fill-soft {
	fill: var(--vpk-math-highlight);
	stroke: var(--vpk-blueprint);
}

.vpk-trusted-html svg .vpk-strong-line {
	stroke-width: 5;
}

.vpk-trusted-html svg text {
	fill: var(--vpk-ink);
	font-family: var(--vpk-font-mono);
	font-size: 14px;
}

.vpk-figure-sheet figure {
	margin: 0;
}

.vpk-figure-sheet figcaption {
	color: var(--vpk-muted-text);
	font-family: var(--vpk-font-mono);
	font-size: 0.8rem;
	margin-top: 0.5rem;
}

.vpk-motion-demo {
	align-items: end;
	background: var(--vpk-code-surface);
	border: 1px solid var(--vpk-rule);
	display: flex;
	gap: 0.75rem;
	height: 8rem;
	padding: 1rem;
}

.vpk-motion-demo span {
	background: var(--vpk-blueprint);
	display: block;
	height: 2rem;
	width: 2rem;
}

.vpk-motion-demo span:nth-child(2) {
	opacity: 0.7;
	transform: translateY(-1rem);
}

.vpk-motion-demo span:nth-child(3) {
	opacity: 0.45;
	transform: translateY(-2rem);
}

.vpk-equation {
	background: var(--vpk-math-highlight);
	border: 1px solid var(--vpk-rule);
	font-family: var(--vpk-font-mono);
	padding: 0.75rem;
}

.vpk-mini-grid {
	display: grid;
	gap: 0.25rem;
	grid-template-columns: repeat(3, 2.5rem);
}

.vpk-mini-grid span {
	aspect-ratio: 1;
	background: var(--vpk-code-surface);
	border: 1px solid var(--vpk-rule);
}

.vpk-letter {
	font-size: 1.05rem;
	margin: 0 auto;
	max-width: 46rem;
}

.vpk-steps {
	display: grid;
	gap: 1rem;
	list-style: none;
	padding: 0;
}

.vpk-steps li {
	display: grid;
	gap: 1rem;
	grid-template-columns: auto 1fr;
}

.vpk-step-index {
	align-items: center;
	background: var(--vpk-ink);
	color: var(--vpk-paper);
	display: inline-flex;
	font-family: var(--vpk-font-mono);
	height: 2rem;
	justify-content: center;
	width: 2rem;
}

pre,
code,
textarea {
	font-family: var(--vpk-font-mono);
}

pre,
textarea {
	background: var(--vpk-code-surface);
	border: 1px solid var(--vpk-rule);
	color: var(--vpk-ink);
	overflow: auto;
	padding: 1rem;
	width: 100%;
}

table {
	border-collapse: collapse;
	min-width: 100%;
}

th,
td {
	border: 1px solid var(--vpk-rule);
	padding: 0.5rem;
	text-align: left;
	vertical-align: top;
}

.vpk-diagram svg {
	display: block;
	height: auto;
	max-width: 100%;
}

.vpk-diagram path {
	fill: none;
	stroke: var(--vpk-blueprint);
	stroke-width: 3;
}

.vpk-diagram rect {
	fill: var(--vpk-paper-background);
	stroke: var(--vpk-rule);
	stroke-width: 2;
}

.vpk-diagram text {
	fill: var(--vpk-ink);
	font-family: var(--vpk-font-mono);
	font-size: 15px;
}

.vpk-deck {
	display: grid;
	gap: 1rem;
}

.vpk-slide {
	aspect-ratio: 16 / 9;
	background: var(--vpk-paper-background);
	border: 2px solid var(--vpk-rule);
	display: grid;
	min-height: 24rem;
	padding: clamp(1rem, 4vw, 3rem);
	place-content: center;
}

.vpk-deck-controls,
.vpk-editor-toolbar {
	align-items: center;
	display: flex;
	flex-wrap: wrap;
	gap: 0.75rem;
	justify-content: center;
}

.vpk-controls {
	display: grid;
	gap: 0.75rem;
	margin-top: 1rem;
}

.vpk-controls label,
.vpk-editor label {
	display: grid;
	gap: 0.4rem;
}

.vpk-assets img {
	display: block;
	height: auto;
	max-width: 100%;
}

@media (max-width: 640px) {
	.vpk-page {
		padding: 0.75rem;
	}

	.vpk-toolbar,
	.vpk-steps li {
		align-items: stretch;
		grid-template-columns: 1fr;
	}

	.vpk-slide {
		aspect-ratio: auto;
		min-height: 22rem;
	}
}

@media print {
	.vpk-shell {
		background: var(--vpk-paper-background);
	}

	.vpk-toolbar,
	.vpk-nav,
	.vpk-deck-controls,
	.vpk-editor-toolbar {
		display: none !important;
	}

	.vpk-page {
		max-width: none;
		padding: 0;
	}

	.vpk-hero,
	.vpk-section,
	.vpk-sources,
	.vpk-slide {
		border: 1px solid #000;
		box-shadow: none;
		break-inside: avoid;
		page-break-inside: avoid;
	}

	.vpk-deck .vpk-slide {
		break-after: page;
		display: grid !important;
	}
}`;
}

function renderScript() {
	return `<script>
(() => {
	const root = document.documentElement;
	const storageKey = "vpk-html-theme";
	const initialMode = root.dataset.initialMode || "system";
	const toggle = document.querySelector("[data-vpk-theme-toggle]");
	const media = window.matchMedia("(prefers-color-scheme: dark)");

	function resolveTheme(mode) {
		if (mode === "system") return media.matches ? "dark" : "light";
		return mode === "dark" ? "dark" : "light";
	}

	function applyTheme(mode) {
		const resolved = resolveTheme(mode);
		root.dataset.theme = resolved;
		root.style.colorScheme = resolved;
		if (toggle) toggle.setAttribute("aria-pressed", String(resolved === "dark"));
	}

	let stored = null;
	try {
		stored = window.localStorage.getItem(storageKey);
	} catch (_error) {
		stored = null;
	}
	applyTheme(stored || initialMode);
	media.addEventListener("change", () => {
		if (!stored || stored === "system") applyTheme("system");
	});
	if (toggle) {
		toggle.addEventListener("click", () => {
			const next = root.dataset.theme === "dark" ? "light" : "dark";
			stored = next;
			try {
				window.localStorage.setItem(storageKey, next);
			} catch (_error) {}
			applyTheme(next);
		});
	}

	document.querySelectorAll("[data-vpk-deck]").forEach(deck => {
		const slides = Array.from(deck.querySelectorAll("[data-vpk-slide]"));
		const progress = deck.querySelector("[data-vpk-deck-progress]");
		let index = 0;
		function show(next) {
			index = Math.max(0, Math.min(slides.length - 1, next));
			slides.forEach((slide, slideIndex) => {
				slide.hidden = slideIndex !== index;
			});
			if (progress) progress.textContent = String(index + 1) + " / " + String(slides.length);
			slides[index]?.focus({ preventScroll: true });
		}
		deck.querySelector("[data-vpk-deck-prev]")?.addEventListener("click", () => show(index - 1));
		deck.querySelector("[data-vpk-deck-next]")?.addEventListener("click", () => show(index + 1));
		deck.addEventListener("keydown", event => {
			if (event.key === "ArrowRight") {
				event.preventDefault();
				show(index + 1);
			}
			if (event.key === "ArrowLeft") {
				event.preventDefault();
				show(index - 1);
			}
		});
		show(0);
	});

	document.querySelectorAll("[data-vpk-slider]").forEach(input => {
		const output = input.parentElement?.querySelector("output");
		function update() {
			if (output) output.value = input.value;
		}
		input.addEventListener("input", update);
		update();
	});

	document.querySelectorAll("[data-vpk-editor]").forEach(editor => {
		const textarea = editor.querySelector("[data-vpk-editor-text]");
		const status = editor.querySelector("[data-vpk-editor-status]");
		const setStatus = message => {
			if (status) status.textContent = message;
		};
		editor.querySelector("[data-vpk-editor-export]")?.addEventListener("click", () => {
			try {
				JSON.parse(textarea.value);
				setStatus("JSON valid and ready to export");
			} catch (error) {
				setStatus(error.message);
			}
		});
		editor.querySelector("[data-vpk-editor-copy]")?.addEventListener("click", async () => {
			try {
				await navigator.clipboard.writeText(textarea.value);
				setStatus("Copied");
			} catch (_error) {
				textarea.select();
				setStatus("Select and copy manually");
			}
		});
		editor.querySelector("[data-vpk-editor-import]")?.addEventListener("click", () => {
			try {
				textarea.value = JSON.stringify(JSON.parse(textarea.value), null, "\t");
				setStatus("Imported");
			} catch (error) {
				setStatus(error.message);
			}
		});
	});
})();
</script>`;
}

export function renderPayloadToString(rawPayload) {
	const payload = validateRenderPayload(rawPayload);
	const definition = getTemplateDefinition(payload.template);
	const renderedAt = new Date().toISOString();
	const sections = payload.sections.length > 0 ? payload.sections : [
		{
			type: "summary",
			heading: "Summary",
			body: "No sections were supplied. Add structured sections to enrich this document.",
		},
	];
	const usesAlgebrica =
		payload.options.useAlgebrica || payload.assets.some(asset => asset.algebrica === true);
	const initialMode = payload.theme.initialMode;

	const css = renderBaseCss();
	const content = sections.map(section => renderSection(section, definition)).join("\n");
	const assets = renderAssets(payload.assets);
	const sources = renderSources(payload);
	const nav = renderNav(sections);
	const toggle = payload.theme.allowToggle
		? '<button type="button" data-vpk-theme-toggle aria-pressed="false">Theme</button>'
		: "";

	return `<!doctype html>
<html lang="en" data-theme="light" data-initial-mode="${escapeAttribute(initialMode)}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${escapeHtml(payload.title)}</title>
	<style>
${css}
	</style>
</head>
<body>
<!-- template: ${escapeHtml(definition.id)}; vpk-html version: ${VERSION}; rendered: ${renderedAt} -->
<div class="vpk-shell" data-vpk-template="${escapeAttribute(definition.id)}" data-vpk-toggle-allowed="${payload.theme.allowToggle ? "true" : "false"}" ${usesAlgebrica ? 'data-vpk-algebrica="true"' : ""}>
	<div class="vpk-page">
		<div class="vpk-toolbar">
			<span class="vpk-pill">${escapeHtml(definition.category)}</span>
			${toggle}
		</div>
		<header class="vpk-hero">
			<p class="vpk-eyebrow">${escapeHtml(definition.label)} / ${escapeHtml(definition.interaction)}</p>
			<h1>${escapeHtml(payload.title)}</h1>
			${payload.subtitle ? `<p>${escapeHtml(payload.subtitle)}</p>` : ""}
			${payload.audience ? `<p class="vpk-meta">Audience: ${escapeHtml(payload.audience)}</p>` : ""}
		</header>
		${nav}
		<main>
${content}
${assets}
		</main>
		${sources}
	</div>
</div>
${renderScript()}
</body>
</html>
`;
}

export function renderPayloadToFile(rawPayload, outPath, options = {}) {
	const payload = validateRenderPayload(rawPayload);
	const resolvedOutPath = resolveOutputPath(outPath) || resolveDefaultOutputPath(payload);

	if (fs.existsSync(resolvedOutPath) && options.overwrite !== true) {
		throw new Error(`Refusing to overwrite existing file without --overwrite: ${resolvedOutPath}`);
	}

	fs.mkdirSync(path.dirname(resolvedOutPath), { recursive: true });
	fs.writeFileSync(resolvedOutPath, renderPayloadToString(payload), "utf8");
	return resolvedOutPath;
}

export function readPayloadFile(inputPath) {
	const resolved = path.resolve(process.cwd(), inputPath);
	return JSON.parse(readText(resolved));
}

async function main() {
	try {
		const args = parseArgs(process.argv.slice(2));
		if (args.help) {
			console.log(usage());
			return;
		}
		if (!args.input) throw new Error(usage());
		const payload = readPayloadFile(args.input);
		const outputPath = renderPayloadToFile(payload, args.out, {
			overwrite: args.overwrite,
		});
		console.log(path.relative(process.cwd(), outputPath));
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}

if (process.argv[1] === __filename) {
	await main();
}
