# vpk-html Cheatsheet

`/vpk-html` is required to trigger the skill. Optional doc-type hints may
follow, e.g. `/vpk-html resume`, `/vpk-html one-pager`.

## Documents

| User intent | Template |
|---|---|
| Executive summary / proposal / brief | `assets/templates/one-pager.html` |
| White paper / long-form report / chapter | `assets/templates/long-doc.html` |
| Memo / formal letter / cover letter | `assets/templates/letter.html` |
| Portfolio / case studies / work samples | `assets/templates/portfolio.html` |
| Resume / CV | `assets/templates/resume.html` |
| Slide deck / keynote | `assets/templates/slides.html` |
| Investment memo / valuation / equity research | `assets/templates/equity-report.html` |
| Release notes / changelog | `assets/templates/changelog.html` |

## Diagrams (embed inside the templates above)

| Data shape / intent | Diagram |
|---|---|
| Components + connections in a system | `assets/diagrams/architecture.html` |
| Process with decision branches | `assets/diagrams/flowchart.html` |
| Cross-team or cross-role process | `assets/diagrams/swimlane.html` |
| Lifecycle / states + transitions | `assets/diagrams/state-machine.html` |
| Time-ordered events / milestones | `assets/diagrams/timeline.html` |
| Hierarchy / depth ≥ 2 | `assets/diagrams/tree.html` |
| Layered architecture / stack | `assets/diagrams/layer-stack.html` |
| 2×2 strategic positioning | `assets/diagrams/quadrant.html` |
| Set overlaps (2–3 groups) | `assets/diagrams/venn.html` |
| Category comparison, no time | `assets/diagrams/bar-chart.html` |
| Series across time | `assets/diagrams/line-chart.html` |
| Sums to ~100%, ≤ 6 items | `assets/diagrams/donut-chart.html` |
| OHLC / stock price history | `assets/diagrams/candlestick.html` |
| + and − bridge to a total | `assets/diagrams/waterfall.html` |

Read `references/diagrams.md` for the selection guide and focal rule.

## Workflow at a glance

```
1. Confirm /vpk-html invocation
2. Extract intent (purpose / audience / constraint / success)
3. Pick template from table above
4. Source + material pass (for branded / fact-heavy docs)
5. Distill raw content (if input is unstructured)
6. Layout note (≤80 words, transparent)
7. Copy template to working dir, fill placeholders
8. Build & verify:
   node scripts/build.mjs --check-placeholders <file>
   node scripts/build.mjs --verify <file>
```

## Filling a template

```bash
# Start a new document
cp .agents/skills/vpk-html/assets/templates/<doc>.html docs/html/<slug>.html

# Edit only the body; CSS stays untouched.
# Replace every {{placeholder}} with real content.

# Validate
node .agents/skills/vpk-html/scripts/build.mjs --check-placeholders docs/html/<slug>.html
node .agents/skills/vpk-html/scripts/build.mjs --verify docs/html/<slug>.html
```

## Embedding a diagram

1. Open `.agents/skills/vpk-html/assets/diagrams/<type>.html`.
2. Copy the `<svg>…</svg>` block.
3. Paste inside a `<figure>` element in your filled template:

```html
<figure class="diagram">
  <svg viewBox="0 0 960 460" xmlns="http://www.w3.org/2000/svg">
    <!-- pasted SVG content; replace {{System name}} etc. -->
  </svg>
  <figcaption>One ink-blue node marks the focal component.</figcaption>
</figure>
```

## Identity

Editorial / engineering manual — closest neighbour: [makingsoftware.com](https://www.makingsoftware.com/).

- Surface: parchment `#FBFBFB` (never pure `#ffffff`)
- Ink: `#0A0A0A` body, `#757575` secondary
- Brand: ink-blue `#1B3FE5` (masthead, links; ≤5% per page)
- Margin tag: warning red `#D14E3E` (figure tags + gutter labels only)
- Display: Geist Pixel (Square) on masthead in `#1B3FE5`
- Body: Source Serif 4 → Georgia → system serif fallback; 16px screen / 10.5pt print, line-height 1.7
- Margin labels / eyebrows / figure tags: Geist Pixel + Geist Mono, 10px, uppercase, 0.18em letter-spacing
- Mono / code: Geist Mono
- Frames: none — no borders, no shadows, no rounded corners on sections
- Drop cap: serif, 48px, on first paragraph after section break
- Dotted divider: `<hr>` styled as radial-gradient row of 1px dots
- Type scale (screen): body 16px / h2 18px / h3-h4 16px / h5-h6 14px — hierarchy via weight + family + position, not size
- `long-doc.html` only: `.spread` primitive for two-column prose-left + figure-right with vertical `.gutter-tag`

**Side stripes are banned** — no colored `border-left/right` > 1px on cards, callouts, or lists.

## Reference reading order

1. `references/anti-patterns.md` (before drafting any document)
2. `references/writing.md` (for prose rules)
3. Template-specific: `references/resume-writing.md` for resumes,
   `references/diagrams.md` for diagrams
4. `references/design.md` (only if touching CSS)
5. `references/production.md` (only when troubleshooting)
