---
name: vpk-html
description: 'Use only when the user explicitly invokes /vpk-html. Render supplied material into an offline, single-file HTML artifact by filling a kami-architected template with the vpk-html terminal/blueprint identity.'
---

# vpk-html

Use this skill only when the user explicitly invokes `/vpk-html`. Opening a
Markdown file, asking for HTML in natural language, or mentioning documents is
not enough to activate it.

**Architecture:** kami-style template editing. The skill ships 28 HTML
templates at `assets/templates/`: 8 base document shells plus 20 Phase 2
engineering shells mapped from the `html-effectiveness` use-case catalog. To
produce a document, copy a template into a working directory and fill its
`{{placeholders}}`. The renderer is a validator, not a JSON-to-HTML compiler.

---

## Step 1 · Intent extraction (silent checklist)

Before choosing a template, verify these four dimensions are clear. Do not
ask unless 2+ are missing and cannot be inferred from context.

| Dimension | What to extract | Example |
|---|---|---|
| **Purpose** | Why this document exists | Persuade investor vs. align internal team |
| **Audience** | Who reads it, what they already know | Technical CTO vs. non-technical reviewer |
| **Constraint** | Hard limits on length, format, tone | "One page max", "formal English" |
| **Success** | What outcome counts as success | They approve the budget / they understand the architecture |

If 2+ dimensions are genuinely unclear, ask in a single compact question.
Never ask all four as a checklist.

---

## Step 2 · Pick the document type

| User says | Document | Template |
|---|---|---|
| "one-pager / proposal / exec summary / brief" | One-Pager | `one-pager.html` |
| "white paper / long doc / chapter / report" | Long Doc | `long-doc.html` |
| "formal letter / memo / cover letter" | Letter | `letter.html` |
| "portfolio / case studies / work samples" | Portfolio | `portfolio.html` |
| "resume / CV" | Resume | `resume.html` |
| "slides / deck / keynote" | Slides | `slides.html` |
| "equity report / investment memo / valuation" | Equity Report | `equity-report.html` |
| "release notes / changelog" | Changelog | `changelog.html` |

If unsure, ask a one-liner about the scenario rather than guess.

### Engineering templates (Phase 2)

Use these when the user asks for an engineering workflow surface rather than a
general-purpose document.

| User says | Document | Template |
|---|---|---|
| "technical approach comparison / implementation options" | Exploration · Code Approaches | `exploration-code-approaches.html` |
| "visual directions / UI concept comparison" | Exploration · Visual Designs | `exploration-visual-designs.html` |
| "code review / PR review / review findings" | Code Review · Pull Request | `code-review-pr.html` |
| "explain this code / codebase map / module walkthrough" | Code Understanding | `code-understanding.html` |
| "design system / token contract / component system" | Design System | `design-system.html` |
| "component variants / UI state matrix / component spec" | Component Variants | `component-variants.html` |
| "motion prototype / animation concept" | Prototype · Animation | `prototype-animation.html` |
| "interaction prototype / UI behavior prototype" | Prototype · Interaction | `prototype-interaction.html` |
| "engineering deck / technical slides" | Engineering Slide Deck | `slide-deck.html` |
| "SVG illustration brief / technical illustration" | SVG Illustrations | `svg-illustrations.html` |
| "status report / weekly update / project update" | Status Report | `status-report.html` |
| "incident report / postmortem / outage report" | Incident Report | `incident-report.html` |
| "flowchart / decision flow / process diagram" | Flowchart Diagram | `flowchart-diagram.html` |
| "feature explainer / technical research brief" | Research · Feature Explainer | `research-feature-explainer.html` |
| "concept explainer / technical concept / research note" | Research · Concept Explainer | `research-concept-explainer.html` |
| "implementation plan / engineering plan / rollout plan" | Implementation Plan | `implementation-plan.html` |
| "PR writeup / pull request description / change summary" | Pull Request Writeup | `pr-writeup.html` |
| "triage board / issue board / bug triage" | Editor · Triage Board | `editor-triage-board.html` |
| "feature flag matrix / rollout controls / flag plan" | Editor · Feature Flags | `editor-feature-flags.html` |
| "prompt tuning / prompt eval / AI instruction editor" | Editor · Prompt Tuner | `editor-prompt-tuner.html` |

### Diagrams (primitives, not a separate template type)

When the user asks for **a diagram inside** a long-doc / portfolio /
equity-report, route to `assets/diagrams/` rather than picking a new template:

| User says | Diagram | File |
|---|---|---|
| "architecture / system / components diagram" | Architecture | `assets/diagrams/architecture.html` |
| "flowchart / decision flow" | Flowchart | `assets/diagrams/flowchart.html` |
| "swimlane / cross-team flow" | Swimlane | `assets/diagrams/swimlane.html` |
| "state machine / lifecycle" | State Machine | `assets/diagrams/state-machine.html` |
| "timeline / milestones / roadmap" | Timeline | `assets/diagrams/timeline.html` |
| "tree / hierarchy / org chart" | Tree | `assets/diagrams/tree.html` |
| "layer stack / OSI / tier stack" | Layer Stack | `assets/diagrams/layer-stack.html` |
| "quadrant / 2×2 / priority matrix" | Quadrant | `assets/diagrams/quadrant.html` |
| "venn / overlap / set intersection" | Venn | `assets/diagrams/venn.html` |
| "bar chart / categories" | Bar Chart | `assets/diagrams/bar-chart.html` |
| "line chart / trend / time series" | Line Chart | `assets/diagrams/line-chart.html` |
| "donut / pie / distribution" | Donut Chart | `assets/diagrams/donut-chart.html` |
| "candlestick / OHLC / stock price" | Candlestick | `assets/diagrams/candlestick.html` |
| "waterfall / revenue bridge / decomposition" | Waterfall | `assets/diagrams/waterfall.html` |

Read `references/diagrams.md` before drawing — it has the data-shape decision
tree, the focal rule, and the anti-patterns table. Extract the `<svg>` block
from the diagram file and drop it into a `<figure>` inside long-doc /
portfolio / equity-report.

Before drawing, always ask: **would a well-written paragraph teach the
reader less than this diagram?** If no, don't draw.

---

## Step 3 · Source and material pass

Run this before filling content when the document depends on facts outside
the user's draft. Skip only for personal drafts where the user supplied
everything.

### Source check

Trigger when the document mentions a specific company, product, person,
release date, version, funding round, metric, market fact, or technical
spec.

- Use primary sources before writing: user-provided material, official site,
  filings, press release, repo release
- Keep a short note of sources and dates for facts that drive the document
- If sources conflict or a fact cannot be checked quickly, ask the user
  instead of choosing silently
- Avoid current-sounding claims ("latest", "recent", "new", version numbers,
  launch dates, financial figures) unless they are checked

### Material check

Trigger when the document is about a company, product, project, or personal
brand.

| Need | Required when | Accept |
|---|---|---|
| Logo | Any branded document | User file or official SVG/PNG |
| Product image | Physical product / venue | Official image, user image, or marked gap |
| UI screenshot | App / SaaS / website | Current screenshot, official product image |
| Brand colors | Branded portfolio / one-pager | Official value, extracted asset value, or keep the vpk blueprint semantic accent |

If a required item is missing, use a compact gap table and ask once. Do not
replace missing material with generic imagery, approximate logo drawings, or
invented values.

---

## Step 4 · Distill raw content (if applicable)

**Auto-detect whether to distill.** Do not ask the user; judge from the input:

| Skip distill (fill directly) | Run distill |
|---|---|
| Content has explicit section labels matching template structure | Raw prose without section structure |
| Metrics already quantified | Numbers scattered or implied |
| User said "use this as-is" | Multi-source dump (chat / email / multiple docs) |
| Content count matches template | Content count mismatches template |

When in doubt, run distill. Distill is cheap; rebuilding a misaligned doc is
not.

When distilling raw material:

1. **Extract**: pull every factual claim, number, date, name, source,
   action item
2. **Classify**: map each extract to the template's sections
3. **Gap-check**: list what the template needs but the raw content doesn't
4. **Ask once**: share the gap table; do not guess to fill gaps

---

## Step 5 · Layout note (transparent, non-blocking)

Before filling the template, write a short editor-style note stating the
intent: template choice, narrative arc, embedded diagrams, output. Keep
under 80 words, prose not status panel. Continue immediately after; do not
wait for approval.

Example:

> Layout intent: Equity report on Acme Inc, ~2 pages. Open with thesis and
> price target, run through valuation (DCF + comparables), close on catalysts
> and risks. A revenue line chart and an FY26 waterfall sit mid-doc. Logo is
> in hand; product image absent, so the header stays text-only. Output: HTML.

The note is for transparency, not approval. Adjust on user pushback;
otherwise proceed to Step 6.

---

## Step 6 · Fill the template

1. Copy the template into your working directory: `cp assets/templates/<id>.html <slug>.html`
2. **CSS stays untouched**; only edit the body
3. Content follows `references/writing.md` — data over adjectives, distinctive
   phrasing over industry clichés
4. Avoid patterns listed in `references/anti-patterns.md`: emptiness,
   fabrication, mimicry, excess, source gaps, tone contamination
5. **Before filling, read the quality bar for your document type** in
   `references/writing.md`. Structure is necessary but not sufficient: a
   resume bullet needs Action + Scope + Result + Business Outcome (see
   `references/resume-writing.md`); an equity report needs variant
   perception + quantified catalysts; slides need assertion-evidence titles.

### Do not generate

- Do not leave placeholder text (`{{...}}`, "Lorem ipsum", "[Insert here]",
  "TBD") in the final document
- Do not invent metrics, financial data, or statistics; mark gaps with
  `[DATA NEEDED: description]`
- Do not use stock-image descriptions as image placeholders
- Do not pad content to fill template slots
- Do not write a paragraph that merely restates its own heading

### Fill metadata (`<head>`)

Every template has meta placeholders. Fill all four before saving:

| Placeholder | Rule |
|---|---|
| `{{AUTHOR}}` | Resume/letter/portfolio: the person's name. Others: leave or use env. |
| `{{DESCRIPTION}}` | One sentence (≤150 chars) extracted from the first 2 paragraphs |
| `{{KEYWORDS}}` | 3–5 keywords from the title + section headings, comma-separated |
| `{{DOC_TITLE}}` (or per-template variant) | Infer from the H1 / `.header .title` text |

`<meta name="generator" content="vpk-html">` is fixed; do not change it.

---

## Step 7 · Build & verify

```bash
# Placeholder coverage (catches unfilled {{...}})
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders <slug>.html

# Render in chromium, verify fonts + no console errors
node .agents/skills/vpk-html/scripts/build.mjs --verify <slug>.html

# Static HTML validity
node .agents/skills/vpk-html/scripts/check-html.mjs <slug>.html
```

For template-library changes (color sweeps, font swaps, port-script edits):

```bash
# Kami-style CSS token drift check
node .agents/skills/vpk-html/scripts/build.mjs --sync

# Regenerate styles.css after editing references/tokens.json
node .agents/skills/vpk-html/scripts/build.mjs --write-styles

# CSS / token / font sanity across all templates
node .agents/skills/vpk-html/scripts/build.mjs --check-templates

# Re-port from kami source (idempotent)
node .agents/skills/vpk-html/scripts/port-templates.mjs

# Re-port the diagram primitives library
node .agents/skills/vpk-html/scripts/port-diagrams.mjs

# Re-port kami's curated demos
node .agents/skills/vpk-html/scripts/port-demos.mjs

# Regenerate original Phase 2 shells from the html-effectiveness use-case map
node .agents/skills/vpk-html/scripts/port-html-effectiveness.mjs

# Copy and restyle direct Phase 2 demo ports from assets/html-effectiveness/
node .agents/skills/vpk-html/scripts/rescue-html-effectiveness-demos.mjs
```

---

## Shared Theme Contract

vpk-html follows kami's constraint-system model, but the visual system is VPK's.
Do not hard-code palettes or font faces independently in each demo, diagram, or
template script.

- Keep the visible shared stylesheet at root as `styles.css`, matching Kami's layout.
- Author semantic colors once in `references/tokens.json`.
- Regenerate `styles.css` with `node .agents/skills/vpk-html/scripts/build.mjs --write-styles`.
- Use `scripts/shared.mjs` for generated CSS: `buildFontFaceBlock()`, `readStylesCss()`, `FONT_STACKS`, `KAMI_COLOR_MAP`, or `buildSharedCssBlock()`.
- Run `node .agents/skills/vpk-html/scripts/build.mjs --sync` before and after any token/style edit.
- Individual templates may define layout aliases such as `--brand`, `--paper`, or `--mono`, but those aliases must point back to the shared unprefixed variables.

This keeps every future demo and template on the same colors, dark-mode
fallbacks, font families, and reduced-motion rule without editing one inline
CSS block at a time.

## Identity

Editorial / engineering manual. Tuned to read like a printed reference book
translated to the screen — implementation cousin is
[aiengineeringfromscratch.com](https://aiengineeringfromscratch.com/) (which
itself is built in the [makingsoftware.com](https://www.makingsoftware.com/)
lineage).

**Light mode (default):**

- **Surface:** `--paper` — VPK/ADS semantic surface with an embedded offline fallback.
- **Raised surface:** `--surface-raised` for cards / callouts when they need to lift.
- **Ink:** `--ink` for body text and `--muted-text` / `--subtlest-text` for metadata.
- **Accent (lime):** `--blueprint` — masthead, headings, links, and diagram focal strokes.
- **Margin / figure tags:** `--blueprint` unless a status meaning requires `--success`, `--warning`, or `--danger`.
- **Paper-rule background:** `radial-gradient(var(--paper-rule) 1px, transparent 1px); background-size: 16px 16px;` — subtle dotted paper texture.
- **Hard shadow:** `var(--shadow)` — reserved for opt-in `.card / .callout / .takeaway / .surface-raised / .shadow-hard`. Other surfaces are flat.

**Dark mode** (activate via `<html data-theme="dark">`):

- **Surface / raised / ink / accent:** the same unprefixed aliases switch to dark semantic fallbacks under `[data-theme="dark"]`.

**Fonts** (Geist family only, all self-hosted in `assets/fonts/`):

- **Display / masthead / all headings (h1-h6) / margin labels:** Geist Pixel (Square variant), uppercase, letter-spacing 0.02-0.04em, in `var(--blueprint)`
- **Body:** Geist Sans, 18px screen / 10.5pt print, line-height 1.62
- **Mono / code:** Geist Mono

**Type scale (screen):**

| Role | Size | Family | Color |
|---|---|---|---|
| Cover title / masthead | 56px | Geist Pixel | brand |
| h1 (chapter title) | 36px | Geist Pixel | brand |
| h2 (section) | 26px | Geist Pixel | brand |
| h3 | 18px | Geist Pixel | brand |
| h4-h6 | 14px | Geist Pixel | ink |
| Body, p, li | 18px | Geist Sans | ink |
| Margin label / fig-tag | 10px | Geist Pixel | brand |

**Other identity rules:**

- **Drop cap:** Geist, 48px, 600-weight, on the first paragraph after each section break (works in both modes via `var(--near-black)`)
- **Dotted divider:** `radial-gradient` row of 1px dots, 8px pitch, applied to `<hr>` after the masthead
- **ASCII rule:** apply class `.ascii-rule` to `<hr>` for a bright blueprint dotted separator (two-layer repeating-linear-gradient)
- **Frames:** sections, articles, figures, tables are flat by default. Cards / callouts opt in to hard shadow + 1px ink border.

### Side stripes are banned

Per the impeccable absolute-bans, no `border-left` or `border-right` greater
than 1px as a colored accent on cards, list items, callouts, or alerts.
Use a background tint (`var(--ivory)`), a top/bottom rule, or nothing.

### Two-column spread (`long-doc.html` only)

Use the `.spread` primitive when a diagram is the argument, not decoration:

```html
<div class="spread">
  <div class="spread-prose">
    <h3>Heading</h3>
    <p>Prose that walks the reader through the figure.</p>
  </div>
  <figure class="spread-figure">
    <span class="gutter-tag">FIG_002</span>
    <svg viewBox="0 0 480 320">...</svg>
    <figcaption>FIG_002 · What the reader is looking at.</figcaption>
  </figure>
</div>
```

The prose column is intentionally narrower (~42%) than the figure column
(~58%). On screens narrower than 720px and in print, the spread collapses to
a single column with the figure below.

The full token map and font set live in `references/tokens.json`,
`styles.css`, and `scripts/shared.mjs`. Templates already inline the
resolved theme block — don't redefine it per document.

---

## Reference docs (consult before drafting)

- `references/anti-patterns.md` — 6 AI-output failure modes
- `references/diagrams.md` — diagram selection guide + focal rule
- `references/resume-writing.md` — Action + Scope + Result + Outcome
- `references/writing.md` — general prose rules + quality bars per doc type
- `references/design.md` — visual rules
- `references/production.md` — troubleshooting (page overflow, font issues)
- `references/source-policy.md` — when and how to cite

---

## When not to use this skill

- User wants Material / Fluent / Tailwind default — different visual language
- Need dark / cyberpunk / futurist aesthetic (vpk-html is deliberately
  anti-future, terminal-flavored)
- Need saturated multi-color (vpk-html has one accent)
- Web dynamic app UI (vpk-html is for static documents)
- Output must be PDF or PPTX (vpk-html is HTML-only)
