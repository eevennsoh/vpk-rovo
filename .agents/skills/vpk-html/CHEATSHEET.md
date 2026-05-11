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

## Engineering templates (Phase 2)

These original shells map the document patterns from
`ThariqS/html-effectiveness` into the same offline template-edit workflow.

| User intent | Template |
|---|---|
| Compare technical implementation approaches | `assets/templates/exploration-code-approaches.html` |
| Compare UI / visual design directions | `assets/templates/exploration-visual-designs.html` |
| Pull request review findings | `assets/templates/code-review-pr.html` |
| Explain a code path or module | `assets/templates/code-understanding.html` |
| Design system / token contract | `assets/templates/design-system.html` |
| Component variant matrix | `assets/templates/component-variants.html` |
| Motion / animation prototype spec | `assets/templates/prototype-animation.html` |
| Interaction prototype spec | `assets/templates/prototype-interaction.html` |
| Engineering slide deck plan | `assets/templates/slide-deck.html` |
| SVG / technical illustration brief | `assets/templates/svg-illustrations.html` |
| Engineering status report | `assets/templates/status-report.html` |
| Incident report / postmortem | `assets/templates/incident-report.html` |
| Flowchart / process diagram plan | `assets/templates/flowchart-diagram.html` |
| Feature explainer / capability research | `assets/templates/research-feature-explainer.html` |
| Concept explainer / technical research note | `assets/templates/research-concept-explainer.html` |
| Implementation plan / rollout plan | `assets/templates/implementation-plan.html` |
| Pull request writeup | `assets/templates/pr-writeup.html` |
| Static triage board snapshot | `assets/templates/editor-triage-board.html` |
| Feature flag matrix / rollout controls | `assets/templates/editor-feature-flags.html` |
| Prompt tuning / prompt eval worksheet | `assets/templates/editor-prompt-tuner.html` |

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

Editorial / engineering manual — implementation cousin: [aiengineeringfromscratch.com](https://aiengineeringfromscratch.com/) (built in the [makingsoftware.com](https://www.makingsoftware.com/) lineage).

**Light (default):** parchment `#fafaf5`, ink `#0A0A0A`, blueprint `#3553ff`, raised `#f3f1e8`.
**Dark** (`<html data-theme="dark">`): paper `#0a0d1a`, ink `#e8e6dc`, blueprint `#6b8eff`, raised `#131830`.

- Fonts (Geist family only): **Geist Pixel** for all headings, masthead, margin labels, figure tags; **Geist Sans** body 18px / line-height 1.62; **Geist Mono** code
- All headings: uppercase, letter-spaced, in `var(--brand)`
- Body bg: warm paper + subtle dotted texture via `radial-gradient(var(--paper-rule) 1px, transparent 1px); background-size: 16px 16px;`
- Type scale: cover-title 56px / h1 36px / h2 26px / h3 18px / h4-h6 14px / body+p 18px / fig-label 10px
- Hard shadows opt-in: add `.card / .callout / .takeaway / .surface-raised / .shadow-hard` for `box-shadow: 3px 3px 0 var(--near-black)` + 1px ink border
- ASCII rule: `<hr class="ascii">` for bright blueprint dotted separator
- Dotted divider: `<hr>` styled via radial-gradient row of 1px dots
- `long-doc.html` only: `.spread` two-column primitive (prose left ~42%, figure right ~58%) with vertical `.gutter-tag` for FIG_NN labels

**Bans:** no `border-left/right > 1px` colored side stripes; no `#ffffff` or `#000000` literals — use `var(--parchment)` / `var(--near-black)`.

**Activate dark mode in any rendered doc:**
```js
document.documentElement.setAttribute('data-theme', 'dark');
```

## Reference reading order

1. `references/anti-patterns.md` (before drafting any document)
2. `references/writing.md` (for prose rules)
3. Template-specific: `references/resume-writing.md` for resumes,
   `references/diagrams.md` for diagrams
4. `references/design.md` (only if touching CSS)
5. `references/production.md` (only when troubleshooting)
