#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEMOS, DIAGRAMS, ensureFaviconLinks, TEMPLATES } from "./shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLACEHOLDER_PATTERN = /\{\{[^}]+\}\}/g;

const inlineDemoSvg = `<svg viewBox="0 0 620 220" aria-label="Landing demo separation flow" xmlns="http://www.w3.org/2000/svg">
	<rect x="20" y="44" width="160" height="72" rx="6" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
	<rect x="230" y="44" width="160" height="72" rx="6" fill="var(--blueprint-tint)" stroke="var(--blueprint)"/>
	<rect x="440" y="44" width="160" height="72" rx="6" fill="var(--surface-sunken)" stroke="var(--rule-strong)"/>
	<path d="M180 80h50M390 80h50" fill="none" stroke="var(--blueprint)" stroke-width="2"/>
	<text x="100" y="75" fill="var(--ink)" font-size="13" text-anchor="middle">raw sources</text>
	<text x="100" y="95" fill="var(--muted-text)" font-size="10" text-anchor="middle">templates and diagrams</text>
	<text x="310" y="75" fill="var(--blueprint)" font-size="13" text-anchor="middle">mock previews</text>
	<text x="310" y="95" fill="var(--muted-text)" font-size="10" text-anchor="middle">filled landing demos</text>
	<text x="520" y="75" fill="var(--ink)" font-size="13" text-anchor="middle">authoring flow</text>
	<text x="520" y="95" fill="var(--muted-text)" font-size="10" text-anchor="middle">copy and fill source</text>
</svg>`;

const documentDemos = [
	{
		source: "one-pager",
		target: "demo-one-pager",
		replacements: [
			["{{DOC_TITLE}}", "Landing Demo Separation Brief"],
			["{{AUTHOR}}", "vpk-html Maintainers"],
			["{{DESCRIPTION}}", "Filled one-page mock that previews the vpk-html landing contract without exposing raw template placeholders."],
			["{{KEYWORDS}}", "vpk-html, demo catalog, templates, landing"],
			["{{EYEBROW - e.g. Proposal / Report / Exec Summary}}", "Internal Brief"],
			["{{Document headline - verb-led, fits in two lines, bookish.}}", "Landing demos should be filled, source templates should stay reusable."],
			["{{One-line subtitle or the single sharpest claim.}}", "The catalog is for previewing finished shapes; authoring sources stay in templates and diagrams."],
			["{{YYYY.MM.DD}}", "2026.05.12"],
			["{{VERSION / STATUS}}", "Mock preview"],
			["{{~30-40 words. The one paragraph that sets the whole document's tone. Use <span class=\"hl\">brand-color emphasis</span> on the sharpest claim or number. Everything below is in service of this.}}", "The landing page now links to <span class=\"hl\">filled mock previews</span> instead of raw placeholder-bearing sources. Authors can still copy templates from the documented source tables when they need a reusable starting point."],
			["{{Key quote / critical note / the single takeaway that must not be missed.}}", "Preview files are demos. Source files are authoring materials. The landing page should never blur those roles."],
			["{{CONFIDENTIALITY - internal / public / draft}}", "LOCAL DEMO"],
			["{{PAGE / CONTACT}}", "1 of 1 - vpk-html"],
			["{{Section one}}", "What changes"],
			["{{Section two}}", "Why it matters"],
		],
		sequences: [
			["{{NUMBER}}", ["19", "14", "5", "0"]],
			["{{LABEL}}", ["new mock demos", "diagram previews", "document previews", "raw landing links"]],
			["{{One or two sentences expanding the claim.}}", ["Every landing row points at an `assets/demos/demo-*.html` file with representative content already filled in. The reusable source templates remain available through documentation and direct file paths."]],
			["{{One or two sentences.}}", ["This prevents visible `{{...}}` tokens from appearing when a user opens a demo from the catalog. It also keeps diagram primitives cleanly separated from landing previews."]],
			["{{Short bullet: a data point, observation, or judgment.}}", ["Five base document rows now use explicit mock demo files."]],
			["{{Short bullet with <span class=\"hl\">key figure</span>.}}", ["All <span class=\"hl\">14 diagram primitives</span> now have demo counterparts."]],
			["{{Short bullet.}}", [
				"Documentation tables still point at source templates for actual authoring.",
				"The landing regression test fails if a row points back into templates or diagrams.",
				"Intentional literal-brace demos still opt in with the existing data attribute.",
				"Each generated mock is validated through the shared offline HTML checker.",
			]],
			["{{STAGE_TITLE}}", ["Separate", "Preview", "Guard"]],
			["{{One-line explanation.}}", [
				"Move landing navigation away from raw source files.",
				"Add filled mock HTML for every source-shaped landing row.",
				"Assert the contract in a Node test so it does not drift.",
			]],
		],
	},
	{
		source: "long-doc",
		target: "demo-long-doc",
		replacements: [
			["{{DOC_TITLE}}", "Landing Demo Separation Runbook"],
			["{{Document title<br>can span two lines}}", "Landing demo<br>separation runbook"],
			["{{AUTHOR}}", "vpk-html Maintainers"],
			["{{AUTHOR / TEAM}}", "vpk-html Maintainers"],
			["{{DATE}}", "2026.05.12"],
			["{{DESCRIPTION}}", "Long-form mock preview explaining how landing demos stay separate from reusable vpk-html templates and diagrams."],
			["{{KEYWORDS}}", "vpk-html, landing, mock demos, templates, diagrams"],
			["{{EYEBROW - e.g. Technical Report / Annual Review / White Paper}}", "Technical Note"],
			["{{One-line subtitle - what this is and who it's for.}}", "A mock long document for maintainers reviewing the demo catalog contract."],
			["{{Version 1.0}}", "v1.0"],
			["{{YYYY.MM}}", "2026.05"],
			["{{PUBLISHER / ORGANIZATION}}", "Venn Prototype Kit"],
			["{{Two or three sentences opening the whole thesis. Use <span class=\"hl\">brand-color emphasis</span> to grab attention on the sharpest claim. A reader of only this paragraph should understand what the document argues.}}", "The vpk-html landing page is a catalog of finished shapes, not a shelf of raw authoring sources. Moving every raw link to a <span class=\"hl\">filled mock preview</span> makes the first click representative while preserving the template workflow for real documents."],
			["{{List the three core questions as actual questions - so the reader can decide in ten seconds whether to read on.}}", "Which landing rows exposed raw sources? Where should reusable authoring files continue to live? What test prevents template placeholders from leaking back into the demo path?"],
			["{{Three to five lines describing the status quo. Use <span class=\"hl\">specific figures</span> rather than adjectives.}}", "Before this cleanup, five document rows and fourteen diagram rows opened source files directly. Those files intentionally contain placeholder tokens because they are meant to be copied and filled, not browsed as demos."],
			["{{State the problem specifically. Use a callout to emphasize a key observation:}}", "The landing route made the source/template distinction invisible. A user could click a catalog row and see raw curly-brace tokens that were correct for authoring but wrong for a demo."],
			["{{TERM}}", "demo separation"],
			["{{SOURCE / PERSON}}", "vpk-html implementation note"],
			["{{TITLE}}", "Landing Demo Separation"],
			["{{If the reader does one thing, what is it? Specific enough to start Monday morning.}}", "When adding a landing row, link to `assets/demos/demo-*.html`; when documenting the authoring workflow, point to `assets/templates/` or `assets/diagrams/`."],
			["{{Chapter intro - what this chapter is solving, why it matters. One or two sentences.}}", "This pass separates browse-time previews from authoring-time sources. The source files remain reusable; the landing page now opens filled artifacts only."],
			["{{A paragraph with data: <span class=\"hl\">specific numbers or ratios</span>.}}", "The cleanup adds <span class=\"hl\">19 landing-only mocks</span>: five document previews and fourteen diagram previews. Existing real demos remain unchanged and continue to validate through `check-html.mjs`."],
			["{{A short quoted line or key observation. Different in tone from the body so the reader gets a breath.}}", "A template with curly braces is healthy. A landing demo with unresolved curly braces is noise."],
			["{{Spread heading - what this figure proves}}", "Landing links now stop at demos"],
			["{{INSERT DIAGRAM SVG}}", inlineDemoSvg],
			["{{One-line caption that names what the reader is looking at.}}", "The landing route now points at filled mock previews while source files stay in the authoring route."],
			["{{Figure description}}", "Flow from raw source files to mock previews and then to the documented authoring workflow."],
			["{{Prose that walks the reader through the diagram. Reference parts of the figure by name, not by location (\"the left half\" rots when the layout changes).}}", "Raw source files contain reusable structure and placeholder syntax. Mock previews fill those shapes with representative content. Documentation keeps the authoring source paths visible for agents that need to copy and fill a template."],
			["{{Chapter intro - a one-line summary of the conclusion, then the recommendations below.}}", "Keep the landing catalog demo-only and keep source tables authoring-only."],
			["{{Describe the methodology. Code or formula examples welcome:}}", "`index.html` is parsed for every `.demo-row` href. The regression test rejects `assets/templates/` and `assets/diagrams/`, verifies each linked file exists, then validates the target with `check-html.mjs`."],
			["{{A quoted passage - user interview, expert perspective, or cited source.}}", "\"The landing page should show mock previews, not the raw template syntax needed by authors.\" - implementation brief"],
			["{{definition}}", "demo separation"],
			["{{DIMENSION_1}}", "Route"],
			["{{DIMENSION_2}}", "Contract"],
			["{{GAP}}", "Future landing rows need the same demo-first path discipline."],
		],
		sequences: [
			["{{Takeaway 1 - a quantified conclusion in one line.}}", ["Nineteen raw landing targets now have filled demo counterparts."]],
			["{{Takeaway 2 - an insight backed by data.}}", ["The landing page can validate every row without allowing source-template links."]],
			["{{Takeaway 3 - a forward-looking judgment.}}", ["The next source file added to vpk-html should receive a demo file before it appears in the catalog."]],
			["{{VAL}}", ["5", "14", "19", "0", "1", "28", "2026.05", "100%"]],
			["{{Chapter intro.}}", [
				"The document rows now map to one-pager, long-doc, letter, slides, and changelog mock files in `assets/demos/`.",
				"The diagram rows now map to mock preview files named `demo-diagram-*.html`.",
				"The docs continue to list raw source paths because the authoring workflow still starts there.",
			]],
			["{{A paragraph.}}", [
				"The landing page is optimized for browsing. It should answer: what does this artifact type feel like when filled?",
				"The template and diagram folders are optimized for authoring. They should preserve placeholder syntax so agents know what to replace.",
				"Those jobs are adjacent but not interchangeable. Mixing them made the demo catalog look unfinished even though the source files were correct.",
				"The new test encodes the split so future edits fail fast when a raw source path re-enters the landing route.",
			]],
			["{{Conclusion 1.}}", ["A catalog row should never expose unresolved source placeholders."]],
			["{{Conclusion 2.}}", ["A template file should stay reusable and placeholder-bearing."]],
			["{{Conclusion 3.}}", ["A diagram primitive should be copied into documents, not treated as its own finished demo."]],
			["{{Concrete, executable recommendations tied to the conclusions.}}", ["Add a `demo-*` file before adding a new landing row. Keep source-route changes in `SKILL.md`, `CHEATSHEET.md`, or `README.md`, not in the landing catalog."]],
			["{{Acknowledgement paragraph.}}", ["This mock is intentionally local and factual: it demonstrates the catalog contract without inventing product metrics or external claims."]],
			["{{Reference 1}}", ["vpk-html SKILL.md route tables"]],
			["{{Reference 2}}", ["landing-links.test.js regression guard"]],
		],
	},
	{
		source: "letter",
		target: "demo-letter",
		replacements: [
			["{{LETTER_SUBJECT}}", "Landing demo separation review"],
			["{{AUTHOR}}", "vpk-html Maintainers"],
			["{{DESCRIPTION}}", "Filled letter mock for the vpk-html landing catalog."],
			["{{KEYWORDS}}", "vpk-html, letter, demo, template separation"],
			["{{SENDER_NAME}}", "Ari Chen"],
			["{{SENDER_ADDRESS / DEPARTMENT / ORGANIZATION}}", "VPK Design Systems"],
			["{{EMAIL}}", "ari@example.local"],
			["{{PHONE}}", "+1 555 0100"],
			["{{DATE, e.g. April 18, 2026}}", "May 12, 2026"],
			["{{RECIPIENT_NAME_OR_TITLE}}", "VPK Maintainers"],
			["{{RECIPIENT_ORG / DEPARTMENT}}", "Document tooling review"],
			["{{One-sentence subject line: what this letter is about.}}", "Request to keep landing demos separate from reusable source templates."],
			["{{Dear {{NAME}},}}", "Dear maintainers,"],
			["{{Paragraph 4 (optional): close. Express anticipation, gratitude, or a courteous sign-off line.}}", "Please treat this as the expected catalog behavior for future vpk-html additions. A new source template should not appear on the landing page until it has a filled mock preview beside it."],
			["{{Closing - \"Best regards,\" / \"Sincerely,\" / \"Warm regards,\"}}", "Best regards,"],
			["{{HANDWRITTEN_NAME_OR_SIGNATURE}}", "Ari Chen"],
			["{{TITLE · DEPARTMENT}}", "Design Systems Engineer"],
			["{{DATE (optional restatement)}}", "May 12, 2026"],
			["{{List - ① Attachment 1 · ② Attachment 2}}", "Attachment 1 - landing-links regression guard; Attachment 2 - filled demo file list."],
		],
		sequences: [
			["{{Paragraph 4 (optional): close. Express anticipation, gratitude, or a courteous sign-off line.}}", ["Please treat this as the expected catalog behavior for future vpk-html additions. A new source template should not appear on the landing page until it has a filled mock preview beside it."]],
		],
	},
	{
		source: "slides",
		target: "demo-slides",
		replacements: [
			["{{Page Title}}", "Landing Demo Separation"],
			["{{Project}}", "vpk-html"],
			["{{Author}}", "VPK Maintainers"],
			["{{Date}}", "2026.05.12"],
			["{{Title}}", "Landing demos use filled mock previews"],
			["{{Subtitle}}", "Reusable templates and diagrams stay in their source folders."],
			["{{Section}}", "Catalog contract"],
			["{{Key takeaway or bottom-line conclusion}}", "Every landing row should open a demo file, not a raw source file."],
			["{{Lead paragraph}}", "The landing catalog is a browse surface. It should show representative filled content while the documented authoring workflow points agents to reusable placeholders."],
			["{{Left heading}}", "Before"],
			["{{Left body}}", "Raw template and diagram files opened directly from the landing page, exposing placeholder syntax."],
			["{{Right heading}}", "After"],
			["{{Right body}}", "Landing rows open filled mock files under `assets/demos/`, while docs still reference raw sources."],
		],
		sequences: [
			["{{Module title}}", ["Document mocks", "Diagram mocks", "Regression guard"]],
			["{{Module body}}", [
				"One-pager, long-doc, letter, slides, and changelog now have filled landing previews.",
				"Fourteen inline SVG primitives now have matching `demo-diagram-*` previews.",
				"`landing-links.test.js` rejects raw source folders and validates every linked file.",
			]],
			["{{Dimension}}", ["Document rows", "Diagram rows", "Raw source links"]],
			["{{Value}}", ["5", "14", "0"]],
			["{{Note}}", ["Authoring route tables remain unchanged in the skill documentation.", "Literal brace demos must opt in with `data-vpk-literal-double-braces=\"true\"`.", "Run `check-html.mjs` before publishing new demo files."]],
			["{{Body content}}", ["Source templates still keep their placeholders. That is correct for authoring and wrong for the landing demo path."]],
		],
	},
	{
		source: "changelog",
		target: "demo-changelog",
		replacements: [
			["{{PROJECT_NAME}}", "vpk-html"],
			["{{VERSION}}", "2026.05.12"],
			["{{RELEASE_NAME}}", "Landing Demo Separation"],
			["{{RELEASE_DATE}}", "May 12, 2026"],
			["{{AUTHOR}}", "vpk-html Maintainers"],
			["{{DESCRIPTION}}", "Filled changelog mock for the vpk-html landing demo catalog."],
			["{{KEYWORDS}}", "vpk-html, changelog, demo catalog, templates"],
			["{{PROJECT_URL}}", "file://vpk-html/index.html"],
			["{{One-line project description.}}", "Offline HTML artifact templates for polished local documents and diagrams."],
			["{{One-line release highlight.}}", "Landing rows now open filled mock previews instead of raw placeholder-bearing sources."],
			["{{New feature 1: one-line description.}}", "Added explicit mock demo files for five base document templates."],
			["{{New feature 2: one-line description.}}", "Added mock preview files for all fourteen inline diagram primitives."],
			["{{New feature 3: one-line description.}}", "Updated the landing copy and row labels to describe the demo-only path."],
			["{{Fix 1: one-line description.}}", "Removed direct landing links to `assets/templates/`."],
			["{{Fix 2: one-line description.}}", "Removed direct landing links to `assets/diagrams/`."],
			["{{Fix 3: one-line description.}}", "Added a regression test that validates every landing target with `check-html.mjs`."],
			["{{Breaking change description.}}", "None for the authoring workflow. Source templates and diagram primitives remain in place."],
			["{{Thank contributors, e.g. \"Thanks to @user1, @user2 for their contributions.\"}}", "Thanks to the local VPK maintainers for keeping demos and source templates clearly separated."],
		],
	},
];

const diagramDemos = [
	["architecture", "Architecture", {
		"{{System name}}": "Demo Catalog",
	}],
	["flowchart", "Flowchart", {
		"{{Question the flow answers}}": "Should this landing row open a source file?",
		"{{Describe input}}": "New catalog row",
		"{{Decision}}": "Has filled demo?",
		"{{Path taken}}": "Link demo file",
		"{{Alt path}}": "Create mock preview",
	}],
	["swimlane", "Swimlane", {
		"{{System name}}": "Landing Review",
	}],
	["state-machine", "State Machine", {
		"{{Component name}}": "Demo Row",
	}],
	["timeline", "Timeline", {
		"{{Project name}}": "Demo Separation",
	}],
	["tree", "Tree", {
		"{{System name}}": "vpk-html",
		"{{System}}": "Demo catalog",
		"{{Module A}}": "Source files",
		"{{Module B}}": "Landing previews",
		"{{Leaf 1}}": "one-pager",
		"{{Leaf 2}}": "long-doc",
		"{{Leaf 3}}": "letter",
		"{{Leaf 4}}": "slides",
		"{{Leaf 5}}": "diagrams",
	}],
	["layer-stack", "Layer Stack", {
		"{{System name}}": "vpk-html Landing",
	}],
	["quadrant", "Quadrant", {
		"{{X axis}}": "Demo fidelity",
		"{{Y axis}}": "Authoring reuse",
		"{{X axis · low to high}}": "low fidelity -> high fidelity",
		"{{Y axis · low to high}}": "single-use -> reusable",
		"{{Item A}}": "raw template",
		"{{Item B · focal}}": "filled demo",
		"{{Item C}}": "doc table",
		"{{Item D}}": "diagram primitive",
		"{{Item E}}": "landing row",
		"{{Item F}}": "source copy",
		"{{Item G}}": "mock preview",
		"{{Item H}}": "regression test",
	}],
	["venn", "Venn", {
		"{{Topic A}}": "Templates",
		"{{Topic B}}": "Demos",
		"{{Set A only}}": "Reusable placeholders",
		"{{Shared}}": "Shared layout language",
		"{{Set B only}}": "Filled preview content",
	}],
	["bar-chart", "Bar Chart", {
		"{{Chart Title}}": "Landing link targets by type",
		"{{Series A label}}": "Raw links",
		"{{Series B label}}": "Demo links",
		"{{Caption text. The focal series in blueprint carries the primary argument. State the takeaway here, not a description of what is plotted.}}": "After separation, every landing target is a filled demo file.",
	}],
	["line-chart", "Line Chart", {
		"{{Chart Title}}": "Placeholder leakage over cleanup",
		"{{Line 1 label}}": "Raw-source exposure",
		"{{Line 2 label}}": "Demo coverage",
		"{{Caption text. The blueprint line carries the primary trend argument. State what the trend means, not what was plotted.}}": "Demo coverage rises to full catalog coverage as raw source exposure drops to zero.",
	}],
	["donut-chart", "Donut Chart", {
		"{{Chart Title}}": "Landing catalog makeup",
		"{{CENTER LABEL}}": "19 mocks",
		"{{Category A}}": "documents",
		"{{Category B}}": "diagrams",
		"{{Category C}}": "reviews",
		"{{Category D}}": "reports",
		"{{Category E}}": "editors",
		"{{Category F}}": "decks",
		"{{Source / period}}": "vpk-html landing mock set",
		"{{Caption text. The blueprint segment is the focal category. Lead with the insight, not the breakdown.}}": "The new mock set covers all previously raw landing targets.",
	}],
	["candlestick", "Candlestick", {
		"{{Chart Title}}": "Demo coverage check",
		"{{D1}}": "start",
		"{{D6}}": "docs",
		"{{D11}}": "diagrams",
		"{{D16}}": "guard",
		"{{D20}}": "done",
		"{{Caption: e.g. \"20-day price action showing accumulation phase.\"}}": "Mock OHLC preview showing the landing cleanup moving from raw exposure to guarded demo coverage.",
	}],
	["waterfall", "Waterfall", {
		"{{Chart Title}}": "Raw landing links removed",
		"{{Start}}": "Raw links",
		"{{Cat A}}": "Docs",
		"{{Cat B}}": "Diagrams",
		"{{Cat C}}": "Existing demos",
		"{{Cat D}}": "Tests",
		"{{Cat E}}": "Final",
		"{{End}}": "Demo-only",
		"{{Caption: e.g. \"Revenue bridge from FY2024 to FY2025, showing growth drivers and headwinds.\"}}": "Waterfall preview showing how document and diagram mocks reduce raw landing exposure to zero.",
	}],
];

function readSource(directory, slug) {
	return fs.readFileSync(path.join(directory, `${slug}.html`), "utf8");
}

function writeDemo(slug, html) {
	fs.writeFileSync(path.join(DEMOS, `${slug}.html`), ensureFaviconLinks(html), "utf8");
}

function replaceAll(html, replacements) {
	let out = html;
	for (const [from, to] of replacements) {
		out = out.split(from).join(to);
	}
	return out;
}

function replaceSequential(html, sequences = []) {
	let out = html;
	for (const [needle, values] of sequences) {
		const fallback = values[values.length - 1] ?? "";
		let index = 0;
		while (out.includes(needle)) {
			const value = values[index] ?? fallback;
			out = out.replace(needle, value);
			index += 1;
		}
	}
	return out;
}

function fallbackFor(token) {
	const label = token
		.slice(2, -2)
		.replace(/<[^>]+>/g, "")
		.replace(/["`]/g, "")
		.replace(/\s+/g, " ")
		.trim();
	const lower = label.toLowerCase();
	if (/(date|yyyy|month)/.test(lower)) return "2026.05.12";
	if (/(author|team|publisher|organization)/.test(lower)) return "vpk-html Maintainers";
	if (/keyword/.test(lower)) return "vpk-html, demo, mock preview";
	if (/(number|value|\bval\b|\bnn\b)/.test(lower)) return "42";
	if (/(title|headline|subject)/.test(lower)) return "Filled mock preview";
	if (/(caption|description)/.test(lower)) return "Representative mock content for the landing demo preview.";
	if (/reference/.test(lower)) return "Local vpk-html documentation";
	return "Filled mock content for the landing preview.";
}

function fillRemaining(html) {
	let out = html;
	const tokens = [...new Set(out.match(PLACEHOLDER_PATTERN) ?? [])];
	for (const token of tokens) {
		out = out.split(token).join(fallbackFor(token));
	}
	return out;
}

function ensureColorScheme(html) {
	if (/color-scheme:\s*light dark/.test(html)) return html;
	return html.replace(/(:root\s*\{)/, "$1\n\tcolor-scheme: light dark;");
}

function addMainLandmark(html, label) {
	if (/<main\b/i.test(html)) return html;
	return html
		.replace(/<body([^>]*)>/i, `<body$1>\n<main aria-label="${escapeAttribute(label)}">`)
		.replace(/(\s*)(<script\b|<\/body>)/i, `\n</main>$1$2`);
}

function markSvgAccessibility(html, title = null) {
	let first = true;
	return html.replace(/<svg\b(?![^>]*\baria-(?:label|hidden|labelledby)=)([^>]*)>/gi, (_, attrs) => {
		if (first && title) {
			first = false;
			return `<svg aria-label="${escapeAttribute(title)} mock diagram"${attrs}>`;
		}
		return `<svg aria-hidden="true"${attrs}>`;
	});
}

function markHtmlAsDemo(html, source) {
	if (/data-vpk-landing-demo=/.test(html)) return html;
	return html.replace(/<html\b([^>]*)>/i, `<html$1 data-vpk-landing-demo="true" data-vpk-demo-source="${source}">`);
}

function escapeAttribute(value) {
	return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function assertNoPlaceholders(html, slug) {
	const match = /(\{\{|\}\})/.exec(html);
	if (match) {
		const line = html.slice(0, match.index).split("\n").length;
		throw new Error(`${slug} still contains placeholder braces near line ${line}`);
	}
}

function buildDocumentDemo(demo) {
	let html = readSource(TEMPLATES, demo.source);
	html = replaceAll(html, demo.replacements);
	html = replaceSequential(html, demo.sequences);
	html = fillRemaining(html);
	html = ensureColorScheme(html);
	html = addMainLandmark(html, "vpk-html mock preview");
	html = markSvgAccessibility(html);
	html = markHtmlAsDemo(html, `template:${demo.source}`);
	assertNoPlaceholders(html, demo.target);
	writeDemo(demo.target, html);
}

function buildDiagramDemo([source, title, replacementObject]) {
	const replacements = Object.entries(replacementObject);
	let html = readSource(DIAGRAMS, source);
	html = replaceAll(html, replacements);
	html = fillRemaining(html);
	html = ensureColorScheme(html);
	html = addMainLandmark(html, "vpk-html diagram mock preview");
	html = markSvgAccessibility(html, title);
	html = markHtmlAsDemo(html, `diagram:${source}`);
	assertNoPlaceholders(html, `demo-diagram-${source}`);
	writeDemo(`demo-diagram-${source}`, html);
}

function main() {
	fs.mkdirSync(DEMOS, { recursive: true });
	for (const demo of documentDemos) buildDocumentDemo(demo);
	for (const demo of diagramDemos) buildDiagramDemo(demo);
	console.log(`Built ${documentDemos.length + diagramDemos.length} landing demo mocks from ${path.relative(process.cwd(), __dirname)}.`);
}

main();
