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

- **8 document templates** at `assets/templates/`: one-pager, long-doc, letter,
  portfolio, resume, slides, equity-report, changelog. Each is a complete
  standalone HTML file with inline CSS and fonts.
- **14 SVG diagram primitives** at `assets/diagrams/` — architecture, flowchart,
  swimlane, tree, waterfall, candlestick, and friends. Extract the `<svg>` block
  and embed inside any long-form template.
- **8 curated demos** at `assets/demos/`:
  - 4 ported from kami: Tesla equity report, Musk resume, Kaku portfolio, agent slides.
  - 4 vpk-native: Postgres migration (long-doc), RAG explainer (long-doc),
    Q2 status (one-pager), auth incident post-mortem (long-doc).
- **A marketing landing page** at [`index.html`](index.html).
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
node scripts/rescue-demos.mjs                     # regenerate the 4 vpk-native demos
```

## Directory map

| Path | Purpose |
|---|---|
| `SKILL.md` | Agent-facing skill manifest (workflow + rules) |
| `CHEATSHEET.md` | Route table: user intent → template file |
| `README.md` | This file |
| `index.html` | Marketing landing page |
| `LICENSE`, `llms.txt`, `.gitignore`, `.claude-plugin/` | Top-level metadata |
| `assets/templates/` | The 8 kami-architected HTML templates (one per doc type) |
| `assets/diagrams/` | 14 standalone SVG diagram primitives |
| `assets/demos/` | 8 curated showcase outputs (4 kami-ported + 4 vpk-native) |
| `assets/fonts/` | Geist Sans, Geist Mono, Geist Pixel (inlined as base64 at port time) |
| `assets/images/` | Skill identity (logo) |
| `references/` | Anti-patterns, diagrams, resume-writing, writing, design, production, source-policy, accessibility, theme.css, tokens.json |
| `scripts/` | build (validator), check-html, port-*.mjs (re-port from kami), rescue-demos (regenerate vpk demos), ensure-fonts |

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

vpk-html adopted kami's template-edit architecture (Phase 1, May 2026). The
visual identity diverges; the workflow does not.

| | vpk-html | kami |
|---|---|---|
| Surface | White paper + 24px grid | Warm parchment |
| Accent | Ink-blue `#1868db` | Ink-blue `#1B365D` (deeper) |
| Display | Geist Pixel · Square (pixel/terminal) | Charter / TsangerJinKai02 (serif) |
| Body | Geist Sans | Charter / TsangerJinKai02 |
| Render pipeline | Template edit (kami-style) | Template edit |
| Build toolchain | Node ESM | Python (WeasyPrint, python-pptx) |
| Output | Single offline HTML | HTML + PDF + optional PPTX + PNG |
| Templates | 8 (kami-ported) | 8 |
| Diagrams | 14 SVG primitives (kami-ported) | 14 SVG primitives |
| Languages | EN | CN primary, EN, JA best-effort |

A future Phase 2 will port engineering-focused templates from
[ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness)
into this same template-edit shell.

## License

Inherits the VPK-Rovo monorepo license. The 8 HTML templates and 14 diagram
primitives in `assets/templates/` and `assets/diagrams/` are ported from
[tw93/kami](https://github.com/tw93/Kami) (MIT) and re-skinned with vpk-html's
visual identity; the layout structure and SVG geometry are kami's work.

## Acknowledgements

- Kami by [@tw93](https://github.com/tw93) — template architecture, diagram
  primitives, demo curation, and the broader idea of constraint-based document
  design systems for AI agents.
- Geist, Geist Mono, and Geist Pixel by [Vercel](https://vercel.com/font) (SIL OFL).
