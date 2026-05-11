import { TEMPLATE_DEFINITIONS } from "../templates/catalog.mjs";

const interactiveIds = new Set([
	"exploration-code-approaches",
	"exploration-visual-designs",
	"implementation-plan",
	"code-review-pr",
	"code-understanding",
	"design-system",
	"component-variants",
	"prototype-animation",
	"prototype-interaction",
	"svg-illustrations",
	"flowchart-diagram",
	"slide-deck",
	"research-feature-explainer",
	"research-concept-explainer",
	"incident-report",
	"editor-triage-board",
	"editor-feature-flags",
	"editor-prompt-tuner",
	"math-knowledge",
	"math-proof",
	"math-procedure",
	"math-concept-map",
	"math-interactive",
]);

function trustedHtml(strings) {
	return strings.join("\n");
}

function overview(definition, body, cards) {
	return {
		type: "overview",
		kicker: definition.family,
		heading: `${definition.label} in use`,
		body,
		cards,
	};
}

function sourceSection() {
	return {
		type: "sources",
		heading: "Example data policy",
		body: "This demo uses invented project data so the template shape is visible without depending on private tickets, customer names, or live metrics.",
	};
}

function codeApproaches(definition) {
	return [
		overview(definition, "Use this output when a user needs to compare credible implementation paths before code is written. The example weighs a static-export renderer, a route-backed preview, and a hybrid payload pipeline.", [
			{
				title: "Static renderer",
				body: "Best when the artifact must be portable, reviewable, and safe to attach to a PR.",
				status: "recommended",
			},
			{
				title: "Route-backed preview",
				body: "Best when the artifact depends on app state, auth, or live product components.",
				status: "situational",
			},
			{
				title: "Hybrid payload",
				body: "Best when source material should be structured once, then rendered into several formats.",
				status: "scalable",
			},
		]),
		{
			type: "comparison",
			heading: "Decision matrix",
			table: {
				headers: ["Approach", "Strength", "Cost", "Use when"],
				rows: [
					["Single-file HTML", "Zero runtime dependencies", "Limited app component reuse", "The artifact must travel through email, Slack, or PR comments"],
					["Next.js route", "Can reuse VPK components", "Needs a dev server or deployment", "The demo is part of the product surface"],
					["Payload plus renderer", "Repeatable and testable", "Requires schema design", "The same material needs gallery, print, and handoff outputs"],
				],
			},
		},
		{
			type: "recommendation",
			heading: "Recommended path",
			steps: [
				{
					title: "Normalize source material",
					body: "Extract title, audience, sections, diagrams, sources, and print requirements before choosing layout details.",
				},
				{
					title: "Render as portable HTML",
					body: "Use the VPK HTML shell when the artifact needs to be opened offline or attached outside the app.",
				},
				{
					title: "Promote only proven patterns",
					body: "Move a pattern into the main app only after a demo shows that the interaction and reading rhythm work.",
				},
			],
		},
		sourceSection(),
	];
}

function visualDesigns(definition) {
	return [
		overview(definition, "This template compares visual directions with enough specificity that a reviewer can discuss density, tone, and affordances instead of reacting to a blank moodboard.", [
			{
				title: "Editorial white",
				body: "Large type, white page surfaces, restrained rules, and source notes. Closest fit for Making Software-style explainers.",
				status: "direction A",
			},
			{
				title: "Workbench",
				body: "Compact panels, token swatches, small controls, and dense comparison tables for repeated tool use.",
				status: "direction B",
			},
			{
				title: "Teaching canvas",
				body: "Diagram-first composition with callouts, progressive examples, and print-friendly hierarchy.",
				status: "direction C",
			},
		]),
		{
			type: "visuals",
			heading: "Direction thumbnails",
			trustedHtml: trustedHtml([
				'<div class="vpk-demo-grid">',
				'	<div class="vpk-demo-panel">',
				'		<p class="vpk-eyebrow">Editorial white</p>',
				'		<div class="vpk-mini-browser"><strong>Prompt engineering without the fog</strong><span>Lead, example, diagram, references.</span></div>',
				'	</div>',
				'	<div class="vpk-demo-panel">',
				'		<p class="vpk-eyebrow">Workbench</p>',
				'		<div class="vpk-meter"><span style="width: 72%"></span></div>',
				'		<div class="vpk-badge-row"><span class="vpk-badge">tokens</span><span class="vpk-badge">states</span><span class="vpk-badge">export</span></div>',
				'	</div>',
				'	<div class="vpk-demo-panel">',
				'		<p class="vpk-eyebrow">Teaching canvas</p>',
				'		<svg viewBox="0 0 260 120" role="img" aria-label="Teaching canvas thumbnail"><path d="M30 70 C80 10 150 110 225 35" fill="none" stroke="var(--vpk-blueprint)" stroke-width="5"/><circle cx="30" cy="70" r="10"/><circle cx="225" cy="35" r="10"/></svg>',
				'	</div>',
				'</div>',
			]),
		},
		{
			type: "criteria",
			heading: "Review criteria",
			table: {
				headers: ["Criterion", "Editorial white", "Workbench", "Teaching canvas"],
				rows: [
					["First read", "Strong", "Medium", "Strong"],
					["Repeated editing", "Medium", "Strong", "Medium"],
					["Diagram clarity", "Medium", "Medium", "Strong"],
				],
			},
		},
		sourceSection(),
	];
}

function implementationPlan(definition) {
	return [
		overview(definition, "This plan turns a broad UI request into ordered work that can be validated in a pull request. It includes milestones, gates, and concrete reviewer focus.", [
			{
				title: "Scope",
				body: "Replace placeholder examples with template-specific fixtures and regenerate the gallery.",
				status: "in scope",
			},
			{
				title: "Out of scope",
				body: "No remote assets, no app route dependency, and no private project data.",
				status: "guardrail",
			},
			{
				title: "Done",
				body: "Every clickable card opens a useful sample page with real sections and visual substance.",
				status: "acceptance",
			},
		]),
		{
			type: "milestones",
			heading: "Milestones",
			steps: [
				{
					title: "Replace generic fixture content",
					body: "Build richer payloads for all templates, with focused data and expected visual primitives.",
				},
				{
					title: "Regenerate tracked examples",
					body: "Run the gallery builder so input JSON and output HTML stay in sync.",
				},
				{
					title: "Verify clickability and light mode",
					body: "Check anchor cards, white surfaces, representative SVG/diagram pages, lint, and typecheck.",
				},
			],
		},
		{
			type: "gates",
			heading: "Validation gates",
			table: {
				headers: ["Gate", "Command or check"],
				rows: [
					["Schema and renderer", "node --test .agents/skills/vpk-html/scripts/test-templates.test.js"],
					["Repo lint", "pnpm run lint"],
					["Repo types", "pnpm run typecheck"],
					["Browser evidence", "Gallery has 33 clickable template cards in light mode"],
				],
			},
		},
	];
}

function codeReview(definition) {
	return [
		overview(definition, "This demo shows how a review handoff can lead with actionable findings while still giving maintainers the file paths, evidence, and validation state they need.", [
			{
				title: "P1: Gallery links were inert",
				body: "Template cards looked like navigation but lacked hrefs, so keyboard and pointer users could not open examples.",
				status: "fixed",
			},
			{
				title: "P2: Demo content was generic",
				body: "Several outputs only described the renderer contract instead of demonstrating the template itself.",
				status: "fixed",
			},
			{
				title: "P2: Light palette drifted warm",
				body: "The portable token layer now mirrors VPK/ADS white surfaces and neutral text values.",
				status: "fixed",
			},
		]),
		{
			type: "evidence",
			heading: "Evidence map",
			table: {
				headers: ["Area", "File", "Reviewer focus"],
				rows: [
					["Gallery links", ".agents/skills/vpk-html/scripts/build-gallery.mjs", "Cards include relative hrefs to output pages"],
					["Example content", ".agents/skills/vpk-html/scripts/example-payloads.mjs", "Every template gets representative sections"],
					["Theme tokens", ".agents/skills/vpk-html/references/theme.css", "Light mode uses white surfaces and ADS-like neutrals"],
				],
			},
		},
		{
			type: "validation",
			heading: "Validation notes",
			items: [
				"Static HTML checks pass for each generated output.",
				"Generated pages include dark tokens but open in light mode by default.",
				"Representative outputs include inline SVG, diagrams, controls, tables, editor JSON, and print sections.",
			],
		},
	];
}

function prWriteup(definition) {
	return [
		overview(definition, "This writeup is the artifact a reviewer should see after the gallery work lands: concise change scope, concrete validation, and visible risks.", [
			{
				title: "Changed",
				body: "Rebuilt the template fixture generator with content-rich examples for all gallery cards.",
				status: "summary",
			},
			{
				title: "Validated",
				body: "Renderer tests, static HTML checks, lint, typecheck, and browser click checks.",
				status: "checks",
			},
			{
				title: "Risk",
				body: "Trusted HTML examples are intentionally local and static; they must not become a path for user-supplied raw HTML.",
				status: "watch",
			},
		]),
		{
			type: "details",
			heading: "PR body draft",
			code: [
				"## Summary",
				"- Make vpk-html example gallery cards clickable",
				"- Replace generic fixtures with template-specific demo content",
				"- Align portable light tokens with VPK/ADS white surfaces",
				"",
				"## Validation",
				"- node --test .agents/skills/vpk-html/scripts/test-templates.test.js",
				"- pnpm run lint",
				"- pnpm run typecheck",
			].join("\n"),
		},
		sourceSection(),
	];
}

function codeUnderstanding(definition) {
	return [
		overview(definition, "Use this template to explain a code path with a compact module map, a data flow diagram, and the files a maintainer should read first.", [
			{
				title: "Payload builder",
				body: "Creates validated examples for each template id and keeps the gallery deterministic.",
				status: "source",
			},
			{
				title: "Renderer",
				body: "Converts structured sections into a single offline HTML document with embedded CSS and script.",
				status: "transform",
			},
			{
				title: "Checker",
				body: "Validates that generated output contains the expected shell, tokens, and template marker.",
				status: "gate",
			},
		]),
		{
			type: "flow",
			heading: "Render flow",
			diagram: {
				type: "architecture",
				title: "Payload to portable HTML",
				nodes: ["Template id", "Example payload", "Renderer", "HTML file", "Static check"],
				edges: [
					["Template id", "Example payload"],
					["Example payload", "Renderer"],
					["Renderer", "HTML file"],
					["HTML file", "Static check"],
				],
			},
		},
		{
			type: "files",
			heading: "Files to read first",
			table: {
				headers: ["File", "Purpose"],
				rows: [
					["templates/catalog.mjs", "Defines template ids, labels, families, and interaction promises"],
					["schemas/render-payload.schema.mjs", "Defines the safe portable payload contract"],
					["scripts/render.mjs", "Owns HTML, CSS, and interaction rendering"],
					["scripts/example-payloads.mjs", "Owns demo quality for the gallery"],
				],
			},
		},
	];
}

function designSystem(definition) {
	return [
		overview(definition, "This design-system example documents the portable token layer that vpk-html can embed when it cannot import the app stylesheet. The values mirror established VPK/ADS aliases rather than inventing a cream paper palette.", [
			{
				title: "Surface",
				body: "#FFFFFF mirrors bg-surface and bg-surface-raised in VPK light mode.",
				status: "token",
			},
			{
				title: "Text",
				body: "#292A2E and #505258 mirror text-text and text-text-subtle.",
				status: "token",
			},
			{
				title: "Brand",
				body: "#1868DB mirrors text-text-brand and selected/link affordances.",
				status: "token",
			},
		]),
		{
			type: "tokens",
			heading: "Token swatches",
			trustedHtml: trustedHtml([
				'<div class="vpk-token-swatch-grid">',
				'	<div class="vpk-token-swatch"><span style="background:#FFFFFF"></span><strong>surface</strong><code>#FFFFFF</code><small>bg-surface</small></div>',
				'	<div class="vpk-token-swatch"><span style="background:#F0F1F2"></span><strong>muted</strong><code>#F0F1F2</code><small>bg-muted</small></div>',
				'	<div class="vpk-token-swatch"><span style="background:#292A2E"></span><strong>text</strong><code>#292A2E</code><small>text-text</small></div>',
				'	<div class="vpk-token-swatch"><span style="background:#1868DB"></span><strong>brand</strong><code>#1868DB</code><small>text-text-brand</small></div>',
				'	<div class="vpk-token-swatch"><span style="background:#E9F2FE"></span><strong>info</strong><code>#E9F2FE</code><small>bg-bg-information</small></div>',
				'	<div class="vpk-token-swatch"><span style="background:#FFF5DB"></span><strong>warning</strong><code>#FFF5DB</code><small>bg-bg-warning</small></div>',
				'</div>',
			]),
		},
		{
			type: "rules",
			heading: "Authoring rules",
			table: {
				headers: ["Need", "VPK class", "Portable HTML token"],
				rows: [
					["Page background", "bg-surface", "--vpk-paper-background"],
					["Raised card", "bg-surface-raised", "--vpk-surface-raised"],
					["Subtle text", "text-text-subtle", "--vpk-muted-text"],
					["Focus ring", "ring-ring", "--vpk-focus-ring"],
				],
			},
		},
	];
}

function componentVariants(definition) {
	return [
		overview(definition, "This template demonstrates variants and states by showing concrete button-like controls, selected cards, and disabled rows in one place.", [
			{
				title: "Primary",
				body: "Use for the one action that moves the artifact forward.",
				status: "action",
			},
			{
				title: "Subtle",
				body: "Use for navigation, secondary commands, and dismissive actions.",
				status: "secondary",
			},
			{
				title: "Danger",
				body: "Use only where destructive intent is clear from surrounding copy.",
				status: "destructive",
			},
		]),
		{
			type: "variants",
			heading: "Variant gallery",
			trustedHtml: trustedHtml([
				'<div class="vpk-variant-grid">',
				'	<div class="vpk-variant is-primary"><span>Primary</span><button type="button">Render</button></div>',
				'	<div class="vpk-variant"><span>Subtle</span><button type="button">Preview</button></div>',
				'	<div class="vpk-variant is-danger"><span>Danger</span><button type="button">Delete</button></div>',
				'	<div class="vpk-variant is-disabled"><span>Disabled</span><button type="button" disabled>Queued</button></div>',
				'</div>',
			]),
		},
		{
			type: "states",
			heading: "State matrix",
			table: {
				headers: ["State", "Visual signal", "Behavior"],
				rows: [
					["Default", "White surface, neutral border", "Available for pointer and keyboard"],
					["Selected", "Brand border and information background", "Persists after selection"],
					["Disabled", "Muted text and reduced contrast", "Skipped by interaction logic"],
				],
			},
		},
	];
}

function prototypeAnimation(definition) {
	return [
		overview(definition, "This prototype makes motion values visible. The sliders update locally, and the diagram shows how duration and easing affect staged UI movement.", [
			{
				title: "Duration",
				body: "Tune between instant press feedback and slower page-level reveals.",
				status: "slider",
			},
			{
				title: "Distance",
				body: "Preview how far the element should travel before it feels disconnected.",
				status: "slider",
			},
			{
				title: "Reduced motion",
				body: "The embedded CSS includes a reduced-motion override for animations and transitions.",
				status: "a11y",
			},
		]),
		{
			type: "controls",
			heading: "Motion controls",
			body: "Move the sliders to confirm keyboard and pointer controls render in the offline artifact.",
			controls: [
				{
					label: "Duration",
					value: "200",
					min: 50,
					max: 600,
				},
				{
					label: "Distance",
					value: "24",
					min: 0,
					max: 80,
				},
			],
			trustedHtml: trustedHtml([
				'<div class="vpk-motion-demo" aria-label="Motion staging demo">',
				'	<span></span>',
				'	<span></span>',
				'	<span></span>',
				'</div>',
			]),
		},
		{
			type: "tokens",
			heading: "Motion token map",
			table: {
				headers: ["Use", "Token", "Value"],
				rows: [
					["Hover or small state", "--duration-normal", "150ms"],
					["Panel movement", "--duration-medium", "200ms"],
					["Page reveal", "--duration-slower", "400ms"],
				],
			},
		},
	];
}

function prototypeInteraction(definition) {
	return [
		overview(definition, "This interaction prototype models a three-step export flow with anchorable states, decision copy, and visible success criteria.", [
			{
				title: "Choose template",
				body: "Start from the artifact type instead of a blank canvas.",
				status: "step 1",
				href: "#section-choose-template",
			},
			{
				title: "Tune payload",
				body: "Edit sections, sources, and interaction options.",
				status: "step 2",
				href: "#section-tune-payload",
			},
			{
				title: "Export",
				body: "Render, validate, and open the generated HTML.",
				status: "step 3",
				href: "#section-export",
			},
		]),
		{
			type: "step",
			heading: "Choose template",
			body: "The first decision narrows layout, print behavior, and expected interaction affordances.",
			diagram: {
				type: "flowchart",
				title: "Template choice",
				nodes: ["Intent", "Template", "Payload"],
			},
		},
		{
			type: "step",
			heading: "Tune payload",
			body: "The payload carries structured sections, cards, tables, code, diagrams, slides, and controls.",
			code: JSON.stringify({ template: "flowchart-diagram", sections: ["overview", "diagram", "notes"] }, null, "\t"),
		},
		{
			type: "step",
			heading: "Export",
			body: "The final state is a single HTML file that can be attached, printed, or reviewed without a dev server.",
		},
	];
}

function svgIllustrations(definition) {
	return [
		overview(definition, "This example proves the template can carry real inline SVG illustration work, not just a note that SVG might exist.", [
			{
				title: "Figure sheet",
				body: "Several reusable primitives are shown in one printable layout.",
				status: "svg",
			},
			{
				title: "Accessible title",
				body: "Each SVG uses role and title text so it has a usable name.",
				status: "a11y",
			},
			{
				title: "Token colors",
				body: "Strokes and fills use the portable VPK CSS variables.",
				status: "theme",
			},
		]),
		{
			type: "figures",
			heading: "Inline SVG figure sheet",
			trustedHtml: trustedHtml([
				'<div class="vpk-figure-sheet">',
				'	<figure>',
				'		<svg viewBox="0 0 240 150" role="img" aria-labelledby="svg-stack-title"><title id="svg-stack-title">Layer stack illustration</title><rect x="35" y="28" width="145" height="42" rx="0"/><rect x="55" y="55" width="145" height="42" rx="0"/><rect x="75" y="82" width="145" height="42" rx="0"/><path d="M48 49h86M68 76h86M88 103h86"/></svg>',
				'		<figcaption>Layer stack</figcaption>',
				'	</figure>',
				'	<figure>',
				'		<svg viewBox="0 0 240 150" role="img" aria-labelledby="svg-agent-title"><title id="svg-agent-title">Agent loop illustration</title><circle cx="70" cy="72" r="30"/><circle cx="170" cy="72" r="30"/><path d="M102 72h35"/><path d="M130 62l12 10-12 10"/><path d="M170 104C132 132 83 119 70 104"/></svg>',
				'		<figcaption>Agent loop</figcaption>',
				'	</figure>',
				'	<figure>',
				'		<svg viewBox="0 0 240 150" role="img" aria-labelledby="svg-chart-title"><title id="svg-chart-title">Small chart illustration</title><path d="M35 118h175"/><path d="M48 118V35"/><rect x="66" y="75" width="24" height="43"/><rect x="108" y="52" width="24" height="66"/><rect x="150" y="34" width="24" height="84"/><path d="M66 68l54-24 54 16" fill="none"/></svg>',
				'		<figcaption>Metric story</figcaption>',
				'	</figure>',
				'</div>',
			]),
		},
		{
			type: "snippet",
			heading: "Portable SVG pattern",
			code: '<svg viewBox="0 0 240 150" role="img" aria-labelledby="title-id">\\n\\t<title id="title-id">Descriptive title</title>\\n\\t<path d="M35 118h175" />\\n</svg>',
		},
	];
}

function flowchartDiagram(definition) {
	return [
		overview(definition, "This flowchart shows the expected diagram payload: named nodes, explicit edges, explanatory notes, and a decision table around the graphic.", [
			{
				title: "Source",
				body: "Collect notes, code references, and constraints before layout begins.",
				status: "input",
			},
			{
				title: "Distill",
				body: "Reduce the material to nodes, edges, labels, and review questions.",
				status: "transform",
			},
			{
				title: "Validate",
				body: "Check that the graphic remains readable in light mode and print.",
				status: "output",
			},
		]),
		{
			type: "diagram",
			heading: "Artifact production flow",
			body: "The same structured data can render as an inline SVG diagram in the single-file artifact.",
			diagram: {
				type: "flowchart",
				title: "Artifact production flow",
				nodes: ["Raw notes", "Payload", "Renderer", "HTML", "Review"],
				edges: [
					["Raw notes", "Payload"],
					["Payload", "Renderer"],
					["Renderer", "HTML"],
					["HTML", "Review"],
				],
			},
		},
		{
			type: "annotations",
			heading: "Node annotations",
			table: {
				headers: ["Node", "Question to answer"],
				rows: [
					["Raw notes", "What source material is trustworthy enough to render?"],
					["Payload", "Which section types represent the material without custom code?"],
					["Renderer", "Does the output stay offline and accessible?"],
					["Review", "Can a reader act without opening the repository?"],
				],
			},
		},
	];
}

function slideDeck() {
	return [
		{
			type: "slides",
			slides: [
				{
					title: "VPK HTML gallery",
					body: "The gallery should prove what each template can produce.",
					items: ["Clickable cards", "White light mode", "Real content"],
				},
				{
					title: "Why examples matter",
					body: "A template catalog without examples is just a route list. The demo should show layout, interaction, and writing posture.",
					items: ["Representative data", "Diagrams where promised", "Validation details"],
				},
				{
					title: "Portable by default",
					body: "Each output embeds CSS, fonts, and small scripts so it can be opened outside the dev server.",
					items: ["No remote assets", "Print support", "Keyboard controls"],
				},
				{
					title: "Design contract",
					body: "The portable token layer follows VPK semantic values: white surfaces, neutral text, brand blue, and ADS-like borders.",
					items: ["#FFFFFF surface", "#292A2E text", "#1868DB brand"],
				},
				{
					title: "Validation",
					body: "The deck itself is part of the test matrix: arrow-key navigation, progress text, print pages, and static checks.",
					items: ["Previous and next controls", "Focusable slides", "No placeholders"],
				},
			],
		},
	];
}

function featureExplainer(definition) {
	return [
		overview(definition, "This explainer documents a fictional feature: offline artifact export for review. It includes the user problem, mechanism, edge cases, and examples.", [
			{
				title: "User problem",
				body: "Reviewers need to inspect generated content without running the VPK app or reconstructing source prompts.",
				status: "why",
			},
			{
				title: "Mechanism",
				body: "A structured payload renders to a standalone HTML file with embedded styles, fonts, and scripts.",
				status: "how",
			},
			{
				title: "Boundary",
				body: "The renderer is not a CMS. It accepts trusted local payloads and escapes ordinary source text.",
				status: "limit",
			},
		]),
		{
			type: "mechanics",
			heading: "How it works",
			steps: [
				{
					title: "Choose a template",
					body: "The template sets the reading pattern: report, deck, diagram, math page, editor, or prototype.",
				},
				{
					title: "Fill structured sections",
					body: "Sections can include cards, steps, code, tables, diagrams, controls, slides, and trusted local HTML.",
				},
				{
					title: "Render and check",
					body: "The static checker verifies shell markers, embedded theme support, and missing placeholder patterns.",
				},
			],
		},
		{
			type: "edge-cases",
			heading: "Edge cases",
			table: {
				headers: ["Case", "Expected behavior"],
				rows: [
					["Remote image", "Reject the payload"],
					["Existing output path", "Refuse overwrite unless explicitly allowed"],
					["Unknown template", "Fail rather than falling back to a generic page"],
				],
			},
		},
	];
}

function conceptExplainer(definition) {
	return [
		overview(definition, "This concept explainer teaches the idea of portable artifacts: a document that carries enough structure, style, and interaction to survive outside the original app.", [
			{
				title: "Artifact",
				body: "A file that can be reviewed, printed, shared, and archived.",
				status: "term",
			},
			{
				title: "Payload",
				body: "The source data that describes sections without hardcoding final HTML.",
				status: "term",
			},
			{
				title: "Renderer",
				body: "The deterministic transform from payload to single-file HTML.",
				status: "term",
			},
		]),
		{
			type: "concept-map",
			heading: "Concept map",
			diagram: {
				type: "tree",
				title: "Portable artifact concept map",
				nodes: ["Source notes", "Payload", "Renderer", "Artifact", "Review"],
				edges: [
					["Source notes", "Payload"],
					["Payload", "Renderer"],
					["Renderer", "Artifact"],
					["Artifact", "Review"],
				],
			},
		},
		{
			type: "example",
			heading: "Concrete example",
			body: "A code review summary becomes a portable artifact when the findings, evidence table, validation commands, and sources are all embedded in one file.",
		},
	];
}

function statusReport(definition) {
	return [
		overview(definition, "This report summarizes the state of a fictional gallery refresh so the template demonstrates real status mechanics instead of generic validation cards.", [
			{
				title: "Scope",
				body: "33 template examples regenerated with content-specific sections.",
				status: "green",
			},
			{
				title: "Validation",
				body: "Static checks pass locally; browser checks focus on clickability and light surfaces.",
				status: "green",
			},
			{
				title: "Risk",
				body: "Future template additions need matching example content and a guard test.",
				status: "yellow",
			},
		]),
		{
			type: "metrics",
			heading: "Status metrics",
			table: {
				headers: ["Metric", "Current", "Target"],
				rows: [
					["Clickable gallery cards", "33", "33"],
					["Templates with rich examples", "33", "33"],
					["Remote runtime assets", "0", "0"],
				],
			},
		},
		{
			type: "next",
			heading: "Next actions",
			items: [
				"Review the five representative outputs visually.",
				"Keep placeholder-content assertions in the test suite.",
				"Use the gallery as a reference when adding a new template.",
			],
		},
	];
}

function incidentReport(definition) {
	return [
		overview(definition, "This incident report shows how to document a UI quality miss: impact, timeline, root cause, and corrective action.", [
			{
				title: "Impact",
				body: "Users could click into examples that looked empty or unrelated to the promised template category.",
				status: "medium",
			},
			{
				title: "Root cause",
				body: "The generator optimized for static validation coverage, not demonstration quality.",
				status: "confirmed",
			},
			{
				title: "Resolution",
				body: "Replace shared placeholder sections with template-specific sample payloads.",
				status: "in progress",
			},
		]),
		{
			type: "timeline",
			heading: "Timeline",
			table: {
				headers: ["Time", "Event", "Action"],
				rows: [
					["T-2h", "Gallery links were added", "Cards became navigable"],
					["T-1h", "Representative pages still looked generic", "User reported missing substance"],
					["Now", "Examples are rebuilt", "Add guard tests and browser verification"],
				],
			},
		},
		{
			type: "followups",
			heading: "Follow-ups",
			steps: [
				{
					title: "Guard against placeholder copy",
					body: "Assert generated examples do not contain the old smoke-test phrases.",
				},
				{
					title: "Check representative demos",
					body: "Open SVG, diagram, design-system, math interactive, and editor pages in light mode.",
				},
			],
		},
	];
}

function editorTriage(definition) {
	return [
		overview(definition, "This editor demo gives the textarea meaningful triage-board data and shows the board shape a user would expect to export.", [
			{
				title: "Needs design review",
				body: "Light-mode gallery spacing and click targets need visual confirmation.",
				status: "review",
			},
			{
				title: "Ready to land",
				body: "Schema change allows local card hrefs and rejects remote card links.",
				status: "ready",
			},
			{
				title: "Blocked",
				body: "Browser evidence must be refreshed after regeneration.",
				status: "blocked",
			},
		]),
		{
			type: "editor",
			heading: "Editable triage payload",
			body: "Edit the JSON, export it, and copy it into an issue or handoff note.",
			cards: [
				{
					title: "Needs design review",
					body: "Confirm gallery surfaces are white and cards are visibly actionable.",
					status: "review",
				},
				{
					title: "Ready to land",
					body: "Renderer tests pass with all template fixtures.",
					status: "ready",
				},
				{
					title: "Blocked",
					body: "No blocker in this demo payload.",
					status: "clear",
				},
			],
		},
	];
}

function editorFlags(definition) {
	return [
		overview(definition, "This editor demonstrates feature-flag data with ownership, rollout state, and export-ready JSON.", [
			{
				title: "html.gallery.links",
				body: "Enables anchor cards in the generated gallery.",
				status: "on",
			},
			{
				title: "html.examples.rich",
				body: "Requires each template to provide a representative demo.",
				status: "on",
			},
			{
				title: "html.remote.assets",
				body: "Remote assets remain rejected for portable artifacts.",
				status: "off",
			},
		]),
		{
			type: "flags",
			heading: "Flag overview",
			trustedHtml: trustedHtml([
				'<div class="vpk-demo-grid">',
				'	<div class="vpk-demo-panel vpk-flag-on"><strong>html.gallery.links</strong><span>on for all examples</span></div>',
				'	<div class="vpk-demo-panel vpk-flag-on"><strong>html.examples.rich</strong><span>on in gallery builds</span></div>',
				'	<div class="vpk-demo-panel vpk-flag-off"><strong>html.remote.assets</strong><span>off by policy</span></div>',
				'</div>',
			]),
		},
		{
			type: "editor",
			heading: "Editable flag payload",
			body: "Use export to validate that the edited flag JSON is still parseable.",
			cards: [
				{
					title: "html.gallery.links",
					body: "true",
					status: "enabled",
				},
				{
					title: "html.examples.rich",
					body: "true",
					status: "enabled",
				},
				{
					title: "html.remote.assets",
					body: "false",
					status: "disabled",
				},
			],
		},
	];
}

function editorPrompt(definition) {
	return [
		overview(definition, "This editor shows a prompt-tuning surface with roles, constraints, and an output preview rather than an empty textarea.", [
			{
				title: "Instruction",
				body: "Render a white light-mode VPK HTML demo using existing token names.",
				status: "system",
			},
			{
				title: "Constraint",
				body: "No remote assets, no unresolved placeholders, and no generated examples without substance.",
				status: "guardrail",
			},
			{
				title: "Preview",
				body: "A reader should understand the template from the rendered page alone.",
				status: "output",
			},
		]),
		{
			type: "editor",
			heading: "Editable prompt payload",
			body: "Tune the prompt JSON and export the result for a rendering run.",
			cards: [
				{
					title: "System",
					body: "Use VPK semantic tokens and light-mode white surfaces.",
					status: "role",
				},
				{
					title: "Developer",
					body: "Prefer structured sections over raw HTML unless a figure needs inline SVG.",
					status: "role",
				},
				{
					title: "User",
					body: "Make the clickable demos show real content.",
					status: "role",
				},
			],
		},
	];
}

function onePager(definition) {
	return [
		overview(definition, "This one-pager proposes a small gallery-quality improvement with enough context for an executive or reviewer to approve the work.", [
			{
				title: "Problem",
				body: "Clickable examples existed, but many pages only proved the renderer could output HTML.",
				status: "why",
			},
			{
				title: "Proposal",
				body: "Make every template demo content-rich and visually representative.",
				status: "what",
			},
			{
				title: "Measure",
				body: "Every output should contain template-specific copy and at least one meaningful primitive.",
				status: "done",
			},
		]),
		{
			type: "decision",
			heading: "Decision request",
			body: "Approve the gallery refresh as part of the skill contract. The examples become living documentation and regression coverage.",
		},
	];
}

function longDoc(definition) {
	return [
		overview(definition, "This long-form document demonstrates a chapter rhythm with sections, tables, diagrams, and source policy notes.", [
			{
				title: "Chapter 1",
				body: "Why portable HTML artifacts help review workflows.",
				status: "context",
			},
			{
				title: "Chapter 2",
				body: "How schemas, templates, and static checks keep output predictable.",
				status: "mechanics",
			},
			{
				title: "Chapter 3",
				body: "How examples should teach the template catalog.",
				status: "practice",
			},
		]),
		{
			type: "chapter",
			heading: "Portable artifacts",
			body: "A portable artifact should be useful after it leaves the app. It needs readable hierarchy, local assets, visible source notes, and enough embedded interaction to demonstrate the idea without a server.",
		},
		{
			type: "chapter",
			heading: "Template evidence",
			body: "A template proves itself by showing the data it expects. Reports should include status data, diagrams should include diagrams, and editor demos should include editable JSON.",
		},
		{
			type: "appendix",
			heading: "Checklist",
			items: [
				"Does the page answer what the template is for?",
				"Does it include representative visual structure?",
				"Can it be understood in light mode and print?",
			],
		},
	];
}

function letter(definition) {
	return [
		overview(definition, "This letter format shows a formal memo style with a date line, recipient, body, and signature block.", [
			{
				title: "Purpose",
				body: "Recommend that the gallery examples become part of the skill acceptance criteria.",
				status: "memo",
			},
			{
				title: "Audience",
				body: "Maintainers reviewing the VPK HTML skill.",
				status: "review",
			},
		]),
		{
			type: "letter",
			heading: "Letter body",
			trustedHtml: trustedHtml([
				'<div class="vpk-letter">',
				'	<p>May 11, 2026</p>',
				'	<p>VPK maintainers</p>',
				'	<p>Please treat generated examples as user-facing documentation, not only as renderer smoke tests. The gallery is the fastest way to understand what /vpk-html can produce, so each link should open a concrete demonstration.</p>',
				'	<p>The updated examples use invented data, visible diagrams, inline SVG, editor JSON, tables, and print-safe sections. They also keep the light-mode surface aligned with VPK tokens.</p>',
				'	<p>Regards,<br>VPK HTML example generator</p>',
				'</div>',
			]),
		},
	];
}

function portfolio(definition) {
	return [
		overview(definition, "This portfolio example presents three fictional case studies so the template demonstrates work samples and outcomes.", [
			{
				title: "Portable HTML gallery",
				body: "Converted a route list into a navigable documentation gallery with representative examples.",
				status: "case study",
			},
			{
				title: "Token alignment",
				body: "Mapped standalone CSS variables back to VPK and ADS semantic values.",
				status: "case study",
			},
			{
				title: "Static validation",
				body: "Added tests that protect against placeholder examples and broken gallery links.",
				status: "case study",
			},
		]),
		{
			type: "case-studies",
			heading: "Case study matrix",
			table: {
				headers: ["Case", "Challenge", "Outcome"],
				rows: [
					["Gallery", "Examples looked empty", "Every card opens a specific demo"],
					["Theme", "Light mode looked warm", "White VPK surfaces"],
					["Quality", "Smoke tests missed substance", "Content guard tests"],
				],
			},
		},
	];
}

function resume(definition) {
	return [
		overview(definition, "This resume example uses structured achievements and capability groups rather than a blank profile shell.", [
			{
				title: "VPK HTML Skill",
				body: "Built portable artifact renderer with schema validation, embedded assets, and tracked examples.",
				status: "project",
			},
			{
				title: "Design Systems",
				body: "Mapped standalone CSS to semantic token values and avoided product-specific palette drift.",
				status: "skill",
			},
			{
				title: "Quality",
				body: "Added tests for templates, gallery links, static checks, and attribution requirements.",
				status: "skill",
			},
		]),
		{
			type: "experience",
			heading: "Experience highlights",
			table: {
				headers: ["Area", "Example"],
				rows: [
					["Frontend", "Rendered accessible single-file HTML from structured payloads"],
					["Design", "Aligned offline theme values with VPK semantic tokens"],
					["Testing", "Guarded generated examples against placeholder regressions"],
				],
			},
		},
	];
}

function equityReport(definition) {
	return [
		overview(definition, "This equity-report demo uses fictional company data to show valuation sections, assumptions, and source notes without making real investment claims.", [
			{
				title: "Base case",
				body: "Revenue grows steadily as template usage expands across internal review workflows.",
				status: "illustrative",
			},
			{
				title: "Upside",
				body: "More artifacts move from ad hoc markdown into validated HTML handoffs.",
				status: "illustrative",
			},
			{
				title: "Downside",
				body: "If examples stay shallow, adoption remains limited to renderer smoke tests.",
				status: "illustrative",
			},
		]),
		{
			type: "valuation",
			heading: "Illustrative scenario table",
			table: {
				headers: ["Scenario", "Adoption", "Quality signal"],
				rows: [
					["Downside", "Low", "Examples are generic"],
					["Base", "Moderate", "Examples demonstrate each template"],
					["Upside", "High", "Examples become reusable project handoffs"],
				],
			},
		},
		sourceSection(),
	];
}

function changelog(definition) {
	return [
		overview(definition, "This changelog demonstrates release-note structure with changes grouped by user impact.", [
			{
				title: "Added",
				body: "Template-specific example payloads for all gallery outputs.",
				status: "feature",
			},
			{
				title: "Changed",
				body: "Gallery cards now link to generated output pages.",
				status: "improvement",
			},
			{
				title: "Fixed",
				body: "Light mode no longer uses the warm paper values that made the page look milky yellow.",
				status: "fix",
			},
		]),
		{
			type: "release",
			heading: "Release details",
			table: {
				headers: ["Type", "Entry", "Validation"],
				rows: [
					["Feature", "Rich examples", "Template test suite"],
					["Fix", "Clickable gallery", "Browser card count"],
					["Fix", "White light mode", "Computed color check"],
				],
			},
		},
	];
}

function mathKnowledge(definition) {
	return [
		overview(definition, "This math page introduces arithmetic sequences with a definition, intuition, worked example, and concept graph.", [
			{
				title: "Definition",
				body: "An arithmetic sequence has a constant difference between consecutive terms.",
				status: "concept",
			},
			{
				title: "Notation",
				body: "Use a_n = a_1 + (n - 1)d, where d is the common difference.",
				status: "formula",
			},
			{
				title: "Check",
				body: "The sequence 3, 7, 11, 15 has common difference 4.",
				status: "example",
			},
		]),
		{
			type: "math",
			heading: "Worked example",
			body: "For a_1 = 3 and d = 4, the fifth term is a_5 = 3 + (5 - 1)4 = 19.",
			table: {
				headers: ["Term", "Value"],
				rows: [
					["a_1", "3"],
					["a_2", "7"],
					["a_3", "11"],
					["a_4", "15"],
					["a_5", "19"],
				],
			},
		},
		{
			type: "concept-map",
			heading: "Prerequisite map",
			diagram: {
				type: "tree",
				title: "Arithmetic sequence prerequisites",
				nodes: ["Number patterns", "Common difference", "Explicit formula", "Term lookup"],
				edges: [
					["Number patterns", "Common difference"],
					["Common difference", "Explicit formula"],
					["Explicit formula", "Term lookup"],
				],
			},
		},
	];
}

function mathProof(definition) {
	return [
		overview(definition, "This proof walkthrough demonstrates a complete claim with assumptions, visual intuition, algebraic transformation, and conclusion.", [
			{
				title: "Claim",
				body: "The sum of the first n odd numbers is n^2.",
				status: "theorem",
			},
			{
				title: "Domain",
				body: "n is a positive integer.",
				status: "assumption",
			},
			{
				title: "Method",
				body: "Use induction and a square-growth intuition.",
				status: "proof",
			},
		]),
		{
			type: "proof",
			heading: "Proof steps",
			steps: [
				{
					title: "Base case",
					body: "For n = 1, the sum is 1, and 1^2 = 1.",
				},
				{
					title: "Inductive assumption",
					body: "Assume 1 + 3 + ... + (2k - 1) = k^2.",
				},
				{
					title: "Add the next odd number",
					body: "The next odd number is 2k + 1, so the next sum is k^2 + 2k + 1.",
					code: "k^2 + 2k + 1 = (k + 1)^2",
				},
				{
					title: "Conclusion",
					body: "The statement holds for k + 1, so it holds for all positive integers n.",
				},
			],
		},
		{
			type: "visual",
			heading: "Square intuition",
			trustedHtml: trustedHtml([
				'<div class="vpk-equation">1 + 3 + 5 + ... + (2n - 1) = n^2</div>',
				'<div class="vpk-mini-grid" aria-label="Square growth diagram"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>',
			]),
		},
	];
}

function mathProcedure(definition) {
	return [
		overview(definition, "This procedure walks through solving a quadratic equation by factoring, including decision points and common mistakes.", [
			{
				title: "Goal",
				body: "Solve x^2 - 5x + 6 = 0.",
				status: "problem",
			},
			{
				title: "Pattern",
				body: "Find two numbers that multiply to 6 and add to -5.",
				status: "strategy",
			},
			{
				title: "Answer",
				body: "x = 2 or x = 3.",
				status: "result",
			},
		]),
		{
			type: "procedure",
			heading: "Procedure",
			steps: [
				{
					title: "Identify coefficients",
					body: "For x^2 - 5x + 6, the product target is 6 and the sum target is -5.",
				},
				{
					title: "Find factor pair",
					body: "-2 and -3 multiply to 6 and add to -5.",
				},
				{
					title: "Rewrite",
					body: "x^2 - 5x + 6 = (x - 2)(x - 3).",
				},
				{
					title: "Use zero product rule",
					body: "Set each factor to zero, so x = 2 or x = 3.",
				},
			],
		},
		{
			type: "mistakes",
			heading: "Common mistakes",
			table: {
				headers: ["Mistake", "Correction"],
				rows: [
					["Using 2 and 3", "Signs must make the middle term -5x"],
					["Stopping at factors", "Solve each factor for x"],
					["Ignoring both roots", "A quadratic can have two solutions"],
				],
			},
		},
	];
}

function mathHandout(definition) {
	return [
		overview(definition, "This handout is print-friendly: definitions, worked examples, practice, and an answer key all fit into a structured learning sheet.", [
			{
				title: "Topic",
				body: "Linear functions and slope.",
				status: "lesson",
			},
			{
				title: "Objective",
				body: "Find slope from two points and interpret it as rate of change.",
				status: "goal",
			},
			{
				title: "Materials",
				body: "Graph paper, pencil, and calculator.",
				status: "prep",
			},
		]),
		{
			type: "practice",
			heading: "Practice set",
			table: {
				headers: ["Problem", "Prompt", "Answer"],
				rows: [
					["1", "Find slope through (1, 2) and (3, 6)", "2"],
					["2", "Find slope through (0, 5) and (4, 5)", "0"],
					["3", "Find slope through (-2, 1) and (2, 9)", "2"],
				],
			},
		},
		{
			type: "notes",
			heading: "Student note",
			body: "Slope is change in y divided by change in x. Keep the point order consistent in numerator and denominator.",
		},
	];
}

function mathConceptMap(definition) {
	return [
		overview(definition, "This concept-map example shows how prerequisite ideas relate before a student reaches linear equations.", [
			{
				title: "Coordinate plane",
				body: "Points provide the raw location data.",
				status: "prerequisite",
			},
			{
				title: "Slope",
				body: "Slope describes the rate of change between points.",
				status: "bridge",
			},
			{
				title: "Linear equation",
				body: "The equation captures the whole line as y = mx + b.",
				status: "target",
			},
		]),
		{
			type: "map",
			heading: "Prerequisite graph",
			diagram: {
				type: "tree",
				title: "Linear equation concept graph",
				nodes: ["Coordinate plane", "Ordered pair", "Slope", "Y-intercept", "Linear equation"],
				edges: [
					["Coordinate plane", "Ordered pair"],
					["Ordered pair", "Slope"],
					["Slope", "Linear equation"],
					["Y-intercept", "Linear equation"],
				],
			},
		},
		{
			type: "relationships",
			heading: "Relationship notes",
			table: {
				headers: ["From", "To", "Relationship"],
				rows: [
					["Ordered pair", "Slope", "Two points determine a rate of change"],
					["Y-intercept", "Linear equation", "b sets where the line crosses the y-axis"],
					["Slope", "Linear equation", "m sets direction and steepness"],
				],
			},
		},
	];
}

function mathInteractive(definition) {
	return [
		overview(definition, "This interactive math demo pairs sliders with an inline SVG slope visualization so the page demonstrates a manipulable concept.", [
			{
				title: "Rise",
				body: "Adjust the vertical change.",
				status: "slider",
			},
			{
				title: "Run",
				body: "Adjust the horizontal change.",
				status: "slider",
			},
			{
				title: "Readout",
				body: "Use the equation panel to connect movement to notation.",
				status: "concept",
			},
		]),
		{
			type: "controls",
			heading: "Slope controls",
			body: "The controls are local range inputs. This demo keeps the math visible even without a runtime framework.",
			controls: [
				{
					label: "Rise",
					value: "4",
					min: -8,
					max: 8,
				},
				{
					label: "Run",
					value: "6",
					min: 1,
					max: 10,
				},
			],
			trustedHtml: trustedHtml([
				'<div class="vpk-slope-demo">',
				'	<svg viewBox="0 0 320 180" role="img" aria-label="Slope triangle demonstration">',
				'		<path d="M40 140H280M40 20V140" />',
				'		<path d="M78 126L246 54" class="vpk-strong-line" />',
				'		<path d="M78 126H246V54Z" class="vpk-fill-soft" />',
				'		<text x="156" y="150">run = 6</text>',
				'		<text x="254" y="92">rise = 4</text>',
				'	</svg>',
				'	<div class="vpk-equation">slope = rise / run = 4 / 6 = 2 / 3</div>',
				'</div>',
			]),
		},
		{
			type: "questions",
			heading: "Check understanding",
			items: [
				"What happens to the line when rise is negative?",
				"Why can run not be zero in this slope model?",
				"Which slider changes steepness more for the same absolute movement?",
			],
		},
	];
}

const builders = {
	"exploration-code-approaches": codeApproaches,
	"exploration-visual-designs": visualDesigns,
	"implementation-plan": implementationPlan,
	"code-review-pr": codeReview,
	"pr-writeup": prWriteup,
	"code-understanding": codeUnderstanding,
	"design-system": designSystem,
	"component-variants": componentVariants,
	"prototype-animation": prototypeAnimation,
	"prototype-interaction": prototypeInteraction,
	"svg-illustrations": svgIllustrations,
	"flowchart-diagram": flowchartDiagram,
	"slide-deck": slideDeck,
	"research-feature-explainer": featureExplainer,
	"research-concept-explainer": conceptExplainer,
	"status-report": statusReport,
	"incident-report": incidentReport,
	"editor-triage-board": editorTriage,
	"editor-feature-flags": editorFlags,
	"editor-prompt-tuner": editorPrompt,
	"one-pager": onePager,
	"long-doc": longDoc,
	letter,
	portfolio,
	resume,
	"equity-report": equityReport,
	changelog,
	"math-knowledge": mathKnowledge,
	"math-proof": mathProof,
	"math-procedure": mathProcedure,
	"math-handout": mathHandout,
	"math-concept-map": mathConceptMap,
	"math-interactive": mathInteractive,
};

function sectionsFor(definition) {
	const builder = builders[definition.id];
	if (!builder) {
		throw new Error(`Missing example builder for template: ${definition.id}`);
	}
	return builder(definition);
}

export function buildExamplePayload(definition) {
	const useAlgebrica = definition.id === "math-knowledge" || definition.id === "math-concept-map";

	return {
		template: definition.id,
		title: `${definition.label} Example`,
		slug: `example-${definition.id}`,
		subtitle: definition.description,
		audience: "VPK developers",
		theme: {
			initialMode: "light",
			allowToggle: true,
		},
		sections: sectionsFor(definition),
		sources: useAlgebrica
			? [
					{
						label: "Algebrica by Antonio Lupetti",
						url: "https://github.com/antoniolupetti/algebrica",
						license: "CC BY-NC 4.0",
						note: "Example page demonstrates visible attribution behavior for Algebrica-derived math learning material.",
					},
				]
			: [],
		assets: [],
		options: {
			print: definition.print,
			interactive: interactiveIds.has(definition.id),
			useAlgebrica,
		},
	};
}

export function buildAllExamplePayloads() {
	return TEMPLATE_DEFINITIONS.map(buildExamplePayload);
}
