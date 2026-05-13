---
name: design-md
description: >
  Portable, token-first manifest for making anything look like it belongs at Atlassian —
  product UI, slides, charts, dashboards, onboarding screens, or marketing surfaces.
  Primary artifacts: DESIGN.md (light theme, `theme: light` in YAML) and DESIGN.dark.md (dark theme,
  `theme: dark`) — same body shape and rules, different color hex anchors. Either file is a
  self-contained spec (YAML + canonical DESIGN.md-shaped sections plus Atlassian extensions) that can
  be pasted into any LLM context. Use whenever a user asks to "make it look Atlassian," "match the
  Atlassian brand," review design taste, polish UI, design a slide/chart/dashboard,
  produce a brand-fit review, or generate artwork intended for an Atlassian audience.
  Also use when the user pastes or references DESIGN.md or DESIGN.dark.md. Complements the
  **atlassian-design-system** skill (token catalog and component APIs) by encoding design opinions and taste on top.
labels:
  - design-system
  - front-end
metadata:
  maintainer: khall2
  version: 0.0.3
---

# design-md

The portable manifests are **[`./DESIGN.md`](./DESIGN.md)** (light) and **[`./DESIGN.dark.md`](./DESIGN.dark.md)** (dark). They share the same prose, tables, and rules; YAML front matter sets `theme: light` vs `theme: dark` and carries the matching hex catalog. Default to **`DESIGN.md`** when the target surface is light or unspecified; read **`DESIGN.dark.md`** when the artifact is explicitly dark mode (dark slides, dashboards, screenshots, email on dark canvas, etc.).

## Which skill

- **React (or similar) with ADS packages, theming, and a proper runtime** → **atlassian-design-system** skill.
- **Raw HTML, images, slides, decks, email, PDFs, static exports, or no ADS packages** → this skill and **`DESIGN.md`** (light) or **`DESIGN.dark.md`** (dark).

## When to use

- The user asks to design, build, review, or polish anything intended to look like Atlassian — product UI, slides, charts, dashboards, onboarding moments, marketing snippets, or brand-adjacent artwork.
- The user pastes or references `DESIGN.md`, `DESIGN.dark.md`, or the getdesign.md / Google Stitch DESIGN.md ecosystem.
- The user asks "does this look right," wants a brand-fit review, or asks for UI taste feedback.
- The agent is about to produce visual output and has no specific style guidance yet.

## How to use

**Read the manifest that matches the target theme:** [`./DESIGN.md`](./DESIGN.md) for light, [`./DESIGN.dark.md`](./DESIGN.dark.md) for dark. Each file is self-contained for producing Atlassian-aligned output: token names, hex anchors for that theme, typography, spacing, components (with and without ADS), voice, and accessibility. **MUST NOT** mix light- and dark-catalog hex in the same artifact — pick one file (one `theme:`) per deliverable.

You may link either file from other skills, paste into contexts without this skill infrastructure, or drop into a repo as standalone specs. When teaching holistically, you may mention both paths so the user knows dark mode has a first-class twin file.

## Relationship to the **atlassian-design-system** skill

Use **atlassian-design-system** for full token catalogs, component APIs, MCP lookups, ESLint rules, and i18n mechanics. Use **this skill + the right manifest** for taste: which tokens and patterns to choose, theme-specific hex anchors when there is no runtime, and how to mimic ADS in plain HTML or static media. Load both when you need APIs _and_ holistic design judgment.

## Optional: heuristic lint

`.agents/skills/vpk-html/design-md/scripts/lint-design-heuristics.ts` is a pattern-based check against the design-md rules (same heuristics for any asset). **Default** — token and style drift (hex, spacing, shadows, title case) for any file. **Validate code** — add stricter checks for real app source (raw HTML elements, non-ADS styling imports). Use when the repo has or is moving toward ADS components. Run it against generated HTML/CSS or against `DESIGN.md` / `DESIGN.dark.md` when validating edits to the manifests.

```bash
# Default: design drift (no component library assumed)
npx tsx .agents/skills/vpk-html/design-md/scripts/lint-design-heuristics.ts <file>

# Same linter applies to the dark manifest
npx tsx .agents/skills/vpk-html/design-md/scripts/lint-design-heuristics.ts .agents/skills/vpk-html/design-md/DESIGN.dark.md

# Validate code: includes checks for typical React / Atlaskit-style source (alias: --ads)
npx tsx .agents/skills/vpk-html/design-md/scripts/lint-design-heuristics.ts --validate-code <file>
```

More detail (scope guardrails for contributors): [`../README.md`](../README.md).
