# DESIGN — Making Software (reference extract)

> Design language extracted from [makingsoftware.com](https://www.makingsoftware.com/) (Dan Hollick), captured 2026-05-11.
> Not the VPK project DESIGN.md — this is a reference document for inspiration / comparison.

## Register

**Brand.** Long-form editorial. The design *is* the product: this is a reference manual about how software is made, and the page treats itself as a printed engineering book translated to the screen. Anti-references: SaaS documentation themes, Medium-style blog templates, dark-mode developer portals.

One-sentence scene: *an engineer reading a technical manual at a desk, daylight, paper feel, occasional pencil-margin annotations.*

## Color

### Strategy

**Restrained + one electric accent.** Two neutrals (paper + ink) carry 95%+ of the surface. A single high-chroma blue carries the masthead, links, and technical diagrams. A muted-tone version of the ink handles secondary text. Nothing else.

### Tokens

| Role | Value | Hex (approx) | Where it shows |
|---|---|---|---|
| `paper` | `oklch(0.985 0.002 90)` | `#FBFBFB` | Page background — warm off-white, never `#fff` |
| `ink` | `oklch(0.18 0.01 90)` | `#0A0A0A` | Body text, headings, rules — never pure `#000` in spirit (rendered as `rgb(0,0,0)` on site, but treat as warm-tinted near-black in derivatives) |
| `ink-muted` | `oklab(0 0 0 / 0.5)` | n/a | Margin labels, secondary metadata, captions — 50% ink |
| `accent-blue` | `oklch(0.5058 0.2886 264.84)` | `#1B3FE5` | Masthead "MAKING SOFTWARE", links, diagram strokes, fills in exploded illustrations |
| `accent-warning` | `oklch(0.62 0.21 25)` | `#D14E3E` | Figure-number margin tags (`FIG. 0X1`, `1.3" FLOPPY DISK`) |

### Color rules

- Background is **always** `paper`. No sectional color blocks, no banded backgrounds.
- `accent-blue` covers an estimated 4–6% of any viewport. It is *never* used for prose emphasis (bold/italic do that). It marks: brand identity, interactive affordances, and engineering diagrams.
- `accent-warning` is reserved for figure callouts and margin annotations only. It is not used for errors, warnings, or destructive states because there are no application states — this is a publication.
- Chroma at 0.289 is deliberately past the "safe" zone. It is permissible only because it appears in small areas against a near-neutral field.

## Typography

### Strategy

**Family contrast + weight contrast as the entire hierarchy.** This is the design's most distinctive decision: type *size* almost never changes. h1 and body paragraphs are both rendered at 16px. Hierarchy is carried by:

1. **Font family** — Departure Mono (pixel mono) vs Arizona (serif) signals "label" vs "prose"
2. **Weight** — 400 vs 500/600/700 within the same size
3. **Position** — margin-set labels vs body-column prose
4. **Color** — accent-blue masthead vs ink prose vs ink-muted captions

### Fonts

| Token | Family | License source | Used for |
|---|---|---|---|
| `font-display` | **Departure Mono** | Helena Zhang (free, commercial OK) | Masthead, figure labels, small-caps section markers |
| `font-body` | **Arizona** (Sans/Serif/Flare/Mix) | Dinamo (commercial) | All prose, all headings, all UI text |
| `font-fallback` | `ui-sans-serif, system-ui` | system | Last-resort fallback only |

Body face on the live site is the **serif** cut of Arizona. If Arizona is not licensable, the nearest open substitutes in order of fidelity: *EB Garamond* (the site's declared CSS fallback), *Source Serif 4*, *Spectral*. The fallback choice matters — Arizona has a wide aperture and modern construction, so do not substitute Garamond's tighter historical letterforms without expecting a different mood.

### Type scale

Just four sizes. This is the scale; do not add more.

| Token | Size | Line height | Weight | Used for |
|---|---|---|---|---|
| `text-xs` | `10px` | `14px` | 400–500 | Figure tags, micro-captions |
| `text-sm` | `12px` | `18px` | 400–500 | Margin annotations, footnotes |
| `text-base` | `14px` | `22px` | 400 | Secondary prose, captions |
| `text-md` | `16px` | `28.8px` (1.8) | 400 | **Body prose, all headings, masthead** |

The 1.8 line-height on body is generous — it gives the paper-like rhythm. Do not tighten below 1.65 on body prose.

### Typographic ornaments

- **Drop cap** on first paragraph of each section: serif majuscule, ink color, occupies 2–3 lines of body text.
- **Margin figure labels**: Departure Mono, `text-xs`, `accent-warning`, rotated 90° or set in left/right margins (e.g. `FIG. 0X1`, `1.3" FLOPPY DISK`, `WRITE PROTECT TAB`).
- **Dotted rules**: a row of small filled circles spans full content width to separate masthead from body. Implement as `border-image` or repeated `radial-gradient`, not a solid line.

## Layout

### Grid

- **Max width**: `1536px` (the site's main element max-width). Practical reading column rarely exceeds `680px`.
- **Default padding**: `40px` horizontal at desktop.
- **Two-column body**: prose left, technical illustration right. Columns are **not equal width** — prose column is narrower (`~40–45%`), illustration column is wider (`~55–60%`). This is unusual; most editorial layouts equal-weight columns. The asymmetry signals that the illustration *is* the argument, not the decoration.
- **Margin annotations**: a thin left/right gutter (~`24–32px`) holds figure labels and section markers, often rotated 90° to read like a book's running head.

### Spacing rhythm

Vary it. Big gaps between sections (`128px+`), tight gaps within (`8–16px`), generous gap around the masthead. No fixed 4/8/12/16 stepper — let editorial intent set the gap.

### What this layout refuses

- No cards. Anywhere.
- No shadows. Anywhere.
- No rounded corners. Anywhere.
- No section background colors.
- No sidebar navigation. The table of contents is in the document flow.

## Motion

The live page reads as nearly static. Motion is reserved for *diagrams* — exploded-view technical illustrations animate on scroll-into-view (e.g. floppy disk parts fly apart) using physics that feel mechanical, not playful.

| Token | Curve | Duration | Used for |
|---|---|---|---|
| `motion-instant` | `linear` | `120ms` | Link hover color change |
| `motion-diagram` | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) | `600–900ms` | Diagram assembly/disassembly on scroll |

Bans inherited from the design's tone: no bounce, no elastic, no spring overshoot. Mechanical parts do not bounce. Page transitions do not exist (this is a single document).

`prefers-reduced-motion: reduce` → all diagram animations resolve to their final state with no transition.

## Components & patterns

Not a component library — a page composition system. Patterns:

### Masthead
Full-width row, paper background, `accent-blue` mono wordmark left-aligned, single line of `font-body` `text-md` right-aligned giving the subtitle and authorship. Underneath: a dotted rule full-width.

### Body column
Prose set in `font-body` (serif), `text-md`, justified or near-justified, `1.8` line-height. First paragraph after a section break gets a drop cap. Bold uses weight 600 sparingly; italic uses the serif italic and is the preferred emphasis.

### Margin figure tag
`font-display` (Departure Mono), `text-xs`, `accent-warning`, often rotated `-90deg` and set in the page's outer gutter. Format: `FIG. 0X1` / `1.3" FLOPPY DISK` / a single descriptive noun phrase in caps.

### Technical diagram
Line-art on `paper`. Strokes in `accent-blue`. Fills in `accent-blue` at low alpha or as solid where emphatic. Always exploded or sectional — never a flat product render. Labels are leader lines from the diagram out to `accent-warning` margin tags.

### Inline link
`accent-blue`, no underline by default, underline on hover (`text-decoration-thickness: 1px`, `text-underline-offset: 3px`). The masthead blue and the link blue are the *same* blue — that's the visual claim that "the brand is the affordance."

## Voice & copy

- **Plainspoken technical.** Opens with "Have you ever wondered how a touch screen knows you are touching it?" — second person, concrete physical question, no jargon to start. Then it gets dense with terminology without apologizing.
- **Confident first sentences.** No softening qualifiers ("maybe", "you might think"). The site's subtitle is six words: *"A reference manual for people who design and build software."*
- **Em dashes** are absent — this design uses commas and full stops. Match this constraint.
- **Authorship is signed.** "Written and illustrated by Dan Hollick." appears at the top, in body weight. Authorship is part of the design, not buried in a footer.
- No marketing copy. No CTAs. No "Get started." The artifact is the offer.

## The slop test

Could someone look at this and say "AI made that"?

- First-order check (category reflex): "long-form software writing → dark mode with monospace code blocks and emerald accents." This design refuses both. Cream paper, serif body, electric blue accent. Passes.
- Second-order check (anti-reflex trap): "writing about software that's not dark-mode → cream-and-serif editorial blog template." This design escapes by collapsing the type scale to four sizes and treating diagrams as the primary argument. Passes.

## Things to take, things to leave

If adapting this language to a different project, the **transferable** decisions are:

- Single accent color used sparingly, at high chroma, against tinted neutrals
- Family-and-weight hierarchy instead of size hierarchy (carefully — this only works for content-dense surfaces)
- Margin annotations as a structural element, not decoration
- True paper-feel background (`L ~0.985`, never pure white)
- The em-dash ban
- The no-cards/no-shadows/no-rounded ban

The decisions **not** to copy without thought:

- 16px h1 — only works because every section is short and the diagrams carry hierarchy. In a navigation-heavy app, you still need scale.
- Two-column asymmetric layout — only works for prose-plus-illustration documents.
- Departure Mono masthead — extremely strong identity choice that will read as pastiche if borrowed directly. Pick a different display face or commission one.
