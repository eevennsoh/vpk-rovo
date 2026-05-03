---
name: VPK-rovo
description: Shared visual contract for Venn Prototype Kit surfaces.
colors:
  surface: "var(--ds-surface)"
  surface-raised: "var(--ds-surface-raised)"
  surface-overlay: "var(--ds-surface-overlay)"
  surface-sunken: "var(--ds-surface-sunken)"
  text: "var(--ds-text)"
  text-subtle: "var(--ds-text-subtle)"
  text-subtlest: "var(--ds-text-subtlest)"
  text-inverse: "var(--ds-text-inverse)"
  brand-bold: "var(--ds-background-brand-bold)"
  brand-bold-hovered: "var(--ds-background-brand-bold-hovered)"
  brand-bold-pressed: "var(--ds-background-brand-bold-pressed)"
  neutral-subtle: "var(--ds-background-neutral-subtle)"
  neutral-subtle-hovered: "var(--ds-background-neutral-subtle-hovered)"
  border: "var(--ds-border)"
  border-bold: "var(--ds-border-bold)"
  border-focused: "var(--ds-border-focused)"
  danger: "var(--ds-background-danger)"
  warning: "var(--ds-background-warning)"
  success: "var(--ds-background-success)"
  discovery: "var(--ds-background-discovery)"
  information: "var(--ds-background-information)"
typography:
  display:
    fontFamily: "var(--ds-font-family-body)"
    fontWeight: "var(--ds-font-weight-semibold)"
    lineHeight: "var(--ds-font-lineHeight-100)"
  body:
    fontFamily: "var(--ds-font-family-body)"
    fontSize: "var(--ds-font-size-100)"
    fontWeight: "var(--ds-font-weight-regular)"
    lineHeight: "var(--ds-font-lineHeight-200)"
  label:
    fontFamily: "var(--ds-font-family-body)"
    fontSize: "var(--ds-font-size-075)"
    fontWeight: "var(--ds-font-weight-medium)"
  code:
    fontFamily: "var(--ds-font-family-code)"
rounded:
  xs: "var(--ds-radius-xsmall)"
  sm: "var(--ds-radius-small)"
  md: "var(--ds-radius-medium)"
  lg: "var(--ds-radius-large)"
  xl: "var(--ds-radius-xlarge)"
  tile: "var(--ds-radius-tile, 25%)"
spacing:
  xs: "var(--ds-space-050)"
  sm: "var(--ds-space-100)"
  md: "var(--ds-space-200)"
  lg: "var(--ds-space-300)"
  xl: "var(--ds-space-400)"
components:
  button-primary:
    backgroundColor: "{colors.brand-bold}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-subtle}"
    rounded: "{rounded.md}"
    height: "32px"
    padding: "0 12px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "var(--ds-background-input)"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    height: "32px"
    padding: "4px 10px"
---

# Design System: VPK-rovo

This root `DESIGN.md` defines shared toolkit constraints for VPK-rovo. It is
not a single product identity. Product and art surfaces can add a more specific
`DESIGN.md` under `components/projects/<name>/` or `components/arts/<name>/`;
the nearest nested file owns that surface's visual direction while this root
file continues to define the common implementation contract.

## 1. Overview

VPK-rovo is a prototyping toolkit for product surfaces, agent workflows, and
visual experiments. The shared design system must stay useful across quiet
operational tools and expressive art demos, so the root posture is restrained,
semantic, and theme-aware. It provides a stable baseline rather than a fixed
brand personality.

The canonical runtime stack is `@atlaskit/tokens`, `app/tailwind-theme.css`,
and `app/shadcn-theme.css`. Agents and contributors must prefer Tailwind
classes that map to ADS semantic tokens, then decorative Tailwind accent
classes, and only then raw `token()` or `var(--ds-...)` values for dynamic
values or unmapped edge cases.

The root contract optimizes for prototypes that feel deliberate on first load:
dense enough for repeated work, legible enough for review, and flexible enough
for each nested project or art piece to carry its own atmosphere.

**Key characteristics:**

- Semantic token use before raw color values.
- Compact controls, clear focus states, and explicit disabled states.
- Flat or lightly raised surfaces, with overlay elevation reserved for real
  layering.
- Atlassian product familiarity without copying one product's full chrome.
- Nested project and art identities take priority for mood, palette emphasis,
  and visual storytelling.

## 2. Colors

VPK-rovo colors resolve through ADS CSS variables and Tailwind semantic aliases.
Do not treat the light-mode hex comments in CSS as the source of truth because
theme mode and ADS token resolution can change the final values.

### Primary

- **Brand Bold** (`bg-primary`, `var(--ds-background-brand-bold)`): Use for
  primary actions, selected affordances, and user-originated chat surfaces.
  Keep it rare enough that it remains an action signal.
- **Selected State** (`bg-bg-selected`, `text-text-selected`,
  `border-border-selected`): Use for pressed, expanded, selected, or active
  controls when the state needs to persist.

### Neutral

- **Surface** (`bg-surface`, `bg-background`): Use for page and app-shell
  backgrounds.
- **Raised Surface** (`bg-surface-raised`, `bg-card`): Use for cards, panels,
  and repeated items that need local grouping.
- **Overlay Surface** (`bg-surface-overlay`, `bg-popover`): Use for popovers,
  menus, floating panels, and dialogs.
- **Sunken Surface** (`bg-surface-sunken`): Use for recessed containers,
  preview wells, and scrollable regions that sit behind the main surface.
- **Text Stack** (`text-text`, `text-text-subtle`,
  `text-text-subtlest`): Use the full text stack for hierarchy before adding
  decorative color.
- **Border Stack** (`border-border`, `border-border-bold`,
  `ring-ring`): Use borders and rings for structure, focus, and state before
  adding shadows.

### Status and accent

- **Danger, warning, success, discovery, and information** use the
  `bg-bg-*`, `text-text-*`, `text-icon-*`, and `border-border-*` semantic
  families. Match status color to meaning; do not use status colors only for
  decoration.
- **Decorative accents** can use the mapped Tailwind hue scale, such as
  `bg-blue-400`, `text-purple-500`, or `bg-teal-50`, because those classes
  still resolve through ADS-compatible theme variables.
- **Icon tiles** use the mapped variant set: gray, blue, teal, green, lime,
  yellow, orange, red, magenta, and purple. Use the bold variants only when
  the tile needs to carry strong categorization.

### Named rules

**The semantic-first rule.** Start with classes such as `bg-surface-raised`,
`text-text-subtle`, and `border-border-bold`. Raw `var(--ds-...)` values are
escape hatches, not the normal authoring path.

**The nested identity rule.** A project or art-specific `DESIGN.md` may define
its own color character, but it must still resolve through the shared token
system unless the surface is intentionally experimental.

## 3. Typography

**Display font:** Atlassian Sans through `var(--ds-font-family-body)`.
**Body font:** Atlassian Sans through `var(--ds-font-family-body)`.
**Code font:** Atlassian Mono through `var(--ds-font-family-code)`.

Typography should feel functional and composed. Use ADS font shorthand tokens
for headings when a semantic heading token exists, and use Tailwind utility
classes for ordinary size, weight, and color. Avoid viewport-scaled type for
fixed tool surfaces because it makes compact controls unpredictable.

### Hierarchy

- **Display:** Use sparingly for true page or prototype introductions. Prefer
  ADS heading tokens, not arbitrary oversized type.
- **Headline:** Use for page titles, route-level headings, and major panels.
- **Title:** Use for card titles, inspector headings, modal headings, and
  focused work areas.
- **Body:** Use for readable interface text. Keep long-form body copy around
  65 to 75 characters per line.
- **Label:** Use for controls, metadata, compact headers, and badges. Keep
  labels direct and avoid repeated explanatory copy.
- **Code:** Use for identifiers, commands, file paths, model names, and
  generated snippets.

### Named rules

**The container-fit rule.** Text must fit inside its parent at mobile and
desktop sizes. If a label cannot fit, change layout or wrapping before shrinking
the interface into an unreadable state.

**The no-display-in-panels rule.** Compact panels, cards, sidebars, and
dashboards use tighter type. Hero-scale typography belongs only to true hero or
showcase surfaces.

## 4. Elevation

VPK-rovo uses tonal layering first and shadow second. A surface should usually
communicate hierarchy through semantic background, border, spacing, and state.
Use shadow when a layer genuinely floats above another layer or needs a hover
or overlay affordance.

### Shadow vocabulary

- **Raised** (`shadow-sm`, `shadow-md`,
  `var(--ds-shadow-raised)`): Use for cards and small panels that need gentle
  separation.
- **Overflow** (`shadow-lg`, `var(--ds-shadow-overflow)`): Use for content
  that scrolls or visually breaks out of its container.
- **Overlay** (`shadow-xl`, `shadow-2xl`,
  `var(--ds-shadow-overlay)`): Use for dialogs, popovers, command surfaces,
  and floating controls.

### Named rules

**The no-fake-depth rule.** Do not add shadow to make a bland layout feel more
designed. Fix hierarchy, spacing, and content grouping first.

**The overlay-only rule.** Popovers, menus, dialogs, and floating toolbars can
use overlay elevation. Inline sections and ordinary page bands should usually
remain unframed.

## 5. Components

Shared components should feel compact, predictable, and stateful. Product and
art surfaces can style their own composition, but they should reuse these
component expectations unless a nested design file says otherwise.

### Buttons

- **Shape:** Default buttons use `rounded-md` and a 32px height. Small and icon
  variants stay on the same radius family.
- **Primary:** Use `bg-primary`, `text-primary-foreground`,
  `hover:bg-primary-hovered`, and pressed or expanded selected-state classes.
- **Secondary and outline:** Use neutral subtle backgrounds, semantic borders,
  and `text-text-subtle` rather than inventing low-contrast custom palettes.
- **Ghost:** Use transparent rest state with neutral subtle hover and active
  backgrounds.
- **Focus:** Preserve `focus-visible:border-ring` and
  `focus-visible:ring-ring/50` behavior.
- **Icons:** Use Atlaskit icons first, icon-lab icons second, and product logos
  from `@/components/ui/logo`.

### Cards and containers

- **Shape:** Cards use `rounded-xl` in shared primitives. Repeated cards should
  not nest inside other cards.
- **Background:** Use `bg-card` or `bg-surface-raised` for framed content. Use
  full-width bands or unframed layouts for page sections.
- **Padding:** Shared card padding starts at 16px, with compact variants at
  12px.
- **Shadow:** Use `shadow-sm` only when a card needs separation. Prefer borders
  or tonal surfaces for dense operational layouts.

### Inputs and fields

- **Shape:** Inputs use `rounded-lg`, 32px height, and compact horizontal
  padding.
- **Default:** Use semantic input background and border classes, not raw
  background colors.
- **Subtle:** Subtle inputs can reveal border and background on hover or focus.
- **Focus:** Preserve focused border and ring styles. Do not remove focus rings
  for visual quietness.
- **Disabled and read-only:** Disabled controls reduce opacity and block
  pointer interaction. Read-only controls should stay calm and non-interactive.

### Navigation

- **Style:** Navigation should be scannable before decorative. Use clear active
  states, compact gaps, and semantic text colors.
- **Sidebars:** Use sidebar token aliases in shared sidebar primitives. Override
  motion easing with shared duration and easing tokens when needed.
- **Route surfaces:** `app/` files are entrypoints. The durable visual design
  ownership usually lives in `components/projects/*`, `components/arts/*`,
  `components/blocks/*`, `components/ui/*`, or `components/website/*`.

### Motion and interaction

- **Duration:** Use `duration-fast`, `duration-normal`, `duration-medium`,
  `duration-slow`, `duration-slower`, and `duration-slowest`.
- **Easing:** Use `ease-out` for entry and hover feedback, `ease-in` for exit,
  and `ease-in-out` for panels that move together.
- **Animated properties:** Animate opacity and transforms before layout
  properties. Avoid motion that changes layout in ways that break scanning.

### Signature surfaces

Product surfaces under `components/projects/*` should default to a quiet,
work-focused register. Art surfaces under `components/arts/*` can be more
expressive, but each art surface should own that expression in its nested
component folder rather than leaking those choices into shared primitives.

## 6. Do's and Don'ts

### Do:

- **Do** read the nearest nested `DESIGN.md` before editing a project or art
  surface. If none exists, use this root file and the existing code around the
  target surface.
- **Do** use semantic Tailwind classes before raw CSS variables:
  `bg-surface-raised`, `text-text-subtle`, `border-border-bold`,
  `bg-bg-neutral`, and related classes.
- **Do** keep controls compact, stateful, keyboard-accessible, and visibly
  focused.
- **Do** use `next/image` with explicit `width` and `height` for images.
- **Do** keep page sections unframed unless the content is an actual repeated
  item, modal, preview, tool, or overlay.
- **Do** map Figma values to ADS spacing, radius, typography, shadow, and
  semantic color tokens during implementation.
- **Do** let nested projects and art pieces carry their own mood while keeping
  the shared implementation contract intact.

### Don't:

- **Don't** create one global product personality for VPK-rovo. The root is a
  toolkit baseline, not a product brand.
- **Don't** introduce new `bg-[var(--ds-...)]`, `text-[var(--ds-...)]`, or
  arbitrary token utilities when a semantic class already exists.
- **Don't** use cards as the default answer for every section, and don't nest
  cards inside cards.
- **Don't** use decorative side-stripe borders, gradient text, generic
  glassmorphism, or repeated identical icon-heading-text card grids.
- **Don't** use hardcoded duration values such as `duration-200` when a shared
  motion token class exists.
- **Don't** hide focus rings, remove disabled states, or rely on color alone to
  communicate state.
- **Don't** let one art surface's palette, shader, or motion language become a
  shared primitive unless it is intentionally extracted into the toolkit.
