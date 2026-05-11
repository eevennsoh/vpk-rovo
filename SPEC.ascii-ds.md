# Spec: vpk-html skill

> Local VPK-rovo skill for turning manually supplied material into polished,
> self-contained HTML documents. The skill is invoked only by the exact skill
> name `/vpk-html`. It follows Kami's skill/workflow structure, html-effectiveness'
> broad standalone HTML use-case catalog, Algebrica's mathematical knowledge
> asset model, and the visual direction of AI Engineering from Scratch plus
> Making Software.

## 1. Objective

Build a project-local skill named `vpk-html` under `.agents/skills/vpk-html/`.
It gives agents one disciplined path for rendering loose source material into
single-file HTML artifacts that are:

- explicit: never run unless the user invokes `/vpk-html`
- offline: no remote fonts, stylesheets, scripts, images, or assets in output
- broad: supports all html-effectiveness use cases, Kami's general print/business
  documents, and mathematical knowledge pages inspired by Algebrica
- consistent: every template uses the same editorial/manual visual system
- disposable by default: routine rendered output lands in ignored `docs/html/`
- testable: template, schema, asset, dark-mode, and placeholder checks run with
  local scripts

The primary user is the VPK developer working in this repo. Teammates can also
use the skill through the repo's provider symlink plumbing, but v1 is not a
published external package.

## 2. Non-goals

- No `/ascii-ds` compatibility alias in v1. This draft began as `ascii-ds`; the
  implementation target is `/vpk-html`.
- No natural-language auto-triggering such as "render this as HTML" unless the
  exact `/vpk-html` invocation is present.
- No remote runtime dependencies in generated documents.
- No PDF/PPTX generation pipeline in v1. HTML decks must print cleanly to PDF,
  but the skill does not invoke a PDF or presentation exporter.
- No generic escape-hatch template. Unknown or ambiguous requests must ask one
  clarifying question.
- No localization beyond English in v1.
- No automatic secret scanner. Agents remain responsible for not leaking
  secrets, credentials, or sensitive material into generated output.

## 3. Reference Systems

| Reference | Role in vpk-html | Notes |
| --- | --- | --- |
| [Kami](https://github.com/tw93/kami) / [kami.tw93.fun](https://kami.tw93.fun/) | Skill structure, intent extraction, source/material pass, distill step, reference split, production checks, diagram primitive model | Kami is structural inspiration only, not the visual target. |
| [html-effectiveness](https://github.com/ThariqS/html-effectiveness) / [gallery](https://thariqs.github.io/html-effectiveness/) | Full standalone HTML use-case catalog and proof that single-file artifacts can replace walls of markdown | vpk-html should cover every listed use case immediately. |
| [AI Engineering from Scratch](https://github.com/rohitg00/ai-engineering-from-scratch) / [site](https://aiengineeringfromscratch.com/) | Primary visual tone: manual, textbook, technical, type-led, slightly raw | Use the aesthetic, not remote assets. |
| [Making Software](https://www.makingsoftware.com/) | Editorial rhythm: readable long-form chapters, diagrams as explanation, restrained density | Use as a composition reference. |
| [Algebrica](https://github.com/antoniolupetti/algebrica) / [site](https://algebrica.org/) | Mathematical knowledge assets/content, editable SVGs, conceptual graph style, math-domain inventory | Content is CC BY-NC 4.0 and requires attribution for copied/adapted material. |
| VPK-rovo `app/tailwind-theme.css` and `app/globals.css` | Token discipline and light/dark thinking | Generated HTML must not import app CSS; it owns a portable token layer. |

## 4. Manual Invocation Contract

The skill frontmatter must make exact invocation explicit and avoid broad trigger
phrases that could cause accidental routing.

```yaml
---
name: vpk-html
description: 'Use only when the user explicitly invokes /vpk-html. Render supplied material into an offline, single-file HTML artifact using the VPK HTML editorial system.'
---
```

Rules:

- `/vpk-html` is required in the user's request.
- Optional subcommands are allowed after exact invocation, for example:
  `/vpk-html deck`, `/vpk-html math`, `/vpk-html pr-writeup`.
- If no subcommand is present, the agent routes from the supplied material after
  the exact invocation.
- If the route is ambiguous across templates, ask one focused clarifying
  question.
- Opening or reading a Markdown file is never enough to activate the skill.

## 5. Architecture

### Folder layout

```text
.agents/skills/vpk-html/
├── SKILL.md
├── CHEATSHEET.md
├── references/
│   ├── catalog.md
│   ├── design.md
│   ├── source-policy.md
│   ├── writing.md
│   ├── interactivity.md
│   ├── accessibility.md
│   ├── production.md
│   ├── theme.css
│   └── tokens.json
├── schemas/
│   └── render-payload.schema.mjs
├── templates/
│   ├── html-effectiveness/
│   ├── print/
│   ├── math/
│   └── partials/
├── assets/
│   ├── fonts/
│   ├── algebrica/
│   │   └── MANIFEST.md
│   ├── math/
│   └── diagrams/
├── examples/
│   ├── input/
│   ├── output/
│   └── gallery.html
└── scripts/
    ├── ensure-fonts.mjs
    ├── render.mjs
    ├── check-html.mjs
    ├── build-gallery.mjs
    └── test-templates.test.js

docs/html/
└── .gitkeep
```

Provider skill paths in this worktree already point at `.agents/skills` through
parent symlinks (`.claude/skills`, `.cursor/skills`, `.codex/skills`,
`.rovodev/skills`). v1 should not create per-skill provider symlinks.

### Output ignore policy

Generated output is disposable by default:

```gitignore
docs/html/*
!docs/html/.gitkeep
```

Reusable examples and golden outputs belong inside
`.agents/skills/vpk-html/examples/`, not in `docs/html/`.

## 6. Render Pipeline

The agent invokes the workflow; `scripts/render.mjs` is the normal writer of
final HTML.

1. Confirm exact `/vpk-html` invocation.
2. Run Kami-style intent extraction silently: purpose, audience, constraints,
   success condition.
3. Pick the template or ask one clarifying question if more than one template
   materially fits.
4. Run the source/material pass when needed.
5. Distill raw material when input is unstructured, multi-source, conflicting,
   or mismatched to the template.
6. Produce a structured render payload.
7. Run `scripts/render.mjs` with that payload.
8. Run static validation with `scripts/check-html.mjs`.
9. For template/skill changes, run examples and browser validation.

### Distill policy

Manual `/vpk-html` invocation is the permission boundary. After invocation,
distill is automatic and internal unless it discovers a blocking gap.

Run distill when:

- input is raw notes, chat transcript, log dump, TaskList output, or scattered
  prose
- claims conflict across sources
- numbers, dates, people, or assets are present but not mapped to sections
- template-required material is absent
- source material includes math concepts that need prerequisite ordering

Ask once when:

- purpose or audience cannot be inferred
- the template route is ambiguous
- required fields are missing
- output path conflicts
- a source fact cannot be verified quickly
- an image/asset is referenced but not available

### Render payload

The agent writes structured JSON for the renderer instead of hand-editing final
HTML.

```json
{
	"template": "research-concept-explainer",
	"title": "Consistent Hashing",
	"slug": "consistent-hashing",
	"theme": {
		"initialMode": "system",
		"allowToggle": true
	},
	"sections": [],
	"sources": [],
	"assets": [],
	"options": {
		"print": true,
		"interactive": true
	}
}
```

Rules:

- Validate payloads with `zod` via `schemas/render-payload.schema.mjs`.
- Required schema fields fail hard if absent.
- Optional missing content is omitted unless the agent intentionally writes a
  `[DATA NEEDED: ...]` marker into the payload.
- Final HTML must contain zero `{{PLACEHOLDER}}` tokens.
- Raw HTML from source material is escaped by default.
- Trusted raw HTML is allowed only through explicit schema fields such as
  `trustedHtml`, and only for templates that require it.

## 7. Commands

| Action | Command |
| --- | --- |
| Check/download vendored fonts | `node .agents/skills/vpk-html/scripts/ensure-fonts.mjs` |
| Render a payload | `node .agents/skills/vpk-html/scripts/render.mjs --input <payload.json>` |
| Render with explicit output | `node .agents/skills/vpk-html/scripts/render.mjs --input <payload.json> --out docs/html/<slug>.html` |
| Confirm overwrite after user approval | `node .agents/skills/vpk-html/scripts/render.mjs --input <payload.json> --out docs/html/<slug>.html --overwrite` |
| Validate generated HTML | `node .agents/skills/vpk-html/scripts/check-html.mjs docs/html/<slug>.html` |
| Test templates and schemas | `node --test .agents/skills/vpk-html/scripts/test-templates.test.js` |
| Build example gallery | `node .agents/skills/vpk-html/scripts/build-gallery.mjs` |
| Repo lint | `pnpm run lint` |
| Repo typecheck | `pnpm run typecheck` |

There is no `pnpm run vpk-html` script in v1 unless a later implementation task
explicitly adds one.

## 8. Full Template Catalog

Template file names use clean names, not numbered html-effectiveness filenames.
Each template receives structured payload data and shares the same base shell,
theme, font embedding, source rendering, accessibility helpers, and dark-mode
toggle.

### html-effectiveness catalog

| Category | Template | Inspired by | Interactivity |
| --- | --- | --- | --- |
| Exploration & Planning | `exploration-code-approaches` | Three code approaches | Optional tabs/compare controls |
| Exploration & Planning | `exploration-visual-designs` | Visual design directions | Optional variant switcher |
| Exploration & Planning | `implementation-plan` | Implementation plan | Optional collapsible milestones |
| Code Review & Understanding | `code-review-pr` | Annotated pull request | Jump links, filters optional |
| Code Review & Understanding | `pr-writeup` | PR writeup for reviewers | Static by default |
| Code Review & Understanding | `code-understanding` | Module map | Optional highlighted path |
| Design | `design-system` | Living design system | Copyable token swatches optional |
| Design | `component-variants` | Component variants | State filters optional |
| Prototyping | `prototype-animation` | Animation sandbox | Inline JS sliders required |
| Prototyping | `prototype-interaction` | Clickable flow | Inline JS navigation required |
| Illustrations & Diagrams | `svg-illustrations` | SVG figure sheet | Copy/select optional |
| Illustrations & Diagrams | `flowchart-diagram` | Annotated flowchart | Step details optional |
| Decks | `slide-deck` | Arrow-key slide deck | Inline JS keyboard navigation required |
| Research & Learning | `research-feature-explainer` | How a feature works | Collapsible sections/tabs optional |
| Research & Learning | `research-concept-explainer` | Concept explainer | Optional interactive diagram |
| Reports | `status-report` | Weekly status | Static by default |
| Reports | `incident-report` | Incident timeline | Timeline navigation optional |
| Custom Editors | `editor-triage-board` | Ticket triage board | Inline JS drag/drop or keyboard reorder |
| Custom Editors | `editor-feature-flags` | Feature flag editor | Inline JS toggles and dependency warnings |
| Custom Editors | `editor-prompt-tuner` | Prompt tuner | Inline JS live preview required |

### Kami print/business catalog

| Template | Use case | Notes |
| --- | --- | --- |
| `one-pager` | Executive summary, proposal, compact briefing | Print-friendly one page target, but not forced if content requires more. |
| `long-doc` | White paper, technical report, chapter, essay | Long-form editorial rhythm. |
| `letter` | Formal letter, memo, recommendation, resignation | Print-first, semantic address/date/signature regions. |
| `portfolio` | Case studies, project portfolio, personal/company work samples | Allows embedded figures and screenshots. |
| `resume` | Resume/CV | Data-first bullets; no fabricated metrics. |
| `equity-report` | Investment memo, stock analysis, valuation note | Requires source checks for financial/current facts. |
| `changelog` | Styled changelog, release notes document | Distinct from GitHub release publishing. |
| `slide-deck` | Presentation/deck | Shared with html-effectiveness deck; must support print-to-PDF. |

### Diagram primitives

Diagrams are reusable primitives, not separate full document types unless the
user explicitly asks for a figure sheet. Follow Kami's diagram selection model,
but render in the vpk-html visual system.

| Primitive | Use when |
| --- | --- |
| `architecture` | Components, services, system boundaries |
| `flowchart` | Decisions, branching processes |
| `quadrant` | 2x2 positioning or prioritization |
| `bar-chart` | Category comparison |
| `line-chart` | Trends over time |
| `donut-chart` | Small proportional breakdowns |
| `state-machine` | Lifecycle states and transitions |
| `timeline` | Milestones, incidents, roadmap |
| `swimlane` | Cross-role or cross-team flows |
| `tree` | Hierarchies, taxonomies, org structures |
| `layer-stack` | Layered systems and stack diagrams |
| `venn` | Set overlap |
| `candlestick` | OHLC/price movement |
| `waterfall` | Bridge/decomposition from start to end value |

### Math knowledge catalog

Math support is both a dedicated family and a reusable capability across
explainers, diagrams, decks, and long docs.

| Template | Use case | Required capabilities |
| --- | --- | --- |
| `math-knowledge` | Concept page or topic explainer | Definitions, intuition, examples, notation, prerequisites |
| `math-proof` | Proof walkthrough | Step labels, assumptions, transformations, conclusion |
| `math-procedure` | Worked method or algorithm | Ordered steps, common mistakes, decision points |
| `math-handout` | Print-friendly learning sheet | Exercises, answers, compact notation |
| `math-concept-map` | Prerequisite graph or relationship map | Inline SVG graph, inferred relationships labeled when inferred |
| `math-interactive` | Manipulable concept demo | Inline SVG plus inline JS when useful |

Algebrica source domains to vendor and expose through the math family:

- `algebraic-structures`
- `complex-numbers`
- `equations`
- `integrals`
- `limits`
- `linear-systems`
- `polynomials`
- `powers-radicals-logarithms`
- `sets-and-numbers`
- `trigonometry`
- `vectors-and-matrices`

## 9. Visual System

The visual system is fixed for v1:

- AI Engineering from Scratch provides the manual/textbook tone.
- Making Software provides the long-form editorial rhythm.
- VPK-rovo token discipline informs naming and light/dark consistency.
- Kami's parchment/ink system is not the visual source of truth.

### Font stack

Store WOFF2 files under `.agents/skills/vpk-html/assets/fonts/` and embed them
as data URIs in generated HTML:

- display: `VT323`
- body: `Source Serif 4`
- mono: `JetBrains Mono`

System fallbacks are required in CSS, but the rendered artifact must work
offline with the embedded fonts.

### Token model

Author tokens once in:

- `references/tokens.json` for scripts/tests
- `references/theme.css` for template partials

Generated HTML embeds the resolved CSS token block. Templates must not each own
hand-edited copies of theme values.

Required token groups:

- paper/background
- ink/text
- muted text
- blueprint accent
- rule/border
- raised surfaces
- hard offset shadows
- focus ring
- code surface
- math highlight
- success/warning/danger/info semantic accents
- light and dark variants

### Dark mode

Generated HTML must:

- initialize from `prefers-color-scheme`
- provide a visible theme toggle
- persist user override in `localStorage`
- include `color-scheme: light dark`
- keep contrast valid in both modes
- respect `prefers-reduced-motion`

Theme persistence is the only default localStorage use. Custom editors remain
in-memory unless the user explicitly asks for persistence.

## 10. Assets

### Fonts

`scripts/ensure-fonts.mjs` checks/downloads font files into
`assets/fonts/`, validates size/non-empty content, and records source/license
metadata. Generated HTML embeds the fonts and must not link to Google Fonts or
any remote font host.

### Images

- Local bitmap images are embedded only when explicitly listed in the render
  payload's `assets`.
- The renderer never scans prose and silently embeds image paths.
- Remote image URLs are not allowed in final HTML.
- If an image is needed but unavailable, the agent writes
  `[IMAGE NEEDED: ...]` or asks once if the missing image is required.
- Meaningful images need alt text.

### Algebrica

Copied Algebrica material lives under `assets/algebrica/` in upstream-like
structure, with `assets/algebrica/MANIFEST.md` recording:

- source repository URL
- copied folders/files
- retrieval date
- license
- required attribution text
- any modifications

Derived or normalized math primitives can live under `assets/math/`.

Because Algebrica is CC BY-NC 4.0, generated documents that copy or adapt its
content/assets must render a visible Sources/Credits section or equivalent
visible attribution. The repo may also keep attribution comments, but comments
alone are not enough for copied Algebrica material.

### Inline SVG

Prefer inline SVG for diagrams, math illustrations, flowcharts, and figure
sheets. Inline SVG must:

- be keyboard/focus safe if interactive
- include accessible names where meaningful
- avoid hardcoded pixel dimensions that break responsive layout
- use currentColor or vpk-html CSS tokens where practical

## 11. Interactivity

Inline JavaScript is allowed when a template needs interaction. Final HTML must
still be a single offline file.

Rules:

- No remote script imports.
- Prefer small hand-written inline JS for simple interactions.
- Local dependencies may be bundled into inline JS by the render script when a
  template genuinely needs them.
- Decks support keyboard navigation.
- Editors support keyboard operation, copy/export, and JSON import/export where
  relevant.
- Editors do not use localStorage by default.
- Interactive math can use inline SVG and small inline JS.
- Static math should be pre-rendered with local KaTeX at generation time rather
  than shipping a live LaTeX compiler into every document.

## 12. Source Policy

Follow Kami's source/material pass:

- If the user supplies complete material and asks only to render it, transform
  only that material.
- If the document depends on current facts, product/company/person/version
  details, market/financial data, release dates, or "latest/recent/new" claims,
  verify against primary sources before rendering.
- If browsing/research is used, render a visible Sources section.
- If third-party material is copied/adapted, render a visible Sources/Credits
  section when required by license.
- For mathematical pages, use supplied material and vendored Algebrica material
  first. If the agent introduces external math references beyond Algebrica, add
  those sources.
- If sources conflict or cannot be checked quickly, ask instead of choosing
  silently.

Generated metadata comments may include:

- template name
- vpk-html version
- render timestamp
- source labels or basenames

Generated metadata comments must not include absolute source file paths by
default.

## 13. Output Policy

- Default output path: `docs/html/<slug>.html`.
- If the user provides an output path, use it.
- If the output file already exists, the renderer fails without `--overwrite`.
- The agent asks for confirmation before rerunning with `--overwrite`.
- One HTML file is produced per invocation by default.
- Batch mode is allowed only when the user explicitly asks for multiple docs.
- Batch mode writes separate files.
- Generated output is ignored by default.

Slug rules:

- lower-case
- kebab-case
- derived from title unless user supplies an output path
- no path traversal
- no spaces

## 14. Accessibility and Responsive Requirements

All templates must satisfy:

- semantic landmarks (`main`, `nav`, `section`, `article`, `aside`) as
  appropriate
- logical heading order
- visible focus states in light and dark modes
- keyboard access for all meaningful controls
- alt text or accessible names for meaningful images/SVGs
- decorative assets marked appropriately
- contrast-safe tokens in light and dark modes
- `prefers-reduced-motion` handling
- no text overflow in normal desktop/mobile widths
- responsive layout down to mobile width
- print styles that do not leave unusable clipped content

Interactive templates must work without mouse input for all meaningful actions.

## 15. Print Requirements

All templates include global print styles. Print/business templates, decks,
reports, letters, resumes, handouts, and math documents also include
template-specific page-break rules.

Decks are browser-first HTML decks with:

- arrow-key navigation
- visible slide progress
- direct print styles where each slide prints as one page when possible
- no PDF/PPTX exporter in v1

## 16. Validation and Testing

### Static validation

`scripts/check-html.mjs` must verify generated HTML:

- no `{{...}}` placeholders
- no remote `http://` or `https://` assets/scripts/styles/fonts/images
- fonts embedded as data URIs
- CSS is inline
- allowed inline JS only
- dark-mode token block exists
- theme toggle exists when `allowToggle` is true
- no absolute source paths in metadata comments by default
- required attribution rendered when Algebrica material is used
- required accessibility attributes present for images/SVGs/controls

### Template tests

`node --test .agents/skills/vpk-html/scripts/test-templates.test.js` must cover:

- every template is discoverable in the catalog
- every template has an example input fixture
- every template can render a golden/example output
- schema rejects missing required fields
- schema rejects remote assets
- overwrite behavior fails without `--overwrite`
- dark-mode shell is present in every rendered output
- generated examples contain no placeholders
- Algebrica attribution appears when Algebrica fixtures are used

### Browser validation

Required when changing the skill, templates, theme, scripts, or assets:

- render all examples
- open gallery or representative examples with `/agent-browser`
- verify light/dark toggle
- verify desktop/mobile layout on high-risk templates
- verify keyboard navigation for decks/editors/math interactives

Routine user renders only require static validation unless the user asks for
visual QA.

### Repo validation

Before implementation handoff:

```bash
node --test .agents/skills/vpk-html/scripts/test-templates.test.js
pnpm run lint
pnpm run typecheck
```

If repo-wide lint/typecheck has unrelated baseline failures, report them and run
targeted validation for changed JS files.

## 17. Implementation Boundaries

### Always do

- Require exact `/vpk-html` invocation.
- Use the structured render payload and renderer for final HTML.
- Keep generated output offline.
- Use clean template names.
- Keep `SKILL.md` short and operational.
- Put catalog, source, visual, production, accessibility, and interactivity
  details in `references/`.
- Keep `CHEATSHEET.md` as the compact routing table.
- Keep examples and golden outputs inside the skill.
- Render visible sources/credits when external research, copied third-party
  material, or Algebrica-derived material is used.
- Ask before overwrite.
- Escape raw HTML by default.

### Ask first

- Changing the visual system away from AI Engineering from Scratch plus Making
  Software.
- Publishing the skill as an external package.
- Adding a PDF/PPTX export pipeline.
- Adding new remote runtime dependencies.
- Using localStorage for editor data persistence.
- Adding `/ascii-ds` compatibility.
- Removing any template family from the v1 catalog.

### Never do

- Auto-trigger on generic HTML/document wording.
- Leave remote asset imports in final HTML.
- Leave placeholders in final HTML.
- Invent metrics, dates, stats, citations, or math claims.
- Embed secrets, `.env*` contents, credentials, or private tokens.
- Leave external image URLs in final HTML.
- Use a generic fallback template for unknown requests.
- Write final `docs/html/*.html` manually in normal operation.

## 18. Success Criteria

V1 is complete when:

1. `/vpk-html` exists at `.agents/skills/vpk-html/SKILL.md` and the frontmatter
   makes exact manual invocation mandatory.
2. The full catalog above is implemented with addressable templates.
3. Every template has sample input and sample output under
   `.agents/skills/vpk-html/examples/`.
4. `docs/html/` exists with `.gitkeep` and generated HTML is ignored.
5. Fonts are stored in `assets/fonts/` and embedded into generated HTML.
6. Algebrica assets/content used by the skill are vendored with a manifest and
   attribution handling.
7. `scripts/render.mjs` writes final HTML from structured payloads and refuses
   overwrite without `--overwrite`.
8. Generated HTML opens offline with no remote requests.
9. Light/dark auto-switch and toggle work in generated examples.
10. Interactive templates work by keyboard where meaningful.
11. Print styles exist for decks, print docs, reports, and math handouts.
12. Static checks pass for every example output.
13. Browser validation passes for the examples gallery in light and dark mode.
14. `node --test .agents/skills/vpk-html/scripts/test-templates.test.js`
    passes.
15. `pnpm run lint` and `pnpm run typecheck` pass or any unrelated baseline
    failures are clearly reported with targeted changed-file validation.

## 19. Deferred Ideas

- External skill package publishing.
- Multi-language template families.
- PDF/PPTX export pipeline.
- Persistent editor documents.
- Screenshot-based visual regression suite.
- More math interactivity beyond the initial Algebrica-inspired family.

## 20. Open Questions

None blocking. The interview decisions above are the implementation contract for
v1.
