# vpk-html

> Render structured material into offline, single-file HTML documents with the
> vpk-html terminal/blueprint identity. **[See the index →](index.html)**

vpk-html is a static-document skill used inside the VPK-Rovo monorepo. It is
built on [kami's](https://github.com/tw93/Kami) template-edit architecture: the
LLM copies an HTML template, fills `{{placeholders}}` with real content, and
ships a single self-contained HTML file. Visual identity, fonts, and layout
stay locked across all documents.

## Identity

- **Display font:** Geist Pixel (Square variant) for masthead / cover headlines.
- **Body font:** Geist Sans for prose.
- **Mono font:** Geist Mono for labels, code, eyebrows, figure tags.
- **Surface:** warm off-white paper `#FBFBFB` (never pure white).
- **Accent:** electric blue `#1B3FE5` — the only chromatic accent, capped at ~5% per page.
- **Warning accent:** warm red `#D14E3E`, reserved for figure-tag margin labels.
- **No section chrome:** no borders, no shadows, no rounded corners, no grid background.

The look is deliberately *terminal × engineering notebook*. Not warm and
editorial (that's kami). Not playful and saturated. Compact, readable, and
unambiguous.

## What you get

- **28 document templates** at `assets/templates/`: 8 base document shells
  plus 20 Phase 2 engineering templates patterned after the
  [ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness)
  use-case catalog. Each is a complete standalone HTML file with inline CSS
  and fonts.
- **14 SVG diagram primitives** at `assets/diagrams/` — architecture, flowchart,
  swimlane, tree, waterfall, candlestick, and friends. Extract the `<svg>` block
  and embed inside any long-form template.
- **28 demos** at `assets/demos/`:
  - 8 screenshot-backed showcases: 4 ported from kami and 4 vpk-native.
  - 20 Phase 2 ports from `html-effectiveness`, grouped first on the homepage
    like the upstream demo index and restyled with the vpk-html visual shell.
- **A reference-manual homepage** at [`index.html`](index.html).
- **3 LLM-facing reference docs**: `anti-patterns.md`, `diagrams.md`,
  `resume-writing.md` — consult before drafting.

## Quick start

```bash
# 1. Pick a template and copy it
cp .agents/skills/vpk-html/assets/templates/one-pager.html docs/html/my-doc.html

# 2. Open my-doc.html and replace every {{placeholder}} with real content.
#    CSS stays untouched — only edit the body.

# 3. Validate
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders docs/html/my-doc.html
node .agents/skills/vpk-html/scripts/build.mjs --verify docs/html/my-doc.html
```

## Invoking the skill

In Cursor / Claude Code, prefix your message with `/vpk-html`. Optional
doc-type hints can follow: `/vpk-html resume`, `/vpk-html one-pager`.

See [`CHEATSHEET.md`](CHEATSHEET.md) for the route table that maps user intent
to template file.

## Commands

```bash
node scripts/build.mjs                            # check every template
node scripts/build.mjs --check-placeholders <file>
node scripts/build.mjs --check-templates          # CSS / token / font sanity
node scripts/build.mjs --verify <file>            # Playwright render + load check

node scripts/check-html.mjs <file>                # static HTML validity
node scripts/ensure-fonts.mjs                     # fetch fonts to assets/fonts/

node scripts/port-templates.mjs                   # re-port templates from kami
node scripts/port-diagrams.mjs                    # re-port diagrams from kami
node scripts/port-demos.mjs                       # re-port kami's curated demos
node scripts/port-html-effectiveness.mjs          # regenerate Phase 2 engineering templates
node scripts/rescue-demos.mjs                     # regenerate the 4 vpk-native demos
node scripts/rescue-html-effectiveness-demos.mjs  # copy + restyle direct Phase 2 upstream demo ports
```

## Directory map

| Path | Purpose |
|---|---|
| `SKILL.md` | Agent-facing skill manifest (workflow + rules) |
| `CHEATSHEET.md` | Route table: user intent → template file |
| `README.md` | This file |
| `index.html` | Marketing landing page |
| `LICENSE`, `llms.txt`, `.gitignore`, `.claude-plugin/` | Top-level metadata |
| `assets/templates/` | 28 offline HTML templates: 8 base document shells + 20 Phase 2 engineering shells |
| `assets/diagrams/` | 14 standalone SVG diagram primitives |
| `assets/html-effectiveness/` | Snapshot of the 20 upstream html-effectiveness HTML demos plus index |
| `assets/demos/` | 28 demo outputs: 8 screenshot-backed showcases + 20 restyled html-effectiveness ports |
| `assets/fonts/` | Geist Sans, Geist Mono, Geist Pixel (inlined as base64 at port time) |
| `assets/images/` | Skill identity (logo) |
| `references/` | Anti-patterns, diagrams, resume-writing, writing, design, production, source-policy, accessibility, theme.css, tokens.json |
| `scripts/` | build (validator), check-html, port-*.mjs, rescue-demos (regenerate vpk demos), ensure-fonts |

## Rules of the road

- **No remote assets.** Every filled document is self-contained — all 3 fonts
  are inlined as base64 data URIs at port time. Move a filled file anywhere
  and it still renders identically.
- **CSS stays untouched.** Templates ship with their CSS locked. Only the
  body content changes per document.
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
| Surface | White paper + 24px grid | Warm parchment |
| Accent | Ink-blue `#1868db` | Ink-blue `#1B365D` (deeper) |
| Display | Geist Pixel · Square (pixel/terminal) | Charter / TsangerJinKai02 (serif) |
| Body | Geist Sans | Charter / TsangerJinKai02 |
| Render pipeline | Template edit (kami-style) | Template edit |
| Build toolchain | Node ESM | Python (WeasyPrint, python-pptx) |
| Output | Single offline HTML | HTML + PDF + optional PPTX + PNG |
| Templates | 28 (8 kami-ported base shells + 20 original Phase 2 engineering shells) | 8 |
| Diagrams | 14 SVG primitives (kami-ported) | 14 SVG primitives |
| Languages | EN | CN primary, EN, JA best-effort |

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
local vpk-html overlay: embedded Geist font declarations, blueprint/paper
tokens, source comments, a dark-token stub, and accessibility landmarks where
the upstream page omitted them.

## License

Inherits the VPK-Rovo monorepo license. The 8 base HTML templates and 14
diagram primitives in `assets/templates/` and `assets/diagrams/` are ported
from [tw93/kami](https://github.com/tw93/Kami) (MIT) and re-skinned with
vpk-html's visual identity; the layout structure and SVG geometry are kami's
work. The 20 Phase 2 engineering templates are original vpk-html shells based
on the `html-effectiveness` use-case catalog.

## Acknowledgements

- Kami by [@tw93](https://github.com/tw93) — template architecture, diagram
  primitives, demo curation, and the broader idea of constraint-based document
  design systems for AI agents.
- html-effectiveness by [@ThariqS](https://github.com/ThariqS) — engineering
  document use-case catalog that informed the Phase 2 template set.
- Geist, Geist Mono, and Geist Pixel by [Vercel](https://vercel.com/font) (SIL OFL).
