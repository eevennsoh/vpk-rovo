# vpk-html

<!-- vpk-html-catalog-counts: templates=33 diagrams=61 demos=105 -->

> Render structured material into offline, single-file HTML documents with the
> vpk-html Algebrica editorial identity. **[See the index →](index.html)**

vpk-html is a static-document skill used inside the VPK monorepo. It is
built on [kami's](https://github.com/tw93/Kami) template-edit architecture: the
LLM copies an HTML template, fills `{{placeholders}}` with real content, and
ships a single self-contained HTML file. Visual identity, fonts, and layout
stay locked across all documents.

## Identity

- **Display/body font:** Geist for mastheads, slide titles, prose, labels, body copy, tables, and ordinary document text.
- **Mono font:** Geist Mono for code, metrics, dates, counters, figure/table numbers, chart labels, and technical identifiers.
- **Numeric face:** Geist Mono Numeric uses `unicode-range: U+0030-0039` so digits inside Geist text render in Geist Mono.
- **Surface:** warm `--paper` on a plain `--paper-background` canvas.
- **Chrome:** grayscale ink `--accent`, with warm gray `--accent-soft` washes for pill controls, selection, focus, and key-insight emphasis.
- **Prose:** long-form sections use Geist 17px / 23px, justified and hyphenated with margin paragraph numbers available for report-style templates.
- **Tables/components:** Algebrica-style 12px collapsed-border tables, 12px-radius bordered list-table cards, 22px vote chips, 34px grayscale pill buttons, tinted mono code cards, and warm `--heat0` → `--heat4` intensity dots.
- **Figures:** `--focal` plus the sampled grayscale `--ill-*` ramp; diagrams and illustrations distinguish series by tone, dash, and marker, never hue.
- **Links:** no visible default underline; content links animate a 4px-offset underline in on hover/focus, while chrome links never underline.
- **Status:** muted `--success`, `--warning`, `--danger`, and `--info` only for meaning-bearing states.
- **Canvas:** flat document surfaces with hairline rules and borders over shadows.

The look is deliberately *Algebrica editorial*: warm paper, near-monochrome ink,
quiet borders, Geist typography, and grayscale technical figures. It is compact,
readable, and unambiguous while leaving enough structure for strategy decks,
status readouts, and implementation briefs.

## What you get

- **33 document templates** at `assets/templates/`: 13 general document shells
  plus 20 Phase 2 engineering templates patterned after the
  [ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness)
  use-case catalog. Each is a complete standalone HTML file with inline CSS
  and fonts.
- **61 SVG diagram/chart primitives** at `assets/diagrams/` — architecture,
  flowchart, swimlane, tree, distribution charts, comparison charts,
  time-series charts, intensity charts, hierarchy charts, and relationship
  diagrams. Extract the `<svg>` block and embed inside any long-form template.
- **5 technical illustration exemplars** at `assets/illustrations/` —
  isometric, exploded, annotated, cross-section, and pipeline SVGs built for
  remixing inside technical docs.
- **105 HTML demos** at `assets/demos/`: filled document showcases, Phase 2
  `html-effectiveness` ports, diagram previews, technical illustration previews,
  and vpk-native examples.
- **A reference-manual homepage** at [`index.html`](index.html).
- **A frozen evaluation corpus** at `evals/evals.json` for matched first-attempt
  comparisons across seven recurring reader jobs.
- **LLM-facing reference docs** for writing, anti-patterns, diagrams,
  illustrations, charts, SVG grammar, presentation mode, video export with a
  worked example at `assets/video/landing-demo-separation/`, PDF export,
  quality gates, GitHub Pages publishing, and production troubleshooting.

## Quick start

```bash
# 1. Pick a template and create one folder for this generated artifact
mkdir -p artifacts/vpk-html/my-doc
cp .agents/skills/vpk-html/assets/templates/one-pager.html artifacts/vpk-html/my-doc/my-doc.html

# 2. Open my-doc.html and replace every {{placeholder}} with real content.
#    CSS stays untouched — only edit the body.

# 3. Validate
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders artifacts/vpk-html/my-doc/my-doc.html
node .agents/skills/vpk-html/scripts/build.mjs --verify artifacts/vpk-html/my-doc/my-doc.html
```

Generated user artifacts are grouped per slug under `artifacts/vpk-html/<slug>/`.
Keep the HTML source at `artifacts/vpk-html/<slug>/<slug>.html`, with optional
PDFs, screenshots, and validation captures inside the same slug folder.

## Invoking the skill

In Cursor / Claude Code, prefix your message with `/vpk-html`. Optional
doc-type hints and flags can follow: `/vpk-html resume`,
`/vpk-html one-pager`, `/vpk-html --github`.

Use `/vpk-html --github` when the final artifact should be live on GitHub
Pages. The publish helper validates the document, copies it to `index.html`,
creates or reuses a GitHub repo, pushes `main`, enables Pages from `/`, and
prints the public URL.

See [`CHEATSHEET.md`](CHEATSHEET.md) for the route table that maps user intent
to template file.

## Commands

```bash
node scripts/build.mjs                            # check every template
node scripts/build.mjs --check-placeholders <file>
node scripts/build.mjs --check-templates          # CSS / token / font sanity
node scripts/build.mjs --check-evals              # frozen scenarios + catalog snapshot
node scripts/build.mjs --verify <file>            # Playwright render + load check

node scripts/check-html.mjs <file>                # static HTML validity
node scripts/ensure-fonts.mjs                     # fetch fonts to assets/fonts/

node scripts/build.mjs --pdf <file> [--out <f.pdf>]  # optional derived PDF (Chromium, Node-only)
node scripts/build.mjs --landing <file> [--out <dir>] [--origin <url>]  # landing companions + responsive verify
node scripts/build.mjs --github <file> [--repo owner/name] [--public|--private]  # publish to GitHub Pages
node scripts/build.mjs --check-density|--check-resume-balance|--check-rhythm|--check-orphans|--check-focal|--check-motion-budget|--check-caption-echo <file> [--strict]

node scripts/port-kami.mjs [--templates|--diagrams|--demos]  # re-port templates + diagrams + curated demos from kami
node scripts/retrofit.mjs                        # idempotently refresh committed HTML with shared CSS + presentation/docnav
node scripts/port-engineering.mjs                 # regenerate Phase 2 engineering templates
node scripts/build-demos.mjs [--curated|--landing]  # regenerate curated demos + landing mock previews
node scripts/port-engineering-demos.mjs           # copy + restyle direct Phase 2 upstream demo ports
node scripts/build-illustrations.mjs              # regenerate technical illustration exemplars + gallery demos
node scripts/build-video-demos.mjs                # regenerate the Video catalog demos (embeds rendered MP4s)
node scripts/landing.mjs                          # regenerate assets/landing/ shells
node scripts/build-index.mjs                      # regenerate the local Algebrica-style catalog index
```

## Directory map

| Path | Purpose |
|---|---|
| `SKILL.md` | Agent-facing skill manifest (workflow + rules) |
| `CHEATSHEET.md` | Route table: user intent → template file |
| `README.md` | This file |
| `index.html` | Local Algebrica-style demo catalog |
| `LICENSE`, `llms.txt`, `.gitignore`, `.claude-plugin/` | Top-level metadata |
| `assets/templates/` | 33 offline HTML templates: 13 general document shells + 20 Phase 2 engineering shells |
| `assets/diagrams/` | 61 standalone SVG diagram/chart primitives |
| `assets/illustrations/` | 5 technical illustration exemplars for remixing |
| `assets/html-effectiveness/` | Snapshot of the 20 upstream html-effectiveness HTML demos plus index |
| `assets/demos/` | 105 demo HTML outputs plus the embedded media needed by individual demos |
| `evals/evals.json` | Frozen prompts, reader jobs, expectations, viewports, and human rubrics |
| `assets/fonts/` | Geist and Geist Mono (inlined as base64 at port time, with a numeric Geist Mono face) |
| `artifacts/vpk-html/<slug>/` | Ignored per-artifact folders for generated user HTML, PDFs, screenshots, and review captures |
| `styles.css` | Shared root stylesheet, matching Kami's top-level CSS contract |
| `references/` | Anti-patterns, diagrams, illustrations, SVG style, presentation, evaluation, video-export (worked example: `assets/video/landing-demo-separation/`), resume-writing, writing, design, GitHub Pages publishing, production, source-policy, accessibility, tokens.json |
| `scripts/` | build (validator), check-html, shared helpers, presentation, retrofit, port-*.mjs, build-demos, build-illustrations, build-index, landing, gates, pdf, ensure-fonts |

## Rules of the road

- **No remote assets.** Every filled document is self-contained — local fonts
  are inlined as base64 data URIs at port time. Move a filled file anywhere
  and it still renders identically.
- **CSS stays untouched.** Templates ship with their CSS locked. Only the
  body content changes per document.
- **Theme stays shared.** Author semantic colors in `references/tokens.json`,
  mirror them to root `styles.css`, and import `scripts/shared.mjs` from
  generators instead of hard-coding palette or font blocks per demo.
- **Motion stays shared.** Templates opt into `data-vpk-motion`; the shared CSS
  owns entrance, document reveal, micro-interaction, reduced-motion, and print
  neutralizer behavior.
- **Presentation is screen-only.** Deck runtime and speaker notes are injected by
  `scripts/presentation.mjs`; print/PDF geometry stays unchanged.
- **Fill every placeholder.** Run `build.mjs --check-placeholders` before
  shipping. Unfilled `{{...}}` slots fail the check.
- **Visible sources.** When external research or copied material is used,
  the document must include a visible "Sources and Credits" section.
- **One template, one document.** Don't compose multiple templates into one
  file; pick the closest fit and adapt.

## How vpk-html relates to kami

vpk-html adopted kami's template-edit architecture (Phase 1, May 2026). Phase
2 adds original engineering-focused shells mapped from the
`html-effectiveness` use cases into the same offline template-edit workflow.
The visual identity diverges; the workflow does not.

| | vpk-html | kami |
|---|---|---|
| Surface | Warm editorial paper via `--paper` | Warm parchment |
| Accent | No hue accent; grayscale ink chrome and grayscale figures | Historical kami deep-ink accent `#1B365D` |
| Display | Geist | Charter / TsangerJinKai02 (serif) |
| Body | Geist with Geist Mono numerals | Charter / TsangerJinKai02 |
| Render pipeline | Template edit (kami-style) | Template edit |
| Build toolchain | Node ESM | Python (WeasyPrint, python-pptx) |
| Output | Single offline HTML | HTML + PDF + optional PPTX + PNG |
| Templates | 33 (13 general shells + 20 original Phase 2 engineering shells) | 8 |
| Diagrams and charts | 61 SVG primitives | 14 SVG primitives |
| Technical illustrations | 5 vpk-native exemplars | N/A |
| Languages | EN | CN primary, EN, JA best-effort |

vpk-html's theme source of truth is `references/tokens.json` -> root
`styles.css`, with helpers in `scripts/shared.mjs`, matching Kami's
`styles.css` + `references/tokens.json` + `scripts/shared.py` shape. After
token edits, run `node .agents/skills/vpk-html/scripts/build.mjs --write-styles`,
then `node .agents/skills/vpk-html/scripts/build.mjs --sync`.

## Phase 2 engineering templates

The Phase 2 template generator maps the 20 engineering document patterns from
[ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness)
into vpk-html shells for approach exploration, code review, code
understanding, design-system specs, component variants, prototypes, status and
incident reports, research explainers, implementation plans, PR writeups, and
editor-style triage/flag/prompt worksheets.

The Phase 2 demo generator copies the upstream HTML examples from
`assets/html-effectiveness/` into the local `assets/demos/demo-*.html` paths,
applies the vpk-html visual shell, and groups them on the homepage using the
same category rhythm as `html-effectiveness`: Exploration & Planning, Code
Review & Understanding, Design, Prototyping, Illustrations & Diagrams, Decks,
Research & Learning, Reports, and Custom Editing Interfaces.

The Phase 2 templates remain original vpk-html template shells. The Phase 2
demos preserve upstream structure, JavaScript, and sample content, then add the
local vpk-html overlay: embedded Geist and Geist Mono font
declarations, warm paper/ink tokens, source comments, shared motion,
presentation/docnav runtime where applicable, and accessibility landmarks where the upstream page
omitted them.

## Motion, Presentation, Illustrations, Video

- Motion tokens and shared CSS live in `references/tokens.json`,
  `scripts/shared.mjs`, and `styles.css`. Run `--write-styles`, `retrofit.mjs`,
  and `--check-templates` after changes.
- Decks use `scripts/presentation.mjs` for Left/Right slide navigation,
  `#slide-N` deep links, hidden speaker notes, and a synced presenter window.
  See `references/presentation.md`.
- Technical illustrations use `assets/illustrations/` plus
  `references/illustrations.md` and `references/svg-style.md`. Ordinary
  diagrams keep one darkest-ink focal element; illustrations use the grayscale
  `--ill-*` figure ramp.
- Charts use `references/charts.md` for the shared animation classes,
  progressive tooltip/legend pattern, and 30-chart catalog.
- MP4 export is intentionally a Hyperframes re-authoring contract, not the deck
  runtime. See `references/video-export.md` and the worked example at
  `assets/video/landing-demo-separation/`.

## License

Inherits the VPK monorepo license. The 8 base HTML templates and the
original 14 diagram primitives in `assets/templates/` and `assets/diagrams/`
are ported from [tw93/kami](https://github.com/tw93/Kami) (MIT) and re-skinned
with vpk-html's visual identity; the layout structure and SVG geometry are
kami's work. The 20 Phase 2 engineering templates and 25 Phase E chart
additions are original vpk-html shells/primitives based on the local
effectiveness and chart-catalog work.

## Acknowledgements

- Kami by [@tw93](https://github.com/tw93) — template architecture, diagram
  primitives, demo curation, and the broader idea of constraint-based document
  design systems for AI agents.
- html-effectiveness by [@ThariqS](https://github.com/ThariqS) — engineering
  document use-case catalog that informed the Phase 2 template set.
- Geist and Geist Mono font assets are committed locally for the offline artifact contract.
