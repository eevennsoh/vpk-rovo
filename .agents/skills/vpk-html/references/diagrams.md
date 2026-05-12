# Diagrams

vpk-html ships 14 standalone SVG diagram primitives at `assets/diagrams/*.html`,
ported from [tw93/kami](https://github.com/tw93/Kami) and restyled with the
vpk-html identity (semantic white paper, blueprint accent, and flat technical rules).

## How to use a diagram

Each diagram file is a complete standalone HTML page with an inline `<svg>`.
To embed a diagram in a long-doc, portfolio, design-system, or other rich
template:

1. Open `assets/diagrams/<type>.html`.
2. Copy the `<svg>` block (everything from `<svg viewBox=…>` through `</svg>`).
3. Pass it into a payload section via `section.trustedHtml`:

```json
{
	"type": "figure",
	"heading": "Production architecture",
	"trustedHtml": "<figure><svg …>…</svg><figcaption>One blueprint node marks the focal component.</figcaption></figure>"
}
```

Replace placeholder text inside the SVG (e.g., `{{System name}}`,
`{{Cat A}}`, `{{Chart Title}}`) with real values before embedding.

> **Quality bar:** before drawing, ask *would a well-written paragraph teach
> the reader less than this diagram?* If no, skip the diagram. The diagram has
> to earn its space.

## Selection guide — by data shape

Data that needs visualization usually matches one of these shapes. First match
wins.

| Data shape | Diagram |
|---|---|
| Open / high / low / close fields, or per-day price | `candlestick` |
| `+` and `−` contributions summing to a total (bridge, P&L) | `waterfall` |
| One series, values sum to ~100%, ≤ 6 items | `donut-chart` |
| One series, values sum to ~100%, ≥ 7 items | `bar-chart` (horizontal) |
| Two or more series across time (months, quarters, years) | `line-chart` |
| One series across time, large count changes (not rate) | `bar-chart` |
| Multiple categories, same snapshot, 2+ series | `bar-chart` (grouped) |
| 2×2 strategic or priority positioning | `quadrant` |
| Hierarchical data with depth ≥ 2 | `tree` |
| Process with decision branches | `flowchart` |
| Cross-team or cross-role process with ≥ 3 actors | `swimlane` |
| Lifecycle with named states + transitions | `state-machine` |
| Time-ordered events with milestones | `timeline` |
| Set overlaps or shared attributes between 2–3 groups | `venn` |
| Layered architecture (OSI, stack, tier) | `layer-stack` |
| Components + connections in a system (one focal) | `architecture` |
| Category comparison, single series, no time axis | `bar-chart` |

When data fits multiple types, prefer the one that shows variance most clearly.

## Selection guide — by intent

If the data shape is ambiguous, pick by what the reader should learn.

| Reader should learn… | Diagram |
|---|---|
| "What talks to what" | `architecture` |
| "What happens in what order" | `flowchart`, `timeline` |
| "Who owns each step" | `swimlane` |
| "How the parts nest" | `tree`, `layer-stack` |
| "What overlaps with what" | `venn` |
| "What's bigger / smaller / changing" | `bar-chart`, `line-chart`, `waterfall` |
| "What's in each quadrant of a 2×2" | `quadrant` |
| "What state are we in, and how do we move" | `state-machine` |
| "How does this break down into parts of a whole" | `donut-chart` |
| "How did this price move over time" | `candlestick` |

## The focal rule

Every diagram has *one* blueprint element. That's the component, state, or value
the reader should look at first. Everything else stays in cool neutrals. If you
catch yourself coloring more than one node blueprint, pick the most important
and demote the rest.

This single rule is why the accent actually means something. A page with five
blueprint boxes is decoration; a page with one is direction.

## Token map (inside the diagrams)

The ported SVGs use vpk-html's palette directly:

| Role | Token |
|---|---|
| Paper / SVG background | `--paper` |
| Ink (default text, hard borders, primary stroke) | `--ink` |
| Muted text, secondary strokes, default arrow heads | `--muted-text` / `--subtlest-text` |
| Accent / focal node fill | `--blueprint-tint` |
| Accent / focal node stroke + primary arrow | `--blueprint` |
| Cool gray surface variants | `--surface-sunken`, `--rule`, `--rule-strong` |
| Faint grid dot pattern | `--paper-rule` |
| Error / regression | `--danger` |

Display headlines above each diagram use **Geist Pixel** (Square variant).
Labels inside the SVG use **Geist Mono**. The caption below uses **Geist Sans**.

## Anti-patterns to avoid

When generating or selecting a diagram, watch for these failure modes:

| Anti-pattern | Symptom | Fix |
|---|---|---|
| **Two accents** | More than one blueprint node | Demote all but one to neutral |
| **Decorative chart** | Pie or donut with 8+ slices | Switch to horizontal bar |
| **Mystery axis** | Y-axis without units, X-axis without time anchor | Label both, or remove the chart |
| **Bidirectional arrows everywhere** | Every node connected both ways | Pick a primary direction; the diagram is a story, not a map |
| **Overlapping nodes** | Visual overlap means semantic overlap is unclear | Move nodes apart; if you can't, the diagram is too dense — split it |
| **Caption restates the title** | Caption is "Architecture diagram of the system" | Caption should state the *insight*, not the data range |

## Regenerating diagrams

The ported diagrams are committed. If you want to refresh from kami's source
(e.g., kami released a new diagram type), run:

```bash
node .agents/skills/vpk-html/scripts/port-diagrams.mjs
```

The port script preserves SVG geometry verbatim and rewrites only the chrome
(fonts, colors, borders, background) to match vpk-html's identity.
